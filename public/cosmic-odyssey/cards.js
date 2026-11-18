/* Fiend dossier cards - fronts by default; click, tap or keyboard to flip. */
(() => {
  'use strict';
  const veil=document.getElementById('veil');
  const launcher=document.getElementById('mission-launcher');
  if(!veil||!launcher)return;
  const names={rosie:'Captain Rosie',jett:'Jett Scroundrel',kitty:'Kitty Xenovese',chip:'Chip Scurrio'};
  const cards=Array.from(document.querySelectorAll('.fiend-flip-card'));
  const gallery=veil.querySelector('.fiend-card-gallery');
  if(gallery&&cards.length){
    const fitCards=()=>{
      const {width,height}=gallery.getBoundingClientRect();
      if(width<=0||height<=0)return;
      const gap=parseFloat(getComputedStyle(gallery).columnGap)||0;
      const byWidth=(width-gap*(cards.length-1)-2)/cards.length;
      const byHeight=(height-2)*2/3;
      gallery.style.setProperty('--card-fit-width',Math.max(1,Math.floor(Math.min(byWidth,byHeight)))+'px');
    };
    if('ResizeObserver' in window){
      new ResizeObserver(fitCards).observe(gallery);
    }
    window.addEventListener('resize',fitCards,{passive:true});
    fitCards();
  }

  cards.forEach(card=>{
    card.addEventListener('click',()=>{
      const flipped=card.classList.toggle('is-flipped');
      const name=names[card.dataset.fiend]||'Fiend';
      card.setAttribute('aria-pressed',String(flipped));
      const isRosie=card.dataset.fiend==='rosie';
      card.setAttribute('aria-label',flipped?(isRosie?'Show Captain Rosie hero portrait':'Show '+name+' wanted poster'):(isRosie?'Flip Captain Rosie card to read her biography':'Flip '+name+' card to read criminal dossier'));
    });
  });
  const handle=launcher.querySelector('.mission-launcher-handle');
  if(!handle)return;
  let drag=null;
  handle.addEventListener('pointerdown',event=>{
    if(veil.dataset.phase!=='start'||event.button!==0)return;
    const dock=launcher.getBoundingClientRect(),area=veil.getBoundingClientRect();
    drag={id:event.pointerId,dx:event.clientX-dock.left,dy:event.clientY-dock.top};
    launcher.style.left=(dock.left-area.left)+'px';
    launcher.style.top=(dock.top-area.top)+'px';
    launcher.style.right='auto';
    launcher.style.bottom='auto';
    launcher.style.transform='none';
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const area=veil.getBoundingClientRect();
    const x=Math.max(0,Math.min(area.width-launcher.offsetWidth,event.clientX-area.left-drag.dx));
    const y=Math.max(0,Math.min(area.height-launcher.offsetHeight,event.clientY-area.top-drag.dy));
    launcher.style.left=x+'px';
    launcher.style.top=y+'px';
  });
  function finish(){drag=null;}
  handle.addEventListener('pointerup',finish);
  handle.addEventListener('pointercancel',finish);
})();
