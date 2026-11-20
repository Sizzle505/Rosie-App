import React, {useEffect,useMemo,useRef,useState} from "react";
import qrcode from "qrcode-generator";
import {
  QR_TYPES,QR_STYLES,initialValues,qrPayload,qrByteString,itemName,
  eventIcs
} from "./qrAtelierLogic.js";
import "./RosieQrAtelier.css";
import "./rosie-qr-viewer.css";

const ART="/qr-atelier/";
const ROSIE_ASSET_ROOT=ART+"rosie-qr/";
// The original frame WebPs already have transparent openings. Render their
// selected-color underlay BEHIND the original art, just like the main QR page.
// Paths trace the actual connected transparent aperture in each source image;
// no guessed oval dimensions and no masking or recoloring of the gilded art.
const ROSIE_ART_W=1448,ROSIE_ART_H=1086,ROSIE_CODE_SIZE=352;
// Curious Rosie's original title sits 155 artwork pixels above her lowest
// gold frame flourish. Apply that SAME rise to every frame's measured bottom tip.
const ROSIE_TITLE_RISE=155;
const ROSIE_FRAMES=[
  {id:"seated",label:"Rosie at the Atelier",file:"rosie-frame-seated.webp",cx:941,cy:492,bottomX:912,bottomY:1014,titleWidth:540,openingPath:"M886,226 849,239 799,269 762,304 730,350 711,392 697,449 695,517 701,557 712,592 741,634 778,671 818,699 862,719 909,730 931,726 940,713 951,727 961,730 993,726 1046,708 1091,682 1134,644 1163,606 1177,573 1186,527 1187,467 1181,427 1166,379 1145,338 1120,304 1075,263 1033,239 1000,228 993,233 981,232 975,241 967,244 965,254 957,257 944,273 931,256 921,252 920,244 907,232 896,233Z"},
  {id:"presenting",label:"Rosie Presents",file:"rosie-frame-presenting.webp",cx:962,cy:500,bottomX:967,bottomY:1002,titleWidth:540,openingPath:"M882,249 834,269 793,297 763,332 734,383 720,423 711,475 711,525 720,577 734,617 753,649 767,660 768,666 796,693 840,724 890,747 936,758 987,759 1023,752 1078,729 1112,707 1151,672 1157,660 1165,655 1184,629 1204,577 1213,525 1213,475 1204,423 1190,383 1161,332 1131,297 1108,277 1090,266 1049,250 1036,249 1027,256 1011,256 1000,262 993,272 988,272 971,289 932,256 917,256 902,247Z"},
  {id:"peeking",label:"Curious Rosie",file:"rosie-frame-peeking.webp",cx:829,cy:531,codeSize:376,bottomX:782,bottomY:1074,titleWidth:525,openingPath:"M803,233 759,241 701,261 647,293 609,328 576,372 547,435 537,484 536,513 540,518 537,523 537,542 544,581 568,640 592,677 643,729 695,764 750,787 794,796 851,796 900,786 928,776 964,758 1004,730 1024,711 1023,707 1030,700 1035,700 1078,643 1097,599 1108,556 1110,523 1105,518 1109,513 1109,489 1100,440 1080,388 1045,335 1007,297 964,268 911,246 855,234Z"},
  {id:"blank",label:"The Gilded Frame",file:"rosie-frame-blank.webp",cx:722,cy:496,bottomX:724,bottomY:1075,titleWidth:555,openingPath:"M656,255 607,272 569,294 543,315 507,356 486,407 476,453 474,521 480,562 496,613 519,657 543,689 588,730 630,754 671,768 712,772 724,759 736,772 773,768 814,754 864,724 907,682 934,642 958,585 968,539 970,471 964,430 953,392 937,357 896,311 855,281 802,258 786,254 776,259 765,256 758,264 749,267 749,274 740,279 739,284 724,298 709,284 708,279 699,274 699,267 691,264 685,257 671,259 664,254Z"}
].map(frame=>({...frame,titleX:frame.bottomX,titleY:frame.bottomY-ROSIE_TITLE_RISE}));
function rosieFrameStyle(frame){
  const codeSize=frame.codeSize||ROSIE_CODE_SIZE;
  return {
    "--rosie-code-left":((frame.cx-codeSize/2)/ROSIE_ART_W*100)+"%",
    "--rosie-code-top":((frame.cy-codeSize/2)/ROSIE_ART_H*100)+"%",
    "--rosie-code-size":(codeSize/ROSIE_ART_W*100)+"%",
    "--rosie-title-x":(frame.titleX/ROSIE_ART_W*100)+"%",
    "--rosie-title-y":(frame.titleY/ROSIE_ART_H*100)+"%",
    "--rosie-title-width":(frame.titleWidth/ROSIE_ART_W*100)+"%"
  };
}
const STORAGE="rosieverse.qr-atelier.collection.v1";
const FINISH_STORAGE="rosieverse.qr-atelier.finish.v1";
function readLastFinish(){
  try{const id=localStorage.getItem(FINISH_STORAGE);return QR_STYLES.some(finish=>finish.id===id)?id:"emerald";}
  catch{return "emerald";}
}
const validType=type=>QR_TYPES.some(x=>x.id===type);
const clampSaved=data=>Array.isArray(data)?data.filter(x=>x && validType(x.type) && x.values && typeof x.values==="object").slice(0,40):[];
function readCollection(){
  try{return clampSaved(JSON.parse(localStorage.getItem(STORAGE)||"[]"));}
  catch{return [];}
}
function makeQr(payload,style="emerald"){
  const qr=qrcode(0,"M");
  qr.addData(qrByteString(payload),"Byte");
  qr.make();
  const theme=QR_STYLES.find(x=>x.id===style)||QR_STYLES[0];
  const count=qr.getModuleCount(),quiet=4,dimension=count+quiet*2;
  const modules=[];
  for(let row=0;row<count;row++)for(let col=0;col<count;col++)
    if(qr.isDark(row,col))modules.push("M"+(col+quiet)+" "+(row+quiet)+"h1v1h-1z");
  // The QR modules use the selected dark color; the quiet zone and entire QR square stay pure white.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+dimension+' '+dimension+'" shape-rendering="crispEdges"><rect width="'+dimension+'" height="'+dimension+'" fill="#ffffff"/><path d="'+modules.join("")+'" fill="'+theme.dark+'"/></svg>';
  return {svg,modules:count};
}
function safeName(text){
  return String(text||"qr").toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"qr";
}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function svgBlob(svg){return new Blob([svg],{type:"image/svg+xml;charset=utf-8"});}
async function qrImage(svg){
  const url=URL.createObjectURL(svgBlob(svg));
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("QR artwork could not be rendered."));img.src=url;});
    return img;
  }finally{URL.revokeObjectURL(url);}
}
async function canvasBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error("Could not export this image.")),"image/png"));
}
async function loadImage(src){
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Frame asset unavailable: "+src));img.src=src;});
  return img;
}
async function exportQR(svg,style="emerald",caption="",frameId="seated"){
  // Render exactly the active viewer composition: transparent canvas, QR plus Rosie and inscription.
  const frame=ROSIE_FRAMES.find(x=>x.id===frameId)||ROSIE_FRAMES[0];
  const canvas=document.createElement("canvas");
  canvas.width=ROSIE_ART_W*2;canvas.height=ROSIE_ART_H*2;
  const ctx=canvas.getContext("2d");
  ctx.scale(2,2);
  const qr=await qrImage(svg),art=await loadImage(ROSIE_ASSET_ROOT+frame.file);
  const codeSize=frame.codeSize||ROSIE_CODE_SIZE;
  const finish=QR_STYLES.find(item=>item.id===style)||QR_STYLES[0];
  const x=frame.cx-codeSize/2,y=frame.cy-codeSize/2;
  // Match the live viewer and main Atelier: finish behind the untouched
  // original transparent frame, white QR square, then the gilded art on top.
  ctx.fillStyle=finish.dark;
  ctx.fill(new Path2D(frame.openingPath));
  ctx.fillStyle="#ffffff";
  ctx.fillRect(x,y,codeSize,codeSize);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(qr,x,y,codeSize,codeSize);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(art,0,0,ROSIE_ART_W,ROSIE_ART_H);
  const inscription=String(caption||"").trim().slice(0,48);
  if(inscription){
    ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
    let fontSize=49;
    do{ctx.font="italic "+fontSize+"px Georgia,serif";fontSize-=2;}
    while(fontSize>27&&ctx.measureText(inscription).width>frame.titleWidth);
    ctx.fillStyle="#50351f";ctx.shadowColor="#fff5d9";ctx.shadowBlur=2;
    ctx.fillText(inscription,frame.titleX,frame.titleY,frame.titleWidth);
    ctx.restore();
  }
  return canvasBlob(canvas);
}
function RosieFrameComposition({frame,svg,caption,onCaptionChange,onClose,finish="emerald",printOnly=false}){
  const background=(QR_STYLES.find(item=>item.id===finish)||QR_STYLES[0]).dark;
  return <div className={"qa-rosie-composition"+(printOnly?" qa-rosie-for-print":"")} style={{...rosieFrameStyle(frame),"--rosie-code-bg":background}}>
    <svg className="qa-rosie-insert-underlay" viewBox={"0 0 "+ROSIE_ART_W+" "+ROSIE_ART_H}
      preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={frame.openingPath} fill="var(--rosie-code-bg)"/>
    </svg>
    <div className="qa-rosie-live-qr" dangerouslySetInnerHTML={{__html:svg}} role="img" aria-label="Scannable QR code"/>
    <img className="qa-rosie-overlay-art" src={ROSIE_ASSET_ROOT+frame.file} alt="" draggable="false"/>
    {onClose&&<button type="button" className="qa-rosie-close" onClick={onClose}
      aria-label="Close QR preview and return to the Atelier" title="Close preview">
      <span aria-hidden="true">×</span>
    </button>}
    {printOnly?<span className="qa-rosie-printed-title">{caption}</span>:
      <input className="qa-rosie-title-field" value={caption} onChange={e=>onCaptionChange(e.target.value.slice(0,48))}
        aria-label="Optional inscription for the frame title plate" placeholder="Add a title"/>}
  </div>;
}

