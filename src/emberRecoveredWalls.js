import { DRILL_WIDTH as W, DRILL_HEIGHT as H, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

// Reuse real illustrated roof, root and crystal art already in the repo.
// Each piece is cropped once, feathered into transparency and positioned
// beside the actual tunnel boundary. No narrow tiled strips, repeated rows,
// solid rectangular backplates, or opaque artificial walls.
const textureCache = new WeakMap();
const ready = image => Boolean(image && image.complete && image.naturalWidth > 0);

function fragment(image, floor, variation) {
  if (!ready(image)) return null;
  let found=textureCache.get(image);
  if(!found){ found=new Map();textureCache.set(image,found); }
  const key=(floor?"floor":"roof")+variation;
  if(found.has(key))return found.get(key);
  const canvas=document.createElement("canvas");
  canvas.width=454;canvas.height=128;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)return null;
  const sw=Math.min(image.naturalWidth,1180);
  const sh=Math.min(image.naturalHeight,342);
  const sx=Math.max(0,(image.naturalWidth-sw)*([.03,.53,.28][variation%3]));
  const sy=floor?image.naturalHeight-sh:0;
  ctx.clearRect(0,0,454,128);
  ctx.drawImage(image,sx,sy,sw,sh,0,0,454,128);
  const data=ctx.getImageData(0,0,454,128), d=data.data;
  for(let y=0;y<128;y++){
    // Feather outer edge into the cavern art. The source PNG/WebP's native
    // roots, rock, lanterns and alpha remain intact at the inner edge.
    const vy=floor?Math.min(1,(128-y)/24):Math.min(1,y/24);
    for(let x=0;x<454;x++){
      const hx=Math.min(1,x/87,(453-x)/87);
      const fade=Math.max(0,Math.min(1,hx))**1.6*Math.max(0,vy);
      d[(y*454+x)*4+3]*=fade;
    }
  }
  ctx.putImageData(data,0,0);
  found.set(key,canvas);return canvas;
}
function slopeAt(worldX,side){
  const a=tunnelCenter(worldX-65)+side*tunnelRadius(worldX-65);
  const b=tunnelCenter(worldX+65)+side*tunnelRadius(worldX+65);
  return Math.atan2(b-a,130);
}
function piece(ctx,run,image,worldX,side,variety){
  const screenX=worldX-run.scroll;
  if(screenX<-270||screenX>W+270)return;
  const sprite=fragment(image,side>0,variety);
  if(!sprite)return;
  const y=tunnelCenter(worldX)+side*tunnelRadius(worldX);
  ctx.save();ctx.translate(screenX,y);ctx.rotate(slopeAt(worldX,side));
  ctx.globalAlpha=.70;
  // The gently textured surfaces lie outside the movement corridor.
  ctx.drawImage(sprite,-227,side<0?-123:-4,454,128);
  ctx.restore();
}
export function paintRecoveredWalls(ctx,run,art={}){
  const ceiling=[art.roof,art.descentRoof,art.roof,art.hangingRoots].filter(ready);
  const floor=[art.floor,art.descentFloor,art.floor].filter(ready);
  if(!ceiling.length||!floor.length)return;
  // Offset roof/floor highlights so the corridor is not framed by two
  // identical perfectly symmetrical decorative ribbons.
  const spacing=870, first=Math.floor((run.scroll-600)/spacing)-1;
  for(let i=first;i<first+4;i++){
    const w=600+i*spacing;
    piece(ctx,run,ceiling[Math.abs(i)%ceiling.length],w,-1,Math.abs(i)%3);
    piece(ctx,run,floor[Math.abs(i+1)%floor.length],w+350,1,Math.abs(i+2)%3);
  }
}
