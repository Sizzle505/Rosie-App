import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({
 viewport:{width:393,height:852},deviceScaleFactor:1,
 isMobile:true,hasTouch:true,acceptDownloads:true
});
let failures=[];
page.setDefaultTimeout(8000);
page.on("pageerror",error=>failures.push("Browser error: "+error.message));
async function checkType(label,fill){
  try{
    await page.getByRole("button",{name:label,exact:true}).first().click();
    await fill();
    await page.waitForFunction(()=>Boolean(document.querySelector(".qa-code-shell svg")),null,{timeout:4500});
    const html=await page.locator(".qa-code-shell svg").first().innerHTML();
    assert.ok(html.includes("path")||html.includes("rect"),label+" empty QR");
    console.log("PASS",label);
  }catch(e){failures.push(label+" "+e.message);console.error("FAIL",label,e.message.slice(0,260));}
}
try {
  await page.goto("http://127.0.0.1:4173/#qr-atelier",{waitUntil:"networkidle",timeout:35000});
  await page.waitForTimeout(2200);
  assert.equal(await page.locator(".qa-type").count(),8);
  assert.equal(await page.locator(".qa-scanner-note").count(),0,"Scanner should remain excluded");
  await checkType("Website",async()=>{
    await page.locator(".qa-inputs input").first().fill("https://rosie.example.com");
  });
  await page.screenshot({path:"qa-screenshots/qr-atelier-with-code.png",fullPage:true});
  const frame=await page.locator(".qa-ring").boundingBox();
  const code=await page.locator(".qa-code-shell").boundingBox();
  assert.ok(frame&&code&&code.width<frame.width*.4,"QR does not fit inside frame");
  await page.getByRole("button",{name:/Full-screen QR/}).click();
  assert.equal(await page.getByRole("dialog",{name:/Full-screen/}).count(),1);
  await page.screenshot({path:"qa-screenshots/qr-atelier-zoom.png"});
  await page.getByRole("button",{name:/Close ×/}).click();
  await checkType("Wi-Fi",async()=>{
    await page.getByPlaceholder("Guest Wi-Fi").fill("Rosie Guests");
    await page.getByPlaceholder("Network password").fill("test-Pa$$:123");
  });
  assert.ok(await page.getByText(/Tick the password-storage permission/).count()===0);
  await page.getByRole("button",{name:"Save to Collection"}).click();
  await page.waitForTimeout(50);
  assert.ok(await page.getByText(/Tick the password-storage permission/).count()===1);
  await checkType("Contact",async()=>{
    await page.getByPlaceholder("Name",{exact:true}).fill("Rosie Artisan");
    await page.getByPlaceholder("+1 555 123 4567").fill("+15551234567");
  });
  await checkType("Zoom",async()=>{
    await page.locator(".qa-inputs textarea").fill("Join: https://us02web.zoom.us/j/123456789?pwd=abc");
  });
  await checkType("Event",async()=>{
    await page.getByPlaceholder("Rosie's Grand Opening").fill("Rosie's Exhibition");
    await page.locator('input[type="datetime-local"]').first().fill("2026-12-12T19:00");
    await page.locator('input[type="datetime-local"]').last().fill("2026-12-12T20:00");
  });
  await checkType("Payment",async()=>{
    await page.getByPlaceholder("https://your-provider.com/…").fill("https://paypal.me/rosie");
  });
  await checkType("Instagram",async()=>{
    await page.getByPlaceholder("@yourhandle").fill("@rosieexample");
  });
  await checkType("Calling Card",async()=>{
    await page.getByPlaceholder("Name",{exact:true}).fill("Rosie Artisan");
    await page.getByPlaceholder("+1 555 123 4567").fill("+15551234567");
  });
  await page.locator(".qa-save-block input").fill("Rosie's Calling Card");
  await page.getByRole("button",{name:"Save to Collection"}).click();
  await page.waitForTimeout(100);
  assert.ok((await page.locator(".qa-saved").count())>=1);
  const downloadWait=page.waitForEvent("download",{timeout:12000});
  await page.getByRole("button",{name:"PNG",exact:true}).click();
  const dl=await downloadWait;
  assert.ok(dl.suggestedFilename().endsWith(".png"));
  console.log("PASS PNG download:",dl.suggestedFilename());
  const cardWait=page.waitForEvent("download",{timeout:12000});
  await page.getByRole("button",{name:"Download Calling Card",exact:true}).click();
  const card=await cardWait;
  assert.ok(card.suggestedFilename().endsWith("-printable.png"));
  console.log("PASS designed Calling Card image:",card.suggestedFilename());
  const vcfWait=page.waitForEvent("download",{timeout:12000});
  await page.getByRole("button",{name:"Download Contact (.vcf)"}).click();
  const vcf=await vcfWait;
  assert.ok(vcf.suggestedFilename().endsWith(".vcf"));
  console.log("PASS contact file export:",vcf.suggestedFilename());

  await page.screenshot({path:"qa-screenshots/qr-atelier-calling-card.png",fullPage:true});
} catch(e){failures.push("SMOKE "+e.stack);console.error("FAIL",e);}
finally {await browser.close();}
if(failures.length){console.error("FAILED CHECKS:\n"+failures.join("\n"));process.exit(1);}
console.log("All eight generators and mobile UI smoke checks passed.");
