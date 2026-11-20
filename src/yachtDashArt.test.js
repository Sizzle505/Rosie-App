import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { YACHT_CHAPTERS } from "./yachtDashExpansion.js";
import { CAPTAIN_LEVELS } from "./captainLevels.js";

const root = path.resolve("public");
const manifestPath = path.join(root,"yacht-dash","asset-manifest.json");

test("Exactly 39 approved Yacht Dash images exist with valid checksums and WebP headers",()=>{
  assert.ok(fs.existsSync(manifestPath),"Approved asset manifest missing");
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf-8"));
  assert.equal(manifest.assets.length,39);
  assert.equal(new Set(manifest.assets.map(asset=>asset.file)).size,39);
  for(const asset of manifest.assets){
    assert.ok(/^\/yacht-dash\/[a-z0-9/-]+\.webp$/.test(asset.file),"Unsafe asset path: "+asset.file);
    const filename=path.join(root,asset.file.slice(1));
    assert.ok(fs.existsSync(filename),"Missing art: "+filename);
    const contents=fs.readFileSync(filename);
    assert.ok(contents.length>10_000,"Empty or truncated asset: "+filename);
    assert.equal(contents.length,asset.size,"Size mismatch: "+filename);
    assert.equal(contents.subarray(0,4).toString("ascii"),"RIFF");
    assert.equal(contents.subarray(8,12).toString("ascii"),"WEBP");
    assert.equal(crypto.createHash("sha256").update(contents).digest("hex"),
      asset.sha256,"Checksum mismatch: "+filename);
  }
});

test("Every new scene and victory screen is in the approved package",()=>{
  const approved=new Set(JSON.parse(fs.readFileSync(manifestPath,"utf-8")).assets.map(a=>a.file));
  for(const chapter of YACHT_CHAPTERS) {
    assert.ok(approved.has(chapter.victory),"Victory missing: "+chapter.victory);
    if(chapter.id==="sakura") {
      assert.equal(chapter.scenes,null,"Sakura must preserve original paintings");
    } else {
      assert.equal(chapter.scenes.length,5);
      for(const scene of chapter.scenes) assert.ok(approved.has(scene),"Stage artwork missing: "+scene);
    }
  }
  assert.equal(new Set(YACHT_CHAPTERS.flatMap(c=>c.scenes||[])).size,15);
  assert.equal(CAPTAIN_LEVELS.length,5);
});
