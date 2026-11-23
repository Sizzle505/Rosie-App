import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STUDIO_PAGES, TARGETS } from './layoutTargets.js';
import { screenSignature, normalizeOffset, normalizedLayouts, PUBLISHED_PREFIX, DRAFT_PREFIX } from './layoutStudioScope.js';
import { alignmentSnap, boxFromPoints, clamp, distribute, edgeSpeed, filterNestedSelection, pickMarquee, unionRects } from './layoutStudioGeometry.js';
import { automaticTargets } from './layoutStudioAutoTargets.js';
import './SecretLayoutStudio.css';

const baseline = new WeakMap();
const clean = (value) => JSON.parse(JSON.stringify(value || {}));
function readStored(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}
function baseFor(node) {
  if (baseline.has(node)) return baseline.get(node);
  const css = getComputedStyle(node);
  const translate = css.translate === 'none' ? [] : css.translate.split(/\s+/);
  const scales = css.scale === 'none' ? [1] : css.scale.split(/\s+/).map(Number);
  const value = {
    inlineTranslate: node.style.translate,
    inlineScale: node.style.scale,
    inlineRotate: node.style.rotate,
    angle: Number(css.rotate.match(/-?\d+(?:\.\d+)?(?=deg)/)?.[0] || 0),
    x: translate[0] || '0px',
    y: translate[1] || '0px',
    scales: scales.length && scales.every(Number.isFinite) ? scales : [1]
  };
  baseline.set(node, value);
  return value;
}
function offset(baseValue, amount) {
  if (!amount) return baseValue;
  return 'calc(' + baseValue + (amount > 0 ? ' + ' : ' - ') + Math.abs(amount) + 'px)';
}
function positionNode(node, value) {
  const shift = normalizeOffset(value);
  const isDefault = !shift.x && !shift.y && shift.scale === 1 && !shift.rotate;
  // A never-edited element must retain its ordinary React/CSS behavior.
  if (isDefault && !baseline.has(node)) return;
  const original = baseFor(node);
  if (isDefault) {
    if (node.style.translate !== original.inlineTranslate) node.style.translate = original.inlineTranslate;
    if (node.style.scale !== original.inlineScale) node.style.scale = original.inlineScale;
    if (node.style.rotate !== original.inlineRotate) node.style.rotate = original.inlineRotate;
  } else {
    node.style.translate = offset(original.x, shift.x) + ' ' + offset(original.y, shift.y);
    node.style.scale = original.scales.map(n => Number((n * shift.scale).toFixed(6))).join(' ');
    node.style.rotate = shift.rotate ? (original.angle + shift.rotate) + 'deg' : original.inlineRotate;
  }
}
function applyPage(page, layouts) {
  const pageValues = layouts[page] || {};
  for (const [id, , selector] of TARGETS[page] || []) {
    if (page === 'haiku' && id.startsWith('scroll-')) continue;
    const node = document.querySelector(selector);
    if (!node) continue;
    if (page === 'haiku' && id === 'scroll') {
      const base = normalizeOffset(pageValues.scroll);
      const variantId = 'scroll-' + (node.dataset.scrollStyle || 'sakura');
      const individual = normalizeOffset(pageValues[variantId]);
      positionNode(node, {
        x: base.x + individual.x, y: base.y + individual.y,
        scale: base.scale * individual.scale, rotate: base.rotate + individual.rotate
      });
    } else positionNode(node, pageValues[id]);
  }
  if (Object.keys(pageValues).some(id => id.startsWith('auto-'))) {
    for (const item of automaticTargets()) {
      if (pageValues[item.id]) positionNode(item.node,pageValues[item.id]);
    }
  }
}
function elementsFor(page, scrollMode = 'linked', includeAuto = false) {
  const items = (TARGETS[page] || []).map(([id, label, selector, group]) => {
    let node = document.querySelector(selector);
    if (page === 'haiku') {
      if (id === 'scroll' && scrollMode === 'individual') node = null;
      if (id.startsWith('scroll-') && scrollMode === 'linked') node = null;
    }
    return {id, label, selector, group, node};
  });
  return includeAuto ? [...items,...automaticTargets()] : items;
}
function normalizedScreenLayouts(raw) { return normalizedLayouts(raw, TARGETS); }
function api(body) {
  return fetch('/api/layout-presets', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async response => {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The layout server could not complete that request.');
    return result;
  });
}

