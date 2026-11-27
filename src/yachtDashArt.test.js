import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { YACHT_CHAPTERS } from "./yachtDashExpansion.js";
import { CAPTAIN_LEVELS } from "./captainLevels.js";

const root = path.resolve("public");
const manifestPath = path.join(root,"yacht-dash","asset-manifest.json");

test("Exactly 66 approved Yacht Dash images exist with valid checksums and WebP headers",()=>{
  assert.ok(fs.existsSync(manifestPath),"Approved asset manifest missing");
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf-8"));
  // 63 approved art assets + 3 generated arena UI assets from the
  // touch-tuning round (dash plaque, joystick base, joystick knob).
  assert.equal(manifest.assets.length,66);
  assert.equal(new Set(manifest.assets.map(asset=>asset.file)).size,66);
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


test("Approved Kuroi collision and replacement torii files are intact transparent WebP assets",()=>{
  const packPath=path.join(root,"yacht-dash","kuroi","asset-manifest.json");
  assert.ok(fs.existsSync(packPath),"Approved Kuroi manifest missing");
  const pack=JSON.parse(fs.readFileSync(packPath,"utf-8"));
  assert.equal(pack.assets.length,7);
  const approved=new Set([
    "torii-passage.webp","kuroi-charge.webp","kuroi-turn-port.webp",
    "kuroi-turn-starboard.webp","kuroi-impact.webp","kuroi-recoil.webp",
    "kuroi-collision-splash.webp"
  ]);
  for(const asset of pack.assets){
    const name=path.basename(asset.file);
    assert.ok(approved.delete(name),"Unexpected or duplicate new sprite: "+name);
    const filename=path.join(root,asset.file.slice(1));
    assert.ok(fs.existsSync(filename),"Missing Kuroi art: "+filename);
    const bytes=fs.readFileSync(filename);
    assert.ok(bytes.length>30000,"Sprite unexpectedly tiny: "+filename);
    assert.equal(bytes.length,asset.size,"Sprite byte count mismatch: "+filename);
    assert.equal(bytes.toString("ascii",0,4),"RIFF");
    assert.equal(bytes.toString("ascii",8,12),"WEBP");
    assert.equal(bytes.toString("ascii",12,16),"VP8X");
    assert.ok(bytes[20]&0x10,"Sprite must have real alpha transparency: "+filename);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),
      asset.sha256,"Changed approved sprite without updating manifest: "+filename);
  }
  assert.equal(approved.size,0,"Missing planned assets from manifest");
});
