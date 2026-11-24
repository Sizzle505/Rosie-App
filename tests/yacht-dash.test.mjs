import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  yachtAssetScale,
  yachtRivalAttackLane,
  yachtRivalSpriteFor,
  yachtThreatForecast,
  yachtWaveFor,
  yachtCatchStart,
  yachtFollowUpRewardLane,
  yachtSakuraDelivery,
  yachtPacedWaveFor,
  yachtRunSeconds,
  yachtSceneSeconds,
  yachtSceneIndex,
  yachtPickupApproachAt,
  yachtApproachAt,
  yachtMovementMultiplier,
  yachtSpawnInterval,
  isYachtHazard,
  YACHT_EXTRA_TREAT_MS
} from "../src/yachtDashExpansion.js";
import { ROSIE_MUSIC, sceneMusicTrack } from "../src/rosieMusicCatalog.js";

const asset = (name) => `/yacht-dash/obstacles/${name}.webp`;

test("Kuroi continues straight when Rosie remains in his lane", () => {
  for (const lane of [0, 1, 2]) {
    assert.equal(yachtRivalAttackLane(lane, lane), lane);
  }
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", lane: 1, drifted: true, turned: false }),
    /kuroi-charge\.webp$/
  );
});

test("Kuroi turns no more than one lane toward Rosie", () => {
  assert.equal(yachtRivalAttackLane(0, 1), 1);
  assert.equal(yachtRivalAttackLane(1, 0), 0);
  assert.equal(yachtRivalAttackLane(1, 2), 2);
  assert.equal(yachtRivalAttackLane(2, 1), 1);
  assert.equal(yachtRivalAttackLane(0, 2), 1);
  assert.equal(yachtRivalAttackLane(2, 0), 1);
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", drifted: true, turned: true, driftFrom: 2, driftTo: 1 }),
    /kuroi-turn-port\.webp$/
  );
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", drifted: true, turned: true, driftFrom: 0, driftTo: 1 }),
    /kuroi-turn-starboard\.webp$/
  );
});

test("Forecast and follow-up treats account for Rosie's current attack lane", () => {
  const incoming = [{ kind: "rival", lane: 0, y: 45, drifted: false }];
  assert.deepEqual(yachtThreatForecast(incoming, 0).blocked, [0]);
  assert.deepEqual(yachtThreatForecast(incoming, 1).blocked, [1]);
  assert.equal(yachtFollowUpRewardLane([{ kind: "rival", lane: 0 }], 0), 1);
});

test("Kuroi's authored waves do not force a turn away from Rosie", () => {
  const encounter = yachtWaveFor("moonlight", 4, () => 0)[0];
  assert.equal(encounter.kind, "rival");
  assert.equal(Object.hasOwn(encounter, "driftTo"), false);
  assert.equal(yachtCatchStart(encounter), 74);
});

test("Latest Yacht Dash sizing changes are exact relative to the previous release", () => {
  const previous = {
    "fishing-skiff": 2.7, "fan-raft": 1.27,
    "moonlight-race-buoy": 2.76, "regatta-beacon": 2.76,
    "barrel-raft": 0.78, "taiko-barge": 0.80,
    "cargo-crate": 1.20, "drift-net": 1
  };
  const multiplier = {
    "fishing-skiff": 1.30, "fan-raft": 1.40,
    "moonlight-race-buoy": 1.20, "regatta-beacon": 1.20,
    "barrel-raft": 0.75 * .9, "taiko-barge": 0.80,
    "cargo-crate": 1.25, "drift-net": 1.65
  };
  for (const [name, scale] of Object.entries(previous)) {
    const expected = scale * multiplier[name];
    assert.ok(Math.abs(yachtAssetScale(asset(name)) - expected) < 1e-9,
      `${name}: expected ${expected}x`);
  }
  for (const phase of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard"]) {
    assert.ok(Math.abs(yachtAssetScale(`/yacht-dash/kuroi/${phase}.webp`) -
      (1.35 * 1.65 * 1.20)) < 1e-9,
      `${phase} must not shrink when Kuroi starts turning`);
  }
});

