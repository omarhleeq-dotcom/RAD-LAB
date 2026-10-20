import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync('scripts/pilot/assess-e-closed-service-check.js','utf8');
const owner='00000000-0000-0000-0000-000000000001',participant='00000000-0000-0000-0000-000000000002';
const token='NEVER_PRINT_PRIVATE_TOKEN',key='sb_publishable_synthetic_public_key';
async function run(role,fault='',populated=false){
 const id=role==='owner'?owner:participant,other=role==='owner'?participant:owner;
 const prompts=[fault==='secret-key'?'sb_secret_reject':key,fault==='same-account'?id:other],logs=[],calls=[];
 await runInNewContext(source,{
  location:{protocol:'https:',hostname:'application.test'},AbortSignal,TextEncoder,Uint8Array,crypto:webcrypto,
  prompt:()=>prompts.shift(),console:{log:line=>logs.push(line)},
  localStorage:{getItem:name=>{assert.equal(name,'sb-vlacestfruxooznrcjqc-auth-token');return fault==='no-session'?null:JSON.stringify({access_token:token,user:{id}});}},
  fetch:async(input,init)=>{
   const u=new URL(input),h=init.headers,b=init.body?JSON.parse(init.body):null,signed=h.Authorization===`Bearer ${token}`;
   assert.equal(u.origin,'https://vlacestfruxooznrcjqc.supabase.co');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.equal(h.apikey,key);assert.ok(init.signal);
   calls.push({path:u.pathname,body:b,signed});
   if(fault==='network')throw new Error(token);
   if(fault==='expired')return Response.json({message:token},{status:401});
   if(u.pathname==='/auth/v1/user')return Response.json({id:fault==='identity'?other:id});
   if(u.pathname==='/rest/v1/profiles'){
    assert.equal(init.method,'GET');assert.equal(u.searchParams.get('limit'),'1');
    if(u.searchParams.get('user_id')===`eq.${id}`)return Response.json([{role,status:fault==='pending'?'pending':'approved'}]);
    assert.equal(role,'owner');return Response.json(fault==='missing-counterpart'?[]:[{user_id:other,role:'participant',status:'approved'}]);
   }
   const denied=()=>Response.json({code:fault==='false-denial'?'XX000':'42501',message:token},{status:403});
   if(fault==='schema')return Response.json({code:'PGRST106',message:token},{status:406});
   if(b){
    assert.equal(init.method,'POST');assert.equal(h['Content-Profile'],'assess');assert.equal(u.pathname,'/rest/v1/rpc/assigned_practical_page_v1');assert.deepEqual(b,{p_after:null,p_limit:1});
    if(fault==='missing-rpc')return Response.json({code:'PGRST202',message:token},{status:404});
    if(!signed){if(fault==='anonymous-leak')return Response.json({rows:[],next:null});return fault==='anonymous-401'?Response.json({message:token},{status:401}):denied();}
    if(fault==='signed-401')return Response.json({message:token},{status:401});
    const row={id:'10000000-0000-0000-0000-000000000001',name:'PRIVATE_NAME',version:'1'};
    if(fault==='row-key-leak')row.correctOptionId=token;
    if(fault==='bad-row')row.version='';
    return Response.json({rows:fault==='excess-page'?[row,row]:populated?[row]:[],next:fault==='bad-cursor'?other:null,...(fault==='page-key-leak'?{privateItems:token}:{})});
   }
   assert.equal(init.method,'GET');assert.equal(h['Accept-Profile'],'assess');assert.equal(u.pathname,'/rest/v1/practical_presentations');assert.equal(u.searchParams.get('limit'),'1');assert.equal(u.searchParams.get('select'),'version_id');
   if((signed&&fault==='table-leak')||(!signed&&fault==='anonymous-table-leak'))return Response.json([]);
   if(signed&&fault==='table-401')return Response.json({message:token},{status:401});
   if(!signed&&fault==='anonymous-401')return Response.json({message:token},{status:401});
   return fault==='hidden-table'?Response.json({code:'PGRST205',message:token},{status:404}):denied();
  }
 });
 assert.equal(logs.length,1);assert.ok(logs[0].startsWith('RADLAB_ASSESS_E_CLOSED_CHECK '));
 for(const v of [token,key,owner,participant,'PRIVATE_NAME','10000000-0000-0000-0000-000000000001'])assert.ok(!logs[0].includes(v));
 return {result:JSON.parse(logs[0].slice('RADLAB_ASSESS_E_CLOSED_CHECK '.length)),calls};
}
test('E closed check verifies both roles and matching pair using only E list and presentation denial probes',async()=>{
 const a=await run('owner','',true),b=await run('participant','hidden-table',true);
 for(const r of [a,b]){assert.equal(r.result.outcome,'PASS');assert.equal(r.result.contract,'assess-e-closed-service/1');assert.equal(r.result.runtimeOrLaunchVerified,false);assert.equal(r.calls.filter(c=>c.body).length,2);assert.ok(r.result.checks.includes('direct_practical_presentations_denied'));assert.ok(r.result.checks.includes('anonymous_practical_presentations_denied'));}
 assert.equal(a.result.pair,b.result.pair);assert.equal(a.result.role,'owner');assert.equal(b.result.role,'participant');
});
test('E empty assignments need no content or attempt writes',async()=>assert.equal((await run('owner')).result.outcome,'PASS'));
test('E anonymous 401 is valid only after signed-in probes succeed',async()=>assert.equal((await run('participant','anonymous-401')).result.outcome,'PASS'));
for(const fault of ['no-session','secret-key','same-account','network','expired','identity','pending','missing-counterpart','schema','missing-rpc','anonymous-leak','signed-401','table-leak','anonymous-table-leak','table-401','excess-page','bad-cursor','row-key-leak','page-key-leak','false-denial','bad-row'])test(`E closed check stops without private output: ${fault}`,async()=>{const {result}=await run('owner',fault,true);assert.equal(result.outcome,'STOP');assert.equal(result.pair,undefined);});
