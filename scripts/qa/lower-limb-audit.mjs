// S14.4 Knee AP / lateral and Foot AP / oblique, RIGHT side (node scripts/qa/lower-limb-audit.mjs <exam-id>; adapted from elbow-audit.mjs; Chest AP supine end-to-end + accessibility check (Playwright + axe-core; run manually, not part of CI).
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core && BASE=http://localhost:3100 node scripts/qa/lower-limb-audit.mjs <exam-id>
// EN/AR x desktop 1440 / mobile 390: the exam hub, the set-up screen (axe), a fully correct attempt driven through the REAL UI
// (score 100 expected), a deliberately wrong attempt (a critical finding expected), the result (axe), no horizontal overflow,
// and screenshots in OUT (default /tmp/rad-lab-qa-${EXAM}). Exit code 1 on any failure.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const EXAM = process.argv[2] ?? "knee-ap";
// Settings of a fully correct attempt per exam (cm on the 24 x 30 cm detector; rotation = the exam's own rotation control value; tube = the control value, + = caudad).
const CFG = {
  "knee-ap": { projection: "knee-ap", ns: "positioningKnee", rotKey: "rotationAp", cx: 0, cy: 15, w: 17.3, h: 15.6, kvp: 75, rot: 0, badRot: 9, tube: 0, tag: "knee" },
  "knee-lateral": { projection: "knee-lateral", ns: "positioningKnee", rotKey: "rotationLateral", cx: 0, cy: 15, w: 19.2, h: 15.6, kvp: 75, rot: 0, badRot: 9, tube: -6, tag: "knee" },
  "foot-ap": { projection: "foot-ap", ns: "positioningFoot", rotKey: "rotationAp", cx: 0, cy: 15, w: 15.4, h: 25.2, kvp: 65, rot: 0, badRot: 9, tube: -10, tag: "foot" },
  "foot-oblique": { projection: "foot-oblique", ns: "positioningFoot", rotKey: "rotationOblique", cx: 0, cy: 15, w: 14.9, h: 24, kvp: 65, rot: 40, badRot: 15, tube: 0, tag: "foot" },
};
const C = CFG[EXAM];
const OUT = process.env.OUT ?? `/tmp/rad-lab-qa-${EXAM}`;
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

  await page.goto(`${BASE}/${loc}/xray/${EXAM}`, { waitUntil: "networkidle" });
  await axe("exam hub");
  await page.goto(`${BASE}/${loc}/xray/${EXAM}/practice`, { waitUntil: "networkidle" });
  await axe("setup");
  await noOverflow("setup");
  await page.screenshot({ path: `${OUT}/${tag.replace("/", "-")}-setup.png`, fullPage: true });

  // Drive the UI like a learner (same helpers as run-matrix.mjs). Texts come from the messages / exam data.
  const m = msgs;
  const forCase = (x) => x.replace(/^\{sex, select, female \{.*?\} other \{(.*)\}\}$/s, "$1"); // the knee / foot case patient is male
  const setRange = (label, value) => page.getByRole("slider", { name: label, exact: true }).evaluate((node, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, String(v));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  const radio = (text) => page.locator("label", { hasText: text }).filter({ has: page.locator('input[type="radio"]') }).first();
  const click = (loc2) => (opts.hasTouch ? loc2.tap() : loc2.click());

  async function attempt(name, u) {
    await page.goto(`${BASE}/${loc}/xray/${EXAM}/practice`, { waitUntil: "networkidle" });
    await click(radio(m.console.projections[C.projection]));
    await setRange(m[C.ns][C.rotKey], u.rotation);
    await setRange(m.console.tubeAngulation, u.tube ?? C.tube);
    await click(page.locator('label:has(input[name="side-marker"])').nth(u.marker === "L" ? 1 : u.marker === "R" ? 2 : 0));
    await setRange(m.positioning.centerX, C.cx);
    await setRange(m.positioning.centerY, C.cy);
    await setRange(m.positioning.collWidth, C.w);
    await setRange(m.positioning.collHeight, C.h);
    await setRange(m.console.sid, 105);
    await setRange(m.console.kvp, C.kvp);
    await setRange(m.console.mas, 7); // station index 7 = 2.5 mAs
    await click(radio(forCase(m.patient.motionOptions["remain-still"])));
    ok(`${tag} ${name}: nothing of the result is shown before Expose`, (await page.locator('[data-testid="radiograph"]').count()) === 0);
    ok(`${tag} ${name}: no breathing group, no chin / shoulder cues`, (await page.getByText(m.patient.breathingLegend).count()) === 0 && (await page.getByText(m.positioning.chinLegend).count()) === 0);
    await click(page.getByRole("button", { name: m.console.expose, exact: true }));
    await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
    const score = Number((await page.locator('[aria-labelledby="result-heading"] [role="status"] div').first().innerText()).trim());
    const critical = await page.locator("[data-critical]").evaluateAll((n) => n.map((x) => x.getAttribute("data-critical")));
    const alt = await page.locator('[data-testid="radiograph"] canvas').getAttribute("aria-label");
    ok(`${tag} ${name}: alt text is the exam one`, alt.startsWith(m.radiograph[C.projection].alt), alt);
    await page.screenshot({ path: `${OUT}/${tag.replace("/", "-")}-${name}.png`, fullPage: true });
    return { score, critical };
  }

  const good = await attempt("correct", { rotation: C.rot, marker: "R" });
  ok(`${tag} correct attempt scores 100`, good.score === 100, String(good.score));
  ok(`${tag} correct attempt has no critical finding`, good.critical.length === 0, good.critical.join(","));
  await axe("result (correct)");
  await noOverflow("result");
  const bad = await attempt("wrong", { rotation: C.badRot, marker: null, tube: 12 });
  ok(`${tag} wrong attempt: critical finding missing-marker`, bad.critical.includes("missing-marker"), bad.critical.join(","));
  ok(`${tag} wrong attempt scores below 100`, bad.score < 100, String(bad.score));
}
await browser.close();
console.log(failed ? `${failed} check(s) failed` : "all knee / foot checks passed");
process.exit(failed ? 1 : 0);
