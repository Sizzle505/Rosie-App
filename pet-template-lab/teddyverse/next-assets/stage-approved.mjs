#!/usr/bin/env node
/**
 * Stage approved Teddy illustration masters onto a DISPOSABLE isolated source
 * clone. Offline only: this never downloads, creates images, deploys, or updates
 * the live RosieVerse/TeddyVerse projects.
 *
 * Usage:
 *   node next-assets/stage-approved.mjs --assets-dir /private/masters
 *   TEDDY_ISOLATED_STAGE=1 node next-assets/stage-approved.mjs \
 *     --assets-dir /private/masters --apply --confirm-disposable
 */
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import {execFileSync} from "node:child_process";
import sharp from "sharp";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,"../../..");
const args=process.argv.slice(2);
const arg=name=>{const i=args.indexOf("--"+name);return i===-1?null:args[i+1]};
const apply=args.includes("--apply");
const assetRoot=arg("assets-dir");
if(!assetRoot)throw Error("Missing --assets-dir /private/TeddyVerse-Next-Assets/masters");
const masters=path.resolve(assetRoot);
const ledger=JSON.parse(await fs.readFile(path.join(root,"approval-ledger.json"),"utf8"));
const queue=JSON.parse(await fs.readFile(path.join(root,"generation-queue.json"),"utf8"));
if(!queue?.assets||queue.totalGenerationRequired!==98)throw Error("Generation registry drift: reconcile before staging");
const eligible=queue.assets.filter(x=>x.state==="awaiting-generation");
const hash=b=>crypto.createHash("sha256").update(b).digest("hex");
const branch=()=>{try{return execFileSync("git",["-C",repo,"branch","--show-current"],{encoding:"utf8"}).trim()}catch{return""}};
if(apply){
 if(process.env.TEDDY_ISOLATED_STAGE!=="1"||!args.includes("--confirm-disposable"))
  throw Error("Refusing writes without TEDDY_ISOLATED_STAGE=1 and --confirm-disposable");
 if(branch()!=="work/teddyverse-isolated-integration-20261122")
  throw Error("Refusing mutation outside the isolated TeddyVerse integration branch");
}
const report={mode:apply?"apply":"dry-run",branch:branch(),expected:eligible.length,staged:[],notApproved:[],missingFiles:[],failures:[],backupDir:null};
const toWrite=[];
for(const slot of eligible){
 const approval=ledger.approvedAssets[slot.id];
 if(!approval||approval.approved!==true||!approval.approvedBy||!approval.approvedAt||approval.dimensionsVerified!==true||approval.alphaVerified!==true||!(/^[0-9a-f]{64}$/i.test(approval.sha256??""))){report.notApproved.push(slot.id);continue}
 const name=slot.masterFilename;
 if(!/^[A-Za-z0-9._-]+\.png$/.test(name))throw Error("Unexpected master filename for "+slot.id);
 const filename=path.join(masters,name);
 let input;
 try{input=await fs.readFile(filename)}catch{report.missingFiles.push(slot.id);continue}
 if(hash(input).toLowerCase()!==approval.sha256.toLowerCase()){report.failures.push({id:slot.id,reason:"SHA-256 does not match approved master"});continue}
 try{
  const m=await sharp(input).metadata(),target=slot.sourceDimensions;
  if(m.format!=="png"||!m.width||!m.height)throw Error("Master must be PNG");
  if(m.width<target.width||m.height<target.height)throw Error("Master smaller than source resolution");
  if(Math.abs(m.width/m.height-target.width/target.height)>0.005)throw Error("Aspect ratio mismatch");
  if(target.hasAlpha&&!m.hasAlpha)throw Error("Missing source-required alpha transparency");
  const dest=path.resolve(repo,slot.sourcePath);
  if(!dest.startsWith(repo+path.sep)||!slot.sourcePath.startsWith("public/"))throw Error("Destination escapes isolated public/ tree");
  await fs.access(dest);
  const ext=path.extname(dest).toLowerCase();
  if(![".webp",".png",".avif",".jpg",".jpeg"].includes(ext))throw Error("Unsupported destination type "+ext);
  const converted=sharp(input).resize(target.width,target.height,{fit:"fill"});
  const binary=ext===".webp"?await converted.webp({quality:97,alphaQuality:100,effort:5}).toBuffer()
    :ext===".png"?await converted.png({compressionLevel:9}).toBuffer()
    :ext===".avif"?await converted.avif({quality:94,effort:6}).toBuffer()
    :await converted.flatten({background:"#ffffff"}).jpeg({quality:95}).toBuffer();
  toWrite.push({slot,dest,binary});
 }catch(e){report.failures.push({id:slot.id,reason:e.message})}
}
if(apply&&report.failures.length)throw Error("Refusing partial write due to validation failures: "+JSON.stringify(report.failures));
if(apply&&toWrite.length){
 const backup=await fs.mkdtemp(path.join(os.tmpdir(),"teddy-approved-backup-"));
 report.backupDir=backup;
 const written=[];
 try{
  for(const [i,x] of toWrite.entries()){
    const old=await fs.readFile(x.dest);
    await fs.writeFile(path.join(backup,String(i).padStart(4,"0")+".original"),old);
    const temp=x.dest+".teddy-verified-tmp";
    await fs.writeFile(temp,x.binary);
    await fs.rename(temp,x.dest);
    written.push({dest:x.dest,backup:path.join(backup,String(i).padStart(4,"0")+".original")});
    report.staged.push({id:x.slot.id,destination:x.slot.sourcePath,sha256:hash(x.binary)});
  }
 }catch(e){
  for(const w of written.reverse()){await fs.copyFile(w.backup,w.dest)}
  throw Error("Failed isolated write; restored previous assets: "+e.message);
 }
}else report.staged=toWrite.map(x=>({id:x.slot.id,destination:x.slot.sourcePath,action:"would-stage",sha256:hash(x.binary)}));
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exitCode=2;
