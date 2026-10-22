// RAD-068 part 1 (Part B): result-image side-marker audit (Playwright; run manually, not part of CI).
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright && BASE=http://localhost:3100 node scripts/qa/result-marker-audit.mjs [exam-id ...]
// For every exam, at 1440 (desktop) and 390 (phone, touch drag in the fitted view), EN and AR: open the field to the whole
// detector with the central ray centred, choose L or R, drag the marker in the scene to a known detector position (left/right
// x top/bottom halves), Expose, then find the marker letter in the result canvas (its fill is the only non-grey colour on
// the canvas) and check that it lies where it was placed, in the same image orientation:
//  - the canvas covers the detector, or (exams with a result `view`) a detector rectangle given by data-origin-cm / data-px-per-cm;
//  - the letter's centre, converted back to detector cm, must be within TOL_CM of the placed position;
//  - the drawn letter must be the chosen one (L or R are told apart by their glyph shape: L has its ink at the left and bottom).
// Prints a table exam x placement: expected vs observed (normalised detector coordinates -1..1). Exit code 1 on any failure.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ALL = ["chest-pa-erect", "chest-lateral-erect", "chest-ap-supine", "wrist-pa", "wrist-lateral", "hand-pa", "hand-lateral", "elbow-ap", "elbow-lateral",
  "knee-ap", "knee-lateral", "foot-ap", "foot-oblique", "ankle-ap", "ankle-lateral", "pelvis-ap-supine", "shoulder-grashey-erect"];
const EXAMS = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const OUT = process.env.OUT ?? "/tmp/rad-lab-qa-marker";
const LOCALES = (process.env.LOCALES ?? "en,ar").split(",");
const DEVICES = (process.env.DEVICES ?? "desktop,phone").split(",");
mkdirSync(OUT, { recursive: true });
const MSGS = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const DEV = { desktop: { viewport: { width: 1440, height: 900 } }, phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };
// Placements in detector-normalised coordinates: the four quadrants, each letter.
const PLACES = [
  { side: "L", x: -0.55, y: -0.5 }, { side: "L", x: 0.55, y: 0.5 },
  { side: "R", x: 0.55, y: -0.5 }, { side: "R", x: -0.55, y: 0.5 },
];
const TOL_CM = 1.0;
let failed = 0, checks = 0;
const rows = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });

async function setRange(page, label, pick) {
  const input = page.getByLabel(label, { exact: true });
  await input.evaluate((el, pick) => {
    const v = pick === "max" ? el.max : pick === "min" ? el.min : String((Number(el.min) + Number(el.max)) / 2);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, pick);
}

const sceneGeo = (page) => page.locator("section[aria-labelledby='pos-heading'] figure svg[role=group]").first().evaluate((s) => {
  s.scrollIntoView({ block: "center", behavior: "instant" });
  const det = s.querySelectorAll(":scope > rect")[1].getBoundingClientRect();
  const m = [...s.querySelectorAll("g[role=button]")].find((g) => g.querySelector("text") && !g.hasAttribute("aria-describedby"));
  const r = m.querySelector("rect:not([fill=transparent])").getBoundingClientRect();
  return { det: { x: det.x, y: det.y, w: det.width, h: det.height }, m: { x: r.x + r.width / 2, y: r.y + r.height / 2 } };
});

// The marker letter on the result canvas: pixels whose colour is the annotation fill (#f6f8fa; the radiograph is pure grey).
const glyph = (page) => page.locator("[data-testid=radiograph]").first().evaluate((box) => {
  const c = box.querySelector("canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let n = 0, x1 = Infinity, y1 = Infinity, x2 = -1, y2 = -1;
  const pts = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    if (d[i + 2] - d[i] >= 3 && d[i] > 200) { n++; x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y); pts.push([x, y]); }
  }
  if (!n) return null;
  // Glyph shape: L has most of its ink in the left column and the bottom row of its box; R has ink in the right half of the top.
  const w = x2 - x1 + 1, h = y2 - y1 + 1;
  const topRight = pts.filter(([x, y]) => x > x1 + w * 0.6 && y < y1 + h * 0.35).length / n;
  const bottomRight = pts.filter(([x, y]) => x > x1 + w * 0.6 && y > y1 + h * 0.75).length / n;
  return {
    cx: (x1 + x2 + 1) / 2, cy: (y1 + y2 + 1) / 2, n, letter: topRight > bottomRight ? "R" : "L",
    width: c.width, height: c.height,
    originCm: { x: Number(box.dataset.originX), y: Number(box.dataset.originY) }, pxPerCm: Number(box.dataset.pxPerCm),
  };
});

