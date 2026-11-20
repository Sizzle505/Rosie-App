#!/usr/bin/env node
/**
 * Private, local-only preparation utility. No network, GitHub, Vercel or Rosie runtime calls.
 * No content is written under the Rosie-App repository.
 */
import { readFile, writeFile, mkdir, realpath, stat, lstat } from 'node:fs/promises';
import { dirname, resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const lab = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(lab, '..');
const catalog = JSON.parse(await readFile(join(lab, 'asset-catalog.json'), 'utf8'));
const example = JSON.parse(await readFile(join(lab, 'examples', 'profile.example.json'), 'utf8'));
const args = process.argv.slice(2);
const command = args.shift();
const option = (flag) => { const i = args.indexOf('--' + flag); return i < 0 ? undefined : args[i + 1]; };
const has = (flag) => args.includes('--' + flag);
const inside = (child, parent) => { const rel = relative(parent, child); return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith('/')); };
const ensurePrivate = async (dir, exists) => {
  if (!dir) throw new Error('An explicit --out or --pack directory is required.');
  const target = resolve(dir);
  // Resolve parent(s) to reject symlink paths back into Rosie-App.
  const realParent = await realpath(exists ? target : dirname(target));
  const repoReal = await realpath(repo);
  if (inside(target, repo) || inside(realParent, repoReal)) {
    throw new Error('Refusing to write inside the Rosie-App repository. Choose a private external directory.');
  }
  if (exists && (await lstat(target)).isSymbolicLink()) throw new Error('Refusing symbolic-link package folder.');
  return target;
};
const safeSlot = (path) => typeof path === 'string' && path.length > 0 &&
  !path.startsWith('/') && !path.includes('\\') && path.split('/').every(p => p && p !== '.' && p !== '..');
const allSlots = catalog.pages.flatMap(page => page.slots.map(slot => ({ ...slot, page: page.label })));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (path, content) => writeFile(path, content, { flag: has('replace') ? 'w' : 'wx' });
const readProfile = async pack => {
  const profile = JSON.parse(await readFile(join(pack, 'profile.json'), 'utf8'));
  if (profile.schemaVersion !== 1 || profile.pet?.species !== 'dog' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.pet?.id || '')) {
    throw new Error('Invalid v1 dog profile, or invalid pet ID.');
  }
  if (profile.features?.captain !== false || profile.features?.cardVault !== false) throw new Error('Captain and Vault must be disabled.');
  if (profile.backend?.accounts !== false || profile.backend?.cloudNotes !== false ||
      profile.backend?.secretSanta !== false || profile.backend?.email !== false) {
    throw new Error('Pet backend safety flags must all be false.');
  }
  return profile;
};
const locateAsset = async (pack, slot) => {
  if (!safeSlot(slot.target)) throw new Error('Unsafe asset slot: ' + slot.id);
  const base = join(pack, 'assets');
  const baseReal = await realpath(base);
  if (!inside(baseReal, pack)) throw new Error('Asset directory escapes private package.');
  const path = resolve(base, slot.target);
  if (!inside(path, base)) throw new Error('Asset path escapes pack: ' + slot.target);
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) return null;
    const fileReal = await realpath(path);
    if (!inside(fileReal, baseReal)) throw new Error('Pet asset escapes private package: ' + slot.target);
    return { path, bytes: info.size };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
};
const getStatus = async (pack) => {
  const found = [];
  const missing = [];
  for (const slot of allSlots) ((await locateAsset(pack, slot)) ? found : missing).push(slot);
  return { found, missing, completeEssential: missing.filter(slot => slot.required).length === 0 };
};
const pageHints = {
  home: 'Illustrated navigation or main hero. Preserve original button hit areas and text-safe margins.',
  fortune: 'Regal, adorable fortune teller, correct crystal-ball pose and head-turn continuity.',
  cheese: 'Doctor of Cheese illustration; expressions distinct and consistent. Existing cheese images can remain.',
  randomizers: 'Casino portrait, genuine coin relief and correctly valued dice. Do not change pip totals.',
  santa: 'Holiday host and festive frames. Avoid modifying invitations, email details, or user information.',
  calculations: 'Keep numeric controls untouched and hero art unobstructed.',
  timekeeper: 'Only change the pet illustrations; preserve clockwork and accurately aligned lever states.',
  qr: 'Preserve pure white QR square, empty quiet zone, and complete inset finish. Do not render a QR pattern.',
  recipes: 'Royal-kitchen artwork. Reuse the 25 food illustrations and recipes.',
  reviews: 'Preserve the cinema header text area and legibility.',
  reminders: 'Same illustrated executive dog across full desktop/mobile crops; keep controls readable.',
  resources: 'Pet-specific crest that matches the approved art, not a new page design.',
  account: 'Optional illustrated entry only; account backend stays disabled.'
};

