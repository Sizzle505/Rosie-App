/**
 * Optional Ember Tunnel expansion catalog.
 * This is intentionally inert until reviewed binaries are installed.
 * It does not replace the approved vehicle or change the existing 75s run.
 */
export const EXPANSION_ROOT="/ember-drill/expansion-batch-c/";
const immutable=(value)=>Object.freeze(value);

export const EMBER_WORLD_CATALOG=immutable([
  immutable({id:"barkroot",name:"Barkroot Passage",index:0,mechanic:"Excavate weakened earth",boss:null,background:"existing",playtestUnlocked:true}),
  immutable({id:"ruby",name:"Ruby Temple Galleries",index:1,mechanic:"Outrun crystal shutters",boss:null,background:"existing",playtestUnlocked:true}),
  immutable({id:"clockwork",name:"Clockwork Catacombs",index:2,mechanic:"Navigate piston and gear traps",boss:"copperjack",background:"pending",playtestUnlocked:true}),
  immutable({id:"molten",name:"Molten Depths",index:3,mechanic:"Avoid eruptions and falling basalt",boss:"cinderclaw",background:"pending",playtestUnlocked:true}),
  immutable({id:"treasury",name:"Royal Treasury",index:4,mechanic:"Defeat the Mole King and reclaim the treasury",boss:"mole-king",background:"pending",playtestUnlocked:true})
]);
export const EMBER_EXPANSION_ATLASES=immutable({
  "mole-king":immutable({file:"atlases/mole-king-atlas.webp",columns:4,rows:3,cell:384,frames:12}),
  "gear-crusher":immutable({file:"atlases/gear-crusher-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "lava-geyser":immutable({file:"atlases/lava-geyser-atlas.webp",columns:3,rows:2,cell:512,frames:6}),
  "falling-basalt":immutable({file:"atlases/falling-basalt-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "royal-earth-burst":immutable({file:"atlases/royal-earth-burst-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "world-markers":immutable({file:"atlases/world-markers-atlas.webp",columns:3,rows:2,cell:512,frames:6}),
  "bonus-pickups":immutable({file:"atlases/bonus-pickups-atlas.webp",columns:3,rows:2,cell:512,frames:6})
});
// Boss animation sheets are supplied by the separately reviewed character packs.
// They intentionally are not part of the original seven-atlas import manifest.
export const EMBER_CHARACTER_ATLASES=immutable({
  cinderclaw:immutable({file:"atlases/cinderclaw-atlas.webp",columns:4,rows:3,cell:384,frames:12}),
  copperjack:immutable({file:"atlases/copperjack-atlas.webp",columns:4,rows:3,cell:512,frames:12})
});
export const EMBER_EXPANSION_TRANSITIONS=immutable({
  "ruby-clockwork":"transitions/ruby-clockwork.webp",
  "clockwork-molten":"transitions/clockwork-molten.webp",
  "molten-treasury":"transitions/molten-treasury.webp"
});
export const expansionFileUrl=(relative)=>EXPANSION_ROOT+relative;
// ---------------------------------------------------------------------------
// Batch D (Ember Tunnel expansion, INTEGRATION.md). A separate registry: the
// batch-C atlas metadata above is untouched, and atlasFrameRect below looks
// both maps up. All files live under public/ember-drill/expansion-batch-d/.
// Resolved against current main (630f636), not the older reference branch
// work/tunnel-earned-turbo-20261123 (PR #230) the handoff was written for:
//   - Boss health as shipped was 2/3/4 (copperjack/cinderclaw/mole-king);
//     Mitchell's 2026-11-25 feedback round equalized all three at the
//     Mole King's 4, with 55s clocks. See emberBossEncounter.js.
//   - Stage durations as shipped are 15/15/30/40/40, not the handoff's
//     30/30 for the first two stages. See emberExpeditionStages.js.
//   - There is no 2.8s recovery in main (recoveries are 1.30-1.55s), and
//     no bossRewardY / spillBossRewards symbol existed; the earned-Turbo
//     reward loop is implemented in emberExpeditionBossStage.js.
// ---------------------------------------------------------------------------
export const BATCH_D_ROOT="/ember-drill/expansion-batch-d/";
export const batchDFileUrl=(relative)=>BATCH_D_ROOT+relative;
const attackFrames=Object.freeze({warning:Object.freeze([0,1,2]),active:Object.freeze([3,4,5]),recovery:Object.freeze([6,7])});
const mechanismDurations=Object.freeze([80,90,90,100,110,120,120,140]);
export const EMBER_BATCH_D_ATLASES=immutable({
  "gear-sweep":immutable({file:"boss-combat/attacks/gear-sweep-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:false}),
  "spark-bolt":immutable({file:"boss-combat/attacks/spark-bolt-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:true}),
  "fireball":immutable({file:"boss-combat/attacks/fireball-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:true}),
  "burrow":immutable({file:"boss-combat/attacks/burrow-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:false}),
  "quake":immutable({file:"boss-combat/attacks/quake-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:false}),
  "earth-burst":immutable({file:"boss-combat/attacks/earth-burst-atlas.webp",columns:4,rows:2,cell:384,frames:8,phaseFrames:attackFrames,recoveryVisualSeconds:0.35,flipX:false}),
  "treasure-absorb":immutable({file:"combat-effects/treasure-absorb-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:65,displaySize:144,loop:false}),
  "turbo-ready":immutable({file:"combat-effects/turbo-ready-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:90,displaySize:230,loop:true}),
  "turbo-exhaust":immutable({file:"combat-effects/turbo-exhaust-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:65,displaySize:300,loop:true}),
  "drill-impact":immutable({file:"combat-effects/drill-impact-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:35,displaySize:185,loop:false}),
  "treasure-spill":immutable({file:"combat-effects/treasure-spill-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:50,displaySize:180,loop:false}),
  "defeat-copperjack":immutable({file:"combat-effects/defeat-copperjack-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:75,displaySize:290,loop:false}),
  "defeat-cinderclaw":immutable({file:"combat-effects/defeat-cinderclaw-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:75,displaySize:290,loop:false}),
  "defeat-moleking":immutable({file:"combat-effects/defeat-moleking-atlas.webp",columns:4,rows:3,cell:384,frames:12,frameDurationMs:75,displaySize:290,loop:false}),
  "mechanism-brass-dispenser":immutable({file:"treasure-mechanisms/17-brass-dispenser-opening-atlas.webp",columns:4,rows:2,cell:320,frames:8,frameDurationsMs:mechanismDurations,releaseAtFrame:4,loop:false}),
  "mechanism-volcanic-deposit":immutable({file:"treasure-mechanisms/20-volcanic-deposit-eruption-atlas.webp",columns:4,rows:2,cell:320,frames:8,frameDurationsMs:mechanismDurations,releaseAtFrame:4,loop:false}),
  "mechanism-royal-chest":immutable({file:"treasure-mechanisms/23-royal-chest-opening-atlas.webp",columns:4,rows:2,cell:320,frames:8,frameDurationsMs:mechanismDurations,releaseAtFrame:4,loop:false}),
  "gate-clockwork-opening":immutable({file:"gates/51-clockwork-gateway-opening.webp",columns:4,rows:2,cell:512,frames:8,frameDurationMs:110,loop:false}),
  "gate-royal-treasury-opening":immutable({file:"gates/55-royal-treasury-vault-opening.webp",columns:4,rows:3,cell:512,frames:12,frameDurationMs:100,loop:false})
});
// Frame index for a batch-D atlas at elapsed milliseconds. Non-uniform
// per-frame durations (mechanisms) use cumulative boundaries; uniform
// frameDurationMs atlases divide evenly. Looping atlases wrap; one-shot
// atlases clamp at the last frame (hold last frame).
export function batchDFrameAt(id,elapsedMs){
  const a=EMBER_BATCH_D_ATLASES[id];
  if(!a)throw new RangeError("Unknown batch-D atlas: "+id);
  const total=Array.isArray(a.frameDurationsMs)
    ?a.frameDurationsMs.reduce((sum,n)=>sum+n,0)
    :Number.isFinite(a.frameDurationMs)?a.frames*a.frameDurationMs:0;
  let ms=Math.max(0,Number.isFinite(elapsedMs)?elapsedMs:0);
  if(a.loop&&total>0)ms=ms%total;
  if(Array.isArray(a.frameDurationsMs)){
    let acc=0;
    for(let i=0;i<a.frameDurationsMs.length;i++){
      acc+=a.frameDurationsMs[i];
      if(ms<acc)return i;
    }
    return a.frames-1;
  }
  if(Number.isFinite(a.frameDurationMs))return Math.min(a.frames-1,Math.floor(ms/a.frameDurationMs));
  return 0;
}
// Boss arenas: opaque 1035x1230 scenic bases. Aspect 1035/1230 matches the
// 690x820 canvas exactly, so cover is an exact fit with no crop.
export const EMBER_BATCH_D_ARENAS=immutable({
  copperjack:immutable({file:"boss-combat/arenas/copperjack-arena.webp",width:1035,height:1230}),
  cinderclaw:immutable({file:"boss-combat/arenas/cinderclaw-arena.webp",width:1035,height:1230}),
  "mole-king":immutable({file:"boss-combat/arenas/mole-king-arena.webp",width:1035,height:1230})
});
// Terrain ribbons, indexed by stage 0-4. Classic (stageIndex null) keeps the
// existing edge/barkroot pair and the natural-cave fallback; it is not here.
export const EMBER_BATCH_D_RIBBONS=immutable([
  immutable({ceiling:"terrain/barkroot-passage-ceiling.webp",floor:"terrain/barkroot-passage-floor.webp"}),
  immutable({ceiling:"terrain/ruby-temple-ceiling.webp",floor:"terrain/ruby-temple-floor.webp"}),
  immutable({ceiling:"terrain/clockwork-catacombs-ceiling.webp",floor:"terrain/clockwork-catacombs-floor.webp"}),
  immutable({ceiling:"terrain/molten-depths-ceiling.webp",floor:"terrain/molten-depths-floor.webp"}),
  immutable({ceiling:"terrain/royal-treasury-ceiling.webp",floor:"terrain/royal-treasury-floor.webp"})
]);
// Gates 46-55, indexed by stage. Clockwork/Treasury entrances are the
// opening atlases (play once, hold last); their exits are the matching
// closed statics, which are complete gateway images in their own right.
export const EMBER_BATCH_D_GATES=immutable([
  immutable({entrance:immutable({file:"gates/46-barkroot-entrance.webp",kind:"sprite",width:768,height:512}),exit:immutable({file:"gates/47-barkroot-exit.webp",kind:"sprite",width:768,height:512})}),
  immutable({entrance:immutable({file:"gates/48-ruby-temple-entrance.webp",kind:"sprite",width:768,height:512}),exit:immutable({file:"gates/49-ruby-temple-exit.webp",kind:"sprite",width:768,height:512})}),
  immutable({entrance:immutable({file:"gates/51-clockwork-gateway-opening.webp",kind:"atlas",atlasId:"gate-clockwork-opening",width:512,height:512}),exit:immutable({file:"gates/50-clockwork-gateway-closed.webp",kind:"sprite",width:512,height:512})}),
  immutable({entrance:immutable({file:"gates/52-molten-depths-entrance.webp",kind:"sprite",width:768,height:512}),exit:immutable({file:"gates/53-molten-depths-cooled-exit.webp",kind:"sprite",width:768,height:512})}),
  immutable({entrance:immutable({file:"gates/55-royal-treasury-vault-opening.webp",kind:"atlas",atlasId:"gate-royal-treasury-opening",width:512,height:512}),exit:immutable({file:"gates/54-royal-treasury-vault-closed.webp",kind:"sprite",width:512,height:512})})
]);
// Treasure mechanisms 16-24, keyed by boss kind. Bottom-center anchor
// (160,296) in the 320x320 cell; display width 145 game units.
export const EMBER_BATCH_D_MECHANISMS=immutable({
  copperjack:immutable({closed:"treasure-mechanisms/16-brass-dispenser-closed.webp",release:"mechanism-brass-dispenser",depleted:"treasure-mechanisms/18-brass-dispenser-emptied.webp",pickup:"gameplay/pickups/clockwork-cog.webp",anchor:immutable([160,296]),displayWidth:145}),
  cinderclaw:immutable({closed:"treasure-mechanisms/19-volcanic-deposit-intact.webp",release:"mechanism-volcanic-deposit",depleted:"treasure-mechanisms/21-volcanic-deposit-depleted.webp",pickup:"gameplay/pickups/ruby-treasure.webp",anchor:immutable([160,296]),displayWidth:145}),
  "mole-king":immutable({closed:"treasure-mechanisms/22-royal-chest-closed.webp",release:"mechanism-royal-chest",depleted:"treasure-mechanisms/24-royal-chest-emptied.webp",pickup:"gameplay/pickups/royal-crown.webp",anchor:immutable([160,296]),displayWidth:145})
});
// Route pickup art is a visual mapping by kingdom only; the engine's pickup
// kind, score and counters are unchanged. Molten has no dedicated pickup in
// the pack, so it uses the universal cheese treat.
export const EMBER_BATCH_D_PICKUP_BY_STAGE=immutable([
  "gameplay/pickups/barkroot-acorn.webp",
  "gameplay/pickups/ruby-treasure.webp",
  "gameplay/pickups/clockwork-cog.webp",
  "gameplay/pickups/cheese-treat.webp",
  "gameplay/pickups/royal-crown.webp"
]);
// Route rock visual substitution by kingdom, at the existing draw size (92).
// The spike (rotating temple wheel) is substituted only in Clockwork, where
// the gear keeps the same rotation and therefore the same anticipation;
// elsewhere the original wheel stays. Hanging mine, steam vent and lava
// vent have no suitable existing collision object that is not already an
// animated atlas, so they are not substituted.
export const EMBER_BATCH_D_ROCK_BY_STAGE=immutable([
  null,
  "gameplay/obstacles/ruby-crystal-spikes.webp",
  "gameplay/obstacles/clockwork-gear.webp",
  "gameplay/obstacles/molten-obsidian-boulder.webp",
  "gameplay/obstacles/royal-vault-rock.webp"
]);
export const EMBER_BATCH_D_SPIKE_BY_STAGE=immutable([
  null,null,"gameplay/obstacles/clockwork-gear.webp",null,null
]);
export function atlasFrameRect(id,frame){
  const a=EMBER_EXPANSION_ATLASES[id]||EMBER_CHARACTER_ATLASES[id]||EMBER_BATCH_D_ATLASES[id];
  if(!a)throw new RangeError("Unknown Ember atlas: "+id);
  if(!Number.isInteger(frame)||frame<0||frame>=a.frames)throw new RangeError("Invalid "+id+" frame: "+frame);
  return immutable({sx:frame%a.columns*a.cell,sy:Math.floor(frame/a.columns)*a.cell,sw:a.cell,sh:a.cell});
}
export function drawExpansionFrame(ctx,image,id,frame,x,y,width,height){
  // Assets are optional during review: the published two-passage course never
  // draws an absent file as a broken placeholder or changes its collision box.
  if(!ctx||!image?.complete||!(image.naturalWidth>0)||!(image.naturalHeight>0))return false;
  const {sx,sy,sw,sh}=atlasFrameRect(id,frame);
  if(sx+sw>image.naturalWidth||sy+sh>image.naturalHeight)return false;
  ctx.drawImage(image,sx,sy,sw,sh,x,y,width,height);
  return true;
}
export function worldAtIndex(index){
  return EMBER_WORLD_CATALOG.find(world=>world.index===index)||null;
}
