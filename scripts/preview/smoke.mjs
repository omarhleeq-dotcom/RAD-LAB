// Pilot-preview smoke test: serves the STATIC EXPORT (`npm run build:pages` → out/) the way Cloudflare Pages will,
// then drives it in Chromium at mobile size (Playwright is not a project dependency: `npm i --no-save playwright`).
//
//   npm run build:pages && npm run preview:smoke
//
// Checks: headers / robots / redirect / 404; every route of the Session 9 shell (home → modality → exam → Practice),
// every old URL → new URL redirect (host rules AND the client-side stub), deep-link refresh, unknown-case state; banner + noindex meta on every page in EN and AR; EN↔AR switch; every
// network request is same-origin and nothing logs a console / CSP error; then the real-UI scenario runner
// (scripts/qa/run-matrix.mjs, incl. golden-image comparison) for one fully correct exam and one exam with critical
// findings on a mobile viewport in both languages.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startServer } from "./serve-out.mjs";
import { supabaseOrigin } from "../pages/headers.mjs";

const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const { server, port } = await startServer("out", Number(process.env.PORT ?? 0));
const BASE = `http://127.0.0.1:${port}`;
// Pilot accounts (RAD-041a): the ONLY non-same-origin request allowed is the configured Supabase project (same validation as the CSP step).
const ALLOWED_ORIGIN = supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
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

// Every route is a real file (deep links work without a server), every old URL has its explicit redirect.
const ROUTES = (loc) => [`/${loc}`, `/${loc}/xray`, `/${loc}/xray/chest-pa-erect`, `/${loc}/xray/chest-pa-erect/practice`];
for (const loc of ["en", "ar"]) {
  for (const path of ROUTES(loc)) ok(`deep link ${path} → 200`, (await get(path)).status === 200);
  r = await get(`/${loc}/simulation/chest-pa-erect`);
  ok(`old URL /${loc}/simulation/chest-pa-erect → /${loc}/xray/chest-pa-erect/practice`, r.status === 302 && r.headers.get("location") === `/${loc}/xray/chest-pa-erect/practice`, `${r.status} ${r.headers.get("location")}`);
  for (const path of [`/${loc}/ct`, `/${loc}/mri`, `/${loc}/us`, `/${loc}/xray/no-such-exam`, `/${loc}/xray/chest-pa-erect/learn`, `/${loc}/xray/chest-pa-erect/assess`]) ok(`${path} → 404`, (await get(path)).status === 404);
}

