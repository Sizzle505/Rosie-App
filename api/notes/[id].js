import { db, requireUser, respond, unsafeAllowed, readBody, handleError } from "../_lib/core.js";
const columns = "id,title,body,created_at,updated_at";
export default async function handler(req, res) {
  if (!["PATCH", "DELETE"].includes(req.method)) return respond(res, 405, { error: "Method not allowed." }, { Allow: "PATCH, DELETE" });
  if (!unsafeAllowed(req, res)) return;
  try {
    const session = await requireUser(req, res);
    if (!session) return;
    const id = String(req.query?.id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
      return respond(res, 404, { error: "Note not found." });
    // Always filter by authenticated owner: a valid UUID belonging to another user is invisible.
    const filter = `id=eq.${id}&owner_id=eq.${session.user.id}`;
    if (req.method === "DELETE") {
      const deleted = await db(`rosie_notes?${filter}&select=id`, { method: "DELETE" });
      return deleted.length ? respond(res, 200, { ok: true }) : respond(res, 404, { error: "Note not found." });
    }
    const input = readBody(req);
    const patch = {};
    if (Object.hasOwn(input, "title")) patch.title = input.title;
    if (Object.hasOwn(input, "body")) patch.body = input.body;
    if (!Object.keys(patch).length || Object.entries(patch).some(([key, value]) =>
      typeof value !== "string" || value.length > (key === "title" ? 140 : 20000)))
      return respond(res, 400, { error: "Invalid note contents." });
    const updated = await db(`rosie_notes?${filter}&select=${columns}`, { method: "PATCH", body: patch });
    return updated.length ? respond(res, 200, { note: updated[0] }) : respond(res, 404, { error: "Note not found." });
  } catch (error) { return handleError(res, error); }
}
