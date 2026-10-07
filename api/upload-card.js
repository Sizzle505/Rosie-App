import { put } from "@vercel/blob";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("Payload too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const name = String(req.query?.name || "");
  if (!/^rc-\d{3}\.avif$/.test(name)) return res.status(400).json({ error: "Invalid card name" });

  try {
    const body = await readBody(req);
    if (!body.length) return res.status(400).json({ error: "Empty body" });
    const blob = await put("rosie-cards/" + name, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/avif",
      cacheControlMaxAge: 31536000
    });
    return res.status(200).json({ name, url: blob.url });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Upload failed" });
  }
}
