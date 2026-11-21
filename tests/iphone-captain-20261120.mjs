import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
let page=await browser.newPage({viewport:{width:390,height:844},
  deviceScaleFactor:1,isMobile:true,hasTouch:true});
const visit=async(route,selector)=>{
  await page.goto(base+"/#"+route,{waitUntil:"domcontentloaded",timeout:60000});
  await page.locator(selector).waitFor({state:"visible",timeout:20000});
  await page.locator(".loading-screen").waitFor({state:"hidden",timeout:15000});
};
try{
  await visit("home","[data-layout-target='home-hero'] > img");
  const home=await page.locator("[data-layout-target='home-hero']").evaluate(node=>{
    const im=node.querySelector("img"),a=node.getBoundingClientRect(),b=im.getBoundingClientRect();
    return {gap:Math.abs(a.height-b.height),natural:im.naturalWidth/im.naturalHeight,
      displayed:b.width/b.height,objectFit:getComputedStyle(im).objectFit};
  });
  assert.ok(home.gap<2,"Home hero must not have framed top/bottom dead space: "+home.gap);
  assert.ok(Math.abs(home.natural-home.displayed)<.02,"Home Rosie must preserve native artwork ratio");
  assert.equal(home.objectFit,"contain","Home Rosie is never cropped");
  const resourcesTop=await page.getByRole("button",{name:"Open Rosie's Resources"}).evaluate(el=>getComputedStyle(el).top);
  assert.equal(resourcesTop,"-20px","Resources button moved up exactly 20px");
  console.log("PASS home natural Rosie artwork and raised Resources button");

  await visit("resources",".rr-hub-header");
  const gallery=await page.evaluate(()=>{
    const rect=el=>el.getBoundingClientRect();
    const cards=[...document.querySelectorAll(".rr-hub-buttons .rr-hub-button")].map(el=>rect(el));
    const header=rect(document.querySelector(".rr-hub-header"));
    const gaps=cards.slice(1).map((r,i)=>r.top-cards[i].bottom);
    return{count:cards.length,widths:cards.map(r=>r.width),heights:cards.map(r=>r.height),
      gaps,headerHeight:header.height,
      scrollHeight:document.querySelector(".rr-hub-page").scrollHeight,
      viewportWidth:document.documentElement.scrollWidth};
  });
  assert.equal(gallery.count,6);
  assert.ok(gallery.headerHeight>=100,"Resources heading must be large");
  assert.ok(Math.max(...gallery.heights)-Math.min(...gallery.heights)<2,
    "Resource plaques must have identical dimensions");
  assert.ok(Math.max(...gallery.gaps)-Math.min(...gallery.gaps)<3,
    "Resource gaps must be consistent");
  assert.ok(gallery.viewportWidth<=392,"Resources must not scroll horizontally");
  console.log("PASS six uniform Resources plaques with larger crest",JSON.stringify(gallery));

  await visit("reviews",".rosie-reviews");
  const padding=await page.locator(".rosie-reviews").evaluate(el=>getComputedStyle(el).paddingTop);
  assert.equal(padding,"30px","Reviews must move down 30px on iPhone");
  console.log("PASS Reviews lowered by 30px");

  await visit("captain",".captain-fs-yacht");
  assert.equal(await page.locator(".captain-fullscreen-toggle").count(),0,
    "No manual fullscreen toggles on Captain game frames");
  await page.locator(".yacht-cast-off").first().click();
  await page.waitForTimeout(250);
  const yachtExpanded=await page.locator(".captain-fs-yacht").evaluate(el=>
    el.classList.contains("is-expanded")||document.fullscreenElement===el);
  assert.ok(yachtExpanded,"Yacht must auto fullscreen when Cast Off is tapped");
  console.log("PASS Yacht auto fullscreen and no fullscreen buttons");

  // Leave a fullscreen game as a player would on desktop.
  // A fullscreen Yacht occupies the pointer surface by design. Start the
  // Tunnel test in a new app page, as a separate game launch session.
  await page.close();
  page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await visit("captain",".captain-fs-tunnel");
  await page.locator(".ember-expedition-launch").scrollIntoViewIfNeeded();
  await page.locator(".ember-expedition-launch").click();
  await page.waitForTimeout(180);
  const tunnelExpanded=await page.locator(".captain-fs-tunnel").evaluate(el=>
    el.classList.contains("is-expanded")||document.fullscreenElement===el);
  assert.ok(tunnelExpanded,"Tunnel must auto fullscreen on level launch");
  const pause=page.getByRole("button",{name:"Pause run"});
  await pause.click();
  await page.getByRole("button",{name:"RETURN TO LEVEL MENU"}).click();
  await page.locator(".ember-expedition-pick").waitFor({state:"visible",timeout:15000});
  console.log("PASS Tunnel automatic fullscreen and Return to Level Menu");
}finally{await page.close();await browser.close();}
