import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,...(process.env.ROSIE_SYSTEM_CHROME ? {channel:'chrome'} : {})});
const data=new Map();
const base=process.env.BASE_URL||'http://127.0.0.1:5173';
try{
 const ctx=await browser.newContext({viewport:{width:713,height:977},screen:{width:713,height:977},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/layout-presets*',async route=>{
  const req=route.request();
  if(req.method()==='GET'){
   const key=new URL(req.url()).searchParams.get('screenKey');
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({layouts:data.get(key)||{},updatedAt:null})});
  }
  const input=req.postDataJSON();
  if(input.action==='unlock')return route.fulfill({status:200,contentType:'application/json',body:'{"unlocked":true}'});
  if(input.action==='save'){
   data.set(input.screenKey,input.layouts);
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({saved:true,layouts:input.layouts,screenKey:input.screenKey})});
  }
  return route.fulfill({status:200,contentType:'application/json',body:'{"hidden":true}'});
 });
 await page.goto(base+'/#fortune',{waitUntil:'domcontentloaded'});
 await page.locator('#question').waitFor();
 await page.locator('.loading-screen-hidden').waitFor({state:'attached'});
 await page.waitForTimeout(450);
 assert.equal(await page.locator('.rle-mini').count(),0);
 await page.locator('#question').fill('manchego');
 await page.locator('.rle-mini').waitFor();
 assert.equal(await page.locator('.rle-mini button').count(),3);
 await page.locator('.rle-mini button').filter({hasText:'Interact'}).click();
 await page.locator('.rle-mini button').filter({hasText:'Arrange'}).click();
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 const panel=page.locator('.rle-panel');
 await panel.waitFor();
 const first=await panel.boundingBox();
 const header=page.locator('.rle-header');
 const h=await header.boundingBox();
 await page.mouse.move(h.x+80,h.y+12);await page.mouse.down();
 await page.mouse.move(h.x+35,h.y+32,{steps:5});await page.mouse.up();
 const moved=await panel.boundingBox();
 assert.ok(Math.abs(moved.x-first.x)>15,'Panel header is draggable');
 console.log('PASS floating movable studio and compact Arrange/Interact/caret');

 await page.locator('.rle-page-label select').selectOption('haiku');
 await page.locator('.haiku-scroll').waitFor();
 await page.getByRole('button',{name:'Group select'}).click();
 await page.getByRole('button',{name:/Choose elements/}).click();
 const check=name=>page.locator('.rle-element').filter({hasText:name}).locator('input[type=checkbox]');
 await check('All scroll designs').check();
 await check('Background button group').check();
 assert.match(await page.getByRole('button',{name:/Hide elements/}).innerText(),/2/);
 assert.equal(await page.locator('.rle-page-guide').count(),6);
 await page.getByRole('button',{name:'Minimize Layout Studio'}).click();
 await page.locator('.haiku-scroll').evaluate(el=>el.scrollIntoView({block:'center'}));
 await page.waitForTimeout(180);
 const original=await page.locator('.haiku-scroll').boundingBox();
 const partnerOriginal=await page.locator('.haiku-scene-selector').boundingBox();
 const outline=page.locator('.rle-outline[data-target-id=scroll]');
 await outline.waitFor();
 const rect=await outline.boundingBox();
 await page.mouse.move(rect.x+Math.min(35,rect.width/4),rect.y+35);
 await page.mouse.down();await page.mouse.move(rect.x+Math.min(35,rect.width/4)+26,rect.y+55,{steps:5});await page.mouse.up();
 const final=await page.locator('.haiku-scroll').boundingBox();
 assert.ok(Math.abs(final.x-original.x-26)<4,'Dragging a selected group moves the scroll');
 const movedPartner=await page.locator('.haiku-scene-selector').boundingBox();
 assert.ok(Math.abs((movedPartner.x-partnerOriginal.x)-(final.x-original.x))<2.5,
   'Group partner follows exact snapped movement: '+JSON.stringify({scroll:final.x-original.x,partner:movedPartner.x-partnerOriginal.x}));
 console.log('PASS multi-item drag and selected midpoint guides');

 const rect2=await outline.boundingBox();
 await page.mouse.click(rect2.x+Math.min(35,rect2.width/4),rect2.y+35);
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 assert.match(await page.getByRole('button',{name:/Hide elements/}).innerText(),/1/);
 console.log('PASS tapping one group item deselects just that item');
 await check('All scroll designs').check();
 await page.getByRole('button',{name:'Equalize row ↔'}).click();
 assert.match(await page.locator('.rle-status').innerText(),/Spacing adjusted/);
 await page.getByRole('button',{name:'Current design only'}).click();
 await check('Sakura scroll only').check();
 await page.getByRole('button',{name:'↷ +15°'}).click();
 assert.match(await page.locator('.haiku-scroll').evaluate(el=>el.style.rotate),/15deg/);
 await page.getByRole('button',{name:'Next scroll design'}).click();
 await page.waitForTimeout(150);
 const imperialRotation=await page.locator('.haiku-scroll').evaluate(el=>el.style.rotate);
 assert.ok(!imperialRotation.includes('15deg'),'Other scroll style has no Sakura rotation');
 await page.getByRole('button',{name:'Previous scroll design'}).click();
 await page.waitForTimeout(150);
 assert.match(await page.locator('.haiku-scroll').evaluate(el=>el.style.rotate),/15deg/);
 console.log('PASS independent scroll styles, shared controls and rotation');

 await page.locator('.rle-page-label select').selectOption('fortune');
 await page.getByRole('button',{name:'Marquee select'}).click();
 await page.locator('.question-card').scrollIntoViewIfNeeded();
 await page.waitForTimeout(200);
 const card=await page.locator('.question-card').boundingBox();
 await page.getByRole('button',{name:'Minimize Layout Studio'}).click();
 const sx=Math.max(8,card.x-7),sy=Math.max(10,card.y-7);
 const ex=Math.min(700,card.x+Math.min(card.width,280));
 const ey=Math.min(947,card.y+Math.min(card.height,220));
 await page.mouse.move(sx,sy);await page.mouse.down();
 await page.mouse.move(ex,ey,{steps:6});
 assert.equal(await page.locator('.rle-marquee').evaluate(el=>getComputedStyle(el).display),'block');
 await page.mouse.up();
 await page.getByRole('button',{name:'Open full Layout Studio'}).click();
 const textSelection=await page.getByRole('button',{name:/Hide elements/}).innerText();
 assert.ok(Number(textSelection.match(/\d+/)?.[0]||0)>=1,'Marquee drag must select at least one canvas target: '+textSelection);
 console.log('PASS direct marquee gesture adds selected canvas targets');
 await page.getByRole('button',{name:'Clear selection'}).click();

 await page.getByRole('button',{name:'Snap on'}).click();
 await page.getByRole('button',{name:'Guides on'}).click();
 assert.equal(await page.locator('.rle-page-guide').count(),0);
 await page.getByRole('button',{name:'Snap off'}).click();
 await page.getByRole('button',{name:'Guides off'}).click();
 await page.getByRole('button',{name:'Marquee ON'}).click();
 await check('Question form').check();
 await page.getByRole('button',{name:'↷ +15°'}).click();
 await page.getByRole('button',{name:'Save all pages'}).click();
 await page.getByText(/Saved. All pages updated/).waitFor();
 const layouts=data.values().next().value;
 assert.ok(layouts.haiku && layouts.fortune,'Both pages saved in one operation');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.question-card').waitFor();
 await page.waitForTimeout(750);
 assert.match(await page.locator('.question-card').evaluate(el=>el.style.rotate),/15deg/);
 await page.goto(base+'/#haiku',{waitUntil:'domcontentloaded'});
 await page.locator('.haiku-scroll').waitFor();
 await page.waitForTimeout(750);
 assert.match(await page.locator('.haiku-scroll').evaluate(el=>el.style.rotate),/15deg/);
 await page.setViewportSize({width:714,height:977});
 await page.waitForTimeout(350);
 assert.ok(!await page.locator('.haiku-scroll').evaluate(el=>el.style.rotate).then(s=>s.includes('15deg')),'Other CSS viewport must remain untouched');
 assert.deepEqual(errors,[]);
 console.log('PASS cross-page save, reload and exact viewport isolation');
}finally{await browser.close();}
