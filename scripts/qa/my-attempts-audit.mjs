// Revised RAD-058 interaction contract: local browser + synthetic Supabase only; never a hosted preview.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const messages = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const disabled = process.env.ATTEMPTS_DISABLED === "1";
const server = process.env.ATTEMPTS_BASE ? null : await startServer("out", 0);
const base = process.env.ATTEMPTS_BASE ?? `http://127.0.0.1:${server.port}`;
assert.equal(new URL(base).hostname, "127.0.0.1");
const supa = "https://abcdefghijklmnop.supabase.co";
const uid = "00000000-0000-0000-0000-000000000001", other = "00000000-0000-0000-0000-000000000002";
const user = { id: uid, aud: "authenticated", role: "authenticated", email: "synthetic@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const sessionFor = (id) => ({ access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user: { ...user, id } });
const boundary = "2026-10-17T22:00:00.123456+00:00";
const row = (i) => ({ id: `10000000-0000-0000-0000-${String(i).padStart(12,"0")}`, exam: "chest-pa-erect", case: "default", definition: "v1", engine: "v1", producer: "v1", format: 1, time: `2026-10-${String(17-i).padStart(2,"0")}T10:00:00.123456+00:00`, result: { total: 80-i*3, passed: i<3, critical: i<3 ? [] : ["rotation"], categories: [{ c: "positioning", earned: 20-i, weight: 28 }] } });
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
let checks=0, audits=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
mkdirSync("/tmp/my-attempts",{recursive:true});
async function audit(page,label){
 await page.evaluate(axe);
 const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
 assert.deepEqual(r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no overflow`);audits++;
}
async function setup(locale,width,scenario="ready",role="participant",path="training"){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390});
 const calls=[],errors=[]; let fail=scenario==="error", activeId=uid, name=scenario==="unnamed"?null:scenario==="long"?"س".repeat(100):"أحمد Ahmad", release;
 const delayed=new Promise(r=>{release=r;});
 if(scenario!=="visitor") await context.addInitScript(s=>localStorage.setItem("sb-abcdefghijklmnop-auth-token",s),JSON.stringify(sessionFor(uid)));
 await context.route("**/*",async route=>{
  const req=route.request(),url=new URL(req.url()); if(url.origin===base)return route.continue();
  ok(url.origin===supa,`unexpected external origin ${url.origin}`);
  const headers={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"};
  const json=(body,status=200)=>route.fulfill({status,headers,contentType:"application/json",body:JSON.stringify(body)});
  if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
  if(url.pathname==="/auth/v1/user")return json({...user,id:activeId});
  if(url.pathname==="/auth/v1/logout")return route.fulfill({status:204,headers});
  if(url.pathname==="/auth/v1/signup") {const body=req.postDataJSON();ok(body.data.display_name==="اسم جديد","signup name metadata");return json({user,session:null});}
  if(url.pathname==="/rest/v1/profiles"){
   if(req.method()==="PATCH") { const body=req.postDataJSON();ok(Object.keys(body).join()==="display_name","name-only update");ok(url.searchParams.get("user_id")===`eq.${activeId}`,"own profile update");name=body.display_name;return json({display_name:name}); }
   return json({status:["pending","suspended"].includes(scenario)?scenario:"approved",role,participant_code:"P-synthetic",consent_version:consent,display_name:name});
  }
  if(["/rest/v1/events","/rest/v1/rpc/touch_last_seen"].includes(url.pathname))return route.fulfill({status:201,headers});
  if(url.pathname==="/rest/v1/rpc/training_page_v1"){
   const p=req.postDataJSON();calls.push(p);
   ok(p.p_limit===20,"server page bound");ok(role==="owner"||p.p_scope==="own","student scope");
   ok(p.p_scope!=="own"||p.p_user===activeId,"own identity in query");
   if(scenario==="delay")await delayed;
   if(scenario==="expired")return json({message:"expired"},401);
   if(scenario==="denied")return json({code:"42501",message:"denied"},403);
   if(fail)return json({message:"synthetic error"},500);
   let rows=[],next=null,summary=null;
   const empty=scenario==="empty";
   if(p.p_view==="summary")summary={attempts:empty?0:p.p_scope==="all"?48:24,exams:empty?0:2,latest:empty?null:boundary,trainees:p.p_scope==="all"&&!p.p_user?2:null};
   if(p.p_view==="exams"&&!empty){ rows=[{exam:p.p_cursor?"archived-exam":"chest-pa-erect",attempts:24,latest:boundary}];next=p.p_cursor?null:{exam:"chest-pa-erect"}; }
   if(p.p_view==="people"&&!empty){rows=[{id:other,name:scenario==="long"?"س".repeat(100):"Trainee سلمى",email:"salma@example.test",status:"approved",attempts:24,exams:2,latest:boundary}];next=p.p_cursor?null:{id:other};if(p.p_search&&!"Trainee سلمى salma@example.test".toLowerCase().includes(p.p_search.toLowerCase()))rows=[];}
   if(p.p_view==="history"&&!empty){rows=p.p_cursor?[row(4)]:[row(1),row(2),{...row(3),case:"different"}];next=p.p_cursor?null:{id:row(3).id,time:row(3).time};if(scenario==="unsupported")rows=[{...row(1),format:2}];}
   return json({version:1,boundary,rows,next,summary});
  }
  assert.fail(`unexpected ${req.method()} ${url.pathname}`);
 });
 const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
 await page.goto(`${base}/${locale}${path ? `/${path}` : ""}`,{waitUntil:scenario==="delay"?"domcontentloaded":"networkidle"});
 return {context,page,calls,errors,release,recover:()=>{fail=false;},switchUser:async()=>{
  const tab=await context.newPage();await tab.goto(`${base}/${locale}/terms`,{waitUntil:"networkidle"});activeId=other;
  await tab.evaluate(s=>{const key="sb-abcdefghijklmnop-auth-token";localStorage.setItem(key,JSON.stringify(s));const c=new BroadcastChannel(key);c.postMessage({event:"SIGNED_IN",session:s});c.close();},sessionFor(other));await tab.close();
 }};
}
try{
 for(const locale of ["en","ar"])for(const width of [390,1440]){
  const m=messages[locale].training,label=`${locale}-${width}`;
  if(disabled){const s=await setup(locale,width,"visitor");await s.page.getByTestId("training-off").waitFor();ok(!s.calls.length,"pilot off: no reads");await audit(s.page,label+"-off");await s.context.close();continue;}
  const s=await setup(locale,width);
  await s.page.getByTestId("training-summary").waitFor();await audit(s.page,label+"-student");
  await s.page.screenshot({path:`/tmp/my-attempts/${label}.png`,fullPage:true});
  ok(s.calls.some(p=>p.p_view==="summary")&&s.calls.some(p=>p.p_view==="exams"),"summary + grouped exams");
  await s.page.getByTestId("training-exams").getByRole("button").filter({hasText:locale==="ar"?"الصدر":"Chest"}).first().click();
  await s.page.getByTestId("training-chart").waitFor();ok(await s.page.getByTestId("training-attempt").count()===3,"compact rows");
  await s.page.getByText(m.chartValues,{exact:true}).click();
  ok(await s.page.getByTestId("training-chart").locator("ol li").count()===2,"incompatible case excluded from chart");
  await s.page.getByTestId("training-attempt").first().locator("summary").focus();await s.page.keyboard.press("Enter");
  ok(!(await s.page.locator("main").textContent()).includes("10000000-"),"technical IDs hidden");await audit(s.page,label+"-details");
  await s.page.screenshot({path:`/tmp/my-attempts/${label}-details.png`,fullPage:true});
  await s.page.getByRole("button",{name:m.next,exact:true}).click();await s.page.getByTestId("training-attempt").first().waitFor();
  ok(s.calls.some(p=>p.p_view==="history"&&p.p_cursor?.time===row(3).time&&p.p_boundary===boundary),"precise cursor + boundary");
  await s.page.getByRole("button",{name:m.backExams,exact:true}).click();
  await s.page.getByRole("button",{name:m.next,exact:true}).click();await s.page.getByRole("button",{name:m.archivedExam,exact:true}).waitFor();
  await s.switchUser();await s.page.waitForTimeout(300);ok(s.calls.some(p=>p.p_user===other),"account switch resets scoped reads");
  assert.deepEqual(s.errors,[]);await s.context.close();
  const o=await setup(locale,width,"ready","owner");await o.page.getByRole("button",{name:"Trainee سلمى",exact:true}).waitFor();
  ok(o.calls.some(p=>p.p_view==="people"&&p.p_scope==="all"&&!p.p_user),"owner defaults to all");
  await o.page.getByRole("searchbox").fill("salma");await o.page.getByRole("button",{name:m.apply,exact:true}).click();
  await o.page.getByRole("button",{name:"Trainee سلمى",exact:true}).click();await o.page.getByTestId("training-summary").waitFor();
  ok(o.calls.some(p=>p.p_scope==="all"&&p.p_user===other),"owner selected trainee server scope");await audit(o.page,label+"-owner-person");
  await o.page.getByRole("button",{name:m.backPeople,exact:true}).click();ok(await o.page.getByRole("searchbox").inputValue()==="salma","search retained");await audit(o.page,label+"-owner-list");
  await o.page.screenshot({path:`/tmp/my-attempts/${label}-owner.png`,fullPage:true});
  await o.page.getByRole("button",{name:m.mine,exact:true}).click();await o.page.getByTestId("training-summary").waitFor();ok(o.calls.some(p=>p.p_scope==="own"&&p.p_user===uid),"owner own separate");await o.context.close();
  const a=await setup(locale,width,"unnamed","participant","account");await a.page.getByTestId("profile-name").waitFor();await a.page.locator('input[name="displayName"]').fill("اسم جديد");await a.page.getByRole("button",{name:m.save,exact:true}).click();await a.page.getByText(m.saved,{exact:true}).waitFor();await audit(a.page,label+"-name");await a.page.goto(`${base}/${locale}`,{waitUntil:"networkidle"});await a.page.getByTestId("training-summary").waitFor();ok((await a.page.getByTestId("home-training").textContent()).includes("اسم جديد"),"saved name welcome");await audit(a.page,label+"-home");await a.context.close();
  for(const scenario of ["empty","error","expired","denied","delay"]){
   const r=await setup(locale,width,scenario);
   if(scenario==="delay"){await r.page.getByRole("status").first().waitFor();await audit(r.page,label+"-loading");r.release();await r.page.getByTestId("training-summary").waitFor();}
   else if(scenario==="empty"){await r.page.getByText(m.empty,{exact:true}).waitFor();await audit(r.page,label+"-empty");}
   else {await r.page.getByRole("alert").first().waitFor();await audit(r.page,label+"-"+scenario);if(scenario==="error"){r.recover();await r.page.getByRole("button",{name:m.retry,exact:true}).first().click();await r.page.getByTestId("training-summary").waitFor();}if(scenario==="expired"){await r.page.getByRole("button",{name:m.signIn,exact:true}).first().click();await r.page.waitForURL(/account/);}}
   assert.deepEqual(r.errors,[]);await r.context.close();
  }
  for(const status of ["pending","suspended"]){const gated=await setup(locale,width,status);await gated.page.getByTestId(`account-${status}`).waitFor();ok(gated.calls.length===0,`${status}: no training reads`);await gated.context.close();}
  const unsupported=await setup(locale,width,"unsupported");await unsupported.page.getByTestId("training-exams").getByRole("button").filter({hasText:locale==="ar"?"الصدر":"Chest"}).first().click();await unsupported.page.getByTestId("training-history").getByRole("alert").waitFor();ok(await unsupported.page.getByTestId("training-attempt").count()===0,"unknown format fails visibly");await unsupported.context.close();
  const unnamed=await setup(locale,width,"unnamed","participant","");await unnamed.page.getByText(m.completeName,{exact:false}).waitFor();await unnamed.context.close();
  const long=await setup(locale,width,"long","owner");await long.page.getByRole("button",{name:"س".repeat(100),exact:true}).waitFor();await audit(long.page,label+"-long-name");await long.page.goto(`${base}/${locale}`,{waitUntil:"networkidle"});await long.page.getByTestId("training-summary").waitFor();await audit(long.page,label+"-long-welcome");await long.context.close();
  const v=await setup(locale,width,"visitor","participant","account");await v.page.getByRole("tab",{name:messages[locale].account.tabs.signUp}).click();
  ok(await v.page.getByRole("button",{name:messages[locale].account.submit.signUp,exact:true}).isDisabled(),"signup requires name and credentials");
  await v.page.locator('input[name="displayName"]').fill("اسم جديد");await v.page.locator('input[type="email"]').fill("synthetic@example.test");await v.page.locator('input[type="password"]').nth(0).fill("Synthetic-Strong-123");await v.page.locator('input[type="password"]').nth(1).fill("Synthetic-Strong-123");await v.page.getByTestId("agree-terms").check();await audit(v.page,label+"-signup");await v.page.getByRole("button",{name:messages[locale].account.submit.signUp,exact:true}).click();await v.page.getByTestId("account-check-email").waitFor();await v.context.close();
 }
 console.log(JSON.stringify({checks,axeAudits:audits,disabled,screenshots:"/tmp/my-attempts",provider:"synthetic intercepted only"}));
}finally{await browser.close();if(server)await new Promise(r=>server.server.close(r));}
