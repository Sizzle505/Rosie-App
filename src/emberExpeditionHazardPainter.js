import {tunnelCenter,tunnelRadius} from "./emberDrillEngine.js";
import {drawExpansionFrame} from "./emberExpansionCatalog.js";

// The same h.reach that governs collision draws the physical obstacle.
// Intentionally procedural until the independently reviewed production
// animation atlases can replace it - no missing-art boxes or invisible hits.
function oval(c,x,y,rx,ry,fill){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
}
function path(c,pts,fill,stroke=null){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=2.3;c.stroke();}
}
function base(c,metal){
 c.fillStyle="#362833";c.fillRect(-83,-1,166,31);
 c.fillStyle=metal;c.fillRect(-69,-4,138,11);
 for(let x=-55;x<=55;x+=22)oval(c,x,7,4,4,"#e9b76b");
}
function piston(c,r){
 const steel=c.createLinearGradient(-55,0,55,0);
 steel.addColorStop(0,"#493a3a");steel.addColorStop(.25,"#d9b77d");
 steel.addColorStop(.52,"#777785");steel.addColorStop(.75,"#f3d79e");steel.addColorStop(1,"#493b41");
 c.fillStyle=steel;c.fillRect(-37,-r+19,74,r+11);
 c.strokeStyle="#b37c3a";c.lineWidth=8;c.strokeRect(-42,-r+19,84,r+11);
 c.fillStyle="#b27d45";c.fillRect(-54,-r-4,108,34);
 c.fillStyle="#413742";c.fillRect(-48,-r,96,15);
 for(let x=-38;x<45;x+=14){c.strokeStyle="#eec579";c.lineWidth=4;c.beginPath();c.moveTo(x,-r+7);c.lineTo(x+10,-r+24);c.stroke();}
 base(c,"#c89952");
}
function crystal(c,r){
 const g=c.createLinearGradient(0,-r,0,22);
 g.addColorStop(0,"#ecc4ff");g.addColorStop(.4,"#a650bd");g.addColorStop(1,"#49315e");
 path(c,[[-58,26],[-51,-r*.38],[-19,-r*.55],[0,-r-4],[29,-r*.58],[57,-r*.22],[67,27]],g,"#f2bafa");
 path(c,[[-13,-r*.79],[0,-r-4],[19,-r*.65],[6,-r*.22]],"rgba(255,238,255,.55)");
 base(c,"#8e658e");
}
function geyser(c,r,t){
 const g=c.createLinearGradient(0,0,0,-r);
 g.addColorStop(0,"#ad361c");g.addColorStop(.48,"#ff8430");g.addColorStop(1,"#fff1a9");
 const wave=9*Math.sin(t*14);
 path(c,[[-55,26],[-47,-r*.44],[-32,-r*.65],[wave-17,-r*.82],[0,-r-3],
  [wave+21,-r*.83],[42,-r*.43],[55,28]],g,"rgba(255,197,90,.85)");
 for(let i=0;i<5;i++){
  const x=(i-2)*20+(Math.sin(t*5+i)*5),y=-r*(.37+(i%3)*.21);
  oval(c,x,y,2+i%3,4+i%2,"#ffd87e");
 }
 base(c,"#8b5341");
}
function basalt(c,r,t){
 // Ceiling-attached stone cracks and falls into the passage; all motion
 // remains coupled to the engine's protrusion reach and attack warning.
 const stone=c.createLinearGradient(-50,-r,50,20);
 stone.addColorStop(0,"#b6a299");stone.addColorStop(.38,"#584c4f");
 stone.addColorStop(1,"#2b3039");
 path(c,[[-69,-3],[-51,-r*.32],[-27,-r*.76],[-6,-r-7],
   [21,-r*.73],[51,-r*.43],[70,-3]],stone,"#d5aa82");
 c.strokeStyle="#f5b67f";c.lineWidth=3;
 c.beginPath();c.moveTo(-4,-r*.88);c.lineTo(8,-r*.52);
 c.lineTo(-8,-r*.32);c.lineTo(12,0);c.stroke();
 const wobble=Math.sin(t*9)*2;
 oval(c,-35+wobble,-r*.30,7,6,"#b78861");
 oval(c,43-wobble,-r*.43,6,7,"#a5826b");
}
function quake(c,r,t){
 const rock=c.createLinearGradient(-50,-r,50,24);
 rock.addColorStop(0,"#ab7c50");rock.addColorStop(.5,"#5b433b");rock.addColorStop(1,"#372934");
 path(c,[[-64,27],[-57,-r*.32],[-33,-r*.46],[-17,-r*.75],[0,-r-3],
  [17,-r*.54],[38,-r*.68],[55,-r*.32],[67,30]],rock,"#d9aa72");
 c.strokeStyle="rgba(255,213,118,.94)";c.lineWidth=4;c.shadowColor="#ffb856";c.shadowBlur=8;
 c.beginPath();c.moveTo(0,-r*.92);c.lineTo(7,-r*.57);c.lineTo(-12,-r*.32);c.lineTo(-1,12);c.stroke();
 c.shadowBlur=0;
 base(c,"#b48b53");
}
// Atlas registration is visual-only. Collision uses the engine reach above,
// never alpha boundaries or decorative glow. Unloaded review art falls back.
function paintIllustratedHazard(c,h,reach,assets){
 const atlasId=h.kind==="piston"?"gear-crusher":h.kind==="geyser"?"lava-geyser":
   h.kind==="quake"?"royal-earth-burst":h.kind==="basalt"?"falling-basalt":null;
 if(!atlasId)return false;
 const img=assets?.["exp:"+atlasId];
 const extension=Math.max(0,Math.min(1,(reach-18)/Math.max(1,h.maxReach-18)));
 const total=atlasId==="lava-geyser"?6:8;
 let frame=0;
 if(h.resolved)frame=total-1;
 else if(!h.warned)frame=0;
 else if(extension<.12)frame=1;
 else if(extension<.5)frame=2;
 else if(extension<.9)frame=3;
 else frame=atlasId==="lava-geyser"?3:4;
 if(h.hit&&!h.resolved)frame=Math.min(total-2,frame+1);
 const w=atlasId==="gear-crusher"?180:atlasId==="lava-geyser"?215:200;
 const height=Math.max(72,reach+52);
 // The Gear Crusher's source cells have a pale scanner/matte strip along
 // their bottom 13.5%. Mask only that unapproved band while retaining its
 // brass feet, machinery and animated smoke. No runtime hitbox changes.
 if(atlasId==="gear-crusher"){
   const y=-reach-20;
   c.save();c.beginPath();c.rect(-w/2,y,w,height*.865);c.clip();
   const painted=drawExpansionFrame(c,img,atlasId,frame,-w/2,y,w,height);
   c.restore();return painted;
 }
 return drawExpansionFrame(c,img,atlasId,frame,-w/2,-reach-28,w,height);
}
export function paintExpeditionHazards(c,s,width,assets={}){
 for(const h of s.worldHazards||[]){
  if(h.shattered)continue;
  const x=h.x-s.scroll;
  if(x<-155||x>width+155)continue;
  const edge=tunnelCenter(h.x)+h.side*tunnelRadius(h.x);
  const gap=h.x-(s.scroll+365);
  const r=Math.max(18,h.reach||18);
  const warning=h.warned&&!h.resolved;
  c.save();c.translate(x,edge);c.scale(1,h.side);
  // Early tell is a surface glow embedded in the wall, before any extension.
  if(warning){
   const pulse=.65+.2*Math.sin(s.time*12+h.x);
   const halo=c.createRadialGradient(0,-12,1,0,-10,90);
   halo.addColorStop(0,h.kind==="geyser"?"rgba(255,124,48,"+pulse+")":"rgba(252,196,112,"+pulse+")");
   halo.addColorStop(1,"rgba(242,165,79,0)");
   oval(c,0,-12,90,65,halo);
   c.strokeStyle="#f3d295";c.lineWidth=2;c.setLineDash([7,7]);
   c.beginPath();c.ellipse(0,-10,65,22,0,Math.PI,Math.PI*2);c.stroke();c.setLineDash([]);
  }
  const illustrated=paintIllustratedHazard(c,h,r,assets);
  if(!illustrated){
    if(h.kind==="piston")piston(c,r);
    else if(h.kind==="geyser")geyser(c,r,s.time);
    else if(h.kind==="quake")quake(c,r,s.time);
    else if(h.kind==="basalt")basalt(c,r,s.time);
    else crystal(c,r);
  }
  c.restore();
 }
}
