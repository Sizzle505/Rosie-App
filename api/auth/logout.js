import { db, getSession, sessionCookie, respond, only, unsafeAllowed, handleError } from "../_lib/core.js";
export default async function handler(req, res) {
  if (!only(req, res, "POST") || !unsafeAllowed(req, res)) return;
  try {
    const current = await getSession(req);
    if (current) await db(`rosie_sessions?id=eq.${current.session.id}`, {
      method: "PATCH", body: { revoked_at: new Date().toISOString() }, returnRows: false
    });
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return respond(res, 200, { ok: true });
  } catch (error) { return handleError(res, error); }
}
