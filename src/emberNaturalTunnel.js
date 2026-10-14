import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

/**
 * Irregular, continuous exposed-earth contour matching the collision corridor.
 *
 * Unlike the original edge implementation, this NEVER slices a panorama into
 * narrow strips, repeats complete foreground paintings, or paints straight
 * golden lines across a scenic backdrop. The cavern artwork remains intact.
 */
const STEP=11;
function shapeAt(worldX,side){
  const cut=3.5*Math.sin(worldX*.035+.8)
    +2.1*Math.sin(worldX*.079-1.3)
    +1.1*Math.sin(worldX*.149+2.4);
  return tunnelCenter(worldX)+side*(tunnelRadius(worldX)+cut);
}
const frac=v=>v-Math.floor(v);
const hash=v=>frac(Math.sin(v*91.71+4.815)*47592.352);

function contour(c,points){
  c.beginPath();
  for(let i=0;i<points.length;i++){
    const p=points[i];if(i===0)c.moveTo(p[0],p[1]);else c.lineTo(p[0],p[1]);
  }
}
function clippedEarth(c,points,side){
  c.beginPath();
  if(side<0){c.moveTo(-STEP,-STEP);c.lineTo(W+STEP,-STEP);}
  else{c.moveTo(-STEP,H+STEP);c.lineTo(W+STEP,H+STEP);}
  for(let i=points.length-1;i>=0;i--)c.lineTo(points[i][0],points[i][1]);
  c.closePath();
  c.clip();
  // Darkened outside the playable corridor, but retain the detailed
  // painted roots, architecture, lanterns and crystals beneath the tint.
  c.fillStyle=side<0?"rgba(24,12,13,.25)":"rgba(22,12,13,.24)";
  c.fillRect(0,0,W,H);
}
function rockShadows(c,s,side){
  // Deterministic outcrops travel with the scrolling world. The tiny, varied
  // facets suggest exposed rock, with no repeated square panel boundaries.
  const grid=74,lo=Math.floor(s.scroll/grid)-1,hi=Math.ceil((s.scroll+W)/grid)+1;
  for(let i=lo;i<=hi;i++){
    const world=i*grid+hash(i+120)*23,x=world-s.scroll;
    if(x<-80||x>W+80)continue;
    const y=shapeAt(world,side);
    const w=17+hash(i+30)*26,h=5+hash(i+90)*10;
    const direction=side<0?1:-1;
    c.beginPath();
    c.moveTo(x-w*.55,y-direction*2);
    c.lineTo(x-w*.22,y+direction*(h*.66));
    c.lineTo(x+w*.35,y+direction*h);
    c.lineTo(x+w*.55,y-direction*(2+hash(i+19)*4));
    c.closePath();
    c.fillStyle=i%3===0?"rgba(40,23,20,.28)":"rgba(59,37,28,.23)";
    c.fill();
    if(i%4===1){
      c.beginPath();
      c.moveTo(x-w*.35,y-direction*1);
      c.quadraticCurveTo(x,y+direction*3,x+w*.3,y-direction*2);
      c.strokeStyle="rgba(213,150,91,.12)";c.lineWidth=1.4;c.stroke();
    }
  }
}
export function paintNaturalTunnel(c,s){
  for(const side of [-1,1]){
    const points=[];
    for(let x=-STEP;x<=W+STEP;x+=STEP){
      points.push([x,shapeAt(s.scroll+x,side)]);
    }
    c.save();
    clippedEarth(c,points,side);
    c.restore();

    // Soft depth and undercut. No razor-sharp stroke, linear shelf, or
    // texture slicing. Draw at several scales for a believable eroded lip.
    c.save();
    contour(c,points);
    c.lineWidth=38;
    c.strokeStyle="rgba(20,10,12,.072)";
    c.lineJoin="round";c.stroke();
    contour(c,points);
    c.lineWidth=22;
    c.strokeStyle="rgba(23,13,13,.10)";c.stroke();
    contour(c,points);
    c.lineWidth=9;
    c.strokeStyle="rgba(39,22,19,.13)";c.stroke();
    c.restore();
    rockShadows(c,s,side);
  }
}
