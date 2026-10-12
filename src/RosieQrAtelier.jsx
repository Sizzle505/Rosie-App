import React, { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import "./RosieQrAtelier.css";

const ART = "/qr-atelier/";
const STORE_KEY = "rosieverse.qr-atelier.collection.v1";
const TYPES = [
  {id:"wifi",label:"Wi-Fi",glyph:"⌁"},
  {id:"contact",label:"Contact",glyph:"♙"},
  {id:"website",label:"Website",glyph:"◎"},
  {id:"zoom",label:"Zoom",glyph:"▣"},
  {id:"event",label:"Event",glyph:"▦"},
  {id:"payment",label:"Payment",glyph:"◇"},
  {id:"instagram",label:"Instagram",glyph:"◉"},
  {id:"calling",label:"Calling Card",glyph:"▤"}
];
const STYLES = [
  {id:"obsidian",label:"Obsidian & Gold"},
  {id:"emerald",label:"Emerald & Gold"},
  {id:"burgundy",label:"Burgundy & Ivory"}
];
const EMPTY = {
  wifi:{ssid:"",password:"",security:"WPA",hidden:false},
  contact:{name:"",phone:"",email:"",organization:"",website:""},
  website:{url:""},
  zoom:{url:""},
  event:{title:"",start:"",end:"",location:"",details:"",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"},
  payment:{url:""},
  instagram:{handle:""},
  calling:{name:"",title:"",organization:"",phone:"",email:"",website:""}
};
function getSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(x=>TYPES.some(t=>t.id===x.type) && x.values && typeof x.values==="object").slice(0,35) : [];
  } catch { return []; }
}
function escapeWifi(value) { return String(value || "").replace(/([\\;,:"])/g,"\\$1"); }
function escapeVcard(value) { return String(value || "").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
function validLink(value) {
  try {
    const u = new URL(String(value||"").trim());
    if (!["https:","http:"].includes(u.protocol) || !u.hostname.includes(".")) throw Error();
    return u.href;
  } catch { throw Error("Enter a complete http:// or https:// link."); }
}
function makeVcard(v) {
  const name = (v.name||"").trim();
  if (!name) throw Error("Enter a name.");
  const lines = ["BEGIN:VCARD","VERSION:3.0","FN:"+escapeVcard(name)];
  if (v.organization) lines.push("ORG:"+escapeVcard(v.organization));
  if (v.title) lines.push("TITLE:"+escapeVcard(v.title));
  if (v.phone) lines.push("TEL;TYPE=CELL:"+v.phone.trim());
  if (v.email) lines.push("EMAIL:"+v.email.trim());
  if (v.website) lines.push("URL:"+validLink(v.website));
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
function formatCalendarDate(value) { return value.replace(/[-:]/g,"").replace("T","T")+"00"; }
function createPayload(type,v) {
  if (type==="wifi") {
    if (!v.ssid.trim()) throw Error("Enter the Wi-Fi network name.");
    return "WIFI:T:"+v.security+";S:"+escapeWifi(v.ssid)+";P:"+(v.security==="nopass"?"":escapeWifi(v.password))+";H:"+(v.hidden?"true":"false")+";;";
  }
  if (type==="contact"||type==="calling") return makeVcard(v);
  if (type==="website"||type==="payment") return validLink(v.url);
  if (type==="zoom") {
    const link=validLink(v.url), hostname=new URL(link).hostname;
    if (!["zoom.us","zoom.com","zoomgov.com"].some(base => hostname === base || hostname.endsWith("."+base))) throw Error("Enter an official Zoom meeting invitation URL.");
    return link;
  }
  if (type==="instagram") {
    const name=v.handle.trim().replace(/^@/,"");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(name)) throw Error("Enter a valid Instagram username.");
    return "https://www.instagram.com/"+name+"/";
  }
  if (type==="event") {
    if (!v.title.trim()||!v.start||!v.end) throw Error("Enter an event name, start, and end.");
    if (v.end<=v.start) throw Error("The event must end after it starts.");
    const q=new URLSearchParams({action:"TEMPLATE",text:v.title.trim(),dates:formatCalendarDate(v.start)+"/"+formatCalendarDate(v.end),details:v.details,location:v.location,ctz:v.timezone||"UTC"});
    return "https://calendar.google.com/calendar/render?"+q.toString();
  }
  throw Error("Choose a QR format.");
}
function safeFields(type,values) { return {...EMPTY[type],...values}; }
function getQrSvg(payload) {
  const qr=qrcode(0,"M");
  qr.addData(payload,"Byte");
  qr.make();
  return qr.createSvgTag({cellSize:7,margin:4,scalable:true});
}
function downloadBlob(blob,filename) {
  const href=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=href;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(href),2000);
}
async function imageFromSvg(svg) {
  const blob=new Blob([svg],{type:"image/svg+xml;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  try {
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
    const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=1200;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,1200,1200);
    ctx.drawImage(img,0,0,1200,1200);
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Export unavailable.")),"image/png"));
  } finally { URL.revokeObjectURL(url); }
}
function Field({label,value,onChange,type="text",placeholder="",required=false}) {
  return <label className="qa-field"><span>{label}</span><input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}/></label>;
}

export default function RosieQrAtelier() {
  const [type,setType]=useState("website");
  const [form,setForm]=useState(EMPTY);
  const [style,setStyle]=useState("emerald");
  const [collection,setCollection]=useState(getSaved);
  const [allowWifiSave,setAllowWifiSave]=useState(false);
  const [fullScreen,setFullScreen]=useState(false);
  const [toast,setToast]=useState("");
  const [assetFailed,setAssetFailed]=useState({});
  const v=form[type];
  const put=(key,value)=>setForm(old=>({...old,[type]:{...old[type],[key]:value}}));
  const calculated=useMemo(()=>{
    try { const payload=createPayload(type,v);return {payload,svg:getQrSvg(payload),error:""}; }
    catch(e) { return {payload:"",svg:"",error:e.message||"Please check these fields."}; }
  },[type,v]);
  const svg=calculated.svg;
  const valid=Boolean(svg);
  useEffect(()=>{
    try { localStorage.setItem(STORE_KEY,JSON.stringify(collection)); }
    catch { setToast("Local storage is unavailable on this device."); }
  },[collection]);
  const message=(value)=>{setToast(value);window.setTimeout(()=>setToast(""),3600);};
  const itemTitle=()=>{
    if(type==="wifi")return v.ssid;
    if(type==="contact"||type==="calling")return v.name;
    if(type==="event")return v.title;
    if(type==="instagram")return "@"+v.handle.replace(/^@/,"");
    return v.url.replace("https://","").replace("http://","").slice(0,55);
  };
  function save() {
    if(!valid)return message(calculated.error);
    if(type==="wifi"&&!allowWifiSave)return message("Select the Wi-Fi credential storage checkbox first.");
    setCollection(list=>[{id:crypto.randomUUID?.()||String(Date.now()),type,values:{...v},style,label:itemTitle()||TYPES.find(t=>t.id===type).label},...list].slice(0,35));
    message("Saved to this device.");
  }
  async function download(fmt) {
    if(!valid)return message(calculated.error);
    try {
      const name="rosie-qr-"+type;
      if(fmt==="svg")downloadBlob(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}),name+".svg");
      else downloadBlob(await imageFromSvg(svg),name+".png");
      message("Your QR is ready to download.");
    } catch(e){message(e.message||"Export failed.");}
  }
  async function share() {
    if(!valid)return message(calculated.error);
    try {
      const blob=await imageFromSvg(svg), file=new File([blob],"rosie-qr.png",{type:"image/png"});
      if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:"QR Atelier"});
      else {downloadBlob(blob,"rosie-qr.png");message("Downloaded PNG to share.");}
    } catch(e){if(e.name!=="AbortError")message("Sharing is unavailable. Please download instead.");}
  }
  function loadSaved(item) {
    setType(item.type);setForm(old=>({...old,[item.type]:safeFields(item.type,item.values)}));
    setStyle(item.style||"emerald");setAllowWifiSave(false);message("Loaded "+item.label+".");
    document.querySelector(".qa-hero")?.scrollIntoView({behavior:"smooth"});
  }
  const fields=()=>{
    switch(type) {
      case "wifi":return <>
        <Field label="Network name (SSID)" value={v.ssid} onChange={x=>put("ssid",x)} placeholder="Your network"/>
        <label className="qa-field"><span>Security</span><select value={v.security} onChange={e=>put("security",e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label>
        {v.security!=="nopass"&&<Field label="Password" type="text" value={v.password} onChange={x=>put("password",x)} placeholder="Network password"/>}
        <label className="qa-check"><input type="checkbox" checked={v.hidden} onChange={e=>put("hidden",e.target.checked)}/> Hidden network</label>
        <label className="qa-check"><input type="checkbox" checked={allowWifiSave} onChange={e=>setAllowWifiSave(e.target.checked)}/> Allow saving Wi-Fi credentials locally on this device</label>
      </>;
      case "contact": case "calling": return <>
        <Field label="Full name" value={v.name} onChange={x=>put("name",x)} placeholder="First and last name"/>
        {type==="calling"&&<Field label="Professional title" value={v.title} onChange={x=>put("title",x)} placeholder="Your title"/>}
        <Field label="Company" value={v.organization} onChange={x=>put("organization",x)}/>
        <Field label="Phone" type="tel" value={v.phone} onChange={x=>put("phone",x)}/>
        <Field label="Email" type="email" value={v.email} onChange={x=>put("email",x)}/>
        <Field label="Website (optional)" value={v.website} onChange={x=>put("website",x)} placeholder="https://"/>
        {type==="calling"&&<p className="qa-hint">Calling Card uses an enhanced display and the same interoperable vCard QR format.</p>}
      </>;
      case "event":return <>
        <Field label="Event title" value={v.title} onChange={x=>put("title",x)} placeholder="Event name"/>
        <div className="qa-duo">
          <Field label="Starts" type="datetime-local" value={v.start} onChange={x=>put("start",x)}/>
          <Field label="Ends" type="datetime-local" value={v.end} onChange={x=>put("end",x)}/>
        </div>
        <Field label="Time zone" value={v.timezone} onChange={x=>put("timezone",x)} placeholder="America/New_York"/>
        <Field label="Location" value={v.location} onChange={x=>put("location",x)}/>
        <label className="qa-field"><span>Details</span><textarea rows="3" value={v.details} onChange={e=>put("details",e.target.value)} placeholder="Optional event description"/></label>
        <p className="qa-hint">Opens a prefilled Google Calendar invitation. The recipient reviews and adds the event.</p>
      </>;
      case "instagram":return <Field label="Instagram username" value={v.handle} onChange={x=>put("handle",x)} placeholder="@rosie"/>;
      case "zoom":return <Field label="Zoom meeting invitation link" value={v.url} onChange={x=>put("url",x)} placeholder="https://us02web.zoom.us/j/..."/>;
      case "payment":return <><Field label="Payment link" value={v.url} onChange={x=>put("url",x)} placeholder="https://"/><p className="qa-hint">Paste a valid payment URL supplied by your payment provider. Rosie never processes payments.</p></>;
      default:return <Field label="Website URL" value={v.url} onChange={x=>put("url",x)} placeholder="https://example.com"/>;
    }
  };
  return <main className={"qa-page qa-style-"+style} aria-label="Rosie's QR Atelier">
    <div className="qa-scene">
      <header className="qa-hero">
        <div className="qa-title"><span className="qa-title-flourish">✦</span><h1>QR Atelier</h1><p>Crafted Connections</p></div>
      </header>
      <section className="qa-preview-stage" aria-label="Your live QR code">
        <div className="qa-ring">
          {!assetFailed.frame&&<img className="qa-ring-art" src={ART+"qr-frame.webp"} onError={()=>setAssetFailed(a=>({...a,frame:true}))} alt=""/>}
          <div className="qa-code-shell">
            {valid?<div className="qa-svg" dangerouslySetInnerHTML={{__html:svg}} aria-label="Generated QR code"/>:<div className="qa-waiting"><span className="qa-waiting-mark">✧</span><span>Your code will appear here</span></div>}
          </div>
          <div className="qa-ring-caption">{valid?"Ready to Scan":"Awaiting Your Details"}</div>
        </div>
        <button type="button" className="qa-zoom" onClick={()=>setFullScreen(true)} disabled={!valid}>Enlarge QR for scanning ↗</button>
      </section>
      <section className="qa-panel" aria-label="QR design and creation controls">
        <div className="qa-panel-inner">
          <h2>Compose Your Code</h2>
          <div className="qa-formats" role="group" aria-label="QR code types">
            {TYPES.map(t=><button key={t.id} type="button" className={"qa-type "+(type===t.id?"selected":"")} onClick={()=>setType(t.id)} aria-pressed={type===t.id}><span className="qa-type-symbol" aria-hidden="true">{t.glyph}</span><span>{t.label}</span></button>)}
          </div>
          <div className="qa-inputs">{fields()}</div>
          <div className="qa-validation" aria-live="polite">{valid?"QR code updates automatically as you type.":calculated.error}</div>
          <h3>Design Style</h3>
          <div className="qa-palettes" role="group" aria-label="QR presentation styles">
            {STYLES.map(s=><button key={s.id} type="button" className={"qa-palette qa-palette-"+s.id+(style===s.id?" chosen":"")} onClick={()=>setStyle(s.id)} aria-pressed={style===s.id}><span className="qa-swatch"/>{s.label}</button>)}
          </div>
          <button type="button" className="qa-save" onClick={save} disabled={!valid}>Save to Collection</button>
          <div className="qa-actions">
            <button type="button" onClick={share} disabled={!valid}>Share</button>
            <button type="button" onClick={()=>download("png")} disabled={!valid}>Download PNG</button>
            <button type="button" onClick={()=>download("svg")} disabled={!valid}>SVG</button>
          </div>
        </div>
      </section>
      <section className="qa-collection" aria-label="Saved QR collection">
        <div className="qa-collection-heading"><h2>My Collection</h2><span>{collection.length} saved</span></div>
        {collection.length===0?<p>Your saved codes will appear here, on this device.</p>:
        <div className="qa-saved-grid">{collection.map(item=><div className="qa-saved" key={item.id}>
          <button type="button" onClick={()=>loadSaved(item)}><span>{TYPES.find(t=>t.id===item.type)?.label}</span><strong>{item.label}</strong></button>
          <button type="button" className="qa-remove" aria-label={"Delete "+item.label} onClick={()=>setCollection(c=>c.filter(x=>x.id!==item.id))}>×</button>
        </div>)}</div>}
      </section>
      <div className="qa-scanner-note"><strong>Document Scanner</strong><span>Coming soon · jscanify-powered capture</span></div>
      <p className="qa-status" role="status" aria-live="polite">{toast}</p>
    </div>
    {fullScreen&&valid&&<div className="qa-fullscreen" role="dialog" aria-modal="true" aria-label="Enlarged QR code">
      <button type="button" className="qa-close" onClick={()=>setFullScreen(false)}>Close ×</button>
      <div dangerouslySetInnerHTML={{__html:svg}} className="qa-fullscreen-qr"/>
      <span>Scan with your phone's camera</span>
    </div>}
  </main>;
}
