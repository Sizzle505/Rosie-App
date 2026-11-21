import {chromium} from "playwright";
import assert from "node:assert/strict";
const origin=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
const viewports=[320,390,430];
try {
  for(const width of viewports) {
    const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
    try {
      await page.goto(origin+"/#haiku",{waitUntil:"domcontentloaded"});
      await page.locator(".haiku-scene-rosie").waitFor({state:"visible"});
      const aligned=await page.evaluate(()=>{
        const box=q=>document.querySelector(q).getBoundingClientRect();
        const stage=box(".haiku-scene-image"),rosie=box(".haiku-scene-rosie");
        const arr=[...document.querySelectorAll(".haiku-portrait-outfit-arrows button")].map(e=>{
          const r=e.getBoundingClientRect();return r.x+r.width/2;
        });
        const center=stage.x+stage.width/2;
        return {offset:rosie.x+rosie.width/2-center,arrowOffset:(arr[0]+arr[1])/2-center,
          transform:getComputedStyle(document.querySelector(".haiku-scene-rosie")).transform,
          overflow:document.documentElement.scrollWidth-innerWidth};
      });
      assert.ok(Math.abs(aligned.offset)<2,"Rosie centered on "+width);
      assert.ok(Math.abs(aligned.arrowOffset)<2,"Outfit arrows symmetric on "+width);
      assert.ok(aligned.overflow<=2,"No iPhone overflow");

      const scenic=await page.locator(".haiku-scene-selector button").evaluateAll(buttons=>buttons.map(btn=>{
        const art=btn.querySelector("img").getBoundingClientRect();
        return {name:btn.getAttribute("aria-label"),text:btn.innerText,
          imageWidth:art.width,border:getComputedStyle(btn).borderTopWidth};
      }));
      assert.deepEqual(scenic.map(x=>x.name),["Temple","Zen Garden","Flower Field"],
        "Scene order reversed");
      for(const option of scenic) {
        assert.equal(option.text.trim(),"","No scene captions");
        assert.equal(option.border,"0px","No scene button frames");
        assert.ok(option.imageWidth>=105,"Existing scenic illustrations 20% larger");
      }

      const labels=await page.locator(".haiku-tabs button").evaluateAll(buttons=>buttons.map(btn=>{
        const text=btn.querySelector(".haiku-tab-label"),image=btn.querySelector("img");
        return {label:text.innerText,size:getComputedStyle(text).fontSize,
          imageWidth:image.getBoundingClientRect().width};
      }));
      assert.deepEqual(labels.map(x=>x.label),["Daily","Compose","Meditate","Journal"]);
      for(const label of labels){
        assert.equal(label.size,"11px","Increase symbols, not labels");
        assert.ok(label.imageWidth>=(width===320?70:width===390?85:94),
          "Larger activity symbols");
      }
      await page.getByRole("button",{name:"Meditate",exact:true}).click();
      const panel=await page.evaluate(()=>{
        const h=document.querySelector(".zen-panel>h2");
        const grid=document.querySelector(".zen-program-grid");
        const cards=[...grid.querySelectorAll(".zen-program")].map(el=>{
          const r=el.getBoundingClientRect();
          const image=el.querySelector("img").getBoundingClientRect();
          const text=el.querySelector(".zen-program-caption").getBoundingClientRect();
          return{x:r.x,y:r.y,width:r.width,
            imageWidth:image.width,artAboveText:image.bottom<=text.top+2,
            clipped:el.scrollWidth>el.clientWidth+1};
        });
        return {headerAlign:getComputedStyle(h).textAlign,cards};
      });
      assert.equal(panel.headerAlign,"center");
      assert.equal(panel.cards.length,5);
      assert.ok(Math.abs(panel.cards[0].y-panel.cards[1].y)<=1,"First row has two buttons");
      assert.ok(Math.abs(panel.cards[2].y-panel.cards[3].y)<=1,"Second row has two buttons");
      assert.ok(panel.cards[0].x<panel.cards[1].x,"Two real columns");
      assert.ok(panel.cards[2].y>panel.cards[0].y,"Second row below first");
      assert.ok(panel.cards[4].y>panel.cards[2].y,"Fifth card in last centered row");
      for(const c of panel.cards){
        assert.ok(c.artAboveText,"Card titles below illustration");
        assert.ok(c.imageWidth>=95,"Large meditation illustration");
        assert.ok(!c.clipped,"Card content fits naturally");
      }
      await page.getByRole("button",{name:/Begin.*meditation/}).click();
      const before=await page.locator(".zen-immersive").getAttribute("data-zen-view");
      await page.getByRole("button",{name:"Next meditation background"}).click();
      const after=await page.locator(".zen-immersive").getAttribute("data-zen-view");
      assert.notEqual(after,before,"New turquoise backdrop arrows cycle scenery");
      await page.locator(".zen-immersive-scenery img").evaluate(img=>img.decode());
      const scene=await page.locator(".zen-immersive").evaluate(el=>{
        const img=el.querySelector(".zen-immersive-scenery img");
        return{backdrop:getComputedStyle(el).backgroundImage,
          source:img.getAttribute("src"),loaded:img.naturalWidth>0,
          arrows:el.querySelectorAll(".zen-backdrop-cycle-arrow").length};
      });
      assert.equal(scene.arrows,2);
      assert.ok(scene.loaded&&scene.backdrop.includes(scene.source.split("/").at(-1)));
      await page.getByRole("button",{name:"Close meditation"}).click();

      for(const style of ["sakura","imperial","grand"]){
        const scroll=await page.locator(".haiku-scroll").evaluate(el=>{
          const inner=el.querySelector(".haiku-scroll-inner").getBoundingClientRect();
          const ps=[...el.querySelectorAll(".haiku-verse p,.haiku-scroll-signature")];
          return{style:el.dataset.scrollStyle,shadow:getComputedStyle(el).boxShadow,
            clipped:ps.some(p=>{const r=p.getBoundingClientRect();return r.height>0&&
              (r.top<inner.top-1||r.bottom>inner.bottom+1);})};
        });
        assert.equal(scroll.style,style);
        assert.equal(scroll.shadow,"none","No rectangular shadow behind transparent artwork");
        assert.ok(!scroll.clipped,style+" poem fits inside its paper");
        await page.getByRole("button",{name:"Next poetry scroll"}).click();
      }
      console.log("PASS Zen "+width+": outfits aligned, art sizes, 2-column meditation, arrows, transparent scrolls");
    } finally { await page.close(); }
  }
  for(const outfit of ["classic","pink","saffron","plum","indigo"]){
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{
      await page.addInitScript(value=>localStorage.setItem("rosieZenRosieOutfitV1",value),outfit);
      await page.goto(origin+"/#haiku",{waitUntil:"domcontentloaded"});
      await page.locator(".haiku-scene-rosie").waitFor({state:"visible"});
      const center=await page.evaluate(()=>{
        const img=document.querySelector(".haiku-scene-rosie");
        const anim=img.getAnimations()[0];
        if(anim){anim.pause();anim.currentTime=4200;}
        const a=img.getBoundingClientRect(),b=document.querySelector(".haiku-scene-image").getBoundingClientRect();
        return a.x+a.width/2-b.x-b.width/2;
      });
      assert.ok(Math.abs(center)<2,outfit+" Rosie stays centered mid-breath");
    }finally{await page.close();}
  }
  for(const route of ["home","haiku","reviews","resources","captain"]){
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{
      await page.goto(origin+"/#"+route,{waitUntil:"domcontentloaded"});
      const note=page.locator(".rosie-music-launch");
      await note.waitFor({state:"visible"});
      assert.equal((await note.innerText()).trim(),"","Global music launcher icon-only");
      assert.equal(await note.locator("img[src*=\"rosie-music-medallion\"]").count(),1,"Shared music icon is the new purple/gold medallion");
      if(route==="home"){
        const width=await page.locator("button[class*='haikuLantern']").evaluate(el=>el.getBoundingClientRect().width);
        assert.ok(width>=79&&width<=91,"Landing Zen lantern enlarged 30%");
      }
    } finally{await page.close();}
  }
  console.log("PASS all iPhone Zen and global music refinements");
} finally{await browser.close();}