// 2. Pages in a mobile browser, both languages.
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ["--no-sandbox"] } : {});
for (const loc of ["en", "ar"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (q) => { if (!q.url().startsWith(BASE) && !q.url().startsWith("data:") && !q.url().startsWith("blob:") && !(ALLOWED_ORIGIN && new URL(q.url()).origin === ALLOWED_ORIGIN)) external.push(q.url()); });
  for (const path of ROUTES(loc)) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    ok(`${loc} ${path}: no top banner (D1)`, (await page.locator('[data-testid="preview-banner"]').count()) === 0);
    ok(`${loc} ${path}: meta robots noindex`, /noindex/.test((await page.locator('meta[name="robots"]').first().getAttribute("content")) ?? ""));
    ok(`${loc} ${path}: html lang/dir`, (await page.getAttribute("html", "lang")) === loc && (await page.getAttribute("html", "dir")) === (loc === "ar" ? "rtl" : "ltr"));
    ok(`${loc} ${path}: no horizontal overflow at 390 px`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  // Navigation: home → modality → exam → Practice, breadcrumb back, refresh on a deep link.
  const m = msgs[loc];
  await page.goto(`${BASE}/${loc}`, { waitUntil: "networkidle" });
  ok(`${loc}: home lists X-ray as a link and CT / MRI / Ultrasound as coming soon (no links)`,
    (await page.locator('[data-testid="modality-xray"] a').count()) === 1 &&
    (await Promise.all(["ct", "mri", "us"].map(async (id) => (await page.locator(`[data-testid="modality-${id}"] a`).count()) === 0 && (await page.locator(`[data-testid="modality-${id}"]`).innerText()).includes(m.common.comingSoon))).then((a) => a.every(Boolean))));
  await page.locator('[data-testid="modality-xray"] a').tap();
  await page.waitForURL(`**/${loc}/xray`);
  ok(`${loc}: focus moved to <main> after the route change`, await page.evaluate(() => document.activeElement?.id === "main-content"));
  await page.locator('[data-testid="exam-chest-pa-erect"] a').tap();
  await page.waitForURL(`**/${loc}/xray/chest-pa-erect`);
  await page.locator('[data-testid="mode-practice"] a').tap();
  await page.waitForURL(`**/${loc}/xray/chest-pa-erect/practice`);
  await page.locator("h1").first().waitFor({ state: "visible" });
  ok(`${loc}: Practice workspace loaded (heading + expose button)`, await page.getByRole("button", { name: m.console.expose, exact: true }).count() > 0);
  await page.locator('nav[aria-label] ol a').nth(1).tap(); // breadcrumb: X-ray
  await page.waitForURL(`**/${loc}/xray`);
  await page.goBack();
  await page.waitForURL(`**/${loc}/xray/chest-pa-erect/practice`);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: m.console.expose, exact: true }).waitFor({ state: "visible" });
  ok(`${loc}: back button + refresh on the Practice deep link keep the workspace`, true);
  // Unknown ?case → in-page not-found; the language switch keeps the query.
  await page.goto(`${BASE}/${loc}/xray/chest-pa-erect/practice?case=nope`, { waitUntil: "networkidle" });
  ok(`${loc}: unknown ?case= shows the not-found state (${m.notFound.caseTitle})`, (await page.locator('[data-testid="not-found"] h1').innerText()) === m.notFound.caseTitle);
  const other = loc === "en" ? "ar" : "en";
  await page.locator(`nav a[lang="${other}"]`).tap();
  await page.waitForURL(`**/${other}/xray/chest-pa-erect/practice?case=nope`);
  ok(`${loc}→${other} switch keeps the page and ?case=; html lang now ${other}`, (await page.getAttribute("html", "lang")) === other);
  // Old link (host redirect) and the unknown-URL 404 page (bilingual, banner, noindex).
  await page.goto(`${BASE}/${loc}/simulation/chest-pa-erect`, { waitUntil: "networkidle" });
  ok(`${loc}: old URL lands on the new Practice URL`, new URL(page.url()).pathname === `/${loc}/xray/chest-pa-erect/practice`, page.url());
  const nf = await ctx.newPage(); // separate page: a 404 document legitimately logs "Failed to load resource"
  await nf.goto(`${BASE}/${loc}/no-such-page`, { waitUntil: "networkidle" });
  ok(`${loc}: 404 page is bilingual, has no banner and keeps noindex`,
    (await nf.locator('[data-testid="preview-banner"]').count()) === 0 &&
    (await nf.locator('[data-testid="not-found-en"]').isVisible()) && (await nf.locator('[data-testid="not-found-ar"]').isVisible()) &&
    /noindex/.test((await nf.locator('meta[name="robots"]').first().getAttribute("content")) ?? ""));
  ok(`${loc}: every request same-origin`, external.length === 0, external.join(","));
  ok(`${loc}: no console / CSP errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}
// Client-side fallback for the old URL when no host redirect rule applies (served from a copy without _redirects).
{
  const tmp = mkdtempSync(join(tmpdir(), "rad-lab-noredirects-"));
  cpSync("out", tmp, { recursive: true });
  rmSync(join(tmp, "_redirects"));
  const alt = await startServer(tmp, 0);
  for (const loc of ["en", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${alt.port}/${loc}/simulation/chest-pa-erect`);
    await page.waitForURL(`**/${loc}/xray/chest-pa-erect/practice`);
    ok(`${loc}: client-side stub forwards the old URL when the host rules are not applied`, true);
    await ctx.close();
  }
  alt.server.close();
  rmSync(tmp, { recursive: true, force: true });
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
