// Session 12 Chest Lateral end-to-end + accessibility check (Playwright + axe-core; run manually, not part of CI).
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core && BASE=http://localhost:3100 node scripts/qa/lateral-audit.mjs
// EN/AR x desktop 1440 / mobile 390: the exam hub, the set-up screen (axe), a fully correct attempt driven through the REAL UI
// (score 100 expected), a deliberately wrong attempt (critical findings expected), the result (axe), no horizontal overflow,
// and screenshots in OUT (default /tmp/rad-lab-qa-lateral). Exit code 1 on any failure.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { driver, startPractice } from "./workspace.mjs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "/tmp/rad-lab-qa-lateral";
mkdirSync(OUT, { recursive: true });
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const DEVICES = { desktop: { viewport: { width: 1440, height: 900 } }, mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };
let failed = 0;
const ok = (name, cond, extra = "") => { if (!cond) { failed++; console.log("  FAIL", name, extra); } };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const MSGS = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
for (const loc of ["en", "ar"]) for (const [dev, opts] of Object.entries(DEVICES)) {
  const msgs = MSGS[loc];
  const tag = `${loc}/${dev}`;
  const ctx = await browser.newContext({ ...opts, locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const axe = async (area) => {
    await page.evaluate(axeSrc);
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    ok(`${tag} axe ${area}`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, n: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) }))));
  };
  const noOverflow = async (area) => ok(`${tag} no horizontal overflow ${area}`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

  await page.goto(`${BASE}/${loc}/xray/chest-lateral-erect`, { waitUntil: "networkidle" });
  await axe("exam hub");
  await page.goto(`${BASE}/${loc}/xray/chest-lateral-erect/practice`, { waitUntil: "networkidle" });
  await axe("setup");
  await startPractice(page, msgs);
  await noOverflow("setup");
  await page.screenshot({ path: `${OUT}/${tag.replace("/", "-")}-setup.png`, fullPage: true });

  // Drive the UI like a learner (same helpers as run-matrix.mjs). Texts come from the messages / exam data.
  const m = msgs;
  const forCase = (x) => x.replace(/^\{sex, select, female \{(.*?)\} other \{.*\}\}$/s, "$1");
  const dr = driver(page, msgs, { touch: opts.hasTouch }); // opens the phone tab / panel that holds a control before using it
  const setRange = dr.slider;
  const radio = (text) => page.locator("label", { hasText: text }).filter({ has: page.locator('input[type="radio"]') }).first();
  const click = dr.click;
  const group = (legend) => page.locator("fieldset", { has: page.locator("legend", { hasText: legend }) });
  const exam = JSON.parse(readFileSync("scripts/qa/lateral-labels.json", "utf8"))[loc];

  async function attempt(name, u) {
    await page.goto(`${BASE}/${loc}/xray/chest-lateral-erect/practice`, { waitUntil: "networkidle" });
    await startPractice(page, msgs);
    await click(radio(m.console.projections["lateral-left"]));
    await click(group(exam.sideLegend).locator("label").nth(u.side === "L" ? 0 : 1));
    await click(group(exam.armsLegend).locator("label").nth(u.arms === "raised" ? 0 : 1));
    await click(radio(m.positioning.chinOptions.elevated));
    await setRange(m.positioning.rotation, u.rotation);
    await click(page.locator('label:has(input[name="side-marker"])').nth(u.marker === "L" ? 1 : u.marker === "R" ? 2 : 0));
    await setRange(m.positioning.centerX, 0);
    await setRange(m.positioning.centerY, 18.5);
    await setRange(m.positioning.collWidth, 35);
    await setRange(m.positioning.collHeight, 37);
    await setRange(m.console.sid, 180);
    await setRange(m.console.kvp, 120);
    await setRange(m.console.mas, 11); // station index 11 = 6.3 mAs
    await click(radio(forCase(m.patient.breathingOptions["deep-inspiration-hold"])));
    await click(radio(forCase(m.patient.motionOptions["remain-still"])));
    ok(`${tag} ${name}: nothing of the result is shown before Expose`, (await page.locator('[data-testid="radiograph"]').count()) === 0);
    await click(page.getByRole("button", { name: m.console.expose, exact: true }));
    await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
    const score = Number((await page.locator('[aria-labelledby="result-heading"] [role="status"] div').first().innerText()).trim());
    const critical = await page.locator("[data-critical]").evaluateAll((n) => n.map((x) => x.getAttribute("data-critical")));
    const alt = await page.locator('[data-testid="radiograph"] canvas').getAttribute("aria-label");
    ok(`${tag} ${name}: alt text is the lateral one`, alt.startsWith(m.radiograph.lateral.alt), alt);
    await page.screenshot({ path: `${OUT}/${tag.replace("/", "-")}-${name}.png`, fullPage: true });
    return { score, critical };
  }

  const good = await attempt("correct", { side: "L", arms: "raised", rotation: 0, marker: "L" });
  ok(`${tag} correct attempt scores 100`, good.score === 100, String(good.score));
  ok(`${tag} correct attempt has no critical finding`, good.critical.length === 0, good.critical.join(","));
  await axe("result (correct)");
  await noOverflow("result");
  const bad = await attempt("wrong", { side: "R", arms: "lowered", rotation: 9, marker: "L" });
  ok(`${tag} wrong attempt: critical findings arms-over-lungs and wrong-side-marker`, bad.critical.includes("arms-over-lungs") && bad.critical.includes("wrong-side-marker"), bad.critical.join(","));
  ok(`${tag} wrong attempt scores below 100`, bad.score < 100, String(bad.score));
}
await browser.close();
console.log(failed ? `${failed} check(s) failed` : "all lateral checks passed");
process.exit(failed ? 1 : 0);
