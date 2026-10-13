/* Rosie's QR Atelier: scanner-conscious, entirely local artwork.
 * Decorative elements occupy only the perimeter beyond the QR's quiet zone.
 * A center paw (optional) uses H correction, but still requires a real-device scan test.
 */
import qrcode from "qrcode-generator";
import {qrByteString} from "./qrAtelierLogic.js";

export const QR_DESIGNS = [
  {id:"classic", label:"Classic", note:"Pure scanning simplicity", mark:"▦"},
  {id:"royal", label:"Royal Rosie Seal", note:"Fine gold filigree", mark:"♛"},
  {id:"paw", label:"The Paw Print", note:"A subtle paw-shaped flourish", mark:"♧"},
  {id:"bone", label:"The Golden Bone", note:"Rosie's favorite treasure", mark:"◇"},
  {id:"atelier", label:"Atelier Original", note:"Etched by Rosie", mark:"✧"}
];

const INKS = {
  emerald:{dark:"#062f27",accent:"#b68c46",light:"#fffef9"},
  obsidian:{dark:"#14202a",accent:"#ae8b50",light:"#fffefa"},
  burgundy:{dark:"#54152e",accent:"#b68e56",light:"#fffdf8"}
};
const fmt=n=>Number(n.toFixed(3));
const ellipse=(cx,cy,rx,ry,fill)=>`<ellipse cx="${fmt(cx)}" cy="${fmt(cy)}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
function flourish(kind,size,accent){
  if(kind==="classic")return "";
  const c=fmt(size/2),s=fmt(size);
  const border=`<rect x="1.5" y="1.5" width="${fmt(size-3)}" height="${fmt(size-3)}" rx="1.4" fill="none" stroke="${accent}" stroke-width=".28"/>`;
  if(kind==="royal"){
    return border+`<path d="M ${fmt(c-4)} 3.45 l1.2 -1.2 2.8 1.55 2.8 -1.55 1.2 1.2 -1 1.05 h-6z M ${fmt(c-2)} ${fmt(s-3)} q2 -1.5 4 0" fill="none" stroke="${accent}" stroke-width=".36" stroke-linejoin="round"/>`+
      `<circle cx="${c}" cy="3.2" r=".35" fill="${accent}"/>`;
  }
  if(kind==="paw"){
    return border+ellipse(c-1.35,3.1,.55,.68,accent)+ellipse(c-.45,2.55,.48,.62,accent)+
      ellipse(c+.45,2.55,.48,.62,accent)+ellipse(c+1.35,3.1,.55,.68,accent)+
      `<path d="M ${fmt(c-1.45)} 5 Q ${fmt(c-1.55)} 4.1 ${fmt(c-.55)} 3.95 Q ${c} 3.25 ${fmt(c+.55)} 3.95 Q ${fmt(c+1.55)} 4.1 ${fmt(c+1.45)} 5 Q ${c} 5.75 ${fmt(c-1.45)} 5" fill="${accent}"/>`;
  }
  if(kind==="bone"){
    return border+`<path d="M ${fmt(c-3)} 4 C ${fmt(c-5.5)} .6 ${fmt(c-7)} 3.6 ${fmt(c-5)} 4.9 H ${fmt(c+5)} C ${fmt(c+7)} 3.6 ${fmt(c+5.5)} .6 ${fmt(c+3)} 4 Q ${c} 3.35 ${fmt(c-3)} 4 Z" fill="none" stroke="${accent}" stroke-width=".38"/>`;
  }
  // Four technical engraving flourishes, well clear of the four-module quiet zone.
  return border+`<g fill="none" stroke="${accent}" stroke-width=".36"><path d="M 3 6 V 3 H 6 M ${fmt(s-6)} 3 H ${fmt(s-3)} V 6 M 3 ${fmt(s-6)} V ${fmt(s-3)} H 6 M ${fmt(s-6)} ${fmt(s-3)} H ${fmt(s-3)} V ${fmt(s-6)}"/><circle cx="${c}" cy="3.7" r="1.1"/><path d="M ${fmt(c-2.3)} 3.7 H ${fmt(c+2.3)} M ${c} 1.8 V 5.6"/></g>`;
}
function isFinder(row,col,n){
  return (row<8 && col<8)||(row<8 && col>=n-8)||(row>=n-8 && col<8);
}
function isFinderCore(row,col,n){
  return (row<7 && col<7)||(row<7 && col>=n-7)||(row>=n-7 && col<7);
}
function softFinder(x,y,ink){
  return `<rect x="${x}" y="${y}" width="7" height="7" rx=".9" fill="${ink.dark}"/>`+
    `<rect x="${x+1}" y="${y+1}" width="5" height="5" rx=".65" fill="${ink.light}"/>`+
    `<rect x="${x+2}" y="${y+2}" width="3" height="3" rx=".5" fill="${ink.dark}"/>`;
}
function pawCenter(n,offset,ink){
  const x=fmt(offset+n/2), y=fmt(offset+n/2);
  const r=fmt(Math.min(3.7,n*.068)),k=fmt(r*.55),p=fmt(r*.27);
  return `<circle cx="${x}" cy="${y}" r="${fmt(r+0.36)}" fill="#fffef9"/>`+
    `<circle cx="${x}" cy="${fmt(y+0.36*r)}" r="${k}" fill="${ink}"/>`+
    ellipse(x-r*.68,y-r*.48,p,p*1.24,ink)+ellipse(x-r*.23,y-r*.76,p,p*1.24,ink)+
    ellipse(x+r*.23,y-r*.76,p,p*1.24,ink)+ellipse(x+r*.68,y-r*.48,p,p*1.24,ink);
}
export function makeRosieQr(payload,{style="emerald",design="royal",rounded=false,centerPaw=false}={}){
  const ink=INKS[style]||INKS.emerald;
  const valid=QR_DESIGNS.some(x=>x.id===design)?design:"classic";
  const qr=qrcode(0,centerPaw?"H":"M");
  qr.addData(qrByteString(payload),"Byte");qr.make();
  const n=qr.getModuleCount(),o=8,N=n+2*o;
  const pieces=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="640" height="640" role="img" aria-label="QR code">`,
    `<rect width="${N}" height="${N}" fill="${ink.light}"/>`,
    flourish(valid,N,ink.accent)];
  // Keep finder, timing and alignment patterns square; only ordinary data modules can soften.
  let squares="";
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    if(!qr.isDark(row,col))continue;
    const x=col+o,y=row+o;
    // Retain the full 7x7 finder geometry, rendered as a rounded nested eye.
    if(rounded&&isFinderCore(row,col,n))continue;
    if(rounded&&!isFinder(row,col,n)){
      pieces.push(`<rect x="${x}" y="${y}" width="1" height="1" rx=".17" fill="${ink.dark}"/>`);
    }else{
      squares+=`M${x} ${y}h1v1h-1z`;
    }
  }
  pieces.push(`<path fill="${ink.dark}" d="${squares}"/>`);
  if(rounded)pieces.push(softFinder(o,o,ink)+softFinder(o+n-7,o,ink)+softFinder(o,o+n-7,ink));
  // Optional central crest is deliberately small. Even with H correction, test on a phone.
  if(centerPaw && n<=61)pieces.push(pawCenter(n,o,ink.dark));
  pieces.push("</svg>");
  return {svg:pieces.join(""),modules:n,quietZone:8,centerApplied:Boolean(centerPaw&&n<=61)};
}
