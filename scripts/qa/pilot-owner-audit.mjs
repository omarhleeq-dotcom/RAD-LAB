// RAD-047b.2: mocked Supabase only; bounded list/detail and independent chunk export.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { startServer } from "../preview/serve-out.mjs";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://abcdefghijklmnop.supabase.co";
const REF = new URL(SUPA).hostname.split(".")[0];
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
let failed = 0;
const ok = (name, cond, detail = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${!cond && detail ? ` :: ${detail}` : ""}`); };

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`;
const OWNER_ID = "00000000-0000-0000-0000-0000000000f0";
const A_ID = "00000000-0000-0000-0000-00000000000a";
const B_ID = "00000000-0000-0000-0000-00000000000b";
const USER = { id: OWNER_ID, aud: "authenticated", role: "authenticated", email: "owner@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const session = () => ({ access_token: jwt(USER.id), refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user: USER });
const EMAILS = ["owner@example.test", "alice.tester@example.test", "bob.tester@example.test"];

const participants = [
  { user_id: OWNER_ID, participant_code: "P-0wner000", role: "owner", status: "approved", email: EMAILS[0], email_confirmed: true, created_at: "2026-10-15T08:00:00Z", last_seen_at: null, last_event_at: null },
  { user_id: A_ID, participant_code: "P-ab12cd34", role: "participant", status: "approved", email: EMAILS[1], email_confirmed: true, created_at: "2026-10-15T09:00:00Z", last_seen_at: "2026-10-16T10:00:00Z", last_event_at: "2026-10-16T10:05:00Z" },
  { user_id: B_ID, participant_code: "P-ef56ab78", role: "participant", status: "approved", email: EMAILS[2], email_confirmed: true, created_at: "2026-10-15T09:30:00Z", last_seen_at: null, last_event_at: null },
];
const result = (total, passed, critical = []) => ({ total, passed, thresholdMet: passed, primaryVariant: passed ? "ideal" : "rotated", critical, categories: [{ c: "positioning", earned: 20, weight: 28 }], checks: [{ id: "rot", o: passed ? "pass" : "fail", credit: passed ? 1 : 0 }] });
const attempt = (id, user, no, total, passed, finished, extra = {}) => ({
  id, user_id: user, attempt_no: no, exam_id: "chest-pa-erect", case_id: "default", definition_version: "abcd1234", settings: { kvp: 110, rotation: 3 }, result: result(total, passed, extra.critical),
  locale: "en", started_at: "2026-10-16T10:00:00Z", finished_at: finished,
});
const baseAttempts = [
  attempt("11111111-1111-1111-1111-111111111111", A_ID, 1, 54, false, "2026-10-16T10:02:00Z", { critical: ["missing-marker"] }),
  attempt("22222222-2222-2222-2222-222222222222", A_ID, 2, 91, true, "2026-10-16T10:09:00Z"),
];
const baseNotes = [
  { id: 1, user_id: A_ID, exam_id: "chest-pa-erect", attempt_id: "22222222-2222-2222-2222-222222222222", text: "الإضاءة كانت صعبة الرؤية", at: "2026-10-16T10:10:00Z" },
  { id: 2, user_id: A_ID, exam_id: "chest-pa-erect", attempt_id: null, text: "=HYPERLINK(\"http://x\",\"click\")", at: "2026-10-16T10:11:00Z" },
];

/** One mocked project per scenario; `log` records every request to the data tables (there must never be a write). */
async function setup(browser, loc, vp, { role = "owner", signedIn = true, attempts = baseAttempts, notes = baseNotes, failAttempts = false, participantRows = participants, failExportAfter = null } = {}) {
  const ctx = await browser.newContext({ viewport: vp, acceptDownloads: true, locale: loc === "ar" ? "ar" : "en-US" });
  const log = { reads: [], writes: [] };
  if (signedIn) await ctx.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch {} }, [`sb-${REF}-auth-token`, JSON.stringify(session())]);
  await ctx.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { "access-control-allow-origin": "*" };
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", headers: cors, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const path = url.pathname.replace("/rest/v1/", "");
    if (url.pathname.startsWith("/auth/v1/user")) return json(200, USER);
    if (path === "profiles" && req.method() === "GET") return json(200, { status: "approved", role, participant_code: role === "owner" ? "P-0wner000" : "P-ab12cd34", consent_version: "2026-10-17" });
    if (path === "rpc/owner_page_v1") {
      const args = req.postDataJSON(); log.reads.push(args);
      if (role !== "owner") return json(403, { message: "owner only" });
      if (args.p_stream === "attempts" && failAttempts) return json(500, { message: "boom" });
      if (args.p_export && failExportAfter !== null && log.reads.filter((r) => r.p_export).length > failExportAfter) return json(500,{message:"interrupted export"});
      const stream = args.p_stream;
      const stamp = stream === "participants" ? "created_at" : stream === "attempts" ? "finished_at" : "at";
      const id = stream === "participants" ? "user_id" : "id";
      const boundary = args.p_boundary ?? "2026-10-31T00:00:00Z";
      let rows = [...(stream === "participants" ? participantRows : stream === "attempts" ? attempts : notes)];
      rows = rows.filter((r) => (!args.p_participant || args.p_participant === r.user_id) && (!args.p_exam || args.p_exam === r.exam_id)
        && (!args.p_from || Date.parse(r[stamp]) >= Date.parse(args.p_from)) && (!args.p_to || Date.parse(r[stamp]) <= Date.parse(args.p_to)) && Date.parse(r[stamp]) <= Date.parse(boundary));
      const total = rows.length;
      rows.sort((a,b) => Date.parse(b[stamp])-Date.parse(a[stamp]) || String(a[id]).localeCompare(String(b[id])));
      if (args.p_cursor) rows = rows.filter((r) => Date.parse(r[stamp]) < Date.parse(args.p_cursor.time) || (Date.parse(r[stamp]) === Date.parse(args.p_cursor.time) && String(r[id]) > args.p_cursor.id));
      rows = rows.slice(0,args.p_limit).map((r) => ({ ...r, participant_code: participantRows.find((p) => p.user_id === r.user_id)?.participant_code,
        ...(stream === "notes" ? { id: String(r.id), attempt_no: attempts.find((a) => a.id === r.attempt_id)?.attempt_no ?? null } : {}) }));
      const last = rows.at(-1);
      const next = rows.length === args.p_limit ? { time: last[stamp], id: String(last[id]) } : null;
      if (args.p_export) rows = rows.map((r) => { const copy = { ...r }; delete copy.user_id; return copy; });
      return json(200, { version: 1, boundary, total, pending: stream === "participants" ? rows.filter((r)=>r.status === "pending").length : 0, rows, next });
    }
    if (path === "attempts" || path === "feedback" || path === "rpc/owner_list_participants") {
      log.writes.push(`unexpected legacy read: ${path}`); return json(500,{message:"legacy read"});
    }
    // The existing session keeper writes sign-in / heartbeat `events` on every page; that is not this feature, so it is not counted as a write here.
    if (req.method() !== "GET" && path !== "events") log.writes.push(`${req.method()} ${path}`);
    return route.fulfill({ status: 204, headers: cors, body: "" });
  });
  return { ctx, page: await ctx.newPage(), log };
}

