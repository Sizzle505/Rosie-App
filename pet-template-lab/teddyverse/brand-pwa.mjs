#!/usr/bin/env node
/** Replace RosieVerse's fixed app icons in disposable TeddyVerse build output. */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
if(process.env.TEDDY_ISOLATED_STAGE!=="1")throw Error("Refusing to write app icons outside Teddy stage");
const src=path.join(repo,"public/rosieverse/resources/crest.webp");
const out=path.join(repo,"dist"),icons=path.join(out,"icons");
const expansion=JSON.parse(await fs.readFile(path.join(repo,"pet-template-lab/teddyverse/next-assets/feature-gates.json"),"utf8")).features;
const enabled=name=>expansion?.[name]?.enabled===true;
await fs.access(path.join(out,"index.html"));await fs.access(src);
await fs.mkdir(icons,{recursive:true});
for(const size of [32,180,192,512]){
 const rendered=await sharp(src).resize(size,size,{fit:"cover",position:sharp.strategy.attention}).png({compressionLevel:9}).toBuffer();
 await fs.writeFile(path.join(icons,"teddyverse-"+size+".png"),rendered);
}
const portrait=await sharp(src).resize(370,370,{fit:"cover",position:sharp.strategy.attention}).png().toBuffer();
const maskable=await sharp({create:{width:512,height:512,channels:4,background:"#151025"}})
 .composite([{input:portrait,left:71,top:71}]).png({compressionLevel:9}).toBuffer();
await fs.writeFile(path.join(icons,"teddyverse-maskable-512.png"),maskable);
for(const filename of ["rosieverse-32.png","rosieverse-180.png","rosieverse-192.png","rosieverse-512.png","rosieverse-maskable-512.png"])await fs.rm(path.join(icons,filename),{force:true});
const manifestPath=path.join(out,"manifest.webmanifest");
let manifest=JSON.parse(await fs.readFile(manifestPath,"utf8"));
manifest.name="TeddyVerse";manifest.short_name="TeddyVerse";
manifest.description="Teddy's world of fortunes, cheese, recipes, QR Atelier, reminders and fun.";
manifest.icons=[
 {src:"/icons/teddyverse-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
 {src:"/icons/teddyverse-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
 {src:"/icons/teddyverse-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}
];
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n");
const indexPath=path.join(out,"index.html");
let html=await fs.readFile(indexPath,"utf8");
html=html.replaceAll("/icons/rosieverse-","/icons/teddyverse-");
html=html.replace(/(<meta name="description" content=")[^"]*(")/,'$1Enter TeddyVerse - an enchanting world with Teddy.$2');
html=html.replaceAll('RosieVerse','TeddyVerse').replaceAll('Rosie’s','Teddy’s');
await fs.writeFile(indexPath,html);
for(const name of ["teddyverse-32.png","teddyverse-180.png","teddyverse-192.png","teddyverse-512.png","teddyverse-maskable-512.png"])await fs.access(path.join(icons,name));
const excludedStatic=[
 ...(!enabled("vault")?["card-vault","rosieverse/vault.webp","rosieverse/buttons/vault.webp"]:[]),
 ...(!enabled("captain")?["ember-drill","cosmic-odyssey","yacht-dash","captain-levels","captain-arcade-backgrounds","captain-motion","captain-victory-backdrops","rosieverse/captain.webp","rosieverse/buttons/captain.webp"]:[]),
 ...(!enabled("haiku")?["rosieverse/haiku"]:[]),
 "randomizers/secret-santa/email/preview-draw.html",
 "randomizers/secret-santa/email/preview-registration.html"
];
for(const relative of excludedStatic)await fs.rm(path.join(out,relative),{recursive:true,force:true});
for(const relative of excludedStatic){
 try{await fs.access(path.join(out,relative));throw Error("Excluded Teddy feature survived static purge: "+relative)}
 catch(e){if(e.code!=="ENOENT")throw e}
}
console.log("TEDDY_EXCLUDED_STATIC_PURGE "+JSON.stringify({paths:excludedStatic.length,retainedApp:"TeddyVerse"}));
console.log("TEDDY_PWA_BRANDING_READY "+JSON.stringify({icons:5,manifest:manifest.name,source:"resources.crest"}));
