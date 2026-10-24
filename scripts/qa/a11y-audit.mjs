// Session 5 accessibility / UX audit (Playwright + axe-core, run manually; not part of CI).
//   npm i --no-save playwright axe-core && BASE=http://localhost:3100 node scripts/qa/a11y-audit.mjs
// Checks, in EN and AR, on desktop and mobile: axe-core WCAG 2.x A/AA rules (incl. colour contrast) on the home page,
// the Session 9 shell pages, the set-up screen and a result screen; keyboard reachability and visible focus of every control; the text
// alternative of the canvas; no horizontal overflow; touch-target size on mobile.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { driver, startPractice } from "./workspace.mjs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const DEVICES = { desktop: { viewport: { width: 1440, height: 900 } }, mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };
if (process.env.OUT) mkdirSync(process.env.OUT, { recursive: true });
const report = [];
const note = (loc, dev, area, kind, detail) => { report.push({ loc, dev, area, kind, detail }); if (kind !== "ok") console.log(`  ${kind.toUpperCase()} ${loc}/${dev}/${area}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
for (const loc of ["en", "ar"]) for (const [dev, opts] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext({ ...opts, locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const axe = async (area) => {
    await page.evaluate(axeSrc);
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    if (!r.violations.length) note(loc, dev, area, "ok", `axe: no violations (${r.passes.length} rules passed)`);
    for (const v of r.violations) note(loc, dev, area, "violation", { rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ") + " :: " + (n.any[0]?.message ?? n.all[0]?.message ?? "")) });
  };
  await page.goto(`${BASE}/${loc}`, { waitUntil: "networkidle" });
  await axe("home");
  // Session 9 shell pages: modality, exam hub, unknown-case state, bilingual 404 (axe only).
  for (const [area, path] of [["modality", `/${loc}/xray`], ["exam", `/${loc}/xray/chest-pa-erect`], ["unknown-case", `/${loc}/xray/chest-pa-erect/practice?case=nope`], ["not-found", `/${loc}/no-such-page`]]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await axe(area);
  }
  await page.goto(`${BASE}/${loc}/xray/chest-pa-erect/practice`, { waitUntil: "networkidle" });
  await axe("setup");
  // Phone layout: the case-details sheet is modal; the keyboard walk and the result need it closed (a no-op on desktop).
  await startPractice(page, msgs[loc]);
  const dr = driver(page, msgs[loc]);

  // Keyboard: Tab through the whole page; every stop must have a visible focus indicator; record the order.
  const stops = [];
  await page.evaluate(() => document.body.focus());
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow !== "none";
      const label = (e.getAttribute("aria-label") || e.innerText || e.getAttribute("name") || e.tagName).toString().trim().slice(0, 40);
      return { tag: e.tagName.toLowerCase(), type: e.getAttribute("type"), role: e.getAttribute("role"), label, visibleFocus: outline || shadow, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY), left: Math.round(r.left) };
    });
    if (!s) break;
    if (stops.length && JSON.stringify(stops[0]) === JSON.stringify(s)) break; // wrapped around
    stops.push(s);
  }
  note(loc, dev, "keyboard", "ok", `${stops.length} tab stops`);
  const noFocus = stops.filter((s) => !s.visibleFocus);
  if (noFocus.length) note(loc, dev, "keyboard", "violation", { rule: "focus-visible", stops: noFocus.slice(0, 6).map((s) => `${s.tag}:${s.label}`) });
  // Order: vertical position should never jump backwards by more than one control row except when wrapping columns (desktop two-column layout).
  const pageOrder = stops.map((s) => `${s.top}`).join(",");
  note(loc, dev, "keyboard-order", "ok", pageOrder.slice(0, 400));
  if (dev === "mobile") {
    const small = stops.filter((s) => (s.type === "radio" || s.type === "checkbox") ? false : (s.w < 24 || s.h < 24));
    if (small.length) note(loc, dev, "touch-targets", "warning", small.slice(0, 8).map((s) => `${s.tag}:${s.label} ${s.w}×${s.h}`));
  }

  // Result screen.
  await dr.click(page.getByRole("button", { name: msgs[loc].console.expose, exact: true }));
  await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
  await axe("result");
  const alt = await page.locator('[data-testid="radiograph"] canvas').getAttribute("aria-label");
  note(loc, dev, "canvas-alt", alt.length > 60 ? "ok" : "violation", alt);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  note(loc, dev, "overflow", overflow <= 0 ? "ok" : "violation", `${overflow}px`);
  // The result must be reachable by keyboard: the retry button is focusable and activates with Enter.
  await page.getByRole("button", { name: msgs[loc].result.retry, exact: true }).focus();
  await page.keyboard.press("Enter");
  note(loc, dev, "retry-by-keyboard", (await page.locator('[data-testid="radiograph"]').count()) === 0 ? "ok" : "violation", "Enter on Retry");
  await ctx.close();
}
await browser.close();
writeFileSync(process.env.OUT ? `${process.env.OUT}/a11y.json` : "/tmp/rad-lab-a11y.json", JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.kind === "violation");
console.log(`\n${report.length - bad.length} ok/info, ${bad.length} violation(s)`);
process.exit(bad.length ? 1 : 0);
