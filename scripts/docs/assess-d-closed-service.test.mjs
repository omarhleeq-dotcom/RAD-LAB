import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const source=readFileSync('scripts/pilot/assess-d-closed-service-check.js','utf8');
const owner='00000000-0000-0000-0000-000000000001', participant='00000000-0000-0000-0000-000000000002';
const token='NEVER_PRINT_PRIVATE_TOKEN', key='sb_publishable_synthetic_public_key';
async function run(role, fault='', populated=false) {
  const id=role==='owner'?owner:participant, other=role==='owner'?participant:owner;
  const prompts=[fault==='secret-key'?'sb_secret_reject':key,fault==='same-account'?id:other];
  const logs=[],calls=[];
  await runInNewContext(source,{
    location:{protocol:'https:',hostname:'application.test'}, URL,AbortSignal,TextEncoder,Uint8Array,crypto:webcrypto,
    prompt:()=>prompts.shift(),console:{log:line=>logs.push(line)},
    localStorage:{getItem:name=>{
      assert.equal(name,'sb-vlacestfruxooznrcjqc-auth-token');
      return fault==='no-session'?null:JSON.stringify({access_token:token,user:{id}});
    }},
    fetch:async(input,init)=>{
      const u=new URL(input),h=init.headers,b=init.body?JSON.parse(init.body):null;
      const signed=h.Authorization===`Bearer ${token}`;
      assert.equal(u.origin,'https://vlacestfruxooznrcjqc.supabase.co');
      assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');
      assert.equal(h.apikey,key);assert.ok(init.signal);
      calls.push({path:u.pathname,body:b,signed});
      if(fault==='network')throw new Error(token);
      if(fault==='expired')return Response.json({message:token},{status:401});
      if(u.pathname==='/auth/v1/user')return Response.json({id:fault==='identity'?other:id});
      if(u.pathname==='/rest/v1/profiles'){
        assert.equal(init.method,'GET');assert.equal(u.searchParams.get('limit'),'1');
        if(u.searchParams.get('user_id')===`eq.${id}`)return Response.json([{role,status:fault==='pending'?'pending':'approved'}]);
        return Response.json(fault==='missing-counterpart'?[]:[{user_id:other,role:'participant',status:'approved'}]);
      }
      const denied=()=>Response.json({code:fault==='false-denial'?'XX000':'42501',message:token},{status:403});
      if(fault==='schema')return Response.json({code:'PGRST106',message:token},{status:406});
      if(fault==='missing-rpc'&&b)return Response.json({code:'PGRST202',message:token},{status:404});
      if(b){
        assert.equal(init.method,'POST');assert.equal(h['Content-Profile'],'assess');
        const fn=u.pathname.split('/').at(-1);
        assert.ok(['assigned_page_v1','content_page_v1','content_read_v1','health_v1'].includes(fn));
        if(fn==='content_read_v1'){
          assert.deepEqual(b,{p_version:'00000000-0000-0000-0000-000000000000'});
          return fault==='private-leak'?Response.json({document:token}):denied();
        }
        if(fn==='health_v1'){assert.deepEqual(b,{});return fault==='worker-leak'?Response.json({count:0}):denied();}
        assert.deepEqual(b,{p_after:null,p_limit:1});
        if(!signed){
          if(fault==='anonymous-leak')return Response.json({rows:[],next:null});
          return fault==='anonymous-401'?Response.json({message:token},{status:401}):denied();
        }
        if(fault==='signed-401')return Response.json({message:token},{status:401});
        if(fn==='content_page_v1'&&role==='participant'&&fault!=='owner-leak')return denied();
        const row={id:'10000000-0000-0000-0000-000000000001',name:'PRIVATE_NAME',version:'1',...(fn==='content_page_v1'?{state:'pending'}:{})};
        if(fault==='row-key-leak')row.correctOptionId=token;
        const rows=fault==='excess-page'?[row,row]:populated?[row]:[];
        return Response.json({rows,next:fault==='bad-cursor'?other:null,...(fault==='page-key-leak'?{privateItems:token}:{})});
      }
      assert.equal(init.method,'GET');assert.equal(h['Accept-Profile'],'assess');assert.equal(u.searchParams.get('limit'),'1');
      const columns={launch_gate:'singleton',publications:'version_id',reservations:'assignment_id',sessions:'id',session_details:'session_id',receipts:'session_id',results:'session_id',content_submissions:'version_id'};
      assert.equal(u.searchParams.get('select'),columns[u.pathname.split('/').at(-1)]);
      if(fault==='table-leak')return Response.json([]);
      if(fault==='table-401')return Response.json({message:token},{status:401});
      return fault==='hidden-table'?Response.json({code:'PGRST205',message:token},{status:404}):denied();
    }
  });
  assert.equal(logs.length,1);
  for(const privateValue of [token,key,owner,participant,'PRIVATE_NAME','10000000-0000-0000-0000-000000000001'])assert.ok(!logs[0].includes(privateValue));
  assert.ok(logs[0].startsWith('RADLAB_ASSESS_D_CLOSED_CHECK '));
  return {result:JSON.parse(logs[0].slice('RADLAB_ASSESS_D_CLOSED_CHECK '.length)),calls};
}
test('D closed check verifies both roles with bounded read-only requests and matching account pair',async()=>{
  const a=await run('owner','',true),b=await run('participant','hidden-table',true);
  assert.equal(a.result.outcome,'PASS');assert.equal(b.result.outcome,'PASS');assert.equal(a.result.pair,b.result.pair);
  assert.equal(a.result.contract,'assess-d-closed-service/1');assert.equal(a.result.runtimeOrLaunchVerified,false);
  assert.equal(a.result.role,'owner');assert.equal(b.result.role,'participant');
  assert.equal(a.calls.filter(c=>c.path.includes('/rpc/')).length,6);
  assert.equal(b.calls.filter(c=>c.path.includes('/rpc/')).length,6);
  assert.ok(b.result.checks.includes('private_document_denied'));
  assert.ok(b.result.checks.includes('worker_health_denied'));
});
test('empty content and assignments require no fixtures or writes',async()=>assert.equal((await run('owner')).result.outcome,'PASS'));
test('anonymous 401 is acceptable after valid signed-in checks',async()=>assert.equal((await run('participant','anonymous-401')).result.outcome,'PASS'));
for(const fault of ['no-session','secret-key','same-account','network','expired','identity','pending','missing-counterpart','schema','missing-rpc','private-leak','worker-leak','anonymous-leak','signed-401','table-leak','table-401','excess-page','bad-cursor','row-key-leak','page-key-leak']){
  test(`D closed check stops without private output: ${fault}`,async()=>{
    const {result}=await run('owner',fault,true);assert.equal(result.outcome,'STOP');assert.equal(result.pair,undefined);
  });
}
for(const fault of ['false-denial','owner-leak'])test(`participant privilege fault: ${fault}`,async()=>assert.equal((await run('participant',fault)).result.outcome,'STOP'));
