import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

/**
 * Rock actually OCCUPIES everything outside the playable channel.
 * Source panorama is only visible IN the tunnel. The same engine geometry
 * establishes collider, opaque rock silhouette and decorative surface.
 * No stitched wall paintings, rectangular panels or arbitrarily drawn rails.
 */
const STEP=9;
const patterns=new WeakMap();
const fract=n=>n-Math.floor(n);
const hash=n=>fract(Math.sin(n*127.31+91.13)*43758.5453);
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ready=i=>Boolean(i&&i.complete&&i.naturalWidth>0);
const TERRAINS=[
  {at:0,key:"terrainEarth",base:"#493023",edge:"#875039",highlight:"#cf9154",crystal:false},
  {at:20,key:"terrainRoots",base:"#3f2c25",edge:"#78513a",highlight:"#c28b5b",crystal:false},
  {at:37,key:"terrainRuby",base:"#3d2933",edge:"#80505a",highlight:"#e0a17b",crystal:true},
  {at:57,key:"terrainTemple",base:"#30272e",edge:"#755e55",highlight:"#d7b17a",crystal:true}
];
function materialStage(time){
  let idx=0;
  for(let i=1;i<TERRAINS.length;i++)if(time>=TERRAINS[i].at)idx=i;
  return {
    current:TERRAINS[idx],
    previous:TERRAINS[Math.max(0,idx-1)],
    fade:idx===0?1:clamp((time-TERRAINS[idx].at)/2.7,0,1)
  };
}
function surface(worldX,side){
  // Roughness always goes OUT of the collision corridor. There are no
  // decorative invisible obstacles or visually narrower safe passages.
  const n=3.1*Math.sin(worldX*.035+1.3)
    +2.2*Math.sin(worldX*.078-.4)
    +1.1*Math.sin(worldX*.142+2.1);
  return tunnelCenter(worldX)+side*(tunnelRadius(worldX)+5+Math.abs(n)*.86);
}
function edgePath(c,points){
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
}
function earthPath(c,points,side){
  c.beginPath();
  if(side<0){c.moveTo(-STEP,-STEP);c.lineTo(W+STEP,-STEP);}
  else{c.moveTo(-STEP,H+STEP);c.lineTo(W+STEP,H+STEP);}
  for(let i=points.length-1;i>=0;i--)c.lineTo(points[i][0],points[i][1]);
  c.closePath();
}
function pattern(c,image,scroll) {
  if(!ready(image))return null;
  let cached=patterns.get(c);
  if(!cached){cached=new WeakMap();patterns.set(c,cached);}
  let p=cached.get(image);
  if(!p){p=c.createPattern(image,"repeat");cached.set(image,p);}
  if(p?.setTransform&&typeof DOMMatrix!=="undefined"){
    // It is THE MATERIAL that repeats (not illustrated cavern landmarks).
    p.setTransform(new DOMMatrix().translate(-Math.round(scroll*.90),0));
  }
  return p;
}
function fillStratum(c,s,stage,alpha){
  if(alpha<=0)return;
  const img=pattern(c,s.assets[stage.key],s.scroll);
  c.globalAlpha=alpha;
  c.fillStyle=stage.base;
  c.fillRect(0,0,W,H);
  if(img){
    c.globalAlpha=alpha*.91;
    c.fillStyle=img;
    c.fillRect(0,0,W,H);
  }
  c.globalAlpha=1;
}
function drawEarth(c,s,side,assets,stage,points){
  c.save();
  earthPath(c,points,side);c.clip();
  const prepared={scroll:s.scroll,assets};
  // The rock is solid, unlike the former .37-opacity wash. Color first,
  // then the fully registered diffuse texture; neither shows scene art through.
  fillStratum(c,prepared,stage.previous,1);
  if(stage.fade>0&&stage.current!==stage.previous){
    fillStratum(c,prepared,stage.current,stage.fade);
  }
  // Darker outer depths keep the cave moody without obscuring the cut face.
  const depth=c.createLinearGradient(0,0,0,H);
  if(side<0){
    depth.addColorStop(0,"rgba(8,6,10,.23)");
    depth.addColorStop(.65,"rgba(12,7,9,.01)");
    depth.addColorStop(1,"rgba(12,7,9,0)");
  }else{
    depth.addColorStop(0,"rgba(10,6,9,0)");
    depth.addColorStop(.4,"rgba(10,6,9,.01)");
    depth.addColorStop(1,"rgba(7,6,9,.25)");
  }
  c.fillStyle=depth;c.fillRect(0,0,W,H);
  c.restore();

  // Soft erosion/contact-shadow BELOW/ABOVE the exposed soil line; never a
  // bold straight stripe. Stroke is continuous and follows the engine path.
  c.save();c.lineJoin="round";c.lineCap="round";
  for(const [width,color] of [
    [35,"rgba(14,8,12,.16)"],
    [20,"rgba(20,11,12,.14)"],
    [8,"rgba(42,24,17,.18)"]
  ]){
    edgePath(c,points);c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
  c.restore();
}
function drawFracturedFace(c,s,side,stage,points){
  // Continuous, shallow exposed rock face: a narrow geological layer on the
  // exterior side of the true silhouette. No repeated illustration panels.
  const outer=points.map(([x,y])=>[x,y+side*(
    27+4.8*Math.sin((s.scroll+x)/54+side)
      +3*Math.sin((s.scroll+x)/21-.7)
  )]);
  c.save();
  earthPath(c,points,side);c.clip();
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  for(let i=outer.length-1;i>=0;i--)c.lineTo(...outer[i]);
  c.closePath();
  c.globalAlpha=.44;c.fillStyle=stage.current.edge;c.fill();
  c.globalAlpha=1;
  // Inset shadow establishes an undercut, without a bright continuous border.
  edgePath(c,outer);
  c.strokeStyle="rgba(13,8,11,.27)";
  c.lineJoin="round";c.lineWidth=9;c.stroke();
  // Short, irregular strata glints and faceted faults, attached to the wall.
  for(let i=3;i<points.length-2;i+=5){
    const [x,y]=points[i], depth=side*(13+hash(Math.floor((s.scroll+x)/23))*9);
    const width=12+hash(Math.floor((s.scroll+x)/37))*17;
    c.beginPath();
    c.moveTo(x-width*.55,y+depth*.55);
    c.lineTo(x-width*.12,y+depth*1.12);
    c.lineTo(x+width*.54,y+depth*.60);
    c.lineTo(x+width*.18,y+depth*.28);
    c.closePath();
    c.fillStyle=i%3===0?"rgba(227,167,94,.18)":"rgba(24,14,15,.18)";
    c.fill();
    if(i%3===0){
      c.beginPath();c.moveTo(x-width*.38,y+depth*.46);
      c.lineTo(x+width*.33,y+depth*.38);
      c.strokeStyle="rgba(235,172,98,.17)";c.lineWidth=1;c.stroke();
    }
  }
  c.restore();
}
function drawExposedRidge(c,s,side,stage){
  // Multiple irregular, interlocked chips produce the illusion of broken rock
  // without recycling painted cliffs as rectangular collage pieces.
  const gap=49;
  const start=Math.floor(s.scroll/gap)-2,stop=Math.ceil((s.scroll+W)/gap)+2;
  for(let i=start;i<=stop;i++){
    const world=i*gap+(hash(i+17)-.5)*14,x=world-s.scroll;
    const y=surface(world,side);
    const r=9+hash(i+30)*14,deep=5+hash(i+85)*10;
    const outside=side;
    c.beginPath();
    c.moveTo(x-r*.98,y+outside*1);
    c.lineTo(x-r*.68,y+outside*deep*.8);
    c.lineTo(x-r*.2,y+outside*deep*1.6);
    c.lineTo(x+r*.4,y+outside*deep*1.15);
    c.lineTo(x+r,y+outside*2);
    c.lineTo(x+r*.30,y-outside*.2);
    c.closePath();
    c.fillStyle=i%4===0?"rgba(17,11,12,.31)":i%3===0?"rgba(124,80,50,.27)":"rgba(70,42,36,.27)";
    c.fill();
    c.beginPath();c.moveTo(x-r*.48,y+outside*.5);
    c.quadraticCurveTo(x,y+outside*(deep*.7),x+r*.51,y+outside*1);
    c.strokeStyle=i%4===1?"rgba(243,183,106,.20)":"rgba(184,122,80,.15)";
    c.lineWidth=1.15;c.stroke();

    if(s.time<39&&i%5===2){
      // Roots descend from the ceiling or creep up from the earth.
      const len=15+hash(i+301)*25;
      c.beginPath();c.moveTo(x,y+outside*1);
      c.bezierCurveTo(x+9,y-outside*8,x-13,y-outside*len*.6,x-3+hash(i+70)*12,y-outside*len);
      c.strokeStyle="rgba(88,52,30,.67)";
      c.lineWidth=1.4+hash(i+13)*1.4;c.stroke();
    }
    if(stage.current.crystal&&i%7===3){
      const g=10+hash(i+601)*8;
      c.beginPath();c.moveTo(x-g*.8,y+outside*1);
      c.lineTo(x-g*.5,y+outside*g*1.3);
      c.lineTo(x,y+outside*g*2);
      c.lineTo(x+g*.65,y+outside*g*.7);
      c.lineTo(x+g*.4,y+outside*1);
      c.closePath();
      c.fillStyle="rgba(181,59,91,.59)";c.fill();
      c.beginPath();c.moveTo(x,y+outside*g*2);c.lineTo(x+g*.15,y+outside*g*.5);
      c.lineTo(x+g*.5,y+outside*g*.7);
      c.fillStyle="rgba(255,143,169,.45)";c.fill();
    }
    if(s.time>=57&&i%8===4){
      // Masons exposed short buried mortar seams inside temple stone.
      c.beginPath();c.moveTo(x-9,y+outside*8);c.lineTo(x+16,y+outside*8);
      c.strokeStyle="rgba(219,178,122,.17)";c.lineWidth=2;c.stroke();
    }
  }
}
export function paintNaturalTunnel(c,s,assets={}) {
  const stage=materialStage(s.time);
  for(const side of [-1,1]){
    const points=[];
    for(let x=-STEP;x<=W+STEP;x+=STEP)points.push([x,surface(s.scroll+x,side)]);
    drawEarth(c,s,side,assets,stage,points);
    drawFracturedFace(c,s,side,stage,points);
    // Stone fragments must remain inside the solid geology except tiny
    // attached roots and chips; the corridor silhouette stays authoritative.
    c.save();earthPath(c,points,side);c.clip();
    drawExposedRidge(c,s,side,stage);
    c.restore();
  }
}
