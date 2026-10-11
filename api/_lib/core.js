import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export const COOKIE = "rosie_session";
export const DAYS = 30;
const COOKIE_AGE = 60 * 60 * 24 * DAYS;
const DB_URL = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const DB_KEY = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
export async function hashPin(pin) {
  if (!/^(?:[0-9]{4}|[0-9]{6})$/.test(pin)) throw new Error("PIN must have four or six digits.");
  const salt = randomBytes(24).toString("hex");
  const hash = (await scrypt(pin, Buffer.from(salt, "hex"), 64)).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export async function verifyPin(pin, encoded) {
  const parts = String(encoded || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  const expected = Buffer.from(parts[2], "hex");
  const actual = await scrypt(pin, Buffer.from(parts[1], "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
export async function db(path, { method = "GET", body, returnRows = true } = {}) {
  if (!DB_URL() || !DB_KEY()) throw new Error("Database has not been configured.");
  const key = DB_KEY();
  const response = await fetch(DB_URL() + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: key,
      // New sb_secret keys are API keys, not JWTs. Legacy service_role JWTs also use Authorization.
      ...(key.startsWith("sb_secret_") ? {} : { Authorization: "Bearer " + key }),
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Prefer: returnRows ? "return=representation" : "return=minimal" } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  if (!response.ok) {
    // Never relay PostgREST internals or configuration to the browser.
    console.error("Rosie database request rejected", response.status, path.split("?")[0]);
    throw new Error("The RosieVerse database is temporarily unavailable.");
  }
  if (response.status === 204) return [];
  const raw = await response.text();
  return raw ? JSON.parse(raw) : [];
}
export function respond(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(payload));
}
export function only(req, res, method) {
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  respond(res, 405, { error: "Method not allowed." });
  return false;
}
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser requests still require valid session cookie
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return new URL(origin).host === host && new URL(origin).protocol === (process.env.VERCEL ? "https:" : new URL(origin).protocol);
  } catch { return false; }
}
export function unsafeAllowed(req, res) {
  if (sameOrigin(req)) return true;
  respond(res, 403, { error: "Origin not allowed." });
  return false;
}
export function readBody(req) {
  const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (!input || typeof input !== "object" || Array.isArray(input) || JSON.stringify(input).length > 45000)
    throw new Error("Invalid request.");
  return input;
}
export function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map(item => {
    const index = item.indexOf("=");
    return index < 0 ? [] : [item.slice(0, index).trim(), item.slice(index + 1).trim()];
  }).filter(pair => pair.length === 2));
}
export function sessionCookie(token, maxAge = COOKIE_AGE) {
  // Secure on Vercel HTTPS; localhost HTTP remains usable for development.
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
export function userView(row) { return { id: row.id, username: row.username, displayName: row.display_name }; }
export async function getSession(req, { renew = false } = {}) {
  const token = cookies(req)[COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const matches = await db(`rosie_sessions?select=id,user_id,expires_at,revoked_at&token_hash=eq.${sha256(token)}&limit=1`);
  const session = matches[0];
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const rows = await db(`rosie_users?select=id,username,display_name,is_active&id=eq.${session.user_id}&limit=1`);
  const user = rows[0];
  if (!user?.is_active) return null;
  let refreshed = false;
  if (renew && new Date(session.expires_at).getTime() - Date.now() < 7 * 86400000) {
    await db(`rosie_sessions?id=eq.${session.id}&revoked_at=is.null`, {
      method: "PATCH", body: { expires_at: new Date(Date.now() + COOKIE_AGE * 1000).toISOString() }, returnRows: false
    });
    refreshed = true;
  }
  return { user: userView(user), session, token, refreshed };
}
export async function requireUser(req, res) {
  const session = await getSession(req);
  if (!session) respond(res, 401, { error: "Please enter RosieVerse to access your private notes." });
  return session;
}
export function handleError(res, error) {
  if (error?.message === "Invalid request.") return respond(res, 400, { error: error.message });
  console.error("Rosie API error:", error?.message);
  return respond(res, 503, { error: "Rosie cannot reach the note ledger just now. Please try again." });
}
