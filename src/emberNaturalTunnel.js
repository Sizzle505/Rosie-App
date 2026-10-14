import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

// Surface materials are deliberately non-structural: collision and wall geometry
// are defined exactly once by emberDrillEngine. No separate scenery sprites are
// rotated, tiled in giant chunks, or used as alternative walls.
const STEP=8;
const patternCache=new WeakMap();
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fract=x=>x-Math.floor(x);
const hash=x=>fract(Math.sin(x*127.31+91.13)*43758.5453);
const artReady=im=>Boolean(im?.complete&&im.naturalWidth>0);

function wallPosition(worldX,side){
  // The small irregularity points OUTWARD from the collider. It must never
  // visually conceal a safe corridor or create phantom obstructions.
  const wav=3.1*Math.sin(worldX*.035+1.3)
    +2.1*Math.sin(worldX*.078-.4)
    +1.3*Math.sin(worldX*.142+2.1);
  return tunnelCenter(worldX)+side*(tunnelRadius(worldX)+5+wav);
}
function path(c,points){
  c.beginPath();
  points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
}
function outsidePath(c,points,side){
  c.beginPath();
  if(side===-1){
    c.moveTo(-STEP,-STEP);c.lineTo(W+STEP,-STEP);
  }else{
    c.moveTo(-STEP,H+STEP);c.lineTo(W+STEP,H+STEP);
  }
  for(let i=points.length-1;i>=0;i--)c.lineTo(points[i][0],points[i][1]);
  c.closePath();
}
function getPattern(c,img,worldOffset){
  if(!artReady(img))return null;
  let cache=patternCache.get(c);
  if(!cache){cache=new WeakMap();patternCache.set(c,cache);}
  let p=cache.get(img);
  if(!p){p=c.createPattern(img,"repeat");cache.set(img,p);}
  // Pattern phase moves with the world rather than remaining stationary as
  // terrain scrolls. A 640px diffuse repeating MATERIAL has no large landmarks.
  if(p?.setTransform && typeof DOMMatrix!=="undefined"){
    p.setTransform(new DOMMatrix().translate(-Math.floor(worldOffset*.83),-12));
  }
  return p;
}
function phase(s){
  if(s.time>=57)return {key:"terrainTemple",rock:"#423b42",light:"#c5a06b",crystal:true};
  if(s.time>=37)return {key:"terrainRuby",rock:"#4e2e39",light:"#b76c68",crystal:true};
  if(s.time>=20)return {key:"terrainRoots",rock:"#51362e",light:"#ae754f",crystal:false};
  return {key:"terrainEarth",rock:"#543328",light:"#c08651",crystal:false};
}
function drawWall(c,s,side,assets,stage){
  const pts=[];
  for(let x=-STEP;x<=W+STEP;x+=STEP)pts.push([x,wallPosition(s.scroll+x,side)]);
  c.save();
  outsidePath(c,pts,side);c.clip();
  // Preserve the elaborate illustrated backdrop but make the earth itself
  // visibly continuous. The texture never covers the playable channel.
  const fill=c.createLinearGradient(0,0,0,H);
  if(side<0){
    fill.addColorStop(0,"rgba(17,9,13,.31)");
    fill.addColorStop(.57,"rgba(18,10,16,.13)");
    fill.addColorStop(1,"rgba(24,12,16,.03)");
  }else{
    fill.addColorStop(0,"rgba(24,12,16,.03)");
    fill.addColorStop(.4,"rgba(20,12,15,.10)");
    fill.addColorStop(1,"rgba(16,10,14,.38)");
  }
  c.fillStyle=fill;c.fillRect(0,0,W,H);
  const material=getPattern(c,assets[stage.key],s.scroll);
  if(material){
    c.globalAlpha=.37;
    c.fillStyle=material;c.fillRect(0,0,W,H);
    c.globalAlpha=1;
  }
  c.restore();

  // A concave soft undercut suggests volume without an artificial bright line.
  c.save();c.lineJoin="round";c.lineCap="round";
  for(const [width,color] of [
    [39,"rgba(10,8,11,.10)"],
    [24,"rgba(17,10,13,.13)"],
    [12,"rgba(30,16,17,.10)"],
    [4,"rgba(72,38,26,.12)"],
  ]){
    path(c,pts);c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
  c.restore();
}
function facetedStones(c,s,side,stage){
  // Small, locally grounded rock chunks are uniformly distributed along the
  // same continuous wall - no rectangular joins, columns or painted bars.
  const gap=69;
  const lo=Math.floor(s.scroll/gap)-2,hi=Math.ceil((s.scroll+W)/gap)+1;
  for(let i=lo;i<=hi;i++){
    const world=i*gap+(hash(i+24)-.5)*21;
    const x=world-s.scroll;
    const y=wallPosition(world,side);
    const extent=9+hash(i+108)*21;
    const depth=4+hash(i+85)*7;
    const d=side*depth;
    c.beginPath();
    c.moveTo(x-extent,y+side*1.5);
    c.lineTo(x-extent*.53,y+d*1.4);
    c.lineTo(x+extent*.15,y+d*1.8);
    c.lineTo(x+extent,y+side*1.2);
    c.lineTo(x+extent*.35,y-side*1.3);
    c.closePath();
    c.fillStyle=i%3===0?"rgba(32,19,19,.39)":i%3===1?"rgba(89,56,38,.27)":"rgba(62,38,32,.34)";
    c.fill();
    c.beginPath();c.moveTo(x-extent*.6,y+side*1);
    c.quadraticCurveTo(x,y+side*(depth*.7),x+extent*.55,y+side*1);
    c.strokeStyle=i%5===0?"rgba(230,177,105,.23)":"rgba(166,113,80,.15)";
    c.lineWidth=1.6;c.stroke();

    // Root threads / fractured strata must grow out of the wall, not float.
    if(i%5===2 && s.time<39){
      const a=12+hash(i+301)*23;
      c.beginPath();c.moveTo(x,y+side*3);
      c.bezierCurveTo(x+6,y-side*8,x-11,y-side*a*.5,x-2+hash(i+70)*12,y-side*a);
      c.strokeStyle="rgba(98,62,37,.45)";c.lineWidth=2+hash(i+13)*2;c.stroke();
      c.strokeStyle="rgba(185,113,54,.19)";c.lineWidth=.85;c.stroke();
    }
    if(stage.crystal&&i%8===3){
      const r=9+hash(i+601)*6;
      c.beginPath();
      c.moveTo(x-r*.75,y);c.lineTo(x-r*.45,y+side*r*1.4);
      c.lineTo(x,y+side*r*2.1);c.lineTo(x+r*.6,y+side*r*.75);c.lineTo(x+r*.4,y);
      c.closePath();c.fillStyle="rgba(136,34,66,.5)";c.fill();
      c.beginPath();c.moveTo(x,y+side*r*2.1);c.lineTo(x+r*.15,y+side*r*.52);c.lineTo(x+r*.5,y+side*r*.8);
      c.fillStyle="rgba(247,114,136,.43)";c.fill();
    }
    if(s.time>58&&i%8===4){
      // Short inset mortar marks, never an unbroken temple outline.
      c.beginPath();c.moveTo(x-13,y+side*5);c.lineTo(x+17,y+side*5);
      c.strokeStyle="rgba(201,158,96,.21)";c.lineWidth=2;c.stroke();
    }
  }
}
export function paintNaturalTunnel(c,s,assets={}){
  const stage=phase(s);
  for(const side of [-1,1]){
    drawWall(c,s,side,assets,stage);
    facetedStones(c,s,side,stage);
  }
}
