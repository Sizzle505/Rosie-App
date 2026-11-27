import { randomUUID } from "node:crypto";
import { db } from "./core.js";
import { mailConfigured, mailSender, privateGuestUrl, composeSecretSantaMail, sendGmailBatch } from "./secretSantaMail.js";

const TABLE = "rosie_santa_notifications";
const FIELDS = "exchange_id,guest_id,kind,recipient_email,status,claimed_at,claim_token,attempts,sent_at,updated_at";
const idFilter = (exchangeId, guestId, kind) =>
  "?exchange_id=eq." + exchangeId + "&guest_id=eq." + guestId + "&kind=eq." + kind;
const isRecent = date => date && Date.now() - new Date(date).getTime() < 5 * 60 * 1000;
const safeError = err => {
  const message = String(err?.message || "");
  const match = /Gmail SMTP rejected the operation \((\d{3})\)/.exec(message);
  return match ? "SMTP " + match[1] : "SMTP delivery failed";
};

export async function mailOverview(row) {
  const records = await db(TABLE + "?select=guest_id,kind,status,recipient_email,sent_at&exchange_id=eq." + row.id);
  const delivery = {};
  for (const record of records) {
    if (!delivery[record.guest_id]) delivery[record.guest_id] = {};
    delivery[record.guest_id][record.kind] = {
      status: record.status, sentAt: record.sent_at || null,
      email: record.recipient_email
    };
  }
  return { configured: mailConfigured(), sender: mailSender(), delivery };
}

async function reserve(row, guest, kind, force, brand) {
  const filter = idFilter(row.id, guest.id, kind);
  const found = await db(TABLE + filter + "&select=" + FIELDS + "&limit=1");
  let current = found[0];
  if (!current) {
    const saved = await db(TABLE + "?select=" + FIELDS, { method: "POST",
      body: { exchange_id: row.id, guest_id: guest.id, kind,
        recipient_email: guest.email, status: "pending" } });
    current = saved[0];
  }
  if (current.status === "sent" && !force && current.recipient_email.toLowerCase() === guest.email.toLowerCase())
    return null;
  if (current.status === "sending" && isRecent(current.claimed_at)) return null;
  // Recover a worker that stopped before finishing its SMTP transaction.
  if (current.status === "sending") {
    const unlocked = await db(TABLE + filter + "&status=eq.sending&claim_token=eq." +
      current.claim_token + "&select=" + FIELDS, { method: "PATCH",
      body: { status: "failed", claimed_at: null, claim_token: null } });
    if (!unlocked.length) return null;
    current = unlocked[0];
  }
  const claim = randomUUID();
  const claimed = await db(TABLE + filter + "&status=eq." + current.status + "&select=" + FIELDS, {
    method: "PATCH",
    body: { status: "sending", claim_token: claim, claimed_at: new Date().toISOString(),
      recipient_email: guest.email, attempts: Math.min(100, Number(current.attempts || 0) + 1),
      updated_at: new Date().toISOString(), last_error: null }
  });
  if (!claimed.length) return null;
  return { exchangeId: row.id, guestId: guest.id, kind, claim, guest,
    mail: composeSecretSantaMail({
      exchange: row, guest, kind, brand, url: privateGuestUrl(row.id, guest.id,
        // This capability derivation matches the existing guest invitation process.
        (await import("node:crypto")).createHmac("sha256", Buffer.from(row.organizer_hash, "hex"))
          .update(row.id + ":" + guest.id).digest("hex"), brand)
    }) };
}
async function finish(entry, ok, error) {
  await db(TABLE + idFilter(entry.exchangeId, entry.guestId, entry.kind) +
    "&claim_token=eq." + entry.claim + "&status=eq.sending&select=guest_id", {
    method: "PATCH", body: {
      status: ok ? "sent" : "failed",
      sent_at: ok ? new Date().toISOString() : null,
      last_error: ok ? null : safeError(error),
      updated_at: new Date().toISOString(),
      claim_token: null, claimed_at: null
    }
  });
}

export async function deliverNotifications(row, kind, { guestIds = null, force = false, brand = "rosie" } = {}) {
  const guests = row.participants.filter(p => (!guestIds || guestIds.includes(p.id)) && p.email);
  const summary = { configured: mailConfigured(), sender: mailSender(), eligible: guests.length,
    attempted: 0, sent: 0, failed: 0, skipped: 0 };
  if (!summary.configured || !guests.length) return summary;
  const claimed = [];
  for (const person of guests) {
    try {
      const entry = await reserve(row, person, kind, force, brand);
      if (entry) claimed.push(entry);
      else summary.skipped++;
    } catch (error) {
      // Duplicates and storage conflicts should not prevent other guests' invitations.
      console.error("Rosie could not queue a Secret Santa email", safeError(error));
      summary.failed++;
    }
  }
  summary.attempted = claimed.length;
  const finished = new Set();
  try {
    await sendGmailBatch(claimed, async (entry, ok, error) => {
      finished.add(entry.claim);
      if (ok) summary.sent++;
      else summary.failed++;
      try { await finish(entry, ok, error); }
      catch (err) { console.error("Rosie could not record Secret Santa mail status", safeError(err)); }
    });
  } catch (error) {
    console.error("Rosie Gmail batch failed", safeError(error));
  }
  for (const entry of claimed) {
    if (finished.has(entry.claim)) continue;
    summary.failed++;
    try { await finish(entry, false, new Error("SMTP delivery interrupted")); }
    catch (error) { console.error("Rosie could not record interrupted mail", safeError(error)); }
  }
  return summary;
}
