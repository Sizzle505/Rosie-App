import {tunnelCenter,tunnelRadius} from "./emberDrillEngine.js";

// The moving crystal remains visibly seated in real cave rock. Its art follows
// exactly the same reach as the collision core; it never drops from the sky.
const ready=im=>Boolean(im&&im.complete&&im.naturalWidth>0);
function gleam(c,x,y,reach,color){
 const g=c.createRadialGradient(x,y,3,x,y,reach);
 g.addColorStop(0,color);g.addColorStop(1,"rgba(245,130,236,0)");
 c.beginPath();c.arc(x,y,reach,0,Math.PI*2);c.fillStyle=g;c.fill();
}
export function paintCrystalShutters(c,s,assets,width){
 for(const h of s.crystalShutters||[]){
   const x=h.x-s.scroll;
   if(x<-180||x>width+185||h.shattered)continue;
   const edge=tunnelCenter(h.x)+h.side*tunnelRadius(h.x);
   const reach=h.reach??24;
   const visible=reach>35;
   const warning=h.warned&&!h.resolved;
   c.save();
   // Keep the mechanical warning at the rock surface, not on Rosie's craft.
   gleam(c,x,edge-h.side*16,warning?102:55,
     warning?"rgba(252,171,102,.25)":"rgba(177,122,211,.12)");
   c.translate(x,edge);
   c.scale(1,h.side); // negative flips ceiling crystals inward, toward the cave.
   if(warning){
     c.strokeStyle="rgba(255,213,142,.68)";
     c.lineWidth=3;
     c.setLineDash([8,8]);
     c.beginPath();c.ellipse(0,-34,86,21,0,Math.PI,2*Math.PI);c.stroke();
     c.setLineDash([]);
   }
   const im=h.side<0?assets.newCrystalDrape:assets.newCrystalMound;
   if(ready(im)){
     // The base extends 36px into the existing wall, hiding its join.
     c.drawImage(im,-87,-reach-16,174,reach+52);
   }else{
     const grad=c.createLinearGradient(0,-reach,0,35);
     grad.addColorStop(0,"#a968c8");grad.addColorStop(.45,"#844a91");grad.addColorStop(1,"#473957");
     c.fillStyle=grad;c.beginPath();c.moveTo(0,-reach-16);
     c.lineTo(76,-24);c.lineTo(84,36);c.lineTo(-84,36);c.lineTo(-76,-24);c.closePath();c.fill();
   }
   // A bright, slender geological fracture appears before extension.
   if(warning||visible){
     const flicker=.56+.16*Math.sin(s.time*8+h.x);
     c.strokeStyle="rgba(255,184,245,"+flicker.toFixed(3)+")";
     c.shadowColor="#ea83e3";c.shadowBlur=visible?12:6;c.lineWidth=2.8;
     c.beginPath();c.moveTo(0,-Math.min(reach,118));
     c.lineTo(9,-Math.min(31,reach*.4));c.lineTo(-5,8);c.stroke();
     c.shadowBlur=0;
   }
   c.restore();
 }
}
