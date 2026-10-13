/* Portable, server-free QR payloads. Keep all user data on-device. */
export const QR_TYPES = [
  { id:"website", label:"Website", mark:"◎", hint:"Open any website" },
  { id:"wifi", label:"Wi-Fi", mark:"⌁", hint:"Instant guest-network access" },
  { id:"instagram", label:"Instagram", mark:"◉", hint:"Visit an Instagram profile" },
  { id:"zoom", label:"Zoom", mark:"▣", hint:"Join a Zoom meeting" },
  { id:"contact", label:"Contact", mark:"♙", hint:"Save details to Contacts" },
  { id:"event", label:"Event", mark:"▦", hint:"Add an event to a calendar" },
  { id:"payment", label:"Payment", mark:"◇", hint:"Open a payment link" },
  { id:"calling", label:"Calling Card", mark:"▤", hint:"Share your professional identity" }
];
export const QR_STYLES = [
  {id:"emerald",label:"Emerald",dark:"#072b23",accent:"#cfad64",light:"#f7eddb"},
  {id:"obsidian",label:"Obsidian",dark:"#101a24",accent:"#c9a35e",light:"#faf0db"},
  {id:"burgundy",label:"Burgundy",dark:"#4e102a",accent:"#d7b57c",light:"#fff0dd"},
  {id:"champagne",label:"Champagne",dark:"#514126",accent:"#f5d48c",light:"#fff8e8"},
  {id:"sapphire",label:"Sapphire",dark:"#071a41",accent:"#a6ccf4",light:"#f0f8ff"}
];
export function initialValues() {
  return {
    wifi:{ssid:"",password:"",security:"WPA",hidden:false},
    contact:{name:"",phone:"",email:"",organization:"",website:"",title:"",address:""},
    website:{url:"https://"},zoom:{url:""},
    event:{title:"",start:"",end:"",location:"",details:"",timezone: Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC"},
    payment:{url:"",provider:"other"},
    instagram:{handle:""},
    calling:{name:"",title:"",organization:"",phone:"",email:"",website:"",address:"",tagline:""}
  };
}
export function cleanUrl(input, {allowBare=true}={}) {
  const text=String(input||"").trim();
  if(!text||text==="https://")throw Error("Add a website address.");
  if(/[\s<>]/.test(text))throw Error("Enter one valid web address without spaces.");
  if(/^[a-z][a-z0-9+.-]*:/i.test(text)&& !/^https?:\/\//i.test(text))
    throw Error("Only http and https links are supported.");
  const raw=/^https?:\/\//i.test(text)?text:(allowBare?"https://"+text:text);
  try {
    const u=new URL(raw);
    if(!["http:","https:"].includes(u.protocol)||!u.hostname.includes(".")||u.username||u.password)
      throw Error();
    return u.toString();
  }catch{throw Error("Enter a complete, valid web address.");}
}
export function escapeWifi(value) {
  return String(value||"").replace(/([\\;,:"])/g,"\\$1");
}
export function escapeVcard(value) {
  return String(value||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
export function makeVcard(v) {
  const name=(v.name||"").trim();
  if(!name)throw Error("Enter a name.");
  if(!String(v.phone||"").trim()&&!String(v.email||"").trim()&&!String(v.website||"").trim())
    throw Error("Include at least one phone, email, or website.");
  if(v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
    throw Error("Enter a valid email address.");
  const lines=["BEGIN:VCARD","VERSION:3.0","FN:"+escapeVcard(name)];
  if(v.organization?.trim())lines.push("ORG:"+escapeVcard(v.organization.trim()));
  if(v.title?.trim())lines.push("TITLE:"+escapeVcard(v.title.trim()));
  if(v.phone?.trim())lines.push("TEL;TYPE=CELL:"+escapeVcard(v.phone.trim()));
  if(v.email?.trim())lines.push("EMAIL;TYPE=INTERNET:"+v.email.trim());
  if(v.website?.trim())lines.push("URL:"+cleanUrl(v.website));
  if(v.address?.trim())lines.push("LABEL;TYPE=WORK:"+escapeVcard(v.address.trim()));
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
export function zoomLink(value) {
  const raw=String(value||"").trim();
  const embedded=raw.match(/https?:\/\/[^\s<>"']+/i);
  const candidate=(embedded?embedded[0]:raw).replace(/[),.;]+$/,"");
  const link=cleanUrl(candidate,{allowBare:false});
  const host=new URL(link).hostname.toLowerCase();
  if(!["zoom.us","zoom.com","zoomgov.com"].some(base=>host===base||host.endsWith("."+base)))
    throw Error("Use an official Zoom meeting URL.");
  return link;
}
export function instagramLink(value) {
  const raw=String(value||"").trim();
  let handle=raw;
  if(/^https?:\/\//i.test(raw)) {
    const u=new URL(cleanUrl(raw));
    if(!["instagram.com","www.instagram.com","m.instagram.com"].includes(u.hostname.toLowerCase()))
      throw Error("Enter an Instagram profile address.");
    handle=u.pathname.split("/").filter(Boolean)[0]||"";
  }
  handle=handle.replace(/^@/,"");
  if(!/^[A-Za-z0-9._]{1,30}$/.test(handle))throw Error("Enter a valid Instagram username.");
  return "https://www.instagram.com/"+handle+"/";
}
export function calendarDate(local) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error("Choose a valid date and time.");
  const date=new Date(local+":00");
  if(!Number.isFinite(date.getTime())||date.getFullYear()!==Number(local.slice(0,4))||
     date.getMonth()+1!==Number(local.slice(5,7))||date.getDate()!==Number(local.slice(8,10))||
     date.getHours()!==Number(local.slice(11,13))||date.getMinutes()!==Number(local.slice(14,16)))
    throw Error("Choose a real calendar date.");
  return local.replace(/[-:]/g,"")+"00";
}
export function calendarLink(v) {
  if(!v.title?.trim()||!v.start||!v.end)throw Error("Enter the event name, start, and end.");
  const start=calendarDate(v.start),end=calendarDate(v.end);
  if(v.end<=v.start)throw Error("The event must end after it starts.");
  const timeZone=v.timezone?.trim()||"UTC";
  try{new Intl.DateTimeFormat("en-US",{timeZone});}catch{throw Error("Enter a valid time zone such as America/New_York.");}
  const params=new URLSearchParams({
    action:"TEMPLATE",text:v.title.trim(),dates:start+"/"+end,
    details:v.details||"",location:v.location||"",ctz:timeZone
  });
  return "https://calendar.google.com/calendar/render?"+params.toString();
}
export function eventIcs(v) {
  calendarLink(v); // Validate exactly the same fields and TZ identifier.
  const esc=s=>String(s||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
  const dt=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//RosieVerse//QR Atelier//EN","BEGIN:VEVENT",
    "UID:rosie-"+Math.random().toString(36).slice(2)+"@rosieverse.local",
    "DTSTAMP:"+dt,"DTSTART;TZID="+v.timezone+":"+calendarDate(v.start),
    "DTEND;TZID="+v.timezone+":"+calendarDate(v.end),
    "SUMMARY:"+esc(v.title),"LOCATION:"+esc(v.location),"DESCRIPTION:"+esc(v.details),
    "END:VEVENT","END:VCALENDAR",""].join("\r\n");
}
export function qrPayload(type,v) {
  switch(type) {
    case "wifi":{
      if(!v.ssid?.trim())throw Error("Enter the Wi-Fi network name.");
      if(v.security!=="nopass"&&!v.password)throw Error("Enter the network password.");
      if(!["WPA","WEP","nopass"].includes(v.security))throw Error("Choose a Wi-Fi security type.");
      return "WIFI:T:"+v.security+";S:"+escapeWifi(v.ssid)+";P:"+
        (v.security==="nopass"?"":escapeWifi(v.password))+";H:"+(v.hidden?"true":"false")+";;";
    }
    case "contact":case "calling":return makeVcard(v);
    case "website":return cleanUrl(v.url);
    case "payment":return cleanUrl(v.url);
    case "zoom":return zoomLink(v.url);
    case "instagram":return instagramLink(v.handle);
    case "event":return calendarLink(v);
    default:throw Error("Select a QR code type.");
  }
}
export function itemName(type,v) {
  switch(type){
    case "wifi":return v.ssid||"Wi-Fi";
    case "contact":case "calling":return v.name||"Contact";
    case "event":return v.title||"Event";
    case "instagram":return v.handle?.replace(/^@/,"")||"Instagram";
    default:return (v.url||type).replace(/^https?:\/\//,"").slice(0,60);
  }
}
export function qrByteString(input) {
  const bytes=new TextEncoder().encode(input);
  // qrcode-generator's Byte segment accepts bytes represented by char codes.
  // Unicode is first encoded as UTF-8 to avoid corrupt names and SSIDs.
  let result="";
  for(let i=0;i<bytes.length;i++)result+=String.fromCharCode(bytes[i]);
  return result;
}
