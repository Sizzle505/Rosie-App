/**
 * Builds installable RosieVerse icons from the approved illustrated portrait.
 * The palette-compressed artwork is kept in tracked text segments because
 * the connected GitHub editor does not accept binary image uploads.
 * All five PNG outputs are generated at build time without dependencies.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync, deflateSync } from 'node:zlib';

const project = resolve(fileURLToPath(new URL('../', import.meta.url)));
const base = resolve(project, 'scripts');
const b64 = ['icon-data.part1.txt', 'icon-data.part2.txt']
  .map(name => readFileSync(resolve(base, name), 'utf8').trim()).join('');
const source = Buffer.from(b64, 'base64');
const size = source.readUInt16LE(0);
const paletteCount = source[2];
const palette = source.subarray(3, 3 + paletteCount * 3);
const pixels = inflateSync(source.subarray(3 + paletteCount * 3));
if (size !== 128 || paletteCount !== 32 || pixels.length !== size * size) {
  throw new Error('Invalid RosieVerse icon artwork payload');
}
function sample(x, y) {
  const ix = Math.max(0, Math.min(size - 1, x));
  const iy = Math.max(0, Math.min(size - 1, y));
  const idx = pixels[iy * size + ix] * 3;
  return [palette[idx], palette[idx + 1], palette[idx + 2]];
}
function colorAt(x, y, outSize, padded) {
  const scale = padded ? 0.74 : 1;
  const u = ((x + 0.5) / outSize - (1 - scale) / 2) / scale;
  const v = ((y + 0.5) / outSize - (1 - scale) / 2) / scale;
  if (u < 0 || u > 1 || v < 0 || v > 1) return [13, 8, 26];
  const fx = Math.min(size - 1, Math.max(0, u * size - 0.5));
  const fy = Math.min(size - 1, Math.max(0, v * size - 0.5));
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(size - 1, x0 + 1), y1 = Math.min(size - 1, y0 + 1);
  const tx = fx - x0, ty = fy - y0;
  const a = sample(x0, y0), b = sample(x1, y0);
  const c = sample(x0, y1), d = sample(x1, y1);
  return [0, 1, 2].map(k => Math.round(
    a[k] * (1 - tx) * (1 - ty) + b[k] * tx * (1 - ty) +
    c[k] * (1 - tx) * ty + d[k] * tx * ty
  ));
}
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function chunk(type, data) {
  const tag = Buffer.from(type, 'ascii');
  const result = Buffer.allocUnsafe(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  tag.copy(result, 4);
  data.copy(result, 8);
  let crc = 0xffffffff;
  for (const byte of result.subarray(4, data.length + 8)) {
    crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  }
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, data.length + 8);
  return result;
}
function makePng(outSize, padded = false) {
  const raw = Buffer.alloc(outSize * (outSize * 4 + 1));
  for (let y = 0; y < outSize; y++) {
    const offset = y * (outSize * 4 + 1);
    raw[offset] = 0;
    for (let x = 0; x < outSize; x++) {
      const rgb = colorAt(x, y, outSize, padded);
      const pixel = offset + 1 + x * 4;
      raw[pixel] = rgb[0]; raw[pixel + 1] = rgb[1]; raw[pixel + 2] = rgb[2]; raw[pixel + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(outSize, 0); ihdr.writeUInt32BE(outSize, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}
const dest = resolve(project, 'public', 'icons');
mkdirSync(dest, { recursive: true });
for (const s of [32, 180, 192, 512]) {
  writeFileSync(resolve(dest, 'rosieverse-' + s + '.png'), makePng(s));
}
writeFileSync(resolve(dest, 'rosieverse-maskable-512.png'), makePng(512, true));
console.log('Generated RosieVerse app icons: 32, 180, 192, 512, maskable 512.');
