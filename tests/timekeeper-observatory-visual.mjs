import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const root="http://127.0.0.1:5173/#timekeeper";
const output="artifacts/timekeeper-approved";
await fs.mkdir(output,{recursive:true});
for(const [engine,browserType] of [["webkit",webkit],["chromium",chromium]]){
  const browser=await browserType.launch({headless:true});
  try{
    for(const [width,height] of [[390,844],[430,932]]){
      const context=await browser.newContext({
        viewport:{width,height},deviceScaleFactor:2,isMobile:true,
        hasTouch:true,reducedMotion:"reduce"
      });
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",e=>errors.push(String(e)));
      await page.goto(root,{waitUntil:"networkidle"});
      await page.locator(".rtk-observatory").waitFor();
      await page.locator(".loading-screen-hidden").waitFor();
      await page.screenshot({path:`${output}/${engine}-${width}-initial.png`});
      await page.getByRole("button",{name:"Choose clock face and color"}).click();
      assert.match(await page.locator(".rtk-frame-choices button.chosen").innerText(),/Sunburst/);
      assert.match(await page.locator(".rtk-bezel-choices button.chosen").innerText(),/Imperial Original/);
      assert.match(await page.locator(".rtk-hand-choices button.chosen").innerText(),/Gold/);
      assert.equal(await page.locator(".rtk-color-choices button.chosen").getAttribute("aria-label"),"Royal Garnet clock color");
      await page.getByRole("button",{name:"Close clock face chooser"}).click();
      await page.getByRole("button",{name:"World Clock"}).click();
      await page.locator(".rtk-world-hand").first().waitFor();
      const world=await page.evaluate(()=>{
        const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
        const node=document.querySelector(".rtk-world-hands");
        const rect=node.getBoundingClientRect();
        const hands=[...node.querySelectorAll(".rtk-world-hand")].map(el=>{
          const css=getComputedStyle(el);
          const x=parseFloat(css.getPropertyValue("--rtk-px"));
          const y=parseFloat(css.getPropertyValue("--rtk-py"));
          return {art:css.backgroundImage,alignmentX:el.offsetLeft+el.offsetWidth*x/100-node.clientWidth/2,
            alignmentY:el.offsetTop+el.offsetHeight*y/100-node.clientHeight/2,
            angle:css.rotate,clip:css.clipPath};
        });
        return {hands,city:box(".rtk-world-settings select"),date:box(".rtk-world-city-plaque"),
          daynight:box(".rtk-world-daynight"),stage:box(".rtk-art-stage"),
          nav:box(".resources-bottom-nav"),inset:rect};
      });
      for(const hand of world.hands){
        assert(hand.art.includes("world-clock-hands"),"Must use original illustrated hand sprites");
        assert(Math.abs(hand.alignmentX)<1.3&&Math.abs(hand.alignmentY)<1.3,"Hand centers not registered: "+JSON.stringify(hand));
      }
      assert(world.date.top>world.city.bottom+2,"City and date are overlapping");
      assert(world.daynight.top>world.date.bottom+2,"Date and Day/Night are overlapping");
      assert(world.daynight.bottom<world.nav.top-5,"Day/Night is behind bottom navigation");
      await page.screenshot({path:`${output}/${engine}-${width}-world.png`});
      assert((await page.locator("#rtk-world-city option:checked").textContent()).includes("EDT"),"Selected city must show timezone on the city line");
      assert.equal(await page.locator(".rtk-world-city-plaque span").count(),0,"Date plaque must have only one line");
      await page.getByRole("button",{name:"Stopwatch"}).click();
      await page.getByRole("button",{name:"Play"}).click();
      await page.waitForTimeout(300);
      assert.equal(await page.locator(".rtk-console-inlays image").count(),1,"Pause needs single inset art");
      assert.equal(await page.locator(".rtk-new-lap-art").count(),0,"No doubled Lap medallion");
      assert.equal(await page.locator(".rtk-pause-medallion").count(),0,"No doubled Pause medallion");
      await page.getByRole("button",{name:"Record lap"}).click();
      assert.equal(await page.locator(".rtk-laps li").count(),1);
      await page.screenshot({path:`${output}/${engine}-${width}-running.png`});
      await page.getByRole("button",{name:"Pause"}).click();
      await page.getByRole("button",{name:"Timer",exact:true}).click();
      assert.equal(await page.locator(".rtk-timer-tabs").count(),0,"No old Quick/Custom tabs");
      assert.equal(await page.locator(".rtk-quick-inline button").count(),4,"Quick presets on one row");
      assert.equal(await page.locator(".rtk-time-wheel").count(),3,"Native H/M/S selectors");
      await page.locator(".rtk-time-wheel[aria-label='Seconds']").selectOption("0");
      await page.getByRole("button",{name:"Decrease Seconds"}).click();
      assert.equal(await page.locator(".rtk-time-wheel[aria-label='Seconds']").inputValue(),"59",
        "Seconds reverse scroll must wrap 00 to 59");
      await page.getByRole("button",{name:"Increase Seconds"}).click();
      assert.equal(await page.locator(".rtk-time-wheel[aria-label='Seconds']").inputValue(),"0",
        "Seconds forward scroll must wrap 59 to 00");
      await page.locator(".rtk-time-wheel[aria-label='Minutes']").selectOption("7");
      assert((await page.locator(".rtk-time-whole").innerText()).includes("07:00"),
        "Stopped timer must update without Set Duration");
      await page.getByRole("button",{name:"Sets",exact:true}).click();
      assert.equal(await page.locator(".rtk-sets-editor").count(),1,"Sets remains accessible");
      assert.equal(errors.length,0,"Browser errors: "+errors.join(" | "));
      await context.close();
    }
  }finally{await browser.close();}
}
console.log("TIMEKEEPERS APPROVED MOBILE CHECKS PASSED");
