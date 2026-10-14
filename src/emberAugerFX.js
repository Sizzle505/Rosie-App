import { TURBO_DURATION } from "./emberDrillEngine.js";
/**
 * Original-source Ember drill FX.
 * auger-spin.png: genuine 4x2 animation sheet, each 500x410 frame.
 * turbo-head-frames.webp: all TEN original animated WebP frames extracted\n * into a deterministic 5x2 Canvas atlas. Screened INSIDE the nose mask.
 * feature-boosttrail.webp: true original-source energy trail, horizontally
 * mirrored so exhaust extends backwards from Rosie's engine.
 */
const ready = img => !!(img?.complete && img.naturalWidth > 0);
const NOSE = Object.freeze({x:50, y:-49, w:119, h:100});
export const AUGER_SHEET = Object.freeze({columns:4, rows:2, frameWidth:500, frameHeight:410});
const PI2=Math.PI*2;
function nosePath(c){
  // A conservative clipping contour matching the tapered brass cone.
  c.beginPath();
  c.moveTo(57,-47);
  c.bezierCurveTo(95,-44,139,-25,169,-4);
  c.quadraticCurveTo(174,0,169,4);
  c.bezierCurveTo(137,25,97,45,57,47);
  c.closePath();
}
export function augerFrameIndex(seconds, turbo=false){
  if (!Number.isFinite(seconds)) return 0;
  return Math.floor(Math.max(0,seconds) * (turbo?39:23)) % 8;
}
export const TURBO_ATLAS=Object.freeze({columns:5,rows:2,frameWidth:308,frameHeight:126,frames:10,frameMs:60});
export function turboFrameIndex(remainingSeconds){
  const seconds=Math.max(0,TURBO_DURATION-(Number.isFinite(remainingSeconds)?remainingSeconds:TURBO_DURATION));
  return Math.floor(seconds*1000/TURBO_ATLAS.frameMs+1e-7)%TURBO_ATLAS.frames;
}
export function turboFrameRect(remainingSeconds){
  const i=turboFrameIndex(remainingSeconds);
  return {sx:(i%5)*308,sy:Math.floor(i/5)*126,sw:308,sh:126};
}
export function augerFrameRect(index){
  const i=((Math.trunc(index)%8)+8)%8;
  return {sx:(i%4)*500,sy:Math.floor(i/4)*410,sw:500,sh:410};
}
export function paintOriginalAuger(c,s,assets){
  const img=assets?.auger;
  if(!ready(img))return false;
  const boosted=s.boostTime>0;
  const frame=augerFrameRect(augerFrameIndex(s.time,boosted));
  c.drawImage(img,frame.sx,frame.sy,frame.sw,frame.sh,
    NOSE.x,NOSE.y,NOSE.w,NOSE.h);
  // The source's eight frames have small paint deltas. Make the intended
  // axial rotation *legible*, with phased helices locked to the tapered cone.
  // Clip every rib/glint inside the head; nothing crosses the cockpit.
  c.save();
  nosePath(c);c.clip();
  const speed=boosted?53:30;
  const phase=s.time*speed;
  for(let i=0;i<6;i++){
    const x=69+i*17.1;
    const half=40-i*6.0;
    const a=phase-i*1.05;
    const bright=.12+.68*Math.pow((Math.cos(a)+1)/2,2);
    const dark=.12+.24*Math.pow((Math.cos(a+Math.PI)+1)/2,2);
    c.lineWidth=5.2-i*.38;
    c.strokeStyle="rgba(39,19,10,"+dark.toFixed(3)+")";
    c.beginPath();
    c.moveTo(x-7*Math.cos(a),-half);
    c.bezierCurveTo(x-13*Math.sin(a),-half*.4,x+13*Math.sin(a),half*.4,x+7*Math.cos(a),half);
    c.stroke();
    c.strokeStyle="rgba(255,234,151,"+bright.toFixed(3)+")";
    c.lineWidth=boosted?3.5:2.8;
    c.beginPath();
    c.moveTo(x-5*Math.cos(a+.5),-half);
    c.bezierCurveTo(x+14*Math.sin(a+.5),-half*.42,x-14*Math.sin(a+.5),half*.42,x+5*Math.cos(a+.5),half);
    c.stroke();
  }
  // A narrow specular travelling along the rotational axis increases the
  // perceived speed without rotating the full illustrated vehicle.
  const flash=.17+.20*(.5+.5*Math.sin(phase*1.7));
  c.strokeStyle="rgba(255,250,206,"+flash.toFixed(3)+")";
  c.lineWidth=1.7;c.beginPath();c.moveTo(77,-2);
  c.quadraticCurveTo(120,1,165,0);c.stroke();
  if(boosted){
    // NOTE the turbo artwork includes a nose. Use it as light *within the
    // existing nose only*; never place a whole second vehicle on Canvas.
    if(ready(assets?.turboAtlas)){
      const frame=turboFrameRect(s.boostTime);
      c.globalCompositeOperation="screen";
      c.globalAlpha=.26+.13*Math.sin(s.time*31)**2;
      c.drawImage(assets.turboAtlas,frame.sx,frame.sy,frame.sw,frame.sh,53,-48,116,96);
      c.globalAlpha=1;
    }
    const beam=c.createLinearGradient(72,0,171,0);
    beam.addColorStop(0,"rgba(255,202,76,.04)");
    beam.addColorStop(.65,"rgba(255,197,65,.10)");
    beam.addColorStop(1,"rgba(255,246,153,.37)");
    c.fillStyle=beam;c.fillRect(53,-48,120,96);
  }
  c.restore();
  return true;
}
export function paintOriginalBoostExhaust(c,s,assets){
  if(!(s.boostTime>0))return;
  // Drawing in *vehicle local* coordinates: the parent renderer has already
  // applied the same translation/pitch as the Rosie body and drill.
  const pulse=.83+.17*Math.sin(s.time*35);
  if(ready(assets?.boosttrail)){
    // The original fire artwork points to the right. Mirror it so the energy
    // clearly leaves the engine to the left, always behind Rosie.
    c.save();
    c.globalCompositeOperation="screen";
    c.translate(-113,0);
    c.scale(-1,1);
    c.globalAlpha=.72*pulse;
    c.drawImage(assets.boosttrail,1,-49,197,98);
    c.globalAlpha=.38*pulse;
    c.drawImage(assets.boosttrail,18,-27,241,54);
    c.restore();
  }
  for(let i=0;i<13;i++){
    const xx=-137-((s.time*220+i*47)%154);
    const yy=Math.sin(s.time*16+i*2.4)*(13+i*1.9);
    c.strokeStyle=i%3===0?"rgba(255,244,176,.83)":"rgba(255,158,62,.55)";
    c.lineWidth=1.2+(i%3)*.7;c.beginPath();
    c.moveTo(xx,yy);c.lineTo(xx-31-i*1.2,yy-Math.sin(i)*3);c.stroke();
  }
  // The combustion flash belongs at the tailpipe, NOT in front of the auger.
  const glow=c.createRadialGradient(-126,0,1,-126,0,64);
  glow.addColorStop(0,"rgba(255,231,133,.44)");
  glow.addColorStop(.35,"rgba(255,150,62,.19)");
  glow.addColorStop(1,"rgba(255,130,45,0)");
  c.fillStyle=glow;c.beginPath();c.arc(-126,0,64,0,PI2);c.fill();
}
export function paintTurboTip(c,s){
  if(!(s.boostTime>0))return;
  const phase=s.time*49,tipX=165;
  const g=c.createRadialGradient(tipX,0,1,tipX,0,46);
  g.addColorStop(0,"rgba(255,245,179,.45)");
  g.addColorStop(.5,"rgba(255,181,66,.17)");
  g.addColorStop(1,"rgba(255,155,43,0)");
  c.fillStyle=g;c.beginPath();c.arc(tipX,0,46,0,PI2);c.fill();
  for(let k=0;k<15;k++){
    const t=k*2.39996+phase;
    const radius=17+((k*9+Math.floor(s.time*25))%23);
    const x=tipX+Math.cos(t)*radius*.6;
    const y=Math.sin(t)*radius;
    c.fillStyle=k%3===0?"rgba(255,246,190,.91)":"rgba(255,181,82,.78)";
    c.beginPath();c.arc(x,y,1.3+(k%3)*.65,0,PI2);c.fill();
  }
}
export function paintTurboWorldStreaks(c,s,width,height){
  if(!(s.boostTime>0))return;
  c.save();
  c.globalCompositeOperation="screen";
  for(let i=0;i<11;i++){
    const y=45+((i*73.9+17)%Math.max(1,height-100));
    const x=((i*167-s.scroll*1.65)%(width+200)+width+200)%(width+200)-90;
    c.strokeStyle=i%3===0?"rgba(255,225,135,.20)":"rgba(220,132,64,.13)";
    c.lineWidth=i%3===0?2.3:1.25;c.beginPath();c.moveTo(x,y);
    c.lineTo(x-88-i*4,y+1);c.stroke();
  }
  c.restore();
}
