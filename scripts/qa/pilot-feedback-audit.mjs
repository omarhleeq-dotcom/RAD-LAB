// RAD-043b browser audit with a MOCKED Supabase (no real project, no secret): feedback note box on the result panel + survey link on the account page.
//   npm run build:pages with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SURVEY_URL set (see the env defaults below),
//   then: CHROMIUM=/path/to/chrome node scripts/qa/pilot-feedback-audit.mjs   (needs `npm i --no-save playwright`; axe-core is already a dev dependency)
// Checks, EN + AR on a phone viewport: box hidden for pending / not-consented / unsaved accounts; visible with the "no personal data" warning for an
// approved + consenting one; a note is POSTed linked to the SAVED attempt id; a feedback_sent event (ids only, no text); failure shows a retry message;
// survey link carries ?code=<participant code>, opens survey_opened; axe WCAG A/AA on every state.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { startServer } from "../preview/serve-out.mjs";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://abcdefghijklmnop.supabase.co";
const SURVEY = process.env.NEXT_PUBLIC_SURVEY_URL ?? "https://forms.example.com/r/abc";
const REF = new URL(SUPA).hostname.split(".")[0];
const CONSENT = "2026-10-17";
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
let failed = 0;
const ok = (name, cond, detail = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${!cond && detail ? ` :: ${detail}` : ""}`); };

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`;
const USER = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "tester@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const session = () => ({ access_token: jwt(USER.id), refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user: USER });

/** One mocked project per scenario; `log` records every write the page makes. */
async function setup(browser, loc, { status = "approved", consent = CONSENT, failFeedback = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: loc === "ar" ? "ar" : "en-US" });
  const log = { attempts: [], feedback: [], events: [] };
  await ctx.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch {} }, [`sb-${REF}-auth-token`, JSON.stringify(session())]);
  await ctx.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const table = url.pathname.replace("/rest/v1/", "");
    if (url.pathname.startsWith("/auth/v1/user")) return json(200, USER);
    if (table === "profiles" && req.method() === "GET") return json(200, { status, role: "participant", participant_code: "P-ab12cd34", consent_version: consent });
    if (table === "attempts" && req.method() === "POST") { log.attempts.push(req.postDataJSON()); return route.fulfill({ status: 201, headers: { "access-control-allow-origin": "*" }, body: "" }); }
    if (table === "feedback" && req.method() === "POST") {
      log.feedback.push(req.postDataJSON());
      return failFeedback ? json(403, { message: "new row violates row-level security policy" }) : route.fulfill({ status: 201, headers: { "access-control-allow-origin": "*" }, body: "" });
    }
    if (table === "events" && req.method() === "POST") { log.events.push(req.postDataJSON()); return route.fulfill({ status: 201, headers: { "access-control-allow-origin": "*" }, body: "" }); }
    return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" }, body: "" });
  });
  const page = await ctx.newPage();
  return { ctx, page, log };
}

async function axe(page, name) {
  await page.evaluate(axeSrc);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  ok(`${name}: axe WCAG A/AA, no violations`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }))));
}

async function toResult(page, loc, base) {
  const m = msgs[loc];
  await page.goto(`${base}/${loc}/xray/chest-pa-erect/practice`, { waitUntil: "networkidle" });
  const expose = page.getByRole("button", { name: m.console.expose, exact: true });
  await expose.waitFor({ state: "visible" });
  await page.getByRole("slider").first().focus();
  await page.keyboard.press("ArrowRight"); // a settings change = attempt_started
  await expose.click();
  await page.locator("#result-heading").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
}

const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });

for (const loc of ["en", "ar"]) {
  const m = msgs[loc];
  const box = (page) => page.getByTestId("feedback-box");

  // 1. approved + consented: box visible, linked to the saved attempt.
  {
    const { ctx, page, log } = await setup(browser, loc);
    await toResult(page, loc, base);
    ok(`${loc}: attempt saved`, log.attempts.length === 1);
    ok(`${loc}: note box shown under the result`, await box(page).isVisible());
    ok(`${loc}: "no personal data" warning shown`, (await page.getByTestId("feedback-warning").innerText()).includes(m.feedback.warning));
    ok(`${loc}: box is below the result panel`, (await box(page).boundingBox()).y > (await page.locator("#result-heading").boundingBox()).y);
    ok(`${loc}: send disabled while empty`, await page.getByRole("button", { name: m.feedback.send }).isDisabled());
    await axe(page, `${loc}: result + note box`);
    const area = page.getByLabel(m.feedback.label);
    ok(`${loc}: textarea is dir=auto`, (await area.getAttribute("dir")) === "auto");
    await area.fill("x".repeat(1100));
    ok(`${loc}: send disabled over 1000 characters`, await page.getByRole("button", { name: m.feedback.send }).isDisabled());
    await area.fill(loc === "ar" ? "الملاحظة كانت غير واضحة" : "The collimation light was hard to see.");
    await page.getByRole("button", { name: m.feedback.send }).click();
    await page.getByTestId("feedback-sent").waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    ok(`${loc}: one note POSTed, linked to the saved attempt id`, log.feedback.length === 1 && log.feedback[0].attempt_id === log.attempts[0].id && log.feedback[0].exam_id === "chest-pa-erect", JSON.stringify(log.feedback));
    ok(`${loc}: note text sent as typed, no user id from the client`, log.feedback[0].text.length > 5 && log.feedback[0].user_id === undefined);
    const ev = log.events.find((e) => e.type === "feedback_sent");
    ok(`${loc}: feedback_sent event has ids only (no text)`, !!ev && ev.payload.attempt_id === log.attempts[0].id && !JSON.stringify(ev).includes(log.feedback[0].text));
    await axe(page, `${loc}: after sending`);
    // Retry hides the box (it belonged to the previous attempt).
    await ctx.close();
  }
  // 2. failure shows a retry message and keeps the text.
  {
    const { ctx, page, log } = await setup(browser, loc, { failFeedback: true });
    await toResult(page, loc, base);
    await page.getByLabel(m.feedback.label).fill("note");
    await page.getByRole("button", { name: m.feedback.send }).click();
    await page.getByTestId("feedback-failed").waitFor({ state: "visible" });
    ok(`${loc}: failed write shows a retry message, text kept, no event`, (await page.getByLabel(m.feedback.label).inputValue()) === "note" && !log.events.some((e) => e.type === "feedback_sent"));
    await axe(page, `${loc}: failure state`);
    await ctx.close();
  }
  // 3. not approved / not consented: nothing saved, no box.
  for (const [name, opts] of [["pending", { status: "pending" }], ["no consent", { consent: null }]]) {
    const { ctx, page, log } = await setup(browser, loc, opts);
    await toResult(page, loc, base);
    ok(`${loc}: ${name}: no attempt saved and no note box`, log.attempts.length === 0 && (await box(page).count()) === 0);
    await ctx.close();
  }
  // 4. account page: survey link with the participant code; click records survey_opened; hidden when pending.
  {
    const { ctx, page, log } = await setup(browser, loc);
    await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    const link = page.getByTestId("survey-link");
    await link.waitFor({ state: "visible" });
    const href = new URL(await link.getAttribute("href"));
    ok(`${loc}: survey link keeps the configured URL and carries ?code=<participant code>`, href.origin + href.pathname === new URL(SURVEY).origin + new URL(SURVEY).pathname && href.searchParams.get("code") === "P-ab12cd34", href.toString());
    ok(`${loc}: survey link opens a new tab, noopener, no email in the URL`, (await link.getAttribute("target")) === "_blank" && /noopener/.test(await link.getAttribute("rel")) && !href.toString().includes("example.test"));
    await axe(page, `${loc}: account page with survey`);
    await page.route(`${new URL(SURVEY).origin}/**`, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "survey" }));
    const [popup] = await Promise.all([page.waitForEvent("popup"), link.click()]);
    await popup.close();
    await page.waitForTimeout(300);
    ok(`${loc}: survey_opened event written`, log.events.some((e) => e.type === "survey_opened"));
    await ctx.close();
  }
  {
    const { ctx, page } = await setup(browser, loc, { status: "pending" });
    await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    await page.getByTestId("account-pending").waitFor({ state: "visible" });
    ok(`${loc}: survey hidden for a pending account`, (await page.getByTestId("survey-card").count()) === 0);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall pilot feedback checks passed");
process.exit(failed ? 1 : 0);
