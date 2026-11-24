import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { RECIPE_CATALOG } from "../src/rosieRecipesData.js";
test("all 35 approved recipes have complete distinct explicit instructions",()=>{
  assert.equal(RECIPE_CATALOG.length,35);
  assert.equal(new Set(RECIPE_CATALOG.map(r=>r.id)).size,35);
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
  for(const r of RECIPE_CATALOG){assert.ok(r.totalMinutes>=10,r.title);assert.ok(/min|hour|hr/.test(r.timeLabel),r.title);}
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Best in Show Brownies").timeLabel,/cooling/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Puppy Love Cookies").methodText,/at least 30 minutes/);
  assert.match(RECIPE_CATALOG.find(r=>r.title==="Paws for Tiramisu").timeLabel,/4 hours chilling/);
});


test("all ten approved dishes map to actual WebP artwork",()=>{
  const ids=["the-bark-side-of-the-moon","pawberry-fields-forever","barklava","the-shibab","ruff-around-the-edges","the-woofle","fettuccine-al-fur-do","the-great-dan-ish","pup-tart","chew-churros"];
  assert.ok(!RECIPE_CATALOG.some(r=>r.id==="pawlovas"));
  for(const id of ids){
    const r=RECIPE_CATALOG.find(r=>r.id===id);
    assert.ok(r,id);
    assert.equal(r.artPending,false,id);
    assert.ok(r.note,id);
    const bytes=readFileSync(new URL("../public/rosieverse/recipes/dishes/"+id+".webp",import.meta.url));
    assert.equal(bytes.toString("ascii",0,4),"RIFF",id);
    assert.equal(bytes.toString("ascii",8,12),"WEBP",id);
  }
  assert.match(RECIPE_CATALOG.find(r=>r.id==="chew-churros").methodText,/350°F/);
});
