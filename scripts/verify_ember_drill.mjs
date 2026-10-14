import { chromium, webkit } from "playwright";
import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

const url="http://127.0.0.1:4173/#captain";
await mkdir("artifacts/ember-drill",{recursive:true});
const painterBundle=await build({entryPoints:["src/emberDrillPainter.js"],bundle:true,format:"iife",globalName:"EmberPainter",platform:"browser",write:false,logLevel:"silent"});
for (const [name,browserType] of [["chromium",chromium],["webkit",webkit]]) {
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],failed=[];
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("response",response=>{if(response.url().includes("/ember-drill/")&&response.status()>=400)failed.push([response.status(),response.url()])});
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  await page.locator(".ember-suite").waitFor({state:"visible",timeout:45000});
  const suite=page.locator(".ember-suite");
  await suite.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  const title=await page.locator(".ember-header").innerText();
  if(!title.includes("CAPTAIN ROSIE"))throw new Error("Header title absent");
  // Guard against the exact cropped-title defect seen on the real iPhone.
  await page.evaluate(()=>document.fonts.ready);
  const banner=await page.evaluate(()=>{
    const header=document.querySelector(".ember-header");
    const h2=header.querySelector(".ember-header-copy h2");
    const copy=header.querySelector(".ember-header-copy");
    const range=document.createRange();range.selectNodeContents(h2);
    const text=range.getBoundingClientRect(),outer=header.getBoundingClientRect();
    return {textLeft:text.left,textRight:text.right,headerRight:outer.right,headerLeft:outer.left,opacity:getComputedStyle(copy).opacity};
  });
  if(banner.opacity!=="1"||banner.textRight>banner.headerRight-2||banner.textLeft<banner.headerLeft)
    throw new Error("Cropped or invisible Captain title: "+JSON.stringify(banner));
  // The game intentionally suspends rendering when its canvas is outside the
  // viewport. Bring the stage itself into view and wait for a painted pixel;
  // this avoids a false negative from WebKit lazy/offscreen scheduling.
  await page.locator(".ember-stage").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{
    const c=document.querySelector(".ember-canvas");
    if(!c||!c.width||!c.height)return false;
    return c.getContext("2d")?.getImageData(Math.min(200,c.width-1),Math.min(410,c.height-1),1,1).data[3]>0;
  },{timeout:12000});
  const artwork=await page.evaluate(()=>{
    const canvas=document.querySelector(".ember-canvas");
    const context=canvas?.getContext("2d");
    const pix=context?.getImageData(200,410,1,1).data;
    return {canvasWidth:canvas?.width,canvasHeight:canvas?.height,pixel:[...(pix||[])],imageRequestCount:performance.getEntriesByType("resource").filter(x=>x.name.includes("/ember-drill/")).length};
  });
  if(artwork.imageRequestCount<15)throw new Error("Too few artwork requests: "+artwork.imageRequestCount);
  await suite.screenshot({path:"artifacts/ember-drill/"+name+"-idle.png"});
  await page.getByRole("button",{name:"START DIGGING"}).click();
  await page.waitForTimeout(400);
  // Fixed app tabs float over page content; scroll to the actual game footer before interacting.
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
  await page.waitForTimeout(250);
  for (const [label,delay] of [["Angle the drill upward",340],["Angle the drill downward",240]]) {
    const control=page.getByRole("button",{name:label});
    const bounds=await control.boundingBox();
    if(!bounds)throw new Error("Missing "+label+" button bounds");
    const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
    const tapTarget=await page.evaluate(([xx,yy])=>{
      return document.elementFromPoint(xx,yy)?.closest("button")?.getAttribute("aria-label")||"covered";
    },[x,y]);
    if(tapTarget!==label)throw new Error("Overlapping navigation: "+label+" hit "+tapTarget);
    await page.mouse.move(x,y);
    await page.mouse.down();
    await page.waitForTimeout(delay);
    await page.mouse.up();
  }
  const remaining=(await suite.locator(".ember-stats").innerText()).match(/\b7[0-5]s\b/);
  if(!remaining)throw new Error("75-second timer not visible: "+await suite.locator(".ember-stats").innerText());
  await suite.screenshot({path:"artifacts/ember-drill/"+name+"-running.png"});
  if(errors.length)throw new Error("Page errors: "+errors.join(" | "));
  if(failed.length)throw new Error("Missing assets: "+JSON.stringify(failed));
  // Independent visual exercise of Burrow Turbo. Paint the exact production
  // renderer with synthetic fully-charged run state and its real PNG/WebP assets.
  await page.addScriptTag({content:painterBundle.outputFiles[0].text});
  const turboResult=await page.evaluate(async ()=>{
    const names={body:"drill-body.webp",auger:"auger-spin.png",turbo:"turbo-animation.webp",
      scenicBarkroot:"scenic-barkroot.webp",scenicLantern:"scenic-lantern.webp",
      scenicRoots:"scenic-roots.webp",scenicCrystal:"scenic-crystal.webp",
      scenicTemple:"scenic-temple.webp",barkroot:"barkroot-loop.webp",rubyLoop:"ruby-loop.webp",crystalOverlay:"feature-crystaloverlay.webp",rubyOrganic:"ruby-organic-passage.webp",templeOrganic:"temple-organic-passage.webp",
      roof:"roof-roots.webp",floor:"floor-ruby.webp",hangingRoots:"barkroot-hanging-roots.webp",
      terrainEarth:"terrain-barkroot-earth.webp",terrainRoots:"terrain-deep-rootstone.webp",
      terrainRuby:"terrain-ruby-crystal-rock.webp",terrainTemple:"terrain-temple-basalt.webp",
      descentRoof:"descending-roof.webp",descentFloor:"descending-floor.webp",
      cache:"collect-cache.webp",gem:"collect-gem.webp",bone:"collect-bone.webp",cheese:"collect-cheese.webp",
      spike:"hazard-spike.webp",rock:"hazard-rock.webp",hazardPulse:"hazard-pulse.webp",
      gate:"feature-gate.webp",lantern:"feature-lantern.webp",
      chest:"feature-chest.webp",coin:"feature-coin.webp",rockburst:"feature-rockburst.webp",
      boosttrail:"feature-boosttrail.webp",
      turnUp:"wall-turn-up.webp",turnNeutral:"wall-turn-neutral.webp",turnDown:"wall-turn-down.webp",
      wallAmberCeiling:"wall-amber-ceiling.webp",wallAmberFloor:"wall-amber-floor.webp",
      wallFantasyCeiling:"wall-fantasy-ceiling.webp",wallFantasyFloor:"wall-fantasy-floor.webp",
      wallLanternCeiling:"wall-lantern-ceiling.webp",
      wallDescentCeiling:"wall-descent-ceiling.webp",wallDescentFloor:"wall-descent-floor.webp",
      wallRubyCeiling:"wall-ruby-ceiling.webp",wallRubyFloor:"wall-ruby-floor.webp",
      wallCrystalFloor:"wall-crystal-floor.webp",
      wallSanctumCeiling:"wall-sanctum-ceiling.webp",wallSanctumFloor:"wall-sanctum-floor.webp"};
    const assets={};
    await Promise.all(Object.entries(names).map(async ([key,file])=>{
      const img=new Image();img.src="/ember-drill/"+file;await img.decode();assets[key]=img;
    }));
    const canvas=document.createElement("canvas");
    canvas.id="ember-qa-turbo";canvas.width=690;canvas.height=820;
    canvas.style.cssText="display:block;width:340px;height:405px;position:absolute;top:5px;left:5px;z-index:100000;pointer-events:none";
    document.body.appendChild(canvas);
    const c=canvas.getContext("2d");
    const drawn=new Set();
    const patterned=new Set();
    const nativePattern=c.createPattern.bind(c);
    c.createPattern=(im,...args)=>{
      if(im?.src)patterned.add(im.src.split("/").pop());
      return nativePattern(im,...args);
    };
    const originalDraw=c.drawImage.bind(c);
    c.drawImage=(im,...args)=>{
      if(im?.src)drawn.add(im.src.split("/").pop());
      return originalDraw(im,...args);
    };
    const state={scroll:12000,time:50.0,y:408,pitch:0,hitCooldown:0,shock:0,objects:[],boostTime:0};
    const portrait=null;
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const ordinary=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
    state.boostTime=3.5;
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const turbo=c.getImageData(0,0,690,820).data;
    let total=0,count=0;
    for(let y=290;y<525;y+=3)for(let x=65;x<425;x+=3){
      const i=(y*690+x)*4;
      total+=Math.abs(ordinary[i]-turbo[i])+Math.abs(ordinary[i+1]-turbo[i+1])+Math.abs(ordinary[i+2]-turbo[i+2]);
      count+=3;
    }

    // Confirm the excavating tip is actually visible and attached to the drill,
    // not a decorative static flash. It must disappear when the run stops.
    state.time=17;state.scroll=6200;state.y=410;state.pitch=-.26;state.objects=[];
    state.boostTime=0;state.running=false;
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const noCut=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
    state.running=true;
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const yesCut=c.getImageData(0,0,690,820).data;
    const xTip=210+Math.cos(state.pitch)*166,yTip=state.y+Math.sin(state.pitch)*166;
    let contactChange=0,contactSamples=0;
    for(let yy=Math.floor(yTip-55);yy<yTip+55;yy+=3){
      for(let xx=Math.floor(xTip-70);xx<xTip+35;xx+=3){
        if(xx<0||xx>=690||yy<0||yy>=820)continue;
        const i=(yy*690+xx)*4;
        contactChange+=Math.abs(noCut[i]-yesCut[i])
          +Math.abs(noCut[i+1]-yesCut[i+1])
          +Math.abs(noCut[i+2]-yesCut[i+2]);
        contactSamples+=3;
      }
    }
    const contactDifference=contactChange/contactSamples;
    if(contactDifference<1.0)
      throw new Error("Excavation effects not visible at angled auger tip: "+contactDifference);
    window.__emberContactCapture=c.canvas.toDataURL("image/png");
    state.running=false;

    // Regression against loading unused art: demand actual drawImage calls
    // at the feature's world position and each of seven passage panoramas.
    const sceneFrames=[[3,1100],[13,3300],[24,7300],[35,11100],[40,13000],
      [46,14400],[58,18500],[69,22200]];
    for(const [time,scroll] of sceneFrames){
      state.time=time;state.scroll=scroll;state.y=410;state.boostTime=0;
      state.objects=[
        {id:8,kind:"cache",x:scroll+360,y:390,taken:false,radius:20},
        {id:7,kind:"gem",x:scroll+425,y:398,taken:false,radius:20},
      ];
      window.EmberPainter.paintDrill(c,state,portrait,[{
        type:"rock-burst",x:235,y:410,vx:0,vy:0,r:0,color:"#efbd75",life:.40,max:.54
      }],assets);
    }
    // Force the specific environmental set pieces fully onscreen.
    for(const [time,world] of [[7,1150],[11,3150],[38,10780],[48,15300],[59,17700],[68,20800]]){
      state.time=time;state.scroll=world-350;
      window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    }
    // Test the real collision sprites at known screen coordinates. Merely
    // loading hazard-spike.webp is not enough: earlier builds accidentally
    // omitted the assets argument and silently drew a placeholder circle.
    state.time=37;
    state.scroll=12500;
    state.boostTime=0;
    state.objects=[
      {id:9001,kind:"spike",x:12850,y:390,taken:false,radius:37},
      {id:9002,kind:"rock",x:13000,y:505,taken:false,radius:42},
    ];
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const wheelVisible=drawn.has("hazard-spike.webp");
    const boulderVisible=drawn.has("hazard-rock.webp");
    const pulseVisible=drawn.has("hazard-pulse.webp");
    if(!wheelVisible||!boulderVisible||!pulseVisible)
      throw new Error("Real hazard artwork not painted: "+JSON.stringify({wheelVisible,boulderVisible,pulseVisible}));
    // Capture a mid-run temple image with both the ornate spinning wheel
    // and an actual stone hazard to inspect physical scale and layering.
    window.__emberHazardCapture=c.canvas.toDataURL("image/png");

    // Verify the actual material is applied by Canvas, not merely downloaded.
    const materialFrames=[
      {time:8,key:"terrainEarth",file:"terrain-barkroot-earth.webp"},
      {time:27,key:"terrainRoots",file:"terrain-deep-rootstone.webp"},
      {time:46,key:"terrainRuby",file:"terrain-ruby-crystal-rock.webp"},
      {time:65,key:"terrainTemple",file:"terrain-temple-basalt.webp"},
    ];
    const materialDiffs={};
    for(const frame of materialFrames){
      state.time=frame.time;state.scroll=frame.time*320;state.y=410;
      state.boostTime=0;state.objects=[];
      window.EmberPainter.paintDrill(c,state,portrait,[],assets);
      const withTexture=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
      const withoutTextureAssets={...assets,[frame.key]:null};
      window.EmberPainter.paintDrill(c,state,portrait,[],withoutTextureAssets);
      const withoutTexture=c.getImageData(0,0,690,820).data;
      let change=0,samples=0;
      for(let y=70;y<765;y+=7)for(let x=25;x<665;x+=7){
        const i=(y*690+x)*4;
        change+=Math.abs(withTexture[i]-withoutTexture[i])
          +Math.abs(withTexture[i+1]-withoutTexture[i+1])
          +Math.abs(withTexture[i+2]-withoutTexture[i+2]);
        samples+=3;
      }
      materialDiffs[frame.key]=change/samples;
      if(!patterned.has(frame.file) || materialDiffs[frame.key]<.70)
        throw new Error("Continuous wall material missing or visually invisible: "
          +frame.file+" "+materialDiffs[frame.key]);
      if(frame.key==="terrainEarth" || frame.key==="terrainRuby"){
        window.EmberPainter.paintDrill(c,state,portrait,[],assets);
        window["__emberMaterial"+frame.key]=c.canvas.toDataURL("image/png");
      }
    }

    // Recovered illustrations now appear as isolated art attached to the
    // collision curve, not wallpaper. Removing one must change visible pixels.
    const accentFrames=[["wallAmberCeiling",5,150],["wallLanternCeiling",14,5100],
      ["wallRubyCeiling",42,10900],["crystalOverlay",53,16700]];
    const accentDiffs={};
    for(const [key,time,scroll] of accentFrames){
      state.time=time;state.scroll=scroll;state.y=410;state.pitch=0;
      state.boostTime=0;state.objects=[];
      window.EmberPainter.paintDrill(c,state,portrait,[],assets);
      const before=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
      if(key==="wallLanternCeiling")window.__emberWallsCapture=c.canvas.toDataURL("image/png");
      if(key==="crystalOverlay")window.__emberCrystalCapture=c.canvas.toDataURL("image/png");
      window.EmberPainter.paintDrill(c,state,portrait,[],{...assets,[key]:null});
      const after=c.getImageData(0,0,690,820).data;
      let sum=0,n=0;
      for(let y=80;y<760;y+=9)for(let x=30;x<665;x+=9){
        const i=(y*690+x)*4;
        sum+=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2]);n+=3;
      }
      accentDiffs[key]=sum/n;
      if(accentDiffs[key]<.12)throw new Error("Recovered wall art not visible: "+key+" "+accentDiffs[key]);
    }
    for(const angle of [-.54,0,.54]){
      state.pitch=angle;state.scroll=6800;state.y=405;state.time=20;
      window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    }
    const registered=["wall-turn-up.webp","wall-turn-neutral.webp","wall-turn-down.webp"];
    for(const file of registered)
      if(!drawn.has(file))throw new Error("Undrawn turning-pose artwork: "+file);

    const required=["feature-gate.webp","feature-lantern.webp","feature-chest.webp",
      "feature-coin.webp","feature-rockburst.webp","feature-boosttrail.webp",
      "scenic-barkroot.webp","scenic-roots.webp",
      "scenic-lantern.webp","ruby-organic-passage.webp","temple-organic-passage.webp","scenic-crystal.webp",
      "scenic-roots.webp","barkroot-loop.webp","ruby-loop.webp"];
    // Explicitly run a boosted frame for the rearward exhaust overlay.
    state.boostTime=3.5;
    window.EmberPainter.paintDrill(c,state,portrait,[],assets);
    const missing=required.filter(name=>!drawn.has(name));
    return {contactDifference,pixelDifference:total/count,loaded:Object.keys(assets).length,
      drawnArt:drawn.size,missingVisualAssets:missing,accentDiffs,materialDiffs};
  });
  if(turboResult.pixelDifference<4.0)throw new Error("Boost effect is visually imperceptible: "+JSON.stringify(turboResult));
  if(turboResult.missingVisualAssets.length)
    throw new Error("Imported art was loaded but not drawn: "+turboResult.missingVisualAssets.join(", "));
  // Also retain a separate objective screenshot of the rendered spike wheel.
  await page.evaluate(()=>{const img=new Image();img.src=window.__emberHazardCapture;img.id="ember-wheel-proof";img.style.cssText="position:absolute;top:0;left:0;width:340px;height:405px;z-index:100001;pointer-events:none";document.body.appendChild(img)});
  await page.locator("#ember-wheel-proof").screenshot({path:"artifacts/ember-drill/"+name+"-hazards.png"});
  await page.evaluate(()=>{const img=new Image();img.src=window.__emberWallsCapture;img.id="ember-walls-proof";img.style.cssText="position:absolute;top:0;left:0;width:340px;height:405px;z-index:100002;pointer-events:none";document.body.appendChild(img)});
  await page.locator("#ember-walls-proof").screenshot({path:"artifacts/ember-drill/"+name+"-walls.png"});
  await page.evaluate(()=>{const img=new Image();img.src=window.__emberCrystalCapture;img.id="ember-crystal-proof";img.style.cssText="position:absolute;top:0;left:0;width:340px;height:405px;z-index:100003;pointer-events:none";document.body.appendChild(img)});
  await page.locator("#ember-crystal-proof").screenshot({path:"artifacts/ember-drill/"+name+"-crystal.png"});
  for(const terrain of ["terrainEarth","terrainRuby"]){
    await page.evaluate(which=>{
      const image=new Image();image.src=window["__emberMaterial"+which];
      image.id="ember-material-"+which;
      image.style.cssText="position:absolute;top:0;left:0;width:340px;height:405px;z-index:100005;pointer-events:none";
      document.body.appendChild(image);
    },terrain);
    await page.locator("#ember-material-"+terrain).screenshot({path:"artifacts/ember-drill/"+name+"-"+terrain+".png"});
  }
  await page.evaluate(()=>{
    const im=new Image();im.src=window.__emberContactCapture;
    im.id="ember-contact-qa";
    im.style.cssText="position:absolute;top:0;left:0;width:340px;height:405px;z-index:100015;pointer-events:none";
    document.body.appendChild(im);
  });
  await page.locator("#ember-contact-qa").screenshot({path:"artifacts/ember-drill/"+name+"-cutting.png"});
  await page.locator("#ember-qa-turbo").screenshot({path:"artifacts/ember-drill/"+name+"-turbo.png"});
  console.log(name,"PASS",JSON.stringify(artwork),"time",remaining[0],"turbo",JSON.stringify(turboResult));
  await context.close();await browser.close();
}
