import assert from "node:assert/strict";
import fs from "node:fs";
import {test} from "node:test";
import {
  EMBER_WORLD_CATALOG,EMBER_EXPANSION_ATLASES,EMBER_CHARACTER_ATLASES,EMBER_EXPANSION_TRANSITIONS,
  EXPANSION_ROOT,expansionFileUrl,atlasFrameRect,drawExpansionFrame,worldAtIndex
} from "../src/emberExpansionCatalog.js";

test("five distinct playtest worlds remain unlocked in order",()=>{
  assert.deepEqual(EMBER_WORLD_CATALOG.map(w=>w.index),[0,1,2,3,4]);
  assert.equal(new Set(EMBER_WORLD_CATALOG.map(w=>w.id)).size,5);
  assert.ok(EMBER_WORLD_CATALOG.every(w=>w.playtestUnlocked));
  assert.equal(worldAtIndex(4)?.boss,"mole-king");
  assert.equal(worldAtIndex(6),null);
});
test("seven sprite atlas metadata records account for 54 frames",()=>{
  const records=Object.entries(EMBER_EXPANSION_ATLASES);
  assert.equal(records.length,7);
  assert.equal(records.reduce((sum,[,a])=>sum+a.frames,0),54);
  for(const [id,a] of records){
    assert.equal(a.columns*a.rows,a.frames);
    assert.ok(a.file.endsWith(".webp"));
    assert.ok(a.file.startsWith("atlases/"));
    assert.deepEqual(atlasFrameRect(id,0),{sx:0,sy:0,sw:a.cell,sh:a.cell});
    const final=atlasFrameRect(id,a.frames-1);
    assert.equal(final.sx+final.sw,a.columns*a.cell);
    assert.equal(final.sy+final.sh,a.rows*a.cell);
    assert.throws(()=>atlasFrameRect(id,a.frames),RangeError);
  }
  assert.throws(()=>atlasFrameRect("missing",0),RangeError);
});
test("transition and sprite paths remain relative to the expansion namespace",()=>{
  assert.equal(Object.keys(EMBER_EXPANSION_TRANSITIONS).length,3);
  for(const pathname of Object.values(EMBER_EXPANSION_TRANSITIONS)){
    assert.equal(expansionFileUrl(pathname),EXPANSION_ROOT+pathname);
    assert.ok(pathname.startsWith("transitions/"));
    assert.ok(pathname.endsWith(".webp"));
  }
});
test("draw helper is inert if art is absent and uses exact registered sheet cells otherwise",()=>{
  assert.equal(drawExpansionFrame(null,null,"mole-king",0,0,0,70,70),false);
  assert.equal(drawExpansionFrame({}, {complete:true,naturalWidth:0,naturalHeight:0},"mole-king",0,0,0,70,70),false);
  const calls=[];
  const ctx={drawImage(...args){calls.push(args)}};
  const img={complete:true,naturalWidth:1536,naturalHeight:1152};
  assert.equal(drawExpansionFrame(ctx,img,"mole-king",7,30,40,70,80),true);
  assert.deepEqual(calls[0],[img,1152,384,384,384,30,40,70,80]);
  assert.equal(drawExpansionFrame(ctx,{complete:true,naturalWidth:100,naturalHeight:100},"mole-king",7,0,0,30,30),false);
});

test("nine imported 12-frame boss and animated hazard atlases are mounted for review",()=>{
  assert.equal(Object.keys(EMBER_CHARACTER_ATLASES).length,2);
  assert.equal(EMBER_CHARACTER_ATLASES.cinderclaw.frames,12);
  assert.equal(EMBER_CHARACTER_ATLASES.copperjack.cell,512);
  assert.deepEqual(atlasFrameRect("cinderclaw",11),{sx:1152,sy:768,sw:384,sh:384});
  assert.deepEqual(atlasFrameRect("copperjack",11),{sx:1536,sy:1024,sw:512,sh:512});
  const all=[...Object.values(EMBER_EXPANSION_ATLASES),...Object.values(EMBER_CHARACTER_ATLASES)];
  for(const atlas of all){
    const file="public/ember-drill/expansion-batch-c/"+atlas.file;
    const bytes=fs.readFileSync(file);
    assert.ok(bytes.length>250000,file+" appears truncated");
    assert.equal(bytes.toString("ascii",0,4),"RIFF",file);
    assert.equal(bytes.toString("ascii",8,12),"WEBP",file);
  }
});
test("three wide transition illustrations are genuinely imported",()=>{
  for(const file of Object.values(EMBER_EXPANSION_TRANSITIONS)){
    const bytes=fs.readFileSync("public/ember-drill/expansion-batch-c/"+file);
    assert.ok(bytes.length>200000,file);
    assert.equal(bytes.toString("ascii",8,12),"WEBP",file);
  }
});
