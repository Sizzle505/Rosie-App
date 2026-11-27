import { DRILL_WIDTH as W, DRILL_HEIGHT as H, DRILL_ANCHOR, tunnelCenter, tunnelRadius, clamp } from "./emberDrillEngine.js";
import { paintNaturalTunnel } from "./emberNaturalTunnel.js";
import { paintTunnelRibbons } from "./emberTunnelRibbons.js";
import { paintSculpturalTunnel } from "./emberTunnelSculpture.js";
import { paintOriginalAuger, paintOriginalBoostExhaust, paintTurboTip, paintTurboWorldStreaks } from "./emberAugerFX.js";
import { paintExcavationUnderlay, paintExcavationTip } from "./emberExcavationFX.js";
import { paintNewBackgroundParallax } from "./emberNewBackgrounds.js";
import { paintBreakables } from "./emberBreakablePainter.js";
import {paintCrystalShutters} from "./emberCrystalShuttersPainter.js";
import {paintExpeditionHazards} from "./emberExpeditionHazardPainter.js";
import {paintExpeditionBoss} from "./emberExpeditionBossPainter.js";
import {drawExpansionFrame,EMBER_BATCH_D_ATLASES,EMBER_BATCH_D_GATES,batchDFrameAt} from "./emberExpansionCatalog.js";

const TWO_PI = Math.PI * 2;

const artReady = i => Boolean(i && i.complete && i.naturalWidth>0);
function drawImageTrim(c,img,x,y,w,h,alpha=1){
  if(!artReady(img))return false;
  c.save();c.globalAlpha=alpha;c.drawImage(img,x,y,w,h);c.restore();return true;
}

