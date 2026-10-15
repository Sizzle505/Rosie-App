/**
 * 2026-10-14 source-verified background pack.
 * Seven scenic plates + three transparent, slow-moving depth layers.
 * All images stay BEHIND the collision-registered tunnel lip/formation sprites.
 *
 * Exact provenance, SHA256 and size: public/ember-drill/new-assets/integration-manifest.json
 * Original 3072px PNGs are archived in the user-approved Dropbox pack.
 */
export const NEW_EMBER_BACKGROUND_ART = Object.freeze({
  bg01:"new-assets/background/bg01.webp",
  bg02:"new-assets/background/bg02.webp",
  bg03:"new-assets/background/bg03.webp",
  bg04:"new-assets/background/bg04.webp",
  bg05:"new-assets/background/bg05.webp",
  bg06:"new-assets/background/bg06.webp",
  bg07:"new-assets/background/bg07.webp",
  bg08:"new-assets/background/bg08.webp",
  bg09:"new-assets/background/bg09.webp",
  bg10:"new-assets/background/bg10.webp",
});
const parallaxLayers=[
  {key:"bg02",start:0,end:37,speed:.15,alpha:.85},
  {key:"bg07",start:37,end:58,speed:.11,alpha:.8},
  {key:"bg09",start:52,end:75,speed:.06,alpha:.82},
];
const ready=img=>Boolean(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function paintNewBackgroundParallax(c,s,assets,W,H){
  for(const layer of parallaxLayers){
    if(s.time<layer.start||s.time>layer.end)continue;
    const im=assets?.[layer.key];
    if(!ready(im))continue;
    // Original composite already carries genuine alpha; never apply opaque
    // rectangular overlays or paint beneath the wall as new collision shapes.
    const sw=Math.min(im.naturalWidth,im.naturalHeight*W/H);
    const travel=Math.max(0,im.naturalWidth-sw);
    const dist=s.scroll*layer.speed;
    // Ping-pong world-space texture phase avoids visible wrap discontinuities.
    const q=travel>0?(dist%(travel*2)+travel*2)%(travel*2):0;
    const srcX=travel>0?Math.min(q,travel*2-q):0;
    const on=clamp((s.time-layer.start)/2.4,0,1);
    const off=clamp((layer.end-s.time)/3,0,1);
    const opacity=layer.alpha*on*off;
    if(opacity<=.001)continue;
    c.save();
    c.globalAlpha=opacity;
    c.drawImage(im,srcX,0,sw,im.naturalHeight,0,0,W,H);
    c.restore();
  }
}
