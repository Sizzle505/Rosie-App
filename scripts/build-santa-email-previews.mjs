import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderSecretSantaEmail } from "../api/_lib/secretSantaMail.js";

const directory = "public/randomizers/secret-santa/email";
await mkdir(directory, { recursive: true });
const fakeUrl = "https://rosie-app-git.vercel.app/#randomizers?guest=" +
  "00000000-0000-4000-8000-000000000000." +
  "00000000-0000-4000-8000-000000000001." + "0".repeat(64);
const sample = {
  exchange: { title: "Rosie's Secret Santa 2026" },
  guest: { name: "Alex", email: "alex@example.com" },
  url: fakeUrl
};

for (const [kind, filename] of [
  ["registration", "preview-registration.html"],
  ["draw", "preview-draw.html"]
]) {
  const { html } = renderSecretSantaEmail({ ...sample, kind });
  const notice = '<div style="position:relative;z-index:9;background:#7a3047;color:#fff4e1;' +
    'padding:12px 14px;text-align:center;font:700 12px Arial,Helvetica,sans-serif">' +
    'DESIGN PREVIEW ONLY — EXAMPLE NAME AND LINK — NOTHING IS SENT</div>';
  const preview = html.replace(/(<body\b[^>]*>)/i, "$1" + notice);
  await writeFile(join(directory, filename), preview, "utf8");
  console.log("Created Secret Santa email preview:", filename);
}
