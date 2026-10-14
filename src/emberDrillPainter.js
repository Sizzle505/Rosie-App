import { DRILL_WIDTH as W, DRILL_HEIGHT as H, DRILL_ANCHOR, tunnelCenter, tunnelRadius, clamp } from "./emberDrillEngine.js";

const TWO_PI = Math.PI * 2;

const artReady = i => Boolean(i && i.complete && i.naturalWidth>0);
function artLoop(c,img,shift,alpha=1){
  if(!artReady(img))return false;
  const w=img.naturalWidth*(H/img.naturalHeight);
  const off=((shift%w)+w)%w;
  c.save();c.globalAlpha=alpha;
  for(let x=-off-w;x<W+w;x+=w)c.drawImage(img,x,0,w,H);
  c.restore();return true;
}
function drawImageTrim(c,img,x,y,w,h,alpha=1){
  if(!artReady(img))return false;
  c.save();c.globalAlpha=alpha;c.drawImage(img,x,y,w,h);c.restore();return true;
}
function paintEdge(c,s,image,side) {
  if(!artReady(image))return;
  const strip=24, srcW=image.naturalWidth, srcH=image.naturalHeight;
  const sy=side<0?Math.floor(srcH*.30):Math.floor(srcH*.48);
  const sh=Math.min(srcH-sy,Math.floor(srcH*(side<0?.43:.48)));
  const shDest=side<0?105:100;
  c.save();
  c.globalAlpha=side<0?.75:.69;
  for(let x=-strip;x<W+strip;x+=strip){
    const worldX=x+s.scroll;
    const boundary=tunnelCenter(worldX)+side*tunnelRadius(worldX);
    const frac=((worldX/1650)%1+1)%1;
    const sx=Math.floor(frac*srcW),sw=Math.max(1,Math.min(srcW-sx,Math.ceil(srcW*strip/1650)+1));
    const destY=side<0?boundary-83:boundary-17;
    c.drawImage(image,sx,sy,sw,sh,x,destY,strip+.7,shDest);
  }
  c.restore();
}

