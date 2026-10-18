import { randomBytes } from "node:crypto";
import { db, hashPin, sha256, respond, only, unsafeAllowed, readBody, sessionCookie, userView, displayName, handleError } from "../_lib/core.js";

export default async function handler(req, res) {
  if (!only(req, res, "POST") || !unsafeAllowed(req, res)) return;
  try {
    const { username: raw, pin } = readBody(req);
    const chosenName = String(raw || "").trim();
    const username = chosenName.toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username) ||
      !/^[0-9]{4}([0-9]{2})?$/.test(String(pin || "")) ||
      chosenName.length > 80)
      return respond(res, 400, { error: "Choose a username and four- or six-digit PIN." });
    // Creation is deliberately simple, but server-side throttling and a small total-account cap
    // prevent a public hobby app from being turned into an unrestricted account factory.
    const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
    const rate = await db("rpc/rosie_rate_limit", { method: "POST", body: { p_key: sha256("signup:" + ip) } });
    if (rate?.blocked) return respond(res, 429, { error: "Too many account requests. Please try again later.", retryAfter: 900 }, { "Retry-After": "900" });
    const existing = await db("rosie_users?select=id&username=eq." + encodeURIComponent(username) + "&limit=1");
    if (existing.length) return respond(res, 409, { error: "That username is already taken." });
    const users = await db("rosie_users?select=id&limit=41");
    if (users.length >= 40) return respond(res, 403, { error: "Rosie's guest book is full. Please ask the host for help." });
    const newUsers = await db("rosie_users?select=id,username,display_name", {
      method: "POST", body: { username, display_name: displayName(chosenName), pin_hash: await hashPin(String(pin)), pin_length: String(pin).length }
    });
    const user = newUsers[0];
    if (!user) throw new Error("Account creation was not confirmed.");
    const token = randomBytes(32).toString("hex");
    await db("rosie_sessions", { method: "POST", returnRows: false,
      body: { user_id: user.id, token_hash: sha256(token), expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
    });
    res.setHeader("Set-Cookie", sessionCookie(token));
    return respond(res, 201, { user: userView(user) });
  } catch (error) { return handleError(res, error); }
}
