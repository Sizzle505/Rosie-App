import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import register from "../api/auth/register.js";
import login from "../api/auth/login.js";
import { verifyPin } from "../api/_lib/core.js";

function mockResponse(status, data){return {ok:status >= 200 && status<300,status,text:async()=>data===undefined?"":JSON.stringify(data)};}
function invoke(handler, body) {
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(x){this.data=JSON.parse(x);}};
 return Promise.resolve(handler({method:"POST",headers:{host:"localhost",origin:"http://localhost"},body,socket:{remoteAddress:"127.0.0.1"}},res)).then(()=>res);
}
test("self-service accounts support four and six digit PINs and protect usernames", async()=>{
 process.env.SUPABASE_URL="https://unit-test.supabase.co";
 process.env.SUPABASE_SERVICE_ROLE_KEY="test-key-only";
 const accounts=[],sessions=[],requests=new Map(),oldFetch=globalThis.fetch;
 globalThis.fetch=async (url,options)=>{
   const u=new URL(url), p=u.pathname.replace("/rest/v1/",""), body=options.body?JSON.parse(options.body):{},method=options.method;
   if(p==="rpc/rosie_rate_limit"){
      const n=(requests.get(body.p_key)||0)+1;requests.set(body.p_key,n);return mockResponse(200,{blocked:n>30});
   }
   if(p==="rpc/rosie_pin_success") return mockResponse(200,true);
   if(p==="rosie_users"){
      if(method==="POST"){const row={id:randomUUID(),...body,is_active:true,failed_attempts:0,locked_until:null};accounts.push(row);return mockResponse(201,[row]);}
      let rows=accounts;
      const q=u.searchParams.get("username");
      if(q?.startsWith("eq."))rows=rows.filter(row=>row.username===q.slice(3));
      return mockResponse(200,rows.slice(0,Number(u.searchParams.get("limit")||999)));
   }
   if(p==="rosie_sessions"){
      if(method==="POST"){sessions.push(body);return mockResponse(201,[]);}
      return mockResponse(200,[]);
   }
   throw Error("unmocked "+p);
 };
 try{
   const four=await invoke(register,{username:"PoPpY",pin:"0412"});
   assert.equal(four.statusCode,201,JSON.stringify(four.data));
   assert.equal(four.data.user.username,"poppy");
   assert.equal(four.data.user.displayName,"PoPpY");
   assert.match(four.headers["set-cookie"],/HttpOnly/);
   assert.match(four.headers["set-cookie"],/Max-Age=2592000/);
   assert.equal(await verifyPin("0412",accounts[0].pin_hash),true);
   assert.equal(accounts[0].pin_length,4);
   assert.equal(sessions.length,1);
   const six=await invoke(register,{username:"WiLlOw",pin:"940123"});
   assert.equal(six.statusCode,201);
   assert.equal(accounts[1].pin_length,6);
   assert.equal(six.data.user.username,"willow");
   assert.equal(six.data.user.displayName,"WiLlOw");
   assert.equal(accounts[1].display_name,"WiLlOw");
   assert.equal(await verifyPin("940123",accounts[1].pin_hash),true);
   assert.equal((await invoke(register,{username:"willow",pin:"1111"})).statusCode,409);
   assert.equal((await invoke(register,{username:"bad name",pin:"1111"})).statusCode,400);
   assert.equal((await invoke(register,{username:"other",pin:"12345"})).statusCode,400);
   const relog=await invoke(login,{username:"POPPY",pin:"0412"});
   assert.equal(relog.statusCode,200);
   assert.equal(relog.data.user.displayName,"PoPpY");
 }finally{globalThis.fetch=oldFetch;delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;}
});
