// RAD-054 phone feedback: local static export and synthetic auth only.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const hosted = await startServer("out", 0);
const base = `http://127.0.0.1:${hosted.port}`;
const messages = Object.fromEntries(["en", "ar"].map((locale) => [locale, JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"))]));
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const browser = await chromium.launch({ args: ["--no-sandbox"] });
mkdirSync("/tmp/rad054-phone", { recursive: true });
let checks = 0, audits = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
async function setup(locale, width, status = "approved", seeded = false) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  if (seeded) await ctx.addInitScript((value) => {
    if (!sessionStorage.getItem("seeded")) { localStorage.setItem("sb-abcdefghijklmnop-auth-token", value); sessionStorage.setItem("seeded", "1"); }
  }, JSON.stringify(session));
  const errors = [];
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    assert.equal(url.origin, "https://abcdefghijklmnop.supabase.co", "no real service or external assets");
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (data) => route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(data) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/auth/v1/token") return json(session);
    if (url.pathname === "/auth/v1/user") return json(user);
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return json({ status, role: "participant", participant_code: "P-test", consent_version: consent, display_name: null });
    if (url.pathname === "/rest/v1/events" || url.pathname === "/rest/v1/rpc/touch_last_seen") return route.fulfill({ status: 201, headers });
    if (url.pathname.startsWith("/rest/v1/rpc/")) return route.fulfill({ status: 201, headers, contentType: "application/json", body: "{}" }); // home reads the training summary; same stub as ui1-pages-audit
    assert.fail(`unexpected request ${req.method()} ${url.pathname}`);
  });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { ctx, page, errors, locale, width };
}
async function audit(page, label) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no overflow`);
  audits++;
}
async function login(page, locale) {
  const m = messages[locale].account;
  await page.getByLabel(m.email, { exact: true }).fill(user.email);
  await page.getByLabel(m.password, { exact: true }).fill("Synthetic1!");
  await page.getByRole("button", { name: m.submit.signIn, exact: true }).click();
}
try {
  for (const locale of ["en", "ar"]) for (const width of [390, 1440]) {
    const tag = `${locale}-${width}`;
    const { ctx, page, errors } = await setup(locale, width);
    await page.goto(`${base}/${locale}/account`, { waitUntil: "networkidle" });
    await login(page, locale);
    await page.waitForURL(`${base}/${locale}`);
    await page.getByTestId("home-dashboard").waitFor();
    ok(await page.getByTestId("home-dashboard").count() === 1, `${tag}: login opens home`);
    await audit(page, `${tag}: home`);
    // Account must still be usable by a signed-in participant (signout, consent, survey).
    await page.goto(`${base}/${locale}/account`, { waitUntil: "networkidle" });
    await page.getByTestId("account-approved").waitFor();
    ok(new URL(page.url()).pathname === `/${locale}/account`, `${tag}: deliberate account visit stays`);
    await page.goto(`${base}/${locale}/xray`, { waitUntil: "networkidle" });
    ok(await page.locator('.exam-card').count() === 0, `${tag}: category first`);
    ok(await page.locator('[data-region="upper-limb"] [data-graphic="upper-limb"]').count() === 1, `${tag}: full arm category`);
    ok(await page.locator('[data-region="lower-limb"] [data-graphic="lower-limb"]').count() === 1, `${tag}: full leg category`);
    await page.screenshot({ path: `/tmp/rad054-phone/${tag}-categories.png`, fullPage: true });
    for (const category of ["body", "upper-limb", "lower-limb"]) {
      await page.locator(`[data-region="${category}"]`).click();
      const list = page.getByTestId(`library-region-${category}`);
      await list.waitFor();
      const libraryURL = `${base}/${locale}/xray#category=${category}`;
      ok(page.url() === libraryURL, `${tag}/${category}: shareable category`);
      const hrefs = await page.locator('.exam-card a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      for (const href of hrefs) {
        await page.locator(`.exam-card a[href="${href}"]`).click();
        await page.getByTestId("back-to-exams").waitFor();
        ok(await page.getByTestId("back-to-exams").getAttribute("href") === `/${locale}/xray#category=${category}`, `${tag}/${href}: correct return target`);
        await page.goBack({ waitUntil: "networkidle" });
        await list.waitFor();
        ok(await page.locator('.exam-card a').count() === hrefs.length, `${tag}/${href}: browser Back restores exams`);
      }
      await page.reload({ waitUntil: "networkidle" });
      await list.waitFor();
      ok(await page.locator('.exam-card a').count() === hrefs.length, `${tag}/${category}: refresh restores exams`);
      await page.locator('.exam-card a').first().click();
      await page.getByTestId("back-to-exams").click();
      await list.waitFor();
      ok(page.url() === libraryURL, `${tag}/${category}: explicit return restores exams`);
      await page.locator('.exam-card a').first().click();
      // The modality breadcrumb uses the same category return target.
      const returnCrumb = page.locator(`main nav a[href="/${locale}/xray#category=${category}"]`);
      await returnCrumb.waitFor();
      ok(await returnCrumb.count() === 1, `${tag}/${category}: category breadcrumb`);
      await returnCrumb.click();
      await list.waitFor();
      await audit(page, `${tag}/${category}`);
      await page.screenshot({ path: `/tmp/rad054-phone/${tag}-${category}.png`, fullPage: true });
      if (category === "lower-limb" && width === 390) {
        for (const kind of ["foot-ap", "foot-oblique", "knee-ap", "knee-lateral", "ankle-ap", "ankle-lateral"]) {
          await page.locator(`.exam-card:has([data-graphic="${kind}"])`).screenshot({ path: `/tmp/rad054-phone/${locale}-${kind}.png` });
        }
        await page.evaluate(() => document.documentElement.style.fontSize = "200%");
        await audit(page, `${tag}/zoom`);
        await page.evaluate(() => document.documentElement.style.fontSize = "");
      }
      await page.getByTestId("back-to-categories").click();
      await page.getByTestId("library-categories").waitFor();
      ok(await page.locator('.exam-card').count() === 0, `${tag}/${category}: category Back hides exams`);
      ok(await page.locator(`[data-region="${category}"]`).evaluate((node) => node === document.activeElement), `${tag}/${category}: category focus restored`);
    }
    ok(errors.length === 0, `${tag}: no page errors: ${errors}`);
    await ctx.close();
    for (const status of ["pending", "suspended"]) {
      const s = await setup(locale, width, status);
      await s.page.goto(`${base}/${locale}/account`, { waitUntil: "networkidle" });
      await login(s.page, locale);
      await s.page.getByTestId(`account-${status}`).waitFor();
      ok(new URL(s.page.url()).pathname === `/${locale}/account`, `${tag}: ${status} stays gated`);
      await s.ctx.close();
    }
    // Unsafe returnTo uses Home; existing safe deep links are covered by unchanged session-gate-audit.
    const s = await setup(locale, width);
    await s.page.goto(`${base}/${locale}/account?returnTo=https://evil.invalid`, { waitUntil: "networkidle" });
    await login(s.page, locale);
    await s.page.waitForURL(`${base}/${locale}`);
    ok(true, `${tag}: unsafe return cannot redirect externally`);
    await s.ctx.close();
  }
  console.log(`PASS ${checks} checks / ${audits} axe audits; screenshots /tmp/rad054-phone/`);
} finally {
  await browser.close();
  await new Promise((resolve) => hosted.server.close(resolve));
}
