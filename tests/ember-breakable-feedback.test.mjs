import assert from "node:assert/strict";
import {test} from "node:test";
import {excavationNotice, excavationStars} from "../src/emberBreakableFeedback.js";

test("crystal resistance explains the Turbo requirement to the player",()=>{
 const cue=excavationNotice({type:"hard-rock",material:"crystal"});
 assert.equal(cue.kind,"tip");
 assert.match(cue.detail,/Turbo/);
 assert.ok(cue.duration>=1);
});
test("each actual excavation shows the correct short score reward",()=>{
 assert.match(excavationNotice({type:"break-wall",material:"earth"}).detail,/125/);
 assert.match(excavationNotice({type:"break-wall",material:"crystal"}).detail,/250/);
 assert.equal(excavationNotice({type:"crack-wall",material:"earth"}),null);
 assert.equal(excavationNotice({type:"pickup",kind:"gem"}),null);
});
test("secret chamber is called out as a saved relic discovery",()=>{
 const cue=excavationNotice({type:"secret-found",material:"entrance"});
 assert.equal(cue.kind,"relic");
 assert.match(cue.title,/CHAMBER/);
 assert.match(cue.detail,/Medallion/);
 assert.ok(cue.duration>2);
});
test("three expedition medals require surviving, excavation and the royal relic",()=>{
 assert.equal(excavationStars({result:null,wallsBroken:4,relics:1}),0);
 assert.equal(excavationStars({result:"hull",wallsBroken:4,relics:1}),0);
 assert.equal(excavationStars({result:"complete",wallsBroken:0,relics:0}),1);
 assert.equal(excavationStars({result:"complete",wallsBroken:2,relics:0}),2);
 assert.equal(excavationStars({result:"complete",wallsBroken:2,relics:1}),3);
 assert.equal(excavationStars({result:"complete",wallsBroken:1,relics:1}),2);
});

test("shutter warnings land on the opposite side from approaching crystals",()=>{
 const ceiling=excavationNotice({type:"shutter-warning",side:-1});
 const floor=excavationNotice({type:"shutter-warning",side:1});
 assert.equal(ceiling.placement,"bottom");
 assert.equal(floor.placement,"top");
 assert.match(ceiling.detail,/Turbo/);
});
test("new moving hazards and passage goals explain their earned bonuses",()=>{
 assert.match(excavationNotice({type:"shutter-dodged"}).detail,/100/);
 assert.match(excavationNotice({type:"shutter-shatter"}).detail,/150/);
 const barkroot=excavationNotice({type:"objective-complete",mission:"barkroot",points:250});
 const ruby=excavationNotice({type:"objective-complete",mission:"ruby",points:350});
 assert.match(barkroot.title,/BARKROOT/);
 assert.match(ruby.title,/RUBY/);
 assert.match(ruby.detail,/350/);
});
