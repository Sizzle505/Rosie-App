import React, {useEffect, useRef, useState} from 'react';
import './EmberIntroCinematic.css';

/*
 * Captain Rosie / Ember Tunnel - image-sequence cinematic.
 * Drop `/public/ember-intro/` in the Vite public folder and this component in src.
 * Actual game craft MUST come from `/ember-drill/drill-body.webp`; never use the
 * previous concept-art red-cap tracked vehicle for the final gameplay handoff.
 *
 * Does not change the running game, physics, collisions, or input bindings.
 */
const ROOT = '/ember-intro';
const P2 = ROOT + '/phase2';
const P3 = ROOT + '/phase3';
const NEW = ROOT + '/new-assets';
const range = (count, fn) => Array.from({length:count},(_,i)=>fn(i+1));
const files = {
  park: `${NEW}/scenes/park-game-690x820.webp`,
  shaft: `${NEW}/scenes/shaft-game-690x820.webp`,
  cavern: `${NEW}/scenes/cavern-game-690x820.webp`,
  gameCraft: '/ember-drill/drill-body.webp', // existing actual game asset
  dig: range(8,n=>`${P3}/digging/rosie-dig-${String(n).padStart(2,'0')}.webp`),
  land: range(4,n=>`${P3}/landing/rosie-land-${String(n).padStart(2,'0')}.webp`),
  board: range(5,n=>`${P3}/boarding/rosie-board-${String(n).padStart(2,'0')}.webp`),
  holes: range(5,n=>`${P2}/ground/ember-hole-stage-${String(n).padStart(2,'0')}.png`),
  pebbles: `${P2}/particles/ember-falling-pebbles.png`,
  crumble: `${P2}/particles/ember-earth-crumble.png`,
  shadow: `${NEW}/ground/landing-contact-shadow.png`,
  landDust: range(6,n=>`${NEW}/ground/landing-dust-${String(n).padStart(2,'0')}.png`),
  steam: range(8,n=>`${NEW}/launch/ember-steam-${String(n).padStart(2,'0')}.png`),
  sparks: range(8,n=>`${NEW}/launch/ember-sparks-${String(n).padStart(2,'0')}.png`),
  drill: range(8,n=>`${NEW}/launch/ember-drill-${String(n).padStart(2,'0')}.png`),
};
const W = 690, H = 820, DURATION_MS = 18500;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const idx=(t,n,fps=8)=>Math.floor(t*fps)%n;

