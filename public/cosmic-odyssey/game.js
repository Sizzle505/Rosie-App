/* Captain Rosie: Cosmic Odyssey - playable proof of concept, 2026-11-11.
 * No external dependencies; original image artwork remains in ./assets/.
 */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const asset = name => window.COSMIC_ASSETS?.[name] || `assets/${name}.webp`;
 const board=$('board'),frame=$('board-frame'),veil=$('veil'),message=$('message');
 const DIRS={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
 // Standalone, approved image assets imported from the earlier Rosie/Fiend batches.
 const EXTRA_ART=[
  'rosie-cruise','rosie-bank-left','rosie-bank-right','rosie-dodge','rosie-boost',
  'rosie-laser','rosie-rocket','chip-turn','chip-ascent','chip-rear','chip-dash',
  'chip-fire','chip-stun','jett-retreat','kitty-retreat','laser-bolt','chip-bolt','rosie-projectile'
 ];
 // Preload high-impact pose transitions to prevent a blank sprite on the first attack/defeat.
 for(const id of ['rosie-cruise','rosie-laser','rosie-rocket','chip-stun','jett-retreat','kitty-retreat']){
  const img=new Image();img.src=asset(id);
 }

 const LEVELS=[
  {name:'NEBULA PASSAGE',tagline:'GALACTIC ARCHWAYS',scene:'nebula',seed:6900,target:18,speed:1,accent:'nebula'},
  {name:'METEOR MISCHIEF',tagline:'THE ASTEROID GAUNTLET',scene:'meteor',seed:9810,target:19,speed:.97,accent:'meteor'},
  {name:'LUNAR OUTPOST',tagline:'MOON COLONY RUN',scene:'lunar',seed:12263,target:20,speed:.95,accent:'lunar'},
  {name:'CRYSTAL CAVERNS',tagline:'THE AMETHYST DEEP',scene:'crystal',seed:16342,target:20,speed:.93,accent:'crystal'},
  {name:'VOLCANIC FOUNDRY',tagline:'MAGMA MACHINERY',scene:'foundry',seed:21831,target:21,speed:.91,accent:'foundry'},
  {name:'DERELICT STARSHIP',tagline:'GHOST SHIP CORRIDORS',scene:'derelict',seed:24749,target:21,speed:.89,accent:'derelict'},
  {name:'COMET ICE CANYON',tagline:'FROSTBOUND FLIGHT',scene:'ice',seed:28112,target:22,speed:.87,accent:'ice'},
  {name:'RINGWORLD GARDENS',tagline:'THE ORBITAL SANCTUARY',scene:'garden',seed:32673,target:22,speed:.86,accent:'garden'},
  {name:'BLACK HOLE OBSERVATORY',tagline:'EVENT HORIZON',scene:'blackhole',seed:35218,target:23,speed:.85,accent:'blackhole'},
  {name:'ANCIENT ALIEN RUINS',tagline:'THE FINAL RELIC',scene:'ruins',seed:39101,target:23,speed:.84,accent:'ruins'}
 ];
 const SCENES=[
  {id:'nebula',name:'NEBULA PASSAGE'},
  {id:'meteor',name:'METEOR MISCHIEF'},
  {id:'lunar',name:'LUNAR OUTPOST'},
  {id:'crystal',name:'CRYSTAL CAVERNS'},
  {id:'foundry',name:'VOLCANIC FOUNDRY'},
  {id:'derelict',name:'DERELICT STARSHIP'},
  {id:'ice',name:'COMET ICE CANYON'},
  {id:'garden',name:'RINGWORLD GARDENS'},
  {id:'blackhole',name:'BLACK HOLE OBSERVATORY'},
  {id:'ruins',name:'ANCIENT ALIEN RUINS'},
  {id:'nebula-alt',name:'NEBULA - ALT'},
  {id:'meteor-alt',name:'METEOR - ALT'},
  {id:'lunar-alt',name:'LUNAR - ALT A'},
  {id:'lunar-alt2',name:'LUNAR - ALT B'}
 ];
 const ENEMY_INFO=[
  {id:'jett',name:'Jett Scroundrel',hp:1,speed:510,kind:'patrol',points:150},
  {id:'chip',name:'Chip Scurrio',hp:1,speed:465,kind:'patrol',points:175},
  {id:'kitty',name:'Kitty Xenovese',hp:3,speed:410,kind:'chase',points:400}
 ];
 let cols=11,rows=15,tile=26,grid=[],itemAt=new Map(),cells=[],entities=[],player=null,exitPos=null,warpPoints=[],warpCooldown=0;
 let scene='nebula',enemyShots=[],running=false,phase='start',score=0,ammo=0,lives=3,got=0,target=18,deadCount=0,protectedUntil=0,slowUntil=0,shakeUntil=0;
 let lastTick=0,loopId=0,nextMoveAt=0,lastFacing='right',wantFacing='right',level=1,touchStart=null;
 let heldDir=null,pendingStep=false,pendingUntil=0,pausedAt=0,sessionId=0,aimPreview=null;
 const pressedKeys=new Map(),STEP_MS=190;
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
  if(player){position(player);for(const ent of entities)position(ent);positionExit();positionShield();for(const shot of enemyShots)positionEnemyShot(shot);}
 }
 function position(obj){
  if(!obj?.el)return;
  // Center visible artwork on the hitbox tile. At the edge, gently scale it
  // instead of shifting the ship into an unrelated firing lane.
  const dims=obj===player?[4.05,2.87]:obj.id==='jett'?[1.8225,1.6125]:
    obj.id==='chip'?[2.55,2.13]:[2.55,1.95];
  const cx=(obj.x+.5)*tile,cy=(obj.y+.5)*tile;
  const desiredW=tile*dims[0],desiredH=tile*dims[1];
  const roomX=Math.max(tile,2*Math.min(cx,cols*tile-cx)-tile*.12);
  const roomY=Math.max(tile,2*Math.min(cy,rows*tile-cy)-tile*.12);
  const scale=Math.min(1,roomX/desiredW,roomY/desiredH);
  const px=desiredW*scale,py=desiredH*scale;
  const x=cx-px/2,y=cy-py/2;
  obj.el.style.width=px+'px';obj.el.style.height=py+'px';
  obj.visualBounds={x,y,width:px,height:py};
  obj.el.style.transform=`translate3d(${x}px,${y}px,0)`;
  const art=obj.el.spriteArt;
  if(art){
    const dir=obj===player?lastFacing:obj.lastDir||'right';
    art.style.setProperty('--flip',dir==='left'?-1:1);
    art.style.setProperty('--bank',dir==='up'?'-5deg':dir==='down'?'4deg':'0deg');
  }
 }
 function movementArt(dir,turn=false){
  // The original three-quarter cruising craft is Rosie's canonical navigation pose.
  // Rear/front art is reserved for later dedicated sequences; never cycle it during ordinary travel.
  if(turn&&(dir==='left'||dir==='right'))return dir==='left'?'rosie-bank-left':'rosie-bank-right';
  if(dir==='up')return 'rosie-up';
  if(player.straightSteps>=5&&dir==='right')return 'rosie-boost';
  return 'rosie-cruise';
 }
 function playerPose(dir,turn,now){
  if(!player||now<(player.actionUntil||0))return;
  const evasive=turn&&entities.some(e=>!e.killed&&dist(e,player)<=3);
  const state=evasive?'rosie-dodge':movementArt(dir,turn);
  setSprite(player,state);
  if(turn&&(dir==='left'||dir==='right')){
   const playId=sessionId,stamp=now;
   setTimeout(()=>{
    if(playId===sessionId&&player&&phase==='playing'&&
       player.lastMoveAt===stamp&&performance.now()>=(player.actionUntil||0)){
      setSprite(player,'rosie-cruise');
    }
   },230);
  }
 }
 function playAttackPose(type){
  const sid=sessionId,attackToken=(player.attackToken||0)+1;
  player.attackToken=attackToken;
  player.actionUntil=performance.now()+460;
  setSprite(player,type==='laser'?'rosie-laser':'rosie-rocket');
  setTimeout(()=>{
   if(sid===sessionId&&player&&phase==='playing'&&player.attackToken===attackToken){
    player.actionUntil=0;setSprite(player,movementArt(lastFacing,false));
   }
  },470);
 }
 function setSprite(obj,name){
  const art=obj?.el?.spriteArt;
  if(art&&art.dataset.asset!==name){art.src=asset(name);art.dataset.asset=name;}
 }
 function positionExit(){const el=$('cosmic-exit');if(el){el.style.width=tile*1.5+'px';el.style.height=tile*1.4+'px';el.style.left=((exitPos.x+.5)*tile-tile*.75)+'px';el.style.top=((exitPos.y+.5)*tile-tile*.7)+'px';}}
 function positionShield(now=performance.now()){
  const el=$('cosmic-shield');
  if(!player||!el)return;
  const active=phase==='playing'&&now<protectedUntil;
  const box=player.visualBounds;
  if(!box)return;
  // The oversized ship is clamped at maze edges; its shield must follow the rendered
  // ship, not the unclamped logical grid cell. Place the ring over its painted hull.
  // Keep the bubble wide enough for the ship, but use an elliptical profile so
  // its top and bottom are not severed near the maze's outer rows.
  const bubbleWidth=tile*4.08,bubbleHeight=tile*3.10;
  const cx=box.x+box.width*.49,cy=box.y+box.height*.51;
  el.style.width=bubbleWidth+'px';el.style.height=bubbleHeight+'px';
  el.style.left=(cx-bubbleWidth/2)+'px';
  el.style.top=(cy-bubbleHeight/2)+'px';
  el.classList.toggle('active',active);
 }
 function changeScene(next){
  const item=SCENES.find(o=>o.id===next)||SCENES[0];scene=item.id;
  board.dataset.scene=item.id;
  board.dataset.material=PARTITION_MATERIAL[item.id]||'deco';
  const app=$('cosmic-app');if(app)app.dataset.scene=item.id;
  const label=$('scene-name');if(label)label.textContent=item.name.split(' ')[0];
  const stage=LEVELS[level-1];
  $('level').textContent=`LEVEL ${level} / ${LEVELS.length} · ${stage.name}`;
  const kicker=$('stage-kicker');if(kicker)kicker.textContent=`THE HOUSE OF ROSIE · LEVEL ${level} / ${LEVELS.length} · ${stage.name}`;
  const alt=$('scene-description');if(alt)alt.textContent=`SCENERY: ${item.name}`;
 }
 function popup(text,p){const el=document.createElement('div');el.className='popup-message';el.textContent=text;el.style.left=`${(p.x+.2)*tile}px`;el.style.top=`${(p.y-.1)*tile}px`;board.append(el);setTimeout(()=>el.remove(),990);}
 function effect(type,p,size=1){const el=document.createElement('span');el.className=`effect ${type}`;el.style.left=((p.x+.5)*tile)+'px';el.style.top=((p.y+.5)*tile)+'px';el.style.width=(tile*size)+'px';el.style.height=(tile*size)+'px';if(type==='explosion')el.innerHTML=`<img src="${asset('explosion')}" alt="">`;board.append(el);setTimeout(()=>el.remove(),type==='explosion'?700:440);}
 function sound(freq=480,duration=.07,shape='sine'){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!sound.context)sound.context=new C();const ctx=sound.context,o=ctx.createOscillator(),g=ctx.createGain();o.type=shape;o.frequency.value=freq;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);}catch{}}
 function say(text){message.textContent=text;}
 function ui(){ const stageBadge=$('stage-badge');if(stageBadge)stageBadge.textContent=`${level} / ${LEVELS.length}`; $('score').textContent=String(score).padStart(5,'0');$('ammo').innerHTML=`${ammo} <i>/ 8</i>`;$('lives').innerHTML=lives?Array.from({length:lives},()=>`<img class="life-icon" src="${asset('life')}" alt="♥">`).join(''):'—';$('gathered').textContent=`${Math.min(got,target)} / ${target}`;$('fiends-left').textContent=3-deadCount;$('laser').disabled=ammo<1||phase!=='playing';$('rocket').disabled=ammo<2||phase!=='playing';}
 function addSprite(name,x,y,css){
  const el=document.createElement('div');el.className=`sprite ${css}`;el.setAttribute('aria-hidden','true');
  const art=document.createElement('img');art.src=asset(name);art.alt='';art.draggable=false;art.className='sprite-art';art.dataset.asset=name;
  el.spriteArt=art;el.append(art);board.append(el);return el;
 }
 function addPickup(x,y,kind){
  if(!open(x,y)||itemAt.has(key(x,y)))return;
  const el=kind==='treat'||kind==='bone'?document.createElement('span'):document.createElement('img');
  el.className='pickup '+kind;el.setAttribute('aria-hidden','true');
  const images={rocket:'rocket-pickup',shield:'shield-pickup',cheese:'cheese',
    crate:'supply-crate',repair:'repair-station',gravity:'gravity-pad',mine:'mine-plasma',wormhole:'wormhole'};
  if(el.tagName==='IMG')el.src=asset(images[kind]||'cheese');
  cells[y][x].append(el);itemAt.set(key(x,y),{kind,el});
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
  // New independent gameplay props, only on unobstructed maze floor cells.
  if(special[11])addPickup(special[11].x,special[11].y,'crate');
  if(special[12])addPickup(special[12].x,special[12].y,'repair');
  if(level>=2&&special[13])addPickup(special[13].x,special[13].y,'gravity');
  if(level>=2)special.slice(14,Math.min(14+Math.min(3,Math.floor(level/3)+1),special.length)).forEach(p=>addPickup(p.x,p.y,'mine'));
  if(level>=4){
    const p1=special[18],p2=special[19];
    if(p1&&p2){warpPoints=[p1,p2];addPickup(p1.x,p1.y,'wormhole');addPickup(p2.x,p2.y,'wormhole');}
  }
 }
 const PARTITION_MATERIAL={
   nebula:'deco',meteor:'foundry',lunar:'lunar',crystal:'crystal',foundry:'foundry',
   derelict:'void',ice:'lunar',garden:'verdant',blackhole:'void',ruins:'crystal',
   'nebula-alt':'deco','meteor-alt':'foundry','lunar-alt':'lunar','lunar-alt2':'lunar'
 };
 function wallConnectivity(x,y){
   return ((y>0&&grid[y-1][x]===1)?1:0)
       | ((x<cols-1&&grid[y][x+1]===1)?2:0)
       | ((y<rows-1&&grid[y+1][x]===1)?4:0)
       | ((x>0&&grid[y][x-1]===1)?8:0);
 }
 function createBoard(){
   board.innerHTML='';itemAt.clear();cells=[];
   board.dataset.material=PARTITION_MATERIAL[LEVELS[level-1].scene]||'deco';
   for(let y=0;y<rows;y++){
     const row=[];
     for(let x=0;x<cols;x++){
       const cell=document.createElement('div'),isWall=grid[y][x]===1;
       cell.className='cell '+(isWall?'wall partition-wall':'floor');
       if(isWall){
         const mask=wallConnectivity(x,y);
         cell.dataset.partition=String(mask);
         cell.style.setProperty('--partition-x',((mask%4)*100/3)+'%');
         cell.style.setProperty('--partition-y',(Math.floor(mask/4)*100/3)+'%');
       }
       board.append(cell);row.push(cell);
     }
     cells.push(row);
   }
   const e=document.createElement('img');e.id='cosmic-exit';e.className='exit locked';
   e.src=asset('cosmic-exit-new');e.alt='Exit portal';board.append(e);positionExit();
 }
 function placeLaunchArt(p,kind){
  const cell=cells[p.y]?.[p.x];if(!cell)return;
  const img=document.createElement('img');
  img.className='launch-art launch-'+kind;
  img.src=asset(({jett:'spawn-jett',chip:'spawn-chip',kitty:'spawn-kitty',rosie:'gravity-pad'})[kind]||'fiend-spawn');img.alt='';img.draggable=false;
  img.setAttribute('aria-hidden','true');cell.append(img);
 }
 function dismissLaunchPads(){
   const sid=sessionId,launchCells=[];
   for(const row of cells)for(const cell of row){
     if(!cell.classList.contains('captain-launch-pad')&&!cell.classList.contains('fiend-launch-pad'))continue;
     launchCells.push(cell);cell.classList.add('launch-fading');
   }
   setTimeout(()=>{
     if(sessionId!==sid)return;
     for(const cell of launchCells){
       for(const child of Array.from(cell.children)){
         if(child.classList?.contains('launch-art'))child.remove();
       }
       cell.classList.remove('launch-fading','captain-launch-pad','fiend-launch-pad',
         'kitty-hangar','chip-hangar','jett-hangar');
     }
   },820);
 }
 const DECOR={
  nebula:['beacon','reactor-cyan'],meteor:['hazard-molten','meteor-flame','debris-satellite'],
  lunar:['mining-drill','reactor-cyan','barrier-cyan'],crystal:['obstacle-crystal','turret-prism'],
  foundry:['hazard-molten','reactor-cyan','hazard-gate','mining-drill'],
  derelict:['debris-satellite','sentry-gold','barrier-cyan'],
  ice:['obstacle-crystal','barrier-cyan','beacon'],
  garden:['beacon','reactor-cyan'],blackhole:['turret-prism','sentry-gold','reactor-cyan'],
  ruins:['obstacle-crystal','beacon','hazard-gate']
 };
 function decorateEnvironment(seed){
  const art=DECOR[LEVELS[level-1].scene]||[];
  if(!art.length)return;
  const rnd=rand(seed+9021),spots=[];
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
    if(grid[y][x]!==1||dist({x,y},player.spawn)<3||dist({x,y},exitPos)<2)continue;
    if(entities.some(e=>dist({x,y},e.spawn)<2))continue;
    spots.push({x,y});
  }
  spots.sort(()=>rnd()-.5);
  const count=Math.min(spots.length,Math.max(2,Math.floor(cols*rows/75)));
  for(let i=0;i<count;i++){
    const p=spots[i],img=document.createElement('img');
    img.className='environment-prop';img.src=asset(art[i%art.length]);
    img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');
    img.style.setProperty('--prop-turn',((i%4)*90)+'deg');
    cells[p.y][p.x].append(img);
  }
 }
 function enter(status,text,buttonText){
  if(status==='paused')pausedAt=performance.now();
  phase=status;running=false;heldDir=null;pressedKeys.clear();pendingStep=false;
  if(aimPreview?.el)aimPreview.el.classList.remove('targetable');aimPreview=null;
  veil.classList.remove('hidden');
  $('veil-title').textContent=status==='win'?'ODYSSEY COMPLETE':
    status==='level-clear'?LEVELS[level-1].name+' CLEARED':
    status==='lose'?'MISSION FAILED':
    status==='paused'?'MISSION PAUSED':'COSMIC ODYSSEY';
  const title=$('mission-crest');if(title)title.textContent=status==='level-clear'?
    `✦ STAGE ${level+1} UNLOCKED · ${LEVELS[level]?.name||'ODYSSEY'} ✦`:
    `✦ LEVEL ${level} / ${LEVELS.length} · ${LEVELS[level-1].tagline} ✦`;
  $('veil-msg').textContent=text;$('start').textContent=buttonText;
  const select=$('stage-select'),picker=document.querySelector('.mission-level-picker');
  if(select&&status==='level-clear')select.value=String(Math.min(level+1,LEVELS.length));
  else if(select&&status==='lose')select.value=String(level);
  else if(select&&status==='win')select.value='1';
  if(picker)picker.style.display=(status==='paused'||status==='level-clear')?'none':'flex';
  ui();
 }
 function init(carry=false){const desktop=innerWidth>=760&&innerWidth>innerHeight;cols=desktop?17:11;rows=desktop?11:15;
  if(!carry){score=0;ammo=0;lives=3;}
  target=LEVELS[level-1].target;got=0;deadCount=0;enemyShots=[];warpPoints=[];warpCooldown=0;aimPreview=null;lastFacing='right';wantFacing='right';protectedUntil=0;slowUntil=0;lastTick=0;nextMoveAt=0;heldDir=null;pendingStep=false;pendingUntil=0;pressedKeys.clear();sessionId++;entities=[];player=null;
  maze(LEVELS[level-1].seed+level*19+cols);const cy=rows-2,cx=(Math.floor(cols/2)|1);const spawn=nearestOpen({x:cx,y:cy});exitPos=nearestOpen({x:cx,y:1});
  const spots=[{x:1,y:1},{x:cols-2,y:1},{x:cols-2,y:rows-4}].map(nearestOpen);
  player={x:spawn.x,y:spawn.y,spawn,straightSteps:0,actionUntil:0,attackToken:0,lastMoveAt:0};entities=ENEMY_INFO.map((a,i)=>({...a,speed:Math.round(a.speed*LEVELS[level-1].speed),spawn:spots[i],x:spots[i].x,y:spots[i].y,health:a.hp,next:0,until:0,patrolIndex:0,hits:0,killed:false,el:null}));
  createBoard();
  // Reuse the existing decorative circuitry to identify launch and Fiend hangars.
  cells[spawn.y][spawn.x].classList.add('captain-launch-pad');
  spots.forEach((p,i)=>cells[p.y][p.x].classList.add('fiend-launch-pad',i===2?'kitty-hangar':i===1?'chip-hangar':'jett-hangar'));
  placeLaunchArt(spawn,'rosie');
  spots.forEach((p,i)=>placeLaunchArt(p,['jett','chip','kitty'][i]));
  decorateEnvironment(3700+level*227);
  player.el=addSprite('rosie-cruise',player.x,player.y,'rosie');
  for(const e of entities)e.el=addSprite(e.id,e.x,e.y,'fiend '+e.id);
  populate(310+level*37);const patrols=[[],[]];for(const [i,e] of entities.entries()){
   if(i===2)continue;const nearby=[...itemAt.keys()].filter(k=>itemAt.get(k).kind==='treat').map(k=>{const[x,y]=k.split(',').map(Number);return{x,y};}).filter(p=>dist(p,e.spawn)<Math.max(9,cols*.7));
   nearby.sort((a,b)=>Math.atan2(a.y-e.y,a.x-e.x)-Math.atan2(b.y-e.y,b.x-e.x));
   const picks=nearby.filter((p,j)=>j%Math.max(1,Math.floor(nearby.length/5))===0).slice(0,5);
   e.patrol=picks.length?picks:[e.spawn,player.spawn];if(i===1)e.patrol.reverse();
  }
  const aura=document.createElement('img');aura.id='cosmic-shield';aura.className='shield-aura';aura.src=asset('shield');aura.alt='';aura.draggable=false;board.append(aura);
  changeScene(LEVELS[level-1].scene);resize();for(const e of entities)position(e);position(player);positionShield();ui();}
 function start(){
  if(phase==='paused'){
    const delta=performance.now()-pausedAt;protectedUntil+=delta;slowUntil+=delta;
    for(const e of entities){e.next+=delta;if(e.nextAttack)e.nextAttack+=delta;}for(const shot of enemyShots)shot.stepAt+=delta;
    nextMoveAt=performance.now();phase='playing';running=true;veil.classList.add('hidden');
    positionShield();say('Resume course.');return;
  }
  const carry=phase==='level-clear'&&level<LEVELS.length;
  const chosen=Number($('stage-select')?.value||1);
  level=carry?level+1:Math.max(1,Math.min(LEVELS.length,Number.isFinite(chosen)?chosen:1));
  init(carry);
  phase='playing';running=true;
  protectedUntil=performance.now()+2200;
  veil.classList.add('hidden');positionShield();dismissLaunchPads();
  say(`${LEVELS[level-1].name}! Collect biscuits, defeat the Fiends, and escape.`);
  sound(carry?880:670,.17);ui();
 }
 function pause(){if(phase==='playing')enter('paused','Your mission is safely paused. Resume whenever ready.','RESUME MISSION');else if(phase==='paused')start();}
 function pick(){
  const k=key(player.x,player.y),item=itemAt.get(k);if(!item)return;
  const now=performance.now(),p={x:player.x,y:player.y};
  if(item.kind!=='wormhole'){itemAt.delete(k);item.el.remove();}
  switch(item.kind){
   case'treat':got++;ammo=Math.min(8,ammo+1);score+=10;sound(720,.045);break;
   case'cheese':ammo=Math.min(8,ammo+2);score+=50;slowUntil=now+5200;popup('CHEESE +2',p);sound(960,.14);break;
   case'bone':ammo=Math.min(8,ammo+3);score+=75;protectedUntil=now+3900;popup('GOLDEN BONE +3',p);sound(1120,.16);break;
   case'rocket':ammo=Math.min(8,ammo+2);score+=25;popup('ROCKET +2',p);sound(840,.1);break;
   case'shield':protectedUntil=now+5500;popup('SHIELD!',p);sound(930,.13);break;
   case'crate':ammo=Math.min(8,ammo+3);score+=50;effect('spark',p,1.3);popup('SUPPLIES +3',p);sound(840,.14);break;
   case'repair':
     if(lives<3){lives++;popup('HULL REPAIRED',p);}
     else{protectedUntil=Math.max(protectedUntil,now+2600);popup('REPAIR SHIELD',p);}
     score+=60;effect('spark',p,1.6);sound(910,.16);break;
   case'gravity':
     protectedUntil=Math.max(protectedUntil,now+4200);ammo=Math.min(8,ammo+1);
     effect('spark',p,1.4);popup('GRAVITY BOOST!',p);sound(1100,.2);break;
   case'mine':
     effect('explosion',p,2.3);sound(150,.21,'sawtooth');
     if(now<protectedUntil)popup('MINE SHIELDED',p);
     else damage({name:'a plasma mine'});
     break;
   case'wormhole':
     if(now<warpCooldown||warpPoints.length!==2)break;
     const destination=warpPoints.find(o=>o.x!==p.x||o.y!==p.y);
     if(destination){
       warpCooldown=now+1200;protectedUntil=Math.max(protectedUntil,now+1250);
       effect('spark',p,2);
       player.x=destination.x;player.y=destination.y;
       position(player);positionShield();effect('spark',destination,2);
       popup('WORMHOLE!',destination);score+=20;sound(760,.16);
     }
     break;
  }
  ui();positionShield();
  if(got>=target&&deadCount===3){
    $('cosmic-exit').classList.remove('locked');
    $('cosmic-exit').classList.add('open');
    say(level<LEVELS.length?`Portal open! Next: ${LEVELS[level].name}.`:'Final portal open!');
  }
 }
 // One controller owns all movement. A quick tap moves one tile; holding a key/pad repeats at STEP_MS.
 function canStep(dir){const v=DIRS[dir];return !!v&&open(player.x+v[0],player.y+v[1]);}
 function advance(now,requested=wantFacing){
  if(phase!=='playing'||now<nextMoveAt)return false;
  let dir=requested;
  // Turn buffering: keep gliding forward when a requested turn becomes available farther ahead.
  if(!canStep(dir)){
    if(heldDir&&dir!==lastFacing&&canStep(lastFacing))dir=lastFacing;
    else return false;
  }
  const vec=DIRS[dir],nx=player.x+vec[0],ny=player.y+vec[1];
  if(!open(nx,ny))return false;
  const changedDirection=lastFacing!==dir;
  player.straightSteps=changedDirection?0:(player.straightSteps||0)+1;
  nextMoveAt=now+STEP_MS;lastFacing=dir;
  player.x=nx;player.y=ny;player.lastMoveAt=now;
  playerPose(dir,changedDirection,now);
  position(player);positionShield();pick();collide();checkPlayerShots(performance.now());updateAimPreview();
  if(player.x===exitPos.x&&player.y===exitPos.y){
    if(got>=target&&deadCount===3){completeLevel();}
    else say(`Portal locked: ${Math.max(0,target-got)} biscuits and ${3-deadCount} Fiends remaining.`);
  }
  return true;
 }
 function completeLevel(){
  if(level<LEVELS.length){
    score+=650;enter('level-clear',`${LEVELS[level-1].name} cleared! Hull, charge, and score carry forward to ${LEVELS[level].name}. Prepare for a new environment.`,`ENTER ${LEVELS[level].name}`);
  }else{
    score+=1500;enter('win','Ten cosmic sectors secured! Captain Rosie defeated the Fiends and completed the Odyssey.','PLAY AGAIN');
  }
  sound(1400,.35);ui();
 }
 function requestMove(dir){
  if(phase!=='playing'||!DIRS[dir])return;
  const now=performance.now();wantFacing=dir;pendingStep=true;pendingUntil=now+Math.max(400,STEP_MS*2);
  if(advance(now,dir))pendingStep=false;
 }
 function damage(e){const now=performance.now();if(now<protectedUntil)return;protectedUntil=now+2300;positionShield(now);lives--;player.attackToken=(player.attackToken||0)+1;player.actionUntil=now+610;setSprite(player,'rosie-damage');const hurtSession=sessionId;setTimeout(()=>{if(hurtSession===sessionId&&player){player.actionUntil=0;setSprite(player,movementArt(lastFacing,false));}},570);player.el.classList.add('hurt');setTimeout(()=>player?.el?.classList.remove('hurt'),800);effect('spark',player,2.5);sound(140,.24,'sawtooth');popup('-1 HULL',player);if(!lives){enter('lose',`Rosie collected ${got} biscuits and defeated ${deadCount} Fiends. Try a different route and keep your ammunition for Kitty.`,'RETRY MISSION');return;}
  const sp=player.spawn;player.x=sp.x;player.y=sp.y;position(player);positionShield();say(`Collision with ${e.name}! Briefly invulnerable.`);ui();}
 function collide(){for(const e of entities)if(!e.killed&&e.health>0&&e.x===player.x&&e.y===player.y){damage(e);break;}}
 function forwardRay(origin,facing){
  // Strict cardinal corridor: no diagonal snapping, wall penetration or corner shots.
  const [dx,dy]=DIRS[facing]||DIRS.right;
  let x=origin.x,y=origin.y;const tiles=[];
  for(let i=0;i<Math.max(cols,rows);i++){
    x+=dx;y+=dy;
    if(!open(x,y))break;
    tiles.push({x,y});
  }
  const enemy=tiles.map(p=>entities.find(e=>!e.killed&&e.health>0&&e.x===p.x&&e.y===p.y)).find(Boolean)||null;
  return {tiles,enemy,impact:enemy?{x:enemy.x,y:enemy.y}:tiles.at(-1)||{x:origin.x,y:origin.y}};
 }
 function acquireDirectionalTarget(origin,facing){return forwardRay(origin,facing).enemy;}
 function updateAimPreview(){
  const target=phase==='playing'&&ammo>0&&player?acquireDirectionalTarget(player,lastFacing):null;
  if(aimPreview!==target){
    if(aimPreview?.el)aimPreview.el.classList.remove('targetable');
    aimPreview=target;
    if(target?.el)target.el.classList.add('targetable');
  }
  const el=$('aim-indicator');
  if(el){
    el.textContent=target?`LOCK: ${target.name.split(' ')[0].toUpperCase()}`:`AIM: ${lastFacing.toUpperCase()}`;
    el.classList.toggle('locked',!!target);
  }
 }
 function fire(type){
  if(phase!=='playing')return;
  const cost=type==='laser'?1:2;
  if(ammo<cost){say(`Need ${cost} treat${cost>1?'s':''} to fire ${type}.`);sound(180,.04);return;}
  const origin={x:player.x,y:player.y};
  const shot=forwardRay(origin,lastFacing);
  if(!shot.tiles.length){
    say('A wall blocks the firing lane. Turn toward an open corridor.');
    sound(180,.045);return;
  }
  ammo-=cost;ui();playAttackPose(type);
  const {enemy:victim,impact}=shot;
  const fireAngle=lastFacing==='left'?180:lastFacing==='up'?-90:lastFacing==='down'?90:0;
  const travelTiles=dist(origin,impact);
  if(victim)say(`${type==='laser'?'Laser':'Rocket'} locked: ${victim.name}`);
  else say(`${type==='laser'?'Laser':'Rocket'} fired ${lastFacing}. No Fiend in the firing lane.`);
  if(victim){
    const shotSession=sessionId;
    victim.el.classList.add('auto-locked');
    setTimeout(()=>{if(sessionId===shotSession)victim.el?.classList.remove('auto-locked');},330);
  }
  effect('muzzle',origin,1.7);
  if(type==='laser'){
    // The independent original red bolt asset is drawn on top of the laser beam.
    const bolt=document.createElement('img');bolt.className='laser-bolt-projectile';
    bolt.src=asset('laser-bolt');bolt.alt='';bolt.draggable=false;
    const span=Math.max(tile*.7,travelTiles*tile);
    bolt.style.width=span+'px';bolt.style.height=tile*1.1+'px';
    bolt.style.left=((origin.x+.5)*tile)+'px';
    bolt.style.top=((origin.y+.5)*tile-tile*.55)+'px';
    bolt.style.transformOrigin='0 50%';
    bolt.style.transform=`rotate(${fireAngle}deg)`;
    board.append(bolt);setTimeout(()=>bolt.remove(),225);
    effect('beam',origin,1);
    const beam=board.lastChild;
    const distance=Math.max(tile*.65,travelTiles*tile);
    beam.style.left=((origin.x+.5)*tile)+'px';
    beam.style.width=distance+'px';
    const beamHeight=Math.max(4,tile*.095);
    beam.style.top=((origin.y+.5)*tile-beamHeight/2)+'px';
    beam.style.height=beamHeight+'px';
    beam.style.transformOrigin='0 50%';
    beam.style.transform=`rotate(${fireAngle}deg)`;
    sound(680,.13,'sawtooth');
    if(victim)hit(victim,1);else effect('spark',impact,1.2);
  }else{
    sound(320,.18,'sawtooth');
    const rocket=document.createElement('span');rocket.className='rocket-projectile';
    rocket.innerHTML=`<img src="${asset('rosie-projectile')}" alt="" draggable="false">`;
    const size=tile*2.25,angle=fireAngle,ms=Math.min(900,Math.max(180,travelTiles*92));
    rocket.style.width=size+'px';rocket.style.height=size*.78+'px';
    rocket.style.left=((origin.x+.5)*tile)+'px';rocket.style.top=((origin.y+.5)*tile)+'px';
    rocket.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
    board.append(rocket);
    requestAnimationFrame(()=>{
      rocket.style.transition=`left ${ms}ms linear,top ${ms}ms linear`;
      rocket.style.left=((impact.x+.5)*tile)+'px';
      rocket.style.top=((impact.y+.5)*tile)+'px';
    });
    const firedSession=sessionId;
    setTimeout(()=>{
      rocket.remove();if(phase!=='playing'||firedSession!==sessionId)return;
      effect('explosion',impact,3.7);effect('spark',impact,2);
      const targets=entities.filter(e=>!e.killed&&e.health>0&&dist(e,impact)<=1);
      targets.forEach(e=>hit(e,2));if(!targets.length)popup('BOOM!',impact);
      sound(130,.21,'sawtooth');
    },ms+45);
  }
  updateAimPreview();
 }
 function hit(e,power){
  if(e.killed)return;
  e.health=Math.max(0,e.health-power);
  e.el.classList.add('hurt');setTimeout(()=>e.el?.classList.remove('hurt'),260);
  effect('spark',e,2.2);sound(360,.09,'square');
  if(e.health<=0){
    e.killed=true;deadCount++;score+=e.points;
    // Actual standalone defeat art - Jett's failing jetpack, Chip's stunned UFO, Kitty's smoke-filled retreat.
    setSprite(e,e.id==='jett'?'jett-retreat':e.id==='kitty'?'kitty-retreat':'chip-stun');
    e.el.classList.add('defeated','defeat-'+e.id);
    effect('explosion',e,e.id==='kitty'?2.4:1.85);
    setTimeout(()=>e.el?.remove(),1450);
    popup(`+${e.points} ${e.name.split(' ')[0]} DOWN`,e);
    say(`${e.name} defeated! ${3-deadCount} Fiends remain.`);
  }else{
    setSprite(e,e.id==='chip'?'chip-stun':e.id+'-attack');
    const hurtId=sessionId;setTimeout(()=>{if(hurtId===sessionId&&!e.killed)setSprite(e,e.id);},460);
    popup(`${e.name.split(' ')[0]} ♥${e.health}`,e);
    say(`${e.name} - ${e.health} HP left.`);
  }
  if(got>=target&&deadCount===3){$('cosmic-exit').classList.remove('locked');$('cosmic-exit').classList.add('open');say(level<LEVELS.length?`Portal open! Next: ${LEVELS[level].name}.`:'Final portal unlocked - finish the Odyssey!');}
  ui();
 }
 function positionEnemyShot(shot){
 if(!shot.el)return;
 const w=tile*(shot.owner==='chip'?1.42:.92),h=tile*(shot.owner==='chip'?1.05:.50);
 shot.el.style.width=w+'px';shot.el.style.height=h+'px';
 shot.el.style.left=((shot.x+.5)*tile-w/2)+'px';
 shot.el.style.top=((shot.y+.5)*tile-h/2)+'px';
 const angle=shot.dir==='left'?180:shot.dir==='up'?-90:shot.dir==='down'?90:0;
 shot.el.style.transform=`rotate(${angle}deg)`;
}
 function removeEnemyShot(shot){
 shot.el?.remove();
 const i=enemyShots.indexOf(shot);if(i>=0)enemyShots.splice(i,1);
}
 function spawnEnemyShot(e,dir,now){
 if(phase!=='playing'||e.killed)return;
 const id=e.id,el=id==='chip'?document.createElement('img'):document.createElement('span');
 if(id==='chip')el.src=asset('chip-bolt');
 el.className=`enemy-bolt enemy-bolt-${id}`;
 el.setAttribute('aria-hidden','true');
 const shot={owner:id,source:e,dir,x:e.x,y:e.y,el,stepAt:now+145,remaining:id==='kitty'?6:5};
 board.append(el);enemyShots.push(shot);positionEnemyShot(shot);
 setSprite(e,id==='chip'?'chip-fire':id+'-attack');
 e.until=now+490;
 e.nextAttack=now+(id==='chip'?3150:id==='kitty'?3750:4250);
}
 function maybeFiendAttack(e,now){
 if(now<(e.nextAttack||0)||e.killed||dist(e,player)>6)return;
 let dir=null;
 if(e.x===player.x)dir=player.y>e.y?'down':'up';
 else if(e.y===player.y)dir=player.x>e.x?'right':'left';
 if(!dir)return;
 const [dx,dy]=DIRS[dir];let x=e.x,y=e.y;
 for(let n=0;n<dist(e,player);n++){x+=dx;y+=dy;if(!open(x,y))return;}
 spawnEnemyShot(e,dir,now);
}
 function updateEnemyShots(now){
 for(const shot of [...enemyShots]){
  if(now<shot.stepAt)continue;
  shot.stepAt=now+(shot.owner==='kitty'?125:155);
  const [dx,dy]=DIRS[shot.dir],x=shot.x+dx,y=shot.y+dy;
  if(!open(x,y)||shot.remaining<=0){removeEnemyShot(shot);continue;}
  shot.x=x;shot.y=y;shot.remaining--;positionEnemyShot(shot);
  if(player.x===x&&player.y===y){
   if(now<protectedUntil){effect('spark',player,1.5);popup('SHIELDED!',player);}
   else damage(shot.source);
   removeEnemyShot(shot);
  }
 }
}
 function checkPlayerShots(now){
 if(phase!=='playing')return;
 for(const shot of [...enemyShots]){
  if(shot.x!==player.x||shot.y!==player.y)continue;
  if(now<protectedUntil){effect('spark',player,1.3);popup('SHIELDED!',player);}
  else damage(shot.source);
  removeEnemyShot(shot);
 }
}
 function moveFiend(e,now){if(e.killed)return;if(now<e.next)return;let interval=e.speed;if(now<slowUntil)interval*=2.1;if(e.id==='chip'&&Math.floor(now/2600)%2===0)interval*=.62;e.next=now+interval;
  let goal=null;if(e.kind==='chase')goal=player;
  else{let patrol=e.patrol||[];goal=patrol[e.patrolIndex%patrol.length]||player;if(goal.x===e.x&&goal.y===e.y){e.patrolIndex++;goal=patrol[e.patrolIndex%patrol.length]||player;}
   // Patrol enemies occasionally break their loops to defend nearby treats.
   if(dist(e,player)<4&&Math.floor(now/4700)%3===0)goal=player;
  }
  let direction=bfs(e,goal);if(!direction){const n=neighbors(e);if(n.length)direction=n[Math.floor(Math.random()*n.length)].dir;}
  if(direction){
    const changedDirection=e.lastDir&&e.lastDir!==direction;
    e.x+=DIRS[direction][0];e.y+=DIRS[direction][1];e.lastDir=direction;
    e.el.style.setProperty('--step-ms',Math.min(330,Math.max(175,interval*.7))+'ms');
    if(dist(e,player)<3&&Math.floor(now/700)%3===0){
      setSprite(e,e.id==='chip'?'chip-fire':e.id+'-attack');e.until=now+420;
    }else if(now>e.until){
      if(e.id==='chip'){
        const sprite=interval<330?'chip-dash':
          direction==='up'?'chip-ascent':
          direction==='down'?'chip-rear':
          changedDirection?'chip-turn':'chip';
        setSprite(e,sprite);
      }else setSprite(e,e.id);
    }
    position(e);collide();
  }
  maybeFiendAttack(e,now);
 }
 function tick(now){
  loopId=requestAnimationFrame(tick);if(phase!=='playing')return;lastTick=now;
  if(pendingStep&&now>pendingUntil)pendingStep=false;
  if(now>=nextMoveAt&&(pendingStep||heldDir)){
    const dir=pendingStep?wantFacing:heldDir;
    if(advance(now,dir))pendingStep=false;
  }
  for(const e of entities)moveFiend(e,now);
  updateEnemyShots(now);updateAimPreview();
  positionShield(now);
  player.el.style.opacity=now<protectedUntil&&Math.floor(now/220)%2===0?'.87':'1';
 }
 // A single continuous requestAnimationFrame loop rather than per-enemy timers.
 function controls(){
  const dirForKey=k=>({arrowup:'up',arrowright:'right',arrowdown:'down',arrowleft:'left',w:'up',a:'left',s:'down',d:'right'})[k.toLowerCase()];
  document.addEventListener('keydown',e=>{
    const dir=dirForKey(e.key);
    if(dir){
      e.preventDefault();
      const code=e.code||e.key;
      if(e.repeat||pressedKeys.has(code))return;
      pressedKeys.set(code,dir);heldDir=dir;requestMove(dir);return;
    }
    if(phase!=='playing')return;
    if(e.code==='Space'||e.key===' '){e.preventDefault();if(!e.repeat)fire('laser');}
    else if(e.key==='Enter'||e.code==='NumpadEnter'||e.key.toLowerCase()==='x'){e.preventDefault();if(!e.repeat)fire('rocket');}
    else if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();if(!e.repeat)pause();}
  });
  document.addEventListener('keyup',e=>{
    const dir=dirForKey(e.key);if(!dir)return;
    pressedKeys.delete(e.code||e.key);
    heldDir=[...pressedKeys.values()].at(-1)||null;
  });
  window.addEventListener('blur',()=>{heldDir=null;pendingStep=false;pressedKeys.clear();});
  document.querySelectorAll('.dpad button').forEach(btn=>{
    const dir=btn.dataset.dir;
    btn.addEventListener('pointerdown',ev=>{
      ev.preventDefault();btn.setPointerCapture?.(ev.pointerId);
      heldDir=dir;requestMove(dir);
    });
    const stop=()=>{if(heldDir===dir)heldDir=null;};
    btn.addEventListener('pointerup',stop);
    btn.addEventListener('pointercancel',stop);
    btn.addEventListener('lostpointercapture',stop);
    btn.addEventListener('click',ev=>{if(ev.detail===0)requestMove(dir);});
  });
  board.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  board.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  board.addEventListener('touchend',e=>{
    if(!touchStart||!e.changedTouches[0])return;
    const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<9)return;
    requestMove(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');
  },{passive:true});
  $('scene-toggle').addEventListener('click',()=>{
    const index=SCENES.findIndex(o=>o.id===scene);
    changeScene(SCENES[(index+1)%SCENES.length].id);
  });
  const stageSelect=$('stage-select');if(stageSelect){
    stageSelect.innerHTML=LEVELS.map((s,i)=>`<option value="${i+1}">${i+1}. ${s.name}</option>`).join('');
    stageSelect.value='1';
  }
  $('laser').addEventListener('click',()=>fire('laser'));
  $('rocket').addEventListener('click',()=>fire('rocket'));
  $('pause-top').addEventListener('click',pause);
  $('start').addEventListener('click',start);
  window.addEventListener('resize',()=>{if(phase==='start'&&!player){cols=innerWidth>=760&&innerWidth>innerHeight?17:11;rows=cols===17?11:15;init();}resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')pause();});
 }
 controls();init();enter('start','Explore ten distinct cosmic environments. Collect biscuits to power lasers (1 treat) and rockets (2 treats), defeat three Fiends, and reach the portal. Choose any stage below to playtest it directly.','LAUNCH MISSION');loopId=requestAnimationFrame(tick);
})();