function noise(n) { const x = Math.sin(n * 137.13 + 6.71) * 43758.5453; return x - Math.floor(x); }
function circle(c,x,y,r,color) { c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,TWO_PI);c.fill(); }
function rounded(c,x,y,w,h,r) { c.beginPath();c.roundRect(x,y,w,h,r); }
function glow(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,"rgba(255,175,59,0)");
  circle(c,x,y,r,g);
}
function polygon(c,coords,color) {
  c.beginPath();c.moveTo(coords[0],coords[1]);
  for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);
  c.closePath();c.fillStyle=color;c.fill();
}
function drawRock(c,x,y,r,seed,tint) {
  const n=noise(seed), m=noise(seed+19);
  c.save();c.translate(x,y);c.rotate((n-.5)*.8);
  polygon(c,[-r*.93,-r*.2,-r*.44,-r*.96,r*.44,-r*.85,r,r*.05,r*.51,r*.86,-r*.55,r*.67],tint);
  polygon(c,[-r*.78,-r*.21,-r*.33,-r*.85,r*.26,-r*.61,r*.25,-r*.04,-r*.49,r*.28],"rgba(255,196,121,.10)");
  polygon(c,[r*.25,-r*.6,r*.83,-r*.02,r*.42,r*.65,-r*.06,r*.09],"rgba(0,0,0,.21)");
  c.strokeStyle="rgba(255,179,96,.19)";c.lineWidth=2;c.beginPath();c.moveTo(-r*.44,-r*.96);c.lineTo(r*.44,-r*.85);c.stroke();
  if(m>.83)circle(c,-r*.17,-r*.27,Math.max(1,r*.12),"#bd7447");
  c.restore();
}
function drawStoneColumns(c,x,base,scale,index) {
  c.save();c.translate(x,base);c.scale(scale,scale);
  const z= index%2===0 ? "#66504a" : "#594746";
  c.fillStyle="rgba(11,7,19,.55)";c.fillRect(-30,-286,210,310);
  for(let col=0;col<3;col++){
    const px=col*73-15;
    c.fillStyle=z;c.fillRect(px,-252,31,242);
    c.fillStyle="#927052";c.fillRect(px-8,-253,47,20);c.fillRect(px-8,-22,47,19);
    c.fillStyle="rgba(253,189,88,.28)";c.fillRect(px+3,-238,4,209);
    c.strokeStyle="rgba(22,9,13,.5)";c.strokeRect(px,-236,31,199);
  }
  c.fillStyle="#7c5e51";c.fillRect(-23,-277,215,24);
  c.fillStyle="#b99157";c.fillRect(-30,-280,225,5);
  c.strokeStyle="#c69b5e";c.lineWidth=3;c.beginPath();c.arc(74,-178,43,Math.PI,0);c.lineTo(117,-122);c.stroke();
  c.fillStyle="#24212b";rounded(c,35,-173,78,148,34);c.fill();
  c.fillStyle="rgba(252,157,66,.5)";rounded(c,49,-160,51,134,26);c.fill();
  for(let i=0;i<4;i++){
    circle(c,75,-154+i*27,6+i*1.7,"rgba(255,226,126,.50)");
  }
  c.restore();
}
function drawLantern(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  glow(c,0,0,55,"rgba(255,184,67,.26)");
  c.strokeStyle="#c39755";c.lineWidth=3;c.beginPath();c.moveTo(0,-49);c.lineTo(0,-18);c.stroke();
  rounded(c,-14,-19,28,37,5);c.fillStyle="#63351f";c.fill();c.strokeStyle="#edba67";c.stroke();
  const g=c.createLinearGradient(0,-14,0,14);g.addColorStop(0,"#fff1ae");g.addColorStop(.5,"#ffac4c");g.addColorStop(1,"#ad401c");
  c.fillStyle=g;c.fillRect(-10,-14,20,27);
  c.strokeStyle="#7c4827";c.lineWidth=2;c.beginPath();c.moveTo(0,-15);c.lineTo(0,15);c.moveTo(-11,0);c.lineTo(11,0);c.stroke();
  c.restore();
}
function scenery(c,s,assets={}) {
  c.fillStyle="#23151d";c.fillRect(0,0,W,H);
  // Smoothly dissolve between painted panoramas while preserving world scroll.
  const passages=[
    [0,"scenicBarkroot"],
    [13,"scenicLantern"],
    [27,"scenicRoots"],
    [43,"scenicCrystal"],
    [59,"scenicTemple"],
  ];
  let current=0;
  for(let i=1;i<passages.length;i++){
    if(s.time>=passages[i][0]) current=i;
  }
  const backdrop=(key)=>assets[key] || (s.time<35?assets.barkroot:assets.ruby);
  const shift=s.scroll*.29;
  const currentArt=backdrop(passages[current][1]);
  if(current===0){
    artLoop(c,currentArt,shift);
  }else{
    const prev=backdrop(passages[current-1][1]);
    artLoop(c,prev,shift);
    artLoop(c,currentArt,shift,clamp((s.time-passages[current][0])/3.25,0,1));
  }
  if(s.time>=34){
    const templeOpacity=clamp((s.time-34)/25,0,.18);
    artLoop(c,assets.ruby,s.scroll*.20,templeOpacity);
  }
  const tint=c.createLinearGradient(0,0,0,H);
  tint.addColorStop(0,"rgba(18,9,18,.20)");
  tint.addColorStop(.45,"rgba(15,9,18,.05)");
  tint.addColorStop(1,"rgba(8,9,15,.26)");
  c.fillStyle=tint;c.fillRect(0,0,W,H);
  for(let k=0;k<32;k++){
    const x=((k*117-s.scroll*.12)%(W+80)+W+80)%(W+80)-30;
    const y=55+noise(k+19)*(H-110);
    circle(c,x,y,noise(k+31)*2.4+.5,k%3?"rgba(246,185,94,.22)":"rgba(119,163,198,.17)");
  }
}
function ground(c,s,assets={}) {
  const step=14,top=[],bottom=[];
  for(let x=-step;x<=W+step;x+=step){
    const wx=x+s.scroll;
    top.push([x,tunnelCenter(wx)-tunnelRadius(wx)]);
    bottom.push([x,tunnelCenter(wx)+tunnelRadius(wx)]);
  }
  // The imported cavern paintings ALREADY have gorgeous rocky ceilings and floors.
  // Do not obscure them with a solid computer-generated wall or repeat full paintings.
  // A translucent shading mask and shallow textured lips are all we need to mark
  // the true collision boundaries while allowing architecture to remain visible.
  for(const side of [-1,1]){
    const pts=side<0?top:bottom;
    c.save();
    c.beginPath();
    if(side<0){c.moveTo(-24,-24);c.lineTo(W+24,-24);}
    else{c.moveTo(-24,H+24);c.lineTo(W+24,H+24);}
    for(let i=pts.length-1;i>=0;i--)c.lineTo(pts[i][0],pts[i][1]);
    c.closePath();c.clip();
    const tint=c.createLinearGradient(0,0,0,H);
    if(side<0){
      tint.addColorStop(0,"rgba(24,11,16,.46)");
      tint.addColorStop(.7,"rgba(29,14,20,.09)");
      tint.addColorStop(1,"rgba(17,11,17,.04)");
    }else{
      tint.addColorStop(0,"rgba(17,11,17,.05)");
      tint.addColorStop(.40,"rgba(24,11,16,.11)");
      tint.addColorStop(1,"rgba(22,12,18,.48)");
    }
    c.fillStyle=tint;c.fillRect(0,0,W,H);
    paintEdge(c,s,side<0?assets.roof:assets.floor,side);
    c.restore();
    // Fine continuous rock boundary, never a diagonal full-width plate.
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
    c.lineWidth=4;c.strokeStyle="rgba(65,40,30,.85)";c.stroke();
    c.lineWidth=1.3;c.strokeStyle="rgba(221,157,93,.54)";c.stroke();
  }
  // Small localized scenery accents along the collision edges.
  for(let i=0;i<6;i++){
    const world=Math.floor(s.scroll/420)*420+i*420+170;
    const x=world-s.scroll;if(x<-50||x>W+50)continue;
    const side=i%2?1:-1;
    const y=tunnelCenter(world)+side*(tunnelRadius(world)-15);
    if(i%3===0&&artReady(assets.gem))drawImageTrim(c,assets.gem,x-13,y-14,26,27,.46);
    else if(i%3===1)drawLantern(c,x,y+side*13,.36);
  }
}