if (command === 'init') {
  const id = option('id');
  const name = option('name');
  const out = option('out');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '')) throw new Error('--id must be a lowercase hyphenated slug.');
  if (!name?.trim() || name.length > 80) throw new Error('--name is required (max 80 characters).');
  const folder = await ensurePrivate(out, false);
  const profile = structuredClone(example);
  profile.pet.id = id;
  profile.pet.name = name.trim();
  profile.pet.breed = option('breed') || '';
  profile.pet.personality = option('personality') || '';
  profile.reviewStatus = 'draft';
  profile.backend = { accounts: false, cloudNotes: false, secretSanta: false, email: false };
  await mkdir(folder); // No recursive creation and no existing directory overwrite.
  for (const sub of ['assets','photos','masters']) await mkdir(join(folder, sub));
  await writeFile(join(folder, 'profile.json'), JSON.stringify(profile, null, 2) + '\n', { flag: 'wx' });
  await writeFile(join(folder, 'photos', 'README.md'), 'PRIVATE PHOTOS ONLY. See pet-template-lab/PHOTO-INTAKE.md. Do not commit or publish this directory.\n', { flag: 'wx' });
  console.log(JSON.stringify({ created: folder, id, photoDirectory: join(folder, 'photos'), assetDirectory: join(folder, 'assets'), accountServices: 'disabled' }, null, 2));
} else if (['prompts','review','status'].includes(command)) {
  const pack = await ensurePrivate(option('pack'), true);
  const profile = await readProfile(pack);
  const state = await getStatus(pack);
  if (command === 'status') {
    const perPage = catalog.pages.map(page => ({ page: page.label,
      approvedPresent: page.slots.filter(slot => state.found.some(x => x.id === slot.id)).length,
      slots: page.slots.length }));
    console.log(JSON.stringify({ pet: profile.pet.name, available: state.found.length,
      essentialRemaining: state.missing.filter(x => x.required).length,
      optionalRemaining: state.missing.filter(x => !x.required).length,
      completeEssential: state.completeEssential, pages: perPage }, null, 2));
  } else if (command === 'prompts') {
    const pieces = ['# Pet artwork brief - ' + profile.pet.name,
      '', 'Private draft. Never upload ten source photographs to public GitHub.',
      'Use the ten source images and approved canonical character master in ChatGPT. Source paths below are references only.',
      '', '## Canonical reference (must be approved before themed artwork)',
      'Render accurate front, both three-quarter faces, profile, seated, standing and expression references for ' + profile.pet.name + '.',
      'Breed: ' + (profile.pet.breed || 'as shown in photographs') + '. Personality: ' + (profile.pet.personality || 'as shown in photographs') + '.',
      'Preserve ear, muzzle, coat pattern, eye spacing, age, proportions, and tail. No generic breed substitutions.', ''];
    for (const page of catalog.pages) {
      pieces.push('## ' + page.label, '', pageHints[page.id] || 'Match the source layout.');
      for (const slot of page.slots) {
        pieces.push('', '### ' + slot.id + (slot.required ? '' : ' (optional / may inherit)'),
          'Source composition: ' + slot.source,
          'Destination filename: assets/' + slot.target,
          'Create a high-quality painterly illustration of the actual dog ' + profile.pet.name + ' using the ten photographs and approved canon. Match the original composition, camera perspective, lighting, palette, ornamental treatment, framing, and empty areas from the indicated RosieVerse source. Replace only the dog or explicitly pet-branded content. Preserve non-pet scenes and UI. Keep muzzle, ears, coat markings, age and tail accurate. Keep text and QR apertures unobstructed. Preserve the transparency and aspect ratio of the original; do not add invented text or labels.',
          'Acceptance: recognizable dog, no deformation, safe mobile crop, correct role, no new UI, approved output format.');
      }
      pieces.push('');
    }
    await text(join(pack, 'prompts.md'), pieces.join('\n'));
    console.log('Created private artwork prompt pack: ' + join(pack, 'prompts.md'));
  } else if (command === 'review') {
    const cards = allSlots.map(slot => {
      const ok = state.found.some(x => x.id === slot.id);
      const src = 'assets/' + slot.target.split('/').map(encodeURIComponent).join('/');
      return '<article class="card ' + (ok ? 'ready' : 'missing') + '">' +
        '<div class="image">' + (ok ? '<img src="' + src + '" alt="' + escapeHtml(slot.id) + '">' : '<span>Awaiting approved asset</span>') + '</div>' +
        '<div><strong>' + escapeHtml(slot.id) + '</strong><p>' + escapeHtml(slot.page) + ' · ' + (slot.required ? 'Essential' : 'Optional') + '</p>' +
        '<code>' + escapeHtml(slot.target) + '</code></div></article>';
    }).join('\n');
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pet artwork QA</title>' +
      '<style>body{font:15px system-ui;margin:0;padding:28px;background:#f8f6f2;color:#24211d}header{max-width:1000px;margin:auto}h1{margin:0 0 8px}.meta{color:#6e6252}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:16px;max-width:1300px;margin:22px auto}.card{border:1px solid #d8d0c5;background:white;border-radius:12px;overflow:hidden}.image{height:196px;display:grid;place-items:center;background:#ede7df;color:#665b4c}.image img{width:100%;height:100%;object-fit:contain}.image span{padding:15px}article>div:last-child{padding:14px}p{color:#72685e;font-size:13px;margin:8px 0}code{overflow-wrap:anywhere;font-size:12px}.ready{border-color:#b9cfbc}</style></head><body>' +
      '<header><h1>' + escapeHtml(profile.pet.name) + ' - artwork review</h1><p class="meta">Private local review. ' + state.found.length + '/' + allSlots.length + ' assets present. ' + state.missing.filter(x=>x.required).length + ' essential remaining. Presence is not visual approval.</p></header>' +
      '<main class="grid">' + cards + '</main></body></html>';
    await text(join(pack, 'review.html'), html);
    console.log('Created private local review gallery: ' + join(pack, 'review.html'));
  }
} else {
  console.log('Usage:\n' +
    '  node pet-template-lab/scripts/prepare.mjs init --out /private/pets/buddy --id buddy --name Buddy [--breed ...]\n' +
    '  node pet-template-lab/scripts/prepare.mjs prompts --pack /private/pets/buddy [--replace]\n' +
    '  node pet-template-lab/scripts/prepare.mjs status --pack /private/pets/buddy\n' +
    '  node pet-template-lab/scripts/prepare.mjs review --pack /private/pets/buddy [--replace]');
  if (command && command !== 'help' && command !== '--help') process.exitCode = 2;
}
