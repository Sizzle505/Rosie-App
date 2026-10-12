import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const pairedFieldIndices = { 0:[1,2], 1:[2,3], 3:[2,3], 5:[1,2], 6:[2,3] };
const labels = [
  "Tip Calculator",
  "Unit Conversions",
  "Date Calculator",
  "Split Bill",
  "Percentages & Discounts",
  "Loan & Interest",
  "Currency Converter"
];
// Verify adequate genuine asset detail without pinning to an obsolete
// file checksum: the replacement source is intentionally reprocessed
// to preserve dark interior metallic relief at full opacity.
const requiredGoldAssets = [
  ["gold-device.webp",1000000],
  ["housing-top.webp",250000],
  ["housing-center.webp",200000]
];
for (const [name,minBytes] of requiredGoldAssets) {
  const stat=await fs.stat("public/rosieverse/calculations/toolkit/"+name);
  assert(stat.size>=minBytes, "Approved gold source detail missing: "+name);
}
const dir = "artifacts/calculations-instruments";
await fs.mkdir(dir, { recursive:true });
const browser = await chromium.launch({headless:true});
try {
  for (const width of [375,390,430]) {
    const page = await browser.newPage({
      viewport:{width,height:844},
      deviceScaleFactor:2,
      isMobile:true,
      hasTouch:true,
      reducedMotion:"reduce"
    });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto("http://127.0.0.1:5173/#calculations",{waitUntil:"networkidle"});
    await page.locator(".loading-screen-hidden").waitFor();
    assert.equal(await page.locator(".rc-tool-card").count(),7);
    const art=await page.locator(".rc-tool-art").evaluateAll(nodes=>nodes.map(img=>({
      name:img.src.split("/").pop(),loaded:img.complete&&img.naturalWidth>0,
      width:img.getBoundingClientRect().width,
      height:img.getBoundingClientRect().height,
      nativeWidth:img.naturalWidth,nativeHeight:img.naturalHeight,
      fit:getComputedStyle(img).objectFit
    })));
    assert.equal(art.length,7);
    assert(art.every(img=>img.loaded&&img.width>0&&img.height>0&&img.fit==="contain"&&
      Math.abs(img.height-img.width*img.nativeHeight/img.nativeWidth)<2),
      "Approved selector artwork must be complete, unstretched and uncropped: "+JSON.stringify(art));
    if(width===390) {
      const filenames=[
        "gold-device.webp","gold-input.webp","gold-select.webp","gold-result.webp",
        "housing-top.webp","housing-bottom.webp","housing-center.webp",
        "housing-rail-left.webp","housing-rail-right.webp","housing-cheese.webp","housing-shiba.webp",
        ...["tip","units","date","split","percent","loan","currency"].map(id=>"button-"+id+".webp")
      ];
      const images=await page.evaluate(async files=>Promise.all(files.map(async name=>{
        const response=await fetch("/rosieverse/calculations/toolkit/"+name);
        return {name,status:response.status,type:response.headers.get("content-type")};
      })),filenames);
      assert(images.every(x=>x.status===200&&x.type?.startsWith("image/")),
        "An approved artwork file was not served: "+JSON.stringify(images));
      // The original golden image contains very dark engraved relief details.
      // A global black-to-alpha mask erased that metalwork in an earlier build.
      const originalFrameShadow=await page.evaluate(async()=>{
        const img=new Image();
        img.src="/rosieverse/calculations/toolkit/gold-device.webp";
        await img.decode();
        const canvas=document.createElement("canvas");
        canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        const ctx=canvas.getContext("2d",{willReadFrequently:true});
        ctx.drawImage(img,0,0);
        const sample=ctx.getImageData(569,300,1,1).data;
        return {alpha:sample[3],red:sample[0],width:img.naturalWidth};
      });
      assert(originalFrameShadow.width===1122&&originalFrameShadow.alpha>=245,
        "Original approved metallic shadows are becoming transparent: "+JSON.stringify(originalFrameShadow));
    }
    const currencyGeometry=await page.evaluate(()=>{
      const regular=document.querySelector(".rc-tool-card--tip").getBoundingClientRect();
      const wide=document.querySelector(".rc-tool-card--currency").getBoundingClientRect();
      return {regular:regular.width,wide:wide.width};
    });
    assert(currencyGeometry.wide>=currencyGeometry.regular*1.8,
      "Currency illustration must span both columns: "+JSON.stringify(currencyGeometry));
    for (let index=0;index<labels.length;index++) {
      await page.locator(".rc-tool-card").nth(index).click();
      const panel=page.locator(".rc-device");
      await panel.waitFor();
      const artwork=await panel.evaluate(el=>{
        const frame=el.querySelector(".rc-device-original-art");
        return {
          count:el.querySelectorAll(".rc-device-housing img").length,
          pieces:el.querySelectorAll(".rc-device-housing i, .rc-device-housing b").length,
          frameLoaded:frame?.complete&&frame?.naturalWidth===1122,
          frameSource:frame?.getAttribute("src"),
          fullHeight:Math.abs(frame.getBoundingClientRect().height-el.getBoundingClientRect().height)<1,
          field:getComputedStyle(el.querySelector("input")).backgroundImage,
          fieldBorder:getComputedStyle(el.querySelector("input")).borderLeftWidth,
          result:getComputedStyle(el.querySelector(".rc-tool-result")).backgroundImage
        };
      });
      assert(artwork.count===1&&artwork.pieces===0&&artwork.frameLoaded&&artwork.fullHeight,
        "Device must render as one continuous original gold image: "+JSON.stringify(artwork));
      assert([artwork.frameSource,artwork.result]
        .every(v=>v.includes("/rosieverse/calculations/toolkit/")),
        "Approved frame and result art missing from device: "+JSON.stringify(artwork));
      assert(artwork.field.includes("linear-gradient") && !artwork.field.includes("gold-input.webp") &&
        parseFloat(artwork.fieldBorder)>=2,
        "Form controls reverted to the old shallow decorative slit: "+JSON.stringify(artwork));
      assert.equal(await panel.locator("h2").innerText(),labels[index]);
      const geometry=await panel.evaluate(el => {
        const frame=el.getBoundingClientRect();
        const surface=el.querySelector(".rc-device-surface").getBoundingClientRect();
        const result=el.querySelector(".rc-tool-result").getBoundingClientRect();
        const housing=getComputedStyle(el);
        const inputs=[...el.querySelectorAll(".rc-field input,.rc-field select")].map(node => {
          const r=node.getBoundingClientRect();
          const label=node.closest(".rc-field").querySelector("span").getBoundingClientRect();
          const style=getComputedStyle(node);
          return {x:r.x,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,
            labelLeft:label.left,paddingLeft:parseFloat(style.paddingLeft),
            border:parseFloat(style.borderLeftWidth),fontSize:parseFloat(style.fontSize)};
        });
        return {
          frame:{x:frame.x,right:frame.right,top:frame.top,bottom:frame.bottom,width:frame.width,height:frame.height},
          surface:{x:surface.x,right:surface.right,width:surface.width},
          result:{top:result.top,bottom:result.bottom,height:result.height},
          bottomPadding:parseFloat(housing.paddingBottom),inputs,
          scrollWidth:document.documentElement.scrollWidth
        };
      });
      assert(geometry.frame.x>=-1 && geometry.frame.right<=width+1,
        "Device frame horizontally clipped: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.surface.x>=geometry.frame.x+20 && geometry.surface.right<=geometry.frame.right-20,
        "Tool surface invades ornamental rails: "+labels[index]);
      const paired = pairedFieldIndices[index] || [];
      assert(geometry.inputs.every((field,fieldIndex) =>
        field.width >= (paired.includes(fieldIndex) ? 85 : 120) &&
        field.height>=44 && field.height<=46 &&
        field.paddingLeft >= (paired.includes(fieldIndex) ? 9 : 10) &&
        field.border>=2 && field.fontSize >= (labels[index]==="Unit Conversions" ? 14 : 16) &&
        Math.abs(field.x-field.labelLeft)<=2 &&
        field.x>=geometry.surface.x-1 && field.right<=geometry.surface.right+1),
        "Input controls must have full-height light recesses, padded values and aligned labels: "+labels[index]+" "+JSON.stringify(geometry));
      if (paired.length) {
        const [left,right]=paired.map(fieldIndex=>geometry.inputs[fieldIndex]);
        assert(Math.abs(left.top-right.top)<=2 && left.right<right.x &&
          Math.abs(left.width-right.width)<=2,
          "Compact short-value fields should share an unclipped row: "+labels[index]+" "+JSON.stringify(geometry.inputs));
        for (const [fieldIndex,field] of geometry.inputs.entries()) {
          if (!paired.includes(fieldIndex)) assert(field.width>left.width*(index===1 ? 1.30 : 1.45),
            "Long-value fields should remain visibly wider than compact pairs: "+labels[index]);
        }
      }
      assert(geometry.scrollWidth<=width+2,
        "Page has horizontal overflow: "+labels[index]+" "+geometry.scrollWidth);
      assert(geometry.result.top>geometry.inputs.at(-1).bottom,
        "Results overlap the last input: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.result.bottom<=geometry.frame.bottom-35,
        "Result extends into or beyond the gold frame footer: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.result.height<=180,
        "Result panel retains excessive vertical height: "+labels[index]+" "+JSON.stringify(geometry));
      if (index === 0) {
        assert(geometry.frame.height < 620,
          "Tip calculator tray remains unnecessarily tall: "+JSON.stringify(geometry));
        assert(geometry.inputs[1].width < geometry.inputs[0].width*.65,
          "Short tip and people fields are not visually compact");
      }
      assert(await panel.locator(".rc-tool-result").count()===1);
      assert(await panel.locator("input,select").count()>=3);
      if(width===390) {
        // The approved full-height hero is sticky in normal use. Temporarily
        // unstick it for a diagnostic screenshot of the entire device housing.
        await page.evaluate(()=>document.querySelector(".rc-hero").style.setProperty("position","relative","important"));
        await panel.screenshot({path:dir+"/"+(index+1)+"-"+labels[index].replace(/[^a-z]+/gi,"-").toLowerCase()+".png"});
        await page.evaluate(()=>document.querySelector(".rc-hero").style.removeProperty("position"));
      }
    }
    await page.locator(".rc-tool-card").first().click(); // open tip
    const tip=page.locator(".rc-device");
    await tip.getByLabel("Bill before tip ($)").fill("84.5");
    await tip.getByLabel("Tip (%)").fill("20");
    await tip.getByLabel("People").fill("3");
    assert((await tip.locator(".rc-tool-result").innerText()).includes("$33.8"),
      "Live tip-per-person calculation stopped updating");
    await page.locator(".rc-tool-card").nth(5).click();
    const loan=page.locator(".rc-device");
    assert((await loan.locator(".rc-tool-result").innerText()).includes("$304.22"),
      "Loan amortization changed unexpectedly");
    await page.locator(".rc-tool-card").nth(6).click();
    const currency=page.locator(".rc-device");
    await currency.getByLabel("Rate (units of target per 1 source)").fill("0.92");
    assert((await currency.locator(".rc-tool-result").innerText()).includes("92 EUR"),
      "Currency conversion no longer responds to rate input");
    assert.equal(errors.length,0,errors.join("\n"));
    await page.close();
  }
} finally {
  await browser.close();
}
