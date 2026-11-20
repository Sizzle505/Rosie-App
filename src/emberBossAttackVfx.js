/**
 * Engine-aligned, non-character Ember Tunnel attack overlays.
 * These paint under the approved boss atlases and never alter collision logic.
 * Unlike the rejected concept montages, no new character or gate art is used.
 */
import {bossDangerLane,BOSS_SCREEN_X} from "./emberExpeditionBossStage.js";
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function bossVfxBounds(attack,y,height){
 if(!Number.isFinite(y)||!Number.isFinite(height)||height<=0)return null;
 const v=bossDangerLane(attack,y);
 if(!v)return null;
 const top=clamp(v.top,0,height),bottom=clamp(v.bottom,0,height);
 return bottom>top?{top,bottom}:null;
}
function line(c,x,y,xx,yy,color,w=2){
 c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=w;c.stroke();
}
function pebble(c,x,y,r,color,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);
 c.beginPath();c.moveTo(-r,-r*.2);c.lineTo(-r*.2,-r);c.lineTo(r,r*.1);
 c.lineTo(r*.25,r*.8);c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function glow(c,x,y,r,color,edge){
 const g=c.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,color);g.addColorStop(.4,edge);
 g.addColorStop(1,"rgba(255,183,79,0)");
 c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=g;c.fill();
}
function electricity(c,b,W,p,t){
 const y=(b.top+b.bottom)/2,end=Math.min(W-25,BOSS_SCREEN_X-75);
 const head=p.phase==="active"?end-(end-25)*p.progress:end;
 glow(c,head,y,p.phase==="active"?34:24,"rgba(236,250,230,.76)","rgba(93,206,202,.19)");
 if(p.phase!=="active")return;
 for(let strand=0;strand<3;strand++){
  c.beginPath();c.moveTo(head,y+(strand-1)*5);
  for(let i=1;i<=8;i++){
   const x=Math.min(end,head+i*16);
   c.lineTo(x,y+Math.sin(i*2.7+strand+t*24)*7+(strand-1)*8);
  }
  c.strokeStyle=strand===1?"rgba(219,245,235,.92)":"rgba(108,204,201,.82)";
  c.lineWidth=strand===1?3:1.6;c.stroke();
 }
}
function fireball(c,b,W,p,t){
 const y=(b.top+b.bottom)/2,end=Math.min(W-25,BOSS_SCREEN_X-65);
 const x=p.phase==="active"?end-(end-22)*p.progress:end;
 glow(c,x,y,p.phase==="active"?51:28,"rgba(255,229,124,.86)","rgba(237,94,45,.26)");
 if(p.phase!=="active")return;
 for(let k=0;k<6;k++)
  glow(c,x+15+k*12,y+Math.sin(k*1.8+t*12)*9,Math.max(3,18-k*2.7),
      "rgba(245,151,59,.66)","rgba(159,70,42,.14)");
}
function fissure(c,b,W,p,t,kind){
 const root=Math.min(W-18,BOSS_SCREEN_X-32);
 const y=b.top+Math.min(41,(b.bottom-b.top)*.28);
 const active=p.phase==="active";
 c.beginPath();c.moveTo(12,y+20);
 for(let x=22;x<=root;x+=12)
  c.lineTo(x,y+20+Math.sin(x*.075+t*(active?9:2))* (active?6:2));
 c.strokeStyle=active?"rgba(243,157,79,.74)":"rgba(204,153,93,.40)";
 c.lineWidth=active?4:2;c.stroke();
 for(let i=0;i<11;i++){
  const x=22+i*40;if(x>root)break;
  const rise=active?12+Math.sin(i*2.2+t*7)*8:2;
  pebble(c,x,y+9-rise,4+(i%3),kind==="burrow"?"rgba(115,71,52,.86)":"rgba(122,89,75,.80)",i*.7);
 }
}
function gears(c,b,W,p,t){
 const y=b.top+Math.min(40,(b.bottom-b.top)*.32),limit=Math.min(W-15,BOSS_SCREEN_X-48);
 for(let i=0;i<5;i++){
  const x=35+i*78;if(x>limit)break;
  const r=17+(i%2)*3;
  c.save();c.translate(x,y);c.rotate(t*(p.phase==="active"?4:1.2));
  for(let k=0;k<8;k++){
   const a=k*TAU/8;pebble(c,Math.cos(a)*r,Math.sin(a)*r,5,"rgba(180,123,69,.75)",a);
  }
  c.beginPath();c.arc(0,0,r-5,0,TAU);c.fillStyle="rgba(103,75,60,.74)";c.fill();
  c.strokeStyle="rgba(234,192,122,.82)";c.lineWidth=3;c.stroke();c.restore();
 }
}
function ceilingBurst(c,b,W,p,t){
 const active=p.phase==="active",reach=Math.min(W-15,BOSS_SCREEN_X-35);
 const h=b.bottom-b.top;
 for(let i=0;i<13;i++){
  const x=17+i*34;if(x>reach)break;
  const frac=active?(p.progress*(.4+(i%3)*.19)+i*.27)%1:.08+(i%4)*.04;
  const y=b.top+frac*Math.max(10,h-10);
  pebble(c,x,y,4+i%3,active?"rgba(153,105,80,.88)":"rgba(181,150,111,.44)",t*.6+i*.8);
 }
}
/** Draw only while warning or active, clipped to EXACTLY the engine's hazard lane. */
export function paintBossAttackVfx(c,s,W,H,p){
 if(!c||!s?.boss||!p||!(p.phase==="warning"||p.phase==="active"))return false;
 const b=bossVfxBounds(p.attack,s.bossY,H);
 if(!b||W<=0)return false;
 c.save();c.beginPath();c.rect(0,b.top,W,b.bottom-b.top);c.clip();
 c.globalAlpha=p.phase==="active"?.92:.55;
 const t=Number.isFinite(s.time)?s.time:0;
 switch(p.attack){
  case "spark-bolt":electricity(c,b,W,p,t);break;
  case "fireball":fireball(c,b,W,p,t);break;
  case "gear-sweep":gears(c,b,W,p,t);break;
  case "burrow":fissure(c,b,W,p,t,"burrow");break;
  case "quake":fissure(c,b,W,p,t,"quake");break;
  case "earth-burst":ceilingBurst(c,b,W,p,t);break;
  default:c.restore();return false;
 }
 c.restore();return true;
}
