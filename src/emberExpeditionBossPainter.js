// Canvas-only fallback boss art. Deliberately no generated images: painted
// sprite atlases will replace this file after the separate asset import is QA'd.
// This paints the danger lanes used by emberExpeditionBossStage.js, not a
// misleading decorative collision area.
import {BOSS_SCREEN_X} from "./emberExpeditionBossStage.js";
import {bossPresentation} from "./emberBossEncounter.js";

const PI=Math.PI;
function shape(c,points,fill,stroke=null,width=2){
 c.beginPath();
 points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill,stroke=null,w=2){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,PI*2);
 c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function line(c,pts,color,width=2){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.strokeStyle=color;c.lineWidth=width;c.lineJoin="round";c.lineCap="round";c.stroke();
}
function crown(c){
 shape(c,[[-31,-56],[-37,-88],[-17,-76],[0,-102],[19,-76],[38,-89],[32,-56]],
   "#c5913c","#f6dc88",3);
 ellipse(c,0,-56,32,7,"#f3bf5a","#fff0bd",2);
 for(const [x,y] of [[-30,-85],[-17,-75],[0,-100],[19,-76],[36,-86]])
   ellipse(c,x,y,4,4,"#ffedac");
 ellipse(c,0,-68,6,8,"#ee4762","#ffd3ad",2);
}
function copperjack(c,t){
 c.save();c.translate(0,Math.sin(t*4)*3);
 // Clockwork sentry: squat riveted copper automaton, teal monocular lamp,
 // piston arms and drill-clamp feet. Standalone procedural review art.
 const brass=c.createLinearGradient(-75,-70,75,90);
 brass.addColorStop(0,"#f3d69a");brass.addColorStop(.29,"#ad753f");
 brass.addColorStop(.55,"#644b3a");brass.addColorStop(.78,"#d7a85f");
 brass.addColorStop(1,"#523c37");
 shape(c,[[-59,35],[-75,85],[-25,85],[-10,50]],brass,"#e5c18a",3);
 shape(c,[[20,45],[35,83],[80,83],[60,32]],brass,"#e5c18a",3);
 ellipse(c,-52,79,29,13,"#40353a","#f2c67f",3);
 ellipse(c,52,79,28,13,"#40353a","#f2c67f",3);
 ellipse(c,0,23,71,59,brass,"#f4d08b",5);
 ellipse(c,0,23,39,40,"#40373b","#e1aa65",4);
 ellipse(c,0,23,20,20,"#79afad","#ffebb6",4);
 ellipse(c,0,23,10,10,"#e7f3c6");
 // Arms are mounted on the torso, with heavy pneumatic shafts.
 for(const side of [-1,1]){
  c.save();c.scale(side,1);
  ellipse(c,61,-6,22,26,"#765343","#f4cb82",4);
  shape(c,[[67,-7],[101,5],[117,43],[94,50],[75,22]],brass,"#f2d19b",3);
  line(c,[[86,12],[110,37]],"#504049",10);
  line(c,[[86,12],[110,37]],"#f1c77f",4);
  ellipse(c,108,44,19,14,"#61535a","#e7bf73",3);
  c.restore();
 }
 // Segmented steel head with a single oversized teal searchlight.
 ellipse(c,0,-42,53,49,brass,"#ffe0a1",4);
 shape(c,[[-49,-47],[-35,-74],[35,-74],[51,-47]],"#695357","#f1cb8e",3);
 ellipse(c,0,-44,32,27,"#2c343b","#f0cb7e",4);
 ellipse(c,0,-44,24,20,"#65b8b5","#e8f8d5",3);
 ellipse(c,0,-44,12,12,"#d9fff4");
 ellipse(c,0,-44,4,4,"#fffdd3");
 for(let i=-2;i<=2;i++){
   const x=i*19;
   ellipse(c,x,60,3,3,"#ffe3a5");
 }
 // A small clock face replacing a chest badge.
 ellipse(c,0,25,13,13,"#fff0bf","#6d453c",3);
 line(c,[[0,25],[0,17]],"#8b4f42",2);
 line(c,[[0,25],[7,28]],"#8b4f42",2);
 c.restore();
}
function moleKing(c,t){
 c.save();c.translate(0,Math.sin(t*2.8)*3);
 // cape and ermine mantle; royal colors recall the character sheets
 shape(c,[[-66,-32],[-93,54],[-34,91],[67,90],[102,44],[61,-41]],
   "#9c2e40","#f3b577",4);
 shape(c,[[-59,-31],[-76,33],[-39,45],[4,-16],[57,39],[81,30],[52,-33]],
   "#d45252");
 for(let i=0;i<9;i++)ellipse(c,-53+i*13,21+Math.sin(i)*9,4,3,"#291d30");
 ellipse(c,0,30,65,65,"#4c343b","#dcad70",4);
 ellipse(c,0,25,51,53,"#6a4a42","#8c674f",2);
 ellipse(c,-31,70,25,12,"#4d3637","#b98659",2);
 ellipse(c,32,70,25,12,"#4d3637","#b98659",2);
 ellipse(c,-47,-23,25,37,"#4e3534","#b98561",3);
 ellipse(c,48,-22,25,37,"#4e3534","#b98561",3);
 ellipse(c,0,-16,56,51,"#6b4e3f","#dfb68a",3);
 ellipse(c,-33,-18,12,11,"#2b292a");
 ellipse(c,33,-18,12,11,"#2b292a");
 ellipse(c,-31,-20,4,4,"#f9e6b1");
 ellipse(c,35,-20,4,4,"#f9e6b1");
 ellipse(c,0,7,22,16,"#cb9c89","#ffdfab",2);
 ellipse(c,-13,0,11,7,"#c69283");
 ellipse(c,14,0,11,7,"#c69283");
 ellipse(c,0,0,12,9,"#b76d75","#ffcfbc",2);
 line(c,[[-22,14],[-45,19],[-58,13]],"#f6e8ce",2);
 line(c,[[22,14],[46,19],[59,14]],"#f6e8ce",2);
 crown(c);
 // Scepter and royal ruby held in raised paw.
 line(c,[[49,53],[90,-103]],"#432e2d",11);
 line(c,[[49,53],[90,-103]],"#ffcb6c",6);
 ellipse(c,92,-108,17,21,"#a6375c","#ffe3a6",4);
 ellipse(c,88,-115,6,9,"#ffd4d4");
 ellipse(c,42,41,20,19,"#5f4640","#e6ba8b",2);
 c.restore();
}
function cinderclaw(c,t){
 c.save();c.translate(0,Math.sin(t*3.6)*3);
 // Tall smoldering tail and claws; four readable paws remain attached to body.
 const flame=c.createLinearGradient(65,-105,92,77);
 flame.addColorStop(0,"#fff5a2");flame.addColorStop(.45,"#ed822b");flame.addColorStop(1,"#5b282a");
 shape(c,[[38,44],[74,32],[105,-3],[107,-48],[88,-83],[115,-115],[120,-74],
    [124,0],[99,55],[51,85]],flame,"#f9ae61",3);
 ellipse(c,5,23,69,49,"#3a3038","#fb923d",4);
 ellipse(c,-32,55,27,14,"#493339","#ffae57",3);
 ellipse(c,39,61,25,13,"#49333b","#ffae57",3);
 for(const [x,y] of [[-56,60],[-39,65],[-19,60],[27,68],[45,67]]){
   shape(c,[[x-5,y],[x,y+10],[x+6,y]],"#ffd57a");
 }
 const rock=c.createLinearGradient(0,-50,0,63);
 rock.addColorStop(0,"#644044");rock.addColorStop(.45,"#383039");rock.addColorStop(.8,"#a74c34");rock.addColorStop(1,"#f6a943");
 ellipse(c,-4,2,67,58,rock,"#f6a15e",4);
 ellipse(c,-45,-22,57,44,rock,"#ffa55c",3);
 // Igneous spines and ember fissures.
 for(const [x,y,h] of [[-49,-49,26],[-18,-57,31],[16,-55,29],[50,-36,24]]){
   shape(c,[[x-15,y+9],[x,y-h],[x+15,y+9]],"#e46e2f","#ffd780",2);
 }
 ellipse(c,-69,-27,9,10,"#ffe08b","#773831",2);
 ellipse(c,-67,-28,3,5,"#37272b");
 ellipse(c,-95,-5,17,9,"#a74e40","#f7a75b",2);
 line(c,[[-35,5],[-20,17],[-5,8],[12,25]],"#ef9c4e",4);
 line(c,[[7,7],[24,13],[40,5]],"#ffb45a",3);
 ellipse(c,-54,30,14,10,"#ffbd66");
 c.restore();
}
function telegraph(c,s,W,H,attack,phase){
 if(phase!=="warning"&&phase!=="active")return;
 const y=s.bossY,t=s.time,active=phase==="active";
 const top=(attack==="fireball"||attack==="spark-bolt")?y-96:(attack==="burrow"||attack==="quake"||attack==="gear-sweep")?y+25:0;
 const bottom=(attack==="fireball"||attack==="spark-bolt")?y+96:(attack==="burrow"||attack==="quake"||attack==="gear-sweep")?H:y-35;
 const a=Math.max(0,Math.min(H,top)),b=Math.max(0,Math.min(H,bottom));
 if(b<=a)return;
 c.save();
 c.fillStyle=active?"rgba(232,87,37,.19)":"rgba(255,180,70,.10)";
 c.fillRect(0,a,W,b-a);
 c.strokeStyle=active?"#ff793a":"#e5c474";c.lineWidth=3;c.setLineDash(active?[]:[13,10]);
 c.strokeRect(6,a+3,W-12,Math.max(4,b-a-6));
 c.setLineDash([]);
 if(active){
   const g=c.createLinearGradient(0,0,W,0);
   g.addColorStop(0,"rgba(255,172,77,0)");
   g.addColorStop(.65,"rgba(255,161,74,.26)");
   g.addColorStop(1,"rgba(246,71,26,.6)");
   c.fillStyle=g;c.fillRect(0,a,W,b-a);
 }
 c.textAlign="left";c.font="bold 14px Georgia";
 c.shadowColor="#1e1117";c.shadowBlur=7;
 c.fillStyle=active?"#fff0c6":"#f0d6a6";
 c.fillText(active?"DANGER - MOVE AWAY":"WARNING - STEER CLEAR",18,Math.max(22,a+21));
 c.restore();
}
export function paintExpeditionBoss(c,s,W,H){
 const boss=s.boss;
 if(!boss)return;
 const p=bossPresentation(boss);
 telegraph(c,s,W,H,p.attack,p.phase);
 const x=BOSS_SCREEN_X,y=s.bossY;
 c.save();
 c.translate(x,y);
 const aura=c.createRadialGradient(0,0,10,0,0,117);
 aura.addColorStop(0,p.vulnerable?"rgba(252,212,100,.37)":"rgba(245,115,61,.18)");
 aura.addColorStop(1,"rgba(0,0,0,0)");
 ellipse(c,0,0,118,123,aura);
 if(p.vulnerable){
   c.strokeStyle="#ffe0a1";c.lineWidth=4;
   c.setLineDash([12,7]);c.beginPath();c.ellipse(0,0,101,95,0,0,2*PI);c.stroke();
   c.setLineDash([]);
 }
 if(boss.kind==="mole-king")moleKing(c,s.time);
 else if(boss.kind==="copperjack")copperjack(c,s.time);
 else cinderclaw(c,s.time);
 c.restore();
 // Health pips are in Canvas so all three viewports get matching game-space sizing.
 c.save();c.textAlign="right";c.font="bold 15px Georgia,serif";
 c.fillStyle="#ffe5a9";c.shadowColor="#161018";c.shadowBlur=7;
 c.fillText(boss.kind==="mole-king"?"THE MOLE KING":boss.kind==="copperjack"?"COPPERJACK":"CINDERCLAW",W-24,78);
 for(let i=0;i<boss.maxHealth;i++){
   c.fillStyle=i<boss.health?"#ebae5f":"#54474b";
   c.strokeStyle="#f1d8ab";c.lineWidth=1.5;
   const bx=W-26-(boss.maxHealth-1-i)*23;
   c.fillRect(bx-14,88,16,11);c.strokeRect(bx-14,88,16,11);
 }
 if(p.vulnerable){
  c.textAlign="center";c.font="bold 15px Georgia,serif";
  c.fillStyle="#ffe7a7";
  c.fillText("VULNERABLE - TURBO STRIKE",x,s.bossY-135);
 }
 c.restore();
}
