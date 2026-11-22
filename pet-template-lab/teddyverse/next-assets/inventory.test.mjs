#!/usr/bin/env node
/** Deterministic TeddyVerse expansion inventory tests. No modifications/network. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,"../../..");
const load=name=>JSON.parse(fs.readFileSync(path.join(here,name),"utf8"));
const inv=load("source-inventory.json"),gen=load("generation-queue.json"),rev=load("visual-review-queue.json"),vault=load("vault-scope-inventory.json"),flags=load("feature-gates.json"),ledger=load("approval-ledger.json");
const first=JSON.parse(fs.readFileSync(path.join(repo,"pet-template-lab/teddyverse/asset-manifest.json"),"utf8"));
const unique=xs=>new Set(xs).size===xs.length;
const classified=name=>inv.images.filter(x=>x.classification===name);
test("all source images inventoried once",()=>{assert.equal(inv.images.length,1202);assert.ok(unique(inv.images.map(x=>x.path)));});
test("first 72 are preserved without modification",()=>{assert.equal(first.slots.length,72);assert.equal(classified("covered-first-72").length,72);for(const s of first.slots)assert.ok(inv.images.some(x=>x.path===s.source&&x.first72Slot===s.id));});
test("every source file exists in this repo checkout",()=>{for(const x of inv.images)assert.ok(fs.statSync(path.join(repo,x.path)).isFile(),x.path)});
test("candidate queues have consistent frozen IDs and source paths",()=>{
 assert.equal(gen.assets.length,107);assert.equal(gen.assets.filter(x=>x.state==="awaiting-generation").length,98);
 assert.equal(rev.assets.length,173);assert.equal(vault.assets.length,313);
 assert.ok(unique([...gen.assets,...rev.assets,...vault.assets].map(a=>a.id)));
 assert.equal(classified("generate-pet-art").length,98);
 assert.equal(classified("review-for-pet-content").length,173);
 assert.equal(classified("separate-vault-scope").length,313);
 assert.equal(classified("reuse-generic-candidate").length,546);
 for(const x of gen.assets.filter(a=>a.state==="awaiting-generation"))assert.ok(inv.images.some(y=>y.path===x.sourcePath&&y.classification==="generate-pet-art"),x.id);
 for(const x of rev.assets)assert.ok(inv.images.some(y=>y.path===x.sourcePath&&y.classification==="review-for-pet-content"),x.id);
 for(const x of vault.assets)assert.ok(inv.images.some(y=>y.path===x.sourcePath&&y.classification==="separate-vault-scope"),x.id);
});
test("all new raster and visual-review specs are measured",()=>{
 for(const x of [...gen.assets.filter(x=>x.state==="awaiting-generation"),...rev.assets]){
  assert.ok(Number.isFinite(x.sourceDimensions.width)&&x.sourceDimensions.width>0,x.id);
  assert.ok(Number.isFinite(x.sourceDimensions.height)&&x.sourceDimensions.height>0,x.id);
  assert.equal(typeof x.sourceDimensions.hasAlpha,"boolean",x.id);
 }
});
test("Captain, Haiku and Vault gated OFF and unapproved",()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(flags.features).map(([k,v])=>[k,v.enabled])),{captain:false,haiku:false,vault:false});
 assert.equal(Object.keys(ledger.approvedAssets).length,0);
 assert.equal(Object.keys(ledger.reviewDecisions).length,0);
});
test("Captain/Haiku art and review counts account for navigation items",()=>{
 const cap=new Set(["captain-hub","captain-cosmic","captain-yacht","captain-tunnel"]);
 assert.equal(gen.assets.filter(x=>x.state==="awaiting-generation"&&cap.has(x.section)).length,39);
 assert.equal(rev.assets.filter(x=>cap.has(x.module)).length,72);
 assert.equal(gen.assets.filter(x=>x.state==="awaiting-generation"&&x.section==="haiku").length,26);
 assert.equal(rev.assets.filter(x=>x.module==="haiku").length,76);
});
