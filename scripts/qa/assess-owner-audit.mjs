// Local static build + synthetic auth/API only. No hosted previews or live identities.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { startServer } from "../preview/serve-out.mjs";
const require=createRequire(process.env.ASSESS_BROWSER_MANIFEST??new URL("../../package.json",import.meta.url));
const {chromium}=require("playwright");
const axe=readFileSync(require.resolve("axe-core/axe.min.js"),"utf8");
const messages=Object.fromEntries(["en","ar"].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,"utf8"))]));
const consent=readFileSync("src/features/pilot/consent.ts","utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const supa="https://abcdefghijklmnop.supabase.co";
const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
const user={id:id(1),aud:"authenticated",role:"authenticated",email:"owner@example.test"};
const session={access_token:`${b64({alg:"HS256",typ:"JWT"})}.${b64({sub:user.id,role:"authenticated",aud:"authenticated",exp:4102444800})}.sig`,refresh_token:"synthetic",token_type:"bearer",expires_in:3600,expires_at:4102444800,user};
const {server,port}=await startServer("out",0);
const base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??"/usr/bin/chromium",args:["--no-sandbox"]});
let audits=0,checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
async function audit(page,label) {
  await page.evaluate(axe);
  const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
  assert.deepEqual(r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no overflow`);audits++;
}
async function setup(locale,width,role="owner",scenario="ready") {
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});
  await ctx.addInitScript(s=>localStorage.setItem("sb-abcdefghijklmnop-auth-token",s),JSON.stringify(session));
  const calls=[],errors=[],members=new Set([id(3)]),targets=new Set([id(3)]);
  let groupName="Group A",assigned=false,revision=1,fail=scenario==="schema";
  const people=[{id:id(3),name:"Student سارة",email:"student@example.test",status:"approved"},{id:id(4),name:"م".repeat(100),email:"long@example.test",status:"pending"}];
  await ctx.route("**/*",async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();
    ok(url.origin===supa,`unexpected external request: ${url.origin}`);
    const headers={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"};
    const json=(data,status=200)=>route.fulfill({status,headers,contentType:"application/json",body:JSON.stringify(data)});
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(url.pathname==="/auth/v1/user")return json(user);
    if(url.pathname==="/rest/v1/profiles")return json({role,status:"approved",participant_code:"P-synthetic",consent_version:consent,display_name:"Owner"});
    if(["/rest/v1/events","/rest/v1/rpc/touch_last_seen"].includes(url.pathname))return route.fulfill({status:201,headers});
    if(url.pathname==="/rest/v1/rpc/owner_page_v1" && req.headers()["content-profile"]!=="assess")return json({version:1,boundary:"2026-10-19T12:00:00.000Z",total:0,pending:0,rows:[],next:null});
    ok(req.headers()["content-profile"]==="assess","explicit Assess schema");
    const p=req.postDataJSON(),fn=url.pathname.split("/").at(-1);calls.push({fn,p});
    if(fail)return json({code:"PGRST106",message:"private implementation"},406);
    if(fn==="content_page_v1")return json({rows:[],next:null});
    if(fn==="owner_page_v1") {
      ok(p.p_limit===20,"bounded page");let rows=[],next=null;
      if(p.p_kind==="groups"&&groupName)rows=[{id:id(10),name:groupName}];
      if(p.p_kind==="people") {rows=p.p_after?[people[1]]:[people[0]];next=p.p_after?null:id(3);if(p.p_search) {rows=people.filter(x=>(x.name+" "+x.email).toLowerCase().includes(p.p_search.toLowerCase()));next=null;}}
      if(p.p_kind==="members")rows=people.filter(x=>members.has(x.id));
      if(p.p_kind==="versions")rows=[{id:id(20),name:"Synthetic assessment",track:"mixed",version:"v1"}];
      if(p.p_kind==="assignments"&&assigned)rows=[{id:id(30),name:"Synthetic assessment",track:"mixed",version:"v1",revision}];
      if(p.p_kind==="targets")rows=people.filter(x=>targets.has(x.id));
      return json({version:1,rows,next});
    }
    if(fn==="group_write_v1") {groupName=p.p_delete?null:p.p_name;return json(id(10));}
    if(fn==="members_write_v1") {p.p_users.forEach(u=>p.p_add?members.add(u):members.delete(u));return json(null);}
    if(fn==="assign_v1") {assigned=true;targets.clear();p.p_users.forEach(u=>targets.add(u));if(p.p_groups.length)members.forEach(u=>targets.add(u));return json(id(30));}
    if(fn==="targets_write_v1") {if(p.p_revision!==revision)return json({code:"40001"},400);p.p_users.forEach(u=>p.p_add?targets.add(u):targets.delete(u));return json(++revision);}
    assert.fail(`unexpected ${fn}`);
  });
  const page=await ctx.newPage();page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
  await page.goto(`${base}/${locale}/owner`,{waitUntil:"networkidle"});
  return {ctx,page,calls,errors,recover:()=>{fail=false;}};
}
try {
  for(const locale of ["en","ar"])for(const width of [390,1440]) {
    const m=messages[locale].assessAdmin,label=`${locale}-${width}`,s=await setup(locale,width);
    await s.page.getByTestId("owner-list").waitFor();ok(s.calls.length===0,"collapsed: no Assess reads");
    const summary=s.page.locator("summary",{hasText:m.title});await summary.focus();await s.page.keyboard.press("Enter");
    const root=s.page.getByTestId("assess-admin");await root.getByRole("checkbox").first().waitFor();
    await audit(s.page,label+"-open");
    const directory=root.getByRole("region",{name:m.people,exact:true});
    await directory.getByRole("checkbox").check();await directory.getByRole("button",{name:m.next,exact:true}).click();
    await directory.getByText("long@example.test").waitFor();await directory.getByRole("checkbox").check();
    await audit(s.page,label+"-long-page");
    await root.getByLabel(m.search,{exact:true}).fill("student@");await directory.getByText("student@example.test").waitFor();
    await root.getByLabel(m.search,{exact:true}).fill("");await directory.getByText("student@example.test").waitFor();
    ok(await directory.getByText("long@example.test").count()===0,"returning to an earlier search resets its cursor");
    await root.getByRole("button",{name:m.editGroup.replace("{name}","Group A"),exact:true}).click();
    await root.getByRole("button",{name:m.addMembers,exact:true}).click();
    await root.getByRole("region",{name:m.members,exact:true}).getByText("long@example.test").waitFor();
    await root.getByLabel(m.groupName,{exact:true}).fill("Renamed Group");await root.getByRole("button",{name:m.rename,exact:true}).click();
    await root.getByRole("region",{name:m.groups,exact:true}).getByRole("checkbox").check();
    await root.getByRole("radio").check();await root.getByRole("button",{name:m.publishAssignment,exact:true}).click();
    await root.getByRole("button",{name:m.manageTargets.replace("{name}","Synthetic assessment").replace("{version}","v1"),exact:true}).click();
    const targetRegion=root.getByRole("region",{name:m.targets,exact:true});await targetRegion.getByText("long@example.test").waitFor();
    await audit(s.page,label+"-assigned");
    const removeName=m.removePerson.replace("{name}","Student سارة");
    await root.getByRole("region",{name:m.members,exact:true}).getByRole("button",{name:removeName,exact:true}).click();
    await root.getByRole("region",{name:m.members,exact:true}).getByText("student@example.test").waitFor({state:"detached"});
    await root.getByRole("region",{name:m.members,exact:true}).getByText("long@example.test").waitFor();
    await targetRegion.getByText("student@example.test").waitFor();ok(true,"membership change leaves target unchanged");
    await targetRegion.getByRole("button",{name:removeName,exact:true}).click();
    await targetRegion.getByText("student@example.test").waitFor({state:"detached"});
    await targetRegion.getByText("long@example.test").waitFor();ok(await targetRegion.getByText("student@example.test").count()===0,"explicit target revocation");
    ok(s.calls.some(x=>x.fn==="assign_v1"&&x.p.p_users.length===2&&x.p.p_groups.length===1),"assignment union input");
    ok(s.calls.some(x=>x.fn==="targets_write_v1"&&x.p.p_revision===1),"explicit revision");assert.deepEqual(s.errors,[]);await s.ctx.close();
    const missing=await setup(locale,width,"owner","schema");await missing.page.locator("summary",{hasText:m.title}).click();
    await missing.page.getByTestId("assess-admin").getByRole("alert").first().waitFor();
    ok(!(await missing.page.textContent("body")).includes("private implementation"),"sanitised service failure");
    missing.recover();await missing.page.getByTestId("assess-admin").getByRole("button",{name:m.refresh,exact:true}).click();
    await missing.page.getByTestId("assess-admin").getByRole("radio").waitFor();await audit(missing.page,label+"-recovery");await missing.ctx.close();
    const student=await setup(locale,width,"participant");await student.page.getByTestId("owner-denied").waitFor();
    ok(await student.page.locator("summary",{hasText:m.title}).count()===0,"student has no owner controls");ok(student.calls.length===0,"student: no Assess calls");await student.ctx.close();
  }
  console.log(`Assess owner audit: ${checks} checks, ${audits} EN/AR390/1440 axe/overflow audits passed; synthetic local API only.`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
