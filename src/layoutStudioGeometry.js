// Pure canvas math shared by touchscreen gestures and regression checks.
// Rectangles are CSS pixels in the same viewport coordinate system.
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const overlapArea = (a,b) =>
  Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)) *
  Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
export function boxFromPoints(ax,ay,bx,by) {
  return {left:Math.min(ax,bx), top:Math.min(ay,by),right:Math.max(ax,bx),bottom:Math.max(ay,by)};
}
export function pickMarquee(items, area) {
  return items.filter(({rect}) => {
    if (!rect || rect.width < 1 || rect.height < 1) return false;
    // Either enclosing an item or crossing 12% of its area selects it.
    return overlapArea(area,rect) > 0 &&
      (overlapArea(area,rect) >= rect.width*rect.height*0.12 ||
       area.left<=rect.left&&area.right>=rect.right&&area.top<=rect.top&&area.bottom>=rect.bottom);
  }).map(item=>item.id);
}
export function filterNestedSelection(items, ids) {
  const available=items.filter(x=>ids.includes(x.id) && x.node);
  // Take the deepest targeted node for each overlapping pair. Parents may be
  // deliberately picked alone; never move a parent AND its child as a group.
  return available.filter(a=>!available.some(b=>b!==a && a.node.contains(b.node))).map(x=>x.id);
}
export function unionRects(rects) {
  if(!rects.length)return null;
  return {left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),
    top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
}
export function alignmentSnap(moving, others, tolerance=9) {
  if(!moving || !others.length)return {dx:0,dy:0,xLine:null,yLine:null};
  const guides=(r,axis)=>axis==='x'
    ?[r.left,(r.left+r.right)/2,r.right]
    :[r.top,(r.top+r.bottom)/2,r.bottom];
  const closest=axis=>{
    const lines=others.flatMap(rect=>guides(rect,axis));
    let best={delta:0,line:null,distance:tolerance+0.01};
    for(const mine of guides(moving,axis))for(const them of lines){
      const distance=Math.abs(them-mine);
      if(distance < best.distance){best={delta:them-mine,line:them,distance};}
    }
    return best;
  };
  const x=closest('x'),y=closest('y');
  return {dx:x.delta,dy:y.delta,xLine:x.line,yLine:y.line};
}
export function distribute(items,axis,gap=null) {
  const horizontal=axis==='x';
  const keyed=items.filter(x=>x.rect).sort((a,b)=>
    horizontal?a.rect.left-b.rect.left:a.rect.top-b.rect.top);
  if(keyed.length<2)return [];
  const start=r=>horizontal?r.left:r.top;
  const end=r=>horizontal?r.right:r.bottom;
  const length=r=>end(r)-start(r);
  const first=keyed[0].rect, last=keyed[keyed.length-1].rect;
  const sum=keyed.reduce((v,item)=>v+length(item.rect),0);
  const calculated=(end(last)-start(first)-sum)/(keyed.length-1);
  const spacing=gap===null?calculated:clamp(Number(gap)||0,0,200);
  let cursor=start(first);
  return keyed.map(item=>{
    const change=cursor-start(item.rect);
    cursor+=length(item.rect)+spacing;
    return {id:item.id,delta:Math.round(change),spacing};
  });
}
export function edgeSpeed(pos,extent,margin=65) {
  if(pos<margin)return -Math.ceil(2+18*(margin-pos)/margin);
  if(pos>extent-margin)return Math.ceil(2+18*(pos-extent+margin)/margin);
  return 0;
}
