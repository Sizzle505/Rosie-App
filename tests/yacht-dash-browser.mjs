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
      body:document.body.scrollHeight,children:parts.map(sel=>[sel,measure(panel?.querySelector(sel))]),
      immediate:[...panel.children].slice(0,6).map(x=>({name:x.tagName,css:x.className?.baseVal||x.className,rect:measure(x)}))};
  }));
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
  const toggle = frame.locator(".yacht-steering-options .captain-steering-toggle");
  console.log("Mode toggle visible before launch", await toggle.isVisible());
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
