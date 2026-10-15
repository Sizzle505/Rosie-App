import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

// The original recovered illustrations are individual organic formations,
// never wallpaper or structural atlas tiles. One-off hand-authored landmarks.
const PIECES = [
  {world:360,side:-1,key:"wallAmberCeiling",scale:1.03},
  {world:1030,side:1,key:"wallAmberFloor",scale:1.02},
  {world:2380,side:-1,key:"wallFantasyCeiling",scale:.95},
  {world:3950,side:1,key:"wallFantasyFloor",scale:1.04},
  {world:5300,side:-1,key:"wallLanternCeiling",scale:.94},
  {world:7120,side:-1,key:"wallDescentCeiling",scale:1.02},
  {world:8650,side:1,key:"wallDescentFloor",scale:.98},
  {world:11100,side:-1,key:"wallRubyCeiling",scale:1.03},
  {world:12850,side:1,key:"wallRubyFloor",scale:.98},
  {world:15200,side:1,key:"wallCrystalFloor",scale:1.03},
  {world:18100,side:-1,key:"wallSanctumCeiling",scale:1.03},
  {world:21400,side:1,key:"wallSanctumFloor",scale:1.02}
];
const ready=i=>Boolean(i?.complete&&i.naturalWidth>0);
const prepared=new WeakMap();
const boundary=(x,side)=>tunnelCenter(x)+side*tunnelRadius(x);

// Fade only the fragment's horizontal ends so the natural transparent rock
// silhouette survives. Cache preprocessing - no per-frame Canvas allocation.
function feather(img){
  if(!ready(img))return img;
  if(prepared.has(img))return prepared.get(img);
  if(typeof document==="undefined")return img;
  const buffer=document.createElement("canvas");
  buffer.width=img.naturalWidth;buffer.height=img.naturalHeight;
  const b=buffer.getContext("2d");
  if(!b)return img;
  b.drawImage(img,0,0);
  b.globalCompositeOperation="destination-in";
  const g=b.createLinearGradient(0,0,buffer.width,0);
  g.addColorStop(0,"rgba(0,0,0,0)");
  g.addColorStop(.075,"rgba(0,0,0,1)");
  g.addColorStop(.925,"rgba(0,0,0,1)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  b.fillStyle=g;b.fillRect(0,0,buffer.width,buffer.height);
  prepared.set(img,buffer);
  return buffer;
}
function exteriorClip(c,s,side){
  c.beginPath();
  if(side<0){c.moveTo(-16,-16);c.lineTo(W+16,-16);}
  else{c.moveTo(-16,H+16);c.lineTo(W+16,H+16);}
  for(let x=W+16;x>=-16;x-=8){
    c.lineTo(x,boundary(s.scroll+x,side));
  }
  c.closePath();c.clip();
}
// The 530x177 recovered panel has two separate transparent, illustrated
// lips. Crop those halves and register each to its OWN collision boundary.
// It is never drawn as a rectangular corridor overlay.
function paintCrystalInset(c,s,assets){
  const img=assets.crystalOverlay;
  if(!ready(img))return;
  const world=16900,x=world-s.scroll;
  if(x<-250||x>W+250)return;
  const source=feather(img),width=342,height=62;
  for(const side of [-1,1]){
    const y=boundary(world,side);
    const slope=Math.atan2(boundary(world+100,side)-boundary(world-100,side),200);
    c.save();
    exteriorClip(c,s,side);
    c.translate(x,y);c.rotate(slope);c.globalAlpha=.9;
    const srcY=side<0?0:88,srcH=side<0?88:89;
    c.drawImage(source,0,srcY,530,srcH,-width/2,side<0?-height+7:-7,width,height);
    c.restore();
  }
}
export function paintRecoveredWalls(c,s,assets={}){
  for(const item of PIECES){
    const x=item.world-s.scroll;
    if(x<-260||x>W+260)continue;
    const img=assets[item.key];
    if(!ready(img))continue;
    const w=355*item.scale;
    const h=w*img.naturalHeight/img.naturalWidth;
    const y=boundary(item.world,item.side);
    const tangent=Math.atan2(
      boundary(item.world+110,item.side)-boundary(item.world-110,item.side),220
    );
    c.save();
    exteriorClip(c,s,item.side);
    c.translate(x,y);c.rotate(tangent);
    c.globalAlpha=.94;
    // Natural alpha fragment touches the REAL collision surface. Never draw
    // the full painting across the air passage or repeat it along the edge.
    c.drawImage(feather(img),-w/2,item.side<0?-h+7:-7,w,h);
    c.restore();
  }
  paintCrystalInset(c,s,assets);
}
