import { TURBO_DURATION, DRILL_TIP_OFFSET, DRILL_TIP_VERTICAL_OFFSET } from "./emberDrillEngine.js";

/**
 * Ember Tunnel's registered, source-derived mechanical animation.
 *
 * All four source WebPs were transferred with PR #139. The auger source is
 * cropped and translated ONCE into a registered 4x4 atlas after image load,
 * using the metadata of the approved handoff (no recoloring or invented
 * frames). The rear jet/impact cells are taken directly from the 4x2 sources.
 *
 * All positions below are VEHICLE-LOCAL. The parent painter alone translates
 * and rotates the entire vehicle, so attachments cannot drift while pitching.
 */
const ready = image => !!(image?.complete && image.naturalWidth > 0);
const TAU = Math.PI * 2;
export const AUGER_SHEET = Object.freeze({ columns:4, rows:4, frameWidth:360, frameHeight:300, frames:16 });
export const DRILL_REGISTRATION = Object.freeze({
  // Recess the source's rear ribs inside the original approved collar.
  // The animated master is unscaled and every frame uses this same offset.
  rootX:51, tipX:DRILL_TIP_OFFSET, tipY:DRILL_TIP_VERTICAL_OFFSET,
  nozzleX:-116, nozzleY:4,
  augerX:44, augerY:-52, augerW:120, augerH:110,
});
export const JET_SHEET = Object.freeze({ columns:4, rows:2, frames:8, sourceWidth:2172, sourceHeight:724, frameWidth:543, frameHeight:362 });
export const IMPACT_SHEET = Object.freeze({ columns:4, rows:2, frames:8, sourceWidth:1774, sourceHeight:887, frameWidth:443.5, frameHeight:443.5 });

// Source cell boundaries and alpha crops are from the supplied handoff's
// Animation Asset Manifest.json, in the exact 1387x1134 ORIGINAL master.
const AUGER_X = [0,347,694,1040,1387];
const AUGER_Y = [0,284,567,850,1134];
const AUGER_ALPHA = [
  [17,24,342,269,20,28], [15,23,341,269,20,27],
  [14,23,340,269,20,27], [14,23,337,269,20,27],
  [15,19,342,266,20,26], [15,19,340,266,20,26],
  [14,19,340,266,20,26], [14,19,337,266,20,26],
  [15,15,342,259,20,28], [15,15,342,259,20,28],
  [14,15,340,259,20,28], [13,15,336,259,20,28],
  [15,10,340,256,20,27], [13,10,339,256,20,27],
  [12,11,338,256,20,28], [13,11,335,256,20,28],
];
const augerAtlases = new WeakMap();
const elapsedFrame = (seconds,fps,count) =>
  Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)*fps+1e-7)%count;

export function augerFrameIndex(seconds,turbo=false) {
  // Both modes traverse ALL sixteen physically different source paintings.
  return elapsedFrame(seconds,turbo?29:17,AUGER_SHEET.frames);
}
export function augerFrameRect(index) {
  const i=((Math.trunc(index)%16)+16)%16;
  return {sx:(i%4)*360,sy:Math.floor(i/4)*300,sw:360,sh:300};
}
export function jetFrameIndex(seconds) { return elapsedFrame(seconds,15,JET_SHEET.frames); }
export function impactFrameIndex(age) {
  if(!Number.isFinite(age)||age<0||age>=.32)return -1;
  return Math.min(7,Math.floor(age/.04));
}

/** A one-time cache: never build an atlas in an animation frame again. */
export function prepareAugerAtlas(image) {
  if(!ready(image) || typeof document==="undefined")return null;
  if(augerAtlases.has(image))return augerAtlases.get(image);
  const canvas=document.createElement("canvas");
  canvas.width=AUGER_SHEET.columns*AUGER_SHEET.frameWidth;
  canvas.height=AUGER_SHEET.rows*AUGER_SHEET.frameHeight;
  canvas.__spriteName="registered-16-frame-auger";
  const ctx=canvas.getContext("2d");
  if(!ctx)return null;
  const scaleX=image.naturalWidth/1387, scaleY=image.naturalHeight/1134;
  AUGER_ALPHA.forEach(([l,t,r,b,dx,dy],i)=>{
    const col=i%4,row=Math.floor(i/4);
    // Crop original transparent source art, then TRANSLATE to shared
    // registration. Each drawing retains its original exact proportions.
    ctx.drawImage(image,(AUGER_X[col]+l)*scaleX,
      (AUGER_Y[row]+t)*scaleY,(r-l)*scaleX,(b-t)*scaleY,
      col*360+dx,row*300+dy,r-l,b-t);
  });
  augerAtlases.set(image,canvas);
  return canvas;
}
export function primeMechanicalAtlases(assets) {
  prepareAugerAtlas(assets?.auger);
}