export default function SecretLayoutStudio({ page, unlocked, onNavigate, onHide }) {
  const [screenKey, setScreenKey] = useState(() => screenSignature());
  const [working, setWorking] = useState(() =>
    normalizedScreenLayouts(readStored(localStorage, PUBLISHED_PREFIX + screenSignature()))
  );
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const [lasso, setLasso] = useState(false);
  const [pickAny, setPickAny] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  // Desktop drag should be pixel-precise by default; touch keeps magnetic snapping.
  const [snapOn, setSnapOn] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [scrollMode, setScrollMode] = useState('linked');
  const [spacingGap, setSpacingGap] = useState(14);
  const [spacingAxis, setSpacingAxis] = useState('x');
  const [snapMarker, setSnapMarker] = useState(null);
  const panelRef = useRef(null);
  const miniRef = useRef(null);
  const panelDrag = useRef(null);
  const previewClickRef = useRef(false);
  // The canvas remains editable when the toolbar is minimized.
  const [active, setActive] = useState(false);
  const [editing, setEditing] = useState(true);
  const [multi, setMulti] = useState(false);
  const [showElements, setShowElements] = useState(false);
  const [selected, setSelected] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');
  const selectedRef = useRef([]);
  const workingRef = useRef(working);
  const dirtyRef = useRef(false);
  const history = useRef([]);
  const overlayRef = useRef(null);
  selectedRef.current = selected;
  workingRef.current = working;
  dirtyRef.current = dirty;

  useEffect(() => {
    const onSize = () => setScreenKey(previous => {
      const next = screenSignature();
      return previous === next ? previous : next;
    });
    window.addEventListener('resize', onSize);
    window.addEventListener('orientationchange', onSize);
    return () => {
      window.removeEventListener('resize', onSize);
      window.removeEventListener('orientationchange', onSize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = normalizedScreenLayouts(readStored(localStorage, PUBLISHED_PREFIX + screenKey));
    const draft = unlocked ? readStored(sessionStorage, DRAFT_PREFIX + screenKey) : null;
    const staged = draft ? normalizedScreenLayouts(draft) : null;
    dirtyRef.current = Boolean(staged);
    setDirty(Boolean(staged));
    workingRef.current = staged || cached;
    setWorking(workingRef.current);
    setSelected([]);
    setPanelPos(readStored(localStorage, 'rosieverse.layout-studio.panel.' + screenKey));
    history.current = [];
    setStatus('');
    // Publishing is a single database operation; drafts never leave sessionStorage.
    fetch('/api/layout-presets?screenKey=' + encodeURIComponent(screenKey), {
      credentials: 'same-origin', cache: 'no-store'
    }).then(response => {
      if (!response.ok) throw Error('Could not load published layouts.');
      return response.json();
    }).then(data => {
      if (cancelled) return;
      const live = normalizedScreenLayouts(data.layouts);
      try { localStorage.setItem(PUBLISHED_PREFIX + screenKey, JSON.stringify(live)); } catch {}
      if (!dirtyRef.current) {
        workingRef.current = live;
        setWorking(live);
      }
    }).catch(() => {
      if (!cancelled) setStatus('Using the cached layout. Publishing needs a connection.');
    });
    return () => { cancelled = true; };
  }, [screenKey, unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    // Renew the server-side cookie when returning to an already-unlocked device.
    api({ action: 'unlock', phrase: 'manchego' }).catch(() => {
      setStatus('Offline editing is available; Save will require a connection.');
    });
  }, [unlocked]);

  useLayoutEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      applyPage(page, workingRef.current);
    };
    apply();
    // Avoid a general-purpose observer when there are no overrides.
    if (!Object.keys(working[page] || {}).length) return undefined;
    const observer = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(apply);
    });
    const root = document.querySelector('.app-shell');
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [page, screenKey, working]);

  function stage(next) {
    const safe = normalizedScreenLayouts(next);
    workingRef.current = safe;
    setWorking(safe);
    dirtyRef.current = true;
    setDirty(true);
    try { sessionStorage.setItem(DRAFT_PREFIX + screenKey, JSON.stringify(safe)); } catch {}
  }
  function snapshot() {
    history.current.push(clean(workingRef.current));
    if (history.current.length > 35) history.current.shift();
  }
  function undo() {
    if (!history.current.length) return;
    stage(history.current.pop());
    setStatus('Last adjustment undone.');
  }
  function resetSelected() {
    if (!selected.length) return;
    snapshot();
    const next = clean(workingRef.current);
    const values = { ...(next[page] || {}) };
    selected.forEach(id => delete values[id]);
    if (Object.keys(values).length) next[page] = values; else delete next[page];
    stage(next);
    setStatus('Selected elements restored to their original positions.');
  }
  function resetPage() {
    if (!window.confirm('Restore the original positions on this page? Other pages stay in your draft.')) return;
    snapshot();
    const next = clean(workingRef.current);
    delete next[page];
    stage(next);
    setStatus('This page has been reset in your unpublished draft.');
  }
  function choose(id) {
    if (!multi) { setSelected([id]); return; }
    const current = selectedRef.current;
    if (current.includes(id)) setSelected(current.filter(value => value !== id));
    else {
      // Parent/child pairs should not be transformed simultaneously.
      const parts = elementsFor(page, scrollMode);
      const picked = parts.find(item => item.id === id)?.node;
      const rest = current.filter(existingId => {
        if (id === 'scroll' && existingId.startsWith('scroll-')) return false;
        if (id.startsWith('scroll-') && existingId === 'scroll') return false;
        const old = parts.find(item => item.id === existingId)?.node;
        return !(picked && old && (picked.contains(old) || old.contains(picked)));
      });
      setSelected([...rest, id]);
    }
  }
  async function saveAll() {
    if (saving) return;
    setSaving(true);
    setStatus('Publishing every edited page for this exact screen...');
    try {
      // Handles an expired HTTP-only session without requiring a second Oracle visit.
      await api({ action: 'unlock', phrase: 'manchego' });
      const result = await api({ action: 'save', screenKey, layouts: normalizedScreenLayouts(workingRef.current) });
      const live = normalizedScreenLayouts(result.layouts);
      localStorage.setItem(PUBLISHED_PREFIX + screenKey, JSON.stringify(live));
      sessionStorage.removeItem(DRAFT_PREFIX + screenKey);
      workingRef.current = live;
      setWorking(live);
      dirtyRef.current = false;
      setDirty(false);
      history.current = [];
      setStatus('Saved. All pages updated for ' + screenKey + ' only.');
    } catch (error) {
      setStatus('NOT SAVED: ' + error.message + ' Your draft is still here.');
    } finally { setSaving(false); }
  }
  function hideEditor() {
    if (dirty && !window.confirm('Hide Layout Studio? Your unpublished adjustments will remain as a session draft.')) return;
    setOpen(false);
    setActive(false);
    setSelected([]);
    api({ action: 'hide' }).catch(() => {});
    onHide();
  }
  function exportDraft() {
    const data = JSON.stringify({ version: 1, screenKey, layouts: normalizedScreenLayouts(workingRef.current) }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rosie-layout-' + screenKey.replace(/[^a-zA-Z0-9-]/g, '-') + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function setPosition(axis,value) {
    if (!selected.length || !Number.isFinite(Number(value))) return;
    snapshot();
    const next=clean(workingRef.current);
    next[page]={...(next[page]||{})};
    selected.forEach(id => {
      const v=normalizeOffset(next[page][id]);
      next[page][id]={...v,[axis]:clamp(Math.round(Number(value)),-2500,2500)};
    });
    stage(next);
  }
  function setScale(value) {
    if (!selected.length) return;
    snapshot();
    const next = clean(workingRef.current);
    next[page] = { ...(next[page] || {}) };
    selected.forEach(id => {
      next[page][id] = { ...normalizeOffset(next[page][id]), scale: Number(value) };
    });
    stage(next);
  }


  function updatePanelPosition(event) {
    const drag = panelDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setPanelPos({
      x: Math.round(clamp(drag.left + event.clientX - drag.startX, 5, Math.max(5, window.innerWidth - drag.width - 5))),
      y: Math.round(clamp(drag.top + event.clientY - drag.startY, 5, Math.max(5, window.innerHeight - drag.height - 5)))
    });
  }
  function startPanelMove(event) {
    if (event.target.closest?.('button,select,input,label')) return;
    const node = event.currentTarget.closest('.rle-panel,.rle-mini');
    if (!node) return;
    const rect = node.getBoundingClientRect();
    panelDrag.current = {pointerId:event.pointerId, startX:event.clientX,startY:event.clientY,
      left:rect.left,top:rect.top,width:rect.width,height:rect.height};
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function finishPanelMove(event) {
    if (!panelDrag.current || panelDrag.current.pointerId !== event.pointerId) return;
    panelDrag.current = null;
    try {
      const current=panelRef.current || miniRef.current;
      const rect=current?.getBoundingClientRect();
      if(rect) localStorage.setItem('rosieverse.layout-studio.panel.'+screenKey,
        JSON.stringify({x:Math.round(rect.left),y:Math.round(rect.top)}));
    } catch {}
  }
  function panelStyle(expanded) {
    if (!panelPos) return undefined;
    const width=expanded ? Math.min(480,window.innerWidth-12) : Math.min(310,window.innerWidth-12);
    const height=expanded ? Math.min(650,window.innerHeight*0.75) : 54;
    return {left:clamp(panelPos.x,5,Math.max(5,window.innerWidth-width-5)),
      top:clamp(panelPos.y,5,Math.max(5,window.innerHeight-height-5)),
      right:'auto',bottom:'auto'};
  }
  function chooseScroll(direction) {
    previewClickRef.current=true;
    try {
      document.querySelector('.haiku-scroll-cycle button:nth-child('+ (direction>0?2:1) +')')?.click();
    } finally { previewClickRef.current=false; }
  }
  function changeRotation(value) {
    if (!selected.length) return;
    snapshot();
    const next=clean(workingRef.current);
    next[page]={...(next[page]||{})};
    selected.forEach(id=>{
      const v=normalizeOffset(next[page][id]);
      next[page][id]={...v,rotate:clamp(Number(value),-360,360)};
    });
    stage(next);
  }
  function changeRotationBy(amount) {
    const current=selected.length===1?normalizeOffset(workingRef.current[page]?.[selected[0]]).rotate:0;
    changeRotation(current+amount);
  }
  function spaceSelection(axis, gap=null) {
    const parts=elementsFor(page,scrollMode);
    const moving=parts.filter(item=>selectedRef.current.includes(item.id)&&item.node);
    const kept=filterNestedSelection(moving,moving.map(item=>item.id));
    const rows=moving.filter(item=>kept.includes(item.id)).map(item=>({...item,rect:item.node.getBoundingClientRect()}));
    if(rows.length<2){setStatus('Select at least two separate visible elements to normalize spacing.');return;}
    const offsets=distribute(rows,axis,gap);
    if(!offsets.length)return;
    snapshot();
    const next=clean(workingRef.current);
    next[page]={...(next[page]||{})};
    offsets.forEach(item=>{
      const v=normalizeOffset(next[page][item.id]);
      next[page][item.id]={...v,[axis]:clamp(v[axis]+item.delta,-2500,2500)};
    });
    stage(next);
    setSpacingAxis(axis);
    setStatus('Spacing adjusted for '+rows.length+' selected elements.');
  }

  useEffect(() => {
    document.body.classList.toggle('rle-active',active&&editing&&unlocked);
    return () => document.body.classList.remove('rle-active');
  },[active,editing,unlocked]);

  useEffect(() => {
    if(!active||!editing||!unlocked)return undefined;
    const root=document.createElement('div');
    root.className='rle-guides rle-ui';
    document.body.appendChild(root);
    overlayRef.current=root;
    const outlines=new Map();
    const marquee=document.createElement('div');
    marquee.className='rle-marquee';
    root.appendChild(marquee);
    const snapV=document.createElement('div'),snapH=document.createElement('div');
    snapV.className='rle-snap-guide rle-snap-guide-v';
    snapH.className='rle-snap-guide rle-snap-guide-h';
    root.append(snapV,snapH);
    const guideField=document.createElement('div');
    guideField.className='rle-guide-field';
    if(showGuides) {
      ['v25','v50','v75','h25','h50','h75'].forEach(mark=>{
        const line=document.createElement('div');
        line.className='rle-page-guide rle-'+mark;
        guideField.appendChild(line);
      });
    }
    root.appendChild(guideField);
    let drag=null,paintFrame=0,autoFrame=0;
    let autoIndex=null;
    const getParts=()=>{
      const hasAuto = pickAny || selectedRef.current.some(id=>id.startsWith('auto-')) ||
        Object.keys(workingRef.current[page]||{}).some(id=>id.startsWith('auto-'));
      if(!hasAuto)return elementsFor(page,scrollMode);
      if(!autoIndex)autoIndex=automaticTargets();
      return [...elementsFor(page,scrollMode),...autoIndex];
    };
    const eligible=()=>getParts().filter(item=>selectedRef.current.includes(item.id)&&item.node);
    const clearSnap=()=>{
      snapV.style.display='none';
      snapH.style.display='none';
    };
    const draw=()=>{
      paintFrame=0;
      const items=eligible();
      const ids=new Set(items.map(item=>item.id));
      for(const [id,node] of outlines){
        if(!ids.has(id)){node.remove();outlines.delete(id);}
      }
      for(const item of items){
        const bounds=item.node.getBoundingClientRect();
        if(bounds.width<1||bounds.height<1)continue;
        let box=outlines.get(item.id);
        if(!box){
          box=document.createElement('div');
          box.className='rle-outline';
          box.dataset.targetId=item.id;
          box.addEventListener('pointerdown',event=>{
            if(event.target.closest('.rle-resize,.rle-spin'))return;
            event.preventDefault();event.stopPropagation();
            if((event.ctrlKey || event.metaKey) && event.pointerType !== 'touch'){
              setSelected(current=>current.includes(item.id) ? current.filter(key=>key!==item.id) : [...current,item.id]);
            }else startDrag(event,item.id,'move');
          });
          const caption=document.createElement('span');
          caption.className='rle-outline-label';
          caption.textContent=item.label;
          box.appendChild(caption);
          const resize=document.createElement('button');
          resize.className='rle-resize rle-ui';
          resize.type='button';
          resize.textContent='↘';
          resize.setAttribute('aria-label','Resize '+item.label);
          resize.addEventListener('pointerdown',event=>{
            event.preventDefault();event.stopPropagation();
            startDrag(event,item.id,'resize',bounds.width);
          });
          const spin=document.createElement('button');
          spin.className='rle-spin rle-ui';
          spin.type='button';
          spin.textContent='⟳';
          spin.setAttribute('aria-label','Rotate '+item.label);
          spin.addEventListener('pointerdown',event=>{
            event.preventDefault();event.stopPropagation();
            startDrag(event,item.id,'rotate');
          });
          box.append(resize,spin);
          root.appendChild(box);
          outlines.set(item.id,box);
        }
        box.style.left=bounds.left+'px';
        box.style.top=bounds.top+'px';
        box.style.width=bounds.width+'px';
        box.style.height=bounds.height+'px';
      }
    };
    const redraw=()=>{if(!paintFrame)paintFrame=requestAnimationFrame(draw);};
    function startDrag(event,id,kind='move',width=160) {
      if(event.button!==0&&event.pointerType!=='touch')return;
      const existing=selectedRef.current.includes(id);
      const moving=existing?[...selectedRef.current]:[id];
      if(!existing)setSelected(moving);
      const parts=getParts();
      const nodes=parts.filter(item=>moving.includes(item.id)&&item.node);
      const valid=filterNestedSelection(nodes,nodes.map(item=>item.id));
      const rects=nodes.filter(item=>valid.includes(item.id)).map(item=>({...item,rect:item.node.getBoundingClientRect()}));
      const box=rects.find(item=>item.id===id)?.rect;
      const center=box?{x:(box.left+box.right)/2,y:(box.top+box.bottom)/2}:null;
      if(kind==='move'||kind==='resize'||kind==='rotate')snapshot();
      try { event.target?.setPointerCapture?.(event.pointerId); } catch { /* The page can replace a target during rendering. */ }
      drag={kind,pointerId:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,
        startScrollY:window.scrollY,startScrollX:window.scrollX,width:width||160,moving,valid,
        rects,bounds:unionRects(rects.map(item=>item.rect)),center,
        anchorAngle:center?Math.atan2(event.clientY-center.y,event.clientX-center.x)*180/Math.PI:0,
        starts:Object.fromEntries(moving.map(key=>[key,normalizeOffset(workingRef.current[page]?.[key])])),
        moved:false};
      clearSnap();
    }
    function beginMarquee(event){
      event.preventDefault();event.stopImmediatePropagation();
      drag={kind:'marquee',pointerId:event.pointerId,x:event.clientX,y:event.clientY,
        lastX:event.clientX,lastY:event.clientY,startScrollY:window.scrollY,
        startScrollX:window.scrollX,moved:false};
      marquee.style.display='block';
      clearSnap();
      updateGesture();
    }
    function onDown(event) {
      if(event.button!==0&&event.pointerType!=='touch')return;
      if(event.target.closest?.('.rle-ui'))return;
      // Desktop: Shift-drag selects a rectangle without changing toolbar modes.
      if(lasso || (event.shiftKey && !event.ctrlKey && !event.metaKey)){
        beginMarquee(event);return;
      }
      const hits=getParts().filter(item=>item.node&&item.node.contains(event.target));
      if(!hits.length)return;
      hits.sort((x,y)=>x.node.contains(y.node)?1:y.node.contains(x.node)?-1:0);
      const picked=hits.find(item=>selectedRef.current.includes(item.id)) ||
        (pickAny ? hits.find(item=>item.id.startsWith('auto-')) : null) || hits[0];
      const id=picked.id;
      event.preventDefault();event.stopImmediatePropagation();
      // Ctrl/Cmd-click toggles exactly one object for mouse-and-keyboard editing.
      if((event.ctrlKey || event.metaKey) && event.pointerType !== 'touch'){
        setSelected(current=>current.includes(id) ? current.filter(key=>key!==id) : [...current,id]);
        return;
      }
      if(multi&&!selectedRef.current.includes(id)){
        choose(id);return;
      }
      if(!multi)setSelected([id]);
      startDrag(event,id,'move');
    }
    function updateGesture(){
      if(!drag)return;
      const x=drag.lastX,y=drag.lastY;
      const scrollDelta=window.scrollY-drag.startScrollY;
      if(drag.kind==='marquee'){
        const bounds=boxFromPoints(drag.x,drag.y+drag.startScrollY,x,y+window.scrollY);
        marquee.style.left=bounds.left-window.scrollX+'px';
        marquee.style.top=bounds.top-window.scrollY+'px';
        marquee.style.width=Math.max(1,bounds.right-bounds.left)+'px';
        marquee.style.height=Math.max(1,bounds.bottom-bounds.top)+'px';
        return;
      }
      const dx=x-drag.x,dy=y-drag.y;
      const next={...workingRef.current,[page]:{...(workingRef.current[page]||{})}};
      let sx=0,sy=0;
      if(drag.kind==='move'&&snapOn&&drag.bounds){
        const proposed={left:drag.bounds.left+dx,right:drag.bounds.right+dx,
          top:drag.bounds.top+dy,bottom:drag.bounds.bottom+dy};
        const selectedNodes=drag.rects.map(item=>item.node);
        const surroundings=getParts().filter(item=>item.node&&!drag.moving.includes(item.id)&&
          !selectedNodes.some(node=>node===item.node||node.contains(item.node)||item.node.contains(node)))
          .map(item=>item.node.getBoundingClientRect())
          .filter(rect=>rect.width>5&&rect.height>5&&rect.width*rect.height<window.innerWidth*window.innerHeight*.7);
        const guide=alignmentSnap(proposed,surroundings,8);
        sx=guide.dx;sy=guide.dy;
        snapV.style.display=guide.xLine===null?'none':'block';
        snapH.style.display=guide.yLine===null?'none':'block';
        if(guide.xLine!==null)snapV.style.left=guide.xLine+'px';
        if(guide.yLine!==null)snapH.style.top=guide.yLine+'px';
      }else clearSnap();
      for(const id of drag.moving){
        const start=drag.starts[id];
        if(drag.kind==='rotate'&&drag.center){
          const angle=Math.atan2(y-drag.center.y,x-drag.center.x)*180/Math.PI;
          let diff=angle-drag.anchorAngle;
          if(diff>180)diff-=360;
          if(diff< -180)diff+=360;
          const raw=clamp(start.rotate+diff,-360,360);
          next[page][id]={...start,rotate:snapOn?Math.round(raw/5)*5:Math.round(raw)};
        }else if(drag.kind==='resize'){
          next[page][id]={...start,scale:Math.round(clamp(start.scale*(1+(dx+dy)/Math.max(80,drag.width)),.3,3)*100)/100};
        }else {
          next[page][id]={...start,x:Math.round(clamp(start.x+dx+sx,-2500,2500)),
            y:Math.round(clamp(start.y+dy+scrollDelta+sy,-2500,2500))};
        }
      }
      workingRef.current=next;
      applyPage(page,next);
      redraw();
    }
    function onMove(event) {
      if(!drag||event.pointerId!==drag.pointerId)return;
      drag.lastX=event.clientX;drag.lastY=event.clientY;
      if(Math.abs(drag.lastX-drag.x)+Math.abs(drag.lastY-drag.y)>3)drag.moved=true;
      event.preventDefault();
      updateGesture();
    }
    function onUp(event) {
      if(!drag||event.pointerId!==drag.pointerId)return;
      if(drag.kind==='marquee'){
        marquee.style.display='none';
        if(drag.moved){
          const area=boxFromPoints(drag.x,drag.y+drag.startScrollY,drag.lastX,drag.lastY+window.scrollY);
          const visible=getParts().filter(item=>item.node).map(item=>{
            const r=item.node.getBoundingClientRect();
            return {...item,rect:{left:r.left+window.scrollX,right:r.right+window.scrollX,
              top:r.top+window.scrollY,bottom:r.bottom+window.scrollY,width:r.width,height:r.height}};
          });
          const ids=pickMarquee(visible,area);
          const additions=multi?[...selectedRef.current,...ids]:ids;
          const unique=[...new Set(additions)];
          setSelected(filterNestedSelection(visible,unique));
        }
      } else if(drag.moved){
        stage(workingRef.current);
      } else {
        history.current.pop();
        if(multi || selectedRef.current.length>1){
          const id=drag.moving.find(id=>id===event.target.closest?.('[data-target-id]')?.dataset.targetId)||
            drag.rects.find(item=>item.node.contains(event.target))?.id||drag.moving[0];
          setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
        }
      }
      drag=null;
      clearSnap();redraw();
    }
    function onClick(event){
      if(previewClickRef.current)return;
      if(event.target.closest?.('.rle-ui'))return;
      if(getParts().some(item=>item.node&&item.node.contains(event.target))||lasso){
        event.preventDefault();event.stopImmediatePropagation();
      }
    }
    function onKeys(event){
      const input=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
      const typing=Boolean(input && !(input.matches('input[type="checkbox"]')));
      const mod=event.ctrlKey||event.metaKey;
      if(mod&&!typing&&event.key.toLowerCase()==='z'&&!event.shiftKey){
        event.preventDefault();
        undo();
        return;
      }
      if(mod&&!typing&&event.key.toLowerCase()==='s'){
        event.preventDefault();
        saveAll();
        return;
      }
      if(event.key==='Escape'&&!typing){
        event.preventDefault();
        if(lasso)setLasso(false);
        else if(pickAny)setPickAny(false);
        else setSelected([]);
        return;
      }
      if(typing || !selectedRef.current.length) return;
      const ids=[...selectedRef.current];
      if(event.key==='Delete'||event.key==='Backspace'){
        event.preventDefault();
        snapshot();
        const next=clean(workingRef.current);
        next[page]={...(next[page]||{})};
        ids.forEach(id=>delete next[page][id]);
        stage(next);
        setStatus('Selected adjustments reset. Objects remain on the page.');
        return;
      }
      const arrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key);
      const rotating=event.key==='['||event.key===']';
      if(!arrow&&!rotating)return;
      event.preventDefault();
      snapshot();
      const size=event.shiftKey?10:1;
      const dx=(event.key==='ArrowLeft'?-size:event.key==='ArrowRight'?size:0);
      const dy=(event.key==='ArrowUp'?-size:event.key==='ArrowDown'?size:0);
      const degrees=(event.key==='['?-size:event.key===']'?size:0);
      const next=clean(workingRef.current);next[page]={...(next[page]||{})};
      ids.forEach(id=>{
        const v=normalizeOffset(next[page][id]);
        next[page][id]={...v,x:clamp(v.x+dx,-2500,2500),
          y:clamp(v.y+dy,-2500,2500),rotate:clamp(v.rotate+degrees,-360,360)};
      });
      stage(next);
    }
    function autoScroll(){
      if(drag&&(drag.kind==='move'||drag.kind==='marquee'||drag.kind==='resize')){
        const speed=edgeSpeed(drag.lastY,window.innerHeight,66);
        if(speed&&document.scrollingElement?.scrollHeight>window.innerHeight+3){
          const before=window.scrollY;
          window.scrollBy({top:speed,behavior:'instant'});
          if(before!==window.scrollY){updateGesture();redraw();}
        }
      }
      autoFrame=requestAnimationFrame(autoScroll);
    }
    const observer=new MutationObserver(()=>{autoIndex=null;redraw();});
    const app=document.querySelector('.app-shell');
    if(app)observer.observe(app,{childList:true,subtree:true});
    document.addEventListener('pointerdown',onDown,true);
    window.addEventListener('pointermove',onMove,{capture:true,passive:false});
    window.addEventListener('pointerup',onUp,true);
    window.addEventListener('pointercancel',onUp,true);
    document.addEventListener('click',onClick,true);
    document.addEventListener('keydown',onKeys,true);
    window.addEventListener('scroll',redraw,true);
    window.addEventListener('resize',redraw);
    root.addEventListener('rle-refresh',redraw);
    draw();autoFrame=requestAnimationFrame(autoScroll);
    return ()=>{
      observer.disconnect();
      document.removeEventListener('pointerdown',onDown,true);
      window.removeEventListener('pointermove',onMove,true);
      window.removeEventListener('pointerup',onUp,true);
      window.removeEventListener('pointercancel',onUp,true);
      document.removeEventListener('click',onClick,true);
      document.removeEventListener('keydown',onKeys,true);
      window.removeEventListener('scroll',redraw,true);
      window.removeEventListener('resize',redraw);
      cancelAnimationFrame(autoFrame);
      if(paintFrame)cancelAnimationFrame(paintFrame);
      root.remove();overlayRef.current=null;
    };
  },[page,screenKey,active,editing,unlocked,multi,lasso,pickAny,snapOn,showGuides,scrollMode]);

  useEffect(()=>{
    overlayRef.current?.dispatchEvent(new Event('rle-refresh'));
  },[selected]);

  const targets = TARGETS[page] || [];
  const visibleTargets = targets.filter(([, label, , group]) =>
    (label + ' ' + (group || '')).toLowerCase().includes(filter.toLowerCase()));
  const chosenScale = selected.length === 1 ? normalizeOffset(working[page]?.[selected[0]]).scale : 1;
  const chosenRotation = selected.length === 1 ? normalizeOffset(working[page]?.[selected[0]]).rotate : 0;
  const selectedAutos=selected.some(id=>id.startsWith('auto-'))
    ? automaticTargets().filter(item=>selected.includes(item.id)).map(item=>[item.id,item.label])
    : [];
  const listTargets=[...visibleTargets,...selectedAutos];
  const chosenXY=selected.length===1?normalizeOffset(working[page]?.[selected[0]]):null;
  const editedPages = Object.keys(working).filter(key => Object.keys(working[key] || {}).length).length;
  if (!unlocked) return null;
  return <>
    {!open && <div className='rle-mini rle-ui' ref={miniRef} style={panelStyle(false)}>
      <span className='rle-mini-grip' onPointerDown={startPanelMove} onPointerMove={updatePanelPosition} onPointerUp={finishPanelMove} onPointerCancel={finishPanelMove}>⠿</span>
      <button type='button' className={active && editing ? 'rle-on' : ''} onClick={() => {setActive(true);setEditing(true)}}>Arrange</button>
      <button type='button' className={active && !editing ? 'rle-on' : ''} onClick={() => {setActive(true);setEditing(false)}}>Interact</button>
      <button type='button' className='rle-expand' aria-label='Open full Layout Studio' onClick={() => setOpen(true)}>⌄</button>
    </div>}
    {open && <section className='rle-panel rle-ui' ref={panelRef} style={panelStyle(true)} aria-label='Rosie Layout Studio'>
      <header className='rle-header rle-drag-header' onPointerDown={startPanelMove} onPointerMove={updatePanelPosition} onPointerUp={finishPanelMove} onPointerCancel={finishPanelMove}>
        <span className='rle-grip' aria-hidden='true'>⠿</span>
        <div><strong>ROSIE LAYOUT STUDIO</strong><small>Exact screen: {screenKey}</small></div>
        <button type='button' onClick={() => setOpen(false)} aria-label='Minimize Layout Studio'>⌃</button>
      </header>
      <div className='rle-row rle-row-primary'>
        <label className='rle-page-label'>Page
          <select value={page} onChange={event => { setSelected([]); onNavigate(event.target.value); }}>
            {STUDIO_PAGES.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button type='button' className={editing && active ? 'rle-on' : ''} onClick={() => {setActive(true);setEditing(true)}}>Arrange</button>
        <button type='button' className={!editing && active ? 'rle-on' : ''} onClick={() => {setActive(true);setEditing(false)}}>Interact</button>
      </div>
      <div className='rle-row rle-tools'>
        <button type='button' className={multi ? 'rle-on' : ''} onClick={() => setMulti(v => !v)}>{multi ? 'Group ON' : 'Group select'}</button>
        <button type='button' className={lasso ? 'rle-on' : ''} aria-pressed={lasso} onClick={() => {setLasso(v=>!v);setActive(true);setEditing(true)}}>{lasso ? 'Marquee ON' : 'Marquee select'}</button>
        <button type='button' className={pickAny ? 'rle-on' : ''} aria-pressed={pickAny} onClick={() => {setPickAny(v=>!v);setActive(true);setEditing(true)}}>{pickAny ? 'Pick any ON' : 'Pick any'}</button>
        <button type='button' className={snapOn ? 'rle-on' : ''} aria-pressed={snapOn} onClick={() => setSnapOn(v=>!v)}>Snap {snapOn?'on':'off'}</button>
        <button type='button' className={showGuides ? 'rle-on' : ''} aria-pressed={showGuides} onClick={() => setShowGuides(v=>!v)}>Guides {showGuides?'on':'off'}</button>
      </div>
      <div className='rle-row'>
        <button type='button' onClick={() => setShowElements(state => !state)}>{showElements ? 'Hide elements' : 'Choose elements'} ({selected.length})</button>
        <button type='button' onClick={() => setSelected([])} disabled={!selected.length}>Clear selection</button>
        <button type='button' onClick={undo} disabled={!history.current.length}>Undo</button>
      </div>
      {page==='haiku' && <div className='rle-linked'>
        <div className='rle-subhead'><strong>Scroll artwork</strong><small>Position linked designs or just the visible design</small></div>
        <div className='rle-row'>
          <button type='button' className={scrollMode==='linked'?'rle-on':''} onClick={() => {setScrollMode('linked');setSelected([])}}>All scroll designs</button>
          <button type='button' className={scrollMode==='individual'?'rle-on':''} onClick={() => {setScrollMode('individual');setSelected([])}}>Current design only</button>
          <button type='button' aria-label='Previous scroll design' onClick={() => chooseScroll(-1)}>‹</button>
          <button type='button' aria-label='Next scroll design' onClick={() => chooseScroll(1)}>›</button>
        </div>
      </div>}
      {showElements && <div className='rle-elements'>
        <input aria-label='Find elements' value={filter} onChange={event => setFilter(event.target.value)} placeholder='Find an element...' />
        {listTargets.map(([id,label]) => <label key={id} className='rle-element'>
          <input type='checkbox' checked={selected.includes(id)} onChange={() => {if(page==='haiku'&&id==='scroll')setScrollMode('linked');if(page==='haiku'&&id.startsWith('scroll-'))setScrollMode('individual');choose(id)}}/>
          <span>{label}</span>
        </label>)}
      </div>}
      {selected.length === 1 && <div className='rle-coordinates'>
        <label>X (px) <input type='number' step='1' aria-label='Horizontal position X' value={chosenXY.x}
          onChange={event => {if(event.target.value!=='')setPosition('x',event.target.value)}} /></label>
        <label>Y (px) <input type='number' step='1' aria-label='Vertical position Y' value={chosenXY.y}
          onChange={event => {if(event.target.value!=='')setPosition('y',event.target.value)}} /></label>
      </div>}
      {selected.length > 0 && <div className='rle-range-grid'>
        <label>Size <b>{Math.round(chosenScale * 100)}%</b>
          <input type='range' min='0.3' max='3' step='0.05' value={chosenScale} onChange={event => setScale(event.target.value)} />
        </label>
        <label>Rotation <b>{Math.round(chosenRotation)}°</b>
          <input type='range' min='-180' max='180' step='1' value={chosenRotation} onChange={event => changeRotation(event.target.value)} />
        </label>
        <div className='rle-row rle-rotate-actions'>
          <button type='button' onClick={() => changeRotationBy(-15)}>↶ −15°</button>
          <button type='button' onClick={() => changeRotation(0)}>0°</button>
          <button type='button' onClick={() => changeRotationBy(15)}>↷ +15°</button>
          <button type='button' onClick={resetSelected}>Reset selected</button>
        </div>
      </div>}
      {selected.length >= 2 && <div className='rle-spacing'>
        <div className='rle-subhead'><strong>Even spacing</strong><small>Align a group in a row or column</small></div>
        <div className='rle-row'>
          <button type='button' onClick={() => spaceSelection('x',null)}>Equalize row ↔</button>
          <button type='button' onClick={() => spaceSelection('y',null)}>Equalize column ↕</button>
        </div>
        <label>Gap {spacingGap}px ({spacingAxis==='x'?'horizontal':'vertical'})
          <input type='range' min='0' max='120' step='1' value={spacingGap}
            onChange={event => {setSpacingGap(Number(event.target.value));spaceSelection(spacingAxis,Number(event.target.value))}} />
        </label>
      </div>}
      <div className='rle-row rle-footer'>
        <button type='button' onClick={resetPage}>Reset page</button>
        <button type='button' onClick={exportDraft}>Export</button>
        <button type='button' className='rle-save' onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save all pages'}</button>
      </div>
      <small className='rle-help'>Desktop: click an object, Ctrl/Cmd-click to add or remove it, Shift-drag to marquee-select, arrow keys to nudge 1px (Shift = 10px), [ / ] to rotate, Delete to reset, Ctrl/Cmd+Z to undo, Ctrl/Cmd+S to save. Enable Pick any to select images, search fields and other unlisted elements. Drag the header to move the controls. Touch: marquee, group, ↘ resize and ⟳ rotate remain available. Save once for all pages.</small>
      <div className='rle-last-row'>
        <span>{dirty ? 'Unpublished edits' : 'Saved view'} · {editedPages} customized page{editedPages === 1 ? '' : 's'}</span>
        <button type='button' onClick={hideEditor}>Hide secret button</button>
      </div>
      {status && <p className='rle-status' role='status'>{status}</p>}
    </section>}
  </>;
}