function drawWrapped(ctx,value,x,y,maxWidth,lineHeight,maxLines=3){
  const words=String(value||"").split(/\s+/);
  let line="",written=0;
  for(const word of words){
    const candidate=line?line+" "+word:word;
    if(ctx.measureText(candidate).width>maxWidth&&line){
      ctx.fillText(line,x,y+written*lineHeight);written++;line=word;
      if(written>=maxLines-1)break;
    }else line=candidate;
  }
  if(line&&written<maxLines)ctx.fillText(line,x,y+written*lineHeight);
}
async function exportKeepsake(svg,type,values,style){
  const theme=QR_STYLES.find(x=>x.id===style)||QR_STYLES[0];
  const canvas=document.createElement("canvas");
  canvas.width=1800;canvas.height=1080;
  const ctx=canvas.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,1800,1080);bg.addColorStop(0,theme.dark);
  bg.addColorStop(.6,theme.dark);bg.addColorStop(1,"#020e0e");
  ctx.fillStyle=bg;ctx.fillRect(0,0,1800,1080);
  ctx.lineWidth=10;ctx.strokeStyle=theme.accent;ctx.strokeRect(32,32,1736,1016);
  ctx.lineWidth=2;ctx.strokeStyle="#f6e9c3";ctx.strokeRect(54,54,1692,972);
  for(const [x,y] of [[68,68],[1732,68],[68,1012],[1732,1012]]){
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.strokeStyle=theme.accent;ctx.lineWidth=5;ctx.strokeRect(-13,-13,26,26);ctx.restore();
  }
  ctx.fillStyle=theme.accent;ctx.font="40px Georgia,serif";ctx.fillText("✦  R O S I E  ·  Q R  A T E L I E R  ✦",120,157);
  ctx.fillStyle=theme.light;ctx.font="bold 78px Georgia,serif";
  const title=type==="calling"?"Calling Card":QR_TYPES.find(x=>x.id===type)?.label||"QR Code";
  ctx.fillText(title,120,320,775);
  ctx.strokeStyle=theme.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(120,353);ctx.lineTo(850,353);ctx.stroke();
  const main=type==="calling"||type==="contact"?values.name:type==="wifi"?values.ssid:
    type==="event"?values.title:type==="instagram"?"@"+values.handle:
    itemName(type,values);
  ctx.font="53px Georgia,serif";drawWrapped(ctx,main,120,460,770,65,3);
  if(type==="calling" && values.tagline){ctx.fillStyle=theme.light;ctx.font="italic 28px Georgia,serif";drawWrapped(ctx,values.tagline,120,755,760,34,2);}
  if(type==="calling"||type==="contact"){
    ctx.fillStyle=theme.accent;ctx.font="34px Georgia,serif";
    drawWrapped(ctx,[values.title,values.organization].filter(Boolean).join("  ·  "),120,620,750,47,2);
  }
  ctx.fillStyle=theme.light;ctx.font="31px Georgia,serif";
  ctx.fillText("SCAN TO CONNECT",120,887);
  const img=await qrImage(svg);
  ctx.fillStyle="#fff";ctx.fillRect(995,235,700,700);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(img,1024,264,642,642);
  return canvasBlob(canvas);
}
function Field({label,value,onChange,type="text",placeholder="",autoComplete="off",inputMode,required=false}){
  return <label className="qa-field"><span>{label}{required&&<em> *</em>}</span>
    <input type={type} value={value||""} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} required={required}/></label>;
}
function TypeIcon({id}) {
  const s={viewBox:"0 0 24 24",width:30,height:30,fill:"none",stroke:"currentColor",strokeWidth:1.75,
    strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"};
  const paths={
    wifi:<><path d="M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
    contact:<><rect x="2.5" y="4" width="19" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M5.8 16c.8-2.5 5.6-2.5 6.4 0M15 9h4M15 13h4M15 17h3"/></>,
    website:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 6-6 12 0 18M12 3c6 6 6 12 0 18"/></>,
    zoom:<><rect x="2.5" y="6" width="13.5" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
    event:<><rect x="3" y="5.5" width="18" height="16" rx="2"/><path d="M7 2.5v6M17 2.5v6M3 10.5h18M8 15h3M8 18h7"/></>,
    payment:<><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15.5h5"/></>,
    instagram:<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></>,
    calling:<><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8.5" cy="10" r="2"/><path d="M4.7 16c1-3 6.7-3 7.7 0M14 9h5M14 12.5h5M14 16h4"/></>
  };
  return <svg {...s}>{paths[id]||paths.website}</svg>;
}

function QRTypeSelector({current,onSelect}){
  return <div className="qa-formats" role="group" aria-label="Choose QR code type">
    {QR_TYPES.map(t=><button type="button" key={t.id} className={"qa-type"+(current===t.id?" selected":"")}
      onClick={()=>onSelect(t.id)} aria-pressed={current===t.id} title={t.hint}>
      <span className="qa-type-symbol" aria-hidden="true"><TypeIcon id={t.id}/></span><span>{t.label}</span>
    </button>)}
  </div>;
}
function Details({type,v,put,showPassword,setShowPassword}){
  switch(type){
    case "wifi":return <>
      <Field label="Network name (SSID)" required value={v.ssid} onChange={x=>put("ssid",x)} placeholder="Guest Wi-Fi"/>
      {v.security!=="nopass"&&<div className="qa-password-row">
        <Field label="Wi-Fi password" value={v.password} required onChange={x=>put("password",x)}
          type={showPassword?"text":"password"} placeholder="Network password" autoComplete="new-password"/>
        <button type="button" className="qa-toggle-password" onClick={()=>setShowPassword(x=>!x)} aria-label={showPassword?"Hide Wi-Fi password":"Show Wi-Fi password"}>{showPassword?"Hide":"Show"}</button>
      </div>}
      <label className="qa-field"><span>Security</span><select value={v.security} onChange={e=>put("security",e.target.value)}>
        <option value="WPA">WPA2 / WPA3 (most networks)</option><option value="WEP">WEP (legacy)</option>
        <option value="nopass">Open (no password)</option></select></label>
      <label className="qa-check"><input type="checkbox" checked={v.hidden} onChange={e=>put("hidden",e.target.checked)}/> Hidden network</label>
    </>;
    case "contact":case "calling":return <>
      <Field label="Full name" required value={v.name} onChange={x=>put("name",x)} placeholder="Name"/>
      <div className="qa-duo"><Field label="Position / title" value={v.title} onChange={x=>put("title",x)}/>
        <Field label="Company" value={v.organization} onChange={x=>put("organization",x)}/></div>
      <Field label="Mobile number" type="tel" inputMode="tel" value={v.phone} onChange={x=>put("phone",x)} placeholder="+1 555 123 4567"/>
      <Field label="Email" type="email" inputMode="email" value={v.email} onChange={x=>put("email",x)} placeholder="name@example.com"/>
      <Field label="Website" type="url" inputMode="url" value={v.website} onChange={x=>put("website",x)} placeholder="yourwebsite.com"/>
      <Field label="Business address (optional)" value={v.address} onChange={x=>put("address",x)}/>
      {type==="calling"&&<><Field label="Optional card motto" value={v.tagline} onChange={x=>put("tagline",x)} placeholder="Excellence, by design"/>
        <p className="qa-hint">The Calling Card export is a designed, printable card with a separate QR for saving contact details.</p></>}
      <p className="qa-hint">Add a name and at least one way to reach you.</p>
    </>;
    case "website":return <Field label="Website address" type="url" required inputMode="url" value={v.url} onChange={x=>put("url",x)} placeholder="https://example.com"/>;
    case "zoom":return <label className="qa-field"><span>Meeting link or copied invitation</span>
      <textarea rows="3" value={v.url} placeholder="Paste your Zoom join URL or invitation here" onChange={e=>put("url",e.target.value)}/><small>The meeting link is extracted automatically. No Zoom account connection needed.</small></label>;
    case "event":return <>
      <Field label="Event title" required value={v.title} onChange={x=>put("title",x)} placeholder="Rosie's Grand Opening"/>
      <div className="qa-duo"><Field label="Start" type="datetime-local" required value={v.start} onChange={x=>put("start",x)}/>
        <Field label="End" type="datetime-local" required value={v.end} onChange={x=>put("end",x)}/></div>
      <Field label="Time zone (IANA)" value={v.timezone} onChange={x=>put("timezone",x)} placeholder="America/New_York"/>
      <Field label="Location" value={v.location} onChange={x=>put("location",x)} placeholder="Place or address"/>
      <label className="qa-field"><span>Description</span><textarea rows="3" value={v.details} onChange={e=>put("details",e.target.value)} placeholder="Optional details"/></label>
      <p className="qa-hint">The QR opens a pre-filled Google Calendar event. An optional .ics invitation can also be downloaded.</p>
    </>;
    case "payment":return <>
      <label className="qa-field"><span>Payment platform</span><select value={v.provider||"other"} onChange={e=>put("provider",e.target.value)}>
        <option value="other">Any payment URL</option><option value="paypal">PayPal / PayPal.Me</option>
        <option value="venmo">Venmo</option><option value="cashapp">Cash App</option><option value="zelle">Zelle - provided link only</option>
      </select></label>
      <Field label="Your payment link" required type="url" value={v.url} onChange={x=>put("url",x)} placeholder="https://your-provider.com/…"/>
      <p className="qa-hint">Use a real payment URL from your provider. Rosie never charges, processes, or verifies payments.</p>
    </>;
    case "instagram":return <Field label="Instagram username or profile URL" required value={v.handle} onChange={x=>put("handle",x)} placeholder="@yourhandle"/>;
    default:return null;
  }
}
export default function RosieQrAtelier(){
  const [type,setType]=useState("website");
  const [forms,setForms]=useState(initialValues);
  const [style,setStyle]=useState(readLastFinish);
  const [saved,setSaved]=useState(readCollection);
  const [showPassword,setShowPassword]=useState(false);
  const [fullScreen,setFullScreen]=useState(false);
  const [rosieFrameIndex,setRosieFrameIndex]=useState(0);
  const [label,setLabel]=useState("");
  const [frameCaption,setFrameCaption]=useState("");
  const [loadedId,setLoadedId]=useState(null);
  const [filter,setFilter]=useState("");
  const [showSaveMenu,setShowSaveMenu]=useState(false);
  const [collectionOpen,setCollectionOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [working,setWorking]=useState(false);
  const previewRef=useRef(null),ringRef=useRef(null),saveDrawerRef=useRef(null),timerRef=useRef(null),viewButtonRef=useRef(null);
  const v=forms[type];
  const put=(key,value)=>setForms(all=>({...all,[type]:{...all[type],[key]:value}}));
  const changeType=next=>{setType(next);setLoadedId(null);setLabel("");setFrameCaption("");setShowPassword(false);};
  const output=useMemo(()=>{
    try{const payload=qrPayload(type,v),data=makeQr(payload,style);return {...data,payload,error:""};}
    catch(e){const error=/code length overflow|data too long|overflow/i.test(e?.message||"")
      ?"That QR contains too much data. Shorten the details or website address.":e.message||"Please review your details.";
      return {payload:"",svg:"",modules:0,error};}
  },[type,v,style]);
  const ready=Boolean(output.svg);
  const toastMessage=text=>{setToast(text);window.clearTimeout(timerRef.current);timerRef.current=window.setTimeout(()=>setToast(""),4000);};
  useEffect(()=>()=>window.clearTimeout(timerRef.current),[]);
  useEffect(()=>{try{localStorage.setItem(FINISH_STORAGE,style);}catch{/* Continue without persistence if storage is blocked. */}},[style]);
  function closeRosieViewer(){
    setFullScreen(false);
    window.requestAnimationFrame(()=>viewButtonRef.current?.focus({preventScroll:true}));
  }
  useEffect(()=>{
    try{localStorage.setItem(STORAGE,JSON.stringify(saved));}
    catch{toastMessage("This browser cannot save your collection. Downloads still work.");}
  },[saved]);
  useEffect(()=>{
    if(!showSaveMenu)return;
    // The save drawer is in normal document flow beneath the workbench.
    // Scroll it into view rather than obscuring the five finish choices.
    const frame=window.requestAnimationFrame(()=>saveDrawerRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"}));
    return ()=>window.cancelAnimationFrame(frame);
  },[showSaveMenu]);
  useEffect(()=>{
    if(!fullScreen)return;
    const key=e=>{
      if(e.key==="Escape")closeRosieViewer();
      if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&!(e.target instanceof HTMLInputElement)){
        e.preventDefault();
        setRosieFrameIndex(i=>(i+(e.key==="ArrowLeft"?-1:1)+ROSIE_FRAMES.length)%ROSIE_FRAMES.length);
      }
    };
    document.addEventListener("keydown",key);
    const old=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.removeEventListener("keydown",key);document.body.style.overflow=old;};
  },[fullScreen]);
  function save(){
    if(!ready)return toastMessage(output.error);
    const name=label.trim()||itemName(type,v);
    const record={id:loadedId||((globalThis.crypto?.randomUUID?.())||Date.now().toString(36)),type,
      values:{...v},label:name,frameCaption:frameCaption.trim(),style,savedAt:new Date().toISOString()};
    setSaved(list=>[record,...list.filter(x=>x.id!==record.id)].slice(0,40));
    setLoadedId(record.id);setLabel(name);setShowSaveMenu(false);toastMessage("Saved in My Collection on this device.");
  }
  function openRecord(item){
    setType(item.type);
    setForms(previous=>({...previous,[item.type]:{...initialValues()[item.type],...item.values}}));
    setStyle(QR_STYLES.some(s=>s.id===item.style)?item.style:"emerald");
    setLoadedId(item.id);setLabel(item.label||"");setFrameCaption(item.frameCaption||"");
    setShowPassword(false);setShowSaveMenu(false);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function removeRecord(item){
    if(!window.confirm("Delete \""+item.label+"\" from this device?"))return;
    setSaved(list=>list.filter(x=>x.id!==item.id));
    if(loadedId===item.id){setLoadedId(null);setLabel("");setFrameCaption("");}
    toastMessage("Removed from your collection.");
  }
  async function withDownload(action){
    if(!ready)return toastMessage(output.error);
    if(working)return;
    setWorking(true);
    try{await action();}catch(e){if(e?.name!=="AbortError")toastMessage(e?.message||"That export is unavailable.");}
    finally{setWorking(false);}
  }
  const activeRosieFrame=ROSIE_FRAMES[rosieFrameIndex];
  const slug=safeName(label||itemName(type,v));
  const fileBase=slug.startsWith("rosie-")?slug:"rosie-"+slug;
  function exportFile(kind){
    withDownload(async()=>{
      if(kind==="svg") download(svgBlob(output.svg),fileBase+".svg");
      else if(kind==="png")download(await exportQR(output.svg,style,frameCaption,activeRosieFrame.id),fileBase+"-"+activeRosieFrame.id+".png");
      else if(kind==="card") download(await exportKeepsake(output.svg,type,v,style),fileBase+"-printable.png");
      else if(kind==="ics")download(new Blob([eventIcs(v)],{type:"text/calendar;charset=utf-8"}),fileBase+".ics");
      else if(kind==="vcf")download(new Blob([output.payload],{type:"text/vcard;charset=utf-8"}),fileBase+".vcf");
      toastMessage("Download prepared.");
    });
  }
  function share(){
    withDownload(async()=>{
      const blob=await exportQR(output.svg,style,frameCaption,activeRosieFrame.id);
      const file=new File([blob],fileBase+".png",{type:"image/png"});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:"Rosie's QR Atelier"});
      }else{download(blob,file.name);toastMessage("Your QR image was downloaded to share.");}
    });
  }
  async function copyQR(){
    if(!ready||working)return;
    if(!navigator.clipboard?.write||typeof ClipboardItem==="undefined"){
      toastMessage("This browser cannot copy QR images. Use PNG export instead.");
      return;
    }
    setWorking(true);
    try{
      // Supply ClipboardItem with its image promise synchronously for iOS Safari.
      await navigator.clipboard.write([new ClipboardItem({"image/png":exportQR(output.svg,style,frameCaption,activeRosieFrame.id)})]);
      toastMessage("QR image copied. Paste it wherever you like.");
    }catch{toastMessage("Could not copy the QR image. Use PNG export instead.");}
    finally{setWorking(false);}
  }
  function showFinishedQR(){
    const active=document.activeElement;
    if(active instanceof HTMLElement)active.blur();
    const alignToNavigation=()=>{
      const ring=ringRef.current;
      if(!ring)return;
      const navigation=document.querySelector(".app-shell .bottom-nav");
      const navTop=navigation?.getBoundingClientRect().top ??
        (window.visualViewport?.height||window.innerHeight)-95;
      const bottom=ring.getBoundingClientRect().bottom;
      window.scrollBy({top:bottom-navTop+8,behavior:"smooth"});
    };
    // Allow the iPhone keyboard to retract before positioning the frame.
    window.setTimeout(alignToNavigation,180);
  }
  const matching=saved.filter(x=>(x.label||"").toLowerCase().includes(filter.trim().toLowerCase())||
    QR_TYPES.find(t=>t.id===x.type)?.label.toLowerCase().includes(filter.trim().toLowerCase()));
  return <main className={"qa-page qa-style-"+style} aria-label="Rosie's QR Atelier">
    <div className="qa-scene">
      <header className="qa-hero" aria-label="Rosie works at her QR atelier">
        <div className="qa-title">
          <h1 className="qa-accessible-title">QR Atelier</h1>
          <img className="qa-header-sign" src={ART+"header-sign.webp"}
            alt="Small Codes. Beautiful Connections." draggable="false" />
        </div>
      </header>
      <section className="qa-preview-stage" ref={previewRef} aria-label="Live QR preview">
        <div className="qa-ring" ref={ringRef} aria-label={ready?"QR artwork, ready to scan":"Empty QR frame"}>
          <div className="qa-code-shell">{ready?<div className="qa-svg" dangerouslySetInnerHTML={{__html:output.svg}} role="img" aria-label="Scannable QR code"/>
            :<div className="qa-waiting"><img className="qa-idle-emblem" src={ART+"idle-paw.webp"} alt="" /><span>Awaiting your creation</span></div>}</div>
          <img className="qa-ring-art" src={ART+"qr-frame.webp"} alt="" aria-hidden="true" draggable="false"/>
          {frameCaption&&<span className="qa-ring-caption qa-custom-caption">{frameCaption}</span>}
        </div>
        <div className="qa-preview-actions" role="group" aria-label="QR preview actions">
          <button type="button" ref={viewButtonRef} onClick={()=>{setRosieFrameIndex(Math.floor(Math.random()*ROSIE_FRAMES.length));setFullScreen(true);}} disabled={!ready} aria-label="View QR in a Rosie frame">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4"/><rect x="8" y="8" width="8" height="8" rx="1.5"/></svg><span>View</span>
          </button>
          <button type="button" onClick={copyQR} disabled={!ready||working} aria-label="Copy QR image">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span>Copy</span>
          </button>
        </div>
      </section>
      <section className="qa-finish-strip" aria-label="QR frame finishes">
          <div className="qa-palettes" role="group" aria-label="Presentation finish">
            {QR_STYLES.map(s=><button key={s.id} type="button" aria-pressed={style===s.id}
              className={"qa-palette qa-palette-"+s.id+(style===s.id?" chosen":"")} onClick={()=>setStyle(s.id)}>
              <span className="qa-swatch"/><span>{s.label}</span></button>)}
          </div>
      </section>
      <section className="qa-panel" aria-label="QR code settings">
        <div className="qa-panel-inner">
          <h2 className="qa-creation-heading">Choose Your Creation</h2>
          <QRTypeSelector current={type} onSelect={changeType}/>
          <div className="qa-inputs" key={type}>
            <Details type={type} v={v} put={put} showPassword={showPassword} setShowPassword={setShowPassword}/>
          </div>
          <div className="qa-instruction-row">
            <p className={"qa-instruction-copy"+(ready?" qa-valid":"")} role="status" aria-live="polite">
              {ready?"Ready to share":output.error}
            </p>
            <div className="qa-finish-controls">
              <div className="qa-save-menu">
                <button className="qa-save-toggle" type="button" aria-expanded={showSaveMenu} aria-controls="qa-save-details" onClick={()=>setShowSaveMenu(open=>!open)}>
                  Save <span aria-hidden="true">⌄</span></button>
              </div>
              <button className="qa-done" type="button" onClick={showFinishedQR}>Done <span aria-hidden="true">↑</span></button>
            </div>
          </div>

        </div>
      </section>
      {showSaveMenu&&<section id="qa-save-details" ref={saveDrawerRef} className="qa-save-drawer" aria-label="Save and export QR code">
        <div className="qa-save-options">
          <Field label="Name (optional)" value={label} onChange={setLabel} placeholder={itemName(type,v)}/>
          <button type="button" disabled={!ready||working} onClick={save}>{loadedId?"Update Collection":"Save to My Collection"}</button>
          <button type="button" disabled={!ready||working} onClick={share}>Share</button>
          <button type="button" disabled={!ready||working} onClick={()=>exportFile("png")}>Download PNG</button>
          <button type="button" disabled={!ready||working} onClick={()=>exportFile("svg")}>Download SVG</button>
          <button type="button" disabled={!ready||working} onClick={()=>exportFile("card")}>Designed Card</button>
          {type==="event"&&<button type="button" disabled={!ready||working} onClick={()=>exportFile("ics")}>Download .ics Invite</button>}
          {(type==="contact"||type==="calling")&&<button type="button" disabled={!ready||working} onClick={()=>exportFile("vcf")}>Download Contact (.vcf)</button>}
          <button type="button" disabled={!ready} onClick={()=>window.print()}>Print / Save PDF</button>
        </div>
      </section>}
      <section className="qa-collection" aria-label="Saved QR collection">
        <button className="qa-collection-toggle" type="button" aria-expanded={collectionOpen} onClick={()=>setCollectionOpen(open=>!open)}>
          My Collection <span>{saved.length}</span> <b aria-hidden="true">⌄</b></button>
        {collectionOpen&&saved.length>0&&<>
        {saved.length>3&&<label className="qa-search"><span>Find a code</span><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search names or types"/></label>}
        <div className="qa-saved-grid">
          {matching.map(item=><div className="qa-saved" key={item.id}>
            <button type="button" onClick={()=>openRecord(item)}>
              <span>{QR_TYPES.find(t=>t.id===item.type)?.label||"QR"}</span>
              <strong>{item.label}</strong>
              <small>{item.savedAt?new Date(item.savedAt).toLocaleDateString():"Saved"}</small>
            </button>
            <button type="button" className="qa-remove" aria-label={"Delete "+item.label} onClick={()=>removeRecord(item)}>×</button>
          </div>)}
          {matching.length===0&&<p>No matching codes.</p>}
        </div></>}
      </section>
      {ready&&<section className="qa-print-sheet qa-rosie-print-sheet" aria-label="Print Rosie frame and QR without background">
        <RosieFrameComposition frame={activeRosieFrame} svg={output.svg} caption={frameCaption} finish={style} printOnly/>
      </section>}
      <p className="qa-status" role="status" aria-live="polite">{toast}</p>
    </div>
    {fullScreen&&ready&&<div className="qa-fullscreen qa-rosie-viewer" role="dialog" aria-modal="true" aria-label="Rosie framed scannable QR code">
      <div className="qa-rosie-viewer-content">
        <RosieFrameComposition frame={activeRosieFrame} svg={output.svg} caption={frameCaption} finish={style} onCaptionChange={setFrameCaption} onClose={closeRosieViewer}/>
        <div className="qa-rosie-frame-controls" role="group" aria-label="Choose the Rosie frame">
          <button type="button" className="qa-rosie-arrow" aria-label="Previous Rosie frame" onClick={()=>setRosieFrameIndex(i=>(i-1+ROSIE_FRAMES.length)%ROSIE_FRAMES.length)}>‹</button>
          <span>{activeRosieFrame.label} · {rosieFrameIndex+1} / {ROSIE_FRAMES.length}</span>
          <button type="button" className="qa-rosie-arrow" aria-label="Next Rosie frame" onClick={()=>setRosieFrameIndex(i=>(i+1)%ROSIE_FRAMES.length)}>›</button>
        </div>
        <div className="qa-rosie-viewer-actions">
          <button type="button" onClick={copyQR} disabled={working}>Copy framed QR</button>
          <button type="button" onClick={()=>window.print()}>Print</button>
          <button type="button" onClick={()=>exportFile("png")} disabled={working}>Download PNG</button>
        </div>
        <span className="qa-rosie-ready">{QR_TYPES.find(t=>t.id===type)?.label} · Ready to Scan</span>
        <span className="qa-rosie-viewer-toast" role="status" aria-live="polite">{toast}</span>
      </div>
    </div>}
  </main>;
}
