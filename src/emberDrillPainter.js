import { DRILL_WIDTH as W, DRILL_HEIGHT as H, DRILL_ANCHOR, tunnelCenter, tunnelRadius, clamp } from "./emberDrillEngine.js";

const TWO_PI = Math.PI * 2;
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
function scenery(c,s) {
  const ruby = clamp((s.time-19)/19,0,1);
  const bg=c.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#100e1d");bg.addColorStop(.45,ruby>.3?"#26212c":"#25191e");bg.addColorStop(1,ruby>.3?"#462620":"#38261f");
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  // Architectural background, warm waterfalls and canine temple reliefs.
  for(let k=0;k<8;k++){
    const x=((k*245 - s.scroll*.27)%(W+300)+W+300)%(W+300)-120;
    const g=c.createLinearGradient(x,0,x+65,0);
    g.addColorStop(0,"rgba(255,136,42,0)");g.addColorStop(.46,"rgba(255,198,98,"+(ruby*.18)+")");g.addColorStop(.52,"rgba(255,246,161,"+(ruby*.32)+")");g.addColorStop(1,"rgba(255,136,42,0)");
    c.fillStyle=g;c.fillRect(x,0,75,H);
  }
  for(let i=0;i<6;i++){
    const px=((i*185-s.scroll*.2)%(W+250)+W+250)%(W+250)-120;
    glow(c,px,100+noise(i)*600,130,ruby>.2?"rgba(251,161,59,.15)":"rgba(162,89,44,.08)");
  }
  if(ruby>0.02) {
    c.save();c.globalAlpha=ruby;
    for(let k=Math.floor((s.scroll*.4-300)/310);k<Math.ceil((s.scroll*.4+W+300)/310);k++){
      const x=k*310-s.scroll*.4;
      drawStoneColumns(c,x,740,.78+noise(k)*.17,k);
      if(k%2===0)drawLantern(c,x+105,205+noise(k)*100,.65);
      // Paw sigils and deep crimson banners.
      if(k%3===0) {
        polygon(c,[x+85,55,x+140,55,x+140,185,x+112,209,x+85,185],"#7e202c");
        c.fillStyle="#dfb873";c.font="bold 43px Georgia";c.fillText("✦",x+96,125);
      }
    }
    c.restore();
  } else {
    // Buried roots foreshadow Rosie's actual digging habit.
    for(let k=0;k<10;k++){
      const x=((k*178-s.scroll*.48)%(W+190)+W+190)%(W+190)-80;
      c.strokeStyle="#59412c";c.lineWidth=8+noise(k)*4;c.beginPath();c.moveTo(x,-20);c.bezierCurveTo(x-35,63,x+66,108,x+20,160);c.stroke();
      c.strokeStyle="#886142";c.lineWidth=2;c.beginPath();c.moveTo(x+20,158);c.quadraticCurveTo(x+55,183,x+38,204);c.stroke();
    }
    // Comically solemn buried tennis ball relic.
    const ballX=1600-s.scroll*.77;
    if(ballX>-80&&ballX<W+60) {
      glow(c,ballX,70,65,"rgba(237,244,117,.24)");
      circle(c,ballX,72,33,"#a1ad43");c.strokeStyle="#f6ecb4";c.lineWidth=5;
      c.beginPath();c.arc(ballX-19,71,20,-1.3,1.3);c.arc(ballX+19,71,20,1.8,4.5);c.stroke();
    }
  }
  // Distant light flecks, static positions across screens to prevent flicker.
  for(let k=0;k<100;k++){
    const x=((k*89 - s.scroll*.12)%(W+30)+W+30)%(W+30)-15;
    const y=noise(k+19)*H;
    circle(c,x,y,noise(k+31)*2.2+.4,k%3?"rgba(244,185,85,.22)":"rgba(110,156,186,.20)");
  }
}
function ground(c,s){
  const step=24, top=[],bottom=[];
  for(let x=-step;x<=W+step;x+=step){
    const wx=x+s.scroll;
    const middle=tunnelCenter(wx),r=tunnelRadius(wx);
    top.push([x,middle-r]);bottom.push([x,middle+r]);
  }
  // Dense earth above and below the traversable corridor.
  c.beginPath();c.moveTo(-25,0);c.lineTo(W+25,0);
  for(let i=top.length-1;i>=0;i--)c.lineTo(top[i][0],top[i][1]);
  c.closePath();
  const tg=c.createLinearGradient(0,0,0,H*.55);
  tg.addColorStop(0,"#37261f");tg.addColorStop(1,"#160e16");c.fillStyle=tg;c.fill();
  c.beginPath();c.moveTo(-25,H);c.lineTo(W+25,H);
  for(let i=bottom.length-1;i>=0;i--)c.lineTo(bottom[i][0],bottom[i][1]);
  c.closePath();
  const bg=c.createLinearGradient(0,H*.45,0,H);
  bg.addColorStop(0,"#1b1019");bg.addColorStop(1,"#493022");c.fillStyle=bg;c.fill();
  const rockColor=["#48322a","#513428","#30242a","#6a4330","#3a2a27","#5b3d2d"];
  for(let k=0;k<100;k++){
    const worldK=Math.floor(s.scroll/80)+k;
    const x=worldK*80-s.scroll+(noise(worldK+10)-.5)*57;
    if(x < -100||x>W+100)continue;
    const cy=tunnelCenter(worldK*80),rad=tunnelRadius(worldK*80);
    const up= k%2===0;
    const y=up ? cy-rad-(12+noise(k+worldK)*130) : cy+rad+(12+noise(k+worldK+12)*130);
    drawRock(c,x,y,12+noise(worldK)*31,worldK,rockColor[worldK%rockColor.length]);
  }
  for(const points of [top,bottom]){
    c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));
    c.lineWidth=10;c.strokeStyle="#8c5532";c.stroke();
    c.lineWidth=3;c.strokeStyle="#e2a35e";c.stroke();
    for(let k=1;k<points.length;k+=3) {
      const x=points[k][0],y=points[k][1],direction=points===top?-1:1;
      drawRock(c,x,y+direction*11,13+noise(k+x*.1)*15,k+x,"#52362e");
    }
  }
  const amber=s.time>30;
  for(let k=0;k<10;k++){
    const wx=(Math.floor(s.scroll/185)+k)*185;
    const x=wx-s.scroll;
    const y=tunnelCenter(wx)+(k%2?1:-1)*(tunnelRadius(wx)-38);
    if(x<0||x>W)continue;
    if(amber&&k%3===0){
      glow(c,x,y,67,"rgba(255,70,42,.23)");
      polygon(c,[x-15,y+26,x-30,y+5,x-7,y-42,x+10,y-58,x+30,y-2,x+8,y+37],"#9c2240");
      polygon(c,[x-5,y+19,x,y-27,x+11,y-39,x+16,y-2],"#ff6c7a");
    }else if(k%3===1)drawLantern(c,x,y+(k%2?25:-25),.47);
  }
}
function pickup(c,o,s){
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
    c.restore(); hazard(c,o,s);return;
  }
  c.restore();
}
function hazard(c,o,s){
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
function vehicle(c,s,portrait) {
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
export function paintDrill(c,s,portrait,particles=[]) {
  c.clearRect(0,0,W,H);
  scenery(c,s);
  ground(c,s);
  // First collectibles, then drill, with hazards on top for readable play.
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && o.kind!=="rock"&&o.kind!=="spike")pickup(c,o,s);
  for(const o of s.objects) if(o.x>=s.scroll-100&&o.x<s.scroll+W+100 && (o.kind==="rock"||o.kind==="spike"))hazard(c,o,s);
  vehicle(c,s,portrait);
  for(const p of particles){
    c.save();c.globalAlpha=Math.max(0,p.life/p.max);
    circle(c,p.x,p.y,p.r,p.color);c.restore();
  }
  if(s.shock>0){
    c.fillStyle="rgba(246,67,38,"+(s.shock*.36)+")";c.fillRect(0,0,W,H);
  }
  const shade=c.createLinearGradient(0,0,W,0);
  shade.addColorStop(0,"rgba(9,9,17,.21)");shade.addColorStop(.35,"rgba(9,9,17,0)");shade.addColorStop(1,"rgba(9,9,17,.16)");
  c.fillStyle=shade;c.fillRect(0,0,W,H);
}
