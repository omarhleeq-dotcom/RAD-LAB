// RAD-050: local static export, fully mocked Supabase. No live services or external navigation.
// Build with synthetic public config (see implementation report), then CHROMIUM=/usr/bin/chromium node scripts/qa/pilot-consent-audit.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";

const SUPA = "https://abcdefghijklmnop.supabase.co";
const VERSION = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const messages = Object.fromEntries(["en", "ar"].map((loc) => [loc, JSON.parse(readFileSync(`messages/${loc}.json`, "utf8"))]));
const draft = readFileSync("docs/TERMS_OWNER_DRAFT_2026-10-16.md", "utf8");
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
let checks = 0;
function ok(name, value) { assert.ok(value, name); checks++; console.log(`ok ${name}`); }
// Independently verify every participant sentence against the approved source, with only S-PILOT-34 overridden.
for (const loc of ["en", "ar"]) {
  const t = messages[loc].terms;
  const source = draft.split(`## ${t.title}\n`)[1].split("\n---")[0].trim();
  const chunks = source.split("\n### ");
  const intro = chunks[0].split("\n\n").map((s) => s.trim());
  assert.deepEqual([t.draft, t.lead], intro);
  const sections = Object.values(t).filter((s) => typeof s === "object");
  sections.forEach((section, i) => {
    const [heading, ...lines] = chunks[i + 1].split("\n");
    const expected = lines.filter((s) => s.startsWith("- ")).map((s) => s.slice(2));
    if (i === 0) expected[0] = loc === "en"
      ? "You create your account using your email address and a password you choose. The account service stores and verifies your password. Your password is not shown to the project owner."
      : "تنشئ حسابك باستخدام بريدك الإلكتروني وكلمة مرور تختارها بنفسك. تتولى خدمة الحسابات حفظ كلمة مرورك والتحقق منها، ولا تظهر لصاحب المشروع.";
    assert.deepEqual(Object.values(section), [heading, ...expected]);
  });
  assert.equal(t.closing, chunks.at(-1).split("\n").slice(1).join("\n").trim());
  ok(`${loc}: approved source parity including password override`, true);
}
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "tester@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
async function setup(viewport, signedIn) {
  const ctx = await browser.newContext({ viewport });
  const state = { consent: "2026-10-17", fail: true, updates: [], signups: [], attempts: [], events: [], external: [] };
  if (signedIn) await ctx.addInitScript((value) => {
    if (!localStorage.getItem("sb-abcdefghijklmnop-auth-token")) localStorage.setItem("sb-abcdefghijklmnop-auth-token", value);
  }, JSON.stringify(session));
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    if (url.origin !== SUPA) { state.external.push(url.origin); return route.abort(); }
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (status, body) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/auth/v1/signup") { state.signups.push(req.postDataJSON()); return json(200, { user, session: null }); }
    if (url.pathname === "/auth/v1/user") return json(200, user);
    if (url.pathname === "/rest/v1/profiles") {
      if (req.method() === "GET") return json(200, { status: "approved", role: "participant", participant_code: "P-synthetic", consent_version: state.consent });
      if (req.method() === "PATCH") {
        state.updates.push({ body: req.postDataJSON(), search: url.searchParams.toString() });
        if (state.fail) { state.fail = false; return json(503, { message: "synthetic failure" }); }
        state.consent = req.postDataJSON().consent_version;
        return route.fulfill({ status: 204, headers });
      }
    }
    if (url.pathname === "/rest/v1/attempts" && req.method() === "POST") { state.attempts.push(req.postDataJSON()); return route.fulfill({ status: 201, headers }); }
    if (url.pathname === "/rest/v1/events" && req.method() === "POST") { state.events.push(req.postDataJSON()); return route.fulfill({ status: 201, headers }); }
    throw new Error(`Unexpected mocked request: ${req.method()} ${url.pathname}`);
  });
  return { ctx, page: await ctx.newPage(), state };
}
async function audit(page, tag) {
  await page.evaluate(axeSrc);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  ok(`${tag}: axe`, result.violations.length === 0 || (console.log(JSON.stringify(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })))), false));
  ok(`${tag}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
async function expose(page, loc) {
  await page.getByRole("button", { name: messages[loc].console.expose, exact: true }).click();
  await page.locator("#result-heading").waitFor();
  // Allow the best-effort async logger to finish, including the negative no-write assertions.
  await page.waitForTimeout(400);
}
try {
  for (const loc of ["en", "ar"]) for (const width of [390, 1440]) {
    const tag = `${loc}/${width}`, m = messages[loc], viewport = { width, height: 900 };
    {
      const { ctx, page, state } = await setup(viewport, false);
      await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: m.account.tabs.signUp }).click();
      await page.getByLabel(m.account.email, { exact: true }).fill(user.email);
      await page.getByLabel(m.account.password, { exact: true }).fill("Synthetic1!");
      await page.getByLabel(m.account.confirmPassword, { exact: true }).fill("Synthetic1!");
      const agree = page.getByTestId("agree-terms"), submit = page.getByRole("button", { name: m.account.submit.signUp, exact: true });
      ok(`${tag}: signup starts unchecked/disabled with no write`, !(await agree.isChecked()) && await submit.isDisabled() && state.signups.length === 0);
      await audit(page, `${tag}/signup-unchecked`);
      const link = page.getByRole("link", { name: m.account.termsLink, exact: true });
      const [terms] = await Promise.all([page.waitForEvent("popup"), link.click()]);
      await terms.waitForLoadState("networkidle");
      ok(`${tag}: Terms link stays local and uses locale`, terms.url() === `${base}/${loc}/terms`);
      const t = m.terms, sections = Object.values(t).filter((s) => typeof s === "object");
      assert.deepEqual(await terms.locator("section h2").allTextContents(), sections.map((s) => s.title));
      assert.deepEqual(await terms.locator("section li").allTextContents(), sections.flatMap((s) => Object.entries(s).filter(([k]) => k !== "title").map(([, v]) => v)));
      assert.equal(await terms.getByTestId("terms-draft").innerText(), t.draft);
      ok(`${tag}: seven sections / 17 paragraphs / all approved text / pilot label / no survey disclosure`, await terms.locator("section li").count() === 17 && (await terms.locator("#main-content").innerText()).includes(t.lead) && (await terms.locator("#main-content").innerText()).includes(t.closing));
      await audit(terms, `${tag}/terms`);
      await terms.close();
      await agree.check();
      ok(`${tag}: checked enables signup`, await submit.isEnabled());
      await audit(page, `${tag}/signup-checked`);
      await submit.click();
      await page.getByTestId("account-check-email").waitFor();
      ok(`${tag}: signup writes exact consent version`, state.signups.length === 1 && state.signups[0].data.consent_version === VERSION);
      await audit(page, `${tag}/signup-sent`);
      ok(`${tag}: no external navigation`, state.external.length === 0);
      await ctx.close();
    }
    {
      const { ctx, page, state } = await setup(viewport, true);
      const sim = await ctx.newPage();
      await sim.goto(`${base}/${loc}/xray/chest-pa-erect/practice`, { waitUntil: "networkidle" });
      await expose(sim, loc);
      ok(`${tag}: stale consent pauses attempt saving`, state.attempts.length === 0 && !state.events.some((e) => e.type === "attempt_submitted"));
      await audit(sim, `${tag}/paused-result`);
      await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
      const card = page.getByTestId("consent-card");
      await card.waitFor();
      const agree = card.getByRole("checkbox"), accept = card.getByRole("button", { name: m.account.consent.accept, exact: true });
      ok(`${tag}: renewal starts unchecked/disabled`, !(await agree.isChecked()) && await accept.isDisabled() && state.updates.length === 0);
      ok(`${tag}: heartbeat continues before renewal`, state.events.some((e) => e.type === "heartbeat"));
      ok(`${tag}: no survey link`, await page.getByTestId("survey-card").count() === 0);
      ok(`${tag}: renewal Terms link uses locale`, (await card.getByRole("link").getAttribute("href")) === `/${loc}/terms`);
      await audit(page, `${tag}/renewal-unchecked`);
      await agree.check();
      await audit(page, `${tag}/renewal-checked`);
      await accept.click();
      await card.getByRole("alert").waitFor();
      ok(`${tag}: failed acceptance retains card and old version`, state.updates.length === 1 && state.consent !== VERSION && await agree.isChecked());
      await audit(page, `${tag}/renewal-failed`);
      const before = Date.now();
      await accept.click();
      await card.waitFor({ state: "detached" });
      const update = state.updates[1];
      ok(`${tag}: retry writes exact version/current timestamp/own row`, state.updates.length === 2 && update.body.consent_version === VERSION && Date.parse(update.body.consented_at) >= before && Date.parse(update.body.consented_at) <= Date.now() && update.search.includes(user.id));
      await audit(page, `${tag}/renewal-success`);
      await page.reload({ waitUntil: "networkidle" });
      await page.getByTestId("account-approved").waitFor();
      ok(`${tag}: current-consent card stays absent after reload`, await card.count() === 0);
      await audit(page, `${tag}/current-consent`);
      await sim.getByRole("button", { name: m.result.retry, exact: true }).click();
      await expose(sim, loc);
      ok(`${tag}: existing recorder keeps cached stale consent`, state.attempts.length === 0);
      await sim.reload({ waitUntil: "networkidle" });
      await expose(sim, loc);
      ok(`${tag}: saving resumes after reload without replay`, state.attempts.length === 1 && state.events.filter((e) => e.type === "attempt_submitted").length === 1);
      await audit(sim, `${tag}/resumed-result`);
      ok(`${tag}: no external navigation`, state.external.length === 0);
      await ctx.close();
    }
  }
  console.log(`All ${checks} consent checks passed.`);
} finally {
  await browser.close();
  server.close();
}
