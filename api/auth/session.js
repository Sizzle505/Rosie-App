import { getSession, sessionCookie, respond, only, handleError } from "../_lib/core.js";
export default async function handler(req, res) {
  if (!only(req, res, "GET")) return;
  try {
    const current = await getSession(req, { renew: true });
    if (!current) return respond(res, 200, { user: null });
    if (current.refreshed) res.setHeader("Set-Cookie", sessionCookie(current.token));
    return respond(res, 200, { user: current.user });
  } catch (error) { return handleError(res, error); }
}