test("All authored Yacht Dash hazards have real WebP files, not invisible sprites", () => {
  for (const name of [
    "storm-buoy", "fishing-skiff", "drift-net", "fallen-stone-lantern",
    "moonlight-race-buoy", "regatta-beacon", "fan-raft", "reef-rocks",
    "driftwood", "lantern-raft", "taiko-barge", "barrel-raft", "cargo-crate"
  ]) {
    const bytes = readFileSync(new URL(`../public/yacht-dash/obstacles/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", name);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", name);
    assert.ok(bytes.length > 10000, `${name} artwork is not empty`);
  }
  for (const name of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard", "torii-passage"]) {
    const bytes = readFileSync(new URL(`../public/yacht-dash/kuroi/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", name);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", name);
    assert.ok(bytes.length > 10000, `${name} artwork is not empty`);
  }
});

test("Lantern raft is 35% smaller, while all Kuroi attack frames are 20% larger", () => {
  assert.equal(yachtAssetScale(asset("lantern-raft")), .65);
  for (const name of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard"]) {
    assert.ok(Math.abs(yachtAssetScale(`/yacht-dash/kuroi/${name}.webp`) - 2.673) < 1e-9);
  }
});

test("Native-resolution render for fan, crescent markers and Kuroi preserves image proportions", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/yachtDashExpansion.css", import.meta.url), "utf8");
  assert.match(game, /const nativeResArt = item.kind === "rival"/);
  assert.match(game, /"fan-raft.webp", "moonlight-race-buoy.webp", "regatta-beacon.webp"/);
  assert.match(game, /const visualScale = nativeResArt \? 1 : artScale/);
  assert.match(css, /yacht-native-resolution\.sea-pickup-rival/);
  assert.match(css, /width:calc\(98px \* var\(--yacht-asset-multiplier, 1\)\)/);
  assert.match(css, /object-fit:contain/);
});

test("The red phantom obstacle bar is removed without losing helm threat forecasts", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(game, /className="yacht-course-lane-cues"/);
  assert.match(game, /yacht-lane-forecast/);
  assert.match(game, /threatForecast\?\.blocked\.includes\(index\)/);
});

test("Torii uses one 4:3 sprite with compositor-only course travel", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/yachtDashExpansion.css", import.meta.url), "utf8");
  assert.doesNotMatch(game, /torii-front-|foregroundOpacity/);
  assert.match(game, /arch \? " yacht-smooth-arch"/);
  assert.match(game, /className="yacht-arch-art"/);
  assert.match(css, /translate3d\(-50%,var\(--approach-top,47%\),0\)/);
  assert.match(css, /\.yacht-smooth-arch \.yacht-arch-art\s*\{[\s\S]*?aspect-ratio:4\/3;/);
});

test("Driftwood master is present and is a valid RIFF WebP image", () => {
  const bytes = readFileSync(new URL("../public/yacht-dash/obstacles/driftwood.webp", import.meta.url));
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.ok(bytes.length > 10000);
});

test("Expanded Yacht chapters release bonus treats 20 percent more frequently", () => {
  assert.equal(YACHT_EXTRA_TREAT_MS, Math.round(8500 / 1.2));
  assert.ok(8500 / YACHT_EXTRA_TREAT_MS > 1.199);
  assert.ok(8500 / YACHT_EXTRA_TREAT_MS < 1.201);
});

test("Sakura's treat probability rises about 20 percent without accelerating obstacles", () => {
  const n = 70;
  const oldExpected = Array.from({length:n}, (_,step) => {
    if(step < 3) return step === 1 ? 1 : 0;
    if(step % 10 === 7 || (step % 40 === 19 && step % 3 !== 0 && step % 9 !== 0) || step % 9 === 0) return 0;
    if(step % 3 === 0) return 1;
    return .33;
  }).reduce((a,b)=>a+b,0);
  let currentExpected = 0;
  for(let step=0;step<n;step++){
    for(let roll=0;roll<100;roll++){
      const delivery=yachtSakuraDelivery(step, count => count===100 ? roll : 0);
      if(delivery.kind==="treat") currentExpected+=.01;
    }
  }
  assert.ok(currentExpected/oldExpected>1.19);
  assert.ok(currentExpected/oldExpected<1.22);
});

