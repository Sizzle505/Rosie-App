import React, {useEffect,useMemo,useRef,useState} from "react";
import qrcode from "qrcode-generator";
import {
  QR_TYPES,QR_STYLES,initialValues,qrPayload,qrByteString,itemName,
  eventIcs
} from "./qrAtelierLogic.js";
import "./RosieQrAtelier.css";

const ART="/qr-atelier/";
const STORAGE="rosieverse.qr-atelier.collection.v1";
const validType=type=>QR_TYPES.some(x=>x.id===type);
const clampSaved=data=>Array.isArray(data)?data.filter(x=>x && validType(x.type) && x.values && typeof x.values==="object").slice(0,40):[];
function readCollection(){
  try{return clampSaved(JSON.parse(localStorage.getItem(STORAGE)||"[]"));}
  catch{return [];}
}
function makeQr(payload){
  const qr=qrcode(0,"M");
  qr.addData(qrByteString(payload),"Byte");
  qr.make();
  return {svg:qr.createSvgTag({cellSize:8,margin:32,scalable:true}),modules:qr.getModuleCount()};
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
async function exportQR(svg){
  const img=await qrImage(svg);
  const canvas=document.createElement("canvas");canvas.width=1600;canvas.height=1600;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,1600,1600);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0,1600,1600);
  return canvasBlob(canvas);
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
function Details({type,v,put,showPassword,setShowPassword,wifiConsent,setWifiConsent}){
  switch(type){
    case "wifi":return <>
      <Field label="Network name (SSID)" required value={v.ssid} onChange={x=>put("ssid",x)} placeholder="Guest Wi-Fi"/>
      <label className="qa-field"><span>Security</span><select value={v.security} onChange={e=>put("security",e.target.value)}>
        <option value="WPA">WPA2 / WPA3 (most networks)</option><option value="WEP">WEP (legacy)</option>
        <option value="nopass">Open (no password)</option></select></label>
      {v.security!=="nopass"&&<div className="qa-password-row">
        <Field label="Wi-Fi password" value={v.password} required onChange={x=>put("password",x)}
          type={showPassword?"text":"password"} placeholder="Network password" autoComplete="new-password"/>
        <button type="button" className="qa-toggle-password" onClick={()=>setShowPassword(x=>!x)} aria-label={showPassword?"Hide Wi-Fi password":"Show Wi-Fi password"}>{showPassword?"Hide":"Show"}</button>
      </div>}
      <label className="qa-check"><input type="checkbox" checked={v.hidden} onChange={e=>put("hidden",e.target.checked)}/> Hidden network</label>
      <label className="qa-check qa-sensitive"><input type="checkbox" checked={wifiConsent} onChange={e=>setWifiConsent(e.target.checked)}/>
        Allow this device to save the Wi-Fi password in my collection.</label>
      <p className="qa-hint">Scanning shares the network credentials. Display this code only to people you trust.</p>
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
  const [style,setStyle]=useState("emerald");
  const [saved,setSaved]=useState(readCollection);
  const [wifiConsent,setWifiConsent]=useState(false);
  const [showPassword,setShowPassword]=useState(false);
  const [fullScreen,setFullScreen]=useState(false);
  const [label,setLabel]=useState("");
  const [loadedId,setLoadedId]=useState(null);
  const [filter,setFilter]=useState("");
  const [toast,setToast]=useState("");
  const [working,setWorking]=useState(false);
  const previewRef=useRef(null),timerRef=useRef(null);
  const v=forms[type];
  const put=(key,value)=>setForms(all=>({...all,[type]:{...all[type],[key]:value}}));
  const changeType=next=>{setType(next);setLoadedId(null);setLabel("");setWifiConsent(false);setShowPassword(false);};
  const output=useMemo(()=>{
    try{const payload=qrPayload(type,v),data=makeQr(payload);return {...data,payload,error:""};}
    catch(e){const error=/code length overflow|data too long|overflow/i.test(e?.message||"")
      ?"That QR contains too much data. Shorten the details or website address.":e.message||"Please review your details.";
      return {payload:"",svg:"",modules:0,error};}
  },[type,v]);
  const ready=Boolean(output.svg);
  const toastMessage=text=>{setToast(text);window.clearTimeout(timerRef.current);timerRef.current=window.setTimeout(()=>setToast(""),4000);};
  useEffect(()=>()=>window.clearTimeout(timerRef.current),[]);
  useEffect(()=>{
    try{localStorage.setItem(STORAGE,JSON.stringify(saved));}
    catch{toastMessage("This browser cannot save your collection. Downloads still work.");}
  },[saved]);
  useEffect(()=>{
    if(!fullScreen)return;
    const key=e=>{if(e.key==="Escape")setFullScreen(false);};
    document.addEventListener("keydown",key);
    const old=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.removeEventListener("keydown",key);document.body.style.overflow=old;};
  },[fullScreen]);
  function save(){
    if(!ready)return toastMessage(output.error);
    if(type==="wifi"&&v.security!=="nopass"&&!wifiConsent)return toastMessage("Tick the password-storage permission before saving this Wi-Fi code.");
    const name=label.trim()||itemName(type,v);
    const record={id:loadedId||((globalThis.crypto?.randomUUID?.())||Date.now().toString(36)),type,
      values:{...v},label:name,style,savedAt:new Date().toISOString()};
    setSaved(list=>[record,...list.filter(x=>x.id!==record.id)].slice(0,40));
    setLoadedId(record.id);setLabel(name);toastMessage("Saved in My Collection on this device.");
  }
  function openRecord(item){
    setType(item.type);
    setForms(previous=>({...previous,[item.type]:{...initialValues()[item.type],...item.values}}));
    setStyle(QR_STYLES.some(s=>s.id===item.style)?item.style:"emerald");
    setLoadedId(item.id);setLabel(item.label||"");
    setWifiConsent(false);setShowPassword(false);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function removeRecord(item){
    if(!window.confirm("Delete \""+item.label+"\" from this device?"))return;
    setSaved(list=>list.filter(x=>x.id!==item.id));
    if(loadedId===item.id){setLoadedId(null);setLabel("");}
    toastMessage("Removed from your collection.");
  }
  async function withDownload(action){
    if(!ready)return toastMessage(output.error);
    if(working)return;
    setWorking(true);
    try{await action();}catch(e){if(e?.name!=="AbortError")toastMessage(e?.message||"That export is unavailable.");}
    finally{setWorking(false);}
  }
  const slug=safeName(label||itemName(type,v));
  const fileBase=slug.startsWith("rosie-")?slug:"rosie-"+slug;
  function exportFile(kind){
    withDownload(async()=>{
      if(kind==="svg") download(svgBlob(output.svg),fileBase+".svg");
      else if(kind==="png")download(await exportQR(output.svg),fileBase+".png");
      else if(kind==="card") download(await exportKeepsake(output.svg,type,v,style),fileBase+"-printable.png");
      else if(kind==="ics")download(new Blob([eventIcs(v)],{type:"text/calendar;charset=utf-8"}),fileBase+".ics");
      else if(kind==="vcf")download(new Blob([output.payload],{type:"text/vcard;charset=utf-8"}),fileBase+".vcf");
      toastMessage("Download prepared.");
    });
  }
  function share(){
    withDownload(async()=>{
      const blob=type==="calling"?await exportKeepsake(output.svg,type,v,style):await exportQR(output.svg);
      const file=new File([blob],fileBase+".png",{type:"image/png"});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:"Rosie's QR Atelier"});
      }else{download(blob,file.name);toastMessage("Your QR image was downloaded to share.");}
    });
  }
  function copyPayload(){
    if(!ready)return;
    if(!navigator.clipboard?.writeText)return toastMessage("Clipboard unavailable here.");
    navigator.clipboard.writeText(output.payload).then(()=>toastMessage("QR destination copied."),()=>toastMessage("Clipboard permission was denied."));
  }
  const matching=saved.filter(x=>(x.label||"").toLowerCase().includes(filter.trim().toLowerCase())||
    QR_TYPES.find(t=>t.id===x.type)?.label.toLowerCase().includes(filter.trim().toLowerCase()));
  return <main className={"qa-page qa-style-"+style} aria-label="Rosie's QR Atelier">
    <div className="qa-scene">
      <header className="qa-hero" aria-label="Rosie works at her QR atelier">
        <div className="qa-title"><span className="qa-title-flourish">✦</span>
          <h1>QR Atelier</h1><p>Small Codes. Beautiful Connections.</p></div>
      </header>
      <section className="qa-preview-stage" ref={previewRef} aria-label="Live QR preview">
        <div className="qa-ring" aria-label={ready?"QR artwork, ready to scan":"Empty QR frame"}>
          <div className="qa-code-shell">{ready?<div className="qa-svg" dangerouslySetInnerHTML={{__html:output.svg}} role="img" aria-label="Scannable QR code"/>
            :<div className="qa-waiting"><span className="qa-waiting-mark">✧</span><span>Awaiting your creation</span></div>}</div>
          <img className="qa-ring-art" src={ART+"qr-frame.webp"} alt="" aria-hidden="true" draggable="false"/>
          <div className="qa-ring-caption">{ready?"Ready to Share":"Create a Code"}</div>
        </div>
        <div className="qa-preview-actions">
          <button type="button" onClick={()=>setFullScreen(true)} disabled={!ready}>⛶ Full-screen QR</button>
          {type!=="wifi"&&<button type="button" onClick={copyPayload} disabled={!ready}>⧉ Copy QR data</button>}
        </div>
      </section>
      <section className="qa-panel" aria-label="QR code settings">
        <div className="qa-panel-inner">
          <div className="qa-panel-heading"><span>Rosie's Workbench</span><h2>Choose Your Creation</h2></div>
          <QRTypeSelector current={type} onSelect={changeType}/>
          <div className="qa-details-heading"><h3>{QR_TYPES.find(t=>t.id===type).label} Details</h3>
            <span>{QR_TYPES.find(t=>t.id===type).hint}</span>
            <button type="button" className="qa-start-fresh" onClick={()=>{
              if(ready && !window.confirm("Clear these "+QR_TYPES.find(t=>t.id===type).label+" fields and start again?"))return;
              setForms(all=>({...all,[type]:initialValues()[type]}));setLabel("");setLoadedId(null);
              setWifiConsent(false);setShowPassword(false);
              toastMessage("Fresh workspace ready.");
            }}>Clear this form</button></div>
          <div className="qa-inputs" key={type}>
            <Details type={type} v={v} put={put} showPassword={showPassword} setShowPassword={setShowPassword}
              wifiConsent={wifiConsent} setWifiConsent={setWifiConsent}/>
          </div>
          <p className={"qa-validation"+(ready?" qa-valid":"")} role="status">{ready?
            (output.modules>85?"Detailed code. Use Full-screen QR for easier scanning.":"Your QR updates instantly as you type."):
            output.error}</p>
          <div className="qa-section-separator"/>
          <h3 className="qa-design-heading">Atelier Finish</h3>
          <div className="qa-palettes" role="group" aria-label="Presentation finish">
            {QR_STYLES.map(s=><button key={s.id} type="button" aria-pressed={style===s.id}
              className={"qa-palette qa-palette-"+s.id+(style===s.id?" chosen":"")} onClick={()=>setStyle(s.id)}>
              <span className="qa-swatch"/><span>{s.label}</span></button>)}
          </div>
          <p className="qa-hint qa-contrast-note">The QR modules stay black on white for dependable scanning. Finishes decorate the surrounding stationery.</p>
          <div className="qa-save-block">
            <Field label="Save as (optional)" value={label} onChange={setLabel} placeholder={itemName(type,v)}/>
            <button className="qa-save" type="button" disabled={!ready||working} onClick={save}>
              {loadedId?"Update Saved Code":"Save to Collection"}</button>
          </div>
          <div className="qa-actions">
            <button type="button" disabled={!ready||working} onClick={share}>Share</button>
            <button type="button" disabled={!ready||working} onClick={()=>exportFile("png")}>PNG</button>
            <button type="button" disabled={!ready||working} onClick={()=>exportFile("svg")}>SVG</button>
          </div>
          <div className="qa-extra-exports">
            <button type="button" disabled={!ready||working} onClick={()=>exportFile("card")}>
              Download {type==="calling"?"Calling Card":"Designed Card"}</button>
            {type==="event"&&<button type="button" disabled={!ready||working} onClick={()=>exportFile("ics")}>Download .ics Invite</button>}
            {(type==="contact"||type==="calling")&&<button type="button" disabled={!ready||working} onClick={()=>exportFile("vcf")}>Download Contact (.vcf)</button>}
            <button type="button" disabled={!ready} onClick={()=>window.print()}>Print / Save PDF</button>
          </div>
        </div>
      </section>
      <section className="qa-collection" aria-label="Saved QR collection">
        <div className="qa-collection-heading"><h2>My Collection</h2><span>{saved.length} / 40 saved</span></div>
        <p>Stored on this device only. Nothing is uploaded to RosieVerse.</p>
        {saved.length>3&&<label className="qa-search"><span>Find a code</span><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search names or types"/></label>}
        {saved.length===0?<p className="qa-empty">Your personal collection begins with the first code you save.</p>:
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
        </div>}
      </section>
      {ready&&<section className="qa-print-sheet" aria-label="QR Atelier printable card">
        <p className="qa-print-brand">ROSIE'S QR ATELIER</p>
        <h2>{QR_TYPES.find(t=>t.id===type)?.label}</h2>
        <div className="qa-print-code" dangerouslySetInnerHTML={{__html:output.svg}}/>
        <h3>{label||itemName(type,v)}</h3>
        <p>Scan to connect</p>
      </section>}
      <p className="qa-status" role="status" aria-live="polite">{toast}</p>
    </div>
    {fullScreen&&ready&&<div className="qa-fullscreen" role="dialog" aria-modal="true" aria-label="Full-screen scannable QR code">
      <button type="button" className="qa-close" onClick={()=>setFullScreen(false)}>Close ×</button>
      <div className="qa-fullscreen-qr" dangerouslySetInnerHTML={{__html:output.svg}} aria-label="Full-screen QR code"/>
      <span>{QR_TYPES.find(t=>t.id===type)?.label} · Ready to Scan</span>
    </div>}
  </main>;
}
