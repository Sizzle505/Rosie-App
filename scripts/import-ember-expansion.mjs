#!/usr/bin/env node
/**
 * Art-only import for Ember Tunnel's ChatGPT-generated Expansion Batch C.
 *
 * Usage:
 *   unzip "Ember Tunnel Art Integration Pack 2026-11-20.zip"
 *   node scripts/import-ember-expansion.mjs "./Ember Tunnel Art Integration Pack"
 *
 * No deploy, merge or gameplay activation is performed by this script.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {EMBER_EXPANSION_ATLASES,EMBER_EXPANSION_TRANSITIONS} from "../src/emberExpansionCatalog.js";
const scriptDir=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(scriptDir,"..");
const arg=process.argv[2];
if(!arg){
  console.error("Usage: node scripts/import-ember-expansion.mjs <extracted package directory>");
  process.exit(2);
}
const input=path.resolve(arg);
const manifestFile=path.join(input,"art-manifest.json");
if(!fs.existsSync(manifestFile))throw Error("Missing art-manifest.json: "+manifestFile);
const manifest=JSON.parse(fs.readFileSync(manifestFile,"utf8"));
if(!manifest.atlases||!manifest.transitions)throw Error("Incomplete art-manifest.json");
const targetRoot=path.join(repoRoot,"public","ember-drill","expansion-batch-c");
const expected=[];
for(const [key,catalog] of Object.entries(EMBER_EXPANSION_ATLASES)){
  const recorded=manifest.atlases[key];
  if(!recorded||recorded.columns!==catalog.columns||recorded.rows!==catalog.rows||
     recorded.frameCount!==catalog.frames||recorded.framePx[0]!==catalog.cell||
     recorded.framePx[1]!==catalog.cell){
    throw Error("Atlas registration mismatch: "+key);
  }
  expected.push({src:path.join(input,"Optimized Atlases",key+"-atlas.webp"),
    dest:path.join(targetRoot,catalog.file)});
}
for(const [key,file] of Object.entries(EMBER_EXPANSION_TRANSITIONS)){
  if(!manifest.transitions[key])throw Error("Missing transition: "+key);
  expected.push({src:path.join(input,"Wide Transitions",key+".webp"),
    dest:path.join(targetRoot,file)});
}
for(const item of expected){
  if(!fs.existsSync(item.src)||fs.statSync(item.src).size<4000)throw Error("Missing/empty reviewed art: "+item.src);
  const magic=fs.readFileSync(item.src).subarray(0,12);
  if(magic.toString("ascii",0,4)!=="RIFF"||magic.toString("ascii",8,12)!=="WEBP")
    throw Error("Bad WebP signature: "+item.src);
}
for(const item of expected){
  fs.mkdirSync(path.dirname(item.dest),{recursive:true});
  fs.copyFileSync(item.src,item.dest);
}
const imported={
  sourceArchive:"Ember Tunnel Art Integration Pack 2026-11-20.zip",
  exportedOn:"2026-11-20",
  imageStatus:"art-review",
  activation:"No new stage/enemy/hazard is activated by importing these images.",
  files:expected.map(item=>path.relative(targetRoot,item.dest).replaceAll(path.sep,"/"))
};
fs.writeFileSync(path.join(targetRoot,"asset-manifest.json"),JSON.stringify(imported,null,2)+"\n");
console.log("Copied "+expected.length+" reviewed WebP files into "+path.relative(repoRoot,targetRoot));
console.log("Next: visual QA, frame/alpha registration, then explicitly enable gameplay.");
