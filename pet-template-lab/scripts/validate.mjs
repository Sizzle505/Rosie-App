#!/usr/bin/env node
// Read-only asset catalog and private package checks. No network or writes.
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve, join, extname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const lab = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(lab, "..");
const args = process.argv.slice(2);
const packAt = args.indexOf("--pack"), strict = args.includes("--strict");
const catalog = JSON.parse(await readFile(join(lab, "asset-catalog.json"), "utf8"));
const errors = [];
const fail = message => errors.push(message);
const safe = p => typeof p === "string" && p.length > 0 && !isAbsolute(p) &&
  !p.startsWith("/") && !p.includes("\\") &&
  p.split("/").every(part => part && part !== "." && part !== "..");
const fileStat = async p => { try { return await stat(p); } catch { return null; } };
const slots = catalog.pages.flatMap(page => page.slots);
if (catalog.version !== 1) fail("Unsupported catalog version");
if (!catalog.excludes.includes("captain") || !catalog.excludes.includes("card-vault")) fail("Required exclusions missing");
const ids = new Set(), targets = new Set();
for (const page of catalog.pages) {
  if (["captain","vault","yacht","tunnel","cosmic-odyssey"].includes(page.id)) fail("Forbidden page in catalog: "+page.id);
}
for (const slot of slots) {
  if (ids.has(slot.id)) fail("Duplicate ID: "+slot.id);
  if (targets.has(slot.target)) fail("Duplicate target: "+slot.target);
  ids.add(slot.id); targets.add(slot.target);
  if (!safe(slot.source) || !safe(slot.target)) { fail("Unsafe catalog path: "+slot.id); continue; }
  const original = resolve(repo,slot.source);
  const entry = await fileStat(original);
  if (!entry?.isFile() || entry.size === 0) fail("Source asset missing: "+slot.source);
}
if (packAt >= 0) {
  const folderInput = args[packAt+1];
  if (!folderInput || folderInput.startsWith("--")) fail("Missing directory after --pack");
  else {
    const folder = resolve(folderInput);
    try {
      const p = JSON.parse(await readFile(join(folder,"profile.json"),"utf8"));
      if (p.schemaVersion !== 1 || p.pet?.species !== "dog") fail("Expected v1 dog profile");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.pet?.id || "")) fail("Invalid pet ID");
      if (typeof p.pet?.name !== "string" || !p.pet.name.trim()) fail("Pet name required");
      if (p.features?.captain !== false || p.features?.cardVault !== false) fail("Captain and Card Vault must be disabled");
      if (p.assetBase !== "assets") fail("Profile assetBase must be assets");
    } catch (e) { fail("Cannot read profile: "+e.message); }
    for (const slot of slots.filter(x => strict || x.required)) {
      if (!safe(slot.target)) continue;
      const file = join(folder, "assets", slot.target);
      const entry = await fileStat(file);
      if (!entry?.isFile() || entry.size < 20) { fail("Missing/empty asset: "+slot.target); continue; }
      const data = await readFile(file);
      const ext = extname(file).toLowerCase();
      const valid = ext === ".webp" ? data.toString("ascii",0,4) === "RIFF" && data.toString("ascii",8,12) === "WEBP" :
        ext === ".png" ? data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
        [".jpg",".jpeg"].includes(ext) ? data[0] === 255 && data[1] === 216 :
        ext === ".svg" ? /<svg[\s>]/.test(data.toString("utf8")) : false;
      if (!valid) fail("Invalid image signature: "+slot.target);
    }
  }
} else if (args.some(arg=>arg!=="--catalog")) fail("Usage: --catalog | --pack <private-dir> [--strict]");
const output={mode:packAt >= 0 ? "pack" : "catalog",pages:catalog.pages.length,
  candidates:slots.length,essential:slots.filter(x=>x.required).length,optional:slots.filter(x=>!x.required).length,
  passed:errors.length===0,errors};
process.stdout.write(JSON.stringify(output,null,2)+"\n");
if (errors.length) process.exitCode=1;
