// Nonintrusive, world-anchored prototype rendering of the breakable asset family.
// Uses existing approved cave textures until the independent production PNGs are imported.
// Do not replace Rosie's vehicle or established cave panoramas with generated stand-ins.
const ready=im=>Boolean(im?.complete&&im.naturalWidth>0);
function disk(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function image(c,im,x,y,w,h){if(ready(im))c.drawImage(im,x,y,w,h);}
function label(c,text,x,y,color){
 c.save();c.textAlign="center";c.font="bold 11px Georgia,serif";
 c.shadowColor="#170e1a";c.shadowBlur=7;c.lineWidth=3;c.strokeStyle="#281b22";
 c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();
}
export function paintBreakables(c,s,assets,W) {
 for(const b of s.breakables||[]){
   const x=b.x-s.scroll,y=b.y;
   if(x<-140||x>W+140)continue;
   const isPortal=b.material==="entrance", isCrystal=b.material==="crystal";
   c.save();c.translate(x,y);
   // All these discoveries belong at the roof/floor, rather than hovering
   // directly in the centerline that novice players use to survive.
   const halo=c.createRadialGradient(0,0,7,0,0,isPortal?115:90);
   halo.addColorStop(0,isCrystal?"rgba(229,118,255,.24)":"rgba(255,188,91,.20)");
   halo.addColorStop(1,"rgba(255,199,104,0)");
   disk(c,0,0,isPortal?115:90,halo);
   if(isPortal){
     // The entry remains in the landscape after excavation.
     c.save();c.beginPath();c.ellipse(0,0,78,70,0,0,Math.PI*2);c.clip();
     if(b.broken){
       const inside=c.createRadialGradient(0,-20,8,0,0,88);
       inside.addColorStop(0,"#eac079");inside.addColorStop(.4,"#674276");inside.addColorStop(1,"#1b1020");
       c.fillStyle=inside;c.fillRect(-85,-75,170,150);
       image(c,assets.chest,-45,-39,90,80);
       disk(c,-25,-15,6,"#e3bc54");disk(c,26,14,8,"#f9d975");
     }else{
       image(c,assets.newRootMound,-90,-76,180,150);
     }
     c.restore();
     c.strokeStyle=b.broken?"#e8bb74":"#bf8b4a";c.lineWidth=8;c.beginPath();
     c.ellipse(0,0,80,72,0,Math.PI*1.05,Math.PI*2.95);c.stroke();
     for(let j=-1;j<=1;j++){
       const px=j*43,py=-63+Math.abs(j)*14;
       c.strokeStyle="#92744e";c.lineWidth=4;c.beginPath();c.moveTo(px,py);
       c.quadraticCurveTo(px-9,py+21,px-11,py+42);c.stroke();
     }
     if(!b.broken)label(c,"SECRET CHAMBER",0,84,"#efca87");
   }else if(!b.broken){
     const img=isCrystal?assets.newCrystalMound:assets.newRootMound;
     image(c,img,-79,-70,158,140);
     if(!ready(img)){
       disk(c,0,0,65,isCrystal?"#834f92":"#8b5e42");
       disk(c,-12,-16,38,isCrystal?"#d67bd8":"#b88755");
     }
     if(b.cracked){
       c.save();c.shadowBlur=9;c.shadowColor=isCrystal?"#f58cff":"#f9d079";
       c.strokeStyle=isCrystal?"#f6b5ff":"#ffcf76";c.lineWidth=4;c.lineCap="round";
       c.beginPath();c.moveTo(-10,-50);c.lineTo(8,-12);c.lineTo(-20,16);c.lineTo(3,54);
       c.moveTo(8,-12);c.lineTo(43,-32);c.moveTo(-20,16);c.lineTo(-49,38);c.stroke();
       c.restore();
     }
     if(isCrystal)label(c,"TURBO",0,79,"#ffe19b");
   }else{
     // An unobstructed, legible opening replaces the intact boulder.
     const opacity=Math.max(0,1-(s.scroll-b.x)/200);
     if(opacity>0){
       c.globalAlpha=opacity;
       for(let i=0;i<9;i++){
         const angle=i*2.399,dist=22+(1-opacity)*65;
         disk(c,Math.cos(angle)*dist,Math.sin(angle)*dist,4+i%3,
           isCrystal?"#e4a2ed":"#cfa164");
       }
     }
   }
   c.restore();
 }
}
