import test from "node:test";
import assert from "node:assert/strict";
import {
  QR_TYPES,QR_STYLES,initialValues,cleanUrl,escapeWifi,makeVcard,zoomLink,
  instagramLink,calendarDate,calendarLink,eventIcs,qrPayload,qrByteString
} from "./qrAtelierLogic.js";

test("studio contains the eight approved QR types and three finishes",()=>{
  assert.deepEqual(QR_TYPES.map(x=>x.id),["wifi","contact","website","zoom","event","payment","instagram","calling"]);
  assert.equal(QR_STYLES.length,3);
  assert.equal(initialValues().event.timezone.length>0,true);
});
test("Wi-Fi escaping includes special characters and proper format",()=>{
  assert.equal(qrPayload("wifi",{ssid:'My;Wi,Fi: "A"',password:'a;b:c\\d',security:"WPA",hidden:true}),
    'WIFI:T:WPA;S:My\\;Wi\\,Fi\\: \\"A\\";P:a\\;b\\:c\\\\d;H:true;;');
  assert.equal(qrPayload("wifi",{ssid:"Public",password:"",security:"nopass",hidden:false}),
    "WIFI:T:nopass;S:Public;P:;H:false;;");
  assert.throws(()=>qrPayload("wifi",{ssid:"A",security:"WPA",password:""}),/password/);
});
test("international names and emoji are UTF-8 bytes in QR segments",()=>{
  const phrase="Rémi · 東京 · 🐾";
  const segment=qrByteString(phrase);
  assert.equal(Buffer.from(segment,"binary").toString("utf8"),phrase);
});
test("vCard builds interoperable details and escapes punctuation",()=>{
  const value=makeVcard({name:"Mia, L.",phone:"+1 (555) 123-4567",email:"mia@example.com",
    organization:"Rosie; Atelier",title:"Designer",website:"rosie.example.com",address:"Boca, FL"});
  assert.match(value,/BEGIN:VCARD\r\nVERSION:3.0\r\n/);
  assert.match(value,/FN:Mia\\, L\./);
  assert.match(value,/ORG:Rosie\\; Atelier/);
  assert.match(value,/TEL;TYPE=CELL:/);
  assert.match(value,/URL:https:\/\/rosie.example.com\//);
  assert.match(value,/LABEL;TYPE=WORK:Boca\\, FL/);
  assert.throws(()=>makeVcard({name:"Name"}),/at least one/);
  assert.throws(()=>makeVcard({name:"Name",email:"not-email"}),/valid email/);
});
test("website URLs support bare domains while rejecting unsafe schemes",()=>{
  assert.equal(cleanUrl("example.com/a"),"https://example.com/a");
  assert.equal(cleanUrl("http://example.com"),"http://example.com/");
  assert.throws(()=>cleanUrl("javascript:alert(1)"),/Only http/);
  assert.throws(()=>cleanUrl("https://name:secret@example.com"),/valid web address/);
});
test("Zoom extracts only official links from copied invitations",()=>{
  assert.equal(zoomLink("Join Zoom Meeting\nhttps://us02web.zoom.us/j/123456?pwd=abc\nMeeting ID: 123"),
    "https://us02web.zoom.us/j/123456?pwd=abc");
  assert.throws(()=>zoomLink("https://zoom.us.evil.example.com/j/123"),/official Zoom/);
});
test("Instagram handles and official URLs work",()=>{
  assert.equal(instagramLink("@Rosie.The.Dog"),"https://www.instagram.com/Rosie.The.Dog/");
  assert.equal(instagramLink("https://www.instagram.com/rosie/"),"https://www.instagram.com/rosie/");
  assert.throws(()=>instagramLink("https://bad.example.com/rosie"),/Instagram/);
  assert.throws(()=>instagramLink("invalid handle"),/username/);
});
test("event timezone link retains local times and can produce ICS",()=>{
  const v={title:"Evening Party",start:"2026-12-12T19:30",end:"2026-12-12T22:00",timezone:"America/New_York",location:"Boca Raton",details:"Welcome"};
  assert.equal(calendarDate(v.start),"20261212T193000");
  const u=new URL(calendarLink(v));
  assert.equal(u.hostname,"calendar.google.com");
  assert.equal(u.searchParams.get("dates"),"20261212T193000/20261212T220000");
  assert.equal(u.searchParams.get("ctz"),"America/New_York");
  const ics=eventIcs(v);
  assert.match(ics,/BEGIN:VCALENDAR/);
  assert.match(ics,/DTSTART;TZID=America\/New_York:20261212T193000/);
  assert.throws(()=>calendarLink({...v,end:"2026-12-12T18:00"}),/end after/);
  assert.throws(()=>calendarLink({...v,timezone:"Mars/Olympus"}),/valid time zone/);
  assert.throws(()=>calendarDate("2026-02-30T10:00"),/real calendar date/);
});
test("payment links never generate their own payment requests",()=>{
  assert.equal(qrPayload("payment",{url:"https://paypal.me/rosie"}),"https://paypal.me/rosie");
  assert.throws(()=>qrPayload("payment",{url:"mailto:a@b.com"}),/Only http/);
});
test("Calling Card encodes a vCard, not an arbitrary website",()=>{
  assert.match(qrPayload("calling",{name:"Rosie",phone:"555-0100",title:"Artisan"}),/BEGIN:VCARD/);
});
