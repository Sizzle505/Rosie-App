#!/usr/bin/env node
/**
 * Non-mutating source-reference audit for TeddyVerse artwork.
 * Identifies literal URL/path/basename references, NOT runtime reachability.
 * Dynamic concatenation and CSS-driven generated names may be missed.
 *
 * node pet-template-lab/teddyverse/next-assets/audit-runtime-references.mjs
 * node .../audit-runtime-references.mjs --out /tmp/teddy-refs.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,"../../..");
const data=JSON.parse(await fs.readFile(path.join(here,"source-inventory.json"),"utf8"));
const codeFiles=[];
async function visit(dir){for(const item of await fs.readdir(path.join(repo,dir),{withFileTypes:true})){
 const relative=path.posix.join(dir,item.name);
 if(item.isDirectory()){
  if(/(?:^|\/)(node_modules|dist|\.git|\.cache|assets|drafts|masters)(?:\/|$)/.test(relative))continue;
  await visit(relative);
 }else if(/\.(?:jsx?|tsx?|mjs|css|html|json)$/i.test(item.name)&&!relative.includes("next-assets/")&&!relative.includes("asset-manifest.json")){
  const stat=await fs.stat(path.join(repo,relative));if(stat.size>600000)continue;
  codeFiles.push({name:relative,body:await fs.readFile(path.join(repo,relative),"utf8")});
 }
}}
await visit("src");await visit("public");
const audit=data.images.map(x=>{
 const rel=x.path.replace(/^public\//,"").replace(/^src\//,"");
 const basename=path.basename(x.path);
 const literal=codeFiles.filter(f=>f.body.includes(rel)).map(f=>f.name);
 const basenameOnly=codeFiles.filter(f=>!literal.includes(f.name)&&f.body.includes(basename)).map(f=>f.name);
 return{id:x.path,module:x.module,classification:x.classification,priority:x.priority,exactLiteralReferences:literal.slice(0,15),basenameReferences:basenameOnly.slice(0,15),usesDynamicPathUncertain:literal.length===0&&basenameOnly.length===0};
});
const section={};
for(const x of audit){const k=x.module;section[k]??={total:0,exactRef:0,basenameOnly:0,noLiteral:0};section[k].total++;if(x.exactLiteralReferences.length)section[k].exactRef++;else if(x.basenameReferences.length)section[k].basenameOnly++;else section[k].noLiteral++}
const report={generatedAt:new Date().toISOString(),sourceFilesScanned:codeFiles.length,method:"heuristic static references only - never a proof of runtime usage or non-usage",sections:section,assets:audit};
const idx=process.argv.indexOf("--out");
if(idx>=0){const dest=process.argv[idx+1];if(!dest||!path.isAbsolute(dest))throw Error("--out must be an absolute path");await fs.writeFile(dest,JSON.stringify(report,null,2)+"\n");}
console.log(JSON.stringify({sourceFilesScanned:codeFiles.length,sections:section,unreferencedLikelyPet: audit.filter(x=>x.classification==="generate-pet-art"&&x.usesDynamicPathUncertain).length},null,2));
