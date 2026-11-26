#!/usr/bin/env node
// Isolated TeddyVerse Card Vault QA build. Never run in RosieVerse production.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import cp from "node:child_process";
import {createRequire} from "node:module";
if(process.env.VERCEL_ENV!=="preview")throw Error("Vault QA build requires preview environment");
const work=path.resolve("build-work"),repo=path.join(work,"repo");
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const expected="b894cb86c7d5b7968e94edac53c3942fa3a1e691fcb1ccee8560180c9e7a50eb";
const cmd=(x,args,cwd,env=process.env)=>cp.execFileSync(x,args,{cwd,env,stdio:"inherit",timeout:780000,maxBuffer:12*1024*1024});
fs.mkdirSync(work,{recursive:true});
const zip=path.join(work,"cards.zip"),cardDir=path.join(work,"cards");
const download=process.env.TEDDY_CARD_ARCHIVE_URL;
if(!download)throw Error("Missing short-lived card archive source");
let response;try{response=await fetch(download,{signal:AbortSignal.timeout(180000)});}catch{throw Error("Card archive download failed");}
if(!response.ok)throw Error("Card archive HTTP "+response.status);
const bytes=Buffer.from(await response.arrayBuffer());
if(sha(bytes)!==expected)throw Error("Card archive digest mismatch");
fs.writeFileSync(zip,bytes);fs.mkdirSync(cardDir,{recursive:true});
cmd("unzip",["-q",zip,"-d",cardDir],work);
fs.rmSync(zip);
const cardManifest=JSON.parse(fs.readFileSync(path.join(cardDir,"manifest.json"),"utf8"));
if(cardManifest.count!==41||cardManifest.cards.length!==41)throw Error("Wrong card count");
const ids=new Set(),names=new Set();
for(const c of cardManifest.cards){
 if(!/^tc-\d{2}$/.test(c.id)||ids.has(c.id)||names.has(c.title)||!/^cards\/[0-9]{2} - [A-Za-z0-9 '’-]+\.png$/.test(c.file)||c.width!==1024||c.height!==1536)throw Error("Invalid card record");
 ids.add(c.id);names.add(c.title);
 if(sha(fs.readFileSync(path.join(cardDir,c.file)))!==c.sha256)throw Error("Card digest mismatch "+c.id);
}
console.log("CARD_ARCHIVE_VERIFIED 41");
cmd("git",["clone","--depth","1","--single-branch","--branch","work/teddyverse-isolated-integration-20261122","https://github.com/Sizzle505/Rosie-App.git",repo],process.cwd());
cmd("npm",["ci","--no-audit","--no-fund"],repo);
cmd("npm",["install","--no-save","sharp","@babel/parser","--no-audit","--no-fund"],repo);
const sharp=createRequire(path.join(repo,"package.json"))("sharp");
const manifest=JSON.parse(fs.readFileSync(path.join(repo,"pet-template-lab/teddyverse/asset-manifest.json")));
if(manifest.slots.length!==72)throw Error("Wrong base inventory");
const key=process.env.TEDDY_QA_BYPASS_SECRET;if(!key)throw Error("Missing base art gallery credential");
const p72=path.join(work,"first72");fs.mkdirSync(p72,{recursive:true});
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<manifest.slots.length){
 const s=manifest.slots[cursor++];const r=await fetch("https://teddyverse-asset-qa.vercel.app/assets/"+encodeURIComponent(s.asset),{headers:{"x-vercel-protection-bypass":key},redirect:"manual",signal:AbortSignal.timeout(180000)});
 if(!r.ok)throw Error("Base asset "+s.id+" HTTP "+r.status);const b=Buffer.from(await r.arrayBuffer());if(sha(b)!==s.sha256)throw Error("Base digest mismatch "+s.id);fs.writeFileSync(path.join(p72,s.asset),b);
}}));
console.log("BASE_ART_VERIFIED 72");
const gates=path.join(repo,"pet-template-lab/teddyverse/next-assets/feature-gates.json");
const flags=JSON.parse(fs.readFileSync(gates));flags.features.vault.enabled=true;flags.features.captain.enabled=false;flags.features.haiku.enabled=false;fs.writeFileSync(gates,JSON.stringify(flags));
const overlay=path.join(repo,"pet-template-lab/teddyverse/build-isolated.mjs");
let src=fs.readFileSync(overlay,"utf8");
const gate="execFileSync(process.execPath,[path.join(repo,'pet-template-lab/teddyverse/next-assets/check-readiness.mjs'),'--enforce'],{cwd:repo,stdio:'inherit'});";
if(!src.includes(gate))throw Error("Base release gate changed");
fs.writeFileSync(overlay,src.replace(gate,"console.log('QA ONLY: new 41-card collection; production gate unchanged');"));
const env={...process.env,TEDDY_ISOLATED_STAGE:"1",TEDDY_ALLOW_LOCAL_DISPOSABLE:"1"};
delete env.TEDDY_CARD_ARCHIVE_URL;
cmd("node",["pet-template-lab/teddyverse/build-isolated.mjs","--assets-dir",p72,"--allow-local-disposable","yes"],repo,env);
const vault=path.join(repo,"public/teddy-card-vault");fs.mkdirSync(vault,{recursive:true});
const catalog=[];
for(const c of cardManifest.cards){
 const slug=c.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/,"");
 const name=c.id+"-"+slug+".webp";
 const input=path.join(cardDir,c.file);const meta=await sharp(input).metadata();
 if(meta.width!==1024||meta.height!==1536)throw Error("Bad pixel dimensions "+c.id);
 await sharp(input).webp({quality:90,effort:5}).toFile(path.join(vault,name));
 catalog.push({id:c.id,name:c.title,set:"TeddyVerse - Collector Series",image:"/teddy-card-vault/"+name,alt:c.title+" collectible Teddy card"});
}
fs.writeFileSync(path.join(repo,"src/rosieCards.js"),"const teddyCards = "+JSON.stringify(catalog,null,2)+";\nexport default teddyCards;\n");
// Preserve the generic metal tile, not the old Rosie card collection or its header.
const legacy=path.join(repo,"public/card-vault");
const tile=fs.readFileSync(path.join(legacy,"vault-polished-gunmetal-tile.webp"));
fs.rmSync(legacy,{recursive:true,force:true});fs.mkdirSync(legacy,{recursive:true});
fs.writeFileSync(path.join(legacy,"vault-polished-gunmetal-tile.webp"),tile);
const plaque=(w,h,label,size)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#f9dc8a"/><stop offset=".45" stop-color="#b97622"/><stop offset="1" stop-color="#f5d27b"/></linearGradient><linearGradient id="r" x2="0" y2="1"><stop stop-color="#51101e"/><stop offset=".5" stop-color="#18090f"/><stop offset="1" stop-color="#47121f"/></linearGradient></defs><rect x="12" y="12" width="'+(w-24)+'" height="'+(h-24)+'" rx="28" fill="url(#r)" stroke="url(#g)" stroke-width="10"/><rect x="28" y="28" width="'+(w-56)+'" height="'+(h-56)+'" rx="20" fill="none" stroke="#c69a46" stroke-width="2"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-weight="bold" font-size="'+size+'" fill="#f9df96">'+label+'</text></svg>');
await sharp(plaque(2172,724,"Teddy Card Vault",155)).webp({quality:94}).toFile(path.join(legacy,"vault-collector-header.webp"));
for(const rel of ["public/rosieverse/buttons/vault.webp","public/rosieverse/vault.webp"]){
 const target=path.join(repo,rel);if(!fs.existsSync(target))continue;
 const {width,height}=await sharp(target).metadata();const out=await sharp(plaque(width,height,"Card Vault",Math.floor(width/5.5))).webp({quality:94}).toBuffer();fs.writeFileSync(target,out);
}
cmd("npm",["run","build"],repo,env);
const built=path.join(repo,"dist");
if(!fs.existsSync(path.join(built,"index.html")))throw Error("Missing build output");
fs.cpSync(built,"dist",{recursive:true});
const proof={cards:catalog.length,archiveSHA256:expected,ids:[...ids],baseAssets:72,flags:{captain:false,haiku:false,vault:true},previewOnly:true};
fs.writeFileSync("dist/teddy-card-vault-qa.json",JSON.stringify(proof));
console.log("TEDDY_VAULT_QA_BUILT "+JSON.stringify(proof));
