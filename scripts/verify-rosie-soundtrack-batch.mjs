import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const dir=new URL("../public/rosie-music/",import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL("catalog.json",dir),"utf8"));
const ids=["tunnel-tyrant","tunnel-clockwork-boss","tunnel-caverns","tunnel-depths","tunnel-crown-victory","rosie-signature","zen-garden-dusk","zen-temple-rain","cosmic-victory","yacht-victory","vault-treasure","randomizers-monte-carlo"];
for(const id of ids){const t=catalog.tracks.find(t=>t.id===id);assert.ok(t,id);const b=fs.readFileSync(new URL(t.filename,dir));assert.equal(b.length,t.bytes,id);assert.equal(crypto.createHash("sha256").update(b).digest("hex"),t.sha256,id);}
console.log("Verified all 12 new MP3 recordings");
