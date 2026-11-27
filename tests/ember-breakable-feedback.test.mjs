import assert from "node:assert/strict";
import {test} from "node:test";
import {excavationNotice, excavationStars} from "../src/emberBreakableFeedback.js";

// 2026-11-25 feedback round (Mitchell): far less text in the levels.
// Warnings are a short title with no detail sentence; bonus outcomes
// pop nothing at all; refusals are small quiet pills.
test("crystal resistance is one short warning: NEEDS TURBO",()=>{
 const cue=excavationNotice({type:"hard-rock",material:"crystal"});
 assert.equal(cue.kind,"tip");
 assert.equal(cue.title,"NEEDS TURBO");
 assert.equal(cue.detail,undefined);
 assert.ok(cue.duration>=1);
});
test("bonus outcomes no longer pop a card",()=>{
 assert.equal(excavationNotice({type:"break-wall",material:"earth"}),null);
 assert.equal(excavationNotice({type:"break-wall",material:"crystal"}),null);
 assert.equal(excavationNotice({type:"shutter-dodged"}),null);
 assert.equal(excavationNotice({type:"shutter-shatter"}),null);
 assert.equal(excavationNotice({type:"objective-complete",mission:"barkroot",points:250}),null);
 assert.equal(excavationNotice({type:"world-hazard-dodged"}),null);
 assert.equal(excavationNotice({type:"world-objective-complete",points:500}),null);
 assert.equal(excavationNotice({type:"boss-hit",health:3}),null);
 assert.equal(excavationNotice({type:"boss-victory",boss:"copperjack",points:1400}),null);
 assert.equal(excavationNotice({type:"secret-found",material:"entrance"}),null);
 assert.equal(excavationNotice({type:"crack-wall",material:"earth"}),null);
 assert.equal(excavationNotice({type:"pickup",kind:"gem"}),null);
});
test("warnings keep their placement and carry no detail",()=>{
 const ceiling=excavationNotice({type:"shutter-warning",side:-1});
 const floor=excavationNotice({type:"shutter-warning",side:1});
 assert.equal(ceiling.placement,"bottom");
 assert.equal(floor.placement,"top");
 assert.equal(ceiling.title,"CRYSTAL AHEAD");
 assert.equal(ceiling.detail,undefined);
 const hazard=excavationNotice({type:"world-hazard-warning",kind:"geyser",side:1});
 assert.equal(hazard.title,"MOLTEN GEYSER AHEAD");
 assert.equal(hazard.detail,undefined);
 const boss=excavationNotice({type:"boss-warning",text:"SPARK BOLT"});
 assert.equal(boss.title,"SPARK BOLT");
});
test("refusals are quiet title-only pills",()=>{
 const early=excavationNotice({type:"boss-strike-early"});
 assert.equal(early.quiet,true);
 assert.equal(early.title,"TOO EARLY");
 assert.equal(early.detail,undefined);
 const charging=excavationNotice({type:"turbo-charging"},62);
 assert.equal(charging.quiet,true);
 assert.equal(charging.title,"TURBO 62%");
});
test("three expedition medals require surviving, excavation and the royal relic",()=>{
 assert.equal(excavationStars({result:null,wallsBroken:4,relics:1}),0);
 assert.equal(excavationStars({result:"hull",wallsBroken:4,relics:1}),0);
 assert.equal(excavationStars({result:"complete",wallsBroken:0,relics:0}),1);
 assert.equal(excavationStars({result:"complete",wallsBroken:2,relics:0}),2);
 assert.equal(excavationStars({result:"complete",wallsBroken:2,relics:1}),3);
 assert.equal(excavationStars({result:"complete",wallsBroken:1,relics:1}),2);
});
test("boss-vulnerable banner shows the real Turbo charge, briefly",()=>{
 assert.equal(excavationNotice({type:"boss-vulnerable"},100).detail,"TURBO READY");
 assert.equal(excavationNotice({type:"boss-vulnerable"},45).detail,"Turbo 45%");
 assert.equal(excavationNotice({type:"boss-vulnerable"},0).detail,"Turbo 0%");
 assert.equal(excavationNotice({type:"boss-vulnerable"}).detail,"Turbo 0%");
});