export function paintOriginalAuger(c,s,assets) {
  const atlas=prepareAugerAtlas(assets?.auger);
  if(!atlas)return false;
  const frame=augerFrameRect(augerFrameIndex(s.time,s.boostTime>0));
  const {augerX,augerY,augerW,augerH}=DRILL_REGISTRATION;
  // Alpha art starts at x=~51 and finishes x=~158: same as the
  // actual nose used by collision and excavation effects.
  c.drawImage(atlas,frame.sx,frame.sy,frame.sw,frame.sh,
    augerX,augerY,augerW,augerH);
  return true;
}

// Keep these legacy exports for existing QA imports; they no longer drive
// the gameplay (the full-head Turbo atlas is intentionally NOT overlaid).
export const TURBO_ATLAS=Object.freeze({columns:5,rows:2,frameWidth:308,frameHeight:126,frames:10,frameMs:60});
export function turboFrameIndex(remainingSeconds) {
  const seconds=Math.max(0,TURBO_DURATION-(Number.isFinite(remainingSeconds)?remainingSeconds:TURBO_DURATION));
  return Math.floor(seconds*1000/TURBO_ATLAS.frameMs+1e-7)%TURBO_ATLAS.frames;
}
export function turboFrameRect(remainingSeconds) {
  const i=turboFrameIndex(remainingSeconds);
  return {sx:(i%5)*308,sy:Math.floor(i/5)*126,sw:308,sh:126};
}

export function paintOriginalBoostExhaust(c,s,assets) {
  if(!(s.boostTime>0)||!ready(assets?.jetSheet))return;
  const img=assets.jetSheet,frame=jetFrameIndex(s.time);
  const col=frame%4,row=Math.floor(frame/4);
  // The already-optimized source is 1400x467, from original 2172x724.
  // Fixed source grid: variable flame length, fixed ignition/nozzle origin.
  const x=[0,543,1086,1629,2172],y=[0,362,724];
  const sx=x[col]*img.naturalWidth/2172,sy=y[row]*img.naturalHeight/724;
  const sw=(x[col+1]-x[col])*img.naturalWidth/2172;
  const sh=(y[row+1]-y[row])*img.naturalHeight/724;
  c.save();
  c.globalCompositeOperation="screen";
  // X reflection applies only to jet, not to Rosie or the vehicle. Bright
  // emission remains on the tailpipe at (-116,+4); plume extends LEFT.
  c.translate(DRILL_REGISTRATION.nozzleX,DRILL_REGISTRATION.nozzleY);
  c.scale(-1,1);
  c.globalAlpha=.87;
  c.drawImage(img,sx,sy,sw,sh,-9,-54,175,108);
  c.restore();
}

/**
 * A short event-driven burst. s.tipBurstAt is set only upon ignition or a
 * real drill-tip shatter. No permanent second cone or ghost drill is drawn.
 */
export function paintTurboTip(c,s,assets) {
  if(!(s.boostTime>0))return;
  const {tipX,tipY}=DRILL_REGISTRATION;
  // Subtle constant Turbo charge, centered on the corrected rotating nose.
  const glow=c.createRadialGradient(tipX,tipY,1,tipX,tipY,19);
  glow.addColorStop(0,"rgba(255,237,166,.25)");
  glow.addColorStop(1,"rgba(255,154,47,0)");
  c.fillStyle=glow;c.beginPath();c.arc(tipX,tipY,19,0,TAU);c.fill();

  if(!Number.isFinite(s.tipBurstAt)||!ready(assets?.impactSheet))return;
  const index=impactFrameIndex(s.time-s.tipBurstAt);
  if(index<0)return;
  const img=assets.impactSheet,col=index%4,row=Math.floor(index/4);
  const x=[0,444,887,1330,1774], y=[0,444,887];
  const sx=x[col]*img.naturalWidth/1774,sy=y[row]*img.naturalHeight/887;
  const sw=(x[col+1]-x[col])*img.naturalWidth/1774;
  const sh=(y[row+1]-y[row])*img.naturalHeight/887;
  c.save();
  c.globalCompositeOperation="screen";
  c.globalAlpha=.78*(1-(s.time-s.tipBurstAt)/.42);
  // Keep impact relative to the *same* shifted tip, including local Y.
  // It must follow the vehicle's existing pitch and never become a ghost cone.
  c.drawImage(img,sx,sy,sw,sh,tipX-23,tipY-39,104,78);
  c.restore();
}

export function paintTurboWorldStreaks(c,s,width,height) {
  if(!(s.boostTime>0))return;
  c.save();c.globalCompositeOperation="screen";
  for(let i=0;i<11;i++){
    const y=45+((i*73.9+17)%Math.max(1,height-100));
    const x=((i*167-s.scroll*1.65)%(width+200)+width+200)%(width+200)-90;
    c.strokeStyle=i%3===0?"rgba(255,225,135,.20)":"rgba(220,132,64,.13)";
    c.lineWidth=i%3===0?2.3:1.25;c.beginPath();c.moveTo(x,y);
    c.lineTo(x-88-i*4,y+1);c.stroke();
  }
  c.restore();
}
