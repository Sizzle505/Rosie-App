/* Captain Rosie: Cosmic Odyssey - playable proof of concept, 2026-11-11.
 * No external dependencies; original image artwork remains in ./assets/.
 */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const asset = name => window.COSMIC_ASSETS?.[name] || `assets/${name}.webp`;
 const board=$('board'),frame=$('board-frame'),veil=$('veil'),message=$('message');
 const DIRS={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
 const ENEMY_INFO=[
  {id:'jett',name:'Jett Scroundrel',hp:1,speed:510,kind:'patrol',points:150},
  {id:'chip',name:'Chip Scurrio',hp:1,speed:465,kind:'patrol',points:175},
  {id:'kitty',name:'Kitty Xenovese',hp:3,speed:410,kind:'chase',points:400}
 ];
 let cols=11,rows=15,tile=26,grid=[],itemAt=new Map(),cells=[],entities=[],player=null,exitPos=null;
 let scene='nebula',running=false,phase='start',score=0,ammo=0,lives=3,got=0,target=18,deadCount=0,protectedUntil=0,slowUntil=0,shakeUntil=0;
 let lastTick=0,loopId=0,inputMoveAt=0,autoMove=false,lastFacing='right',wantFacing='right',level=1,touchStart=null;
 const key=(x,y)=>`${x},${y}`;const inside=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows;
 const open=(x,y)=>inside(x,y)&&grid[y][x]===0;
 const rand=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return ((seed>>>0)/4294967296)};
 const neighbors=(p)=>Object.entries(DIRS).map(([dir,v])=>({dir,x:p.x+v[0],y:p.y+v[1]})).filter(p=>open(p.x,p.y));
 const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 function maze(seed){
  const rnd=rand(seed);grid=Array.from({length:rows},()=>Array(cols).fill(1));const trail=[[1,1]];grid[1][1]=0;
  while(trail.length){const cur=trail[trail.length-1];const options=[];
   for(const [dx,dy] of Object.values(DIRS)){const x=cur[0]+2*dx,y=cur[1]+2*dy;if(x>0&&x<cols-1&&y>0&&y<rows-1&&grid[y][x])options.push([x,y,dx,dy]);}
   if(!options.length){trail.pop();continue;}const [x,y,dx,dy]=options[Math.floor(rnd()*options.length)];grid[cur[1]+dy][cur[0]+dx]=0;grid[y][x]=0;trail.push([x,y]);
  }
  // A Pac-Man-inspired maze needs connected loops, not only a tree of dead ends.
  for(let y=2;y<rows-2;y++)for(let x=2;x<cols-2;x++){
   if(!grid[y][x])continue;
   const h=open(x-1,y)&&open(x+1,y);const v=open(x,y-1)&&open(x,y+1);
   if((h||v)&&rnd()<.31)grid[y][x]=0;
  }
  const cx=(Math.floor(cols/2)|1),cy=rows-2;
  for(let y=cy-2;y<=cy;y++)grid[y][cx]=0;
  grid[cy][cx-2]=0;grid[cy][cx-1]=0;grid[cy][cx+1]=0;grid[cy][cx+2]=0;
 }
 function bfs(from,goal,blocked=null){
  if(!goal || key(from.x,from.y)===key(goal.x,goal.y))return null;
  const q=[from],seen=new Set([key(from.x,from.y)]),step=new Map();
  for(let i=0;i<q.length;i++){
   const n=q[i];for(const cand of neighbors(n)){
    const k=key(cand.x,cand.y);if(seen.has(k)||k===blocked)continue;
    seen.add(k);step.set(k,{p:key(n.x,n.y),d:cand.dir});
    if(cand.x===goal.x&&cand.y===goal.y){let at=k;while(step.get(at)?.p!==key(from.x,from.y)){at=step.get(at)?.p;if(!step.has(at))return cand.dir;}return step.get(at)?.d || cand.dir;}
    q.push(cand);
   }
  }
  return null;
 }
 function nearestOpen(preferred){if(open(preferred.x,preferred.y))return preferred;for(let r=1;r<Math.max(cols,rows);r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.abs(dx)+Math.abs(dy)===r&&open(preferred.x+dx,preferred.y+dy))return{x:preferred.x+dx,y:preferred.y+dy};return{x:1,y:1};}
 function resize(){
  // Desktop landscape board; iPhone portrait board. Preserve active run dimensions.
  const desktop=innerWidth>=760&&innerWidth>innerHeight;
  if(!player && cols!==(desktop?17:11)){cols=desktop?17:11;rows=desktop?11:15;}
  const head=document.querySelector('.cosmic-top'),hud=document.querySelector('.cosmic-hud'),bottom=document.querySelector('.cosmic-bottom');
  const freeH=Math.max(170,innerHeight-head.getBoundingClientRect().height-hud.getBoundingClientRect().height-bottom.getBoundingClientRect().height-45);
  tile=Math.max(9,Math.floor(Math.min((innerWidth-24)/cols,freeH/rows)));
  frame.style.width=(cols*tile+6)+'px';frame.style.height=(rows*tile+6)+'px';
  board.style.gridTemplateColumns=`repeat(${cols}, 1fr)`;board.style.gridTemplateRows=`repeat(${rows}, 1fr)`;
  if(player){position(player);for(const ent of entities)position(ent);positionExit();positionShield();}
 }
 function position(obj){
  if(!obj?.el)return;
  // The art has generous internal margins: render substantially larger than one maze cell.
  const w=obj===player?2.75:2.45,px=tile*w,py=tile*(obj===player?2.36:2.12);
  obj.el.style.width=px+'px';obj.el.style.height=py+'px';
  const offX=(obj.x+.5)*tile-px/2,offY=(obj.y+.5)*tile-py/2;
  const facing=obj===player&&lastFacing==='left'?' scaleX(-1)':'';
  obj.el.style.transform=`translate(${offX}px,${offY}px)`+facing;
 }
 function positionExit(){const el=$('cosmic-exit');if(el){el.style.width=tile*1.5+'px';el.style.height=tile*1.4+'px';el.style.left=((exitPos.x+.5)*tile-tile*.75)+'px';el.style.top=((exitPos.y+.5)*tile-tile*.7)+'px';}}
 function positionShield(now=performance.now()){
  const el=$('cosmic-shield');
  if(!player||!el)return;
  const active=phase==='playing'&&now<protectedUntil;
  const size=tile*3.05;
  el.style.width=size+'px';el.style.height=size+'px';
  el.style.left=((player.x+.5)*tile-size/2)+'px';
  el.style.top=((player.y+.5)*tile-size/2)+'px';
  el.classList.toggle('active',active);
 }
 function changeScene(next){
  scene=next==='lunar'?'lunar':'nebula';
  board.dataset.scene=scene;
  const label=$('scene-name');if(label)label.textContent=scene==='nebula'?'NEBULA':'LUNAR';
  $('level').textContent=scene==='nebula'?'NEBULA PASSAGE':'LUNAR OUTPOST';
 }
 function popup(text,p){const el=document.createElement('div');el.className='popup-message';el.textContent=text;el.style.left=`${(p.x+.2)*tile}px`;el.style.top=`${(p.y-.1)*tile}px`;board.append(el);setTimeout(()=>el.remove(),990);}
 function effect(type,p,size=1){const el=document.createElement('span');el.className=`effect ${type}`;el.style.left=((p.x+.5)*tile)+'px';el.style.top=((p.y+.5)*tile)+'px';el.style.width=(tile*size)+'px';el.style.height=(tile*size)+'px';if(type==='explosion')el.innerHTML=`<img src="${asset('explosion')}" alt="">`;board.append(el);setTimeout(()=>el.remove(),440);}
 function sound(freq=480,duration=.07,shape='sine'){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!sound.context)sound.context=new C();const ctx=sound.context,o=ctx.createOscillator(),g=ctx.createGain();o.type=shape;o.frequency.value=freq;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);}catch{}}
 function say(text){message.textContent=text;}
 function ui(){ $('score').textContent=String(score).padStart(5,'0');$('ammo').innerHTML=`${ammo} <i>/ 8</i>`;$('lives').textContent='♥ '.repeat(lives).trim()||'—';$('gathered').textContent=`${Math.min(got,target)} / ${target}`;$('fiends-left').textContent=3-deadCount;$('laser').disabled=ammo<1||phase!=='playing';$('rocket').disabled=ammo<2||phase!=='playing';}
 function addSprite(name,x,y,css){const el=document.createElement('img');el.src=asset(name);el.alt='';el.className=`sprite ${css}`;el.draggable=false;board.append(el);return el;}
 function addPickup(x,y,kind){const el=kind==='treat'||kind==='bone'?document.createElement('span'):document.createElement('img');el.className=`pickup ${kind}`;
  if(el.tagName==='IMG')el.src=asset(kind==='rocket'?'rocket-pickup':kind==='shield'?'shield-pickup':'cheese');cells[y][x].append(el);itemAt.set(key(x,y),{kind,el});
 }
 function populate(seed){const rnd=rand(seed+67);let floor=[];for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(open(x,y))floor.push({x,y});
  const reserved=new Set([key(player.x,player.y),...entities.map(e=>key(e.x,e.y)),key(exitPos.x,exitPos.y)]);
  const options=floor.filter(p=>!reserved.has(key(p.x,p.y))&&dist(p,player)>2);
  options.sort(()=>rnd()-.5);let treatCount=0;
  for(const p of options){if(rnd()<.59){addPickup(p.x,p.y,'treat');treatCount++;}}
  if(treatCount<target){for(const p of options){if(treatCount>=target+6)break;if(!itemAt.has(key(p.x,p.y))){addPickup(p.x,p.y,'treat');treatCount++;}}}
  const special=options.filter(p=>!itemAt.has(key(p.x,p.y)));special.slice(0,5).forEach(p=>addPickup(p.x,p.y,'cheese'));
  special.slice(5,7).forEach(p=>addPickup(p.x,p.y,'bone'));
  special.slice(7,9).forEach(p=>addPickup(p.x,p.y,'shield'));
  special.slice(9,11).forEach(p=>addPickup(p.x,p.y,'rocket'));
 }
 function createBoard(){board.innerHTML='';itemAt.clear();cells=[];for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++){const cell=document.createElement('div');cell.className='cell '+(grid[y][x]?'wall':'floor');board.append(cell);row.push(cell);}cells.push(row);}
  const e=document.createElement('img');e.id='cosmic-exit';e.className='exit locked';e.src=asset('portal');e.alt='Exit portal';board.append(e);positionExit();}
 function enter(status,text,buttonText){phase=status;running=false;veil.classList.remove('hidden');$('veil-title').textContent=status==='win'?'MISSION COMPLETE':status==='lose'?'MISSION FAILED':status==='paused'?'MISSION PAUSED':'COSMIC ODYSSEY';$('veil-msg').textContent=text;$('start').textContent=buttonText;ui();}
 function init(){const desktop=innerWidth>=760&&innerWidth>innerHeight;cols=desktop?17:11;rows=desktop?11:15;
  score=0;ammo=0;lives=3;got=0;deadCount=0;lastFacing='right';wantFacing='right';protectedUntil=0;slowUntil=0;lastTick=0;inputMoveAt=0;autoMove=false;entities=[];player=null;
  maze(6900+level*19+cols);const cy=rows-2,cx=(Math.floor(cols/2)|1);const spawn=nearestOpen({x:cx,y:cy});exitPos=nearestOpen({x:cx,y:1});
  const spots=[{x:1,y:1},{x:cols-2,y:1},{x:cols-2,y:rows-4}].map(nearestOpen);
  player={x:spawn.x,y:spawn.y,spawn};entities=ENEMY_INFO.map((a,i)=>({...a,spawn:spots[i],x:spots[i].x,y:spots[i].y,health:a.hp,next:0,until:0,patrolIndex:0,hits:0,killed:false,el:null}));
  createBoard();player.el=addSprite('rosie',player.x,player.y,'rosie');for(const e of entities)e.el=addSprite(e.id,e.x,e.y,'fiend '+e.id);
  populate(310+level*37);const patrols=[[],[]];for(const [i,e] of entities.entries()){
   if(i===2)continue;const nearby=[...itemAt.keys()].filter(k=>itemAt.get(k).kind==='treat').map(k=>{const[x,y]=k.split(',').map(Number);return{x,y};}).filter(p=>dist(p,e.spawn)<Math.max(9,cols*.7));
   nearby.sort((a,b)=>Math.atan2(a.y-e.y,a.x-e.x)-Math.atan2(b.y-e.y,b.x-e.x));
   const picks=nearby.filter((p,j)=>j%Math.max(1,Math.floor(nearby.length/5))===0).slice(0,5);
   e.patrol=picks.length?picks:[e.spawn,player.spawn];if(i===1)e.patrol.reverse();
  }
  const aura=document.createElement('img');aura.id='cosmic-shield';aura.className='shield-aura';aura.src=asset('shield');aura.alt='';aura.draggable=false;board.append(aura);
  changeScene(scene);resize();for(const e of entities)position(e);position(player);positionShield();ui();}
 function start(){if(phase==='paused'){phase='playing';running=true;veil.classList.add('hidden');say('Resume course.');return;}
  level=1;init();phase='playing';running=true;protectedUntil=performance.now()+1800;veil.classList.add('hidden');positionShield();say('Launch shield active! Collect treats to arm your ship.');sound(670,.17);ui();}
 function pause(){if(phase==='playing')enter('paused','Your mission is safely paused. Resume whenever ready.','RESUME MISSION');else if(phase==='paused')start();}
 function pick(){const k=key(player.x,player.y),item=itemAt.get(k);if(!item)return;itemAt.delete(k);item.el.remove();const p={x:player.x,y:player.y};
  switch(item.kind){case'treat':got++;ammo=Math.min(8,ammo+1);score+=10;sound(720,.045);break;
  case'cheese':ammo=Math.min(8,ammo+2);score+=50;slowUntil=performance.now()+5200;popup('CHEESE +2',p);sound(960,.14);break;
  case'bone':ammo=Math.min(8,ammo+3);score+=75;protectedUntil=performance.now()+3900;popup('GOLDEN BONE +3',p);sound(1120,.16);break;
  case'rocket':ammo=Math.min(8,ammo+2);score+=25;popup('ROCKET +2',p);sound(840,.1);break;
  case'shield':protectedUntil=performance.now()+5500;popup('SHIELD!',p);sound(930,.13);break;
  }ui();positionShield();if(got>=target&&deadCount===3){$('cosmic-exit').classList.remove('locked');$('cosmic-exit').classList.add('open');say('Portal unlocked! Enter the swirling gateway!');}
 }
 function step(dir){if(phase!=='playing')return;wantFacing=dir;autoMove=true;const now=performance.now();if(now-inputMoveAt<83)return;inputMoveAt=now;
  const vec=DIRS[dir],nx=player.x+vec[0],ny=player.y+vec[1];if(!open(nx,ny)){autoMove=false;return;}
  player.x=nx;player.y=ny;lastFacing=dir;
  player.el.src=asset(dir==='up'?'rosie-up':dir==='down'?'rosie-front':'rosie');
  position(player);positionShield();pick();collide();if(player.x===exitPos.x&&player.y===exitPos.y){if(got>=target&&deadCount===3){score+=1000;enter('win','Captain Rosie has secured the treats and defeated the Fiends. The portal is clear.','FLY AGAIN');sound(1400,.4);}else say(`Portal locked: ${Math.max(0,target-got)} biscuits and ${3-deadCount} Fiends remaining.`);}
 }
 function damage(e){const now=performance.now();if(now<protectedUntil)return;protectedUntil=now+2300;positionShield(now);lives--;player.el.classList.add('hurt');setTimeout(()=>player?.el?.classList.remove('hurt'),800);effect('spark',player,2.5);sound(140,.24,'sawtooth');popup('-1 HULL',player);if(!lives){enter('lose',`Rosie collected ${got} biscuits and defeated ${deadCount} Fiends. Try a different route and keep your ammunition for Kitty.`,'RETRY MISSION');return;}
  const sp=player.spawn;player.x=sp.x;player.y=sp.y;position(player);positionShield();say(`Collision with ${e.name}! Briefly invulnerable.`);ui();}
 function collide(){for(const e of entities)if(!e.killed&&e.health>0&&e.x===player.x&&e.y===player.y){damage(e);break;}}
 function fire(type){
  if(phase!=='playing')return;
  const cost=type==='laser'?1:2;
  if(ammo<cost){say(`Need ${cost} treat${cost>1?'s':''} to fire ${type}.`);sound(180,.04);return;}
  ammo-=cost;ui();
  const [dx,dy]=DIRS[lastFacing],origin={x:player.x,y:player.y};
  let cx=origin.x,cy=origin.y;const traversed=[];
  while(open(cx+dx,cy+dy)){cx+=dx;cy+=dy;traversed.push({x:cx,y:cy});if(traversed.length>30)break;}
  const inLine=entities.filter(e=>!e.killed&&e.health>0&&traversed.some(p=>p.x===e.x&&p.y===e.y)).sort((a,b)=>dist(origin,a)-dist(origin,b));
  const victim=inLine[0];
  const impact=victim?{x:victim.x,y:victim.y}:(traversed.at(-1)||origin);
  const fireAngle=lastFacing==='left'?180:lastFacing==='up'?-90:lastFacing==='down'?90:0;
  effect('muzzle',origin,1.7);
  if(type==='laser'){
    effect('beam',origin,1);
    const beam=board.lastChild;
    const distance=Math.max(tile*.65,dist(origin,impact)*tile);
    beam.style.left=((origin.x+.5)*tile)+'px';
    beam.style.top=((origin.y+.5)*tile)+'px';
    beam.style.width=distance+'px';
    beam.style.height=Math.max(4,tile*.095)+'px';
    beam.style.transform=`rotate(${fireAngle}deg)`;
    sound(680,.13,'sawtooth');
    if(victim)hit(victim,1);else effect('spark',impact,1.2);
  }else{
    sound(320,.18,'sawtooth');say('Rocket launched!');
    const rocket=document.createElement('span');rocket.className='rocket-projectile';
    rocket.innerHTML=`<svg viewBox="0 0 112 52" aria-hidden="true"><defs><linearGradient id="rocketMetal" x2="0" y2="1"><stop stop-color="#fff8d6"/><stop offset=".47" stop-color="#f8ead1"/><stop offset=".52" stop-color="#cdb8a5"/><stop offset="1" stop-color="#fef0d5"/></linearGradient></defs><path d="M20 19 3 8 8 23 2 41 23 34" fill="#f8ae2c" stroke="#ffea99" stroke-width="2"/><path d="M24 18 13 4 43 16 43 36 13 49 24 32" fill="#b72434" stroke="#f8c866" stroke-width="2"/><path d="M30 12H79Q95 16 106 26Q95 37 79 40H30Z" fill="url(#rocketMetal)" stroke="#dba84e" stroke-width="3"/><path d="M51 13H65V39H51Z" fill="#173965"/><path d="M65 13H76V39H65Z" fill="#b82538"/><path d="M80 14Q98 19 106 26Q98 33 80 38" fill="#c52b3b" stroke="#ffe4a0" stroke-width="2"/><path d="M21 19Q11 26 21 33L0 26Z" fill="#fff3a0" opacity=".95"/></svg>`;
    const size=tile*1.65,angle=fireAngle,ms=Math.min(900,Math.max(180,dist(origin,impact)*92));
    rocket.style.width=size+'px';rocket.style.height=size*.55+'px';
    rocket.style.left=((origin.x+.5)*tile)+'px';rocket.style.top=((origin.y+.5)*tile)+'px';
    rocket.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
    board.append(rocket);
    requestAnimationFrame(()=>{
      rocket.style.transition=`left ${ms}ms linear,top ${ms}ms linear`;
      rocket.style.left=((impact.x+.5)*tile)+'px';
      rocket.style.top=((impact.y+.5)*tile)+'px';
    });
    setTimeout(()=>{
      rocket.remove();if(phase!=='playing')return;
      effect('explosion',impact,3.7);effect('spark',impact,2);
      const targets=entities.filter(e=>!e.killed&&e.health>0&&(dist(e,impact)<=1||e===victim&&dist(e,impact)<=2));
      targets.forEach(e=>hit(e,2));if(!targets.length)popup('BOOM!',impact);
      sound(130,.21,'sawtooth');
    },ms+45);
  }
 }
 function hit(e,power){e.health=Math.max(0,e.health-power);e.el.classList.add('hurt');setTimeout(()=>e.el?.classList.remove('hurt'),260);effect('spark',e,2.2);sound(360,.09,'square');
  if(e.health<=0){e.killed=true;deadCount++;score+=e.points;e.el.classList.add('dead');popup(`+${e.points} ${e.name.split(' ')[0]} DOWN`,e);say(`${e.name} defeated! ${3-deadCount} Fiends remain.`);}
  else{popup(`${e.name.split(' ')[0]} ♥${e.health}`,e);say(`${e.name} - ${e.health} HP left.`);}
  if(got>=target&&deadCount===3){$('cosmic-exit').classList.remove('locked');$('cosmic-exit').classList.add('open');say('All Fiends defeated! Reach the portal.');}
  ui();}
 function moveFiend(e,now){if(e.killed)return;if(now<e.next)return;let interval=e.speed;if(now<slowUntil)interval*=2.1;if(e.id==='chip'&&Math.floor(now/2600)%2===0)interval*=.62;e.next=now+interval;
  let goal=null;if(e.kind==='chase')goal=player;
  else{let patrol=e.patrol||[];goal=patrol[e.patrolIndex%patrol.length]||player;if(goal.x===e.x&&goal.y===e.y){e.patrolIndex++;goal=patrol[e.patrolIndex%patrol.length]||player;}
   // Patrol enemies occasionally break their loops to defend nearby treats.
   if(dist(e,player)<4&&Math.floor(now/4700)%3===0)goal=player;
  }
  let direction=bfs(e,goal);if(!direction){const n=neighbors(e);if(n.length)direction=n[Math.floor(Math.random()*n.length)].dir;}
  if(direction){e.x+=DIRS[direction][0];e.y+=DIRS[direction][1];position(e);collide();}
 }
 function tick(now){loopId=requestAnimationFrame(tick);if(phase!=='playing')return;lastTick=now;
  if(autoMove&&now-inputMoveAt>172)step(wantFacing);
  for(const e of entities)moveFiend(e,now);
  positionShield(now);
  if(now<protectedUntil){player.el.style.opacity=Math.floor(now/160)%2===0?'0.75':'1';}else player.el.style.opacity='1';
 }
 // A single continuous requestAnimationFrame loop rather than per-enemy timers.
 function controls(){document.addEventListener('keydown',e=>{
  const m={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left',w:'up',a:'left',s:'down',d:'right'};
  if(m[e.key]){e.preventDefault();step(m[e.key]);}else if(e.code==='Space'){e.preventDefault();fire('laser');}else if(e.key.toLowerCase()==='x'){e.preventDefault();fire('rocket');}else if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();pause();}
 });
  document.querySelectorAll('.dpad button').forEach(btn=>{
   let timer;const fireDir=()=>step(btn.dataset.dir);
   btn.addEventListener('pointerdown',ev=>{ev.preventDefault();btn.setPointerCapture?.(ev.pointerId);fireDir();timer=setInterval(fireDir,125);});
   const stop=()=>{clearInterval(timer);timer=null;};btn.addEventListener('pointerup',stop);btn.addEventListener('pointercancel',stop);btn.addEventListener('lostpointercapture',stop);
  });
  board.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  board.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  board.addEventListener('touchend',e=>{if(!touchStart||!e.changedTouches[0])return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<9)return;step(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');},{passive:true});
  $('scene-toggle').addEventListener('click',()=>changeScene(scene==='nebula'?'lunar':'nebula'));
  $('laser').addEventListener('click',()=>fire('laser'));$('rocket').addEventListener('click',()=>fire('rocket'));$('pause-top').addEventListener('click',pause);$('start').addEventListener('click',start);
  window.addEventListener('resize',()=>{if(phase==='start'&&!player){cols=innerWidth>=760&&innerWidth>innerHeight?17:11;rows=cols===17?11:15;init();}resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')pause();});
 }
 controls();init();enter('start','Collect 18 biscuits to fuel your laser (1 treat) or rocket (2 treats). Jett and Chip patrol the treat lanes; Kitty actively hunts Rosie and takes three laser hits. Defeat all three and escape through the portal.','LAUNCH MISSION');loopId=requestAnimationFrame(tick);
})();
