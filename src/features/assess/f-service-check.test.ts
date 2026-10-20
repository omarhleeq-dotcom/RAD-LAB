import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {webcrypto} from "node:crypto";
import {expect,it} from "vitest";
const source=readFileSync("scripts/pilot/assess-f-closed-service-check.js","utf8");
const owner="00000000-0000-0000-0000-000000000001",participant="00000000-0000-0000-0000-000000000002",cursor="00000000-0000-0000-0000-000000000099";
const token="private-session-never-print",key="sb_publishable_synthetic_public_key";
type Fault="network"|"expired"|"wrong-auth"|"pending"|"missing-target"|"schema"|"missing-rpc"|"anonymous-leak"|"table-leak"|"false-denial"|"signed-table-401"|"excess-page"|"bad-page"|"row-identity"|"hidden-grade-leak"|"invalid-grade"|"consent-shape";
async function run(role:"owner"|"participant",o:{fault?:Fault;populated?:boolean;shown?:boolean;accepted?:boolean;anonymous401?:boolean;hiddenTable?:boolean;noSession?:boolean;key?:string;other?:string|null}={}){
 const id=role==="owner"?owner:participant,other=role==="owner"?participant:owner;
 const prompts=[o.key??key,o.other===undefined?other:o.other],out:string[]=[],calls:{path:string;body:Record<string,unknown>|null;signed:boolean}[]=[];
 await runInNewContext(source,{
  location:{protocol:"https:",hostname:"signed-in-application.test"},URL,AbortSignal,TextEncoder,Uint8Array,crypto:webcrypto,
  localStorage:{getItem:(name:string)=>{expect(name).toBe("sb-vlacestfruxooznrcjqc-auth-token");return o.noSession?null:JSON.stringify({access_token:token,user:{id}});}},
  prompt:()=>prompts.shift(),console:{log:(s:string)=>out.push(s)},
  fetch:async(input:string,init:RequestInit)=>{
   const u=new URL(input),h=init.headers as Record<string,string>,body=init.body?JSON.parse(String(init.body)):null,signed=h.Authorization===`Bearer ${token}`;
   expect(u.origin).toBe("https://vlacestfruxooznrcjqc.supabase.co");expect(init).toMatchObject({credentials:"omit",redirect:"error",cache:"no-store"});expect(h.apikey).toBe(key);calls.push({path:u.pathname,body,signed});
   if(body){expect(init.method).toBe("POST");expect(h["Content-Profile"]).toBe("assess");expect(["/rest/v1/rpc/history_page_v1","/rest/v1/rpc/consent_v1"]).toContain(u.pathname);
    if(u.pathname.endsWith("consent_v1"))expect(body).toEqual({p_version:null});else expect(body).toEqual({p_after:null,p_limit:1});
   }else{expect(init.method).toBe("GET");if(u.pathname.startsWith("/rest/v1/"))expect(u.searchParams.get("limit")).toBe("1");}
   if(o.fault==="network")throw new Error(token);
   if(o.fault==="expired")return Response.json({message:token},{status:401});
   if(u.pathname==="/auth/v1/user")return Response.json({id:o.fault==="wrong-auth"?other:id});
   if(u.pathname==="/rest/v1/profiles")return Response.json(u.searchParams.get("user_id")===`eq.${id}`?[{role,status:o.fault==="pending"?"pending":"approved"}]:o.fault==="missing-target"?[]:[{user_id:other,role:"participant",status:"approved"}]);
   if(o.fault==="schema")return Response.json({code:"PGRST106",message:token},{status:406});
   if(o.fault==="missing-rpc")return Response.json({code:"PGRST202",message:token},{status:404});
   const deny=()=>Response.json({code:o.fault==="false-denial"?"XX000":"42501",message:token},{status:403});
   if(!signed){if(o.anonymous401)return Response.json({message:token},{status:401});return o.fault==="anonymous-leak"?Response.json({rows:[],next:null}):deny();}
   if(u.pathname.endsWith("history_page_v1")){
    const row={name:"private-name",track:"mixed",submittedAt:"2026-10-20T00:00:00.000Z",grade:o.shown?{visibility:"shown",earned:"1.25",maximum:"10.00"}:{visibility:"hidden"}};
    if(o.fault==="bad-page")return Response.json({rows:[],next:null,answers:token});
    if(o.fault==="row-identity")return Response.json({rows:[{...row,id:cursor}],next:null});
    if(o.fault==="hidden-grade-leak")return Response.json({rows:[{...row,grade:{visibility:"hidden",earned:"10.00"}}],next:null});
    if(o.fault==="invalid-grade")return Response.json({rows:[{...row,grade:{visibility:"shown",earned:"11.00",maximum:"10.00"}}],next:null});
    return Response.json({rows:o.fault==="excess-page"?[row,row]:o.populated?[row]:[],next:o.populated?cursor:null});
   }
   if(u.pathname.endsWith("consent_v1"))return Response.json(o.fault==="consent-shape"?{accepted:false,user_id:participant}:{accepted:o.accepted??false});
   expect(h["Accept-Profile"]).toBe("assess");expect(["/rest/v1/consents","/rest/v1/results"]).toContain(u.pathname);
   if(o.fault==="signed-table-401")return Response.json({message:token},{status:401});
   if(o.fault==="table-leak")return Response.json([]);
   if(o.hiddenTable)return Response.json({code:"PGRST205",message:token},{status:404});
   return deny();
  }
 });
 expect(out).toHaveLength(1);expect(out[0]).toMatch(/^RADLAB_ASSESS_F_CLOSED_CHECK /);
 for(const v of [token,key,owner,participant,cursor,"private-name","1.25","10.00"])expect(out[0]).not.toContain(v);
 return {result:JSON.parse(out[0]!.replace("RADLAB_ASSESS_F_CLOSED_CHECK ","")),calls};
}
it("verifies both approved roles, read-only consent status and four-field history without writes or private output",async()=>{
 const a=await run("owner",{populated:true,shown:true,accepted:true}),b=await run("participant",{populated:true,anonymous401:true,hiddenTable:true});
 expect(a.result).toMatchObject({contract:"assess-f-closed-service/1",outcome:"PASS",role:"owner",runtimeOrLaunchVerified:false});
 expect(b.result).toMatchObject({outcome:"PASS",role:"participant",pair:a.result.pair,runtimeOrLaunchVerified:false});expect(a.result.pair).toMatch(/^[a-f0-9]{64}$/);
 expect(a.result.checks).toEqual(expect.arrayContaining(["history_page","consent_status","anonymous_history_denied","anonymous_consent_status_denied","direct_consents_denied","direct_results_denied"]));
 expect(a.calls.filter(c=>c.body)).toHaveLength(4);expect(a.calls.filter(c=>c.path.endsWith("consent_v1")).every(c=>c.body?.p_version===null)).toBe(true);
 expect(source).not.toContain("PILOT_SCHEMA_VERIFIED");
});
it("accepts an empty history and no Assess consent without creating a result or recording consent",async()=>{expect((await run("participant")).result.outcome).toBe("PASS");});
it.each(["network","expired","wrong-auth","pending","missing-target","schema","missing-rpc","anonymous-leak","table-leak","false-denial","signed-table-401","excess-page","bad-page","row-identity","hidden-grade-leak","invalid-grade","consent-shape"] as const)("fails closed with sanitized output for %s",async fault=>{
 const r=await run("owner",{fault});expect(r.result.outcome).toBe("STOP");expect(r.result).not.toHaveProperty("pair");
});
it.each([{key:"sb_secret_never_send"},{other:participant},{other:"bad-id"},{other:null},{noSession:true}])("rejects invalid setup before any network %s",async options=>{
 const r=await run("participant",options);expect(r.result.outcome).toBe("STOP");expect(r.calls).toHaveLength(0);
});
