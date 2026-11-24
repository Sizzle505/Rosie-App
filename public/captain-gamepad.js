/* Shared Gamepad API adapter for the Captain arcade. Standard mapping only. */
(function(g){
"use strict";
const names={a:0,b:1,x:2,y:3,lb:4,rb:5,lt:6,rt:7,back:8,start:9,up:12,down:13,left:14,right:15};
const sign=v=>Math.abs(v||0)>=.27?Math.sign(v):0;
function direction(x,y){if(!sign(x)&&!sign(y))return null;return Math.abs(x)>Math.abs(y)?x>0?"right":"left":y>0?"down":"up";}
function read(p){
 const buttons=Object.fromEntries(Object.entries(names).map(([k,i])=>{const b=p.buttons[i];return [k,!!(b&&(typeof b==="number"?b>=.5:b.pressed||b.value>=.5))]}));
 const dx=+buttons.right-+buttons.left,dy=+buttons.down-+buttons.up,dp=dx||dy;
 const x=dp?dx:sign(p.axes[0]),y=dp?dy:sign(p.axes[1]);
 return {buttons,x,y,move:dp?direction(dx,dy):direction(p.axes[0]||0,p.axes[1]||0),aim:direction(p.axes[2]||0,p.axes[3]||0)};
}
const neutral=f=>!f.x&&!f.y&&!f.aim&&!Object.values(f.buttons).some(Boolean);
const edges=(f,p)=>Object.fromEntries(Object.keys(names).map(k=>[k,f.buttons[k]&&!p?.buttons[k]]));
function repeatAxis(state,v,now,delay=320){if(!v){state.value=0;state.next=0;return 0;}if(v!==state.value||now>=state.next){state.value=v;state.next=now+delay;return v;}return 0;}
const d=g.document,entries=new Set();let selected=null,owner=null,padIndex=null,previous=null,armed=false,raf=0;
function visible(r){if(!r.isConnected||!r.getClientRects().length)return false;const b=r.getBoundingClientRect();return b.bottom>0&&b.right>0&&b.top<g.innerHeight&&b.left<g.innerWidth;}
function choose(){
 if(d.hidden||!d.hasFocus()||d.activeElement?.tagName==="IFRAME")return null;
 const fs=d.fullscreenElement||d.webkitFullscreenElement,all=[...entries],expanded=all.filter(e=>e.root.closest(".captain-fullscreen-frame")?.classList.contains("is-expanded"));
 const scope=fs?all.filter(e=>fs.contains(e.root)):expanded.length?expanded:all;
 const focus=d.activeElement;if(focus?.closest("input,textarea,[contenteditable=true]"))return null;
 const focused=scope.find(e=>e.root.contains(focus)&&focus!==d.body);
 if(focused&&visible(focused.root))return focused;
 if(selected&&scope.includes(selected)&&visible(selected.root))return selected;
 if(scope.length===1&&visible(scope[0].root))return scope[0];
 if(focus&&focus!==d.body&&focus!==d.documentElement)return null;
 const area=e=>{const b=e.root.getBoundingClientRect();return Math.max(0,Math.min(b.bottom,g.innerHeight)-Math.max(b.top,0))*Math.max(0,Math.min(b.right,g.innerWidth)-Math.max(b.left,0));};
 return scope.filter(e=>visible(e.root)).sort((a,b)=>area(b)-area(a))[0]||null;
}
function release(){if(owner){owner.root.removeAttribute("data-gamepad");owner.release?.();}owner=null;padIndex=null;previous=null;armed=false;}
function pointer(e){selected=[...entries].find(v=>v.root.contains(e.target))||null;}
function focus(e){const found=[...entries].find(v=>v.root.contains(e.target));if(found)selected=found;else if(e.target!==d.body&&e.target!==d.documentElement&&!e.target?.closest(".yacht-victory-overlay"))selected=null;}
function poll(now){raf=0;if(!entries.size)return;try{
 const next=choose();let pads=[];try{pads=Array.from(g.navigator.getGamepads?.()||[]).filter(p=>p?.connected&&p.mapping==="standard");}catch(_){}
 const pad=pads.find(p=>p.index===padIndex)||pads[0];
 if(!next||!pad){release();return;}
 if(owner!==next||padIndex!==pad.index){release();owner=next;padIndex=pad.index;owner.root.setAttribute("data-gamepad","connected");}
 const current=read(pad);if(!armed){if(neutral(current)){armed=true;previous=current;}return;}
 const frame={...current,previous,pressed:edges(current,previous),now};previous=current;owner.input(frame);
 }finally{if(entries.size)raf=g.requestAnimationFrame(poll);}}
function subscribe(root,input,onRelease){
 if(!root||typeof g.navigator?.getGamepads!=="function")return()=>{};
 const e={root,input,release:onRelease};entries.add(e);
 if(entries.size===1){d.addEventListener("pointerdown",pointer,true);d.addEventListener("focusin",focus,true);d.addEventListener("visibilitychange",release);g.addEventListener("blur",release);g.addEventListener("gamepaddisconnected",release);raf=g.requestAnimationFrame(poll);}
 return()=>{if(owner===e)release();if(selected===e)selected=null;entries.delete(e);if(!entries.size){if(raf)g.cancelAnimationFrame(raf);raf=0;d.removeEventListener("pointerdown",pointer,true);d.removeEventListener("focusin",focus,true);d.removeEventListener("visibilitychange",release);g.removeEventListener("blur",release);g.removeEventListener("gamepaddisconnected",release);}};
}
g.RosieGamepad={read,neutral,edges,repeatAxis,subscribe};
})(globalThis);
