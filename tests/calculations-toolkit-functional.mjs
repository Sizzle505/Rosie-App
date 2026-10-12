import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const pairedFieldIndices = { 0:[1,2], 1:[2,3], 3:[2,3], 5:[1,2] };
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
const satin = await fs.stat("public/rosieverse/calculations/burgundy-satin.png");
assert(satin.size >= 1800000, "Full-resolution original satin background must ship with Rosie App");
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
    // Simulate a dated provider response to test automatic conversion without
    // relying on public-network availability in CI.
    await page.route("https://api.frankfurter.dev/v2/**", async route=>{
      const url=new URL(route.request().url());
      if(url.pathname.endsWith("/currencies")) return route.fulfill({
        status:200,contentType:"application/json",
        body:JSON.stringify([
          {iso_code:"USD",name:"United States Dollar"},
          {iso_code:"EUR",name:"Euro"},
          {iso_code:"GBP",name:"British Pound"},
          {iso_code:"JPY",name:"Japanese Yen"}
        ])
      });
      const parts=url.pathname.split("/");
      const quote=parts.at(-1).toUpperCase(),base=parts.at(-2).toUpperCase();
      const rate=base==="USD"&&quote==="EUR" ? .92
        : base==="EUR"&&quote==="USD" ? 1.08 : .75;
      return route.fulfill({status:200,contentType:"application/json",
        body:JSON.stringify({base,quote,date:"2026-10-12",rate})});
    });
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
    const deviceHeights=[];
    for (let index=0;index<labels.length;index++) {
      if(index>0) await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
      await page.locator(".rc-tool-card").nth(index).click();
      const panel=page.locator(".rc-device");
      await panel.waitFor();
      await panel.locator(".rc-device-original-art").evaluate(async image => {
        if (!image.complete || image.naturalWidth===0) await image.decode();
      });
      const artwork=await panel.evaluate(el=>{
        const frame=el.querySelector(".rc-device-original-art");
        return {
          count:el.querySelectorAll(".rc-device-housing img").length,
          pieces:el.querySelectorAll(".rc-device-housing i:not(.rc-device-gleam), .rc-device-housing b").length,
          gleams:el.querySelectorAll(".rc-device-gleam").length,
          gleamDuration:getComputedStyle(el.querySelector(".rc-device-gleam")).animationDuration,
          frameLoaded:frame?.complete&&frame?.naturalWidth===1122,
          frameSource:frame?.getAttribute("src"),
          fullHeight:Math.abs(frame.getBoundingClientRect().height-el.getBoundingClientRect().height)<1,
          field:getComputedStyle(el.querySelector("input")).backgroundImage,
          fieldBorder:getComputedStyle(el.querySelector("input")).borderLeftWidth,
          result:getComputedStyle(el.querySelector(".rc-tool-result")).backgroundImage
        };
      });
      assert(artwork.count===1&&artwork.pieces===0&&artwork.frameLoaded&&artwork.fullHeight &&
        artwork.gleams===4 && artwork.gleamDuration==="0s",
        "Device must render as one continuous original gold image: "+JSON.stringify(artwork));
      assert([artwork.frameSource,artwork.result]
        .every(v=>v.includes("/rosieverse/calculations/toolkit/")),
        "Approved frame and result art missing from device: "+JSON.stringify(artwork));
      assert(artwork.field.includes("linear-gradient") && !artwork.field.includes("gold-input.webp") &&
        parseFloat(artwork.fieldBorder)>=2,
        "Form controls reverted to the old shallow decorative slit: "+JSON.stringify(artwork));
      assert.equal(await panel.locator("h2").innerText(),labels[index]);
      assert.equal(await panel.locator(".rc-device-title-trigger").count(),1,
        "Gold title must be a clickable tool selector: "+labels[index]);
      if(index===0) {
        await panel.locator(".rc-device-title-trigger").click();
        assert.equal(await panel.getByRole("menuitem").count(),6,
          "Active instrument heading must show exactly six alternative tools");
        await panel.locator(".rc-device-title-trigger").press("Escape");
        assert.equal(await panel.getByRole("menuitem").count(),0,
          "Escape should close the tool selector");
      }
      const geometry=await panel.evaluate(el => {
        const frame=el.getBoundingClientRect();
        const surface=el.querySelector(".rc-device-surface").getBoundingClientRect();
        const result=el.querySelector(".rc-tool-result").getBoundingClientRect();
        const housing=getComputedStyle(el);
        const inputs=[...el.querySelectorAll(".rc-field input,.rc-field select")].map(node => {
          const r=node.getBoundingClientRect();
          const labelElement=node.closest(".rc-field").querySelector("span");
          const label=labelElement.getBoundingClientRect();
          const style=getComputedStyle(node);
          return {x:r.x,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,nativeHeight:node.offsetHeight,
            compact:node.closest(".rc-field").classList.contains("rc-field--compact"),
            labelCenter:(label.left+label.right)/2,fieldCenter:(r.left+r.right)/2,
            labelAlign:getComputedStyle(labelElement).textAlign,
            paddingLeft:parseFloat(style.paddingLeft),
            border:parseFloat(style.borderLeftWidth),fontSize:parseFloat(style.fontSize)};
        });
        return {
          frame:{x:frame.x,right:frame.right,top:frame.top,bottom:frame.bottom,width:frame.width,height:frame.height},
          surface:{x:surface.x,right:surface.right,width:surface.width},
          result:{top:result.top,bottom:result.bottom,height:result.height},
          headingTop:el.querySelector(".rc-device-heading").getBoundingClientRect().top,
          // Conservative approximations of the painted red column endpoints
          // on the stretched, original 1122px gold frame.
          redTop:frame.top+frame.height*.11,
          redBottom:frame.bottom-frame.height*.10,
          bottomPadding:parseFloat(housing.paddingBottom),inputs,
          scrollWidth:document.documentElement.scrollWidth
        };
      });
      deviceHeights.push(geometry.frame.height);
      assert(geometry.frame.x>=-1 && geometry.frame.right<=width+1,
        "Device frame horizontally clipped: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.surface.x>=geometry.frame.x+geometry.frame.width*.245 &&
        geometry.surface.right<=geometry.frame.right-geometry.frame.width*.245,
        "Gold instrument content must stay inset inside its safe centre, clear of decorative rails: "+labels[index]+" "+JSON.stringify(geometry));
      const paired = pairedFieldIndices[index] || [];
      assert(geometry.inputs.every((field,fieldIndex) =>
        field.width >= (field.compact ? 75 : paired.includes(fieldIndex) ? 77 : 86) &&
        field.nativeHeight>=44 && field.height>=40 && field.height<=46 &&
        field.paddingLeft >= (paired.includes(fieldIndex) ? 7 : 9) &&
        field.border>=2 && field.fontSize >= (labels[index]==="Unit Conversions" ? 14 : 16) &&
        field.labelAlign==="center" && Math.abs(field.fieldCenter-field.labelCenter)<=3 &&
        field.x>=geometry.surface.x-1 && field.right<=geometry.surface.right+1),
        "Input fields need centered labels, appropriately sized bubbles and 44px minimum hit targets: "+labels[index]+" "+JSON.stringify(geometry));
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
      assert(geometry.headingTop>=geometry.frame.top+geometry.frame.height*.155,
        "Gold frame needs more breathing space above its title: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.frame.bottom-geometry.result.bottom>=geometry.frame.height*.19,
        "Gold frame needs substantial clear ornament space below its receipt: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.headingTop>=geometry.redTop+6-1,
        "Title must begin at least 6px below red columns' upper edge: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.result.bottom<=geometry.redBottom-5+1,
        "Result receipt must end 5px above red columns' lower edge: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.result.height >= ([1,4].includes(index) ? 79 : 99) && geometry.result.height <= ([1,4].includes(index) ? 120 : 220),
        "Result panel should be proportionate to its actual content: "+labels[index]+" "+JSON.stringify(geometry));
      const resultTextFits=await panel.locator(".rc-tool-result").evaluate(el=>{
        const boundary=el.getBoundingClientRect();
        const descendants=[...el.querySelectorAll("strong,span,p")];
        return descendants.every(node=>node.getBoundingClientRect().bottom <= boundary.bottom-8 &&
          node.getBoundingClientRect().top >= boundary.top+5);
      });
      assert(resultTextFits,"Gold device receipt text is clipped by its decorative rim: "+labels[index]);
      if (index === 2) {
        assert(geometry.inputs[0].width<=165 && geometry.inputs[1].width<=165,
          "Dates should occupy modest bubbles, not full-width ivory trays: "+JSON.stringify(geometry.inputs));
      }
      if (index === 4) {
        assert(geometry.inputs[0].width<=155 && geometry.inputs[1].width<=105 &&
          geometry.inputs[2].width<=203,
          "Percent bubbles and choice selector should be content-sized: "+JSON.stringify(geometry.inputs));
      }
      if (index === 0) {
        assert(geometry.frame.height < 760,
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
    assert(Math.max(...deviceHeights)-Math.min(...deviceHeights)<2,
      "All seven gold devices must be exactly the same height as Percentages: "+deviceHeights);
    // Change tools through the gold instrument title, not just the illustrated grid.
    await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
    await page.locator(".rc-tool-card").nth(4).click(); // percent
    await page.locator(".rc-device-title-trigger").click();
    await page.getByRole("menuitem",{name:"Tip Calculator"}).click();
    assert.equal(await page.locator(".rc-device-heading").innerText(),"Tip Calculator",
      "Changing tools using the title menu must render selected instrument");
    await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
    await page.locator(".rc-tool-card").first().click(); // open tip
    const tip=page.locator(".rc-device");
    await tip.getByLabel("Bill before tip ($)").fill("84.5");
    await tip.getByLabel("Tip (%)").fill("20");
    await tip.getByLabel("People").fill("3");
    assert((await tip.locator(".rc-tool-result").innerText()).includes("$33.80"),
      "Live tip-per-person calculation stopped updating");
    await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
    await page.locator(".rc-tool-card").nth(5).click();
    const loan=page.locator(".rc-device");
    assert((await loan.locator(".rc-tool-result").innerText()).includes("$304.22"),
      "Loan amortization changed unexpectedly");
    await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
    await page.locator(".rc-tool-card").nth(6).click();
    const currency=page.locator(".rc-device");
    const fromCurrency=currency.getByLabel("From currency");
    const toCurrency=currency.getByLabel("To currency");
    assert.equal(await fromCurrency.evaluate(el=>el.tagName),"SELECT");
    assert.equal(await toCurrency.evaluate(el=>el.tagName),"SELECT");
    assert.equal(await currency.getByLabel("Rate (units of target per 1 source)").count(),0,
      "Obsolete manual-rate field must be removed");
    await page.waitForFunction(()=>
      document.querySelector(".rc-device--currency .rc-tool-result")?.textContent.includes("92 EUR"));
    assert((await currency.locator(".rc-tool-result").innerText()).includes("2026-10-12"),
      "Exchange-rate date must be visible to users");
    await fromCurrency.selectOption("EUR");
    await toCurrency.selectOption("USD");
    await page.waitForFunction(()=>
      document.querySelector(".rc-device--currency .rc-tool-result")?.textContent.includes("108 USD"));
    assert((await currency.locator(".rc-tool-result").innerText()).includes("1 EUR = 1.08 USD"),
      "Dropdown pair changes must fetch new reference rates");
    await toCurrency.selectOption("EUR");
    assert((await currency.locator(".rc-tool-result").innerText()).includes("100 EUR"),
      "Same-currency conversion should be 1:1 without calling a provider");
    assert.equal(errors.length,0,errors.join("\n"));
    await page.close();
  }
} finally {
  await browser.close();
}
