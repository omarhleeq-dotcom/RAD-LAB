// RAD-044b browser audit with a MOCKED Supabase (no real project, no secret, no real patient or participant data): the owner page lists attempts and
// notes per participant code and exports two CSV files without e-mail addresses.
//   npm run build:pages with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY set (env defaults below), then:
//   CHROMIUM=/path/to/chrome node scripts/qa/pilot-owner-audit.mjs     (needs `npm i --no-save playwright`; axe-core is a dev dependency)
// Checks, EN + AR on a phone (390) and a desktop (1440) viewport: owner sees participants with their attempts + notes (table, notes, "none" state),
// reads are plain selects of the named columns (no device column, nothing written); both CSV downloads (BOM, header, rows, formula guard, UTF-8 Arabic,
// NO e-mail anywhere); paging past 1000 rows; a failing attempts read keeps the list and hides the CSV bar; participant and visitor never request
// attempts / notes; no horizontal page scroll; axe WCAG A/AA on every state.
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
async function setup(browser, loc, vp, { role = "owner", signedIn = true, attempts = baseAttempts, notes = baseNotes, failAttempts = false } = {}) {
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
    if (path === "rpc/owner_list_participants") return role === "owner" ? json(200, participants) : json(403, { code: "42501", message: "owner only" });
    if (path === "attempts" || path === "feedback") {
      if (req.method() !== "GET") { log.writes.push(`${req.method()} ${path}`); return route.fulfill({ status: 201, headers: cors, body: "" }); }
      log.reads.push(url.search);
      if (path === "attempts" && failAttempts) return json(500, { message: "boom" });
      const rows = path === "attempts" ? attempts : notes;
      const offset = Number(url.searchParams.get("offset") ?? 0), limit = Number(url.searchParams.get("limit") ?? 1000);
      return json(200, rows.slice(offset, offset + limit));
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
  const [d] = await Promise.all([page.waitForEvent("download"), page.getByTestId(testId).click()]);
  return { name: d.suggestedFilename(), text: readFileSync(await d.path(), "utf8") };
}

const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const VIEWPORTS = [["phone", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]];

for (const loc of ["en", "ar"]) {
  const m = msgs[loc].owner;
  for (const [vpName, vp] of VIEWPORTS) {
    const tag = `${loc}/${vpName}`;
    // 1. owner: lists + CSV.
    {
      const { ctx, page, log } = await setup(browser, loc, vp);
      await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
      await page.getByTestId("owner-data-summary").waitFor({ state: "visible" });
      ok(`${tag}: page direction`, (await page.evaluate(() => document.documentElement.dir)) === (loc === "ar" ? "rtl" : "ltr"));
      ok(`${tag}: totals line (2 attempts, 2 notes)`, (await page.getByTestId("owner-data-summary").innerText()).includes("2") && (await page.getByTestId("owner-data-partial").count()) === 0);
      const alice = page.getByTestId("activity-P-ab12cd34");
      ok(`${tag}: participant with data has a collapsed section`, (await alice.evaluate((el) => el.tagName === "DETAILS" && !el.open)) === true);
      ok(`${tag}: participant without data says so`, (await page.getByTestId("activity-P-ef56ab78").innerText()).includes(m.activity.none));
      await alice.locator("summary").click();
      ok(`${tag}: both attempts are listed, newest first`, (await alice.locator("tbody tr").count()) === 2 && (await alice.locator("tbody tr").first().getAttribute("data-testid")) === "attempt-22222222-2222-2222-2222-222222222222");
      ok(`${tag}: pass / not-pass and critical finding shown`, (await alice.innerText()).includes(m.activity.passed) && (await alice.innerText()).includes(m.activity.notPassed) && (await alice.innerText()).includes("missing-marker"));
      ok(`${tag}: note shown, linked to attempt 2; unlinked note says so`, (await page.getByTestId("note-1").innerText()).includes("الإضاءة") && (await page.getByTestId("note-1").innerText()).includes(m.activity.onAttempt.replace("{no}", "2")) && (await page.getByTestId("note-2").innerText()).includes(m.activity.noAttempt));
      ok(`${tag}: notes are dir=auto`, (await page.getByTestId("note-1").locator("p[dir=auto]").count()) === 1);
      ok(`${tag}: attempt table sits in a keyboard-focusable scroll region`, (await alice.locator("[role=region]").getAttribute("tabindex")) === "0");
      await noHScroll(page, tag);
      await axe(page, `${tag}: owner page, section open`);
      ok(`${tag}: reads select named columns only (no device, no e-mail), ordered, paged`, log.reads.length === 2 && log.reads.every((q) => !/device|email/.test(q) && /order=/.test(q) && /limit=1000/.test(q)), JSON.stringify(log.reads));
      const a = await downloadText(page, "csv-attempts");
      ok(`${tag}: attempts file name`, /^radlab-attempts-\d{4}-\d{2}-\d{2}\.csv$/.test(a.name), a.name);
      const aLines = a.text.slice(1).split("\r\n");
      ok(`${tag}: attempts CSV has BOM, header, 2 rows keyed by code`, a.text.startsWith("﻿") && aLines[0].startsWith("participant_code,attempt_no,attempt_id") && aLines.length === 4 && aLines[1].startsWith("P-ab12cd34,1,") && aLines[2].startsWith("P-ab12cd34,2,"), aLines.join(" | "));
      ok(`${tag}: attempts CSV carries score, critical finding, settings`, aLines[1].includes(",54,false,false,rotated,missing-marker,") && aLines[1].includes('"{""kvp"":110,""rotation"":3}"'));
      const n = await downloadText(page, "csv-notes");
      ok(`${tag}: notes file name`, /^radlab-notes-\d{4}-\d{2}-\d{2}\.csv$/.test(n.name), n.name);
      ok(`${tag}: notes CSV keeps Arabic UTF-8, links attempt no`, n.text.includes("الإضاءة كانت صعبة الرؤية") && n.text.includes("chest-pa-erect,2,22222222-2222-2222-2222-222222222222,"));
      ok(`${tag}: a note that starts like a formula is neutralised`, n.text.includes(",\"'=HYPERLINK(") && !/,=HYPERLINK/.test(n.text), n.text);
      ok(`${tag}: NO e-mail address or user id in either file`, !EMAILS.some((e) => (a.text + n.text).includes(e)) && !/@/.test(a.text) && ![OWNER_ID, A_ID, B_ID].some((id) => (a.text + n.text).includes(id)));
      ok(`${tag}: nothing was written to attempts / feedback / any other table (the session keeper heartbeat events aside)`, log.writes.length === 0, JSON.stringify(log.writes));
      await ctx.close();
    }
  }
  // 2. attempts read fails: list stays, CSV bar hidden, clear message.
  {
    const { ctx, page } = await setup(browser, loc, VIEWPORTS[0][1], { failAttempts: true });
    await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
    await page.getByTestId("owner-data-error").waitFor({ state: "visible" });
    ok(`${loc}: failed read keeps the participant list and hides the CSV bar`, (await page.getByTestId("owner-list").isVisible()) && (await page.getByTestId("csv-bar").count()) === 0 && (await page.getByTestId("owner-data-error").innerText()).includes(m.errors.data));
    await axe(page, `${loc}: data-error state`);
    await ctx.close();
  }
  // 3. more than one page: 1005 attempts load as 1005 (paging by offset).
  {
    const many = Array.from({ length: 1005 }, (_, i) => attempt(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, A_ID, (i % 1000) + 1, 80, true, new Date(Date.UTC(2026, 9, 16, 0, 0, i)).toISOString()));
    const { ctx, page, log } = await setup(browser, loc, VIEWPORTS[0][1], { attempts: many, notes: [] });
    await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
    await page.getByTestId("owner-data-summary").waitFor({ state: "visible" });
    ok(`${loc}: 1005 attempts are all loaded (two pages)`, (await page.getByTestId("owner-data-summary").innerText()).includes("1005") || (await page.getByTestId("owner-data-summary").innerText()).includes("1,005") || (await page.getByTestId("owner-data-summary").innerText()).includes("1٬005"), await page.getByTestId("owner-data-summary").innerText());
    ok(`${loc}: second page requested with offset=1000`, log.reads.some((q) => /offset=1000/.test(q)), JSON.stringify(log.reads));
    ok(`${loc}: notes CSV button disabled with no notes`, await page.getByTestId("csv-notes").isDisabled());
    await ctx.close();
  }
  // 4. participant and visitor: denied / sign-in prompt, and no request for attempts or notes at all.
  {
    const { ctx, page, log } = await setup(browser, loc, VIEWPORTS[0][1], { role: "participant" });
    await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
    await page.getByTestId("owner-denied").waitFor({ state: "visible" });
    await page.waitForTimeout(300);
    ok(`${loc}: participant is denied and never asks for attempts / notes`, log.reads.length === 0 && (await page.getByTestId("csv-bar").count()) === 0, JSON.stringify(log.reads));
    await axe(page, `${loc}: denied state`);
    await ctx.close();
  }
  {
    const { ctx, page, log } = await setup(browser, loc, VIEWPORTS[0][1], { signedIn: false });
    await page.goto(`${base}/${loc}/owner`, { waitUntil: "networkidle" });
    await page.getByTestId("owner-signed-out").waitFor({ state: "visible" });
    ok(`${loc}: visitor gets the sign-in prompt and no data request`, log.reads.length === 0 && (await page.getByTestId("csv-bar").count()) === 0);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall owner attempts / notes checks passed");
process.exit(failed ? 1 : 0);
