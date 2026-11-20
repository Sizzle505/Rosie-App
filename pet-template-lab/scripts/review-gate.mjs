#!/usr/bin/env node
/** Read-only artwork review gate for privately staged pet-specific pilot artwork. Does not deploy. */
import { readFile, lstat, realpath } from 'node:fs/promises';
import { dirname, resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const lab=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repo=resolve(lab,'..');
const args=process.argv.slice(2);
const p=args.indexOf('--pack');
if(p<0||!args[p+1]) { console.error('Usage: node review-gate.mjs --pack /private/pets/dog'); process.exit(2); }
const folder=resolve(args[p+1]);
const within=(child,parent)=>{const r=relative(parent,child);return r===''||r!=='..'&&!r.startsWith('..'+sep)&&!r.startsWith('/');};
const errors=[];
let profile,approvals,catalog;
try {
  if(within(folder,repo)||within(await realpath(folder),await realpath(repo))||(await lstat(folder)).isSymbolicLink()) throw Error('Private pack must not be inside the flagship repository');
  [profile,approvals,catalog]=await Promise.all([
    readFile(join(folder,'profile.json'),'utf8').then(JSON.parse),
    readFile(join(folder,'approvals.json'),'utf8').then(JSON.parse),
    readFile(join(lab,'asset-catalog.json'),'utf8').then(JSON.parse)
  ]);
} catch(e){console.log(JSON.stringify({reviewPassed:false,deployAuthorized:false,errors:['Unable to inspect private pack: '+e.message]},null,2));process.exit(1);}
if(profile.schemaVersion!==1||profile.pet?.species!=='dog'||profile.pet?.id!==approvals.petId||approvals.version!==1) errors.push('Profile and approvals identity/version mismatch');
if(profile.features?.captain!==false||profile.features?.cardVault!==false) errors.push('Captain and Card Vault must be disabled');
if(!profile.backend||Object.values(profile.backend).some(v=>v!==false)||['accounts','cloudNotes','secretSanta','email'].some(k=>profile.backend[k]!==false)) errors.push('All external/backend integrations must remain disabled');
if(profile.reviewStatus!=='approved') errors.push('Pet profile reviewStatus must be approved');
if(approvals.characterApproved!==true) errors.push('Canonical dog character reference not approved');
for(const name of ['mobile','tablet','desktop','content']) if(approvals.siteReview?.[name]!==true) errors.push('Site review not approved: '+name);
const slots=catalog.pages.flatMap(page=>page.slots);
for(const slot of slots){
  const record=approvals.slots?.[slot.id];
  if(!record||!['approved','reuse','omit'].includes(record.state)){errors.push('Missing asset decision: '+slot.id);continue;}
  if(slot.required&&record.state!=='approved'){errors.push('Essential asset must be approved: '+slot.id);continue;}
  if(record.state==='reuse'&&!String(record.notes||'').trim()) errors.push('Reused art requires explicit visual justification: '+slot.id);
  if(record.state==='approved'){
    const path=resolve(folder,'assets',slot.target);
    const base=resolve(folder,'assets');
    if(!within(path,base)){errors.push('Unsafe approved asset path: '+slot.id);continue;}
    try{
      const entry=await lstat(path);
      if(!entry.isFile()||entry.isSymbolicLink()||entry.size<20||!within(await realpath(path),await realpath(base))) throw Error('missing, empty or symlinked');
    }catch(e){errors.push('Approved image not present: '+slot.id);}
  }
}
// Reuse the independent validator to verify format/signature, sources and minimum mandatory assets.
try {
  const output=execFileSync(process.execPath,[join(lab,'scripts','validate.mjs'),'--pack',folder],{encoding:'utf8'});
  const data=JSON.parse(output);
  if(!data.passed) errors.push('Catalog / file validator rejected pack');
} catch(e){errors.push('Catalog / file validator rejected pack');}
const result={reviewPassed:errors.length===0,deployAuthorized:false,pet:profile.pet.name,decisions:slots.length,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
