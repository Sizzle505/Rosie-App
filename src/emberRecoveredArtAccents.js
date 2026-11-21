import {tunnelCenter} from "./emberDrillEngine.js";

// Art-only accents from assets already committed to Ember Tunnel.
// The entrance remains background scenery: it never creates a new hitbox.
// Turbo artwork is deliberately limited to its trailing glow; a complete
// golden drill silhouette must never be painted over the approved auger.
const ready=im=>Boolean(im?.complete&&im.naturalWidth>0&&im.naturalHeight>0);
export const BARKROOT_GATE_WORLD_X=790;

export function paintBarkrootArrival(c,s,assets,W){
  if(s.stageIndex!==0||!ready(assets?.terrainPassageGate))return false;
  const x=BARKROOT_GATE_WORLD_X-s.scroll;
  if(x< -125||x>W+125)return false;
  const im=assets.terrainPassageGate;
  // Source has a stray red horizontal line at its right margin. Keep only
  // the central illustrated doorway, never that damaged edge or any matte.
  const sx=Math.round(im.naturalWidth*.275);
  const sy=Math.round(im.naturalHeight*.275);
  const sw=Math.round(im.naturalWidth*.40);
  const sh=Math.round(im.naturalHeight*.45);
  // Sit in a shallow far-wall alcove, above the real center of the route.
  const y=tunnelCenter(BARKROOT_GATE_WORLD_X)-122;
  c.save();
  c.globalAlpha=.41;
  c.translate(x,y);
  // A small distant doorway, softly embedded in the background, not a
  // second tunnel wall and not a collision-bearing obstacle.
  c.beginPath();c.ellipse(0,0,66,75,0,0,Math.PI*2);c.clip();
  c.drawImage(im,sx,sy,sw,sh,-67,-75,134,150);
  c.restore();
  return true;
}

export function paintRecoveredTurboTrail(c,s,assets){
  if(!(s.boostTime>0)||!ready(assets?.boosttrail))return false;
  const im=assets.boosttrail;
  const sw=Math.round(im.naturalWidth*.43);
  // Use only the fiery LEFT edge: the source's right-hand cone is another
  // complete drill nose. The approved rotating 16-frame auger stays visible.
  c.save();
  c.globalCompositeOperation="screen";
  c.globalAlpha=.26+.06*Math.sin(s.time*23);
  c.drawImage(im,0,0,sw,im.naturalHeight,-248,-49,136,97);
  c.restore();
  return true;
}
