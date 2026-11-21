import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, db, readBody, respond, sameOrigin } from './_lib/core.js';

const EDITOR_COOKIE = 'rosie_layout_editor';
const MAX_AGE = 60 * 60 * 24 * 30;
const KEY_PATTERN = /^(touch|window):[a-z0-9x.:@-]{6,90}$/;
const PAGE_IDS = new Set(['home','fortune','cheese','captain','captain2','vault','randomizers','haiku','reminders','calculations','timekeeper','resources','qr-atelier','recipes','reviews']);
const tokenSecret = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function sign(value) {
  const secret = tokenSecret();
  if (!secret) throw new Error('Layout editor signing is unavailable.');
  return createHmac('sha256', secret).update('rosie-layout-editor:' + value).digest('hex');
}
function authorized(req) {
  const value = cookies(req)[EDITOR_COOKIE] || '';
  const [issued, digest] = value.split('.');
  if (!/^\d{10,14}$/.test(issued || '') || !/^[a-f0-9]{64}$/.test(digest || '')) return false;
  const age = Date.now() - Number(issued);
  if (age < 0 || age > MAX_AGE * 1000) return false;
  const expected = Buffer.from(sign(issued), 'hex');
  return timingSafeEqual(expected, Buffer.from(digest, 'hex'));
}
function cookie(value, age) {
  return EDITOR_COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + age +
    (process.env.VERCEL ? '; Secure' : '');
}
function safeLayouts(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Invalid layouts.');
  const output = {};
  if (Object.keys(source).length > PAGE_IDS.size) throw new Error('Too many pages.');
  for (const [page, elements] of Object.entries(source)) {
    if (!PAGE_IDS.has(page) || !elements || typeof elements !== 'object' || Array.isArray(elements)) throw new Error('Invalid page.');
    if (Object.keys(elements).length > 100) throw new Error('Too many elements.');
    const clean = {};
    for (const [id, value] of Object.entries(elements)) {
      if (!/^[a-z0-9-]{1,50}$/.test(id) || !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid element.');
      const x = Number(value.x), y = Number(value.y), scale = Number(value.scale), rotate = value.rotate === undefined ? 0 : Number(value.rotate);
      if (![x,y,scale,rotate].every(Number.isFinite) || Math.abs(x) > 2500 || Math.abs(y) > 2500 || scale < 0.3 || scale > 3 || Math.abs(rotate) > 360) throw new Error('Invalid position.');
      if (x || y || scale !== 1 || rotate) clean[id] = { x, y, scale, ...(rotate ? { rotate } : {}) };
    }
    if (Object.keys(clean).length) output[page] = clean;
  }
  return output;
}
function keyOK(key) { return typeof key === 'string' && key.length <= 96 && KEY_PATTERN.test(key); }
function fail(res, status, message) { return respond(res, status, { error: message }); }
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const screenKey = req.query?.screenKey;
    if (!keyOK(screenKey)) return fail(res, 400, 'Invalid screen signature.');
    try {
      const rows = await db('rosie_layout_presets?select=layouts,updated_at&screen_key=eq.' + encodeURIComponent(screenKey) + '&limit=1');
      return respond(res, 200, { layouts: rows[0]?.layouts || {}, updatedAt: rows[0]?.updated_at || null });
    } catch { return fail(res, 503, 'Layouts could not be loaded.'); }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return fail(res, 405, 'Method not allowed.');
  }
  if (!sameOrigin(req)) return fail(res, 403, 'Origin not allowed.');
  let body;
  try { body = readBody(req); } catch { return fail(res, 400, 'Invalid request.'); }
  if (body.action === 'unlock') {
    if (String(body.phrase || '').trim().toLowerCase() !== 'manchego') return fail(res, 403, 'Incorrect phrase.');
    try {
      const issued = String(Date.now());
      res.setHeader('Set-Cookie', cookie(issued + '.' + sign(issued), MAX_AGE));
      return respond(res, 200, { unlocked: true });
    } catch { return fail(res, 503, 'The editor is unavailable.'); }
  }
  if (body.action === 'hide') {
    res.setHeader('Set-Cookie', cookie('', 0));
    return respond(res, 200, { hidden: true });
  }
  if (body.action !== 'save') return fail(res, 400, 'Unknown action.');
  try { if (!authorized(req)) return fail(res, 403, 'Unlock Layout Studio in the Oracle first.'); }
  catch { return fail(res, 503, 'The editor is unavailable.'); }
  if (!keyOK(body.screenKey)) return fail(res, 400, 'Invalid screen signature.');
  let layouts;
  try { layouts = safeLayouts(body.layouts); } catch { return fail(res, 400, 'Invalid layout adjustments.'); }
  try {
    const path = 'rosie_layout_presets?screen_key=eq.' + encodeURIComponent(body.screenKey);
    const existing = await db(path + '&select=screen_key&limit=1');
    const update = { layouts, updated_at: new Date().toISOString() };
    if (existing.length) await db(path, { method: 'PATCH', body: update, returnRows: false });
    else await db('rosie_layout_presets', { method: 'POST', body: { screen_key: body.screenKey, ...update }, returnRows: false });
    return respond(res, 200, { saved: true, screenKey: body.screenKey, layouts });
  } catch { return fail(res, 503, 'Could not publish this layout. Your draft is still on this device.'); }
}
