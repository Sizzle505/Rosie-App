/* Cosmic Odyssey collectible profiles: desktop selection, immersive reversible cards,
   and an iPhone deck below the complete playable game. */
(() => {
  'use strict';
  const veil=document.getElementById('veil');
  const launcher=document.getElementById('mission-launcher');
  const gallery=veil?.querySelector('.fiend-card-gallery');
  const deck=document.getElementById('mobile-card-deck');
  const dialog=document.getElementById('card-detail-modal');
  const closeButton=document.getElementById('card-detail-close');
  const display=document.getElementById('card-detail-display');
  const front=document.getElementById('card-detail-front');
  const back=document.getElementById('card-detail-back');
  const prev=document.getElementById('card-detail-prev');
  const next=document.getElementById('card-detail-next');
  const position=document.getElementById('card-detail-position');
  if(!veil||!launcher||!gallery||!deck||!dialog||!closeButton||!display||!front||!back)return;
  const cards=Array.from(gallery.querySelectorAll('.fiend-flip-card'));
  const names={rosie:'Captain Rosie',jett:'Jett Scroundrel',kitty:'Kitty Xenovese',chip:'Chip Scurrio'};
  const handset=window.matchMedia('(max-width:759px) and (orientation:portrait), (max-width:950px) and (max-height:560px) and (pointer:coarse)');
  let selected=null;
  let activeName='Character';

  function fitCards(){
    if(gallery.parentElement!==veil)return;
    const {width,height}=gallery.getBoundingClientRect();
    if(width<=0||height<=0)return;
    const gap=parseFloat(getComputedStyle(gallery).columnGap)||0;
    const byWidth=(width-gap*(cards.length-1)-2)/cards.length;
    const byHeight=(height-2)*2/3;
    gallery.style.setProperty('--card-fit-width',Math.max(1,Math.floor(Math.min(byWidth,byHeight)))+'px');
  }
  function placeGallery(){
    if(handset.matches){
      if(gallery.parentElement!==deck)deck.appendChild(gallery);
      gallery.style.removeProperty('--card-fit-width');
    }else{
      if(gallery.parentElement!==veil)veil.insertBefore(gallery,launcher);
      fitCards();
    }
  }
  if('ResizeObserver' in window)new ResizeObserver(fitCards).observe(gallery);
  handset.addEventListener?.('change',placeGallery);
  window.addEventListener('resize',placeGallery,{passive:true});
  placeGallery();

  function updateFlipLabel(){
    display.setAttribute('aria-label',display.classList.contains('is-flipped')
      ?'Show front of '+activeName+' card'
      :'Show back of '+activeName+' card');
  }
  function populateCard(card){
    selected=card;
    activeName=names[card.dataset.fiend]||'Character';
    front.src=card.querySelector('.fiend-card-front').getAttribute('src');
    back.src=card.querySelector('.fiend-card-back').getAttribute('src');
    front.alt=activeName+' profile portrait';
    back.alt=activeName+' character dossier';
    display.classList.remove('is-flipped');
    updateFlipLabel();
    dialog.setAttribute('aria-label',activeName+' collectible character card');
    if(position)position.textContent=activeName+' · '+(cards.indexOf(card)+1)+' / '+cards.length;
  }
  function openCard(card){
    if(typeof dialog.showModal!=='function')return;
    populateCard(card);
    if(!dialog.open)dialog.showModal();
    display.focus({preventScroll:true});
  }
  function cycleCard(delta){
    if(!dialog.open||!cards.length)return;
    const current=cards.indexOf(selected);
    populateCard(cards[(current+delta+cards.length)%cards.length]);
    display.focus({preventScroll:true});
  }
  function dismissCard(){
    if(dialog.open)dialog.close();
  }
  cards.forEach(card=>{
    card.setAttribute('aria-pressed','false');
    const name=names[card.dataset.fiend]||'Character';
    card.setAttribute('aria-label','Enlarge '+name+' character card');
    card.addEventListener('click',()=>openCard(card));
  });
  display.addEventListener('click',()=>{
    display.classList.toggle('is-flipped');
    updateFlipLabel();
  });
  closeButton.addEventListener('click',dismissCard);
  prev?.addEventListener('click',()=>cycleCard(-1));
  next?.addEventListener('click',()=>cycleCard(1));
  // Only intercept arrows while the dossier modal is open; normal game controls
  // remain untouched when playing Cosmic Odyssey.
  document.addEventListener('keydown',event=>{
    if(!dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();event.stopPropagation();
      cycleCard(event.key==='ArrowLeft'?-1:1);
    }
  },true);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dismissCard();});
  dialog.addEventListener('close',()=>{
    display.classList.remove('is-flipped');
    const previous=selected;selected=null;
    previous?.focus({preventScroll:true});
  });

  /* Keep the existing draggable level/launch dock behavior. */
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
