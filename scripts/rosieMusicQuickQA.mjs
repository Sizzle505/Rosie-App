import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium,webkit} from "playwright";
const base="http://127.0.0.1:4173";
const out="artifacts/rosie-music-quick-qa";
await fs.mkdir(out,{recursive:true});

async function verify(name,browser,viewport){
  const page=await browser.newPage({
    viewport:{width:viewport.width,height:viewport.height},
    isMobile:viewport.mobile,hasTouch:viewport.mobile,
    deviceScaleFactor:viewport.mobile?2:1
  });
  page.setDefaultTimeout(13000);
  const musicResponses=[],errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("response",r=>{if(r.url().includes("/rosie-music/"))musicResponses.push({url:r.url(),status:r.status()});});
  try{
    console.log("START",name,viewport.label);
    await page.goto(base+"/#home",{waitUntil:"domcontentloaded",timeout:20000});
    const dock=page.locator(".rosie-music-dock");
    await dock.waitFor();
    await page.waitForTimeout(1100);
    assert.equal(await dock.getAttribute("data-unlocked"),"no");
    assert.equal(musicResponses.length,0,"Music requested before the first gesture");
    console.log("GESTURE",name,viewport.label);
    const homeFetch=page.waitForResponse(r=>r.url().endsWith("/rosie-music/whimsical-journey.mp3")&&[200,206].includes(r.status()),{timeout:13000});
    await page.getByRole("button",{name:"Open RosieVerse soundtrack settings"}).click();
    await dock.locator("#rosie-music-panel").waitFor();
    await homeFetch;
    assert.equal(await dock.getAttribute("data-unlocked"),"yes");
    console.log("HOME PLAYED",name,viewport.label);
    const routes=[["fortune","oracle-secret"],["haiku","haiku-garden"],["timekeeper","clockwork-nostalgia"]];
    for(const [route,track] of routes){
      console.log("ROUTE",name,viewport.label,route,track);
      const p=page.waitForResponse(r=>r.url().endsWith("/rosie-music/"+track+".mp3")&&[200,206].includes(r.status()),{timeout:13000});
      await page.evaluate(route=>{location.hash="#"+route},route);
      await page.locator('.rosie-music-dock[data-track="'+track+'"]').waitFor();
      await p;
    }
    const slider=dock.locator("#rosie-music-volume");
    await slider.focus();
    await slider.press("ArrowRight");
    assert.equal(await page.evaluate(()=>localStorage.getItem("rosieverse.music.volume.v1")),"0.27");
    await page.getByRole("button",{name:"Mute soundtrack"}).click();
    assert.equal(await dock.getAttribute("data-enabled"),"no");
    await page.getByRole("button",{name:"Enable soundtrack"}).click();
    assert.equal(await dock.getAttribute("data-enabled"),"yes");
    await page.screenshot({path:out+"/"+name+"-"+viewport.label+".png",timeout:15000});
    const failed=musicResponses.filter(r=>![200,206,304].includes(r.status));
    assert.deepEqual(failed,[],"Invalid music file response");
    assert.deepEqual(errors,[],"Browser JavaScript exceptions");
    console.log("PASS",name,viewport.label,musicResponses.length,"audio responses");
  }finally{await page.close({runBeforeUnload:false});}
}
const testCases=[
 {name:"chromium",engine:chromium,views:[{label:"iphone",width:393,height:852,mobile:true},{label:"ipad",width:820,height:1180,mobile:true},{label:"desktop",width:1440,height:900,mobile:false}]},
 {name:"webkit",engine:webkit,views:[{label:"iphone",width:393,height:852,mobile:true}]}
];
for(const group of testCases){
  const browser=await group.engine.launch({headless:true,args:group.name==="chromium"?["--no-sandbox"]:[]});
  try{for(const view of group.views)await verify(group.name,browser,view);}
  finally{await browser.close();}
}
console.log("PASS: Streamed, user-gesture-gated music on iPhone, iPad and desktop Chromium plus iPhone WebKit.");
