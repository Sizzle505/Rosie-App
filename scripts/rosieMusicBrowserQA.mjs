import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium,webkit} from "playwright";

const target="http://127.0.0.1:4173";
const directory="artifacts/rosie-music-visual-qa";
await mkdir(directory,{recursive:true});

async function inspect(browserName,browser,device){
  const page=await browser.newPage({
    viewport:{width:device.width,height:device.height},
    deviceScaleFactor:device.mobile?2:1,
    isMobile:device.mobile,
    hasTouch:device.mobile,
    acceptDownloads:false
  });
  await page.addInitScript(()=>{
    window.__rosieMusicPlayCalls=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      if(this.src?.includes("/rosie-music/"))window.__rosieMusicPlayCalls.push(new URL(this.src).pathname);
      return original.apply(this,args);
    };
  });
  const failures=[];
  const requests=[];
  page.on("pageerror",error=>failures.push(error.message));
  page.on("response",response=>{
    if(response.url().includes("/rosie-music/"))
      requests.push({path:new URL(response.url()).pathname,status:response.status()});
  });
  page.setDefaultTimeout(25000);
  try {
    await page.goto(target+"/#home",{waitUntil:"domcontentloaded"});
    const dock=page.locator(".rosie-music-dock");
    await dock.waitFor({state:"visible"});
    await page.waitForTimeout(1200);
    assert.equal(await dock.getAttribute("data-unlocked"),"no","Audio unlocked before user gesture");
    assert.equal(requests.length,0,"Audio network request before user gesture");
    const button=page.getByRole("button",{name:"Open RosieVerse soundtrack settings"});
    await button.click();
    await page.locator("#rosie-music-panel").waitFor({state:"visible"});
    await page.waitForFunction(()=>document.querySelector(".rosie-music-dock")?.getAttribute("data-unlocked")==="yes");
    const expected=[["home","whimsical-journey"],["fortune","oracle-secret"],["haiku","haiku-garden"],["timekeeper","clockwork-nostalgia"],["qr-atelier","candlelit-library"],["cheese","cheese-heist"],["captain","yacht-voyage"]];
    for(const [route,id] of expected){
      await page.evaluate(page=>{location.hash="#"+page;},route);
      await page.waitForFunction(id=>document.querySelector(".rosie-music-dock")?.getAttribute("data-track")===id,id,{timeout:25000});
      await page.screenshot({path:directory+"/"+browserName+"-"+device.name+"-"+route+".png",fullPage:false});
      const played=await page.evaluate(()=>window.__rosieMusicPlayCalls||[]);
      assert.ok(played.includes("/rosie-music/"+id+".mp3"),"Missing audio playback request for "+route+":"+JSON.stringify(played));
    }
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{detail:{scene:"tunnel",state:"playing"}})));
    await page.waitForFunction(()=>document.querySelector(".rosie-music-dock")?.getAttribute("data-track")==="ember-tunnel");
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{detail:{scene:"cosmic",state:"playing",level:9}})));
    await page.waitForFunction(()=>document.querySelector(".rosie-music-dock")?.getAttribute("data-track")==="pulse-arena");
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent("rosieverse:music:achievement",{detail:{kind:"game-victory"}})));
    await page.waitForTimeout(180);
    const fanfare=await page.evaluate(()=>(window.__rosieMusicPlayCalls||[]).includes("/rosie-music/victory-fanfare.mp3"));
    assert.ok(fanfare,"Victory cue was not requested");
    const panel=page.locator("#rosie-music-panel");
    const vol=panel.getByRole("slider",{name:"Soundtrack volume"});
    await vol.fill("32");
    assert.equal(await page.evaluate(()=>localStorage.getItem("rosieverse.music.volume.v1")),"0.32");
    await page.getByRole("button",{name:"Mute soundtrack"}).click();
    assert.equal(await dock.getAttribute("data-enabled"),"no");
    assert.equal(await page.evaluate(()=>localStorage.getItem("rosieverse.music.enabled.v1")),"false");
    await page.getByRole("button",{name:"Enable soundtrack"}).click();
    assert.equal(await dock.getAttribute("data-enabled"),"yes");
    const bad=requests.filter(x=>x.status!==200&&x.status!==206&&x.status!==304);
    assert.equal(bad.length,0,"Bad music responses: "+JSON.stringify(bad));
    assert.ok(requests.length>=6,"Music did not load from web assets: "+JSON.stringify(requests));
    assert.equal(failures.length,0,"Uncaught page errors: "+failures.join("; "));
    console.log("PASS",browserName,device.name,"7 pages and 2 games","requests",requests.length,"fanfare",fanfare);
  }finally{await page.close();}
}

for(const [name,launcher,devices] of [
 ["chromium",chromium,[{name:"iphone",width:393,height:852,mobile:true},{name:"ipad",width:820,height:1180,mobile:true},{name:"desktop",width:1440,height:900,mobile:false}]],
 ["webkit",webkit,[{name:"iphone",width:393,height:852,mobile:true},{name:"ipad",width:820,height:1180,mobile:true}]]
]){
  const browser=await launcher.launch({headless:true,args:name==="chromium"?["--no-sandbox"]:[]});
  try{for(const device of devices)await inspect(name,browser,device);}
  finally{await browser.close();}
}
console.log("All RosieVerse soundtrack browser scenarios passed.");