function noise(n) { const x = Math.sin(n * 137.13 + 6.71) * 43758.5453; return x - Math.floor(x); }
function circle(c,x,y,r,color) { c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,TWO_PI);c.fill(); }
function rounded(c,x,y,w,h,r) { c.beginPath();c.roundRect(x,y,w,h,r); }
function glow(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,"rgba(255,175,59,0)");
  circle(c,x,y,r,g);
}
function polygon(c,coords,color) {
  c.beginPath();c.moveTo(coords[0],coords[1]);
  for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);
  c.closePath();c.fillStyle=color;c.fill();
}
function drawRock(c,x,y,r,seed,tint) {
  const n=noise(seed), m=noise(seed+19);
  c.save();c.translate(x,y);c.rotate((n-.5)*.8);
  polygon(c,[-r*.93,-r*.2,-r*.44,-r*.96,r*.44,-r*.85,r,r*.05,r*.51,r*.86,-r*.55,r*.67],tint);
  polygon(c,[-r*.78,-r*.21,-r*.33,-r*.85,r*.26,-r*.61,r*.25,-r*.04,-r*.49,r*.28],"rgba(255,196,121,.10)");
  polygon(c,[r*.25,-r*.6,r*.83,-r*.02,r*.42,r*.65,-r*.06,r*.09],"rgba(0,0,0,.21)");
  c.strokeStyle="rgba(255,179,96,.19)";c.lineWidth=2;c.beginPath();c.moveTo(-r*.44,-r*.96);c.lineTo(r*.44,-r*.85);c.stroke();
  if(m>.83)circle(c,-r*.17,-r*.27,Math.max(1,r*.12),"#bd7447");
  c.restore();
}
function drawStoneColumns(c,x,base,scale,index) {
  c.save();c.translate(x,base);c.scale(scale,scale);
  const z= index%2===0 ? "#66504a" : "#594746";
  c.fillStyle="rgba(11,7,19,.55)";c.fillRect(-30,-286,210,310);
  for(let col=0;col<3;col++){
    const px=col*73-15;
    c.fillStyle=z;c.fillRect(px,-252,31,242);
    c.fillStyle="#927052";c.fillRect(px-8,-253,47,20);c.fillRect(px-8,-22,47,19);
    c.fillStyle="rgba(253,189,88,.28)";c.fillRect(px+3,-238,4,209);
    c.strokeStyle="rgba(22,9,13,.5)";c.strokeRect(px,-236,31,199);
  }
  c.fillStyle="#7c5e51";c.fillRect(-23,-277,215,24);
  c.fillStyle="#b99157";c.fillRect(-30,-280,225,5);
  c.strokeStyle="#c69b5e";c.lineWidth=3;c.beginPath();c.arc(74,-178,43,Math.PI,0);c.lineTo(117,-122);c.stroke();
  c.fillStyle="#24212b";rounded(c,35,-173,78,148,34);c.fill();
  c.fillStyle="rgba(252,157,66,.5)";rounded(c,49,-160,51,134,26);c.fill();
  for(let i=0;i<4;i++){
    circle(c,75,-154+i*27,6+i*1.7,"rgba(255,226,126,.50)");
  }
  c.restore();
}
function drawLantern(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  glow(c,0,0,55,"rgba(255,184,67,.26)");
  c.strokeStyle="#c39755";c.lineWidth=3;c.beginPath();c.moveTo(0,-49);c.lineTo(0,-18);c.stroke();
  rounded(c,-14,-19,28,37,5);c.fillStyle="#63351f";c.fill();c.strokeStyle="#edba67";c.stroke();
  const g=c.createLinearGradient(0,-14,0,14);g.addColorStop(0,"#fff1ae");g.addColorStop(.5,"#ffac4c");g.addColorStop(1,"#ad401c");
  c.fillStyle=g;c.fillRect(-10,-14,20,27);
  c.strokeStyle="#7c4827";c.lineWidth=2;c.beginPath();c.moveTo(0,-15);c.lineTo(0,15);c.moveTo(-11,0);c.lineTo(11,0);c.stroke();
  c.restore();
}
// Pan inside each original painted panorama. Never repeat a full illustration
// edge-to-edge: the previous renderer exposed ugly rectangular image seams.
function panorama(c,img,progress,opacity=1){
  if(!artReady(img))return false;
  const sw=Math.min(img.naturalWidth,img.naturalHeight*W/H);
  const free=Math.max(0,img.naturalWidth-sw);
  const t=clamp(progress,0,1);
  const sx=free*(.04+.92*(t*t*(3-2*t)));
  c.save();c.globalAlpha=opacity;
  c.drawImage(img,sx,0,sw,img.naturalHeight,0,0,W,H);
  c.restore();
  return true;
}
// Three transitions are preserved from the original game. The seven newly
// generated soft-focus plates are introduced at coherent story beats.
// Classic's continuous 75s progression through the one connected cave.
const CAVERN_SCENES=[
  {at:0,key:"scenicBarkroot"},
  {at:10,key:"barkroot"},
  {at:15,key:"scenicBarkrootDeep"},
  {at:21,key:"scenicLantern"},
  {at:30,key:"scenicCrystal"},
  {at:34,key:"rubyLoop"},
  {at:39,key:"rubyOrganic"},
  {at:43,key:"scenicRubyGallery"},
  {at:47,key:"rubyOrganic"},
  {at:54,key:"templeOrganic"},
  {at:65,key:"scenicTemple"},
];
// 2026-11-25 feedback round: every world now travels ONLY through its
// own paintings. The previous design windowed one shared timeline, so
// the Royal Treasury opened on the root-passage painting, and a
// screen-blended "accent" painting ghosted through every scene —
// Barkroot visibly layered behind the other worlds. Accents and the
// cross-world transition plates are gone: one scene, one painting,
// full strength, crossfaded at the seams.
const STAGE_SCENES=[
  [{at:0,key:"scenicBarkroot"},{at:8,key:"barkroot"},{at:15,key:"scenicBarkrootDeep"},{at:22,key:"scenicLantern"}],
  [{at:0,key:"rubyLoop"},{at:9,key:"rubyOrganic"},{at:17,key:"scenicRubyGallery"}],
  [{at:0,key:"scenicClockwork"},{at:13,key:"scenicClockworkDeep"}],
  [{at:0,key:"scenicMolten"},{at:13,key:"scenicMoltenDeep"}],
  [{at:0,key:"scenicTreasury"},{at:13,key:"scenicTemple"}],
];
// Fast, eased changes keep the run moving without a conspicuous panorama flash.
const SCENE_CROSSFADE_SECONDS=.30;
// These are world-anchored scenic set pieces, NOT collectible markers.
// Actual cheese, gems, bones and treasure caches are drawn separately.
const CAVERN_FEATURES=[
  {kind:"lantern",world:1150,side:-1},
  {kind:"crystaloverlay",world:3150,side:1},
  {kind:"lantern",world:5700,side:-1},
  {kind:"crystaloverlay",world:7500,side:1},
  // The supplied gate is a complete entrance illustration, not wall terrain.
  // It is intentionally not composited into the playable tunnel.
  {kind:"lantern",world:12500,side:-1},
  {kind:"crystaloverlay",world:17700,side:1},
  {kind:"lantern",world:23400,side:-1},
];
function scenicFeatures(c,s,assets){
  for(const feature of CAVERN_FEATURES){
    const x=feature.world-s.scroll;
    if(x<-450||x>W+450)continue;
    const mid=tunnelCenter(feature.world),r=tunnelRadius(feature.world);
    if(feature.kind==="lantern"){
      const y=mid-r+56;
      const img=assets.lantern;
      if(artReady(img)){
        glow(c,x,y,95,"rgba(244,173,73,.22)");
        drawImageTrim(c,img,x-29,y-71,58,137,.88);
      }
    } else if(feature.kind==="crystaloverlay"){
      // The supplied giant panel contains a rectangular painted backdrop.
      // Replace it with standalone illustrated crystal pieces embedded in rock.
      const img=assets.gem;
      if(!artReady(img))continue;
      const y=mid+r-23;
      for(let k=0;k<5;k++){
        const offset=(k-2)*24;
        const h=27+(k%3)*9;
        glow(c,x+offset,y-h*.35,17,"rgba(249,92,125,.15)");
        drawImageTrim(c,img,x+offset-10,y-h,20,h,.62);
      }
    }
  }
}
function scenery(c,s,assets={}) {
  c.fillStyle="#23151d";c.fillRect(0,0,W,H);
  // A selected world uses its own scene progression on its own clock;
  // Classic uses the continuous cave timeline. Either way the run is
  // one place: no foreign paintings blended over the scene.
  const scenes=s.stageIndex===null?CAVERN_SCENES
    :STAGE_SCENES[Math.max(0,Math.min(4,s.stageIndex))];
  const sceneTime=s.time;
  let current=0;
  for(let i=1;i<scenes.length;i++){
    if(sceneTime>=scenes[i].at)current=i;
  }
  const scene=scenes[current];
  const nextAt=scenes[current+1]?.at??(s.stageIndex===null?75:(s.duration||30));
  const duration=Math.max(1,nextAt-scene.at);
  const local=clamp((sceneTime-scene.at)/duration,0,1);
  if(current>0){
    const prev=scenes[current-1];
    const fade=clamp((sceneTime-scene.at)/SCENE_CROSSFADE_SECONDS,0,1);
    const eased=fade*fade*(3-2*fade);
    panorama(c,assets[prev.key]||assets.scenicBarkroot,1,1);
    panorama(c,assets[scene.key]||assets.scenicBarkroot,local,eased);
  }else{
    panorama(c,assets[scene.key]||assets.scenicBarkroot,local,1);
  }
  paintNewBackgroundParallax(c,s,assets,W,H);
  // Keep architecture and crystals legible inside the playable corridor.
  const tint=c.createLinearGradient(0,0,0,H);
  tint.addColorStop(0,"rgba(17,10,18,.13)");
  tint.addColorStop(.43,"rgba(12,9,15,.02)");
  tint.addColorStop(1,"rgba(13,9,15,.17)");
  c.fillStyle=tint;c.fillRect(0,0,W,H);
  scenicFeatures(c,s,assets);
  for(let i=0;i<29;i++){
    const x=((i*127-s.scroll*.12)%(W+70)+W+70)%(W+70)-30;
    const y=55+noise(i+19)*(H-110);
    circle(c,x,y,noise(i+31)*1.9+.3,i%3?"rgba(246,185,94,.19)":"rgba(119,163,198,.15)");
  }
}

