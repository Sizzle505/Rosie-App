import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../",import.meta.url);
const hashes={
  "home": "8fe5f04bb7ec3739bb29b3e41b79cbb026fbdcbd",
  "music": "c3a230dc72ea1560097a8becc006d6517b806f36",
  "paw": "167f6e83ce690c65c552d288aa1385cbbab1180e",
  "resources": "21f6a91c071c4af4d9bd98fe15688c6565c3bbdd",
  "switch-arrows": "3d1a7b6983bbde16e5d6b4479d17075c69e65140",
  "calculations": "828e30d7b9b68dc228780902ce2a57ca8ac309e4",
  "captain": "905f8522a146f96c6644e66606cfb4b1158f695e",
  "cheese": "3511dc6ffd4c2746bb19348bd9f7c7533a9b470e",
  "fortune": "4c8b3c56af62324d325af849a32b65d9640945ca",
  "gamepad": "bf30c5fbf558b22f024a95ced660f3fab1cde876",
  "qr": "e80ae57790d28ec1830772d57a0cfcbe96323538",
  "random": "3f4a136a96384511ee248915d015b39377cde8ca",
  "recipes": "4a260222958363e19e87ccaf35735fa2118be87d",
  "reminders": "d8411fe912e3a9625a7d51561e55acaadbd44634",
  "reviews": "1a80986b93f40c7bec6b4cfad2bd89b98b2d69e3",
  "timekeepers": "324bf4c3d1316c486340614a681332dba2d0a20b",
  "tools": "3225f5c20f78ee5d02a373645de50a192c94942f",
  "vault": "aebd0e5b3d12600b777e97f36e9b0a7e2947cf68"
};
test("all 18 approved WebP assets match the current approved artwork",()=>{
  for(const [name,sha] of Object.entries(hashes)){
    const b=readFileSync(new URL("public/rosieverse/ui/royal-nav/"+name+".webp",root));
    assert.equal(b.toString("ascii",0,4),"RIFF",name);
    assert.equal(b.toString("ascii",8,12),"WEBP",name);
    assert.equal(createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex"),sha,name);
  }
});
test("both navigation families retain live labels and routes",()=>{
  const s=readFileSync(new URL("src/main.jsx",root),"utf8");
  for(const [id,label] of Object.entries({fortune:"Fortune",cheese:"Cheese",captain:"Captain",haiku:"Zen",vault:"Vault",randomizers:"Random",reminders:"Reminders","qr-atelier":"QR",calculations:"Calculations",recipes:"Recipes",reviews:"Reviews",timekeeper:"Timekeepers"})){
    assert.ok(s.includes('onClick={() => navigateTo("'+id+'")}'),id);
    assert.ok(s.includes("<small>"+label+"</small>"),label);
  }
  assert.ok(s.includes('navFamily === "resources" ? "Games" : "Tools"'));
  assert.ok(s.includes('name="switch-arrows"'));
  assert.ok(s.includes('name="home-simple" className="royal-seal-art"'));
  assert.ok(s.includes('name="resources-simple" className="royal-seal-art"'));
});
test("persistent buttons use the new art without replacing their handlers",()=>{
  const paw=readFileSync(new URL("src/private/AccountPortal.jsx",root),"utf8");
  const music=readFileSync(new URL("src/RosieMusicPlayer.jsx",root),"utf8");
  assert.ok(paw.includes("/royal-nav/paw.webp")&&paw.includes("setOpen(true)")&&paw.includes("styles.signed"));
  assert.ok(music.includes("/royal-nav/music.webp")&&music.includes("setOpen(value=>!value)"));
});

test("navigation uses one invisible positioning grid and real controls",()=>{
 const s=readFileSync(new URL("src/main.jsx",root),"utf8");
 const css=readFileSync(new URL("src/royal-navigation.css",root),"utf8");
 assert.ok(s.includes('className="royal-nav-shell" data-nav-family={navFamily}'));
 assert.match(css,/grid-template-areas:"home tabs resources toggle"/);
 assert.match(css,/grid-template-areas:"tabs tabs tabs tabs tabs"/);
 assert.match(css,/position:relative!important;inset:auto!important;transform:none!important/);
});

test("navigation lacquer matches the approved seal-derived texture",()=>{
 const b=readFileSync(new URL("public/rosieverse/ui/royal-nav/medallion-lacquer.webp",root));
 assert.equal(createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex"),"5bdfc0b5044ebe54ac1e8c6edeb2f754856c50b3");
 const css=readFileSync(new URL("src/royal-navigation.css",root),"utf8");
 assert.ok(css.includes("medallion-lacquer.webp"));
 assert.ok(css.includes("--royal-bar:40px"));
});

test("Zen is a gold lotus between Captain and Vault, linking to the existing Haiku Garden",()=>{
 const s=readFileSync(new URL("src/main.jsx",root),"utf8");
 const css=readFileSync(new URL("src/royal-navigation.css",root),"utf8");
 const icon=readFileSync(new URL("public/rosieverse/ui/royal-nav/zen.svg",root),"utf8");
 const start=s.indexOf('<nav className="bottom-nav" aria-label="RosieVerse destinations">');
 const nav=s.slice(start,s.indexOf("</nav>",start));
 assert.deepEqual([...nav.matchAll(/<small>([^<]+)<\/small>/g)].map(m=>m[1]),["Fortune","Cheese","Captain","Zen","Vault","Random"]);
 assert.ok(nav.includes('onClick={() => navigateTo("haiku")}'));
 assert.ok(nav.includes('aria-current={page === "haiku" ? "page" : undefined}'));
 assert.ok(s.includes('name === "zen" ? ".svg" : ".webp"'));
 assert.ok(icon.includes('<svg')&&icon.includes('id="gold"'));
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
});
