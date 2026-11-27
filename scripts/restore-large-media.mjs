import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import manifest from './large-media-manifest.json' with { type: 'json' };
for (const { output, sha256, parts } of manifest) {
  let data;
  try { data = await readFile(output); } catch { /* source checkout stores verified parts */ }
  if (!data) data = Buffer.concat(await Promise.all(parts.map(path => readFile(path))));
  const actual = createHash('sha256').update(data).digest('hex');
  if (actual !== sha256) throw new Error(`Media integrity mismatch: ${output}`);
  await writeFile(output, data);
}