async function axe(page, name) {
  await page.evaluate(axeSrc);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  ok(`${name}: axe WCAG A/AA, no violations`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }))));
}
const noHScroll = async (page, name) => ok(`${name}: no horizontal page scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
async function downloadText(page, testId) {
  try {
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByTestId(testId).click()]);
    return { name: d.suggestedFilename(), text: readFileSync(await d.path(), "utf8") };
  } catch (error) {
    console.error("download diagnostic", { testId, status: await page.getByTestId("export-status").allTextContents(), error: await page.getByTestId("export-error").allTextContents(), buttons: await page.locator("[data-testid^=export-]").allTextContents() });
    throw error;
  }
}

const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const VIEWPORTS = [["phone", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]];

try {
for (const loc of ["en", "ar"]) {
  const m = msgs[loc].owner;
  for (const [vpName, vp] of VIEWPORTS) {
    const tag = `${loc}/${vpName}`;
    const { ctx, page, log } = await setup(browser, loc, vp);
    await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
    await page.getByTestId("owner-summary").waitFor();
    ok(`${tag}: only bounded participant read on mount`, log.reads.length === 1 && log.reads[0].p_stream === "participants" && log.reads[0].p_limit === 100);
    ok(`${tag}: direction`, await page.locator("html").getAttribute("dir") === (loc === "ar" ? "rtl" : "ltr"));
    const alice = page.getByTestId("activity-P-ab12cd34");
    await alice.locator("summary").click();
    await alice.locator("tbody tr").first().waitFor();
    ok(`${tag}: bounded detail newest first`, await alice.locator("tbody tr").count() === 2 && await alice.locator("tbody tr").first().getAttribute("data-testid") === "attempt-22222222-2222-2222-2222-222222222222");
    await page.getByTestId("show-notes-P-ab12cd34").click();
    await page.getByTestId("note-1").waitFor();
    ok(`${tag}: SQL linked note and Arabic`, (await page.getByTestId("note-1").innerText()).includes(m.activity.onAttempt.replace("{no}","2")) && await page.getByTestId("note-1").locator("[dir=auto]").count() === 1);
    await axe(page, `${tag}: open notes`); await noHScroll(page,tag);
    await page.getByTestId("filter-participant").selectOption(A_ID);
    await page.getByTestId("participant-P-0wner000").waitFor({state:"detached"});
    await page.getByTestId("csv-attempts").click();
    await page.getByTestId("export-save").waitFor();
    const a = await downloadText(page,"export-save");
    ok(`${tag}: numbered independent export`, /part-1.csv$/.test(a.name) && a.text.startsWith("\uFEFF") && a.text.includes("P-ab12cd34,1,") && a.text.includes("P-ab12cd34,2,"));
    const report = await downloadText(page,"export-report");
    ok(`${tag}: export boundary and completeness report`, JSON.parse(report.text).complete === true && JSON.parse(report.text).written === 2 && JSON.parse(report.text).filters.participant === "P-ab12cd34" && !report.text.includes(A_ID));
    await page.getByText(m.paging.resetExport,{exact:true}).click();
    await page.getByTestId("csv-notes").click();
    await page.getByTestId("export-save").waitFor();
    const n = await downloadText(page,"export-save");
    ok(`${tag}: Unicode and formula guard`, n.text.includes("الإضاءة") && n.text.includes(`"'=HYPERLINK(`));
    ok(`${tag}: exports contain no structured email / user identity`, !EMAILS.some((e)=>(a.text+n.text).includes(e)) && ![OWNER_ID,A_ID,B_ID].some((id)=>(a.text+n.text).includes(id)));
    ok(`${tag}: no table writes or legacy reads`, log.writes.length === 0,JSON.stringify(log.writes));
    await axe(page,`${tag}: export complete`);
    await ctx.close();
  }
  {
    const many = Array.from({length:10005},(_,i)=>attempt(`00000000-0000-4000-8000-${String(i).padStart(12,"0")}`,A_ID,i+1,80,true,"2026-10-16T00:00:00Z"));
    const {ctx,page,log}=await setup(browser,loc,VIEWPORTS[0][1],{attempts:many,notes:[]});
    await page.goto(`${base}/${loc}/owner`,{waitUntil:"networkidle"});
    const alice=page.getByTestId("activity-P-ab12cd34");
    await alice.locator("summary").click();
    await alice.locator("tbody tr").first().waitFor();
    ok(`${loc}: 10005 total with only 100 detail rows`, await alice.locator("tbody tr").count() === 100 && /10.?005/.test(await page.getByTestId("total-P-ab12cd34").innerText()));
    await page.getByTestId("detail-next-P-ab12cd34").click();
    await page.getByTestId(`attempt-${many[100].id}`).waitFor();
    ok(`${loc}: next detail page replaces previous rows`,await alice.locator("tbody tr").count()===100 && await page.getByTestId(`attempt-${many[0].id}`).count()===0);
    await page.getByTestId("csv-attempts").click();
    await page.getByTestId("export-save").waitFor();
    let count=0;
    for(let i=0;i<11;i++) {
      const part=await downloadText(page,"export-save"); count+=part.text.split("\r\n").length-2; console.log(`${loc}: saved export part ${i+1}`);
      if(i<10) await page.getByTestId("export-save").filter({hasText:msgs[loc].owner.paging.savePart.replace("{part}",String(i+2))}).waitFor();
    }
    const report=JSON.parse((await downloadText(page,"export-report")).text);
    ok(`${loc}: all >10k exported in bounded parts`, count===10005 && report.written===10005 && report.complete && log.reads.filter((r)=>r.p_export).every((r)=>r.p_limit===1000));
    await ctx.close();
  }
  {
    const {ctx,page}=await setup(browser,loc,VIEWPORTS[0][1],{failAttempts:true});
    await page.goto(`${base}/${loc}/owner`,{waitUntil:"networkidle"});
    await page.getByTestId("activity-P-ab12cd34").locator("summary").click();
    await page.getByTestId("owner-data-error").waitFor();
    await page.getByTestId("csv-attempts").click(); await page.getByTestId("export-error").waitFor();
    ok(`${loc}: failed export visible, never offered as complete`,await page.getByTestId("export-save").count()===0);
    await axe(page,`${loc}: failed detail and export`); await ctx.close();
  }
  {
    const participantRows=Array.from({length:105},(_,i)=>({...participants[1],user_id:`00000000-0000-4000-8000-${String(i).padStart(12,"0")}`,participant_code:`P-${i}`}));
    const {ctx,page,log}=await setup(browser,loc,VIEWPORTS[0][1],{participantRows});
    await page.goto(`${base}/${loc}/owner`,{waitUntil:"networkidle"});
    await page.getByTestId("participant-P-0").waitFor();
    ok(`${loc}: participant list bounded to 100`,await page.locator("li[data-testid^=participant-]").count()===100);
    await page.getByTestId("participants-next").click(); await page.getByTestId("participant-P-100").waitFor();
    ok(`${loc}: participant continuation replaces first page`,await page.locator("li[data-testid^=participant-]").count()===5 && log.reads.at(-1).p_cursor!==null);
    await ctx.close();
  }
  {
    const many=Array.from({length:1005},(_,i)=>attempt(`00000000-0000-4000-8000-${String(i).padStart(12,"0")}`,A_ID,(i%1000)+1,80,true,"2026-10-16T00:00:00Z"));
    const {ctx,page}=await setup(browser,loc,VIEWPORTS[0][1],{attempts:many,failExportAfter:1});
    await page.goto(`${base}/${loc}/owner`,{waitUntil:"networkidle"}); await page.getByTestId("csv-attempts").click(); await page.getByTestId("export-save").waitFor();
    await downloadText(page,"export-save"); await page.getByTestId("export-error").waitFor();
    const report=JSON.parse((await downloadText(page,"export-report")).text);
    ok(`${loc}: interrupted export retains counts and reports partial/error`,report.written===1000 && !report.complete && report.error);
    await ctx.close();
  }
  for(const options of [{role:"participant"},{signedIn:false}]) {
    const {ctx,page,log}=await setup(browser,loc,VIEWPORTS[0][1],options);
    await page.goto(`${base}/${loc}/owner`,{waitUntil:"networkidle"});
    await page.getByTestId(options.signedIn===false?"owner-signed-out":"owner-denied").waitFor();
    ok(`${loc}: denied/visitor no owner reads`,log.reads.length===0);
    await axe(page,`${loc}: denied/visitor`); await ctx.close();
  }
}
} finally { await browser.close(); server.close(); }
console.log(failed ? `${failed} checks FAILED` : "all owner paging checks passed");
process.exit(failed?1:0);
