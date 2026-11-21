import assert from "node:assert/strict";
import {chromium} from "playwright";
const base=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
const sizes=[[320,700],[390,844],[430,932]];
const views=["lotus","sakura","raked","tea","mist","twilight","moonlit"];
try{
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  try{
   await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded"});
   await page.locator(".haiku-scroll").waitFor({state:"visible"});
   const music=await page.evaluate(()=>{
     const paw=document.querySelector('button[aria-label*="RosieVerse account"]');
     const button=document.querySelector(".rosie-music-launch");
     const a=paw.getBoundingClientRect(),b=button.getBoundingClientRect();
     return{paw:{x:a.x,y:a.y,w:a.width,h:a.height},
       music:{x:b.x,y:b.y,w:b.width,h:b.height},
       cOffset:(b.x+b.width/2)-(a.x+a.width/2),gap:b.y-(a.y+a.height)};
   });
   assert.equal(music.paw.w,44);
   assert.equal(music.music.w,44);
   assert.ok(Math.abs(music.cOffset)<1,"Music/paw center aligned");
   assert.ok(music.gap>=6&&music.gap<=10,"Consistent gap between music and paw");

   for(const style of ["sakura","imperial","grand"]){
    const data=await page.locator(".haiku-scroll").evaluate(el=>{
      const r=s=>s.getBoundingClientRect();
      const verse=el.querySelector(".haiku-verse");
      const lines=[...verse.querySelectorAll("p")];
      const meta=el.querySelector(".haiku-scroll-meta");
      const a=r(lines[lines.length-1]),b=r(meta),inner=r(el.querySelector(".haiku-scroll-inner"));
      return{style:el.dataset.scrollStyle,thirdBottom:a.bottom,metaTop:b.top,
        metaBottom:b.bottom,innerBottom:inner.bottom,
        metre:meta.querySelector(".haiku-metre").innerText,
        signature:meta.querySelector(".haiku-scroll-signature").innerText};
    });
    assert.equal(data.style,style);
    assert.ok(data.metaTop>data.thirdBottom+3,style+" has clear space before attribution");
    assert.ok(data.metaBottom<data.innerBottom+2,style+" has attribution within paper");
    assert.equal(data.metre,"5 · 7 · 5");
    assert.ok(data.signature.includes("Rosie"));
    await page.getByRole("button",{name:"Next poetry scroll"}).click();
   }
   const order=await page.evaluate(()=>{
     const intro=document.querySelector(".haiku-status").getBoundingClientRect();
     const actions=document.querySelector(".haiku-verse-actions").getBoundingClientRect();
     return{introTop:intro.top,introBottom:intro.bottom,actionsTop:actions.top};
   });
   assert.ok(order.introBottom<=order.actionsTop+2,"Opinions tagline above buttons");
   await page.getByRole("button",{name:"Meditate",exact:true}).click();
   await page.getByRole("button",{name:/Begin.*meditation/}).click();
   for(const id of views){
    const scene=await page.locator(".zen-immersive").evaluate(async el=>{
      const img=el.querySelector(".zen-immersive-scenery img");
      await img.decode();
      const bg=getComputedStyle(el).backgroundImage;
      const source=img.currentSrc;
      const rect=img.getBoundingClientRect();
      const arrows=[...el.querySelectorAll(".zen-backdrop-cycle-arrow")];
      const head=el.querySelector(".zen-immersive-header span").textContent;
      return{view:el.dataset.zenView,source,bg,ratio:img.naturalWidth/img.naturalHeight,
        image:{width:rect.width,height:rect.height},
        arrowNames:arrows.map(a=>a.getAttribute("aria-label")),
        arrowWidths:arrows.map(a=>a.getBoundingClientRect().width),
        displayName:el.querySelector(".zen-backdrop-cycle-name")?.textContent||"",
        head};
    });
    assert.equal(scene.view,id);
    assert.ok(scene.source.includes("/meditation/iphone/"+id+"-portrait.webp"),id+" portrait actually displayed");
    assert.ok(scene.bg.includes("/meditation/iphone/"+id+"-portrait.webp"),"Native iPhone background");
    assert.ok(scene.ratio<.75,"True portrait aspect ratio");
    assert.equal(scene.image.width,width);
    assert.ok(scene.image.height>=height-1);
    assert.ok(scene.arrowWidths.every(n=>n<=30),"Discreet landscape arrows");
    assert.equal(scene.displayName,"");
    assert.ok(!scene.head.includes(id.toUpperCase()),"No decorative scene label");
    await page.getByRole("button",{name:"Next meditation background"}).click();
   }
   await page.getByRole("button",{name:"Close meditation"}).click();
   const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(over<=2,"No iPhone horizontal overflow");
   console.log("PASS "+width+"x"+height+": matched music/paw, scroll footer, verse tagline, seven distinct portrait backgrounds, discreet controls");
  }finally{await page.close();}
 }
}finally{await browser.close();}
