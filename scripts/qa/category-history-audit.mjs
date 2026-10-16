// Owner clarification: browser Back, not a custom return link, restores categories.
// Local static export, synthetic approved session, no real account or hosted preview.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const hosted = await startServer("out", 0);
const base = `http://127.0.0.1:${hosted.port}`;
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
mkdirSync("/tmp/rad054-history", { recursive: true });
let checks = 0, audits = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
async function audit(page, label) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no overflow`);
  audits++;
}
try {
  for (const locale of ["en", "ar"]) for (const width of [390, 1440]) {
    const tag = `${locale}-${width}`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...(width === 390 ? { isMobile: true, hasTouch: true } : {}) });
    const errors = [];
    await ctx.addInitScript((value) => localStorage.setItem("sb-abcdefghijklmnop-auth-token", value), JSON.stringify(session));
    await ctx.route("**/*", async (route) => {
      const req = route.request(), url = new URL(req.url());
      if (url.origin === base) return route.continue();
      assert.equal(url.origin, "https://abcdefghijklmnop.supabase.co", "synthetic service only");
      const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
      const json = (body) => route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(body) });
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (url.pathname === "/rest/v1/profiles") return json({ status: "approved", role: "participant", participant_code: "P-test", consent_version: consent });
      if (url.pathname === "/rest/v1/events" || url.pathname === "/rest/v1/rpc/touch_last_seen") return route.fulfill({ status: 201, headers });
      assert.fail(`unexpected request ${req.method()} ${url.pathname}`);
    });
    const page = await ctx.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    // Enter through real application navigation, so Home is the preceding history entry.
    await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
    await page.getByTestId("home-dashboard").waitFor();
    if (width === 390) {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("dialog").locator(`a[href="/${locale}/xray"]`).click();
    } else {
      await page.locator(`aside a[href="/${locale}/xray"]`).click();
    }
    await page.getByTestId("library-categories").waitFor();
    for (const category of ["body", "upper-limb", "lower-limb"]) {
      const historyBefore = await page.evaluate(() => history.length);
      await page.locator(`[data-region="${category}"]`).click();
      const list = page.getByTestId(`library-region-${category}`);
      await list.waitFor();
      if (category === "body") ok(await page.evaluate(() => history.length) === historyBefore + 1, `${tag}/${category}: choosing category adds a Back step`);
      await page.goBack();
      await page.getByTestId("library-categories").waitFor();
      ok(new URL(page.url()).pathname === `/${locale}/xray`, `${tag}/${category}: Back stays in library, not Home`);
      ok(!new URL(page.url()).hash, `${tag}/${category}: Back removes category`);
      ok(await page.locator('.exam-card').count() === 0, `${tag}/${category}: Back hides exams`);
      ok(await page.locator(`[data-region="${category}"]`).evaluate((node) => node === document.activeElement), `${tag}/${category}: focus returns to category`);
      await page.goForward();
      await list.waitFor();
      ok(new URLSearchParams(new URL(page.url()).hash.slice(1)).get("category") === category, `${tag}/${category}: Forward restores category`);
      ok(await page.getByTestId("back-to-categories").count() === 0, `${tag}/${category}: no custom category return link`);
      await page.reload({ waitUntil: "networkidle" });
      await list.waitFor();
      await page.goBack();
      await page.getByTestId("library-categories").waitFor();
      ok(new URL(page.url()).pathname === `/${locale}/xray`, `${tag}/${category}: Back after reload restores categories`);
      await page.goForward();
      await list.waitFor();
      const hrefs = await page.locator('.exam-card a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      for (const href of hrefs) {
        await page.locator(`.exam-card a[href="${href}"]`).click();
        await page.waitForURL(`${base}${href}`);
        await page.getByTestId("mode-practice").waitFor();
        ok(await page.getByTestId("back-to-exams").count() === 0, `${tag}/${href}: no extra exam return link`);
        await page.goBack();
        await list.waitFor();
        ok(await page.locator('.exam-card a').count() === hrefs.length, `${tag}/${href}: exam Back restores its list`);
      }
      // Search, then Back: the category list must return even with a filtered result set.
      await page.getByRole("searchbox").fill("not-a-real-exam");
      await page.locator(".library-empty").waitFor();
      ok(await page.locator('.exam-card').count() === 0, `${tag}/${category}: filtered list`);
      await page.goBack();
      await page.getByTestId("library-categories").waitFor();
      await audit(page, `${tag}/${category}`);
    }
    // Repeating selection after Back replaces the Forward branch, without stale filters or a loop.
    await page.locator('[data-region="body"]').click();
    await page.getByTestId("library-region-body").waitFor();
    ok(await page.locator('.exam-card').count() > 0, `${tag}: new selection clears old search`);
    await page.goBack();
    await page.getByTestId("library-categories").waitFor();
    await page.locator('[data-region="lower-limb"]').click();
    await page.getByTestId("library-region-lower-limb").waitFor();
    ok(await page.locator('.exam-card').count() > 0, `${tag}: different category has no stale search`);
    await audit(page, `${tag}/selected`);
    await page.screenshot({ path: `/tmp/rad054-history/${tag}-selected.png`, fullPage: true });
    // Device/browser Back twice: selected -> categories -> Home.
    await page.goBack();
    await page.getByTestId("library-categories").waitFor();
    await page.screenshot({ path: `/tmp/rad054-history/${tag}-back-categories.png`, fullPage: true });
    await page.goBack();
    await page.getByTestId("home-dashboard").waitFor();
    ok(new URL(page.url()).pathname === `/${locale}`, `${tag}: second Back reaches Home without a loop`);
    ok(errors.length === 0, `${tag}: no page errors ${errors.join(", ")}`);
    await ctx.close();
    console.log(`ok ${tag}`);
  }
  console.log(`PASS ${checks} history checks / ${audits} axe audits`);
} finally {
  await browser.close();
  await new Promise((resolve) => hosted.server.close(resolve));
}
