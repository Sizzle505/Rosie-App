import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

/**
 * Original illustrated, NON-TILED cliff geometry. These are large transparent
 * formations cropped from OG #14/#20/#21/#33-36, not slices of the #32 ribbon.
 * Their opaque stone, crystals and root-tips visibly project from the cut face.
 * The repeatable OG #32 ribbon below them keeps the rock/air contact honest.
 */
const ready = im => !!(im && im.complete && im.naturalWidth > 0);
const BARKROOT_FORMATIONS = [
  // Handplaced, world-locked ceiling overhangs, roots and floor strata.
  {at:520, side:-1, key:"ogCanopyA", width:465, alpha:.99},
  {at:820, side:1, key:"ogCrystalA", width:425, alpha:.98},
  {at:1570,side:-1,key:"ogRootsOne",width:222,alpha:1},
  {at:1890,side:1,key:"ogRichFloorA",width:425,alpha:1},
  {at:2690,side:-1,key:"ogSlopeRoofA",width:420,alpha:.96},
  {at:3220,side:1,key:"ogCrystalB",width:395,alpha:1},
  {at:3900,side:-1,key:"ogCanopyB",width:445,alpha:1},
  {at:4660,side:1,key:"ogSlopeFloorA",width:445,alpha:.95},
  {at:5350,side:-1,key:"ogRichRoofA",width:445,alpha:.98},
  {at:6090,side:1,key:"ogCrystalC",width:465,alpha:1},
  {at:6830,side:-1,key:"ogRootsTwo",width:237,alpha:.99},
  {at:7320,side:1,key:"ogRichFloorB",width:425,alpha:.98},
  {at:8130,side:-1,key:"ogCanopyC",width:450,alpha:1},
  {at:8760,side:1,key:"ogSlopeFloorB",width:415,alpha:.97},
  {at:9430,side:-1,key:"ogRichRoofB",width:450,alpha:1},
  {at:10190,side:1,key:"ogCrystalA",width:440,alpha:.98},
  {at:10980,side:-1,key:"ogSlopeRoofB",width:435,alpha:.97},
  {at:11630,side:1,key:"ogCrystalC",width:450,alpha:.98},
  {at:12240,side:-1,key:"ogCanopyB",width:445,alpha:1},
  {at:12960,side:1,key:"ogRichFloorA",width:435,alpha:1},
  // Later scenery is deliberately untouched until the Ruby visual gate.
];
function worldSurface(x,side){
  return tunnelCenter(x)+side*tunnelRadius(x);
}
function thetaAt(world,side){
  const d=20;
  return Math.atan2(worldSurface(world+d,side)-worldSurface(world-d,side),2*d);
}
function alphaCorridorClip(c,s,side){
  // The collision edge remains authoritative; only soft fine tips may reach
  // 13 px into the corridor. No floating ceilings or invisible hard corners.
  c.beginPath();
  if(side<0){
    c.moveTo(-24,-80);c.lineTo(W+24,-80);
  } else {
    c.moveTo(-24,H+80);c.lineTo(W+24,H+80);
  }
  for(let x=W+24;x>=-24;x-=7){
    const y=worldSurface(s.scroll+x,side)-side*13;
    c.lineTo(x,y);
  }
  c.closePath();c.clip();
}
export function paintSculpturalTunnel(c,s,assets={}){
  let drawn=0;
  for(const side of [-1,1]){
    c.save();
    alphaCorridorClip(c,s,side);
    for(const item of BARKROOT_FORMATIONS){
      if(item.side!==side)continue;
      const screenX=item.at-s.scroll;
      if(screenX < -item.width*.55-12 || screenX > W+item.width*.55+12)continue;
      const sprite=assets[item.key];
      if(!ready(sprite))continue;
      const height=item.width*sprite.naturalHeight/sprite.naturalWidth;
      c.save();
      c.translate(screenX,worldSurface(item.at,side));
      c.rotate(thetaAt(item.at,side));
      c.globalAlpha=item.alpha;
      // Top: preserved roots hang DOWN, floor: crystal relief rises UP.
      // This is an illustrated *formation*, NOT a wallpaper panel.
      if(side<0)c.drawImage(sprite,-item.width/2,-height+15,item.width,height);
      else c.drawImage(sprite,-item.width/2,-13,item.width,height);
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