for (const device of DEVICES) for (const loc of LOCALES) for (const exam of EXAMS) {
  const ctx = await browser.newContext(DEV[device]);
  const page = await ctx.newPage();
  const m = MSGS[loc];
  for (const place of PLACES) {
    const tag = `${device} ${loc} ${exam} ${place.side}(${place.x},${place.y})`;
    await page.goto(`${BASE}/${loc}/xray/${exam}/practice`, { waitUntil: "networkidle" });
    if (device === "phone") {
      await page.keyboard.press("Escape");
      await page.getByRole("tab", { name: new RegExp(`^${m.workspace.tabs.centring}`) }).click();
      const details = page.locator("details", { hasText: m.positioning.fineAdjustPhone });
      if (await details.count()) await details.first().evaluate((d) => { d.open = true; });
    }
    await setRange(page, m.positioning.centerX, "mid");
    await setRange(page, m.positioning.centerY, "mid");
    await setRange(page, m.positioning.collWidth, "max");
    await setRange(page, m.positioning.collHeight, "max");
    if (device === "phone") await page.getByRole("tab", { name: new RegExp(`^${m.workspace.tabs.positioning}`) }).click();
    await page.getByRole("radio", { name: place.side, exact: true }).check({ force: true });
    const g = await sceneGeo(page);
    const target = { x: g.det.x + ((place.x + 1) / 2) * g.det.w, y: g.det.y + ((place.y + 1) / 2) * g.det.h };
    if (device === "phone") {
      const cdp = await ctx.newCDPSession(page);
      const tp = (type, p) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: p.x, y: p.y }] });
      await tp("touchStart", g.m);
      for (let i = 1; i <= 12; i++) await tp("touchMove", { x: g.m.x + ((target.x - g.m.x) * i) / 12, y: g.m.y + ((target.y - g.m.y) * i) / 12 });
      await tp("touchEnd", target);
    } else {
      await page.mouse.move(g.m.x, g.m.y);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) await page.mouse.move(g.m.x + ((target.x - g.m.x) * i) / 12, g.m.y + ((target.y - g.m.y) * i) / 12);
      await page.mouse.up();
    }
    await page.waitForTimeout(150);
    const after = await sceneGeo(page);
    const placed = { x: ((after.m.x - after.det.x) / after.det.w) * 2 - 1, y: ((after.m.y - after.det.y) / after.det.h) * 2 - 1 };
    await page.getByRole("button", { name: m.console.expose, exact: true }).click();
    await page.waitForSelector("[data-testid=radiograph][data-status=ready]");
    const gl = await glyph(page);
    await page.locator("[data-testid=radiograph]").first().screenshot({ path: `${OUT}/${device}-${loc}-${exam}-${place.side}-${place.x}-${place.y}.png` });
    // Detector size from the scene's own frame ratio is not enough for a cropped view: read the case detector from the result box.
    const det = await page.locator("[data-testid=radiograph]").first().evaluate((b) => (({ w: Number(b.dataset.detectorW), h: Number(b.dataset.detectorH) })));
    checks++;
    let observed = null, ok = false;
    if (gl) {
      const cm = { x: gl.originCm.x + gl.cx / gl.pxPerCm, y: gl.originCm.y + gl.cy / gl.pxPerCm };
      observed = { x: (cm.x / det.w) * 2 - 1, y: (cm.y / det.h) * 2 - 1 };
      const exp = { x: ((placed.x + 1) / 2) * det.w, y: ((placed.y + 1) / 2) * det.h };
      ok = Math.hypot(cm.x - exp.x, cm.y - exp.y) <= TOL_CM && gl.letter === place.side;
    }
    if (!ok) { failed++; console.log("  FAIL", tag, JSON.stringify({ placed, observed, letter: gl?.letter })); }
    rows.push({ device, loc, exam, side: place.side, expected: placed, observed, letter: gl?.letter ?? "-", ok });
  }
  await ctx.close();
}
await browser.close();

const f = (p) => (p ? `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})` : "not drawn");
console.log("\n| device | locale | exam | letter | expected (x, y) | observed (x, y) | drawn letter | result |\n|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.device} | ${r.loc} | ${r.exam} | ${r.side} | ${f(r.expected)} | ${f(r.observed)} | ${r.letter} | ${r.ok ? "ok" : "FAIL"} |`);
console.log(`\n${checks - failed}/${checks} placements match (tolerance ${TOL_CM} cm). Screenshots in ${OUT}.`);
process.exit(failed ? 1 : 0);
