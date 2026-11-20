import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const address = process.env.YACHT_TEST_URL || "http://127.0.0.1:4173/#captain";
const folder = "artifacts/yacht-dash-qa";
await mkdir(folder, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
  });
  const page = await phone.newPage();
  await page.goto(address, { waitUntil: "domcontentloaded" });
  await page.locator(".loading-screen-hidden").waitFor({state:"attached",timeout:15000});
  const frame = page.locator(".captain-fs-yacht");
  const picker = frame.locator(".yacht-chapter-picker button");
  await picker.first().waitFor({ timeout: 15000 });
  assert.equal(await picker.count(), 4, "All four levels should appear");
  for (let i = 0; i < 4; i++) {
    assert.equal(await picker.nth(i).isEnabled(), true, "Level "+i+" should be playable");
  }
  console.log("Preflight panel geometry", await page.evaluate(() => {
    const panel=document.querySelector(".captain-fs-yacht .captain-start-panel:not(.captain-results-panel)");
    const course=panel?.closest(".yacht-course");
    const parts=[".start-panel-rosie",".yacht-chapter-picker",".yacht-select-actions",".yacht-cast-off"];
    const measure=(el)=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {top:Math.round(r.top),height:Math.round(r.height),left:Math.round(r.left),
        width:Math.round(r.width),position:s.position,display:s.display,overflow:s.overflow,
        padding:s.padding,minHeight:s.minHeight,maxHeight:s.maxHeight,margin:s.margin,
        transform:s.transform,zIndex:s.zIndex};};
    return {course:measure(course),panel:measure(panel),
      shell:measure(course.closest(".yacht-game-shell")),
      shellChildren:[...course.closest(".yacht-game-shell").children].map(x=>({
        className:x.className,rect:measure(x)
      })),
      hud:measure(document.querySelector(".captain-fs-yacht .captain-hud")),
      body:document.body.scrollHeight,children:parts.map(sel=>[sel,measure(panel?.querySelector(sel))]),
      immediate:[...panel.children].slice(0,6).map(x=>({name:x.tagName,css:x.className?.baseVal||x.className,rect:measure(x)}))};
  }));
  const preflight = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    const course=rect(".captain-fs-yacht .yacht-course");
    const panel=rect(".captain-fs-yacht .captain-start-panel:not(.captain-results-panel)");
    const pick=rect(".captain-fs-yacht .yacht-chapter-picker");
    const cast=rect(".captain-fs-yacht .yacht-cast-off");
    return { courseHeight:course?.height, courseTop:course?.top,
      panelHeight:panel?.height, panelTop:panel?.top, panelBottom:panel?.bottom,
      pickerBottom:pick?.bottom, castOffBottom:cast?.bottom,
      courseBottom:course?.bottom };
  });
  console.log("Preflight geometry assertion",JSON.stringify(preflight));
  const noPanelScroll=await page.evaluate(() => {
    const p=document.querySelector(".captain-fs-yacht .captain-start-panel:not(.captain-results-panel)");
    return {scrollHeight:p.scrollHeight,clientHeight:p.clientHeight};
  });
  assert.ok(noPanelScroll.scrollHeight <= noPanelScroll.clientHeight + 2,
    "Level picker must fit without internal scrolling");
  console.log("Preflight child measurements",JSON.stringify(await page.evaluate(() => {
    const base=document.querySelector(".captain-fs-yacht .captain-start-panel:not(.captain-results-panel)");
    const map=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=getComputedStyle(el);return{
      top:r.top,bottom:r.bottom,height:r.height,position:c.position,
      transform:c.transform,margin:c.margin,padding:c.padding,
      overflow:c.overflow,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight};};
    return Object.fromEntries([".yacht-chapter-picker",".yacht-select-actions",".yacht-cast-off",".yacht-preview-victory"].map(sel=>[sel,map(base.querySelector(sel))]).concat([["panel",map(base)]]));
  })));
  assert.ok(preflight.courseHeight >= 280, "Mobile course must not collapse before Cast Off");
  assert.ok(preflight.panelHeight >= 160, "Level selection must have visible space");
  assert.ok(preflight.panelTop >= preflight.courseTop - 5 &&
    preflight.panelBottom <= preflight.courseBottom + 5,
    "Preflight content must fit inside the water course");
  assert.ok(preflight.castOffBottom <= preflight.panelBottom - 3,
    "Cast Off must be fully visible inside the preflight panel");
  await page.screenshot({path:folder+"/iphone-preflight-before-selection.png"});
  try {
    await picker.nth(1).click({timeout:10000});
  } catch (error) {
    console.error("iPhone stage tap failed", await picker.nth(1).evaluate(el => {
      const r = el.getBoundingClientRect();
      const panel = el.closest(".captain-start-panel");
      const p = panel.getBoundingClientRect();
      const top = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return { button: r.toJSON(), panel: p.toJSON(),
        panelScrollTop:panel.scrollTop, panelScrollHeight:panel.scrollHeight,
        blocker:top?.className || top?.tagName };
    }));
    await page.screenshot({path:folder+"/iphone-stage-tap-error.png"});
    throw error;
  }
  const chapterCopySpacing=await page.evaluate(()=>{
    const panel=document.querySelector(".captain-fs-yacht .captain-start-panel:not(.captain-results-panel)");
    const goal=panel.querySelector(".yacht-chapter-goal")?.getBoundingClientRect();
    const buttons=panel.querySelector(".yacht-chapter-picker")?.getBoundingClientRect();
    return {goalBottom:goal?.bottom,goalHeight:goal?.height,buttonsTop:buttons?.top};
  });
  console.log("Chapter goal spacing",JSON.stringify(chapterCopySpacing));
  assert.ok(chapterCopySpacing.goalBottom + 2 <= chapterCopySpacing.buttonsTop,
    "Level objectives must not overlap the four stage buttons");
  const toggle = frame.locator(".yacht-steering-options .captain-steering-toggle");
  console.log("Mode toggle visible before launch", await toggle.isVisible());
  console.log("Preflight layout details", JSON.stringify(await page.evaluate(() => {
    const panel=document.querySelector(".captain-fs-yacht .captain-start-panel");
    const course=panel.closest(".yacht-course");
    const shell=course.closest(".yacht-game-shell");
    const metric=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{
      name:el.className,top:r.top,left:r.left,width:r.width,height:r.height,
      display:s.display,flex:s.flex,position:s.position,overflow:s.overflow,
      maxHeight:s.maxHeight,heightStyle:s.height,alignSelf:s.alignSelf,
      gridRow:s.gridRow,gridColumn:s.gridColumn,padding:s.padding,margin:s.margin}};
    return {shell:metric(shell),children:[...shell.children].map(metric),
      panel:metric(panel),picker:metric(panel.querySelector(".yacht-chapter-picker"))};
  })));
  // Chapter selection changes the painting immediately, not after a gameplay
  // crossfade. Await the corresponding decoded artwork before capturing.
  await page.waitForFunction(() => {
    const image=document.querySelector(
      ".captain-fs-yacht .captain-level-painting .captain-backdrop-incoming");
    return image?.getAttribute("src")==="/yacht-dash/typhoon/01-approaching-squall.webp" &&
      image.complete && image.naturalWidth > 0;
  },null,{timeout:12000});
  const preflightStyle=await frame.locator(".captain-start-panel:not(.captain-results-panel)")
    .evaluate(element=>{
      const css=getComputedStyle(element);
      return {background:css.backgroundColor,opacity:css.opacity,
        backgroundImage:css.backgroundImage};
    });
  assert.equal(preflightStyle.opacity,"1","Preflight text must not be translucent");
  assert.notEqual(preflightStyle.background,"rgba(0, 0, 0, 0)",
    "Preflight needs its own opaque backing over the bright painting");
  console.log("Selected chapter art and panel",JSON.stringify(preflightStyle));
  await page.screenshot({ path:folder+"/iphone-stage-picker.png" });
  await frame.locator(".yacht-cast-off").click();
  await page.waitForFunction(() => {
    const f = document.querySelector(".captain-fs-yacht");
    return f?.classList.contains("is-expanded");
  }, null, { timeout: 6000 });
  await page.screenshot({ path:folder+"/iphone-fullscreen-launch.png" });
  console.log("Mode toggle visible after launch", await toggle.isVisible());
  console.log("Toggle layout", await toggle.evaluate(el => {
    const st=getComputedStyle(el),p=getComputedStyle(el.parentElement);
    return { display:st.display,visibility:st.visibility,opacity:st.opacity,
      width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
      parentDisplay:p.display };
  }));
  await toggle.waitFor({state:"visible",timeout:5000});
  const toggleSize=await toggle.boundingBox();
  assert.ok(toggleSize && toggleSize.width >= 75,
    "D-pad/joystick switch must be readable and tappable, not a 28px icon");
  const geometry = await page.evaluate(() => {
    const course = document.querySelector(".captain-fs-yacht .yacht-course")?.getBoundingClientRect();
    const controls = document.querySelector(".captain-fs-yacht .captain-command-deck")?.getBoundingClientRect();
    const f = document.querySelector(".captain-fs-yacht")?.getBoundingClientRect();
    return { courseTop:course?.top,courseHeight:course?.height,
      controlsTop:controls?.top,controlsBottom:controls?.bottom,
      frameHeight:f?.height, viewportHeight:innerHeight };
  });
  console.log("iPhone fullscreen geometry", JSON.stringify(geometry));
  assert.ok(geometry.frameHeight >= geometry.viewportHeight - 25, "Game must fill the iPhone viewport");
  assert.ok(geometry.courseHeight > 220, "Course must remain tall and playable");
  assert.ok(geometry.controlsTop > geometry.courseTop, "Steering belongs below course");
  assert.ok(geometry.controlsBottom <= geometry.viewportHeight + 20,
    "Steering buttons must remain reachable without scrolling");

  const object = frame.locator(".sea-pickup.yacht-upstream-object").first();
  await object.waitFor({ state:"visible", timeout:9500 });
  const position = () => object.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const course = el.closest(".yacht-course").getBoundingClientRect();
    return { topFraction:(rect.top-course.top)/course.height,
      scale:Number(el.style.getPropertyValue("--approach-scale")) };
  });
  const before = await position();
  await page.waitForTimeout(520);
  const after = await position();
  console.log("Upstream approach", JSON.stringify({ before, after }));
  assert.ok(before.topFraction > .22, "First obstacle/pickup should appear on the water, not from the sky");
  assert.ok(after.topFraction > before.topFraction, "Object should travel toward the yacht");
  assert.ok(after.scale > before.scale, "Object should grow as it approaches");

  // Switching steering layout must not place the toggle on top of the stick.
  await toggle.click();
  const stick = frame.locator(".captain-command-deck .axis-stick");
  await stick.waitFor({ state:"visible" });
  const [switchBox, stickBox] = await Promise.all([toggle.boundingBox(),stick.boundingBox()]);
  assert.ok(switchBox && stickBox, "Steering surfaces must have measurable bounds");
  assert.ok(switchBox.y + switchBox.height <= stickBox.y,
    "Steering toggle must not overlap the joystick");
  await page.screenshot({ path:folder+"/iphone-yacht-underway.png" });

  // The torii must read as a recognizable passage, not a solid overhead wall.
  const gate=frame.locator(".yacht-footprint-arch");
  await gate.waitFor({state:"visible",timeout:20000});
  await page.waitForFunction(() => {
    const el=document.querySelector(".captain-fs-yacht .yacht-footprint-arch");
    return el && parseFloat(el.style.getPropertyValue("--approach-scale")) >= .70;
  },null,{timeout:6500});
  const gateLabel=gate.locator(".yacht-gate-passage");
  await gateLabel.waitFor({state:"visible",timeout:1500});
  const safePassage=frame.locator(".yacht-safe-passage-cue");
  await safePassage.waitFor({state:"visible",timeout:2500});
  assert.match(await safePassage.innerText(),/CENTER LANE OPEN/);
  const safeBox=await safePassage.boundingBox();
  assert.ok(safeBox && safeBox.width>=140 && safeBox.height>=24,
    "The center-lane warning must remain legible on a phone");
  const [gateBounds,gateMessageBounds,courseBounds]=await Promise.all([
    gate.boundingBox(),gateLabel.boundingBox(),frame.locator(".yacht-course").boundingBox()
  ]);
  assert.ok(gateBounds && gateMessageBounds && courseBounds);
  assert.ok(gateBounds.width >= courseBounds.width*.72,
    "Torii pillars must visually span the two OUTER lanes near the collision zone");
  assert.ok(gateMessageBounds.y > gateBounds.y + gateBounds.height*.55,
    "Safe passage cue must be beneath the crossbeam, not on top of it");
  assert.ok(gateMessageBounds.x+gateMessageBounds.width/2 >
    courseBounds.x+courseBounds.width*.4 &&
    gateMessageBounds.x+gateMessageBounds.width/2 <
    courseBounds.x+courseBounds.width*.6,
    "The safe-channel label must be centered within the gate");
  assert.match(await gateLabel.innerText(),/PASS UNDER/);
  await page.screenshot({path:folder+"/iphone-gate-safe-passage.png"});

  await frame.locator(":scope > .captain-fullscreen-toggle").click();
  await frame.locator(".captain-game-page.is-paused").waitFor({ timeout:3500 });
  console.log("iPhone fullscreen exit pauses the voyage");
  await page.screenshot({ path:folder+"/iphone-yacht-paused.png" });
  await phone.close();

  const desktop = await browser.newContext({ viewport:{width:1440,height:900},deviceScaleFactor:1 });
  const deskPage = await desktop.newPage();
  await deskPage.goto(address, {waitUntil:"domcontentloaded"});
  const deskFrame=deskPage.locator(".captain-fs-yacht");
  const deskPicker=deskFrame.locator(".yacht-chapter-picker button");
  await deskPicker.nth(3).click();
  await deskFrame.locator(".yacht-cast-off").click();
  assert.ok(await deskFrame.locator(".yacht-course.is-underway").isVisible(),
    "Emperor chapter must run on desktop");
  assert.equal(await deskFrame.locator(".yacht-course").getAttribute("data-captain-chapter"),"emperor");
  // Cast Off removes its own button. Give the game focus automatically so a
  // player can steer immediately without an extra click into the course.
  await deskPage.waitForFunction(() =>
    document.activeElement?.classList?.contains("yacht-course"),null,{timeout:1500});
  await deskPage.keyboard.press("ArrowLeft");
  await deskFrame.locator(".captain-yacht.lane-0").waitFor({timeout:1500});
  // Held arrows should never skip both lanes from repeated OS key events.
  await deskPage.keyboard.down("ArrowRight");
  await deskPage.waitForTimeout(620);
  assert.equal(await deskFrame.locator(".captain-yacht.lane-1").count(),1,
    "Holding an arrow must only steer one lane until a fresh press");
  await deskPage.keyboard.up("ArrowRight");
  // Yacht keyboard controls must not interfere with Tunnel or Cosmic Odyssey
  // when focus leaves the Yacht cabinet on the multi-game Captain page.
  await deskFrame.locator(".yacht-steering-options .captain-steering-toggle").focus();
  await deskPage.keyboard.press("ArrowLeft");
  await deskFrame.locator(".captain-yacht.lane-0").waitFor({timeout:1500});
  await deskPage.evaluate(() => document.activeElement?.blur?.());
  await deskPage.keyboard.press("ArrowRight");
  assert.equal(await deskFrame.locator(".captain-yacht.lane-0").count(),1,
    "Keyboard must not steer Yacht when focus is outside its frame");
  await deskPage.screenshot({path:folder+"/desktop-emperor-underway.png",fullPage:false});
  await desktop.close();
  console.log("PASS Yacht Dash iPhone and desktop smoke checks");
} finally {
  await browser.close();
}
