// Real application + local PostgreSQL, with a small PostgREST-shaped HTTP adapter.
// Auth/session and activity are synthetic shims; this is not a live Supabase/PostgREST verification.
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";

const migration = "20261020000400_training_dashboard.sql";
const sql = readFileSync(`supabase/migrations/${migration}`, "utf8");
const preflight = readFileSync("supabase/checks/training-ready.sql", "utf8");
const messages = Object.fromEntries(["en","ar"].map((l) => [l,JSON.parse(readFileSync(`messages/${l}.json`,"utf8"))]));
const consent = readFileSync("src/features/pilot/consent.ts","utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js","utf8");
const server = await startServer("out",0), base = `http://127.0.0.1:${server.port}`;
const supa = "https://abcdefghijklmnop.supabase.co";
const uid = "00000000-0000-0000-0000-000000000001", owner = "00000000-0000-0000-0000-000000000002";
const browser = await chromium.launch({ executablePath:"/usr/bin/chromium",args:["--no-sandbox"] });
let checks=0,audits=0;
const held=[], contexts=[], databases=[];
const ok=(value,label)=>{assert.ok(value,label);checks++;};
mkdirSync("/tmp/pilot-schema",{recursive:true});

async function oldDatabase() {
 const db=new PGlite();databases.push(db);
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<migration).sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
 for(const id of [uid,owner])await db.query("insert into auth.users values($1,$2,now(),$3)",[id,`${id===owner?"owner":"student"}@example.test`,{consent_version:consent}]);
 await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id='${owner}';
 insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
 select user_id,1,'chest-pa-erect','default','v1','{}','{"total":80,"passed":true,"critical":[],"categories":[]}','en' from profiles;`);
 return db;
}
async function audit(page,label) {
 await page.evaluate(axe);
 const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
 assert.deepEqual(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);audits++;
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no horizontal overflow`);
}
async function setup(db,role,locale,width,path="account") {
 const actor=role==="owner"?owner:uid;
 const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});contexts.push(context);
 const b64=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
 const user={id:actor,aud:"authenticated",role:"authenticated",email:`${role}@example.test`,app_metadata:{},user_metadata:{},created_at:"2026-10-15T00:00:00Z"};
 const session={user,access_token:`${b64({alg:"HS256",typ:"JWT"})}.${b64({sub:actor,role:"authenticated",exp:4102444800})}.synthetic`,refresh_token:"synthetic",expires_at:4102444800,expires_in:3600,token_type:"bearer"};
 await context.addInitScript(s=>localStorage.setItem("sb-abcdefghijklmnop-auth-token",s),JSON.stringify(session));
 const calls=[],errors=[];
 await context.route("**/*",async route=>{
  const request=route.request(),url=new URL(request.url());if(url.origin===base)return route.continue();
  assert.equal(url.origin,supa,"no live provider access");
  const headers={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"};
  const respond=(body,status=200)=>route.fulfill({status,headers,contentType:"application/json",body:JSON.stringify(body)});
  if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
  if(url.pathname==="/auth/v1/user")return respond(user);
  if(url.pathname==="/auth/v1/logout")return route.fulfill({status:204,headers});
  if(["/rest/v1/events","/rest/v1/rpc/touch_last_seen"].includes(url.pathname))return route.fulfill({status:201,headers});
  const call={path:url.pathname,code:null};calls.push(call);
  try {
   const data=await db.transaction(async tx=>{
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);await tx.exec("set local role authenticated");
    if(url.pathname==="/rest/v1/profiles"){
     assert.equal(request.method(),"GET");assert.equal(url.searchParams.get("user_id"),`eq.${actor}`);
     assert.equal(url.searchParams.get("limit"),"1");
     const columns=url.searchParams.get("select").split(",");
     assert.ok(columns.every(c=>["status","role","participant_code","consent_version","display_name"].includes(c)));
     return (await tx.query(`select ${columns.join(",")} from public.profiles where user_id=$1 limit 1`,[actor])).rows;
    }
    assert.equal(url.pathname,"/rest/v1/rpc/training_page_v1");
    const p=request.postDataJSON();assert.equal(p.p_limit,20);assert.ok(role==="owner"||p.p_scope==="own");
    return (await tx.query("select public.training_page_v1($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) data",[p.p_view,p.p_scope,p.p_user,p.p_exam,p.p_search,p.p_status,p.p_days,p.p_cursor,p.p_boundary,p.p_limit])).rows[0].data;
   });
   return respond(data);
  }catch(error){
   if(!error.code)throw error;
   call.code=error.code;
   return respond({code:error.code,message:error.message},error.code==="42501"?403:400);
  }
 });
 const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
 await page.goto(`${base}/${locale}/${path}`,{waitUntil:"networkidle"});
 return {context,page,calls,errors,role,locale};
}
try {
 const db=await oldDatabase();
 await assert.rejects(db.exec(preflight),e=>e.code==="55000");await db.exec("rollback");checks++;
 for(const role of ["participant","owner"])for(const locale of ["en","ar"])for(const width of [390,1440]) {
  const s=await setup(db,role,locale,width),card=s.page.getByTestId("account-profile-error");
  await card.getByText(messages[locale].account.profileErrors.schema,{exact:true}).waitFor();
  ok(s.calls.some(c=>c.code==="42703"),"failure is emitted by PostgreSQL, not a fixed mock");
  ok(!s.calls.some(c=>c.path.endsWith("training_page_v1")),"schema failure never grants an approved session view");
  ok(await s.page.getByTestId("account-approved").count()===0,"no guessed approval");
  await card.getByRole("button",{name:messages[locale].account.retry,exact:true}).focus();await s.page.keyboard.press("Enter");
  await card.getByText(messages[locale].account.profileErrors.schema,{exact:true}).waitFor();
  await audit(s.page,`${role}-${locale}-${width}-old`);
  await s.page.screenshot({path:`/tmp/pilot-schema/${role}-${locale}-${width}-old.png`,fullPage:true});
  assert.deepEqual(s.errors,[]);
  if(locale==="ar"&&width===1440)held.push(s);else {
   await card.getByRole("button",{name:messages[locale].account.signOut,exact:true}).click();
   await s.page.getByRole("tab",{name:messages[locale].account.tabs.signIn,exact:true}).waitFor();checks++;await s.context.close();
  }
 }
 await db.exec(sql);await db.exec(preflight);checks++;
 for(const s of held) {
  await s.page.getByTestId("account-profile-error").getByRole("button",{name:messages[s.locale].account.retry,exact:true}).click();
  await s.page.getByTestId("account-approved").waitFor();await s.page.getByTestId("profile-name").waitFor();
  ok(await s.page.getByTestId("account-profile-error").count()===0,"same browser session recovers after migration");
  assert.deepEqual(s.errors,[]);await s.context.close();
 }
 for(const role of ["participant","owner"])for(const locale of ["en","ar"])for(const width of [390,1440]) {
  const s=await setup(db,role,locale,width);await s.page.getByTestId("account-approved").waitFor();
  await s.page.goto(`${base}/${locale}`,{waitUntil:"networkidle"});await s.page.getByTestId("training-summary").waitFor();
  assert.equal(await s.page.getByTestId("training-summary").locator("dd").first().innerText(),(role==="owner"?2:1).toLocaleString(locale));checks++;
  await audit(s.page,`${role}-${locale}-${width}-migrated`);assert.deepEqual(s.errors,[]);await s.context.close();
 }
 const partial=await oldDatabase();await partial.exec("alter table profiles add column display_name text");
 await assert.rejects(partial.exec(preflight),e=>e.code==="55000");await partial.exec("rollback");checks++;
 for(const role of ["participant","owner"])for(const locale of ["en","ar"])for(const width of [390,1440]) {
  const s=await setup(partial,role,locale,width,"training");
  await s.page.getByTestId("training-page").getByText(messages[locale].training.schema,{exact:true}).first().waitFor();
  ok(s.calls.some(c=>c.path.endsWith("training_page_v1")&&c.code==="42883"),"partial schema reports the actual missing function");
  ok(await s.page.getByTestId("training-summary").count()===0,"no invented summary");
  await audit(s.page,`${role}-${locale}-${width}-partial`);assert.deepEqual(s.errors,[]);await s.context.close();
 }
 console.log(JSON.stringify({checks,axeAudits:audits,postgres:"real local PostgreSQL/RLS",adapter:"PostgREST-shaped, synthetic Auth/activity",providerAccess:false,screenshots:"/tmp/pilot-schema"}));
}finally{await Promise.allSettled(contexts.map(c=>c.close()));await browser.close();for(const db of databases)await db.close();await new Promise(r=>server.server.close(r));}
