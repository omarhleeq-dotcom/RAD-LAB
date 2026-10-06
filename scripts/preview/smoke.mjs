// Pilot-preview smoke test: serves the STATIC EXPORT (`npm run build:pages` → out/) the way Cloudflare Pages will,
// then drives it in Chromium at mobile size (Playwright is not a project dependency: `npm i --no-save playwright`).
//
//   npm run build:pages && npm run preview:smoke
//
// Checks: headers / robots / redirect / 404; banner + noindex meta on every page in EN and AR; EN↔AR switch; every
// network request is same-origin and nothing logs a console / CSP error; then the real-UI scenario runner
// (scripts/qa/run-matrix.mjs, incl. golden-image comparison) for one fully correct exam and one exam with critical
// findings on a mobile viewport in both languages.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { startServer } from "./serve-out.mjs";

const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const { server, port } = await startServer("out", Number(process.env.PORT ?? 0));
const BASE = `http://127.0.0.1:${port}`;
let failed = 0;
const ok = (name, cond, extra = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${cond ? "" : ` ${extra}`}`); };

// 1. Static-host behaviour.
const get = (p) => fetch(`${BASE}${p}`, { redirect: "manual" });
let r = await get("/");
ok("/ redirects to /en", r.status === 302 && r.headers.get("location") === "/en", `${r.status} ${r.headers.get("location")}`);
r = await get("/en");
ok("/en 200 with noindex + security headers", r.status === 200 && /noindex/.test(r.headers.get("x-robots-tag") ?? "") && r.headers.get("x-content-type-options") === "nosniff" && !!r.headers.get("content-security-policy"));
r = await get("/robots.txt");
ok("robots.txt disallows all", /Disallow: \//.test(await r.text()));
r = await get("/no-such-page");
ok("unknown path → 404 (no SPA fallback)", r.status === 404);

// 2. Pages in a mobile browser, both languages.
const browser = await chromium.launch();
for (const loc of ["en", "ar"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (q) => { if (!q.url().startsWith(BASE) && !q.url().startsWith("data:") && !q.url().startsWith("blob:")) external.push(q.url()); });
  for (const path of [`/${loc}`, `/${loc}/simulation/chest-pa-erect`]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const banner = page.locator('[data-testid="preview-banner"]');
    ok(`${loc} ${path}: banner visible with the exact text`, (await banner.isVisible()) && (await banner.innerText()).trim() === msgs[loc].common.previewBanner);
    ok(`${loc} ${path}: meta robots noindex`, /noindex/.test((await page.locator('meta[name="robots"]').first().getAttribute("content")) ?? ""));
    ok(`${loc} ${path}: html lang/dir`, (await page.getAttribute("html", "lang")) === loc && (await page.getAttribute("html", "dir")) === (loc === "ar" ? "rtl" : "ltr"));
    ok(`${loc} ${path}: no horizontal overflow at 390 px`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  // Language switch keeps the page.
  const other = loc === "en" ? "ar" : "en";
  await page.locator(`nav a[lang="${other}"]`).tap();
  await page.waitForURL(`**/${other}/simulation/chest-pa-erect`);
  ok(`${loc}→${other} switch keeps the simulation page; banner now ${other}`, (await page.locator('[data-testid="preview-banner"]').innerText()).trim() === msgs[other].common.previewBanner);
  ok(`${loc}: every request same-origin`, external.length === 0, external.join(","));
  ok(`${loc}: no console / CSP errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}
await browser.close();

// 3. One correct exam and critical-finding exams through the real UI + golden images (mobile, EN + AR).
// (async spawn: the static server above lives in this process and must keep answering.)
const status = await new Promise((done) =>
  spawn("node", ["scripts/qa/run-matrix.mjs", "--devices=mobile", "--only=correct,marker-L-wrong-side,motion-none,combo-all-wrong"], {
    env: { ...process.env, BASE, OUT: process.env.OUT ?? "/tmp/rad-lab-preview-smoke" }, stdio: "inherit",
  }).on("close", done),
);
ok("scenario runner (correct + critical-finding scenarios, mobile, EN + AR)", status === 0, `exit ${status}`);

server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall preview smoke checks passed");
process.exit(failed ? 1 : 0);
