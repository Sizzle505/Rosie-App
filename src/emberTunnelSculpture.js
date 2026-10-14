import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";
import { FORMATION_LAYOUT, formationIntrusion } from "./emberTunnelLayout.js";

/**
 * Original illustrated, NON-TILED cliff geometry. These are large transparent
 * formations cropped from OG #14/#20/#21/#33-36, not slices of the #32 ribbon.
 * Their opaque stone, crystals and root-tips visibly project from the cut face.
 * The repeatable OG #32 ribbon below them keeps the rock/air contact honest.
 */
const ready = im => !!(im && im.complete && im.naturalWidth > 0);

function worldSurface(x,side){
  return tunnelCenter(x)+side*tunnelRadius(x);
}
function thetaAt(world,side){
  const d=20;
  return Math.atan2(worldSurface(world+d,side)-worldSurface(world-d,side),2*d);
}
function alphaCorridorClip(c,s,side){
  // The collision edge remains authoritative; only soft fine tips may reach
  // 133 px into the corridor. No floating ceilings or invisible hard corners.
  c.beginPath();
  if(side<0){
    c.moveTo(-24,-80);c.lineTo(W+24,-80);
  } else {
    c.moveTo(-24,H+80);c.lineTo(W+24,H+80);
  }
  for(let x=W+24;x>=-24;x-=7){
    const y=worldSurface(s.scroll+x,side)-side*133;
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
      c.shadowBlur=item.obstacle?16:9;
      c.shadowColor=item.obstacle?"rgba(255,179,89,.43)":"rgba(8,6,13,.72)";
      c.filter="contrast(1.10) saturate(1.08)";
      // Top: preserved roots hang DOWN, floor: crystal relief rises UP.
      // This is an illustrated *formation*, NOT a wallpaper panel.
      if(side<0)c.drawImage(sprite,-item.width/2,-height+intrusion,item.width,height);
      else c.drawImage(sprite,-item.width/2,-intrusion,item.width,height);
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
