import test from "node:test";
import assert from "node:assert/strict";
import { RECIPE_CATALOG } from "../src/rosieRecipesData.js";
test("all 25 recipes have complete distinct explicit instructions",()=>{
  assert.equal(RECIPE_CATALOG.length,25);
  assert.equal(new Set(RECIPE_CATALOG.map(r=>r.id)).size,25);
  for(const r of RECIPE_CATALOG){
    assert.ok(r.ingredients.length>=4,r.title);
    assert.ok(r.steps.length>=4 && r.steps.length<=8,r.title);
    assert.ok(r.steps.every(s=>typeof s==="string"&&s.length>40&&s.endsWith(".")),r.title);
    assert.equal(r.methodText,r.steps.join(" "),r.title);
  }
});
test("recipes retain explicit food safety temperatures and dessert chilling times",()=>{
  for(const title of ["Off-Leash Lemon Chicken","Barkbecue Chicken","Tail-Wagging Tikka"]){assert.match(RECIPE_CATALOG.find(r=>r.title===title).methodText,/165°F/);}
  for(const title of ["Rosie’s Sunday Walk","The Top Dog Smash Burger","The Shepherd’s Best Friend"]){assert.match(RECIPE_CATALOG.find(r=>r.title===title).methodText,/160°F/);}
  assert.match(RECIPE_CATALOG.find(r=>r.title==="The Golden Fetch").methodText,/145°F/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Rosie’s Strawberry Pawfait").methodText,/at least 1 hour/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Paws for Tiramisu").methodText,/at least 4 hours/);
});

test("revised recipes expose elapsed estimates and stable yields",()=>{
  for(const r of RECIPE_CATALOG){assert.ok(r.totalMinutes>=10,r.title);assert.ok(r.timeLabel.includes("min")||r.timeLabel.includes("hour"),r.title);}
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Best in Show Brownies").timeLabel,/cooling/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Puppy Love Cookies").methodText,/at least 30 minutes/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Paws for Tiramisu").timeLabel,/4 hours chilling/);
});
