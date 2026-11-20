#!/usr/bin/env node
/** Offline, self-contained tests for the private dog package preparation CLI. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const run = (file, args, opts={}) => execFileSync(process.execPath, [file,...args], {encoding:'utf8',stdio:'pipe',...opts});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'pet-template-test-'));
  const repo = join(root,'fake-repo');
  const lab = join(repo, 'pet-template-lab');
  const scripts = join(lab,'scripts');
  await mkdir(scripts,{recursive:true});
  await mkdir(join(lab,'examples'));
  await mkdir(join(repo,'public','demo'),{recursive:true});
  await copyFile(join(here,'prepare.mjs'),join(scripts,'prepare.mjs'));
  await copyFile(join(here,'validate.mjs'),join(scripts,'validate.mjs'));
  const catalog={version:1,excludes:['captain','card-vault'],pages:[
    {id:'home',label:'Landing Page',slots:[
      {id:'home.hero',source:'public/demo/hero.webp',target:'home/hero.webp',required:true},
      {id:'home.title',source:'public/demo/title.png',target:'home/title.png',required:false}
    ]}
  ]};
  await writeFile(join(lab,'asset-catalog.json'),JSON.stringify(catalog));
  await writeFile(join(lab,'examples','profile.example.json'),JSON.stringify({schemaVersion:1,pet:{id:'example-dog',name:'Example Dog',species:'dog',breed:'',personality:''},features:{captain:false,cardVault:false},assetBase:'assets',reviewStatus:'draft',backend:{accounts:false,cloudNotes:false,secretSanta:false,email:false}}));
  await writeFile(join(repo,'public','demo','hero.webp'),'mock');
  await writeFile(join(repo,'public','demo','title.png'),'mock');
  return {root,repo,lab,script:join(scripts,'prepare.mjs'),validate:join(scripts,'validate.mjs'),destination:join(root,'private-dog')};
}

test('Creates a private package without writing into the flagship repository', async t=>{
  const f=await fixture();
  t.after(async()=>rm(f.root,{recursive:true,force:true}));
  const create=JSON.parse(run(f.script,['init','--out',f.destination,'--id','buddy','--name','Buddy','--breed','Golden Retriever']));
  assert.equal(create.id,'buddy');
  const p=JSON.parse(await readFile(join(f.destination,'profile.json'),'utf8'));
  assert.equal(p.pet.name,'Buddy');
  assert.equal(p.features.captain,false);
  assert.deepEqual(p.backend,{accounts:false,cloudNotes:false,secretSanta:false,email:false});
  const status=JSON.parse(run(f.script,['status','--pack',f.destination]));
  assert.equal(status.essentialRemaining,1);
  assert.equal(status.optionalRemaining,1);
  run(f.script,['prompts','--pack',f.destination]);
  const prompts=await readFile(join(f.destination,'prompts.md'),'utf8');
  assert.match(prompts,/Buddy/); assert.match(prompts,/home\/hero.webp/);
  run(f.script,['review','--pack',f.destination]);
  const gallery=await readFile(join(f.destination,'review.html'),'utf8');
  assert.match(gallery,/Awaiting approved asset/);
  await mkdir(join(f.destination,'assets','home'),{recursive:true});
  await writeFile(join(f.destination,'assets','home','hero.webp'),'mock approved');
  const second=JSON.parse(run(f.script,['status','--pack',f.destination]));
  assert.equal(second.available,1);
  assert.equal(second.essentialRemaining,0);
  assert.throws(()=>run(f.script,['init','--out',f.destination,'--id','buddy','--name','Buddy']));
  assert.throws(()=>run(f.script,['review','--pack',f.destination]));
  run(f.script,['review','--pack',f.destination,'--replace']);
  assert.match(await readFile(join(f.destination,'review.html'),'utf8'),/assets\/home\/hero.webp/);
});

test('Rejects paths inside source repo and invalid dog slugs',async t=>{
  const f=await fixture(); t.after(async()=>rm(f.root,{recursive:true,force:true}));
  assert.throws(()=>run(f.script,['init','--out',join(f.repo,'bad'),'--id','bad','--name','Bad']));
  assert.throws(()=>run(f.script,['init','--out',f.destination,'--id','../bad','--name','Bad']));
  assert.throws(()=>run(f.script,['init','--out',f.destination,'--id','Bad_123','--name','Bad']));
});

test('Rejects symlinked package root',async t=>{
  const f=await fixture(); t.after(async()=>rm(f.root,{recursive:true,force:true}));
  run(f.script,['init','--out',f.destination,'--id','buddy','--name','Buddy']);
  const link=join(f.root,'shortcut');
  await symlink(f.destination,link);
  assert.throws(()=>run(f.script,['status','--pack',link]));
});


test('Rejects asset directory symlink into an external or Rosie folder',async t=>{
  const f=await fixture(); t.after(async()=>rm(f.root,{recursive:true,force:true}));
  run(f.script,['init','--out',f.destination,'--id','buddy','--name','Buddy']);
  await rm(join(f.destination,'assets'),{recursive:true});
  await symlink(join(f.repo,'public'),join(f.destination,'assets'));
  assert.throws(()=>run(f.script,['status','--pack',f.destination]));
});


test('Read-only validator checks images and blocks shared backend configuration',async t=>{
  const f=await fixture(); t.after(async()=>rm(f.root,{recursive:true,force:true}));
  run(f.script,['init','--out',f.destination,'--id','buddy','--name','Buddy']);
  const original=JSON.parse(run(f.validate,['--catalog']));
  assert.equal(original.passed,true);
  assert.throws(()=>run(f.validate,['--pack',f.destination]));
  await mkdir(join(f.destination,'assets','home'),{recursive:true});
  const webp=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBP'),Buffer.alloc(30)]);
  await writeFile(join(f.destination,'assets','home','hero.webp'),webp);
  assert.equal(JSON.parse(run(f.validate,['--pack',f.destination])).passed,true);
  assert.throws(()=>run(f.validate,['--pack',f.destination,'--strict']));
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(30)]);
  await writeFile(join(f.destination,'assets','home','title.png'),png);
  assert.equal(JSON.parse(run(f.validate,['--pack',f.destination,'--strict'])).passed,true);
  const file=join(f.destination,'profile.json'), profile=JSON.parse(await readFile(file,'utf8'));
  profile.backend.email=true;
  await writeFile(file,JSON.stringify(profile));
  assert.throws(()=>run(f.validate,['--pack',f.destination]));
});
