#!/usr/bin/env node
/* Temporary Captain + Haiku preview only. No flagship writes, no public promotion.
   Run as src/build.mjs in the isolated Vercel staging project. Only protected
   sources: private 72-art gallery + private Muse 107-master gallery. */
import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";import cp from "node:child_process";
if(process.env.VERCEL_ENV!=="preview")throw Error("QA-only build refuses production");
const work=path.resolve("build-work"),repo=path.join(work,"repo");
if(!repo.startsWith(process.cwd()+path.sep))throw Error("Unsafe temporary checkout");
fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});
const cmd=(x,args,cwd,env=process.env)=>cp.execFileSync(x,args,{cwd,env,stdio:"inherit",timeout:780000,maxBuffer:12*1024*1024});
cmd("git",["clone","--depth","1","--single-branch","--branch","work/teddyverse-isolated-integration-20261122","https://github.com/Sizzle505/Rosie-App.git",repo],process.cwd());
cmd("npm",["ci","--no-audit","--no-fund"],repo);cmd("npm",["install","--no-save","sharp","@babel/parser","--no-audit","--no-fund"],repo);
const a=JSON.parse(fs.readFileSync(path.join(repo,"pet-template-lab/teddyverse/asset-manifest.json")));
const b=JSON.parse(fs.readFileSync(path.join(repo,"pet-template-lab/teddyverse/next-assets/muse-export-manifest.json")));
if(a.slots?.length!==72||b.slots?.length!==107||b.approved_masters!==107)throw Error("Invalid manifests");
const firstKey=process.env.TEDDY_QA_BYPASS_SECRET,secondKey=process.env.TEDDY_MUSE_QA_BYPASS_SECRET;
if(!firstKey||!secondKey)throw Error("Missing gallery-access env secrets");
const first=a.slots.map(s=>({name:s.asset,sha:s.sha256,url:"https://teddyverse-asset-qa.vercel.app/assets/"+encodeURIComponent(s.asset),key:firstKey}));
const second=b.slots.map(s=>({name:s.master,sha:s.masterSha256,url:"https://teddyverse-muse-art-qa.vercel.app/masters/"+encodeURIComponent(s.master),key:secondKey}));
async function download(list,folder){fs.mkdirSync(folder,{recursive:true});let index=0,bytes=0;const errors=[];
async function worker(){while(index<list.length){const item=list[index++];try{const response=await fetch(item.url,{redirect:"manual",headers:{"x-vercel-protection-bypass":item.key},signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error("HTTP "+response.status);const binary=Buffer.from(await response.arrayBuffer());if(crypto.createHash("sha256").update(binary).digest("hex")!==item.sha)throw Error("hash mismatch");fs.writeFileSync(path.join(folder,item.name),binary);bytes+=binary.length;}catch(e){errors.push({id:item.name,message:String(e.message).slice(0,100)})}}}
await Promise.all(Array.from({length:6},worker));if(errors.length)throw Error("Download failed "+JSON.stringify(errors));return{count:list.length,bytes}}
const p72=path.join(work,"first72"),p107=path.join(work,"muse107");
console.log("MUSE_PREVIEW_ASSETS_VERIFIED "+JSON.stringify({original:await download(first,p72),muse:await download(second,p107)}));
const gates=path.join(repo,"pet-template-lab/teddyverse/next-assets/feature-gates.json");
const flags=JSON.parse(fs.readFileSync(gates));flags.features.captain.enabled=true;flags.features.haiku.enabled=true;flags.features.vault.enabled=false;fs.writeFileSync(gates,JSON.stringify(flags));
const overlay=path.join(repo,"pet-template-lab/teddyverse/build-isolated.mjs");let source=fs.readFileSync(overlay,"utf8");
const releaseGate="execFileSync(process.execPath,[path.join(repo,'pet-template-lab/teddyverse/next-assets/check-readiness.mjs'),'--enforce'],{cwd:repo,stdio:'inherit'});";
if(!source.includes(releaseGate))throw Error("Changed release gate requires review");
fs.writeFileSync(overlay,source.replace(releaseGate,"console.log('QA ONLY: Captain/Haiku enabled with visual review gate pending');"));
const env={...process.env,TEDDY_ISOLATED_STAGE:"1",TEDDY_ALLOW_LOCAL_DISPOSABLE:"1"};
cmd("node",["pet-template-lab/teddyverse/build-isolated.mjs","--assets-dir",p72,"--allow-local-disposable","yes"],repo,env);
cmd("node",["pet-template-lab/teddyverse/next-assets/apply-muse-107.mjs","--assets-dir",p107,"--apply","--confirm-disposable"],repo,env);
cmd("npm",["run","build"],repo,env);
const built=path.join(repo,"dist");if(!fs.existsSync(path.join(built,"index.html")))throw Error("Missing Vite result");
fs.cpSync(built,"dist",{recursive:true});
const proof={type:"TeddyVerse Muse QA preview",first:72,next:107,flags:{captain:true,haiku:true,vault:false},publicReleaseApproved:false,backendEnabled:false};
fs.writeFileSync("dist/teddy-muse-qa.json",JSON.stringify(proof));
console.log("MUSE_PREVIEW_BUILT "+JSON.stringify(proof));
