import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const database=new Map();
const origin=process.env.BASE_URL||'http://127.0.0.1:5173';
try {
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/layout-presets*',async route=>{
   const request=route.request();
   if(request.method()==='GET'){
     const key=new URL(request.url()).searchParams.get('screenKey');
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({layouts:database.get(key)||{},updatedAt:null})});
   }
   const input=request.postDataJSON();
   if(input.action==='unlock')return route.fulfill({status:200,contentType:'application/json',body:'{"unlocked":true}'});
   if(input.action==='save'){
     database.set(input.screenKey,input.layouts);
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({saved:true,screenKey:input.screenKey,layouts:input.layouts})});
   }
   return route.fulfill({status:200,contentType:'application/json',body:'{"hidden":true}'});
 });
 const go=async name=>{
   await page.locator('.rle-page-label select').selectOption(name);
   await page.waitForTimeout(160);
 };
 const find=name=>page.locator('.rle-elements .rle-element').filter({hasText:name}).locator('input[type=checkbox]');
 await page.goto(origin+'/#fortune',{waitUntil:'domcontentloaded',timeout:55000});
 await page.locator('#question').waitFor({state:'visible',timeout:40000});
 await page.locator('.loading-screen-hidden').waitFor({state:'attached',timeout:20000});
 await page.waitForTimeout(350);
 await page.locator('#question').fill('manchego');
 await page.locator('.rle-mini').waitFor();
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 assert.match(await page.locator('.rle-header small').innerText(),/window:1440x900@1/);
 assert.match(await page.getByRole('button',{name:'Snap off'}).innerText(),/Snap off/);
 console.log('PASS: desktop unlock and precision-first mouse defaults');
 await go('home');
 const lantern=page.locator('[data-layout-target="home-zen-lantern"]');
 await lantern.waitFor({state:'attached'});
 await page.getByRole('button',{name:/Choose elements/}).click();
 await find('Zen garden lantern').check();
 await page.locator('.rle-outline[data-target-id="zen-lantern"]').waitFor({state:'visible',timeout:10000});
 await page.keyboard.press('ArrowRight');
 const firstX=await lantern.evaluate(el=>el.style.translate);
 assert.match(firstX,/1px/,'Arrow key should nudge despite checkbox having focus');
 await page.keyboard.press('Shift+ArrowDown');
 const secondY=await lantern.evaluate(el=>el.style.translate);
 assert.match(secondY,/10px/,'Shift+Arrow should move ten pixels');
 await page.keyboard.press('Control+z');
 const undoY=await lantern.evaluate(el=>el.style.translate);
 assert.ok(!undoY.includes('10px'),'Ctrl+Z must undo the last keyboard move');
 await page.getByRole('button',{name:'Minimize Layout Studio'}).click();
 await lantern.scrollIntoViewIfNeeded();
 await page.waitForTimeout(150);
 const lanternBeforeDrag=await lantern.boundingBox();
 const lanternFrame=await page.locator('.rle-outline[data-target-id="zen-lantern"]').boundingBox();
 const mx=lanternFrame.x+Math.min(25,lanternFrame.width/3);
 const my=lanternFrame.y+Math.min(30,lanternFrame.height/3);
 await page.mouse.move(mx,my);await page.mouse.down();
 await page.mouse.move(mx+16,my+9,{steps:5});await page.mouse.up();
 const lanternAfterDrag=await lantern.boundingBox();
 assert.ok(Math.abs(lanternAfterDrag.x-lanternBeforeDrag.x-16)<3,'Desktop mouse drag must move the lantern');
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 console.log('PASS: precision mouse drag of selected landing lantern');

 // Core promise: the artwork itself drags while still in marquee-selection mode.
 await page.getByRole('button',{name:'Marquee select'}).click();
 await page.getByRole('button',{name:'Minimize Layout Studio'}).click();
 const outlined=page.locator('.rle-outline[data-target-id="zen-lantern"]');
 await outlined.evaluate(el=>{el.style.pointerEvents='none'});
 const naturalStart=await lantern.boundingBox();
 const fx=naturalStart.x+naturalStart.width*.45,fy=naturalStart.y+naturalStart.height*.52;
 await page.mouse.move(fx,fy);
 await page.mouse.down();
 await page.mouse.move(fx+24,fy+14,{steps:8});
 await page.mouse.up();
 const naturalEnd=await lantern.boundingBox();
 assert.ok(Math.abs(naturalEnd.x-naturalStart.x-24)<4,'Drag on actual selected artwork must work even while marquee mode is enabled');
 assert.ok(Math.abs(naturalEnd.y-naturalStart.y-14)<4,'Selected artwork should follow the mouse vertically '+JSON.stringify({before:naturalStart,after:naturalEnd,viewport:await page.evaluate(()=>({scrollY:scrollY,innerHeight:innerHeight}))}));
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 await page.getByRole('button',{name:'Marquee ON'}).click();
 console.log('PASS: drag selected artwork directly despite marquee mode and disabled outline');

 // An explicit drag handle in the open editor is an alternate direct gesture.
 const pad=page.getByRole('button',{name:'Drag selected elements'});
 await pad.waitFor({state:'visible'});
 const padBox=await pad.boundingBox();
 const padStart=await lantern.boundingBox();
 const px=padBox.x+Math.min(50,padBox.width/3),py=padBox.y+padBox.height/2;
 await page.mouse.move(px,py);await page.mouse.down();
 await page.mouse.move(px+35,py+18,{steps:7});await page.mouse.up();
 const padEnd=await lantern.boundingBox();
 assert.ok(Math.abs(padEnd.x-padStart.x-35)<4,'Dragging selected-group grip must move the selected artwork');
 assert.ok(Math.abs(padEnd.y-padStart.y-18)<4,'Dragging the grip must preserve vertical motion');
 console.log('PASS: editor drag-selected handle moves actual artwork while panel is open');


 await page.getByRole('spinbutton',{name:'Horizontal position X'}).fill('28');
 const numberX=await lantern.evaluate(el=>el.style.translate);
 assert.match(numberX,/28px/,'Exact X/Y controls apply to selected lantern');
 console.log('PASS: Zen lantern selectable, arrow nudges, undo and precise X positioning');
 await page.getByRole('button',{name:'Clear selection'}).click();
 await page.getByRole('button',{name:'Pick any',exact:true}).click();
 await page.locator('button[aria-label="Open Fortune Teller"]').scrollIntoViewIfNeeded();
 const art=page.locator('button[aria-label="Open Fortune Teller"] img');
 await art.click({force:true});
 await page.locator('.rle-outline[data-target-id^="auto-"]').first().waitFor({state:'visible',timeout:10000});
 const autoId=await page.locator('.rle-outline[data-target-id^="auto-"]').first().getAttribute('data-target-id');
 await page.keyboard.press('ArrowRight');
 const actual=await art.evaluate(el=>el.style.translate);
 const buttonActual=await art.locator('..').evaluate(el=>el.style.translate);
 assert.ok(actual.includes('1px')||buttonActual.includes('1px'),'Picked artwork must move from keyboard');
 console.log('PASS: Pick any selects and adjusts unregistered image with stable id '+autoId);
 await page.getByRole('button',{name:'Clear selection'}).click();
 await page.getByRole('button',{name:'Pick any ON'}).click();
 await go('recipes');
 await page.locator('.recipes-desktop-controls .recipes-inline-search').waitFor({state:'attached'});
 await find('Desktop recipe search panel').check();
 await page.getByRole('spinbutton',{name:'Horizontal position X'}).fill('18');
 assert.match(await page.locator('.recipes-desktop-controls .recipes-inline-search').evaluate(el=>el.style.translate),/18px/);
 await page.getByRole('button',{name:'Clear selection'}).click();
 await go('reviews');
 await page.locator('.reviews-desktop-discovery .reviews-search').waitFor({state:'attached'});
 await find('Desktop movie search panel').check();
 await page.getByRole('spinbutton',{name:'Vertical position Y'}).fill('-12');
 assert.match(await page.locator('.reviews-desktop-discovery .reviews-search').evaluate(el=>el.style.translate),/12px/);
 console.log('PASS: desktop search panels are individually movable on Recipes and Reviews');
 await page.keyboard.press('Control+s');
 await page.getByText(/Saved. All pages updated/).waitFor({timeout:10000});
 const saved=database.get('window:1440x900@1');
 assert.ok(saved.home?.['zen-lantern']&&saved.home?.[autoId]&&saved.recipes?.['search-desktop']&&saved.reviews?.['search-desktop']);
 console.log('PASS: Ctrl+S saves multiple pages and automatic targets together');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.reviews-desktop-discovery .reviews-search').waitFor();
 await page.waitForTimeout(250);
 assert.match(await page.locator('.reviews-desktop-discovery .reviews-search').evaluate(el=>el.style.translate),/12px/);
 await page.goto(origin+'/#home',{waitUntil:'domcontentloaded'});
 await lantern.waitFor();
 await page.waitForTimeout(450);
 assert.match(await lantern.evaluate(el=>el.style.translate),/28px/);
 await art.waitFor();
 const restored=await art.evaluate(el=>el.style.translate);
 const restoredButton=await art.locator('..').evaluate(el=>el.style.translate);
 assert.ok(restored.includes('1px')||restoredButton.includes('1px'),'Automatic target persists after reload');
 await page.setViewportSize({width:1441,height:900});
 await page.waitForTimeout(500);
 assert.ok(!String(await lantern.evaluate(el=>el.style.translate)).includes('28px'),'Different viewport must remain unaffected');
 console.log('PASS: saved desktop moves survive reload and remain exact-screen isolated');
 assert.deepEqual(errors,[]);
} finally {
 await browser.close();
}
