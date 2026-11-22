#!/usr/bin/env node
/**
 * TeddyVerse expansion release gates.
 * Read-only; never enables a feature or writes files. Run before any preview
 * that attempts to enable Captain, Haiku or Card Vault.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const load = name => JSON.parse(fs.readFileSync(path.join(root,name),"utf8"));
const queue=load("generation-queue.json");
const reviews=load("visual-review-queue.json");
const vault=load("vault-scope-inventory.json");
const gates=load("feature-gates.json");
const ledger=load("approval-ledger.json");
const validSha=s=>typeof s==="string"&&/^[a-fA-F0-9]{64}$/.test(s);
const validDate=s=>typeof s==="string"&&!Number.isNaN(Date.parse(s));
const gen=queue.assets.filter(a=>a.state==="awaiting-generation");
const review=reviews.assets;
const ids=new Set([...queue.assets.map(a=>a.id),...review.map(a=>a.id),...vault.assets.map(a=>a.id)]);
if(ids.size!==queue.assets.length+review.length+vault.assets.length)throw Error("Duplicate asset IDs");
if(queue.assets.length!==107||gen.length!==98||review.length!==173||vault.assets.length!==313)throw Error("Teddy asset queue count changed; reconcile before releasing");
const result={generatedAt:new Date().toISOString(),baseline:72,newArtQueue:gen.length,visualReviewQueue:review.length,cardVaultFiles:vault.assets.length,features:{}};
for(const [name,setting] of Object.entries(gates.features)){
 const selected=gen.filter(a=>setting.modules.includes(a.section));
 const checks=review.filter(a=>setting.modules.includes(a.module));
 const missingArt=selected.filter(a=>{const p=ledger.approvedAssets[a.id];return !p||p.approved!==true||!validSha(p.sha256)||!p.approvedBy||!validDate(p.approvedAt)||p.dimensionsVerified!==true||p.alphaVerified!==true}).map(a=>a.id);
 const undecided=checks.filter(a=>{const p=ledger.reviewDecisions[a.id];return !p||!["reuse-unchanged","derive-from-approved-art","vector-rebuild","promote-to-generation"].includes(p.decision)||!p.reviewedBy||!validDate(p.reviewedAt)||p.decision==="promote-to-generation"&&!p.linkedAssetId||p.decision==="vector-rebuild"&&!p.linkedAssetId||p.decision==="derive-from-approved-art"&&!p.verifiedDerivedSHA}).map(a=>a.id);
 const vaultOpen=name==="vault"?vault.assets.filter(x=>!ledger.approvedAssets[x.id]||!ledger.approvedAssets[x.id].approvedBy).map(x=>x.id):[];
 const qaMissing=setting.requiredChecks.filter(c=>{const z=ledger.qaEvidence[name]?.[c];return !z||z.passed!==true||!z.checkedBy||!validDate(z.checkedAt)} );
 const ready=!missingArt.length&&!undecided.length&&!vaultOpen.length&&!qaMissing.length;
 result.features[name]={enabled:setting.enabled===true,ready,generationRequired:selected.length,artPending:missingArt.length,visualReviewRequired:checks.length,reviewPending:undecided.length,vaultPending:vaultOpen.length,qaPending:qaMissing.length,missingArtIds:missingArt.slice(0,12),missingReviewIds:undecided.slice(0,12),missingChecks:qaMissing};
}
console.log(JSON.stringify(result,null,2));
if(process.argv.includes("--enforce")&&Object.entries(result.features).some(([name,s])=>s.enabled&&!s.ready)){console.error("Blocked: one or more enabled Teddy expansions failed approval/QA gates");process.exitCode=2}
