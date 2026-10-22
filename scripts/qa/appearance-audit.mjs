// RAD-054: localhost only; synthetic accounts, no live data, no hosted preview.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const disabled = process.env.UI_DISABLED === "1";
const hosted = disabled ? null : await startServer("out", 0);
const base = disabled ? process.env.BASE ?? "http://127.0.0.1:3100" : `http://127.0.0.1:${hosted.port}`;
assert.ok(new URL(base).hostname === "127.0.0.1" || new URL(base).hostname === "localhost");
const messages = Object.fromEntries(["en", "ar"].map((loc) => [loc, JSON.parse(readFileSync(`messages/${loc}.json`, "utf8"))]));
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const supa = "https://abcdefghijklmnop.supabase.co";
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
mkdirSync("/tmp/rad-054-r1", { recursive: true });
let checks = 0, audits = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
const drawings = new Map();
async function setup(loc, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 950 } });
  const errors = [], external = [], fonts = [];
  if (!disabled) await ctx.addInitScript((value) => localStorage.setItem("sb-abcdefghijklmnop-auth-token", value), JSON.stringify(session));
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) { if (url.pathname.startsWith("/fonts/")) fonts.push(url.pathname); return route.continue(); }
    external.push(url.pathname);
    assert.ok(!disabled && url.origin === supa, `Unexpected external origin ${url.origin}`);
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ status: "approved", role: "participant", participant_code: "P-test", consent_version: consent, display_name: "Synthetic Test Learner" }) });
    if (url.pathname === "/rest/v1/events" || url.pathname === "/rest/v1/rpc/touch_last_seen") return route.fulfill({ status: 201, headers });
    assert.fail(`Unexpected mocked request ${req.method()} ${url.pathname}`);
  });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { ctx, page, errors, fonts, external, loc, width };
}
async function audit(page, label) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no page overflow`);
  audits++;
}
async function drawer({ page, loc, width }) {
  const t = messages[loc].shell;
  const trigger = page.getByTestId("menu-toggle");
  if (width >= 1024) { ok(!await trigger.isVisible(), "desktop has no hamburger"); return; }
  await page.evaluate(() => window.scrollTo(0, 1200));
  const triggerBox = await trigger.boundingBox();
  ok(await page.evaluate(() => window.scrollY) > 500, "library actually scrolled");
  ok(triggerBox.y >= 0 && triggerBox.y + triggerBox.height <= 950, "menu remains in viewport after scroll");
  ok(await trigger.evaluate((node) => { const r = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), "menu reachable without returning to top");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const box = await dialog.boundingBox();
  ok(box.y === 0 && Math.abs(box.height - 950) <= 1, "drawer covers full viewport height");
  ok(await dialog.getByRole("link", { name: "English", exact: true }).isVisible(), "drawer language is at top");
  ok(await dialog.getByRole("button", { name: t.closeMenu }).evaluate((node) => node === document.activeElement), "close receives focus");
  const controls = dialog.locator('a,button');
  await controls.last().focus();
  await page.keyboard.press("Tab");
  ok(await dialog.evaluate((node) => node.contains(document.activeElement)), "focus remains in modal");
  await audit(page, `${loc}/${width}/drawer`);
  await page.screenshot({ path: `/tmp/rad-054-r1/${disabled ? "off" : "on"}-${loc}-${width}-drawer.png` });
  await page.keyboard.press("Escape");
  ok(!await dialog.isVisible(), "Escape closes drawer");
  ok(await trigger.evaluate((node) => node === document.activeElement), "focus returns to trigger");
  await trigger.click();
  const rtl = loc === "ar";
  await page.mouse.click(rtl ? 1 : width - 1, 500);
  ok(!await dialog.isVisible(), "backdrop closes drawer");
  await trigger.click();
  await dialog.getByRole("button", { name: t.closeMenu }).click();
  ok(!await dialog.isVisible(), "close button closes drawer");
  await page.evaluate(() => window.scrollTo(0, 0));
}
try {
  for (const loc of ["en", "ar"]) for (const width of [390, 1440]) {
    const test = await setup(loc, width), { page, ctx, errors, fonts, external } = test;
    const m = messages[loc], tag = `${disabled ? "off" : "on"}/${loc}/${width}`;
    await page.goto(`${base}/${loc}/xray`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: m.library.title, exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator('li[data-testid^="exam-"]');
    await page.getByTestId("library-categories").waitFor();
    ok(await cards.count() === 0 && await page.getByRole("searchbox").count() === 0, "no exam cards before category selection");
    ok(await page.locator(".category-choice").count() === 3 && await page.locator(".category-grid > li").count() === 5, "three available and two planned categories");
    for (const id of ["head", "spine"]) {
      const planned = page.getByTestId(`planned-category-${id}`);
      ok(await planned.isVisible() && await planned.innerText().then((text) => text.includes(m.common.comingSoon)), `${id} coming soon`);
      ok(await planned.locator("a,button").count() === 0, `${id} has no fake exam route`);
    }
    ok(await page.getByTestId("preview-banner").count() === 0, "no top banner (D1)");
    ok(!(await page.locator("footer").innerText()).includes("clinical"), "no legal wording in the footer (D2)");
    ok(await page.locator('footer .language-switcher').count() === 0, "no footer language");
    ok(await page.locator('.site-topbar .language-switcher').boundingBox().then((box) => box.y < 100), "language stays on top");
    ok(await page.locator('.site-nav .nav-planned').first().getAttribute("aria-disabled") === "true", "future entries inactive");
    ok(await page.locator('.nav-planned a, .nav-planned button').count() === 0, "future entries have no action");
    ok(fonts.some((font) => font.includes(loc === "ar" ? "IBMPlex" : "inter-latin")), "fonts loaded locally");
    ok(await page.locator('.platform-page').evaluate((node) => getComputedStyle(node).fontFamily.includes(document.documentElement.lang === "ar" ? "RAD Arabic" : "RAD Inter")), "correct locale font family");
    await audit(page, `${tag}/categories`);
    await page.screenshot({ path: `/tmp/rad-054-r1/${disabled ? "off" : "on"}-${loc}-${width}-categories.png`, fullPage: true });
    const hrefs = [], shapes = [], categoryCounts = new Map();
    const categoryIds = await page.locator(".category-choice").evaluateAll((nodes) => nodes.map((node) => node.dataset.region));
    for (const id of categoryIds) {
      await page.locator(`[data-region="${id}"]`).click();
      const section = page.getByTestId(`library-region-${id}`);
      await cards.first().waitFor();
      categoryCounts.set(id, await cards.count());
      ok(await page.locator('[data-testid^="library-region-"]').count() === 1 && await section.isVisible(), "only chosen category exams mounted");
      ok(await section.locator("h2").evaluate((node) => node === document.activeElement), "category heading receives focus");
      ok(await cards.locator("svg").count() === await cards.count(), "each exam has a graphic");
      ok(await page.locator('.library-notice').count() === 0, "no provisional notice (D1)");
      if (id === "body") ok(await section.locator('li[data-testid^="exam-chest-"]').count() === 3 && await section.locator('li[data-testid^="exam-pelvis-"]').count() === 1, "Body contains chest and pelvis");
      hrefs.push(...await cards.locator("a").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))));
      const svgs = await cards.evaluateAll((nodes) => nodes.map((node) => [node.dataset.testid, node.querySelector("svg").outerHTML]));
      for (const [examId, svg] of svgs) { if (drawings.has(examId)) assert.equal(svg, drawings.get(examId), `same anatomy across locales ${examId}`); else drawings.set(examId, svg); }
      shapes.push(...await cards.locator("svg").evaluateAll((nodes) => nodes.map((node) => node.innerHTML)));
      await audit(page, `${tag}/${id}`);
      await page.screenshot({ path: `/tmp/rad-054-r1/${disabled ? "off" : "on"}-${loc}-${width}-${id}.png`, fullPage: true });
      await page.goBack();
      await page.getByTestId("library-categories").waitFor();
      ok(await cards.count() === 0, "back unmounts exam cards");
      ok(await page.locator(`[data-region="${id}"]`).evaluate((node) => node === document.activeElement), "back restores chosen category focus");
    }
    ok(new Set(hrefs).size === hrefs.length, `${tag}: every exam once`);
    ok(new Set(shapes).size === hrefs.length, "each exam has distinct geometry, not merely a different id");
    if (!disabled) {
      const exported = readdirSync(`out/${loc}/xray`).filter((name) => name.endsWith(".html")).map((name) => `/${loc}/xray/${name.slice(0, -5)}`).sort();
      assert.deepEqual([...hrefs].sort(), exported, "every exported exam kept"); checks++;
    }
    for (const href of hrefs) ok((await page.request.get(`${base}${href}`)).ok(), `${tag}: exam link ${href}`);
    await page.locator('[data-region="body"]').click();
    await cards.first().waitFor();
    await drawer(test);
    const input = page.getByRole("searchbox");
    await input.fill("CHEST PA");
    ok(await cards.count() === 1, "English search in both locales");
    await input.fill("الصَّـدر");
    ok(await cards.count() === 3, "Arabic diacritics and tatweel normalized");
    await input.fill("wrist");
    ok(await cards.count() === 0, "search cannot expose another category's exams");
    await page.getByRole("heading", { name: m.library.emptyTitle }).waitFor();
    await audit(page, `${tag}/empty`);
    await page.locator('.library-empty').getByRole("button").click();
    ok(await cards.count() === categoryCounts.get("body") && await input.inputValue() === "", "clear restores only selected category");
    if (width === 390) {
      for (const extra of [360, 430]) { await page.setViewportSize({ width: extra, height: 950 }); await audit(page, `${tag}/${extra}`); }
      await page.setViewportSize({ width, height: 950 });
    }
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    await page.waitForFunction(() => Math.abs(parseFloat(document.documentElement.style.getPropertyValue("--site-bar-height")) - document.querySelector(".site-topbar").getBoundingClientRect().height) < 1);
    if (width === 390) {
      const menu = page.getByTestId("menu-toggle");
      ok(await menu.boundingBox().then((box) => box.y >= 0 && box.y + box.height < 950), "menu remains reachable at 200 percent");
    }
    await audit(page, `${tag}/200percent`);
    await page.goBack();
    await page.getByTestId("library-categories").waitFor();
    await audit(page, `${tag}/categories-200percent`);
    await page.evaluate(() => document.documentElement.style.fontSize = "");
    const other = loc === "en" ? "ar" : "en";
    await page.locator('.site-topbar').getByRole("link", { name: other === "ar" ? "العربية" : "English", exact: true }).click();
    await page.waitForURL(`${base}/${other}/xray`);
    await page.goto(`${base}${hrefs[0]}`, { waitUntil: "networkidle" });
    await page.getByTestId("mode-practice").waitFor();
    await audit(page, `${tag}/exam`);
    await page.getByRole("link", { name: m.exam.startCase, exact: true }).first().click();
    await page.locator("#case-heading").waitFor();
    ok(await page.locator('.site-layout').getAttribute('data-workspace') === "true", "workspace stays full width");
    ok(!await page.locator('.desktop-sidebar').isVisible(), "no desktop sidebar beside simulation");
    ok(!await page.locator("#case-heading").evaluate((node) => getComputedStyle(node).fontFamily.includes("RAD")), "new font does not leak into simulator");
    await audit(page, `${tag}/practice`);
    await page.goto(`${base}/${loc}`, { waitUntil: "networkidle" });
    await page.getByTestId("home-dashboard").waitFor();
    ok(!await page.locator("main").innerText().then((text) => text.includes("no account") || text.includes("بدون حساب")), "account claim removed");
    ok(await page.locator('main [data-testid^="exam-"], main [data-testid^="category-"], main [data-testid^="modality-"], main a').count() === 0, "home has no exam or category listings");
    ok(await page.locator(".dashboard-empty").isVisible() && await page.locator(".home-overview").innerText().then((text) => text.includes(m.home.emptyBody)), "honest empty dashboard without invented ratings");
    await page.screenshot({ path: `/tmp/rad-054-r1/${disabled ? "off" : "on"}-${loc}-${width}-home.png`, fullPage: true });
    await audit(page, `${tag}/home`);
    await page.goto(`${base}/not-a-real-route`, { waitUntil: "networkidle" });
    ok(await page.getByTestId("preview-banner").count() === 0, "404 page has no banner (D1)");
    await audit(page, `${tag}/404`);
    if (disabled) ok(external.length === 0, "accounts off: no external requests");
    ok(errors.length === 0, `${tag}: page errors ${errors.join(", ")}`);
    await ctx.close();
    console.log(`ok ${tag}`);
  }
  console.log(`PASS: ${checks} checks, ${audits} axe audits; ${drawings.size} unmirrored exam graphics`);
} finally {
  await browser.close();
  if (hosted) await new Promise((resolve) => hosted.server.close(resolve));
}
