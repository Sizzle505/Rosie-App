/* One-time client-side cleanup of the Imperial scroll's baked checkerboard.
   The source PNG includes pale, neutral-gray faux-transparent squares behind
   its tassels. Preserve the gilding, rose silk, parchment, and real alpha. */
let preparedUrl=null;
let pending=null;
export function stripImperialChecker(data,width,height){
  let changed=0;
  const sideBand=Math.round(width*.195);
  const top=Math.round(height*.105);
  const bottom=Math.round(height*.93);
  for(let y=top;y<bottom;y++){
    for(let x=0;x<width;x++){
      if(x>=sideBand&&x<width-sideBand)continue;
      const i=(y*width+x)*4;
      if(data[i+3]<3)continue;
      const r=data[i],g=data[i+1],b=data[i+2];
      const lo=Math.min(r,g,b),hi=Math.max(r,g,b);
      const neutrality=hi-lo;
      // Typical checker tiles are RGB 238/238/238 and 253/253/253.
      // A narrow feather retains antialiased colored ornaments.
      const matte=lo>209
        ? (neutrality<12?0:neutrality<38?(neutrality-12)/26:1)
        : 1;
      if(matte>=.999)continue;
      data[i+3]=Math.round(data[i+3]*matte);
      changed++;
    }
  }
  return changed;
}
export function imperialScrollWithoutChecker(){
  if(preparedUrl)return Promise.resolve(preparedUrl);
  if(pending)return pending;
  if(typeof document==="undefined")return Promise.resolve(null);
  pending=new Promise(resolve=>{
    const img=new Image();
    img.decoding="async";
    img.onload=()=>{
      try{
        const canvas=document.createElement("canvas");
        canvas.width=img.naturalWidth;
        canvas.height=img.naturalHeight;
        const ctx=canvas.getContext("2d",{willReadFrequently:true});
        if(!ctx){resolve(null);return;}
        ctx.drawImage(img,0,0);
        const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        stripImperialChecker(imageData.data,canvas.width,canvas.height);
        ctx.putImageData(imageData,0,0);
        canvas.toBlob(blob=>{
          if(blob){preparedUrl=URL.createObjectURL(blob);resolve(preparedUrl);}
          else resolve(null);
        },"image/png");
      }catch{resolve(null);}
    };
    img.onerror=()=>resolve(null);
    img.src="/rosieverse/haiku/haiku-scroll-isolated.png";
  }).finally(()=>{pending=null;});
  return pending;
}
