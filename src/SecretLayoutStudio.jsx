import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STUDIO_PAGES, TARGETS } from './layoutTargets.js';
import { screenSignature, normalizeOffset, normalizedLayouts, PUBLISHED_PREFIX, DRAFT_PREFIX } from './layoutStudioScope.js';
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
  const isDefault = !shift.x && !shift.y && shift.scale === 1;
  // A never-edited element must retain its ordinary React/CSS behavior.
  if (isDefault && !baseline.has(node)) return;
  const original = baseFor(node);
  if (isDefault) {
    if (node.style.translate !== original.inlineTranslate) node.style.translate = original.inlineTranslate;
    if (node.style.scale !== original.inlineScale) node.style.scale = original.inlineScale;
  } else {
    node.style.translate = offset(original.x, shift.x) + ' ' + offset(original.y, shift.y);
    node.style.scale = original.scales.map(n => Number((n * shift.scale).toFixed(6))).join(' ');
  }
}
function applyPage(page, layouts) {
  const pageValues = layouts[page] || {};
  for (const [id, , selector] of TARGETS[page] || []) {
    const node = document.querySelector(selector);
    if (node) positionNode(node, pageValues[id]);
  }
}
function elementsFor(page) {
  return (TARGETS[page] || []).map(([id, label, selector, group]) => ({
    id, label, selector, group, node: document.querySelector(selector)
  }));
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
      const parts = elementsFor(page);
      const picked = parts.find(item => item.id === id)?.node;
      const rest = current.filter(existingId => {
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

  useEffect(() => {
    document.body.classList.toggle('rle-active', open && editing && unlocked);
    return () => document.body.classList.remove('rle-active');
  }, [open, editing, unlocked]);

  useEffect(() => {
    if (!open || !editing || !unlocked) return undefined;
    const root = document.createElement('div');
    root.className = 'rle-guides rle-ui';
    document.body.appendChild(root);
    overlayRef.current = root;
    const boxes = new Map();
    let drag = null;
    let frame = 0;
    const visible = () => elementsFor(page).filter(item => selectedRef.current.includes(item.id) && item.node);
    const draw = () => {
      frame = 0;
      const active = visible();
      const keys = new Set(active.map(item => item.id));
      for (const [id, box] of boxes) {
        if (!keys.has(id)) { box.remove(); boxes.delete(id); }
      }
      active.forEach(item => {
        const rect = item.node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        let box = boxes.get(item.id);
        if (!box) {
          box = document.createElement('div');
          box.className = 'rle-outline';
          const caption = document.createElement('span');
          caption.className = 'rle-outline-label';
          caption.textContent = item.label;
          box.appendChild(caption);
          const grip = document.createElement('button');
          grip.type = 'button';
          grip.className = 'rle-resize rle-ui';
          grip.textContent = '↘';
          grip.setAttribute('aria-label', 'Resize ' + item.label);
          grip.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            startDrag(event, item.id, true, box.getBoundingClientRect().width);
          });
          box.appendChild(grip);
          root.appendChild(box);
          boxes.set(item.id, box);
        }
        box.style.left = rect.left + 'px';
        box.style.top = rect.top + 'px';
        box.style.width = rect.width + 'px';
        box.style.height = rect.height + 'px';
      });
    };
    const redraw = () => { if (!frame) frame = requestAnimationFrame(draw); };
    function startDrag(event, id, resize, width) {
      if (event.button !== 0 && event.pointerType !== 'touch') return;
      const moving = selectedRef.current.includes(id) ? [...selectedRef.current] : [id];
      if (!selectedRef.current.includes(id)) setSelected(moving);
      snapshot();
      const starts = Object.fromEntries(moving.map(key => [key, normalizeOffset(workingRef.current[page]?.[key])]));
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, resize, width: width || 150, moving, starts, moved: false };
    }
    function onDown(event) {
      if (event.button !== 0 && event.pointerType !== 'touch') return;
      if (event.target.closest?.('.rle-ui')) return;
      const candidates = elementsFor(page).filter(item => item.node && item.node.contains(event.target));
      if (!candidates.length) return;
      candidates.sort((a,b) => a.node.contains(b.node) ? 1 : b.node.contains(a.node) ? -1 : 0);
      const id = candidates[0].id;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (multi && !selectedRef.current.includes(id)) { choose(id); return; }
      if (!multi) setSelected([id]);
      startDrag(event, id, false);
    }
    function onMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) < 2 && !drag.moved) return;
      drag.moved = true;
      event.preventDefault();
      const next = { ...workingRef.current, [page]: { ...(workingRef.current[page] || {}) } };
      for (const id of drag.moving) {
        const start = drag.starts[id];
        next[page][id] = drag.resize
          ? { ...start, scale: Math.round(Math.min(3, Math.max(0.3, start.scale * (1 + (dx + dy) / Math.max(80, drag.width)))) * 100) / 100 }
          : { ...start, x: Math.round(start.x + dx), y: Math.round(start.y + dy) };
      }
      workingRef.current = next;
      applyPage(page, next);
      redraw();
    }
    function onUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) stage(workingRef.current);
      else history.current.pop();
      drag = null;
      redraw();
    }
    function onClick(event) {
      if (event.target.closest?.('.rle-ui')) return;
      if (elementsFor(page).some(item => item.node && item.node.contains(event.target))) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    }
    function onKeys(event) {
      if (event.key === 'Escape') { setEditing(false); return; }
      if (event.target?.matches?.('input,select,textarea,[contenteditable]')) return;
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key) || !selectedRef.current.length) return;
      event.preventDefault();
      snapshot();
      const dx = (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0) * (event.shiftKey ? 10 : 1);
      const dy = (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0) * (event.shiftKey ? 10 : 1);
      const next = clean(workingRef.current);
      next[page] = { ...(next[page] || {}) };
      selectedRef.current.forEach(id => {
        const v = normalizeOffset(next[page][id]);
        next[page][id] = { ...v, x: v.x + dx, y: v.y + dy };
      });
      stage(next);
    }
    root.addEventListener('rle-refresh', redraw);
    const observer = new MutationObserver(redraw);
    const app = document.querySelector('.app-shell');
    if (app) observer.observe(app, { childList: true, subtree: true });
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, { capture: true, passive: false });
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', redraw, true);
    window.addEventListener('resize', redraw);
    document.addEventListener('keydown', onKeys, true);
    draw();
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('scroll', redraw, true);
      window.removeEventListener('resize', redraw);
      document.removeEventListener('keydown', onKeys, true);
      if (frame) cancelAnimationFrame(frame);
      root.remove();
      overlayRef.current = null;
    };
  }, [page, screenKey, open, editing, unlocked, multi]);

  useEffect(() => {
    overlayRef.current?.dispatchEvent(new Event('rle-refresh'));
  }, [selected]);

  const targets = TARGETS[page] || [];
  const visibleTargets = targets.filter(([, label, , group]) =>
    (label + ' ' + (group || '')).toLowerCase().includes(filter.toLowerCase()));
  const chosenScale = selected.length === 1 ? normalizeOffset(working[page]?.[selected[0]]).scale : 1;
  const editedPages = Object.keys(working).filter(key => Object.keys(working[key] || {}).length).length;
  if (!unlocked) return null;
  return <>
    {!open && <button type='button' className='rle-launch rle-ui' onClick={() => { setOpen(true); setEditing(true); }} aria-label='Open secret Layout Studio'>Arrange</button>}
    {open && <section className='rle-panel rle-ui' aria-label='Rosie Layout Studio'>
      <header className='rle-header'>
        <div><strong>ROSIE LAYOUT STUDIO</strong><small>Exact screen: {screenKey}</small></div>
        <button type='button' onClick={() => setOpen(false)} aria-label='Minimize Layout Studio'>−</button>
      </header>
      <div className='rle-row rle-row-primary'>
        <label className='rle-page-label'>Page
          <select value={page} onChange={event => { setSelected([]); onNavigate(event.target.value); }}>
            {STUDIO_PAGES.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button type='button' className={editing ? 'rle-on' : ''} onClick={() => setEditing(current => !current)}>
          {editing ? 'Arrange' : 'Scroll / interact'}
        </button>
        <button type='button' className={multi ? 'rle-on' : ''} onClick={() => { setMulti(value => !value); }}>
          {multi ? 'Group ON' : 'Group select'}
        </button>
      </div>
      <div className='rle-row'>
        <button type='button' onClick={() => setShowElements(state => !state)}>{showElements ? 'Hide elements' : 'Choose elements'} ({selected.length})</button>
        <button type='button' onClick={() => setSelected([])} disabled={!selected.length}>Clear selection</button>
        <button type='button' onClick={undo} disabled={!history.current.length}>Undo</button>
      </div>
      {showElements && <div className='rle-elements'>
        <input aria-label='Find elements' value={filter} onChange={event => setFilter(event.target.value)} placeholder='Find an element...' />
        {visibleTargets.map(([id,label]) => <label key={id} className='rle-element'>
          <input type='checkbox' checked={selected.includes(id)} onChange={() => choose(id)}/>
          <span>{label}</span>
        </label>)}
      </div>}
      {selected.length > 0 && <div className='rle-scale'>
        <label>Size {Math.round(chosenScale * 100)}% {selected.length > 1 ? '(group)' : ''}
          <input type='range' min='0.3' max='3' step='0.05' value={chosenScale}
            onChange={event => setScale(event.target.value)} />
        </label>
        <button type='button' onClick={resetSelected}>Reset selection</button>
      </div>}
      <div className='rle-row rle-footer'>
        <button type='button' onClick={resetPage}>Reset page</button>
        <button type='button' onClick={exportDraft}>Export</button>
        <button type='button' className='rle-save' onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save all pages'}</button>
      </div>
      <small className='rle-help'>Tap to select; drag to move; drag ↘ to resize. Group select lets you tap several elements and drag them together. Switch to Scroll / interact to use page controls. Changes remain private until Save.</small>
      <div className='rle-last-row'>
        <span>{dirty ? 'Unpublished edits' : 'Saved view'} · {editedPages} customized page{editedPages === 1 ? '' : 's'}</span>
        <button type='button' onClick={hideEditor}>Hide secret button</button>
      </div>
      {status && <p className='rle-status' role='status'>{status}</p>}
    </section>}
  </>;
}
