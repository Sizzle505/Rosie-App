import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { db, respond, readBody, sha256, unsafeAllowed } from "./_lib/core.js";
import { drawSecretSanta } from "./_lib/secretSantaDraw.js";

const TABLE = "rosie_santa_exchanges";
const FIELDS = "id,organizer_hash,title,budget,exchange_date,participants,exclusions,assignments,status,created_at,updated_at,drawn_at";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SECRET = /^[0-9a-f]{64}$/i;

class UserError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (message, status = 400) => { throw new UserError(status, message); };

function cleanName(value) {
  if (typeof value !== "string") bad("Enter a valid guest name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 60 || /[<>\x00-\x1f]/.test(name)) bad("Guest names must be 1 to 60 characters.");
  return name;
}
function validDate(value) {
  if (!value) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    bad("Enter a valid exchange date.");
  const parsed = new Date(value + "T00:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    bad("Enter a valid exchange date.");
  return value;
}
function cleanEmail(value) {
  if (typeof value !== "string" || value.length > 254) bad("Enter a valid email address (up to 254 characters).");
  const email = value.trim();
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
    bad("Enter a valid email address.");
  return email;
}
function validateNames(names) {
  if (!Array.isArray(names) || names.length < 3 || names.length > 40)
    bad("Add 3 to 40 participants.");
  const result = names.map(cleanName);
  if (new Set(result.map(name => name.toLocaleLowerCase("en-US"))).size !== result.length)
    bad("Each participant needs a distinct name.");
  return result;
}
function view(row) {
  return {
    id: row.id, title: row.title,
    status: row.status, drawnAt: row.drawn_at,
    participants: row.participants.map(({ id, name, email }) => ({ id, name, email: email || "" })),
    exclusions: row.exclusions
  };
}
function inviteToken(row, guestId) {
  // Derive a stable, unguessable guest capability from the server-only organizer
  // hash. This lets an organizer recover invitation links on another device
  // without storing any plaintext secret in the database.
  return createHmac("sha256", Buffer.from(row.organizer_hash, "hex"))
    .update(row.id + ":" + guestId).digest("hex");
}
function invites(row) {
  return row.participants.map(({ id, name }) => ({ id, name, token: inviteToken(row, id) }));
}
async function findRow(id) {
  if (typeof id !== "string" || !UUID.test(id)) bad("Exchange not found.", 404);
  const rows = await db(TABLE + "?select=" + FIELDS + "&id=eq." + id + "&limit=1");
  if (!rows.length) bad("Exchange not found.", 404);
  return rows[0];
}
async function host(input) {
  const row = await findRow(input.exchangeId);
  if (typeof input.hostToken !== "string" || !SECRET.test(input.hostToken) ||
      sha256(input.hostToken) !== row.organizer_hash) bad("Organizer access denied.", 403);
  return row;
}
async function guest(input) {
  const row = await findRow(input.exchangeId);
  const person = row.participants.find(entry => entry.id === input.guestId);
  if (!person || typeof input.guestToken !== "string" || !SECRET.test(input.guestToken))
    bad("This invitation is invalid.", 403);
  const expected = Buffer.from(inviteToken(row, person.id), "hex");
  const actual = Buffer.from(input.guestToken, "hex");
  if (!timingSafeEqual(expected, actual)) bad("This invitation is invalid.", 403);
  return { row, person };
}
async function patchDraft(row, changes) {
  const records = await db(TABLE + "?id=eq." + row.id + "&status=eq.draft&select=id", {
    method: "PATCH", body: { ...changes, updated_at: new Date().toISOString() }
  });
  if (!records.length) bad("This exchange has already been drawn. It cannot be edited.", 409);
  return await findRow(row.id);
}
function checkExclusions(pairs, participants) {
  if (!Array.isArray(pairs) || pairs.length > 800) bad("Too many exclusions.");
  const ids = new Set(participants.map(item => item.id));
  const seen = new Set();
  return pairs.map(pair => {
    if (!pair || !ids.has(pair.giver) || !ids.has(pair.recipient) ||
        pair.giver === pair.recipient) bad("Choose two different invited guests for each exclusion.");
    const key = pair.giver + ":" + pair.recipient;
    if (seen.has(key)) bad("This exclusion is already listed.");
    seen.add(key);
    return { giver: pair.giver, recipient: pair.recipient };
  });
}
export default async function handler(req, res) {
  if (req.method !== "POST") return respond(res, 405, { error: "Method not allowed." }, { Allow: "POST" });
  if (!unsafeAllowed(req, res)) return;
  try {
    const input = readBody(req);
    switch (input.action) {
      case "create": {
        if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 100)
          bad("Give the exchange a name (up to 100 characters).");
        const names = validateNames(input.names);
        const hostToken = randomBytes(32).toString("hex");
        const saved = await db(TABLE + "?select=" + FIELDS, {
          method: "POST",
          body: {
            organizer_hash: sha256(hostToken),
            title: input.title.trim(),
            participants: names.map(name => ({ id: randomUUID(), name }))
          }
        });
        return respond(res, 201, { exchange: view(saved[0]), hostToken, invitations: invites(saved[0]) });
      }
      case "dashboard": {
        const row = await host(input);
        return respond(res, 200, { exchange: view(row), invitations: invites(row) });
      }
      case "add": {
        const row = await host(input);
        if (row.status !== "draft") bad("The draw is locked.", 409);
        if (row.participants.length >= 40) bad("An exchange can have up to 40 guests.");
        const name = cleanName(input.name);
        if (row.participants.some(p => p.name.toLowerCase() === name.toLowerCase()))
          bad("That guest is already in the exchange.");
        const next = await patchDraft(row, { participants: [...row.participants, { id: randomUUID(), name }] });
        return respond(res, 200, { exchange: view(next), invitations: invites(next) });
      }
      case "remove": {
        const row = await host(input);
        if (row.status !== "draft") bad("The draw is locked.", 409);
        if (row.participants.length <= 3) bad("At least three guests are required.");
        if (!row.participants.some(p => p.id === input.guestId)) bad("Guest not found.", 404);
        const next = await patchDraft(row, {
          participants: row.participants.filter(p => p.id !== input.guestId),
          exclusions: row.exclusions.filter(p => p.giver !== input.guestId && p.recipient !== input.guestId)
        });
        return respond(res, 200, { exchange: view(next), invitations: invites(next) });
      }
      case "emails": {
        const row = await host(input);
        if (row.status !== "draft") bad("Guest emails can only be edited before the draw.", 409);
        if (!Array.isArray(input.updates) || input.updates.length < 1 || input.updates.length > 40)
          bad("Select at least one guest email to save.");
        const ids = new Set(row.participants.map(person => person.id));
        const updates = new Map();
        for (const item of input.updates) {
          if (!item || !ids.has(item.id) || updates.has(item.id))
            bad("Invalid or duplicate guest email entry.");
          updates.set(item.id, cleanEmail(item.email));
        }
        const next = await patchDraft(row, {
          participants: row.participants.map(person =>
            updates.has(person.id) ? { ...person, email: updates.get(person.id) } : person
          )
        });
        return respond(res, 200, { exchange: view(next), invitations: invites(next) });
      }
      case "rules": {
        const row = await host(input);
        if (row.status !== "draft") bad("The draw is locked.", 409);
        const next = await patchDraft(row, { exclusions: checkExclusions(input.exclusions, row.participants) });
        return respond(res, 200, { exchange: view(next), invitations: invites(next) });
      }
      case "draw": {
        const row = await host(input);
        if (row.status !== "draft") bad("Names have already been drawn.", 409);
        const mapping = drawSecretSanta(row.participants.map(p => p.id), row.exclusions);
        if (!mapping) bad("Those exclusions make a valid draw impossible. Remove some restrictions and try again.", 422);
        // One conditional database update atomically locks the draw and its
        // entire assignment set. Two simultaneous draws cannot overwrite each other.
        const changed = await db(TABLE + "?id=eq." + row.id + "&status=eq.draft&select=id", {
          method: "PATCH", body: {
            assignments: mapping, status: "drawn", drawn_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        if (!changed.length) bad("Another draw already completed. Refresh the exchange.", 409);
        const next = await findRow(row.id);
        return respond(res, 200, { exchange: view(next), invitations: invites(next) });
      }
      case "guest":
      case "reveal": {
        const { row, person } = await guest(input);
        const data = {
          exchange: { title: row.title, status: row.status },
          guest: { id: person.id, name: person.name }
        };
        if (input.action === "reveal" && row.status === "drawn") {
          const recipientId = row.assignments[person.id];
          const recipient = row.participants.find(p => p.id === recipientId);
          if (!recipient) throw new Error("Missing assignment in locked exchange.");
          data.recipient = { name: recipient.name };
        }
        return respond(res, 200, data);
      }
      default: bad("Unknown Secret Santa action.");
    }
  } catch (error) {
    if (error instanceof UserError) return respond(res, error.status, { error: error.message });
    if (error?.message === "Invalid request.") return respond(res, 400, { error: "Invalid request." });
    console.error("Secret Santa operation failed:", error?.message);
    return respond(res, 503, { error: "Rosie cannot reach the private exchange ledger right now." });
  }
}
