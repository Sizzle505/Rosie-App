export const config = { api: { bodyParser: false } };

const ALLOWED = new Set([
  "rc-044.avif","rc-045.avif","rc-046.avif","rc-047.avif","rc-048.avif",
  "rc-049.avif","rc-050.avif","rc-051.avif","rc-052.avif","rc-053.avif",
  "rc-054.avif","rc-055.avif","rc-056.avif"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  if (!ALLOWED.has(name)) {
    return res.status(400).json({ error: "Invalid card asset name" });
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  if (!body.length || body.length > 5_000_000) {
    return res.status(400).json({ error: "Invalid asset payload" });
  }

  const response = await fetch(
    `https://blob.vercel-storage.com/rosie-card-vault/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "x-api-version": "7",
        "content-type": "image/avif",
      },
      body,
    }
  );

  const text = await response.text();
  if (!response.ok) {
    return res.status(response.status).json({ error: "Blob upload failed", detail: text });
  }

  let payload;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  return res.status(200).json(payload);
}
