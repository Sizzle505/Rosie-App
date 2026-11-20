#!/usr/bin/env node
/** Read-only validation for the isolated dog customization catalog and private art packs. */
import { readFile, realpath, lstat, open } from 'node:fs/promises';
import { dirname, join, resolve, relative, sep, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const lab = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(lab, '..');
const args = process.argv.slice(2);
const packAt = args.indexOf('--pack');
const strict = args.includes('--strict');
const errors = [];
const fail = msg => errors.push(msg);
const inside = (child, parent) => { const rel = relative(parent, child); return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith('/')); };
const safe = value => typeof value === 'string' && value.length > 0 && !isAbsolute(value) && !value.startsWith('/') && !value.includes('\\') && value.split('/').every(x => x && x !== '.' && x !== '..');
const info = async path => { try { return await lstat(path); } catch { return null; } };
const contentHead = async file => { const fh=await open(file, 'r'); try { const data=Buffer.alloc(2048); const {bytesRead}=await fh.read(data,0,data.length,0); return data.subarray(0,bytesRead); } finally { await fh.close(); } };
const checkSignature = async file => {
  const ext = extname(file).toLowerCase(), b = await contentHead(file);
  if (ext === '.webp') return b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP';
  if (ext === '.png') return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (ext === '.jpg' || ext === '.jpeg') return b[0] === 255 && b[1] === 216;
  if (ext === '.svg') { const s=b.toString('utf8'); return /<svg[\s>]/.test(s) && !/<script|onload\s*=|javascript:/i.test(s); }
  return false;
};

const catalog = JSON.parse(await readFile(join(lab,'asset-catalog.json'), 'utf8'));
if (catalog.version !== 1 || !Array.isArray(catalog.pages)) fail('Unsupported catalog format');
if (!catalog.excludes?.includes('captain') || !catalog.excludes?.includes('card-vault')) fail('Excluded pages missing');
const slots = (catalog.pages || []).flatMap(page => page.slots || []);
const ids=new Set(), targets=new Set();
for (const page of catalog.pages || []) if (['captain','vault','yacht','tunnel','cosmic-odyssey'].includes(page.id)) fail('Forbidden page: '+page.id);
const repoReal = await realpath(repo);
for (const slot of slots) {
  if (ids.has(slot.id)) fail('Duplicate slot: '+slot.id); ids.add(slot.id);
  if (targets.has(slot.target)) fail('Duplicate target: '+slot.target); targets.add(slot.target);
  if (!safe(slot.source) || !safe(slot.target)) { fail('Unsafe path: '+slot.id); continue; }
  const source=resolve(repo,slot.source);
  if (!inside(source,repo)) {fail('Source escapes repository: '+slot.id);continue;}
  const original=await info(source);
  if (!original?.isFile() || original.isSymbolicLink() || original.size < 1) {fail('Missing or invalid source: '+slot.source);continue;}
  const realSource=await realpath(source);
  if (!inside(realSource,repoReal)) fail('Source symlink escapes repository: '+slot.source);
}
if (packAt >= 0) {
  const packArg=args[packAt+1];
  if (!packArg || packArg.startsWith('--')) fail('Missing directory after --pack');
  else {
    const pack=resolve(packArg);
    const packReal=await realpath(pack).catch(()=>null);
    if (!packReal || inside(pack,repo) || inside(packReal,repoReal) || (await info(pack))?.isSymbolicLink()) fail('Private pack must be a non-symlink directory outside Rosie-App');
    else {
      let p;
      try { p=JSON.parse(await readFile(join(pack,'profile.json'),'utf8')); } catch(e){ fail('Cannot read profile: '+e.message); }
      if (p) {
        if(p.schemaVersion!==1 || p.pet?.species!=='dog' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.pet?.id||'') || !p.pet?.name?.trim()) fail('Invalid dog profile');
        if (p.features?.captain!==false || p.features?.cardVault!==false) fail('Captain and Card Vault must be disabled');
        if (p.backend?.accounts!==false || p.backend?.cloudNotes!==false || p.backend?.secretSanta!==false || p.backend?.email!==false) fail('All backend services must be disabled');
        if (p.assetBase!=='assets') fail('Invalid asset base');
      }
      const base=resolve(pack,'assets');
      const realBase=await realpath(base).catch(()=>null);
      if (!realBase || !inside(realBase,packReal)) fail('Asset directory missing or outside private pack');
      else for (const slot of slots.filter(s => strict || s.required)) {
        if (!safe(slot.target)) continue;
        const file=resolve(base,slot.target), entry=await info(file);
        if (!inside(file,base) || !entry?.isFile() || entry.isSymbolicLink() || entry.size < 20) {fail('Missing/empty asset: '+slot.target);continue;}
        const realFile=await realpath(file);
        if (!inside(realFile,realBase)) {fail('Asset escapes private pack: '+slot.target);continue;}
        if (!(await checkSignature(file))) fail('Invalid image signature: '+slot.target);
      }
    }
  }
} else if (args.some(x=>x!=='--catalog')) fail('Usage: --catalog | --pack <private-folder> [--strict]');
const out={mode:packAt>=0?'pack':'catalog',pages:catalog.pages?.length||0,candidates:slots.length,essential:slots.filter(s=>s.required).length,optional:slots.filter(s=>!s.required).length,passed:errors.length===0,errors};
console.log(JSON.stringify(out,null,2));
if(errors.length) process.exitCode=1;