/**
 * Decorative world-anchored tunnel accents. Their geometry is independent of
 * collisions and matches the sloped course, so the vehicle keeps a fair path.
 * When the two recovered Dropbox images are installed the new art keys take over.
 */
function paintTunnelingDecor(c,s,assets={}) {
  // Restrict hanging roots to the nearby roof - never overlay the play lane.
  const roots=assets.hangingRoots;
  if(s.time<38&&artReady(roots)){
    const spacing=1200,start=Math.floor((s.scroll-250)/spacing)-1;
    for(let i=start;i<start+4;i++){
      const world=850+i*spacing,x=world-s.scroll;
      if(x<-330||x>W+60)continue;
      const roofY=tunnelCenter(world)-tunnelRadius(world);
      c.save();c.globalAlpha=.50;
      c.beginPath();c.rect(x-5,roofY-115,230,160);c.clip();
      c.drawImage(roots,x-10,roofY-101,220,133);
      c.restore();
    }
  }
  // The recovered descending roof/floor images are local accents, not giant
  // diagonal sheets. Fit them near the actual sloping boundaries.
  if(!artReady(assets.descentRoof)||!artReady(assets.descentFloor))return;
  const gap=1920,start=Math.floor((s.scroll-500)/gap)-1;
  for(let i=start;i<start+4;i++){
    const world=1490+i*gap,x=world-s.scroll;
    if(x<-360||x>W+80)continue;
    const slope=(tunnelCenter(world+150)-tunnelCenter(world-150))/300;
    if(slope<.17)continue;
    const top=tunnelCenter(world)-tunnelRadius(world);
    const bottom=tunnelCenter(world)+tunnelRadius(world);
    const w=300,h=64;
    c.save();c.globalAlpha=.34;
    c.translate(x,top);c.rotate(Math.atan(slope));
    c.drawImage(assets.descentRoof,0,0,assets.descentRoof.naturalWidth,assets.descentRoof.naturalHeight,-30,-h+7,w,h);
    c.restore();
    c.save();c.globalAlpha=.30;
    c.translate(x,bottom);c.rotate(Math.atan(slope));
    c.drawImage(assets.descentFloor,0,0,assets.descentFloor.naturalWidth,assets.descentFloor.naturalHeight,-30,-4,w,h);
    c.restore();
  }
}

