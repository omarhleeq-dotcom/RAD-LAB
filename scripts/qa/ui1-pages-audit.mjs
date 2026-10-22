// UI-1 pages audit (RAD-066 + language switch placement): login, library, terms, credits, account and the side menu, EN/AR x 390/1440.
// Local static export only, synthetic mocked account, no hosted preview. Needs a pilot-enabled export with a synthetic Supabase origin:
//   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_public_key npm run build:pages
//   node scripts/qa/ui1-pages-audit.mjs   (CHROMIUM=/path/to/chromium if /usr/bin/chromium is missing)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const messages = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const supa = "https://abcdefghijklmnop.supabase.co";
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
let checks = 0, audits = 0;
const ok = (v, label) => { assert.ok(v, label); checks++; };
async function setup(signedIn, status, consentVersion, name, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const errors = [];
  if (signedIn) await ctx.addInitScript((v) => localStorage.setItem("sb-abcdefghijklmnop-auth-token", v), JSON.stringify(session));
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    assert.equal(url.origin, supa);
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ status, role: "participant", participant_code: "P-test", consent_version: consentVersion, display_name: name }) });
    if (url.pathname === "/rest/v1/events" || url.pathname.startsWith("/rest/v1/rpc/")) return route.fulfill({ status: 201, headers, contentType: "application/json", body: "{}" });
    return route.fulfill({ status: 200, headers, contentType: "application/json", body: "[]" });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page, errors };
}
async function audit(page, label) {
  await page.evaluate(axe);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(r.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no overflow`);
  audits++;
}
const banned = /provisional|awaiting|pending (educator|review)|unreviewed|not accurate|مؤقت|بانتظار مراجعة|غير مراجع/i;
try {
  for (const loc of ["en", "ar"]) for (const width of [390, 1440]) {
    const m = messages[loc], tag = `${loc}/${width}`;
    // login (signed out): standalone chrome
    let s = await setup(false, "approved", consent, "A B C", width);
    await s.page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    await s.page.getByRole("tab", { name: m.account.tabs.signIn }).waitFor();
    ok(await s.page.locator("nav.site-nav").count() === 0 && await s.page.getByTestId("menu-toggle").count() === 0, `${tag}: login has no site menu`);
    ok(await s.page.getByTestId("preview-banner").count() === 0, `${tag}: no banner`);
    ok(await s.page.locator(".site-topbar .language-switcher").isVisible(), `${tag}: the standalone login page keeps its language switch`);
    await audit(s.page, `${tag}/login`);
    await s.page.getByRole("tab", { name: m.account.tabs.signUp }).click();
    const submit = s.page.getByRole("button", { name: m.account.submit.signUp, exact: true });
    await s.page.locator('input[name="displayName"]').fill("Two Words");
    await s.page.locator('input[type="email"]').fill("a@example.test");
    await s.page.locator('input[autocomplete="new-password"]').first().fill("Synthetic1!");
    await s.page.locator('input[autocomplete="new-password"]').nth(1).fill("Synthetic1!");
    await s.page.getByTestId("agree-terms").check();
    ok(await submit.isDisabled(), `${tag}: two-word name blocks sign-up`);
    await s.page.locator('input[name="displayName"]').fill(loc === "ar" ? "أحمد علي حسن" : "Ahmed Ali Hassan");
    ok(await submit.isEnabled(), `${tag}: three-word name enables sign-up`);
    await audit(s.page, `${tag}/signup`);
    await s.ctx.close(); ok(s.errors.length === 0, `${tag}: no page errors`);
    // approved, consented: library, terms, credits, account, menu
    s = await setup(true, "approved", consent, "Ahmed Ali Hassan", width);
    const p = s.page;
    await p.goto(`${base}/${loc}/xray`, { waitUntil: "networkidle" });
    await p.getByRole("heading", { name: m.library.title, exact: true }).waitFor();
    ok(await p.getByTestId("preview-banner").count() === 0, `${tag}/library: no banner`);
    ok(!banned.test(await p.locator("body").innerText()), `${tag}/library: no provisional wording`);
    ok(await p.locator(".platform-intro").count() === 0, `${tag}/library: no subtitle`);
    ok(await p.locator(".site-topbar .language-switcher").count() === 0, `${tag}/library: no language switch in the top bar`);
    if (width < 1024) { await p.getByTestId("menu-toggle").click(); await p.getByRole("dialog").waitFor(); }
    const switchLink = p.locator(`.language-switcher a[lang="${loc === "en" ? "ar" : "en"}"]:visible`);
    ok(await switchLink.count() === 1, `${tag}/library: one language switch reachable from the ${width < 1024 ? "menu" : "sidebar"}`);
    if (width < 1024) await p.keyboard.press("Escape");
    ok(await p.locator("footer").innerText().then((t) => !/clinical|سريري|تشخيص/.test(t)), `${tag}/library: no legal text in footer`);
    await audit(p, `${tag}/library`);
    await p.locator(".category-choice").first().click();
    await p.locator('li[data-testid^="exam-"]').first().waitFor();
    ok(!banned.test(await p.locator("main").innerText()), `${tag}/category: no provisional wording`);
    await audit(p, `${tag}/category`);
    await p.goto(`${base}/${loc}/terms`, { waitUntil: "networkidle" });
    const terms = await p.locator("main").innerText();
    ok(terms.includes(m.terms.patients.p3), `${tag}/terms: shielding sentence`);
    ok(terms.includes(m.terms.patients.p1), `${tag}/terms: legal note`);
    await audit(p, `${tag}/terms`);
    await p.goto(`${base}/${loc}/credits`, { waitUntil: "networkidle" });
    await p.getByRole("heading", { name: m.credits.title, level: 1 }).waitFor();
    ok((await p.getByTestId("credits-notice").innerText()) === m.credits.notice, `${tag}/credits: legal notice`);
    ok(!banned.test(await p.locator("main").innerText().then((t) => t.replace(m.credits.pendingLicense, ""))), `${tag}/credits: no provisional wording`);
    await audit(p, `${tag}/credits`);
    await p.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    await p.getByTestId("account-approved").waitFor();
    ok(await p.getByTestId("consent-card").count() === 0 && await p.getByTestId("consent-done").count() === 1, `${tag}/account: consent shown as a small line`);
    ok(!(await p.locator("main").innerText()).includes(m.account.status.approved.title), `${tag}/account: no approved banner text`);
    ok(await p.locator("main").getByRole("button", { name: m.account.signOut, exact: true }).count() === 0, `${tag}/account: no sign-out in the page body`);
    if (width < 1024) { await p.getByTestId("menu-toggle").click(); await p.getByRole("dialog").waitFor(); }
    const out = p.getByRole("button", { name: m.account.signOut, exact: true });
    ok(await out.isVisible(), `${tag}/menu: sign-out in side menu`);
    await audit(p, `${tag}/account+menu`);
    await out.click();
    await p.getByRole("tab", { name: m.account.tabs.signIn }).waitFor();
    ok(true, `${tag}: sign-out returns to login`);
    await s.ctx.close(); ok(s.errors.length === 0, `${tag}: no page errors ${s.errors}`);
    // pending: waiting message only here
    s = await setup(true, "pending", consent, "Ahmed Ali Hassan", width);
    await s.page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    await s.page.getByTestId("account-pending").waitFor();
    ok((await s.page.locator("main").innerText()).includes(m.account.status.pending.title), `${tag}: waiting message for pending`);
    ok(await s.page.locator("nav.site-nav").count() === 0, `${tag}: pending sees standalone page`);
    await audit(s.page, `${tag}/pending`);
    await s.ctx.close();
    // consent needed: card
    s = await setup(true, "approved", "2000-01-01", "Ahmed Ali Hassan", width);
    await s.page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
    await s.page.getByTestId("consent-card").waitFor();
    await audit(s.page, `${tag}/consent-needed`);
    await s.ctx.close();
  }
  console.log(`UI-1 audit OK: ${checks} checks, ${audits} axe runs`);
} finally { await browser.close(); server.close(); }
