#!/usr/bin/env node
/**
 * Import Muse's approved TV001-TV107 onto a disposable TeddyVerse build.
 * Input binary masters MUST remain private. Source-of-truth SHA-256 values
 * and original Git blob SHAs are in muse-export-manifest.json.
 *
 * Dry-run: node .../apply-muse-107.mjs --assets-dir /private/masters
 * Apply:   TEDDY_ISOLATED_STAGE=1 node .../apply-muse-107.mjs
 *          --assets-dir /private/masters --apply --confirm-disposable
 *
 * Includes 98 PNG and 9 SVG masters, including vector preservation and
 * 1:1 mapping to original paths. Does not deploy, toggle feature gates,
 * modify RosieVerse main or overwrite the first 72 TeddyVerse replacements.
 */
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
const take=n=>{const i=args.indexOf("--"+n);return i<0?null:args[i+1]};
const assetsDir=take("assets-dir")?path.resolve(take("assets-dir")):null;
if(!assetsDir)throw Error("--assets-dir is required");
const apply=args.includes("--apply");
const branch=execFileSync("git",["-C",root,"branch","--show-current"],{encoding:"utf8"}).trim();
const expectedBranch="work/teddyverse-isolated-integration-20261122";
if(branch!==expectedBranch)throw Error("Refusing non-Teddy branch: "+branch);
if(apply&&(process.env.TEDDY_ISOLATED_STAGE!=="1"||!args.includes("--confirm-disposable")))throw Error("Apply requires TEDDY_ISOLATED_STAGE=1 and --confirm-disposable");
const manifest=JSON.parse(await fs.readFile(path.join(here,"muse-export-manifest.json"),"utf8"));
const first72=JSON.parse(await fs.readFile(path.join(root,"pet-template-lab/teddyverse/asset-manifest.json"),"utf8"));
if(manifest.slots?.length!==107||manifest.total_slots!==107||manifest.approved_masters!==107||manifest.unresolved_slots?.length!==0)throw Error("Muse manifest not fully approved");
const names=new Set(),destinations=new Set();
const first72Paths=new Set(first72.slots.map(x=>x.source));
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const proofs=[],prepared=[],errors=[];
for(const slot of manifest.slots){
 const id=slot.id;
 try{
  if(!/^TV\d{3}$/.test(id)||names.has(id))throw Error("Invalid/duplicate slot ID");
  names.add(id);
  if(slot.status!=="approved")throw Error("Unapproved slot");
  const rel=slot.sourcePath;
  if(typeof rel!=="string"||!/^public\/[a-zA-Z0-9_./-]+$/.test(rel)||rel.includes("..")||destinations.has(rel))throw Error("Unsafe/duplicate destination");
  destinations.add(rel);
  if(first72Paths.has(rel))throw Error("Would overwrite first-stage approved artwork");
  const dest=path.resolve(root,rel);
  if(!dest.startsWith(root+path.sep))throw Error("Unsafe target");
  await fs.access(dest);
  const originalGitSha=execFileSync("git",["-C",root,"rev-parse","HEAD:"+rel],{encoding:"utf8"}).trim();
  if(originalGitSha!==slot.sourceGitBlobSHA)throw Error("Original source Git blob SHA mismatch");
  const ext=path.extname(rel).toLowerCase();
  const master=slot.master;
  if(!/^TV\d{3}\.(png|svg)$/.test(master)||!master.startsWith(id+"."))throw Error("Invalid master naming");
  const name=path.resolve(assetsDir,master);
  if(!name.startsWith(assetsDir+path.sep))throw Error("Unsafe master path");
  const input=await fs.readFile(name);
  if(sha(input)!==slot.masterSha256)throw Error("Master SHA-256 differs from Muse manifest");
  const srcDim=slot.sourceDimensions;
  if(!srcDim||!Number.isSafeInteger(srcDim.width)||!Number.isSafeInteger(srcDim.height)||srcDim.width<=0||srcDim.height<=0)throw Error("Bad source dimensions");
  let encoded,alpha,outputFormat;
  if(master.endsWith(".svg")){
   if(ext!==".svg")throw Error("SVG destination does not match master");
   const txt=input.toString("utf8");
   if(!/<svg[\s>]/.test(txt)||!/<\/svg>/.test(txt)||/<script\b|onload\s*=|javascript:|<\!ENTITY|<foreignObject\b/i.test(txt))throw Error("Unsafe/incomplete SVG");
   if(/(?:xlink:)?href\s*=\s*["'](?:https?:|\/\/)/i.test(txt))throw Error("External SVG resource");
   encoded=input;alpha=true;outputFormat="svg";
   // Preserve complete SVG and embedded image payload: never rasterize.
  }else{
   const metadata=await sharp(input,{failOn:"error"}).metadata();
   if(metadata.format!=="png"||metadata.width!==srcDim.width||metadata.height!==srcDim.height)throw Error("Master PNG dimensions/format differ from source");
   if(slot.masterDimensions&&(metadata.width!==slot.masterDimensions[0]||metadata.height!==slot.masterDimensions[1]))throw Error("Master metadata mismatch");
   alpha=Boolean(metadata.hasAlpha);
   if(srcDim.hasAlpha&&!alpha&&id!=="TV062")throw Error("Required alpha missing");
   if(![".webp",".png",".jpg",".jpeg",".avif"].includes(ext))throw Error("Unsupported image destination "+ext);
   const i=sharp(input,{failOn:"error"});
   if(ext===".webp")encoded=await i.webp({quality:97,alphaQuality:100,effort:5}).toBuffer();
   else if(ext===".png")encoded=await i.png({compressionLevel:9}).toBuffer();
   else if(ext===".avif")encoded=await i.avif({quality:95,effort:6}).toBuffer();
   else encoded=await i.flatten({background:"#ffffff"}).jpeg({quality:97,mozjpeg:true}).toBuffer();
   const outputMeta=await sharp(encoded,{failOn:"error"}).metadata();
   if(outputMeta.width!==srcDim.width||outputMeta.height!==srcDim.height)throw Error("Converted format changed dimensions");
   if(srcDim.hasAlpha&&alpha&&ext!==".jpg"&&ext!==".jpeg"&&!outputMeta.hasAlpha)throw Error("Lost alpha during output format conversion");
   outputFormat=outputMeta.format;
  }
  const p={id,source:rel,master,originalGitSha,masterSha256:slot.masterSha256,masterBytes:input.length,outputBytes:encoded.length,outputSha256:sha(encoded),width:srcDim.width,height:srcDim.height,alpha,outputFormat};
  proofs.push(p);prepared.push({dest,encoded,p});
 }catch(error){errors.push({id,reason:String(error.message).slice(0,220)})}
}
const report={mode:apply?"apply":"dry-run",branch,expected:107,verified:proofs.length,errors,outputTotalBytes:prepared.reduce((a,x)=>a+x.encoded.length,0),byType:proofs.reduce((acc,x)=>(acc[x.outputFormat]=(acc[x.outputFormat]??0)+1,acc),{}),masters:proofs};
if(errors.length||proofs.length!==107){console.log("MUSE_IMPORT_VALIDATION "+JSON.stringify({...report,masters:undefined}));process.exitCode=2;throw Error("Refusing partial TV asset integration; fix rejected masters first")}
if(apply){
 const backup=await fs.mkdtemp(path.join(os.tmpdir(),"teddy-muse-107-backup-"));
 const writes=[];
 try{
  for(const [i,x] of prepared.entries()){
   const old=await fs.readFile(x.dest);
   const back=path.join(backup,String(i).padStart(3,"0")+".original");
   await fs.writeFile(back,old);
   const temp=x.dest+".muse-staging";
   await fs.writeFile(temp,x.encoded);await fs.rename(temp,x.dest);
   writes.push({dest:x.dest,backup:back});
  }
 }catch(e){for(const x of writes.reverse())await fs.copyFile(x.backup,x.dest);throw Error("Write failed; restored previous source art: "+e.message)}
 report.backupDir=backup;
 await fs.writeFile(path.join(root,"pet-template-lab/teddyverse/next-assets/muse-applied-audit.json"),JSON.stringify(report,null,2)+"\n");
}
console.log("MUSE_IMPORT_OK "+JSON.stringify({mode:report.mode,verified:report.verified,errors:report.errors.length,totalOutputBytes:report.outputTotalBytes,formats:report.byType,backup:report.backupDir??null}));
