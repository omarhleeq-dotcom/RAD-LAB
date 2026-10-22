// RAD-045: local static export only; abort external requests and never follow source links.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";

const messages = Object.fromEntries(["en", "ar"].map((loc) => [loc, JSON.parse(readFileSync(`messages/${loc}.json`, "utf8"))]));
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const output = process.env.OUT ?? "/tmp/rad-045-browser";
mkdirSync(output, { recursive: true });
let checks = 0, axeRuns = 0;
const ok = (label, value) => { assert.ok(value, label); checks++; };
const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
function htmlPaths(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? htmlPaths(join(dir, entry.name)) : entry.name.endsWith(".html") ? [join(dir, entry.name)] : []);
}
const pages = htmlPaths("out");
// Every normal exported route, including account/terms/owner, inherits the locale footer.
for (const path of pages.filter((p) => /^out\/(en|ar)(\/|\.html)/.test(p))) {
  const loc = path.match(/^out\/(en|ar)/)[1], html = readFileSync(path, "utf8");
  ok(`${path}: locale footer`, /<footer\b[^>]*>[\s\S]*?<a[^>]*href="\/(en|ar)\/credits"/.test(html) && html.includes(`href="/${loc}/credits"`));
}
async function audit(page, label) {
  ok(`${label}: one main`, await page.locator("main").count() === 1 && await page.locator("main main").count() === 0);
  ok(`${label}: overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok(`${label}: noindex`, await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.length > 0 && nodes.every((node) => node.content.includes("noindex"))));
  ok(`${label}: no top banner (D1)`, await page.getByTestId("preview-banner").count() === 0);
  await page.evaluate(axeSrc);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], label);
  checks++; axeRuns++;
}
try {
  for (const loc of ["en", "ar"]) for (const width of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const external = [], errors = [];
    await ctx.route("**/*", (route) => {
      if (new URL(route.request().url()).origin === base) return route.continue();
      external.push(route.request().url()); return route.abort();
    });
    const page = await ctx.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const tag = `${loc}/${width}`, m = messages[loc];
    await page.goto(`${base}/${loc}/credits`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1, name: m.credits.title }).waitFor();
    ok(`${tag}: direction`, await page.locator("html").getAttribute("dir") === (loc === "ar" ? "rtl" : "ltr"));
    const entries = page.getByTestId("credit-entry"), expectedCount = (readFileSync("src/data/credits.ts", "utf8").match(/"assetId":/g) ?? []).length;
    ok(`${tag}: all entries`, await entries.count() === expectedCount);
    const content = await page.locator("main").innerText();
    ok(`${tag}: no internal codes or paths`, !/\b[AO]-\d{3}\b|\bS-\w|docs\/|src\/|assets\//.test(content));
    ok(`${tag}: deferred NIH clear`, content.includes(m.credits.deferred));
    ok(`${tag}: all sections`, await page.locator("main section").count() === 3);
    ok(`${tag}: no repeated images`, await page.locator("main img, main canvas").count() === 0);
    // Exercise the entire long page and every source link's box without navigating externally.
    for (const entry of await entries.all()) {
      await entry.scrollIntoViewIfNeeded();
      ok(`${tag}: complete entry`, await entry.getByRole("heading", { level: 3 }).isVisible());
    }
    for (const link of await page.locator('main a[href^="https://"]').all()) {
      const box = await link.boundingBox();
      ok(`${tag}: wrapped source link`, box && box.x >= 0 && box.x + box.width <= width + 1);
    }
    await audit(page, `${tag}/credits`);
    await page.screenshot({ path: `${output}/${loc}-${width}-credits.png`, fullPage: true });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${loc}-${width}-top.png` });
    for (const section of await page.locator("main section").all()) {
      await section.locator("h2").scrollIntoViewIfNeeded();
      ok(`${tag}: full section visible`, await section.locator("h2").isVisible());
    }
    // Keyboard skip link, visible focus, and footer access by keyboard.
    await page.goto(`${base}/${loc}/credits`, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    ok(`${tag}: skip receives focus`, await page.locator('a[href="#main-content"]').evaluate((el) => el === document.activeElement));
    await page.keyboard.press("Enter");
    ok(`${tag}: skip targets main`, await page.locator("main").evaluate((el) => el === document.activeElement));
    const footer = page.locator(`footer a[href="/${loc}/credits"]`);
    for (let i = 0; i < 150 && !await footer.evaluate((el) => el === document.activeElement); i++) await page.keyboard.press("Tab");
    ok(`${tag}: keyboard reaches footer`, await footer.evaluate((el) => el === document.activeElement));
    ok(`${tag}: focus visible`, await footer.evaluate((el) => { const s = getComputedStyle(el); return el.matches(":focus-visible") && s.outlineStyle !== "none" && s.outlineWidth !== "0px"; }));
    const other = loc === "en" ? "ar" : "en";
    await page.locator(`header nav a[lang="${other}"]`).click();
    await page.getByRole("heading", { level: 1, name: messages[other].credits.title }).waitFor();
    ok(`${tag}: language keeps route`, new URL(page.url()).pathname === `/${other}/credits`);
    await page.goto(`${base}/${loc}`, { waitUntil: "networkidle" });
    await page.locator(`footer a[href="/${loc}/credits"]`).click();
    await page.waitForURL(`${base}/${loc}/credits`);
    ok(`${tag}: home footer navigation`, new URL(page.url()).pathname === `/${loc}/credits`);
    await page.goto(`${base}/missing-rad-045`, { waitUntil: "networkidle" });
    for (const code of ["en", "ar"]) ok(`${tag}: bilingual 404 footer ${code}`, await page.locator(`footer a[href="/${code}/credits"]`).isVisible());
    await audit(page, `${tag}/404`);
    await page.locator(`footer a[href="/${loc}/credits"]`).click();
    await page.waitForURL(`${base}/${loc}/credits`);
    ok(`${tag}: 404 footer navigation`, new URL(page.url()).pathname === `/${loc}/credits`);
    // Discover practice routes from the export, so new exams need no audit-code list.
    const practicePaths = pages.filter((p) => p.startsWith(`out/${loc}/`) && p.endsWith("/practice.html"));
    for (const file of practicePaths) {
      const path = file.slice(3, -5);
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: m.console.expose, exact: true }).click();
      await page.locator("#result-heading").waitFor();
      const credit = page.locator('section[aria-labelledby="result-heading"] figure figcaption');
      ok(`${tag}/${path}: credit displayed`, await credit.isVisible());
      ok(`${tag}/${path}: existing credit and footer`, (await credit.innerText()).length > 50 && await page.locator(`footer a[href="/${loc}/credits"]`).count() === 1);
      await audit(page, `${tag}${path}/result`);
      if (path.includes("chest-ap")) ok(`${tag}: original NIH citation retained`, (await credit.innerText()).includes("3462-3471"));
    }
    ok(`${tag}: result routes discovered`, practicePaths.length > 0);
    assert.deepEqual(external, [], `${tag}: unexpected external requests`);
    assert.deepEqual(errors, [], `${tag}: browser errors`);
    console.log(`PASS ${tag}: credits, keyboard, language, footer, 404, ${practicePaths.length} results; no external requests`);
    await ctx.close();
  }
  console.log(`PASS ${checks} checks; ${axeRuns} axe runs; screenshots ${output}`);
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
