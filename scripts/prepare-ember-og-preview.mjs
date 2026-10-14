// Preview-only manufacture of OG structural art. An expiring Dropbox URL is
// supplied through an ENCRYPTED, branch-scoped Vercel env var, never Git.
// Without that env var the ordinary build and production behavior are unchanged.
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const url=process.env.ROSIE_EMBER_OG_SOURCE_URL;
if(!url){
  console.log("Ember OG source not configured; retaining fallback visuals.");
  process.exit(0);
}
const response=await fetch(url,{redirect:"follow"});
if(!response.ok)throw Error("Dropbox OG master fetch failed: HTTP "+response.status);
const data=Buffer.from(await response.arrayBuffer());
if(data.byteLength!==72255395)throw Error("Not the verified original 72,255,395-byte archive; got "+data.byteLength);
const path="/tmp/rosie-ember-og-"+process.pid+".zip";
await writeFile(path,data);
await mkdir("public/ember-drill/edge",{recursive:true});
const py=process.env.PYTHON||"python3";
let p=spawnSync(py,["-m","pip","install","--quiet","Pillow==11.3.0"],{stdio:"inherit"});
if(p.status!==0)throw Error("Python Pillow unavailable on branch-scoped Vercel build: "+p.status);
p=spawnSync(py,["scripts/derive-ember-og-edges.py",path],{stdio:"inherit"});
if(p.status!==0)throw Error("Original source extraction failed: "+p.status);
console.log("Branch-only Vercel preview now contains source-verified OG32 Barkroot sprites");
