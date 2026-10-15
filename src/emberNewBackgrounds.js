/**
 * Scenic alpha layers registered to the ACTUAL tunnel ceiling/floor.
 *
 * 2026-10-14 integration fix: the source BG02/BG07 overlays were formerly
 * stretched full-height, forming horizontal rectangular "tape" bands across
 * the air corridor. The imported art stays intact; its presentation is now
 * tied to the geological boundaries with limited, tapered intrusion.
 */
import {tunnelCenter,tunnelRadius} from "./emberDrillEngine.js";

export const NEW_EMBER_BACKGROUND_ART=Object.freeze({
 bg01:"new-assets/background/bg01.webp",
 bg02:"new-assets/background/bg02.webp",
 bg03:"new-assets/background/bg03.webp",
 bg04:"new-assets/background/bg04.webp",
 bg05:"new-assets/background/bg05.webp",
 bg06:"new-assets/background/bg06.webp",
 bg07:"new-assets/background/bg07.webp",
 bg08:"new-assets/background/bg08.webp",
 bg09:"new-assets/background/bg09.webp",
 bg10:"new-assets/background/bg10.webp",
});
const layers=[
 {key:"bg02",start:0,end:37,speed:.15,alpha:.56,side:-1},
 {key:"bg07",start:37,end:58,speed:.11,alpha:.45,side:1},
 {key:"bg09",start:52,end:75,speed:.06,alpha:.25,side:0},
];
const ready=i=>Boolean(i?.complete&&i.naturalWidth>0&&i.naturalHeight>0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
function surface(world,side){
 return tunnelCenter(world)+side*tunnelRadius(world);
}
// Clip near real rock face; preserve the original irregular illustrated alpha
// silhouette, and let the detailed continuous cave rim hide its attachment.
function clipNearFace(c,s,W,H,side,reach){
 c.beginPath();
 if(side<0){c.moveTo(-18,-30);c.lineTo(W+18,-30)}
 else {c.moveTo(-18,H+30);c.lineTo(W+18,H+30)}
 for(let x=W+18;x>=-18;x-=9)c.lineTo(x,surface(s.scroll+x,side)-side*reach);
 c.closePath();c.clip();
}
export function paintNewBackgroundParallax(c,s,assets,W,H){
 for(const layer of layers){
  if(s.time<layer.start||s.time>layer.end)continue;
  const im=assets?.[layer.key];if(!ready(im))continue;
  const sw=Math.min(im.naturalWidth,im.naturalHeight*W/H);
  const travel=Math.max(0,im.naturalWidth-sw);
  const u=s.scroll*layer.speed;
  const wrapped=travel?((u%(travel*2)+travel*2)%(travel*2)):0;
  const sx=travel?Math.min(wrapped,2*travel-wrapped):0;
  const opacity=layer.alpha*smooth((s.time-layer.start)/.85)*smooth((layer.end-s.time)/1.1);
  if(opacity<.004)continue;
  c.save();c.globalAlpha=opacity;
  if(layer.side===-1){
   clipNearFace(c,s,W,H,-1,58);
   // The source alpha dissipates naturally around the lower 45% of BG02;
   // align that disappearance with the ceiling rather than the screen center.
   const ceiling=surface(s.scroll+W*.5,-1);
   const height=335;
   c.drawImage(im,sx,0,sw,im.naturalHeight,0,ceiling-116,W,height);
  }else if(layer.side===1){
   clipNearFace(c,s,W,H,1,64);
   const floor=surface(s.scroll+W*.5,1);
   c.drawImage(im,sx,0,sw,im.naturalHeight,0,floor-250,W,345);
  }else{
   // Temple dust and stone tracery sit far behind the game; the organic rim
   // occludes the overlay so no rectilinear wall can cross playable space.
   c.beginPath();
   for(let x=-16;x<=W+16;x+=9){
    const y=surface(s.scroll+x,-1)+12;
    if(x===-16)c.moveTo(x,y);else c.lineTo(x,y);
   }
   for(let x=W+16;x>=-16;x-=9)c.lineTo(x,surface(s.scroll+x,1)-12);
   c.closePath();c.clip();
   c.drawImage(im,sx,0,sw,im.naturalHeight,0,0,W,H);
  }
  c.restore();
 }
}
