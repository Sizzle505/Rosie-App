import {
  DRILL_ANCHOR, tunnelCenter, tunnelRadius
} from "./emberDrillEngine.js";

// A light, local excavation effect for the existing illustrated auger.
// No whole-screen overlays or second drill silhouette. All marks are drawn
// at the real rotated tip and follow the vehicle's pitch and motion.
const TWO_PI = Math.PI * 2;
const PI = Math.PI;
const fract = x => x - Math.floor(x);
const rnd = n => fract(Math.sin(n * 79.191 + 31.71) * 31741.389);

function tipOf(run) {
  const pitch = run.pitch || 0;
  return {
    x: DRILL_ANCHOR + Math.cos(pitch) * 166,
    y: run.y + Math.sin(pitch) * 166,
    pitch
  };
}
function nearerRock(run, point) {
  const world = run.scroll + point.x;
  const center = tunnelCenter(world), rad = tunnelRadius(world);
  return Math.max(0,Math.min(1, (100 - Math.min(
    Math.abs(point.y - (center-rad)),
    Math.abs(point.y - (center+rad))
  ))/95));
}
function orb(c,x,y,r,stops) {
  const g=c.createRadialGradient(x,y,0,x,y,r);
  for(const [pos,color] of stops)g.addColorStop(pos,color);
  c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TWO_PI);c.fill();
}
function opacity(run) {
  return run?.running ? 1 : 0;
}
export function paintExcavationUnderlay(c,run) {
  if(!opacity(run))return;
  const p=tipOf(run);
  const boosted=run.boostTime>0;
  const scrape=nearerRock(run,p);
  c.save();c.translate(p.x,p.y);c.rotate(p.pitch);
  const strength=boosted?1.3:.65+scrape*.3;
  orb(c,-8,0,boosted?63:42,[
    [0,boosted?"rgba(255,214,112,.21)":"rgba(222,147,78,.13)"],
    [.45,"rgba(172,102,50,.10)"],[1,"rgba(90,54,28,0)"]
  ]);
  // A compact earthy plume, primarily behind the point of excavation.
  // World-relative phase avoids random flicker from frame to frame.
  const time=run.time;
  for(let i=0;i<13;i++) {
    const phase=time*(boosted?5.1:3.4)+i*1.71;
    const travel=fract(phase*.37+rnd(i+4))*48;
    const x=-12-travel*1.35;
    const y=Math.sin(phase*.9+i*2.07)*(9+travel*.43);
    const radius=(2+rnd(i+9)*4.3)*(1-travel/69);
    c.fillStyle=i%3===0?"rgba(221,165,89,.45)":"rgba(108,70,46,.45)";
    c.beginPath();c.ellipse(x,y,Math.max(.6,radius),Math.max(.5,radius*.7),0,0,TWO_PI);c.fill();
  }
  c.restore();
}
export function paintExcavationTip(c,run) {
  if(!opacity(run))return;
  const p=tipOf(run);
  const boosted=run.boostTime>0;
  const scrape=nearerRock(run,p);
  const speed=boosted?2:1;
  c.save();c.translate(p.x,p.y);c.rotate(p.pitch);
  // A restrained metal/rock contact flash. The point of the actual
  // auger stays visible, including while Rosie aims up and down.
  orb(c,5,0,boosted?25:14,[
    [0,boosted?"rgba(255,246,189,.63)":"rgba(255,231,177,.32)"],
    [.28,"rgba(255,181,85,.30)"],[1,"rgba(255,167,53,0)"]
  ]);
  for(let i=0;i<(boosted?16:9);i++){
    const phase=run.time*(18*speed)+i*2.399;
    const lifetime=fract(run.time*(.85*speed)+rnd(i+36));
    const angle=phase+Math.sin(i*27.1)*.4;
    const reach=(9+18*lifetime)*(boosted?1.42:1)*(1+scrape*.4);
    const x=7+Math.cos(angle)*reach*.66;
    const y=Math.sin(angle)*reach;
    const length=2+(1-lifetime)*(boosted?8:5);
    c.beginPath();c.moveTo(x,y);
    c.lineTo(x-Math.cos(angle)*length*.7,y-Math.sin(angle)*length);
    c.lineWidth=i%4===0?2.15:1.1;
    c.strokeStyle=i%3===0?"rgba(255,248,197,.76)":"rgba(246,165,74,.60)";
    c.stroke();
  }
  // Wall chips are sparse and directional; they become stronger on a
  // genuine wall scrape but never masquerade as a new obstacle.
  if(scrape>.16 || boosted){
    for(let i=0;i<6;i++){
      const life=fract(run.time*(boosted?2.8:1.8)+rnd(i+142));
      const dx=2-life*(12+18*rnd(i+84));
      const dy=(i%2?-1:1)*(8+life*16)*(1+scrape*.3);
      c.save();c.translate(dx,dy);c.rotate(life*4+i);
      c.fillStyle=i%3===0?"rgba(248,191,99,.60)":"rgba(124,83,56,.57)";
      c.fillRect(-2,-1.5,3.6+2.5*(1-life),2.5);
      c.restore();
    }
  }
  c.restore();
}