// Boss arena: the matching opaque 1035x1230 scenic base, replacing the
// route panorama, transition plate, parallax and route scenery while a boss
// is active. Aspect matches the 690x820 canvas exactly (cover = exact fit).
// A brief 0.4s fade at spawn is the clean transition; afterwards it is
// fully opaque. The corridor shading (wallDepth) is kept so the playable
// boundary stays readable.
function paintBossArena(c,s,assets){
  if(!s.boss)return false;
  const arena=assets["bd:arena"];
  if(!artReady(arena))return false;
  const fade=s.bossSpawnedAt!=null?clamp((s.time-s.bossSpawnedAt)/0.4,0,1):1;
  c.save();c.globalAlpha=fade;
  c.drawImage(arena,0,0,W,H);
  c.restore();
  return true;
}
// Gates 46-55: scenic transition set pieces, world-anchored, behind the
// vehicle and pickups, never solid barriers. The entrance frames the
// drill at spawn and scrolls off with the world; the exit is anchored
// by the engine in the last 1.6s of a world run. Opening atlases
// play once from stage start and hold the last frame. No time is removed
// from the playable route. Suppressed during a boss (the arena is the
// finale) and in Classic, which has no batch-D gate.
function drawGate(c,s,assets,gate,worldX,key,width=517,glowAlpha=0){
  const x=worldX-s.scroll;
  const w=width,h=Math.round(w*gate.height/gate.width);
  if(x<-w||x>W+w)return;
  const floorY=tunnelCenter(worldX)+tunnelRadius(worldX);
  const dx=x-w/2,dy=floorY-h;
  // Light spills from the opening so the gate reads as a doorway, not
  // scenery: a warm glow centered in the arch, drawn before the art.
  if(glowAlpha>0){
    c.save();c.globalCompositeOperation="screen";
    const g=c.createRadialGradient(x,floorY-h*.46,8,x,floorY-h*.46,w*.5);
    g.addColorStop(0,"rgba(255,205,105,"+glowAlpha+")");
    g.addColorStop(1,"rgba(255,175,59,0)");
    c.fillStyle=g;c.beginPath();c.arc(x,floorY-h*.46,w*.5,0,TWO_PI);c.fill();
    c.restore();
  }
  if(gate.kind==="atlas"){
    const img=assets[key];
    if(artReady(img)){
      const frame=batchDFrameAt(gate.atlasId,s.time*1000);
      drawExpansionFrame(c,img,gate.atlasId,frame,dx,dy,w,h);
    }
    return;
  }
  drawImageTrim(c,assets[key],dx,dy,w,h);
}
function paintGates(c,s,assets){
  if(!Number.isInteger(s.stageIndex)||s.stageIndex<0||s.stageIndex>4||s.boss)return;
  const gates=EMBER_BATCH_D_GATES[s.stageIndex];
  if(!gates)return;
  // Round 10b (Mitchell): the entrance and exit tunnels are LARGER
  // and the drill meets them, never passes them. The entrance is
  // centered on the drill anchor (720 wide — for the 768x512 sprite
  // gates that is 480 tall, essentially the full corridor height) so
  // the run visibly STARTS inside its opening and drives out of it;
  // the exit (700 wide) is clamped by the engine at the same anchor,
  // and the finish animation drives her into its opening. Stronger
  // spill on the exit — daylight beyond the arch.
  drawGate(c,s,assets,gates.entrance,(s.stageStartX||0)+DRILL_ANCHOR,"bd:gate-entrance",720,.35);
  if(s.exitGateX!=null)drawGate(c,s,assets,gates.exit,s.exitGateX,"bd:gate-exit",700,.55);
}
// Boss rewards: the four earned-Turbo pickups, drawn with the kingdom's
// pickup art at the suggested 55px, in front of the boss and mechanism.
function paintBossRewards(c,s,assets){
  if(!s.boss||!s.bossRewards||s.bossRewards.length===0)return;
  const img=assets["bd:pickup"];
  for(const r of s.bossRewards){
    if(r.taken)continue;
    const size=55;
    glow(c,r.x,r.y,size*.8,"rgba(255,188,89,.20)");
    if(artReady(img))drawImageTrim(c,img,r.x-size/2,r.y-size/2,size,size);
    else if(artReady(assets.gem))drawImageTrim(c,assets.gem,r.x-size/2,r.y-size/2,size,size);
  }
}
function wallDepth(c,s){
 const step=8;
 for(const side of [-1,1]){
  c.save();c.beginPath();
  if(side<0){c.moveTo(-step,-6);c.lineTo(W+step,-6)}
  else {c.moveTo(-step,H+6);c.lineTo(W+step,H+6)}
  for(let x=W+step;x>=-step;x-=step){
   const world=s.scroll+x;
   const edge=tunnelCenter(world)+side*tunnelRadius(world);
   c.lineTo(x,edge);
  }
  c.closePath();c.clip();
  const boundary=tunnelCenter(s.scroll+W*.5)+side*tunnelRadius(s.scroll+W*.5);
  const shade=c.createLinearGradient(0,side<0?0:boundary,0,side<0?boundary:H);
  if(side<0){
   shade.addColorStop(0,"rgba(15,10,12,.57)");
   shade.addColorStop(1,"rgba(22,11,12,.17)");
  }else{
   shade.addColorStop(0,"rgba(22,11,13,.18)");
   shade.addColorStop(1,"rgba(14,8,12,.56)");
  }
  c.fillStyle=shade;c.fillRect(0,0,W,H);
  c.restore();
 }
}
function pickup(c,o,s,assets={}){
  // Batch-D kingdom pickup art is a visual mapping by kingdom only; the
  // engine's pickup kind, score and counters are unchanged. Falls back to
  // the batch-C kind-based atlas, then to the Classic art.
  if(s.stageIndex!==null&&!o.taken&&["bone","cheese","gem"].includes(o.kind)){
    const kingdom=assets["bd:pickup"];
    if(artReady(kingdom)){
      const x=o.x-s.scroll,y=o.y+Math.sin(s.time*5+o.id)*2;
      if(x>=-70&&x<=W+70){
        const size=55;
        glow(c,x,y,size*.7,"rgba(255,188,89,.15)");
        drawImageTrim(c,kingdom,x-size/2,y-size/2,size,size);
        return;
      }
    }
  }
  // Newly illustrated bonus icons are limited to the five optional worlds.
  // Classic collectibles retain their already-approved appearances.
  if(s.stageIndex!==null&&!o.taken&&["bone","cheese","gem"].includes(o.kind)){
    const frame=o.kind==="bone"?0:o.kind==="cheese"?1:o.id%3===0?2:3;
    const x=o.x-s.scroll,y=o.y+Math.sin(s.time*5+o.id)*2;
    if(x>=-70&&x<=W+70){
      const size=74;
      const illustrated=assets["exp:bonus-pickups"];
      if(artReady(illustrated)){
        glow(c,x,y,size*.7,"rgba(255,188,89,.15)");
        if(drawExpansionFrame(c,illustrated,"bonus-pickups",frame,
          x-size/2,y-size/2,size,size))return;
      }
    }
  }
  const img=o.kind==='cache'?(assets.chest||assets.cache):
    o.kind==='gem'&&o.id%7===0?(assets.coin||assets.gem):
    assets[o.kind==='bone'?'bone':o.kind==='cheese'?'cheese':o.kind==='gem'?'gem':'nonexistent'];
  if(artReady(img) && !o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-70&&x<=W+70){const sz=o.kind==='cache'?97:70; glow(c,x,y,sz*.8,'rgba(255,182,76,.20)');drawImageTrim(c,img,x-sz/2,y-sz/2+Math.sin(s.time*5+o.id)*2,sz,sz);return;}}

  const x=o.x-s.scroll,y=o.y;
  if(x< -80||x>W+90||o.taken)return;
  c.save();c.translate(x,y);const bob=Math.sin(s.time*5+o.id)*3;c.translate(0,bob);
  const isCache=o.kind==="cache";glow(c,0,0,isCache?57:35,isCache?"rgba(255,216,86,.30)":"rgba(255,163,68,.23)");
  c.lineWidth=3;c.strokeStyle="rgba(255,224,140,.75)";
  if(o.kind==="bone"){
    c.rotate(-.15);c.fillStyle="#ffe2a0";rounded(c,-17,-7,34,14,6);c.fill();for(const xx of [-17,17])for(const yy of [-7,7])circle(c,xx,yy,8,"#ffe4a1");c.strokeStyle="#be8142";c.stroke();
  } else if(o.kind==="cheese"){
    polygon(c,[-19,17,-19,-7,18,-20,23,18],"#f6ba31");
    polygon(c,[-19,-7,18,-20,23,-5,-12,6],"#ffe27c");
    circle(c,6,5,5,"#b97a25");circle(c,-9,-1,3,"#b97a25");
  } else if(o.kind==="gem"||isCache){
    c.fillStyle=isCache?"#ffb94e":"#fb4472";
    polygon(c,[0,-22,17,-9,13,12,0,24,-17,10,-16,-9],c.fillStyle);
    polygon(c,[0,-22,0,24,-17,10,-16,-9],"rgba(255,235,244,.42)");
    polygon(c,[0,-22,17,-9,0,3],"rgba(255,255,255,.55)");
    c.stroke();
  } else if(o.kind==="rock"||o.kind==="spike"){
    c.restore(); hazard(c,o,s,assets);return;
  }
  c.restore();
}
function hazard(c,o,s,assets={}){
  // Batch-D kingdom obstacle substitution is visual only: the existing
  // position, reach and collision are untouched, and the draw size stays
  // the original 92 (rock) / 188 (spike) so the visible silhouette still
  // matches the real hitbox. The spike keeps rotating in Clockwork, so the
  // gear preserves the wheel's anticipation.
  const kingdomSub=s.stageIndex!==null
    ?assets[o.kind==='spike'?'bd:spike':'bd:rock']:null;
  const img=artReady(kingdomSub)?kingdomSub:
    assets[o.kind==='spike'?'spike':'rock'];
  if(artReady(img)&&!o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-120&&x<W+120){const sz=o.kind==='spike'?188:92;
    const debris=assets[o.kind==='spike'?'terrainDebrisRoots':'terrainDebrisCrystals'];
    if(artReady(debris))drawImageTrim(c,debris,x-128,y-54,150,75,.34);
    // 2026-11-25 polish: the amber cue dots, the red glow disc and the
    // pulsing ring were UI-style markers floating over the geology and
    // made the obstacles read as placed icons. They are gone; the
    // debris bed and (for the wheel) the wall fixture carry the read.
    if(o.kind==='spike'){
      // The ornate wheel is a temple mechanism, not a floating grey target.
      const middle=tunnelCenter(o.x),above=o.y<middle;
      const boundary=middle+(above?-1:1)*(tunnelRadius(o.x)-9);
      const fixture=above?-1:1;
      c.save();
      c.strokeStyle="rgba(45,30,25,.83)";c.lineWidth=16;c.lineCap="round";
      c.beginPath();c.moveTo(x,boundary);c.lineTo(x,o.y);c.stroke();
      c.strokeStyle="rgba(213,155,79,.88)";c.lineWidth=4;
      c.beginPath();c.moveTo(x-2,boundary);c.lineTo(x-2,o.y);c.stroke();
      circle(c,x,boundary,14,"#4b3025");circle(c,x,boundary,8,"#c99b55");
      c.restore();
    }else{
      glow(c,x,y,57,"rgba(246,123,77,.14)");
    }
    c.save();c.translate(x,y);if(o.kind==='spike')c.rotate(s.time*1.8);drawImageTrim(c,img,-sz/2,-sz/2,sz,sz);c.restore();return;}}

  const x=o.x-s.scroll,y=o.y;
  if(x<-85||x>W+90||o.taken)return;
  c.save();c.translate(x,y);
  glow(c,0,0,57,"rgba(255,66,55,.18)");
  if(o.kind==="spike"){
    c.rotate(s.time*1.55+o.id);
    for(let a=0;a<12;a++){
      const q=a*TWO_PI/12;
      polygon(c,[Math.cos(q-.2)*31,Math.sin(q-.2)*31,Math.cos(q)*55,Math.sin(q)*55,Math.cos(q+.2)*31,Math.sin(q+.2)*31],"#a88357");
    }
    circle(c,0,0,31,"#382d2e");circle(c,0,0,24,"#6b5a50");circle(c,0,0,8,"#e1a55a");
  }else{
    drawRock(c,0,0,40,o.id,"#675e59");
    for(let i=0;i<3;i++)circle(c,-14+i*13,-13+i*5,3,"#dc9a60");
  }
  c.restore();
}
function vehicle(c,s,portrait,assets={},horizontalCorrection=1) {
  if(artReady(assets.body)){
    // Round 10b entrance/exit presentation: at a run's start she
    // EMERGES from the entrance gate (first ~1s: smaller, fainter,
    // growing to full presence as the gate scrolls away behind her);
    // at a world finish she drives INTO the exit gate (enterSlide /
    // enterProgress from the engine: slides right into the opening
    // while shrinking and fading). Both are visual only — collision
    // and scoring use the un-slid anchor, and the entering phase runs
    // no collisions at all.
    const enterP=s.enterProgress||0;
    const emergeRaw=s.time<1.05?clamp(s.time/1.05,0,1):1;
    const emerge=emergeRaw*emergeRaw*(3-2*emergeRaw);
    const visScale=(1-.16*enterP)*(.9+.1*emerge);
    const visAlpha=(1-.78*enterP)*(.35+.65*emerge);
    // Correct the canvas aspect before rotation, so pitched poses keep their width.
    c.save();c.translate(DRILL_ANCHOR+(s.enterSlide||0),s.y);c.scale(horizontalCorrection*visScale,visScale);c.rotate(s.pitch);
    c.globalAlpha=visAlpha;
    if(s.hitCooldown>0 && Math.floor(s.time*13)%2===0)c.globalAlpha*=.52;
    const boosted=s.boostTime>0;
    // Exhaust and travel streaks live behind the intact Rosie/engine sprite.
    paintOriginalBoostExhaust(c,s,assets);
    for(let i=0;i<9;i++){
      const phase=Math.floor(s.time*22),radius=2+noise(i+phase)*5;
      circle(c,-145-noise(i*17+phase)*78,(noise(i+phase*11)-.5)*65,
        radius,i%2?"rgba(255,183,91,.46)":"rgba(138,94,58,.52)");
    }
    // Turbo-ready ring: only while charge is exactly full, and it clears
    // the moment Turbo activates (boostTime>0). Drawn behind the poses.
    const readyAtlas=assets["bd:turbo-ready"];
    if(s.charge>=100&&s.boostTime<=0&&artReady(readyAtlas)){
      const frame=batchDFrameAt("turbo-ready",s.time*1000);
      const size=230;
      drawExpansionFrame(c,readyAtlas,"turbo-ready",frame,-size/2,-size/2,size,size);
    }
    // Crossfade between separately illustrated Rosie-body steering poses.
    // Keep their registered bounds identical so the cockpit does not jump.
    const neutral=artReady(assets.turnNeutral)?assets.turnNeutral:assets.body;
    const directed=s.pitch<0?assets.turnUp:assets.turnDown;
    const turnMix=clamp((Math.abs(s.pitch)-.045)/.37,0,1);
    // The approved poses are NEVER substituted. Their native illustrated
    // collar remains, but any pre-painted cone to its right is masked out,
    // preventing two overlapping drill noses during the registered spin.
    // This mask affects only vehicle-local x>68, not Rosie or her machinery.
    c.save();
    c.beginPath();c.rect(-168,-125,236,252);c.clip();
    if(artReady(neutral))drawImageTrim(c,neutral,-168,-125,336,252,artReady(directed)?1-turnMix:1);
    if(artReady(directed)&&turnMix>.001)drawImageTrim(c,directed,-168,-125,336,252,turnMix);
    c.restore();
    // 16 actual original paintings, same transform as hull at every pitch.
    paintOriginalAuger(c,s,assets);
    paintTurboTip(c,s,assets);
    c.restore();return;
  }

  const x=DRILL_ANCHOR+(s.enterSlide||0),y=s.y;
  c.save();c.translate(x,y);c.scale(horizontalCorrection,1);c.rotate(s.pitch);
  if(s.hitCooldown>0&&Math.floor(s.time*14)%2===1)c.globalAlpha=.42;
  glow(c,65,4,s.boostTime>0?180:102,s.boostTime>0?"rgba(255,212,71,.45)":"rgba(244,145,43,.20)");
  // Dirt plume behind drill, continuous and directional.
  for(let i=0;i<14;i++){
    const q=noise(Math.floor(s.time*16)+i*13);
    const px=-90-(q*110),py=(noise(i*22+Math.floor(s.time*14))-.5)*90;
    circle(c,px,py,2+q*8,i%3===0?"rgba(255,189,82,.65)":"rgba(128,85,52,.65)");
  }
  // Rear engine and bright brass framework.
  rounded(c,-112,-65,152,121,25);c.fillStyle="#661d24";c.fill();c.lineWidth=6;c.strokeStyle="#e7b668";c.stroke();
  c.fillStyle="#ac3034";rounded(c,-100,-53,132,96,19);c.fill();
  for(let i=0;i<5;i++){
    c.fillStyle=i%2?"#d29f60":"#432229";c.fillRect(-93+i*24,-61,7,112);
  }
  c.fillStyle="#3e2226";rounded(c,-69,-94,95,83,34);c.fill();c.strokeStyle="#e0b36d";c.lineWidth=5;c.stroke();
  // Rosie's real app portrait stays inside the cockpit rather than replacing her.
  if(portrait?.complete&&portrait.naturalWidth>0){
    c.save();c.beginPath();c.ellipse(-22,-63,42,45,0,0,TWO_PI);c.clip();
    const iw=portrait.naturalWidth, ih=portrait.naturalHeight;
    const ratio=iw/ih, h=105,w=h*ratio;
    c.drawImage(portrait,-22-w*.5,-103,w,h);
    c.restore();
  }else{
    circle(c,-23,-67,35,"#392b24");polygon(c,[-53,-85,-57,-127,-25,-101],"#32251f");
    polygon(c,[-11,-99,2,-126,12,-82],"#30211f");
    circle(c,-9,-73,4,"#eead5f");
  }
  // Lantern, scarf, canine regalia.
  c.fillStyle="#f1e3c6";polygon(c,[-60,-28,4,-28,-31,-10],"#f5e5d1");
  polygon(c,[-48,-23,-110,-9,-63,-12],"#a52438");
  c.fillStyle="#e9bc70";rounded(c,-59,-117,71,11,5);c.fill();c.fillStyle="#40231e";rounded(c,-53,-122,65,18,5);c.fill();
  circle(c,8,-112,9,"#f2cd7e");glow(c,8,-111,32,"rgba(252,191,84,.4)");
  circle(c,-81,3,24,"#b17c3e");circle(c,-81,3,18,"#28252c");
  c.fillStyle="#f7d994";c.font="bold 23px Georgia";c.fillText("✦",-91,11);
  // Rotating corkscrew drill nose, constructed as a tapered brass auger.
  const drill=c.createLinearGradient(22,-45,157,35);
  drill.addColorStop(0,"#fff0ae");drill.addColorStop(.18,"#aa6631");drill.addColorStop(.37,"#f9c46e");drill.addColorStop(.6,"#6b3b23");drill.addColorStop(.83,"#d59645");drill.addColorStop(1,"#e6b55e");
  polygon(c,[25,-53,72,-44,116,-25,166,1,116,26,72,45,25,52],drill);
  c.strokeStyle="#f9d994";c.lineWidth=3;c.beginPath();c.moveTo(26,-52);c.lineTo(166,1);c.lineTo(25,52);c.stroke();
  for(let i=0;i<5;i++){
    const dx=38+i*24, height=51-i*10, wave=Math.sin(s.time*18+i)*2;
    c.strokeStyle=i%2===0?"#4f2921":"#ffdc84";c.lineWidth=7-i*.7;
    c.beginPath();c.moveTo(dx,-height);c.quadraticCurveTo(dx+13+wave,0,dx,height);c.stroke();
    c.strokeStyle="rgba(255,244,177,.7)";c.lineWidth=2;c.beginPath();c.moveTo(dx+3,-height);c.lineTo(dx+7,0);c.stroke();
  }
  if(s.boostTime>0){
    c.strokeStyle="rgba(255,214,81,.85)";c.lineWidth=4;
    for(let j=0;j<5;j++){c.beginPath();c.moveTo(-125,-27+j*15);c.lineTo(-195-noise(j+s.time)*30,-44+j*18);c.stroke();}
  }
  c.restore();
}
export function paintDrill(c,s,portrait,particles=[],assets={},horizontalCorrection=1) {
  c.clearRect(0,0,W,H);
  // During a boss the arena is the scenic base; otherwise the route scenery.
  if(s.boss)paintBossArena(c,s,assets);
  else scenery(c,s,assets);
  wallDepth(c,s);
  // Establish the continuous wall first. The sculptural obstacle pass must be
  // last within terrain painting; the old ordering drew a ribbon over every
  // transition core and left the course looking obstacle-free.
  // Ribbons and sculptural route scenery are suppressed during a boss: the
  // arena is the scenery there, and they would double its walls.
  if(!s.boss){
    if (!paintTunnelRibbons(c,s,assets)) paintNaturalTunnel(c,s,assets);
    paintSculpturalTunnel(c,s,assets);
  }
  paintGates(c,s,assets);
  // Boss combat freezes and disables the normal tunnel's objects. Do not
  // leave collectible gems or dangerous-looking inactive obstacles floating
  // in front of the guardian and misleading the player.
  if(!s.boss){
    paintBreakables(c,s,assets,W);
    paintCrystalShutters(c,s,assets,W);
    paintExpeditionHazards(c,s,W,assets);
    for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && o.kind!=="rock"&&o.kind!=="spike")pickup(c,o,s,assets);
    for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && (o.kind==="rock"||o.kind==="spike"))hazard(c,o,s,assets);
  }
  paintTurboWorldStreaks(c,s,W,H);
  paintExpeditionBoss(c,s,W,H,assets);
  paintBossRewards(c,s,assets);
  paintExcavationUnderlay(c,s);
  vehicle(c,s,portrait,assets,horizontalCorrection);
  paintExcavationTip(c,s);
  // Round 10b: as she enters the exit gate, the opening's darkness
  // swallows the drill — a soft dark radial at the gate mouth, drawn
  // over the vehicle and growing with enterProgress, on top of the
  // shrink/fade the vehicle pass already applies.
  if((s.enterProgress||0)>0&&s.exitGateX!=null){
    const gx=s.exitGateX-s.scroll+30,gy=s.y;
    c.save();
    const g=c.createRadialGradient(gx,gy,6,gx,gy,125);
    g.addColorStop(0,"rgba(8,4,10,"+(.6*s.enterProgress).toFixed(3)+")");
    g.addColorStop(1,"rgba(8,4,10,0)");
    c.fillStyle=g;c.beginPath();c.arc(gx,gy,125,0,TWO_PI);c.fill();
    c.restore();
  }
  for(const p of particles){
    c.save();c.globalAlpha=Math.max(0,p.life/p.max);
    if(p.type?.startsWith("fx-")){
      // Batch-D combat-effect atlas particle. life/max drives the frame;
      // one-shot effects clamp at the last frame via batchDFrameAt.
      const fxId=p.type.slice(3);
      const fxImg=assets["bd:"+fxId];
      const meta=EMBER_BATCH_D_ATLASES[fxId];
      if(meta&&artReady(fxImg)){
        const frame=batchDFrameAt(fxId,(1-p.life/p.max)*p.max*1000);
        const size=meta.displaySize;
        drawExpansionFrame(c,fxImg,fxId,frame,p.x-size/2,p.y-size/2,size,size);
      }else{
        circle(c,p.x,p.y,p.r,p.color);
      }
    } else if((p.type==="break-v2"||p.type==="crack-v2")&&artReady(assets.breakShatterVfx)){
      const src=assets.breakShatterVfx;
      const fraction=clamp(1-p.life/p.max,0,1);
      const count=p.type==="crack-v2"?4:10;
      const frame=Math.min(count-1,Math.floor(fraction*count));
      const fw=src.naturalWidth/5,fh=src.naturalHeight/2;
      const x=frame%5,y=Math.floor(frame/5);
      c.drawImage(src,x*fw,y*fh,fw,fh,p.x-79,p.y-72,158,144);
    } else if((p.type==="break-v2"||p.type==="crack-v2"||p.type==="rock-burst"||p.type==="hit-burst")&&artReady(assets.rockburst)){
      drawImageTrim(c,assets.rockburst,p.x-77,p.y-57,154,114,Math.min(1,p.life/p.max));
    } else if(p.type==="cache-burst"&&artReady(assets.cacheBurst)){
      const frame=Math.min(7,Math.floor((1-p.life/p.max)*8)), fw=assets.cacheBurst.naturalWidth/4,fh=assets.cacheBurst.naturalHeight/2;
      c.drawImage(assets.cacheBurst,(frame%4)*fw,Math.floor(frame/4)*fh,fw,fh,p.x-80,p.y-80,160,160);
    } else circle(c,p.x,p.y,p.r,p.color);
    c.restore();
  }
  if(s.shock>0){
    c.fillStyle="rgba(246,67,38,"+(s.shock*.36)+")";c.fillRect(0,0,W,H);
  }
  const shade=c.createLinearGradient(0,0,W,0);
  shade.addColorStop(0,"rgba(9,9,17,.21)");shade.addColorStop(.35,"rgba(9,9,17,0)");shade.addColorStop(1,"rgba(9,9,17,.16)");
  c.fillStyle=shade;c.fillRect(0,0,W,H);
}
