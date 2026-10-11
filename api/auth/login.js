import { randomBytes } from "node:crypto";
import { db, hashPin, verifyPin, sha256, respond, only, unsafeAllowed, readBody, sessionCookie, userView, handleError } from "../_lib/core.js";

export default async function handler(req, res) {
  if (!only(req, res, "POST") || !unsafeAllowed(req, res)) return;
  try {
    const { username: raw, pin } = readBody(req);
    const username = String(raw || "").trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username) || !/^[0-9]{4}([0-9]{2})?$/.test(String(pin || "")))
      return respond(res, 400, { error: "Enter a username and a four- or six-digit PIN." });
    // Persistent lightweight throttle. Account-specific lockouts remain effective even if IP changes.
    const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
    const rate = await db("rpc/rosie_rate_limit", { method: "POST", body: { p_key: sha256(ip + ":" + username) } });
    if (rate?.blocked) return respond(res, 429, { error: "Too many attempts. Please try again in 15 minutes.", retryAfter: 900 }, { "Retry-After": "900" });

    const rows = await db(`rosie_users?select=id,username,display_name,pin_hash,pin_length,failed_attempts,locked_until,is_active&username=eq.${encodeURIComponent(username)}&limit=1`);
    const user = rows[0];
    if (!user || !user.is_active) return respond(res, 401, { error: "That PIN doesn’t pass Rosie’s inspection." });
    const remaining = user.locked_until ? Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000) : 0;
    if (remaining > 0) return respond(res, 423, { error: "Rosie’s ledger is locked for a short break.", retryAfter: remaining }, { "Retry-After": String(remaining) });

    if (String(pin).length !== user.pin_length || !(await verifyPin(pin, user.pin_hash))) {
      const state = await db("rpc/rosie_pin_failure", { method: "POST", body: { p_user_id: user.id } });
      const until = state?.locked_until ? Math.ceil((new Date(state.locked_until).getTime() - Date.now()) / 1000) : 0;
      return until > 0
        ? respond(res, 423, { error: "Five incorrect attempts. Rosie has locked the ledger for 15 minutes.", retryAfter: until }, { "Retry-After": String(until) })
        : respond(res, 401, { error: "That PIN doesn’t pass Rosie’s inspection." });
    }
    const confirmed = await db("rpc/rosie_pin_success", { method: "POST", body: { p_user_id: user.id } });
    if (!confirmed) return respond(res, 423, { error: "This account is locked. Try again after the cooldown." });

    const token = randomBytes(32).toString("hex");
    await db("rosie_sessions", { method: "POST", returnRows: false,
      body: { user_id: user.id, token_hash: sha256(token), expires_at: new Date(Date.now() + 30 * 86400000).toISOString() } });
    res.setHeader("Set-Cookie", sessionCookie(token));
    return respond(res, 200, { user: userView(user), message: "Welcome back, " + user.display_name + "!" });
  } catch (error) { return handleError(res, error); }
}
