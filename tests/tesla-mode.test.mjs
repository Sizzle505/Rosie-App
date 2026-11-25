import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const ctx=vm.createContext({URL,URLSearchParams});
vm.runInContext(read("../public/tesla-mode.js"),ctx);
const api=ctx.RosieTeslaMode;
test("Theater link targets only the current origin, not private routes or query strings",()=>{
  const target=api.appURL("https://example.vercel.app");
  assert.equal(target,"https://example.vercel.app/?tesla=1&teslaMode=1");
  const redirect=new URL(api.theaterURL("https://example.vercel.app"));
  assert.equal(redirect.origin,"https://www.youtube.com");
  assert.equal(redirect.pathname,"/redirect");
  assert.equal(redirect.searchParams.get("q"),target);
});
test("Tesla toolbar is opt-in and excluded from embedded frames and layout previews",()=>{
  assert.equal(api.enabled("?tesla=1&teslaMode=1",true),true);
  for(const search of ["","?tesla=1","?teslaMode=1","?tesla=0&teslaMode=1","?tesla=1&teslaMode=1&rosieTeslaInternal=1","?tesla=1&teslaMode=1&layout=desktop","?tesla=1&teslaMode=1&layoutPreview=1"]) assert.equal(api.enabled(search,true),false);
  assert.equal(api.enabled("?tesla=1&teslaMode=1",false),false);
});
test("Controller diagnostics distinguish unavailable API, no device, unsupported and standard mappings",()=>{
  assert.match(api.controllerStatus({}),/does not expose/);
  assert.match(api.controllerStatus({getGamepads:()=>[null]}),/No controller/);
  assert.match(api.controllerStatus({getGamepads:()=>[{connected:true,mapping:""}]}),/not standard/);
  assert.match(api.controllerStatus({getGamepads:()=>[{connected:true,mapping:"standard"}]}),/Standard controller detected/);
  assert.match(api.controllerStatus({getGamepads:()=>{throw Error("blocked")}}),/unavailable/);
});
test("Bookmark launcher has direct fallback, explicit click links and no auto redirect",()=>{
 const h=read("../public/tesla.html");
 assert.match(h,/id="tesla-theater-link"/);
 assert.match(h,/id="tesla-browser-link" href="\/\?tesla=1&amp;teslaMode=1"/);
 assert.match(h,/Go to site/);
 assert.doesNotMatch(h,/http-equiv="refresh"/i);
 const index=read("../index.html");
 assert.match(index,/src="\/tesla-mode.js"/);
});
