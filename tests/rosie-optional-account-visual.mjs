import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

await fs.mkdir("artifacts/rosie-account", {recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:engine===webkit,hasTouch:engine===webkit});
 const page=await context.newPage();
 await page.route("**/api/auth/session",route=>route.fulfill({status:200,contentType:"application/json",body:'{"user":null}'}));
 await page.goto("http://127.0.0.1:5173/#home",{waitUntil:"domcontentloaded"});
 const trigger=page.getByRole("button",{name:"Open RosieVerse account sign-in"});
 await trigger.waitFor();
 assert.equal(await page.getByRole("dialog").count(),0,"No unsolicited login dialog");
 await page.screenshot({path:"artifacts/rosie-account/"+engine.name()+"-home.png",fullPage:true});
 await trigger.click();
 await page.getByRole("dialog").waitFor();
 assert.equal(await page.getByRole("textbox",{name:"Username"}).count(),1);
 await page.screenshot({path:"artifacts/rosie-account/"+engine.name()+"-signin.png",fullPage:true});
 await page.getByRole("button",{name:"Create Account"}).first().click();
 await page.getByRole("button",{name:"6 digits"}).click();
 await page.getByRole("textbox",{name:"Username"}).fill("rosiefan");
 await page.screenshot({path:"artifacts/rosie-account/"+engine.name()+"-create.png",fullPage:true});
 await page.getByRole("button",{name:"Close account panel"}).click();
 assert.equal(await page.getByRole("dialog").count(),0);
 await page.goto("http://127.0.0.1:5173/#reminders",{waitUntil:"domcontentloaded"});
 await page.getByRole("button",{name:"Open RosieVerse account sign-in"}).waitFor();
 assert.equal(await page.getByRole("dialog").count(),0,"Reminders does not force login");
 await page.screenshot({path:"artifacts/rosie-account/"+engine.name()+"-reminders.png",fullPage:true});
 await context.close();await browser.close();
}