test("Four Yacht chapter recordings are mapped by chapter index", () => {
  const trackIds=["yacht-sakura","yacht-typhoon","yacht-moonlight","yacht-emperor"];
  const titles=["Island of Bright Winds","Storm's Edge","Moonlit Rivalry","Imperial Championship"];
  trackIds.forEach((id, chapter)=>{
    assert.equal(sceneMusicTrack("yacht","playing",{chapter}),id);
    assert.equal(ROSIE_MUSIC[id].title,titles[chapter]);
    assert.equal(ROSIE_MUSIC[id].fallback,"yacht-voyage");
    assert.equal(ROSIE_MUSIC[id].loopStartSeconds,5);
  });
  assert.equal(sceneMusicTrack("tunnel","playing",{}),"ember-tunnel");
});

test("Yacht Dash uses only an unframed sparkling cheese wedge", () => {
  const game=readFileSync(new URL("../src/main.jsx", import.meta.url),"utf8");
  const css=readFileSync(new URL("../src/yachtDashExpansion.css",import.meta.url),"utf8");
  assert.match(game,/function YachtGoldenCheeseIcon/);
  assert.match(game,/item.kind === "cheese" \? <YachtGoldenCheeseIcon \/>/);
  assert.match(game,/src="\/yacht-dash\/pickups\/sakura-golden-cheese\.png"/);
  assert.doesNotMatch(game,/item.kind === "cheese" && <small>GOLDEN<\/small>/);
  assert.match(css,/\.captain-game-page \.sea-pickup-cheese[\s\S]*?background:transparent!important/);
});

test("The first three chapters are 10 percent shorter; finale stays 75 seconds", () => {
  for(let i=0;i<4;i++){
    const duration=i===3?75:67.5;
    assert.equal(yachtRunSeconds(i),duration);
    assert.equal(yachtSceneSeconds(i),duration/5);
    for(let scene=0;scene<5;scene++)assert.equal(yachtSceneIndex(i,scene*duration/5),scene);
    assert.equal(yachtSceneIndex(i,duration),4);
  }
});
test("Treats approach on the same water track and grow subtly", () => {
  for(const y of [-12,30,77,108]){
    const pickup=yachtPickupApproachAt(y);
    assert.equal(pickup.top,yachtApproachAt(y).top);
    assert.ok(pickup.scale>=.7&&pickup.scale<=1);
  }
  assert.ok(yachtPickupApproachAt(80).scale>yachtPickupApproachAt(0).scale);
});
test("Collectible travel speed is 10% faster, supplies 25%, hazards unchanged", () => {
  for(const kind of ["ball","treat","cheese"])assert.equal(yachtMovementMultiplier(kind),1.1);
  assert.equal(yachtMovementMultiplier("supply"),1.25);
  for(const kind of ["obstacle","rival","buoy"])assert.equal(yachtMovementMultiplier(kind),1);
});
test("Additional logs and hazards retain a safe reward wave between encounters", () => {
  for(const id of ["typhoon","moonlight","emperor"]){
    const plan=Array.from({length:35},(_,i)=>yachtPacedWaveFor(id,i,()=>1,3)[0]);
    assert.ok(plan.some(x=>x.asset?.endsWith("/driftwood.webp")),id+" has driftwood");
    assert.ok(plan.filter(x=>isYachtHazard(x.kind)).length>=8,id+" has enough hazards");
    for(let i=1;i<plan.length;i++)assert.ok(!(isYachtHazard(plan[i-1].kind)&&isYachtHazard(plan[i].kind)));
    assert.equal(plan.filter(x=>x.kind==="supply").length,1);
  }
});

test("Approved Sakura cheese PNG has a real alpha channel and mobile-ready dimensions", () => {
  const bytes = readFileSync(new URL("../public/yacht-dash/pickups/sakura-golden-cheese.png", import.meta.url));
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16),512);
  assert.equal(bytes.readUInt32BE(20),512);
  assert.equal(bytes[25],6);
  assert.ok(bytes.length < 300000);
});
