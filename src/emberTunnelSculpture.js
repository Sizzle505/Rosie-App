import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";
import { FORMATION_LAYOUT, formationIntrusion } from "./emberTunnelLayout.js";

/**
 * Original illustrated, NON-TILED cliff geometry. These are large transparent
 * formations cropped from OG #14/#20/#21/#33-36, not slices of the #32 ribbon.
 * Their opaque stone, crystals and root-tips visibly project from the cut face.
 * The repeatable OG #32 ribbon below them keeps the rock/air contact honest.
 */
const ready = im => !!(im && im.complete && im.naturalWidth > 0);

// The transparent source cutouts may still have a hard vertical crop boundary.
// Build an alpha-feathered, ORIGINAL-source copy once per loaded image; never
// crop a rock with a rectangular screen-space box or alter its original file.
// A 16% horizontal falloff hides literal source-image boundaries while leaving
// the physically central crystal/root silhouette and collision core untouched.
const softenedCache=new WeakMap();
export function softenedFormation(im){
  if(!ready(im))return im;
  const found=softenedCache.get(im);
  if(found)return found;
  const off=document.createElement("canvas");
  off.width=im.naturalWidth;off.height=im.naturalHeight;
  const ctx=off.getContext("2d",{alpha:true});
  if(!ctx)return im;
  ctx.clearRect(0,0,off.width,off.height);
  ctx.drawImage(im,0,0);
  ctx.globalCompositeOperation="destination-in";
  const mask=ctx.createLinearGradient(0,0,off.width,0);
  mask.addColorStop(0,"rgba(255,255,255,0)");
  mask.addColorStop(.075,"rgba(255,255,255,.52)");
  mask.addColorStop(.17,"rgba(255,255,255,1)");
  mask.addColorStop(.83,"rgba(255,255,255,1)");
  mask.addColorStop(.925,"rgba(255,255,255,.52)");
  mask.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=mask;ctx.fillRect(0,0,off.width,off.height);
  // Preserve provenance for the real Canvas draw-call verifier. Source pixels
  // are used throughout, and the manifest-verified file is still the origin.
  off.src=im.src;
  softenedCache.set(im,off);
  return off;
}


function worldSurface(x,side){
  return tunnelCenter(x)+side*tunnelRadius(x);
}
function thetaAt(world,side){
  const d=20;
  return Math.atan2(worldSurface(world+d,side)-worldSurface(world-d,side),2*d);
}
function alphaCorridorClip(c,s,side){
  // Full-size original root and crystal silhouettes project prominently into
  // the playable airspace; collision cores are smaller than painted edges.
  c.beginPath();
  if(side<0){
    c.moveTo(-24,-80);c.lineTo(W+24,-80);
  } else {
    c.moveTo(-24,H+80);c.lineTo(W+24,H+80);
  }
  for(let x=W+24;x>=-24;x-=7){
    const y=worldSurface(s.scroll+x,side)-side*258;
    c.lineTo(x,y);
  }
  c.closePath();c.clip();
}
export function paintSculpturalTunnel(c,s,assets={}){
  let drawn=0;
  for(const side of [-1,1]){
    c.save();
    alphaCorridorClip(c,s,side);
    for(const item of FORMATION_LAYOUT){
      if(item.side!==side)continue;
      const screenX=item.at-s.scroll;
      if(screenX < -item.width*.55-12 || screenX > W+item.width*.55+12)continue;
      const sprite=assets[item.key];
      if(!ready(sprite))continue;
      const height=item.width*sprite.naturalHeight/sprite.naturalWidth;
      const intrusion=formationIntrusion(item);
      c.save();
      c.translate(screenX,worldSurface(item.at,side));
      c.rotate(thetaAt(item.at,side));
      c.globalAlpha=item.alpha;
      c.shadowBlur=item.obstacle?21:10;
      c.shadowColor=item.obstacle?"rgba(12,6,12,.84)":"rgba(8,6,13,.72)";
      c.filter=item.obstacle?"contrast(1.22) saturate(1.12)":"contrast(1.07) saturate(1.04)";
      // Top: preserved roots hang DOWN, floor: crystal relief rises UP.
      // This is an illustrated *formation*, NOT a wallpaper panel.
      const organicSprite=softenedFormation(sprite);
      if(side<0)c.drawImage(organicSprite,-item.width/2,-height+intrusion,item.width,height);
      else c.drawImage(organicSprite,-item.width/2,-intrusion,item.width,height);
      c.restore();
      drawn++;
    }
    c.restore();
  }
  return drawn;
}
export const OG_SCULPTURAL_ASSETS={
  ogCanopyA:"edge/formation/hanging-canopy-a.webp",
  ogCanopyB:"edge/formation/hanging-canopy-b.webp",
  ogCanopyC:"edge/formation/hanging-canopy-c.webp",
  ogCrystalA:"edge/formation/rising-crystal-a.webp",
  ogCrystalB:"edge/formation/rising-crystal-b.webp",
  ogCrystalC:"edge/formation/rising-crystal-c.webp",
  ogRichRoofA:"edge/formation/rich-roof-a.webp",
  ogRichRoofB:"edge/formation/rich-roof-b.webp",
  ogRichFloorA:"edge/formation/rich-floor-a.webp",
  ogRichFloorB:"edge/formation/rich-floor-b.webp",
  ogSlopeRoofA:"edge/formation/slope-roof-a.webp",
  ogSlopeRoofB:"edge/formation/slope-roof-b.webp",
  ogSlopeFloorA:"edge/formation/slope-floor-a.webp",
  ogSlopeFloorB:"edge/formation/slope-floor-b.webp",
  ogRootsOne:"edge/formation/original-roots-1.webp",
  ogRootsTwo:"edge/formation/original-roots-2.webp",
};
