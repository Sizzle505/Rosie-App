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
  const turbo=s.boostTime>0;
  const frame=augerFrameRect(augerFrameIndex(s.time,turbo));
  // Engine/chassis native art ends at x=+68. This collar is anchored at
  // x=+63 while the ORIGINAL drill tip ends at x=+170.
  // Source sprites were composed as 500x410 isolated auger frames.
  // REINSTATE the full painted mechanical auger from the original, uncut
  // 1448x1086 vehicle master. The directional Rosie/chassis poses deliberately
  // OMIT this region (x >= 948), so this precisely fills their missing nose.
  // Source native registration: x=-168 + (948/1448)*336 = +52.
  if(ready(assets?.body)){
    c.drawImage(assets.body,948,0,500,1086,52,-125,116,252);
  }
  c.save();
  nosePath(c);c.clip();
  // The independently illustrated 8-frame source adds changing rotational
  // surface markings; never use it as the ONLY structural nose.
  c.globalCompositeOperation="overlay";
  c.globalAlpha=.52;
  c.drawImage(img,frame.sx,frame.sy,frame.sw,frame.sh,52,-50,118,100);
  c.globalAlpha=1;
  c.globalCompositeOperation="source-over";
  const turn=s.time*(turbo?34:23);
  // The supplied 8-frame original changes primarily around its rear ribs.
  // Amplify *that same physical motion* throughout the visible length of the
  // cone, without repainting or rotating Rosie's body. Metallic spiral
  // shadows and hard specular seams advance around the tapered drill shaft.
  for(let rib=0;rib<6;rib++){
    const along=rib/6;
    const centerX=70+rib*17.1;
    const height=41-rib*6.3;
    const phase=turn-rib*.84;
    const lateral=Math.sin(phase)*8.5;
    c.lineCap="round";
    c.lineWidth=Math.max(3.4,7.6-rib*.6);
    c.strokeStyle="rgba(42,18,9,"+(.42+.24*(.5+.5*Math.cos(phase))).toFixed(3)+")";
    c.beginPath();
    c.moveTo(centerX-lateral*.30,-height);
    c.bezierCurveTo(centerX-11-lateral,height*-.58,centerX+12+lateral,height*.58,centerX+lateral*.3,height);
    c.stroke();
    c.lineWidth=Math.max(2,3.8-rib*.26);
    c.strokeStyle="rgba(255,236,159,"+(.36+.56*(.5+.5*Math.cos(phase+.28))).toFixed(3)+")";
    c.beginPath();
    c.moveTo(centerX-5-lateral*.28,-height);
    c.bezierCurveTo(centerX-17-lateral,height*-.54,centerX+7+lateral,height*.52,centerX-5+lateral*.28,height);
    c.stroke();
    // The opposing spiral face catches its highlight half a turn later.
    c.lineWidth=1.8;
    c.strokeStyle="rgba(255,249,196,"+(.14+.32*(.5+.5*Math.cos(phase+Math.PI))).toFixed(3)+")";
    c.beginPath();
    c.moveTo(centerX+4,-height*.87);
    c.quadraticCurveTo(centerX+12*Math.sin(phase),0,centerX+3,height*.86);
    c.stroke();
  }
  const specular=c.createLinearGradient(62,-36,167,23);
  specular.addColorStop(0,"rgba(255,243,173,.10)");
  specular.addColorStop(.48,"rgba(246,203,118,.015)");
  specular.addColorStop(1,"rgba(255,250,199,.20)");
  c.fillStyle=specular;c.fillRect(58,-49,113,100);
  c.restore();
  // Source-defined mechanical seam hides the join at the engine coupling.
  // Two stationary concentric collars, no duplicated mechanical nose.
  c.save();
  c.strokeStyle="rgba(53,26,20,.82)";c.lineWidth=5.2;
  c.beginPath();c.ellipse(64,0,6.2,40,-.02,-Math.PI/2,Math.PI/2);c.stroke();
  c.strokeStyle="rgba(255,221,139,.94)";c.lineWidth=2.4;
  c.beginPath();c.ellipse(65,0,5.5,37,0,-Math.PI/2,Math.PI/2);c.stroke();
  c.restore();
  if(turbo){
    // Extracted original ten Turbo frames are FULL drill paintings. Display
    // only their changing luminous tip details; never duplicate their shafts.
    if(ready(assets?.turboAtlas)){
      const t=turboFrameRect(s.boostTime);
      c.save();
      c.beginPath();c.ellipse(158,0,20,30,0,0,PI2);c.clip();
      c.globalCompositeOperation="screen";
      c.globalAlpha=.22+.12*(.5+.5*Math.sin(s.time*25));
      c.drawImage(assets.turboAtlas,t.sx,t.sy,t.sw,t.sh,116,-39,61,78);
      c.restore();
    }
    const beam=c.createRadialGradient(170,0,1,170,0,36);
    beam.addColorStop(0,"rgba(255,248,192,.66)");
    beam.addColorStop(.33,"rgba(255,208,90,.24)");
    beam.addColorStop(1,"rgba(255,151,42,0)");
    c.fillStyle=beam;c.beginPath();c.arc(170,0,36,0,PI2);c.fill();
  }
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
    c.translate(-116,4);
    c.scale(-1,1);
    c.globalAlpha=.72*pulse;
    c.drawImage(assets.boosttrail,1,-39,139,76);
    c.globalAlpha=.38*pulse;
    c.drawImage(assets.boosttrail,13,-28,167,51);
    c.restore();
  }
  for(let i=0;i<13;i++){
    const xx=-125-((s.time*220+i*47)%115);
    const yy=Math.sin(s.time*16+i*2.4)*(13+i*1.9);
    c.strokeStyle=i%3===0?"rgba(255,244,176,.83)":"rgba(255,158,62,.55)";
    c.lineWidth=1.2+(i%3)*.7;c.beginPath();
    c.moveTo(xx,yy);c.lineTo(xx-31-i*1.2,yy-Math.sin(i)*3);c.stroke();
  }
  // The combustion flash belongs at the tailpipe, NOT in front of the auger.
  const glow=c.createRadialGradient(-127,4,1,-127,4,48);
  glow.addColorStop(0,"rgba(255,231,133,.44)");
  glow.addColorStop(.35,"rgba(255,150,62,.19)");
  glow.addColorStop(1,"rgba(255,130,45,0)");
  c.fillStyle=glow;c.beginPath();c.arc(-127,4,48,0,PI2);c.fill();
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
