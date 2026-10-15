import { db, requireUser, respond, unsafeAllowed, readBody, handleError } from "../_lib/core.js";
const columns = "id,title,body,created_at,updated_at";
export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return respond(res, 405, { error: "Method not allowed." }, { Allow: "GET, POST" });
  if (req.method === "POST" && !unsafeAllowed(req, res)) return;
  try {
    const session = await requireUser(req, res);
    if (!session) return;
    const owner = session.user.id;
    if (req.method === "GET") {
      const notes = await db(`rosie_notes?select=${columns}&owner_id=eq.${owner}&order=updated_at.desc&limit=250`);
      return respond(res, 200, { notes });
    }
    const { title = "", body = "" } = readBody(req);
    if (typeof title !== "string" || typeof body !== "string" || title.length > 140 || body.length > 20000)
      return respond(res, 400, { error: "Note exceeds the permitted length." });
    const notes = await db(`rosie_notes?select=${columns}`, {
      method: "POST", body: { owner_id: owner, title: title || "Untitled note", body }
    });
    return respond(res, 201, { note: notes[0] });
  } catch (error) { return handleError(res, error); }
}
