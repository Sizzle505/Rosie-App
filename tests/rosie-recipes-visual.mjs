import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = "http://127.0.0.1:5173";
const assets = ["recipes-hero.webp","recipes-title.webp","recipes-card-frame.webp","recipes-parchment.webp","recipes-controls.webp","recipes-continuation.webp"];
await mkdir("artifacts/rosie-recipes/", {recursive:true});
for(const [name,browserType,viewport] of [
 ["iPhone-Safari",webkit,{width:393,height:852}],
 ["iPhone-small",webkit,{width:375,height:667}],
 ["Chrome-mobile",chromium,{width:393,height:852}],
]){
 const browser=await browserType.launch({headless:true});
 const page=await browser.newPage({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.goto(origin+"/#recipes",{waitUntil:"networkidle"});
 await page.locator(".recipes-grid .recipes-card").first().waitFor();
 await page.locator(".app-shell.app-shell-visible").waitFor();
 await page.locator(".loading-screen").waitFor({state:"hidden",timeout:10000});
 await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
 assert.equal(await page.locator(".recipes-grid .recipes-card").count(),25,`${name}: 25 cards`);
 for(const file of assets){
  const result=await page.request.get(origin+"/rosieverse/recipes/"+file);
  assert.equal(result.status(),200,`${name}: ${file} must exist`);
  assert.match(result.headers()["content-type"]||"",/image\/webp/,`${name}: ${file} mime`);
  const bytes=await result.body();assert.ok(bytes.length>10000,`${name}: ${file} should not be stub`);
 }
 assert.ok(await page.locator(".recipes-crest img").evaluate(img=>img.naturalWidth>1000),`${name}: visible original title`);
 assert.ok(await page.locator(".recipes-top-scene").evaluate(el=>getComputedStyle(el).backgroundImage.includes("recipes-hero.webp")));
 assert.ok(await page.locator(".recipes-card").first().evaluate(el=>getComputedStyle(el).backgroundImage.includes("recipes-card-frame.webp")));
 await page.screenshot({path:`artifacts/rosie-recipes/${name}-collection.png`,fullPage:false});
 await page.locator(".recipes-grid .recipes-card").first().scrollIntoViewIfNeeded();
 await page.waitForTimeout(200);
 await page.screenshot({path:`artifacts/rosie-recipes/${name}-cards.png`,fullPage:false});
 await page.getByPlaceholder("Find a recipe…").fill("Pawsta");
 assert.equal(await page.locator(".recipes-grid .recipes-card").count(),1,`${name}: search`);
 await page.getByPlaceholder("Find a recipe…").fill("");
 await page.getByRole("button",{name:"Desserts",exact:true}).click();
 assert.equal(await page.locator(".recipes-grid .recipes-card").count(),5,`${name}: desserts`);
 await page.getByRole("button",{name:"All",exact:true}).click();
 await page.locator(".recipes-card").first().click();
 await page.locator("#recipes-detail").waitFor();
 assert.equal(await page.locator(".recipes-grid").count(),0,`${name}: detail replaces grid`);
 assert.ok(await page.locator(".recipes-parchment-art img").evaluate(img=>img.complete && img.naturalWidth>900),`${name}: parchment loaded`);
 await page.screenshot({path:`artifacts/rosie-recipes/${name}-detail.png`,fullPage:false});
 await page.getByRole("button",{name:/The Collection/}).click();
 await page.locator(".recipes-grid").waitFor();
 const favorite=page.locator(".recipes-favorite").first();
 await favorite.click();
 assert.equal(await favorite.getAttribute("aria-pressed"),"true",`${name}: favorite toggled`);
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem("rosie-recipes-favorites-v1")||"[]").length>0),`${name}: favorite persisted`);
 const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
 assert.ok(sizes.scroll<=sizes.width+2,`${name}: horizontal overflow ${JSON.stringify(sizes)}`);
 assert.deepEqual(errors,[],`${name}: no runtime errors`);
 console.log(`PASS ${name}: 25 recipes, six images, filtering, favorites, parchment, no overflow`);
 await browser.close();
}
