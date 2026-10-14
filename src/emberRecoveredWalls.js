import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

// Each recovered painting is a freestanding irregular edge fragment, not a
// horizontally repeating wall. These hand-positioned scenes create real visual
// variety while the smooth collision corridor remains wholly unobstructed.
const WALL_PIECES = [
  {x:900, side:-1, key:"wallAmberCeiling"},
  {x:1850,side: 1, key:"wallAmberFloor"},
  {x:3100,side:-1, key:"wallFantasyCeiling"},
  {x:4350,side: 1, key:"wallFantasyFloor"},
  {x:5850,side:-1, key:"wallLanternCeiling"},
  {x:7650,side:-1, key:"wallDescentCeiling"},
  {x:8950,side: 1, key:"wallDescentFloor"},
  {x:11350,side:-1,key:"wallRubyCeiling"},
  {x:13350,side: 1,key:"wallRubyFloor"},
  {x:15500,side: 1,key:"wallCrystalFloor"},
  {x:18850,side:-1,key:"wallSanctumCeiling"},
  {x:22350,side: 1,key:"wallSanctumFloor"},
];
const artReady=image=>Boolean(image?.complete && image.naturalWidth>0);
const signedDistance=(worldX,side)=>tunnelCenter(worldX)+side*tunnelRadius(worldX);
function angle(worldX,side){
  return Math.atan2(signedDistance(worldX+75,side)-signedDistance(worldX-75,side),150);
}
function outerTerrainClip(c,s,side){
  const interval=18;
  c.beginPath();
  if(side<0){c.moveTo(-interval,-interval);c.lineTo(W+interval,-interval);}
  else {c.moveTo(-interval,H+interval);c.lineTo(W+interval,H+interval);}
  for(let xx=W+interval;xx>=-interval;xx-=interval)
    c.lineTo(xx,signedDistance(s.scroll+xx,side));
  c.closePath();c.clip();
}
function drawSegment(c,s,img,worldX,side,index){
  if(!artReady(img))return;
  const screenX=worldX-s.scroll;
  if(screenX<-330||screenX>W+330)return;
  const y=signedDistance(worldX,side);
  const width=430+(index%3)*15;
  const height=img.naturalHeight*width/img.naturalWidth;
  c.save();
  outerTerrainClip(c,s,side);
  c.translate(screenX,y);
  c.rotate(angle(worldX,side));
  c.globalAlpha=.71;
  // Fragment is mostly outside the tunnel, with only the fine natural edge
  // touching the corridor. The clip prevents unnatural rectangular overhangs.
  c.drawImage(img,-width*.5,side<0?-height+12:-12,width,height);
  c.restore();
}
function fallback(c,s,art){
  // Earlier accepted artwork still appears sparingly until all recovered images
  // have decoded. No scaling into thin repeated strips.
  const roof=art.hangingRoots||art.roof;
  const floor=art.descentFloor||art.floor;
  for(let i=0;i<5;i++){
    const x=1250+i*5000;
    const img=i%2===0?roof:floor;
    drawSegment(c,s,img,x,i%2===0?-1:1,i);
  }
}
export function paintRecoveredWalls(c,s,art={}){
  if(!artReady(art.wallAmberCeiling)||!artReady(art.wallSanctumFloor)){
    fallback(c,s,art);
    return;
  }
  for(let i=0;i<WALL_PIECES.length;i++){
    const p=WALL_PIECES[i];
    drawSegment(c,s,art[p.key],p.x,p.side,i);
  }
}
