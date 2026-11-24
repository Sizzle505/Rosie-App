/* Standalone preview fullscreen. The embedded game keeps its existing parent control. */
(() => {
 'use strict';
 if(window.parent!==window){document.documentElement.classList.add('cosmic-embedded');return;}
 const button=document.createElement('button');
 button.type='button';button.className='cosmic-local-fullscreen';
 const icon=document.createElement('img');icon.alt='';button.append(icon);document.body.append(button);
 let fallback=false;
 function sync(){
  const expanded=!!(document.fullscreenElement||document.webkitFullscreenElement||fallback);
  button.setAttribute('aria-label',expanded?'Exit fullscreen game':'Expand game to fullscreen');
  button.title=button.getAttribute('aria-label');
  button.setAttribute('aria-pressed',String(expanded));
  icon.src='assets/console-v2/'+(expanded?'exit-fullscreen':'fullscreen')+'.webp';
 }
 button.addEventListener('click',async()=>{
  try{
   if(fallback){fallback=false;document.documentElement.classList.remove('cosmic-fallback-fullscreen');}
   else if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document);}
   else{const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(!request)throw new Error('Fullscreen unavailable');await request.call(document.documentElement);}
  }catch{fallback=!fallback;document.documentElement.classList.toggle('cosmic-fallback-fullscreen',fallback);}
  sync();
 });
 document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fallback){fallback=false;document.documentElement.classList.remove('cosmic-fallback-fullscreen');sync();}});
 sync();
})();
