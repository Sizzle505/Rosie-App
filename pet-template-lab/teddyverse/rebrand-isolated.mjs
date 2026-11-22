#!/usr/bin/env node
/* Teddy-only visible branding cleanup in disposable app source.
   Never rename identifiers, import strings, public asset paths, CSS class names or keys. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
if(process.env.TEDDY_ISOLATED_STAGE!=="1")throw Error("Not an isolated Teddy stage");
if(!process.env.VERCEL && process.env.TEDDY_ALLOW_LOCAL_DISPOSABLE!=="1")throw Error("Refusing non-CI rewrite without TEDDY_ALLOW_LOCAL_DISPOSABLE=1");
const replace=s=>s.replaceAll("RosieVerse","TeddyVerse")
 .replaceAll("ROSIEVERSE","TEDDYVERSE").replaceAll("Rosie’s","Teddy’s")
 .replaceAll("Rosie's","Teddy's").replaceAll("ROSIE’S","TEDDY’S")
 .replaceAll("ROSIE'S","TEDDY'S").replaceAll("Rosie","Teddy");
const noPath=s=>!/(?:https?:|@|\.jsx?\b|\.css\b|\.mjs\b|\.webp\b|\.png\b|\.jpe?g\b|\.svg\b|\/|\\)/i.test(s);
let filesChanged=0,editsMade=0,changedByFile=[];
async function scan(dir){let out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){
 const p=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await scan(p));
 else if(/\.(jsx?|mjs)$/.test(entry.name))out.push(p);
 }return out}
for(const filename of await scan(path.join(repo,"src"))){
 let code=await fs.readFile(filename,"utf8"),tree;
 try{tree=parse(code,{sourceType:"unambiguous",plugins:["jsx"],errorRecovery:false})}catch(e){throw Error("AST parse failed "+path.relative(repo,filename)+" "+e.message)}
 const edits=[];
 function eligible(node,parent,key){
  if(parent?.type==="ImportDeclaration"||parent?.type==="ExportNamedDeclaration"||parent?.type==="ExportAllDeclaration")return false;
  if((parent?.type==="ObjectProperty"||parent?.type==="ObjectMethod")&&key==="key")return false;
  if(parent?.type==="JSXAttribute"&&["src","href","className","id","type","name","role","style","key"].includes(parent.name?.name))return false;
  const s=node.value;
  if(typeof s!=="string"||!s.includes("Rosie")&&!s.includes("ROSIE"))return false;
  return noPath(s);
 }
 function visit(node,parent=null,key=""){
  if(!node||typeof node!=="object")return;
  if(Array.isArray(node)){for(const x of node)visit(x,parent,key);return}
  if(typeof node.type!=="string")return;
  if(node.type==="StringLiteral"&&eligible(node,parent,key)){
   const original=code.slice(node.start,node.end);
   const q=original[0];
   if(q==="'"||q==='"'){const body=original.slice(1,-1),replaced=replace(body);
    if(replaced!==body)edits.push({start:node.start,end:node.end,replacement:q+replaced+q});
   }
  }else if(node.type==="JSXText"){
   const original=code.slice(node.start,node.end),replaced=replace(original);
   if(replaced!==original)edits.push({start:node.start,end:node.end,replacement:replaced});
  }else if(node.type==="TemplateElement"){
   const original=code.slice(node.start,node.end);
   if(original===node.value.raw&&noPath(original)){const replaced=replace(original);
     if(replaced!==original)edits.push({start:node.start,end:node.end,replacement:replaced});
   }
  }
  for(const [k,v] of Object.entries(node)){if(k==="loc"||k==="comments"||k==="tokens"||k==="errors"||k==="extra")continue;
    if(Array.isArray(v))for(const item of v)visit(item,node,k);
    else if(v&&typeof v==="object"&&typeof v.type==="string")visit(v,node,k);
  }
 }
 visit(tree);
 if(!edits.length)continue;
 edits.sort((a,b)=>b.start-a.start);let latest=Infinity;
 for(const e of edits){if(e.end>latest)throw Error("Overlapping AST patch in "+filename);latest=e.start;code=code.slice(0,e.start)+e.replacement+code.slice(e.end)}
 parse(code,{sourceType:"unambiguous",plugins:["jsx"]});
 await fs.writeFile(filename,code);filesChanged++;editsMade+=edits.length;
 changedByFile.push({name:path.relative(repo,filename),replacements:edits.length});
}
const mainFile=path.join(repo,"src/main.jsx");
let main=await fs.readFile(mainFile,"utf8");
const remove=(description,pattern)=>{if(!pattern.test(main))throw Error("Missing "+description);main=main.replace(pattern,"")};
remove("dead Captain bottom navigation",/<button type="button" aria-label="Open Captain Rosie"[\s\S]*?<\/button>/);
remove("dead Vault bottom navigation",/<button type="button" className=\{[^>]+vault-nav-button[^>]*>[\s\S]*?<\/button>/);
remove("disabled AccountPortal",/<AccountPortal\s*\/>/);
remove("disabled SecretLayoutStudio",/<SecretLayoutStudio\b[\s\S]*?\/>/);
if(!main.includes("isLayoutStudio"))throw Error("Unexpected mount function");
const oldMount='isLayoutStudio\n      ? <LayoutPlayground />\n      : <AccountProvider><App />{isLayoutPreview && <LayoutPreviewBridge />}</AccountProvider>';
if(!main.includes(oldMount))throw Error("Unexpected account/layout mount expression");
main=main.replace(oldMount,"<App />");
const navSeal='onClick={() => navigateTo("resources")}>R</button>';
if(!main.includes(navSeal))throw Error("Missing Rosie resource seal");
main=main.replace(navSeal,'onClick={() => navigateTo("resources")}>T</button>');
parse(main,{sourceType:"module",plugins:["jsx"]});
await fs.writeFile(mainFile,main);
const htmlFile=path.join(repo,"index.html");
let html=await fs.readFile(htmlFile,"utf8");
html=replace(html);await fs.writeFile(htmlFile,html);
console.log("TEDDY_BRANDING_AUDIT "+JSON.stringify({filesChanged,stringsChanged:editsMade,sections:changedByFile.sort((a,b)=>b.replacements-a.replacements).slice(0,25)}));
