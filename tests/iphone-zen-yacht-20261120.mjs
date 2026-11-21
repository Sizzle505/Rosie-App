import { chromium } from "playwright";
import assert from "node:assert/strict";

const url=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
const screenSizes=[[320,700],[390,844],[430,932]];
const scrolls=[
  {id:"sakura",file:"scroll-mobile.webp"},
  {id:"imperial",file:"haiku-scroll-isolated.png"},
  {id:"grand",file:"scroll-grand.webp"}
];
const landscapes=["Sakura Garden","Sunlit Zen Garden","Moonlit Veranda"];
const browser=await chromium.launch({headless:true});
try {
  for(const [width,height] of screenSizes) {
    const page=await browser.newPage({
      viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1
    });
    try {
      await page.goto(url+"/#haiku",{waitUntil:"domcontentloaded",timeout:60000});
      await page.locator(".haiku-scene-rosie").waitFor({state:"visible",timeout:20000});
      const portrait=await page.evaluate(()=>{
        const r=s=>document.querySelector(s).getBoundingClientRect();
        const image=r(".haiku-scene-image"),rosie=r(".haiku-scene-rosie");
        const arrows=[...document.querySelectorAll(".haiku-portrait-outfit-arrows button")].map(el=>{
          const b=el.getBoundingClientRect();return b.x+b.width/2;
        });
        return {center:image.x+image.width/2,rosieCenter:rosie.x+rosie.width/2,
          arrowCenter:(arrows[0]+arrows[1])/2,offsets:arrows,
          overflow:document.documentElement.scrollWidth-innerWidth};
      });
      assert.ok(Math.abs(portrait.center-portrait.rosieCenter)<2,"Rosie centered");
      assert.ok(Math.abs(portrait.center-portrait.arrowCenter)<2,"Outfit arrows symmetrical");
      assert.ok(portrait.overflow<=2,"No horizontal overflow");

      const choices=await page.locator(".haiku-scene-selector button").evaluateAll(buttons=>buttons.map(el=>{
        const art=el.querySelector("img"),styles=getComputedStyle(el),r=art.getBoundingClientRect();
        return{label:el.getAttribute("aria-label"),text:el.innerText.trim(),
          width:r.width,height:r.height,loaded:art.naturalWidth>0,
          border:styles.borderTopWidth,background:styles.backgroundImage};
      }));
      assert.equal(choices.length,3);
      for(const choice of choices){
        assert.ok(choice.label&&choice.loaded,"Scenery image and accessible name");
        assert.equal(choice.text,"","Image-only scenery choices");
        assert.equal(choice.border,"0px","No scenery frames");
        assert.ok(choice.width>=103&&choice.width<=168,"Scenic illustrations enlarged approximately 20%");
      }
      const originalOutfit=await page.locator(".haiku-scene-rosie").getAttribute("src");
      await page.getByRole("button",{name:"Next Rosie outfit"}).first().click();
      assert.notEqual(await page.locator(".haiku-scene-rosie").getAttribute("src"),originalOutfit);

      for(const design of scrolls) {
        const state=await page.locator(".haiku-scroll").evaluate(el=>{
          const inner=el.querySelector(".haiku-scroll-inner").getBoundingClientRect();
          const nodes=[...el.querySelector(".haiku-verse").children,
            el.querySelector(".haiku-metre"),el.querySelector(".haiku-scroll-signature")];
          const clipped=nodes.some(node=>{
            const r=node.getBoundingClientRect();
            return r.top<inner.top-1||r.bottom>inner.bottom+1;
          });
          return {style:el.dataset.scrollStyle,
            background:getComputedStyle(el).backgroundImage,
            font:getComputedStyle(nodes[0]).fontFamily,clipped};
        });
        assert.equal(state.style,design.id);
        assert.ok(state.background.includes(design.file),design.id+" uses existing scroll art");
        assert.ok(state.font.includes("Snell Roundhand"),"Hand-lettered typography");
        assert.ok(!state.clipped,design.id+" verse and signature fit on paper");
        await page.getByRole("button",{name:"Next poetry scroll"}).click();
      }
      assert.equal(await page.locator(".haiku-scroll").getAttribute("data-scroll-style"),"sakura");

      await page.getByRole("button",{name:"Meditate",exact:true}).click();
      await page.locator(".zen-art-options summary").click();
      for(const background of landscapes) {
        await page.getByRole("button",{name:background,exact:true}).click();
        await page.getByRole("button",{name:/Begin.*meditation/}).click();
        const state=await page.locator(".zen-immersive").evaluate(el=>{
          const image=el.querySelector(".zen-immersive-scenery img");
          const scenery=el.querySelector(".zen-immersive-scenery");
          const dialog=el.querySelector(".zen-immersive-dialog");
          return{view:el.dataset.zenView,
            imageSrc:image.currentSrc,loaded:image.naturalWidth>0,
            fullScreenImage:getComputedStyle(el).backgroundImage,
            scenicZ:getComputedStyle(scenery).zIndex,dialogZ:getComputedStyle(dialog).zIndex,
            height:el.getBoundingClientRect().height,viewport:innerHeight};
        });
        assert.ok(state.loaded&&state.fullScreenImage.includes(state.imageSrc.split("/").at(-1)),
          "Chosen meditation panorama must be loaded as full-screen background");
        assert.equal(state.scenicZ,"0");
        assert.ok(Number(state.dialogZ)>=1);
        assert.equal(state.height,state.viewport);
        await page.getByRole("button",{name:"Close meditation"}).click();
      }
      console.log("PASS Zen iPhone "+width+"x"+height+": centered Rosie, symmetric arrows, big unframed scenery, three real scroll styles and three distinct visible meditation backdrops");
    }finally{await page.close();}
  }

  const page=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1
  });
  try{
    await page.goto(url+"/#captain",{waitUntil:"domcontentloaded"});
    await page.locator(".yacht-cast-off").first().click();
    await page.waitForTimeout(240);
    const before=await page.evaluate(()=>{
      const root=document.querySelector(".captain-fs-yacht");
      const bar=root.querySelector(".captain-route-strip");
      const line=bar.querySelector(".route-line");
      const meter=line.querySelector(".route-progress");
      const game=root.querySelector(".yacht-game-shell");
      return{expanded:root.classList.contains("is-expanded"),display:getComputedStyle(bar).display,
        barHeight:bar.getBoundingClientRect().height,lineHeight:line.getBoundingClientRect().height,
        barBottom:bar.getBoundingClientRect().bottom,gameTop:game.getBoundingClientRect().top,
        progress:parseFloat(meter.style.width)};
    });
    assert.ok(before.expanded);
    assert.equal(before.display,"grid");
    assert.ok(before.barHeight>=13&&before.lineHeight>=7,"Thin progress bar visible");
    assert.ok(before.gameTop>before.barBottom,"Bar above river and not covering it");
    await page.waitForTimeout(1500);
    const next=await page.locator(".captain-fs-yacht .route-progress").evaluate(el=>parseFloat(el.style.width));
    assert.ok(next>before.progress,"Progress advances during fullscreen Yacht game");
    console.log("PASS Yacht: live progress bar visible above river, "+before.progress+"% → "+next+"%");
  }finally{await page.close();}
} finally{await browser.close();}