function drawObject(ctx,asset,cx,bottom,height,{opacity=1}={}) {
  if(!asset?.complete || !asset.naturalWidth) return;
  const w=height*asset.naturalWidth/asset.naturalHeight;
  ctx.save();ctx.globalAlpha=opacity;
  ctx.drawImage(asset,cx-w/2,bottom-height,w,height);ctx.restore();
}
function drawFX(ctx,asset,cx,cy,width,{opacity=1}={}) {
  if(!asset?.complete || !asset.naturalWidth) return;
  const h=width*asset.naturalHeight/asset.naturalWidth;
  ctx.save();ctx.globalAlpha=opacity;
  ctx.drawImage(asset,cx-width/2,cy-h/2,width,h);ctx.restore();
}
function drawScene(ctx,asset,{scale=1,x=0,y=0,opacity=1}={}){
  if(!asset?.naturalWidth)return;
  ctx.save();ctx.globalAlpha=opacity;
  const sw=W*scale,sh=H*scale;
  ctx.drawImage(asset,(W-sw)/2+x,(H-sh)/2+y,sw,sh);
  ctx.restore();
}
function drawMotes(ctx,t,{warm=false,dense=1}={}){
  // Canvas-native atmospheric movement keeps the scene alive without adding
  // heavyweight video assets or changing the game's runtime bundle.
  const colors=warm?["#ffd181","#ff8c47","#fff0b0"]:["#ffd9e4","#fff0d7","#f1c4cf"];
  const count=Math.round(22*dense);
  ctx.save();ctx.globalCompositeOperation="screen";
  for(let n=0;n<count;n++){
    const seed=n*71.73;
    const x=((seed*37+t*(warm?38:-16))%(W+90))-45;
    const y=((seed*19+t*(warm?83:27))%(H+80))-40;
    const r=1.4+(n%4)*.7;
    ctx.globalAlpha=.2+.16*Math.sin(t*2.2+n);
    ctx.fillStyle=colors[n%colors.length];ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function paint(ctx,images,ms){
  const i=key=>images[key];
  const s=ms/1000;
  ctx.clearRect(0,0,W,H);
  const alphaScene=(name,amount)=>{ctx.save();ctx.globalAlpha=clamp(amount);drawScene(ctx,i(name));ctx.restore();};
  if(s<5.3){
    drawScene(ctx,i('park'),{scale:1.035+.032*smooth(s/5.3),y:5*smooth(s/5.3)});
    drawMotes(ctx,s,{dense:1.25});
    if(s>=1.65)drawFX(ctx,i('holes'+clamp(Math.floor(smooth((s-1.65)/2.9)*5),0,4)),346,714,400+Math.floor((s-1.65)*23));
    const k=s<1.65?0:idx(s-1.65,8,7.5);
    const h=s>4.6?405*(1-.39*smooth((s-4.6)/.7)):405;
    drawObject(ctx,i('dig'+k),345,s>4.6?769+105*smooth((s-4.6)/.7):772,h);
    if(s>4.65)drawFX(ctx,i('crumble'),347,712,560,{opacity:smooth((s-4.65)/.25)});
  } else if(s<7.65){
    const p=(s-5.3)/2.35;
    drawScene(ctx,i('shaft'),{scale:1.02+.07*smooth(p),y:-20*p});
    if(p<.2)alphaScene('park',1-smooth(p/.2));
    drawObject(ctx,i('land0'),351+25*Math.sin(8*p),-65+830*smooth(p),245);
    if(p<.78)drawFX(ctx,i('pebbles'),342,340+280*p,460,{opacity:.65});
    drawMotes(ctx,s,{warm:true,dense:1.6});
  } else if(s<12.3){
    const p=s-7.65;
    drawScene(ctx,i('cavern'),{scale:1.035+.025*smooth(Math.min(1,p/4.65)),x:-5*smooth(Math.min(1,p/4.65))});
    if(p<.2)alphaScene('shaft',1-smooth(p/.2));
    drawMotes(ctx,s,{warm:true,dense:1.25});
    if(p<.95){
      if(i('shadow'))ctx.drawImage(i('shadow'),0,0,W,H);
      drawObject(ctx,i('land'+Math.min(3,Math.floor(p*4.2))),295,752,360);
      if(p<.68)drawFX(ctx,i('landDust'+Math.min(5,Math.floor(p*8))),313,720,550,{opacity:.8});
    }else if(p<2.5){
      drawObject(ctx,i('land3'),307+(p-.95)*24,754,350);
    }else{
      drawObject(ctx,i('board'+Math.min(4,Math.floor((p-2.5)*2.55))),349,775,425);
    }
  } else {
    const p=s-12.3;
    drawScene(ctx,i('cavern'),{scale:1.06+.04*smooth(Math.min(1,p/6.2)),x:-14*smooth(Math.min(1,p/6.2))});
    drawMotes(ctx,s,{warm:true,dense:1.7});
    // The actual game's existing art appears directly beneath a short steam veil,
    // hiding the change from park harness to the game's captain costume.
    drawObject(ctx,i('gameCraft'),340,660,445);
    drawFX(ctx,i('steam'+idx(p,8,6)),256,562,520,{opacity:Math.max(.18,.65-p*.15)});
    if(p>.3)drawFX(ctx,i('sparks'+idx(p,8,8)),566,627,310,{opacity:smooth((p-.3)/.45)});
    if(p>.8)drawFX(ctx,i('drill'+idx(p,8,14)),542,600,285,{opacity:.56});
  }
}
function flattenPaths(o) { return Object.entries(o).flatMap(([k,v])=>Array.isArray(v)?v.map((p,n)=>[k+n,p]):[[k,v]]); }

export default function EmberIntroCinematic({onComplete, onSkip, autoPlay=true}){
  const canvasRef=useRef(null), rafRef=useRef(0), callbacksRef=useRef({onComplete,onSkip});
  const [status,setStatus]=useState('loading');
  const [elapsedMs,setElapsedMs]=useState(0);
  
  const imagesRef=useRef({}), finishedRef=useRef(false);
  callbacksRef.current={onComplete,onSkip};
  const finish=skipped=>{
    if(finishedRef.current)return;
    finishedRef.current=true;cancelAnimationFrame(rafRef.current);
    if(skipped)callbacksRef.current.onSkip?.();
    callbacksRef.current.onComplete?.();
  };
  useEffect(()=>{
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){finish(true);return;}
    let alive=true,start=null,pausedAt=0,hiddenAt=null;
    const urls=flattenPaths(files);
    Promise.all(urls.map(([key,url])=>new Promise(resolve=>{
      const pic=new Image();pic.onload=()=>resolve([key,pic]);pic.onerror=()=>resolve([key,null]);pic.src=url;
    }))).then(loaded=>{
      if(!alive)return;
      imagesRef.current=Object.fromEntries(loaded);
      if(!imagesRef.current.park || !imagesRef.current.dig0){finish(true);return;}
      setStatus('running');
      const ctx=canvasRef.current?.getContext('2d');if(!ctx){finish(true);return;}
      let lastUi=0;
      const tick=now=>{
        if(!alive || finishedRef.current)return;
        if(document.hidden){if(hiddenAt===null)hiddenAt=now;rafRef.current=requestAnimationFrame(tick);return;}
        if(hiddenAt!==null){pausedAt+=now-hiddenAt;hiddenAt=null;}
        if(start===null)start=now;
        const elapsed=now-start-pausedAt;
        paint(ctx,imagesRef.current,elapsed);
        if(now-lastUi>110){setElapsedMs(elapsed);lastUi=now;}
        if(elapsed>=DURATION_MS){finish(false);return;}
        rafRef.current=requestAnimationFrame(tick);
      };
      if(autoPlay)rafRef.current=requestAnimationFrame(tick);
    });
    const key=e=>{if(e.key==='Escape' || e.key==='Enter'){e.preventDefault();finish(true);}};
    window.addEventListener('keydown',key);
    return()=>{alive=false;cancelAnimationFrame(rafRef.current);window.removeEventListener('keydown',key);};
  },[autoPlay]);
  const seconds=elapsedMs/1000;
  const beat=seconds<4.7
    ? {eyebrow:'THE DISCOVERY',title:'Every great expedition begins with a dig.',copy:'A faint ember trail stirs beneath Rosie’s favorite garden.'}
    : seconds<8.2
      ? {eyebrow:'THE DESCENT',title:'The garden is opening.',copy:'Petals become embers as the hidden passage pulls Captain Rosie below.'}
      : seconds<13.8
        ? {eyebrow:'THE PASSAGE',title:'Barkroot caves await.',copy:'Lanterns glow. The old excavation route is still alive.'}
        : {eyebrow:'THE MISSION',title:'The Great Dig begins.',copy:'Rosie has found the drill. The first passage is ready.'};
  const showBeat=status==='running' && ((seconds<4.55)||(seconds>5.65&&seconds<7.85)||(seconds>8.55&&seconds<11.55)||(seconds>14.1));
  const ready=seconds>15.25;
  return <div className="ember-intro" role="region" aria-label="Captain Rosie Ember Tunnel introduction">
    <canvas ref={canvasRef} width={W} height={H} aria-hidden="true" />
    <div className={'ember-intro-filmgrain '+(seconds>5?'is-warm':'')} aria-hidden="true" />
    <div className="ember-intro-plaque" aria-hidden="true"><span>CAPTAIN ROSIE</span><strong>THE GREAT DIG</strong></div>
    <div className={'ember-intro-beat '+(showBeat?'is-visible':'')} aria-live="polite">
      <span>{beat.eyebrow}</span><strong>{beat.title}</strong><p>{beat.copy}</p>
    </div>
    {status==='loading' && <div className="ember-intro-loading">Preparing Rosie's adventure...</div>}
    {ready && <button className="ember-intro-start" type="button" onClick={()=>finish(false)}><span>CAPTAIN ROSIE IS READY</span><strong>START DIGGING</strong><i>›</i></button>}
    <button className="ember-intro-skip" type="button" onClick={()=>finish(true)} aria-label="Skip introduction">Skip <span aria-hidden="true">›</span></button>
    {/* Cinematic sound cues are separate WAVs; deliberately muted by default.
        To add sound, wire WebAudio only inside the user button gesture and schedule
        according to manifest.json; do not start sound on page load on iOS. */}
  </div>;
}
