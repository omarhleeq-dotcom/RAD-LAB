// Reproducible owner review: local UI only, shared phone-control helper; no store injection.
// BASE=http://localhost:3100 CHROMIUM=/usr/bin/chromium node scripts/qa/rad-069a-review.mjs before|after
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { driver, startPractice } from "./workspace.mjs";
const stage = process.argv[2];
assert(["before", "after"].includes(stage));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const rows = [];
const forCase = (s) => s.replace(/^\{sex, select, female \{(.*?)\} other \{.*\}\}$/s, "$1");
for (const locale of ["en", "ar"]) for (const width of [390, 1440]) for (const attempt of ["fail", "pass"]) {
  const height = width === 390 ? 844 : 900;
  const ctx = await browser.newContext({ viewport: { width, height }, ...(width === 390 ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const m = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  await page.goto(`${process.env.BASE ?? "http://localhost:3100"}/${locale}/xray/chest-pa-erect/practice`, { waitUntil: "networkidle" });
  await startPractice(page, m);
  const dr = driver(page, m);
  if (attempt === "pass") {
    const radio = (name) => page.locator("label").filter({ has: page.getByRole("radio", { name, exact: true }) });
    for (const name of [m.console.projections["pa-erect"], m.positioning.chinOptions.elevated, m.positioning.shoulderOptions["rolled-forward"], "L", forCase(m.patient.breathingOptions["deep-inspiration-hold"]), forCase(m.patient.motionOptions["remain-still"])]) await dr.click(radio(name));
    for (const [name, value] of [[m.positioning.rotation, 0], [m.positioning.centerX, 0], [m.positioning.centerY, 18.5], [m.positioning.collWidth, 33], [m.positioning.collHeight, 36], [m.console.sid, 180], [m.console.kvp, 115], [m.console.mas, 8]]) await dr.slider(name, value); // station 8 = 3.2 mAs
  }
  await dr.click(page.getByRole("button", { name: m.console.expose, exact: true }));
  await page.locator('[data-testid="radiograph"][data-status="ready"]').waitFor({ timeout: 30000 });
  assert(await page.getByText(attempt === "pass" ? m.result.passed : m.result.failed, { exact: true }).isVisible());
  const metrics = await page.locator('#result-heading').evaluate((heading) => {
    const panel = heading.closest("section");
    let scroller = panel.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const s = scroller ?? document.documentElement;
    const y = panel.getBoundingClientRect().top + (scroller ? s.scrollTop - s.getBoundingClientRect().top : window.scrollY);
    s.scrollTop = 0;
    return { scrollHeight: s.scrollHeight, viewportHeight: window.innerHeight, containerHeight: s.clientHeight, screens: s.scrollHeight / window.innerHeight, resultHeight: panel.getBoundingClientRect().height, resultStart: y };
  });
  const canvasData = await page.locator('[data-testid="radiograph"] canvas').evaluate((c) => c.toDataURL());
  const pixels = createHash("sha256").update(canvasData).digest("hex");
  const tag = `${locale}-${width}-${attempt}`;
  if (stage === "after") {
    const old = JSON.parse(readFileSync("/tmp/rad069a-before.json", "utf8")).find((r) => r.tag === tag);
    assert.equal(pixels, old.pixels, `${tag}: result pixels changed — STOP`);
    // Every collapsed panel is keyboard operable; focus remains on its trigger on close.
    const triggers = page.locator('section[aria-labelledby="result-heading"] button[aria-expanded]');
    for (const trigger of await triggers.all()) {
      if (!(await trigger.isVisible())) continue;
      await trigger.focus();
      await page.keyboard.press("Enter");
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Enter");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert(await trigger.evaluate((el) => document.activeElement === el));
    }
    if (width === 1440) {
      const image = page.locator("figure");
      const layout = await image.evaluate((el) => {
        const column = el.parentElement;
        const grid = column.parentElement;
        const a = column.getBoundingClientRect(), b = column.nextElementSibling.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + grid.getBoundingClientRect().top + 160);
        return { mirrored: getComputedStyle(grid).direction === "rtl" ? a.x > b.x : a.x < b.x, sticky: getComputedStyle(column).position === "sticky" };
      });
      assert(layout.mirrored && layout.sticky, "desktop columns/sticky");
      assert(Math.abs((await image.locator("..").boundingBox()).y - 16) < 3, "image stays at viewport top while lists scroll");
    }
    // Include expanded feedback/evidence, image info and technique in axe; close everything before the screenshot.
    const collapsed = page.locator('section[aria-labelledby="result-heading"] button[aria-expanded="false"]:visible');
    while (await collapsed.count()) await collapsed.first().click();
    await page.evaluate(readFileSync("node_modules/axe-core/axe.min.js", "utf8"));
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations);
    assert.deepEqual(violations.map((v) => v.id), []);
    const expanded = page.locator('section[aria-labelledby="result-heading"] button[aria-expanded="true"]:visible');
    while (await expanded.count()) await expanded.last().click();
  }
  // Capture the complete result flow, including the phone's internal scroll container.
  await page.locator('#result-heading').evaluate((heading) => {
    let e = heading.closest("section").parentElement;
    while (e && !/(auto|scroll)/.test(getComputedStyle(e).overflowY)) e = e.parentElement;
    if (e) { e.scrollTop = 0; e.style.overflow = "visible"; e.style.flex = "none"; e.style.height = `${e.scrollHeight}px`; e.parentElement.style.height = "auto"; e.parentElement.style.overflow = "visible"; }
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `docs/review/rad-069a-${tag}-${stage}.png`, fullPage: true });
  rows.push({ tag, ...metrics, pixels });
  console.log(tag, metrics);
  await ctx.close();
}
await browser.close();
writeFileSync(`/tmp/rad069a-${stage}.json`, JSON.stringify(rows, null, 2));