function pickup(c,o,s,assets={}){
  const img=assets[o.kind==='bone'?'bone':o.kind==='cheese'?'cheese':o.kind==='gem'?'gem':o.kind==='cache'?'cache':'nonexistent'];
  if(artReady(img) && !o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-60&&x<=W+60){const sz=o.kind==='cache'?67:48; glow(c,x,y,sz*.8,'rgba(255,182,76,.20)');drawImageTrim(c,img,x-sz/2,y-sz/2+Math.sin(s.time*5+o.id)*2,sz,sz);return;}}

  const x=o.x-s.scroll,y=o.y;
  if(x< -80||x>W+90||o.taken)return;
  c.save();c.translate(x,y);const bob=Math.sin(s.time*5+o.id)*3;c.translate(0,bob);
  const isCache=o.kind==="cache";glow(c,0,0,isCache?57:35,isCache?"rgba(255,216,86,.30)":"rgba(255,163,68,.23)");
  c.lineWidth=3;c.strokeStyle="rgba(255,224,140,.75)";
  if(o.kind==="bone"){
    c.rotate(-.15);c.fillStyle="#ffe2a0";rounded(c,-17,-7,34,14,6);c.fill();for(const xx of [-17,17])for(const yy of [-7,7])circle(c,xx,yy,8,"#ffe4a1");c.strokeStyle="#be8142";c.stroke();
  } else if(o.kind==="cheese"){
    polygon(c,[-19,17,-19,-7,18,-20,23,18],"#f6ba31");
    polygon(c,[-19,-7,18,-20,23,-5,-12,6],"#ffe27c");
    circle(c,6,5,5,"#b97a25");circle(c,-9,-1,3,"#b97a25");
  } else if(o.kind==="gem"||isCache){
    c.fillStyle=isCache?"#ffb94e":"#fb4472";
    polygon(c,[0,-22,17,-9,13,12,0,24,-17,10,-16,-9],c.fillStyle);
    polygon(c,[0,-22,0,24,-17,10,-16,-9],"rgba(255,235,244,.42)");
    polygon(c,[0,-22,17,-9,0,3],"rgba(255,255,255,.55)");
    c.stroke();
  } else if(o.kind==="rock"||o.kind==="spike"){
    c.restore(); hazard(c,o,s,assets);return;
  }
  c.restore();
}
function hazard(c,o,s,assets={}){
  const img=assets[o.kind==='spike'?'spike':'rock'];
  if(artReady(img)&&!o.taken){const x=o.x-s.scroll,y=o.y;if(x>=-90&&x<W+90){const sz=o.kind==='spike'?90:87;glow(c,x,y,57,'rgba(245,77,57,.12)');
    if(artReady(assets.hazardPulse)){
      const pulse=.22+.14*Math.sin(s.time*9+o.id);
      drawImageTrim(c,assets.hazardPulse,x-62,y-62,124,124,pulse);
    }c.save();c.translate(x,y);if(o.kind==='spike')c.rotate(s.time*1.8);drawImageTrim(c,img,-sz/2,-sz/2,sz,sz);c.restore();return;}}

  const x=o.x-s.scroll,y=o.y;
  if(x<-85||x>W+90||o.taken)return;
  c.save();c.translate(x,y);
  glow(c,0,0,57,"rgba(255,66,55,.18)");
  if(o.kind==="spike"){
    c.rotate(s.time*1.55+o.id);
    for(let a=0;a<12;a++){
      const q=a*TWO_PI/12;
      polygon(c,[Math.cos(q-.2)*31,Math.sin(q-.2)*31,Math.cos(q)*55,Math.sin(q)*55,Math.cos(q+.2)*31,Math.sin(q+.2)*31],"#a88357");
    }
    circle(c,0,0,31,"#382d2e");circle(c,0,0,24,"#6b5a50");circle(c,0,0,8,"#e1a55a");
  }else{
    drawRock(c,0,0,40,o.id,"#675e59");
    for(let i=0;i<3;i++)circle(c,-14+i*13,-13+i*5,3,"#dc9a60");
  }
  c.restore();
}
function vehicle(c,s,portrait,assets={}) {
  if(artReady(assets.body)){
    c.save();c.translate(DRILL_ANCHOR,s.y);c.rotate(s.pitch);
    if(s.hitCooldown>0 && Math.floor(s.time*13)%2===0)c.globalAlpha=.52;
    const boosted=s.boostTime>0;
    if(boosted){
      // The engine, not Rosie's face, glows. Streaks trail behind the vehicle.
      glow(c,-95,0,142,'rgba(255,163,47,.27)');
      for(let i=0;i<11;i++){
        const yy=(i-5)*17+Math.sin(s.time*27+i*1.8)*6;
        c.strokeStyle=i%3===0?'rgba(255,247,184,.72)':'rgba(252,154,53,.54)';
        c.lineWidth=1.5+(i%3);
        const travel=(s.time*390+i*41)%110;
        c.beginPath();c.moveTo(-155-travel*.36,yy);c.lineTo(-256-travel,yy-12);c.stroke();
      }
    }
    for(let i=0;i<10;i++){
      const phase=Math.floor(s.time*20),radius=2+noise(i+phase)*6;
      circle(c,-145-noise(i*17+phase)*80,(noise(i+phase*11)-.5)*72,radius,i%2?'rgba(255,183,91,.59)':'rgba(138,94,58,.57)');
    }
    drawImageTrim(c,assets.body,-168,-125,336,252);
    if(artReady(assets.auger)){
      const fps=s.boostTime>0?34:19,frame=Math.floor(s.time*fps)%8;
      c.drawImage(assets.auger,(frame%4)*500,Math.floor(frame/4)*410,500,410,
        -168+948/1448*336,-125+477/1086*252,500/1448*336,410/1086*252);
    }
    // Rotating axial sheen: each spiral rib catches and releases highlights as
    // the auger turns, while the separately rendered sprite remains registered.
    c.save();
    c.globalCompositeOperation="screen";
    for(let i=0;i<5;i++){
      const pos=77+i*16,half=40-i*6;
      const phase=s.time*(boosted?43:23)-i*.75;
      const sheen=.11+.18*Math.max(0,Math.cos(phase));
      c.strokeStyle="rgba(255,232,156,"+sheen.toFixed(3)+")";
      c.lineWidth=2.8;
      c.beginPath();c.moveTo(pos,-half);c.quadraticCurveTo(pos+4+Math.sin(phase)*3,0,pos,half);c.stroke();
    }
    c.restore();
    if(boosted){
      // Source art has large transparent margins. Crop to the actual fiery auger,
      // align its pointed tip with the mechanical drill rather than covering Rosie.
      const flare=assets.turbo;
      if(artReady(flare)){
        c.save();
        c.globalCompositeOperation="screen";
        c.globalAlpha=.58+.12*Math.sin(s.time*23);
        c.drawImage(flare,391,75,569,235,18,-64,190,127);
        c.restore();
      }
      // Spinning concentric light and sparks stay attached to the drill tip.
      const spin=s.time*29;
      c.save();c.translate(157,0);
      glow(c,0,0,68,"rgba(255,222,99,.35)");
      c.strokeStyle="rgba(255,232,138,.78)";c.lineWidth=3;
      c.beginPath();c.ellipse(0,0,11+Math.sin(spin)*4,26,0,-spin,-spin+Math.PI*1.16);c.stroke();
      c.strokeStyle="rgba(255,246,188,.60)";c.lineWidth=2;
      c.beginPath();c.ellipse(-12,0,12,38,0,spin,spin+Math.PI*.85);c.stroke();
      for(let i=0;i<13;i++){
        const a=spin+i*2.399,rad=18+(i%4)*9;
        const px=Math.cos(a)*rad,py=Math.sin(a)*rad;
        circle(c,px,py,1.6+(i%3),"rgba(255,212,105,.85)");
      }
      c.restore();
    }
    c.restore();return;
  }

  const x=DRILL_ANCHOR,y=s.y;
  c.save();c.translate(x,y);c.rotate(s.pitch);
  if(s.hitCooldown>0&&Math.floor(s.time*14)%2===1)c.globalAlpha=.42;
  glow(c,65,4,s.boostTime>0?180:102,s.boostTime>0?"rgba(255,212,71,.45)":"rgba(244,145,43,.20)");
  // Dirt plume behind drill, continuous and directional.
  for(let i=0;i<14;i++){
    const q=noise(Math.floor(s.time*16)+i*13);
    const px=-90-(q*110),py=(noise(i*22+Math.floor(s.time*14))-.5)*90;
    circle(c,px,py,2+q*8,i%3===0?"rgba(255,189,82,.65)":"rgba(128,85,52,.65)");
  }
  // Rear engine and bright brass framework.
  rounded(c,-112,-65,152,121,25);c.fillStyle="#661d24";c.fill();c.lineWidth=6;c.strokeStyle="#e7b668";c.stroke();
  c.fillStyle="#ac3034";rounded(c,-100,-53,132,96,19);c.fill();
  for(let i=0;i<5;i++){
    c.fillStyle=i%2?"#d29f60":"#432229";c.fillRect(-93+i*24,-61,7,112);
  }
  c.fillStyle="#3e2226";rounded(c,-69,-94,95,83,34);c.fill();c.strokeStyle="#e0b36d";c.lineWidth=5;c.stroke();
  // Rosie's real app portrait stays inside the cockpit rather than replacing her.
  if(portrait?.complete&&portrait.naturalWidth>0){
    c.save();c.beginPath();c.ellipse(-22,-63,42,45,0,0,TWO_PI);c.clip();
    const iw=portrait.naturalWidth, ih=portrait.naturalHeight;
    const ratio=iw/ih, h=105,w=h*ratio;
    c.drawImage(portrait,-22-w*.5,-103,w,h);
    c.restore();
  }else{
    circle(c,-23,-67,35,"#392b24");polygon(c,[-53,-85,-57,-127,-25,-101],"#32251f");
    polygon(c,[-11,-99,2,-126,12,-82],"#30211f");
    circle(c,-9,-73,4,"#eead5f");
  }
  // Lantern, scarf, canine regalia.
  c.fillStyle="#f1e3c6";polygon(c,[-60,-28,4,-28,-31,-10],"#f5e5d1");
  polygon(c,[-48,-23,-110,-9,-63,-12],"#a52438");
  c.fillStyle="#e9bc70";rounded(c,-59,-117,71,11,5);c.fill();c.fillStyle="#40231e";rounded(c,-53,-122,65,18,5);c.fill();
  circle(c,8,-112,9,"#f2cd7e");glow(c,8,-111,32,"rgba(252,191,84,.4)");
  circle(c,-81,3,24,"#b17c3e");circle(c,-81,3,18,"#28252c");
  c.fillStyle="#f7d994";c.font="bold 23px Georgia";c.fillText("✦",-91,11);
  // Rotating corkscrew drill nose, constructed as a tapered brass auger.
  const drill=c.createLinearGradient(22,-45,157,35);
  drill.addColorStop(0,"#fff0ae");drill.addColorStop(.18,"#aa6631");drill.addColorStop(.37,"#f9c46e");drill.addColorStop(.6,"#6b3b23");drill.addColorStop(.83,"#d59645");drill.addColorStop(1,"#e6b55e");
  polygon(c,[25,-53,72,-44,116,-25,166,1,116,26,72,45,25,52],drill);
  c.strokeStyle="#f9d994";c.lineWidth=3;c.beginPath();c.moveTo(26,-52);c.lineTo(166,1);c.lineTo(25,52);c.stroke();
  for(let i=0;i<5;i++){
    const dx=38+i*24, height=51-i*10, wave=Math.sin(s.time*18+i)*2;
    c.strokeStyle=i%2===0?"#4f2921":"#ffdc84";c.lineWidth=7-i*.7;
    c.beginPath();c.moveTo(dx,-height);c.quadraticCurveTo(dx+13+wave,0,dx,height);c.stroke();
    c.strokeStyle="rgba(255,244,177,.7)";c.lineWidth=2;c.beginPath();c.moveTo(dx+3,-height);c.lineTo(dx+7,0);c.stroke();
  }
  if(s.boostTime>0){
    c.strokeStyle="rgba(255,214,81,.85)";c.lineWidth=4;
    for(let j=0;j<5;j++){c.beginPath();c.moveTo(-125,-27+j*15);c.lineTo(-195-noise(j+s.time)*30,-44+j*18);c.stroke();}
  }
  c.restore();
}
export function paintDrill(c,s,portrait,particles=[],assets={}) {
  c.clearRect(0,0,W,H);
  scenery(c,s,assets);
  ground(c,s,assets);
  paintTunnelingDecor(c,s,assets);
  // First collectibles, then drill, with hazards on top for readable play.
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && o.kind!=="rock"&&o.kind!=="spike")pickup(c,o,s,assets);
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && (o.kind==="rock"||o.kind==="spike"))hazard(c,o,s);
  vehicle(c,s,portrait,assets);
  for(const p of particles){
    c.save();c.globalAlpha=Math.max(0,p.life/p.max);
    if(p.type==="cache-burst"&&artReady(assets.cacheBurst)){
      const frame=Math.min(7,Math.floor((1-p.life/p.max)*8)), fw=assets.cacheBurst.naturalWidth/4,fh=assets.cacheBurst.naturalHeight/2;
      c.drawImage(assets.cacheBurst,(frame%4)*fw,Math.floor(frame/4)*fh,fw,fh,p.x-80,p.y-80,160,160);
    } else circle(c,p.x,p.y,p.r,p.color);
    c.restore();
  }
  if(s.shock>0){
    c.fillStyle="rgba(246,67,38,"+(s.shock*.36)+")";c.fillRect(0,0,W,H);
  }
  const shade=c.createLinearGradient(0,0,W,0);
  shade.addColorStop(0,"rgba(9,9,17,.21)");shade.addColorStop(.35,"rgba(9,9,17,0)");shade.addColorStop(1,"rgba(9,9,17,.16)");
  c.fillStyle=shade;c.fillRect(0,0,W,H);
}
