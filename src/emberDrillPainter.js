import { DRILL_WIDTH as W, DRILL_HEIGHT as H, DRILL_ANCHOR, tunnelCenter, tunnelRadius, clamp } from "./emberDrillEngine.js";
import { paintNaturalTunnel } from "./emberNaturalTunnel.js";

const TWO_PI = Math.PI * 2;

const artReady = i => Boolean(i && i.complete && i.naturalWidth>0);
function artLoop(c,img,shift,alpha=1){
  if(!artReady(img))return false;
  const w=img.naturalWidth*(H/img.naturalHeight);
  const off=((shift%w)+w)%w;
  c.save();c.globalAlpha=alpha;
  for(let x=-off-w;x<W+w;x+=w)c.drawImage(img,x,0,w,H);
  c.restore();return true;
}
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
const CAVERN_SCENES=[
  {at:0,key:"barkroot"},
  {at:10,key:"scenicBarkroot"},
  {at:21,key:"scenicRoots"},
  {at:32,key:"scenicLantern"},
  {at:43,key:"ruby"},
  {at:54,key:"scenicCrystal"},
  {at:65,key:"scenicTemple"},
];
// These are world-anchored scenic set pieces, NOT collectible markers.
// Actual cheese, gems, bones and treasure caches are drawn separately.
const CAVERN_FEATURES=[
  {kind:"lantern",world:1150,side:-1},
  {kind:"crystaloverlay",world:3150,side:1},
  {kind:"lantern",world:5700,side:-1},
  {kind:"crystaloverlay",world:7500,side:1},
  {kind:"gate",world:10780,side:0},
  {kind:"lantern",world:12500,side:-1},
  {kind:"gate",world:15300,side:0},
  {kind:"crystaloverlay",world:17700,side:1},
  {kind:"gate",world:20800,side:0},
  {kind:"lantern",world:23400,side:-1},
];
function scenicFeatures(c,s,assets){
  for(const feature of CAVERN_FEATURES){
    const x=feature.world-s.scroll;
    if(x<-450||x>W+450)continue;
    const mid=tunnelCenter(feature.world),r=tunnelRadius(feature.world);
    if(feature.kind==="gate"){
      const img=assets.gate;
      if(!artReady(img))continue;
      glow(c,x,mid,190,"rgba(243,170,74,.15)");
      drawImageTrim(c,img,x-195,mid-145,390,290,.83);
    } else if(feature.kind==="lantern"){
      const y=mid-r+56;
      const img=assets.lantern;
      if(artReady(img)){
        glow(c,x,y,95,"rgba(244,173,73,.22)");
        drawImageTrim(c,img,x-29,y-71,58,137,.88);
      }
    } else if(feature.kind==="crystaloverlay"){
      const img=assets.crystaloverlay;
      if(!artReady(img))continue;
      const y=mid+r-63;
      glow(c,x,y,95,"rgba(237,87,124,.16)");
      drawImageTrim(c,img,x-185,y-65,370,124,.68);
    }
  }
}
function scenery(c,s,assets={}) {
  c.fillStyle="#23151d";c.fillRect(0,0,W,H);
  let current=0;
  for(let i=1;i<CAVERN_SCENES.length;i++){
    if(s.time>=CAVERN_SCENES[i].at)current=i;
  }
  const scene=CAVERN_SCENES[current];
  const nextAt=CAVERN_SCENES[current+1]?.at??75;
  const duration=Math.max(1,nextAt-scene.at);
  const local=clamp((s.time-scene.at)/duration,0,1);
  if(current>0){
    const prev=CAVERN_SCENES[current-1];
    const fade=clamp((s.time-scene.at)/2.2,0,1);
    // Freeze the previous panorama at its final position during a short dissolve.
    panorama(c,assets[prev.key],1,1);
    panorama(c,assets[scene.key],local,fade);
  } else {
    panorama(c,assets[scene.key]||assets.scenicBarkroot,local,1);
  }
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

function pickup(c,o,s,assets={}){
  const img=o.kind==='cache'?(assets.chest||assets.cache):
    o.kind==='gem'&&o.id%7===0?(assets.coin||assets.gem):
    assets[o.kind==='bone'?'bone':o.kind==='cheese'?'cheese':o.kind==='gem'?'gem':'nonexistent'];
  if(artReady(img) && !o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-60&&x<=W+60){const sz=o.kind==='cache'?67:48; glow(c,x,y,sz*.8,'rgba(255,182,76,.20)');drawImageTrim(c,img,x-sz/2,y-sz/2+Math.sin(s.time*5+o.id)*2,sz,sz);return;}}

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
  const img=assets[o.kind==='spike'?'spike':'rock'];
  if(artReady(img)&&!o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-90&&x<W+90){const sz=o.kind==='spike'?94:92;
    if(o.kind==='spike'){
      // The ornate wheel is a temple mechanism, not a floating grey target.
      const middle=tunnelCenter(o.x),above=o.y<middle;
      const boundary=middle+(above?-1:1)*(tunnelRadius(o.x)-9);
      const fixture=above?-1:1;
      c.save();
      c.strokeStyle="rgba(45,30,25,.83)";c.lineWidth=12;c.lineCap="round";
      c.beginPath();c.moveTo(x,boundary);c.lineTo(x,o.y);c.stroke();
      c.strokeStyle="rgba(213,155,79,.88)";c.lineWidth=3;
      c.beginPath();c.moveTo(x-2,boundary);c.lineTo(x-2,o.y);c.stroke();
      circle(c,x,boundary,11,"#4b3025");circle(c,x,boundary,6,"#c99b55");
      c.restore();
    }else{
      glow(c,x,y,57,"rgba(246,123,77,.14)");
    }
    glow(c,x,y,57,'rgba(245,77,57,.12)');
    if(artReady(assets.hazardPulse)){
      const pulse=.22+.14*Math.sin(s.time*9+o.id);
      drawImageTrim(c,assets.hazardPulse,x-62,y-62,124,124,pulse);
    }c.save();c.translate(x,y);if(o.kind==='spike')c.rotate(s.time*1.8);drawImageTrim(c,img,-sz/2,-sz/2,sz,sz);c.restore();return;}}

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
function vehicle(c,s,portrait,assets={}) {
  if(artReady(assets.body)){
    c.save();c.translate(DRILL_ANCHOR,s.y);c.rotate(s.pitch);
    if(s.hitCooldown>0 && Math.floor(s.time*13)%2===0)c.globalAlpha=.52;
    const boosted=s.boostTime>0;
    if(boosted){
      // The engine, not Rosie's face, glows. Streaks trail behind the vehicle.
      glow(c,-95,0,142,'rgba(255,163,47,.27)');
      // This is a transparent exhaust plume only, behind the actual vehicle.
      if(artReady(assets.boosttrail)){
        c.save();c.globalCompositeOperation="screen";
        drawImageTrim(c,assets.boosttrail,-298,-49,180,98,.56);
        c.restore();
      }
      for(let i=0;i<11;i++){
        const yy=(i-5)*17+Math.sin(s.time*27+i*1.8)*6;
        c.strokeStyle=i%3===0?'rgba(255,247,184,.72)':'rgba(252,154,53,.54)';
        c.lineWidth=1.5+(i%3);
        const travel=(s.time*390+i*41)%110;
        c.beginPath();c.moveTo(-155-travel*.36,yy);c.lineTo(-256-travel,yy-12);c.stroke();
      }
    }
    for(let i=0;i<10;i++){
      const phase=Math.floor(s.time*20),radius=2+noise(i+phase)*6;
      circle(c,-145-noise(i*17+phase)*80,(noise(i+phase*11)-.5)*72,radius,i%2?'rgba(255,183,91,.59)':'rgba(138,94,58,.57)');
    }
    // Crossfade between separately illustrated Rosie-body steering poses.
    // Keep their registered bounds identical so the cockpit does not jump.
    const neutral=artReady(assets.turnNeutral)?assets.turnNeutral:assets.body;
    const directed=s.pitch<0?assets.turnUp:assets.turnDown;
    const turnMix=clamp((Math.abs(s.pitch)-.045)/.37,0,1);
    if(artReady(neutral))drawImageTrim(c,neutral,-168,-125,336,252,artReady(directed)?1-turnMix:1);
    if(artReady(directed)&&turnMix>.001)drawImageTrim(c,directed,-168,-125,336,252,turnMix);
    if(artReady(assets.auger)){
      const fps=s.boostTime>0?34:19,frame=Math.floor(s.time*fps)%8;
      c.drawImage(assets.auger,(frame%4)*500,Math.floor(frame/4)*410,500,410,
        -168+948/1448*336,-125+477/1086*252,500/1448*336,410/1086*252);
    }
    // Rotating axial sheen: each spiral rib catches and releases highlights as
    // the auger turns, while the separately rendered sprite remains registered.
    c.save();
    c.globalCompositeOperation="screen";
    for(let i=0;i<5;i++){
      const pos=77+i*16,half=40-i*6;
      const phase=s.time*(boosted?43:23)-i*.75;
      const sheen=.11+.18*Math.max(0,Math.cos(phase));
      c.strokeStyle="rgba(255,232,156,"+sheen.toFixed(3)+")";
      c.lineWidth=2.8;
      c.beginPath();c.moveTo(pos,-half);c.quadraticCurveTo(pos+4+Math.sin(phase)*3,0,pos,half);c.stroke();
    }
    c.restore();
    if(boosted){
      // Keep the illustrated auger itself visible. The supplied turbo overlay
      // depicts a complete second drill, so layering it produces a ghost nose.
      // Use attached exhaust, rings and sparks instead of duplicating geometry.
      glow(c,146,0,90,"rgba(255,205,72,.30)");
      for(let i=0;i<18;i++){
        const a=s.time*31+i*2.39;
        const r=14+(i%5)*8;
        const dx=143+Math.cos(a)*r,dy=Math.sin(a)*r;
        circle(c,dx,dy,1.4+(i%4)*.55,"rgba(255,224,117,.84)");
      }
      // Spinning concentric light and sparks stay attached to the drill tip.
      const spin=s.time*29;
      c.save();c.translate(157,0);
      glow(c,0,0,68,"rgba(255,222,99,.35)");
      c.strokeStyle="rgba(255,232,138,.78)";c.lineWidth=3;
      c.beginPath();c.ellipse(0,0,11+Math.sin(spin)*4,26,0,-spin,-spin+Math.PI*1.16);c.stroke();
      c.strokeStyle="rgba(255,246,188,.60)";c.lineWidth=2;
      c.beginPath();c.ellipse(-12,0,12,38,0,spin,spin+Math.PI*.85);c.stroke();
      for(let i=0;i<13;i++){
        const a=spin+i*2.399,rad=18+(i%4)*9;
        const px=Math.cos(a)*rad,py=Math.sin(a)*rad;
        circle(c,px,py,1.6+(i%3),"rgba(255,212,105,.85)");
      }
      c.restore();
    }
    c.restore();return;
  }

  const x=DRILL_ANCHOR,y=s.y;
  c.save();c.translate(x,y);c.rotate(s.pitch);
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
export function paintDrill(c,s,portrait,particles=[],assets={}) {
  c.clearRect(0,0,W,H);
  scenery(c,s,assets);
  paintNaturalTunnel(c,s,assets);
  // First collectibles, then drill, with hazards on top for readable play.
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && o.kind!=="rock"&&o.kind!=="spike")pickup(c,o,s,assets);
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && (o.kind==="rock"||o.kind==="spike"))hazard(c,o,s,assets);
  vehicle(c,s,portrait,assets);
  for(const p of particles){
    c.save();c.globalAlpha=Math.max(0,p.life/p.max);
    if((p.type==="rock-burst"||p.type==="hit-burst")&&artReady(assets.rockburst)){
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
