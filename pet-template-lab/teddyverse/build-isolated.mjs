#!/usr/bin/env node
// TeddyVerse staging overlay. Run ONLY on a disposable isolated Rosie-App source copy.
// Keep private art and photos out of GitHub. Requires sharp installed.
// Command: TEDDY_ISOLATED_STAGE=1 node pet-template-lab/teddyverse/build-isolated.mjs --assets-dir /private/TeddyVerse-72-Final/assets --allow-local-disposable
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(await fs.readFile(path.join(repo, 'pet-template-lab/teddyverse/asset-manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = name => { const index = args.indexOf('--' + name); return index < 0 ? null : args[index + 1] };
if(process.env.TEDDY_ISOLATED_STAGE!=='1')throw Error('Refusing to run without TEDDY_ISOLATED_STAGE=1');
if(manifest.count!==72||manifest.slots.length!==72)throw Error('Invalid 72-slot manifest');
if(!process.env.VERCEL && !opt('allow-local-disposable'))throw Error('Refusing non-CI overlay without --allow-local-disposable');
const assetsDir=opt('assets-dir')?path.resolve(opt('assets-dir')):null;
const sources=process.env.TEDDY_PRIVATE_ASSET_LINKS_JSON?JSON.parse(process.env.TEDDY_PRIVATE_ASSET_LINKS_JSON):{};
if(!assetsDir && Object.keys(sources).length!==72)throw Error('72 links required when --assets-dir is absent');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=async (rel,buffer)=>{const dst=path.resolve(repo,rel);if(!dst.startsWith(repo+path.sep))throw Error('Path escapes disposable copy: '+rel);await fs.mkdir(path.dirname(dst),{recursive:true});await fs.writeFile(dst,buffer)};
const read=async rel=>fs.readFile(path.join(repo,rel));
async function fetchAsset(slot){
  if(assetsDir)return fs.readFile(path.join(assetsDir,slot.asset));
  const u=sources[slot.id];if(typeof u!=='string'||!u.startsWith('https://'))throw Error('Missing HTTPS URL '+slot.id);
  const r=await fetch(u,{redirect:'follow',signal:AbortSignal.timeout(150000)});
  if(!r.ok)throw Error('Download failed '+slot.id+' HTTP '+r.status);
  return Buffer.from(await r.arrayBuffer());
}
async function encode(input,ext){
  if(ext==='.svg'){const text=input.toString('utf8');if(!/<svg[\s>]/.test(text)||/<script|onload\s*=|javascript:/i.test(text))throw Error('Unsafe SVG');return input}
  if(ext==='.webp')return sharp(input).webp({quality:96,alphaQuality:100,effort:5}).toBuffer();
  if(ext==='.png')return sharp(input).png({compressionLevel:9}).toBuffer();
  if(ext==='.jpg'||ext==='.jpeg')return sharp(input).flatten({background:'#ffffff'}).jpeg({quality:96,mozjpeg:true}).toBuffer();
  throw Error('Unsupported destination '+ext);
}
const audit=[];const buffers=new Map();
for(const slot of manifest.slots){
 if(!/^[-A-Za-z0-9._/]+$/.test(slot.source)||slot.source.includes('..'))throw Error('Unsafe source path '+slot.id);
 const b=await fetchAsset(slot);
 if(sha256(b)!==slot.sha256)throw Error('SHA-256 mismatch '+slot.id);
 const m=slot.source.endsWith('.svg')?null:await sharp(b).metadata();
 if(m && (m.width!==slot.dimensions[0]||m.height!==slot.dimensions[1]))throw Error('Dimension mismatch '+slot.id);
 await read(slot.source);
 buffers.set(slot.id,b);
 await write(slot.source,await encode(b,path.extname(slot.source).toLowerCase()));
 audit.push({id:slot.id,source:slot.source,asset:slot.asset,sha256:slot.sha256,bytes:b.length});
 console.log('TEDDY_OVERLAY_OK '+slot.id);
}
for(const [id,dst] of Object.entries({
 'home.nav-reviews':'src/assets/resources/reviews-crimson-transparent.webp',
 'home.nav-calculations':'src/assets/resources/calculations-turquoise-transparent.webp'
})){await read(dst);await write(dst,await encode(buffers.get(id),path.extname(dst)));}
for(const [id,name] of [
 ['qr.frame-seated','rosie-frame-seated-hollow.png'],
 ['qr.frame-presenting','rosie-frame-presenting-hollow.png']
]){
 const dst='public/qr-atelier/rosie-qr/'+name;
 const maskOriginal=await read(dst);
 const maskMeta=await sharp(maskOriginal).metadata();
 const input=await sharp(buffers.get(id)).resize(maskMeta.width,maskMeta.height).ensureAlpha().toBuffer();
 const alpha=await sharp(maskOriginal).extractChannel('alpha').toBuffer();
 const combined=await sharp(input).composite([{input:alpha,blend:'dest-in'}]).png().toBuffer();
 await write(dst,combined);
}
for(const [id,dst] of [
 ['randomizers.coin-heads','public/randomizers/rosie-coin.webp'],
 ['randomizers.coin-tails','public/randomizers/rosie-coin-tail.webp']
])await write(dst,await encode(buffers.get(id),'.webp'));
async function patchText(rel,changes){
 let s=(await read(rel)).toString('utf8');
 for(const [from,to] of changes){if(!s.includes(from))throw Error('Missing source marker '+rel+': '+from);s=s.replaceAll(from,to)}
 await write(rel,Buffer.from(s));
}
await patchText('src/RosieHome.jsx',[
 ['  { id: "captain", name: "Captain Rosie", art: "buttons/captain.webp" },\n',''],
 ['  { id: "vault", name: "Card Vault", art: "buttons/vault.webp" },\n',''],
 ["RosieVerse - discover Rosie's worlds","TeddyVerse - discover Teddy's worlds"],
 ['>RosieVerse</h1>','>TeddyVerse</h1>'],
 ['RosieVerse - Play, Explore, Discover - A Brighter Day with Rosie','TeddyVerse - Play, Explore, Discover - A Brighter Day with Teddy']
]);
let home=(await read('src/RosieHome.jsx')).toString('utf8');
const haiku=/<button type="button" className=\{styles\.haikuLantern\}[\s\S]*?<\/button>/;
if(!haiku.test(home))throw Error('Cannot locate unconverted Haiku navigation');
home=home.replace(haiku,'');await write('src/RosieHome.jsx',Buffer.from(home));
await patchText('src/main.jsx',[
 ['"home", "fortune", "cheese", "captain", "captain2", "vault", "randomizers", "haiku", "reminders"','"home", "fortune", "cheese", "randomizers", "reminders"']
]);
await patchText('src/RosieQrAtelier.jsx',[
 ['label:"Rosie at the Atelier"','label:"Teddy at the Atelier"'],
 ['label:"Rosie Presents"','label:"Teddy Presents"']
]);
await patchText('src/RosieRandomizers.jsx',[['Rosie accepts no appeals','Teddy accepts no appeals']]);
await patchText('src/RosieRecipes.jsx',[["Rosie's Recipes","Teddy's Recipes"]]);
await patchText('src/RosieSecretSanta.jsx',[["Rosie's Secret Santa","Teddy's Secret Santa"]]);
await write('public/offline-api.json',Buffer.from(JSON.stringify({ok:false,error:'Network services disabled for isolated TeddyVerse preview'})));
await write('pet-template-lab/teddyverse/overlay-result.json',Buffer.from(JSON.stringify({verified:72,stagedAt:new Date().toISOString(),assets:audit},null,2)));
console.log('TEDDY_OVERLAY_ALL_72_SHA_VERIFIED AND_QR_MASKED');
