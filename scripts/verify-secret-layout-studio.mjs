import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.BASE_URL || 'https://rosie-app-git.vercel.app';
const browser = await chromium.launch({ headless: true });
const log = (...items) => console.log('[layout-touch-qa]', ...items);
await fs.mkdir('artifacts/secret-layout-studio', { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 713, height: 977 },
    screen: { width: 713, height: 977 },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('PAGE ERROR', error.message));
  await page.goto(base + '/#fortune', { waitUntil: 'domcontentloaded', timeout: 55000 });
  await page.locator('#question').waitFor({ state: 'visible', timeout: 45000 });
  const unlockBefore = await page.locator('.rle-launch').count();
  assert.equal(unlockBefore, 0, 'Hidden layout button must not appear before unlock.');
  await page.locator('#question').fill('manchego');
  await page.locator('.rle-launch').waitFor({ state: 'visible', timeout: 15000 });
  log('PASS: Oracle phrase unlocks secret Arrange button');
  await page.locator('.rle-launch').click();
  await page.locator('.rle-panel').waitFor({ state: 'visible' });
  const key = await page.locator('.rle-header small').innerText();
  assert.match(key, /touch:713x977:portrait:713w@3/);
  log('PASS: Touchscreen signature', key);
  await page.locator('.rle-page-label select').selectOption('haiku');
  await page.locator('.haiku-scroll').waitFor({ state: 'attached', timeout: 45000 });
  await page.locator('.haiku-scene-selector').waitFor({ state: 'attached', timeout: 45000 });
  await page.getByRole('button', { name: 'Group select', exact: true }).click();
  await page.getByRole('button', { name: /Choose elements/ }).click();
  await page.locator('.rle-elements .rle-element').filter({ hasText: 'Poetry scroll artwork' }).locator('input').check();
  await page.locator('.rle-elements .rle-element').filter({ hasText: 'Background button group' }).locator('input').check();
  assert.match(await page.getByRole('button', { name: /Hide elements/ }).innerText(), /2/);
  log('PASS: Touch-target group selection of independent art elements');
  const before = await page.locator('.haiku-scroll').evaluate(el => {
    const rect=el.getBoundingClientRect();
    return { x:rect.x,y:rect.y };
  });
  const otherBefore = await page.locator('.haiku-scene-selector').evaluate(el => {
    const rect=el.getBoundingClientRect();
    return { x:rect.x,y:rect.y };
  });
  await page.getByRole('button', { name: 'Minimize Layout Studio' }).click();
  const target = await page.locator('.haiku-scroll').boundingBox();
  assert.ok(target?.width && target?.height,'Poetry scroll has real dimensions');
  let x=Math.min(695,Math.max(15,target.x+Math.min(35,target.width/4)));
  let y=Math.min(955,Math.max(20,target.y+Math.min(35,target.height/4)));
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+28,y+19,{steps:5});
  await page.mouse.up();
  await page.waitForTimeout(500);
  const after = await page.locator('.haiku-scroll').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return { x:r.x,y:r.y,translate:el.style.translate };
  });
  const otherAfter = await page.locator('.haiku-scene-selector').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return { x:r.x,y:r.y,translate:el.style.translate };
  });
  assert.ok(Math.abs((after.x-before.x)-28) < 4 && Math.abs((after.y-before.y)-19) < 4,
    'Scroll should move by drag: '+JSON.stringify({before,after}));
  assert.ok(Math.abs((otherAfter.x-otherBefore.x)-28) < 4 && Math.abs((otherAfter.y-otherBefore.y)-19) < 4,
    'Group partner should move together: '+JSON.stringify({otherBefore,otherAfter}));
  log('PASS: Pointer drag translates both selected elements as a group');

  await page.locator('.rle-launch').click();
  await page.locator('.rle-page-label select').selectOption('fortune');
  await page.locator('.question-card').waitFor({ state: 'attached', timeout: 20000 });
  await page.locator('.rle-elements .rle-element').filter({ hasText: 'Question form' }).locator('input').check();
  await page.locator('.rle-scale input[type=range]').fill('1.15');
  log('PASS: Multiple pages edited before publication');
  assert.match(await page.locator('.rle-last-row').innerText(), /Unpublished edits/);
  await page.getByRole('button', { name: 'Save all pages' }).click();
  await page.getByText(/Saved. All pages updated/).waitFor({ timeout: 25000 });
  log('PASS: Single Save commits every edited page');
  await page.screenshot({path:'artifacts/secret-layout-studio/saved-touch-layout.png',fullPage:false});
  await page.reload({ waitUntil:'domcontentloaded' });
  await page.locator('#question').waitFor({ state:'attached', timeout:45000 });
  await page.waitForTimeout(650);
  const savedFortune = await page.locator('.question-card').evaluate(el=>el.style.scale);
  assert.ok(savedFortune && savedFortune !== '1', 'Saved fortune override must survive page reload: '+savedFortune);
  await page.goto(base+'/#haiku',{waitUntil:'domcontentloaded',timeout:50000});
  await page.locator('.haiku-scroll').waitFor({state:'attached',timeout:40000});
  await page.waitForTimeout(900);
  const savedScroll = await page.locator('.haiku-scroll').evaluate(el=>el.style.translate);
  assert.ok(savedScroll.includes('28px') || savedScroll.includes('19px'), 'Saved haiku override must survive reload: '+savedScroll);
  log('PASS: Published overrides load automatically after reload on the same touch display');
  await page.setViewportSize({width:714,height:977});
  await page.waitForTimeout(900);
  const otherScreen = await page.locator('.haiku-scroll').evaluate(el=>el.style.translate);
  assert.ok(!otherScreen?.includes('28px'), 'A 1px viewport difference must not inherit the 713w layout: '+otherScreen);
  log('PASS: Distinct viewport width gets original unaffected layout');

  await page.screenshot({path:'artifacts/secret-layout-studio/other-width-isolated.png',fullPage:false});
  await context.close();
} finally {
  await browser.close();
}
