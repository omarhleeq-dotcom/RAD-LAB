// Session 4 real-browser verification (Playwright + Chromium) against a production build.
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright            # not a project dependency
//   BASE=http://localhost:3100 OUT=/tmp/s4 node scripts/verify-session4.mjs [subset-name]
// Drives the real UI (never the store), exposes, then checks the rendered result and saves screenshots.
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "/tmp/s4";
const ONLY = process.argv[2]?.split(",");
const DEV = process.env.DEV?.split(",");
mkdirSync(OUT, { recursive: true });
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, hasTouch: false },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true },
  mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
};
const MAS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 32, 40];

// UI-level settings (what a learner would do). `correct` is the reference acquisition.
const CORRECT = { projection: "pa-erect", rotation: 0, cx: 0, cy: 18.5, cw: 33, ch: 36, chin: "elevated", shoulders: "rolled-forward", marker: "L", sid: 180, kvp: 115, mas: 3.2, breathing: "deep-inspiration-hold", motion: "remain-still" };
const SCENARIOS = {
  correct: { set: {}, effects: ["baseline", "marker"], absent: ["rotation", "motion", "low-exposure", "scapulae", "chin", "inspiration", "low-penetration", "collimation-clipping"] },
  "rotation-pos": { set: { rotation: 12 }, effects: ["rotation"] },
  "rotation-neg": { set: { rotation: -12 }, effects: ["rotation"] },
  "clip-top": { set: { cy: 27, ch: 22 }, effects: ["collimation-clipping", "centering"] },
  "clip-left": { set: { cx: 6, cw: 24 }, effects: ["collimation-clipping", "centering"] },
  "clip-right": { set: { cx: -6, cw: 24 }, effects: ["collimation-clipping", "centering"] },
  "clip-bottom": { set: { cy: 10, ch: 22 }, effects: ["collimation-clipping", "centering"] },
  "low-exposure": { set: { mas: 1 }, effects: ["low-exposure"] },
  "excess-exposure": { set: { mas: 12.5 }, effects: ["excess-exposure", "baseline"] },
  "low-penetration": { set: { kvp: 70, mas: 16 }, effects: ["low-penetration"], absent: ["low-exposure"] },
  scapulae: { set: { shoulders: "relaxed" }, effects: ["scapulae"] },
  chin: { set: { chin: "tucked" }, effects: ["chin"] },
  inspiration: { set: { breathing: "expiration-hold" }, effects: ["inspiration"], absent: ["motion"] },
  motion: { set: { motion: "none" }, effects: ["motion"], absent: ["inspiration", "low-exposure"] },
  "marker-R": { set: { marker: "R" }, effects: ["marker"] },
  "marker-clipped": { set: { cw: 24 }, effects: ["marker"], marker: { right: false, left: false, wrongSide: false } },
  // Regression: the DEFAULT marker (never moved) is recorded in full inside a typical correct field.
  // Laterality (PA display: patient left = viewer right): L belongs on the viewer's RIGHT, R on the viewer's LEFT.
  "marker-L-default": { set: {}, effects: ["marker"], marker: { right: true, left: false, wrongSide: false } },
  "marker-R-default": { set: { marker: "R" }, effects: ["marker"], marker: { right: false, left: true, wrongSide: false } },
  // The learner moves L over to the viewer's left (Shift+ArrowLeft ×17): drawn where placed, never corrected, flagged.
  "marker-L-wrong-side": { set: { markerMove: ["Shift+ArrowLeft", 17] }, effects: ["marker"], marker: { right: false, left: true, wrongSide: true } },
  "marker-R-wrong-side": { set: { marker: "R", markerMove: ["Shift+ArrowRight", 17] }, effects: ["marker"], marker: { right: true, left: false, wrongSide: true } },
  // Centering error without clipping: the field is shifted, the anatomy is not.
  "centering-off": { set: { cx: 3, cw: 35, ch: 36 }, effects: ["centering"], absent: ["collimation-clipping"] },
  // Fully open field: detector area the baseline does not cover is a grey hatch, never black.
  "open-field": { set: { cx: 0, cy: 21.5, cw: 35, ch: 43 }, effects: ["excess-field"], hatchProbe: true },
  "ap-projection": { set: { projection: "ap-erect" }, effects: ["projection"], notRepresentative: true },
  combined: { set: { rotation: 8, cx: 5, cw: 26, mas: 1, shoulders: "relaxed", chin: "tucked", motion: "none", breathing: "no-instruction", kvp: 80 }, effects: ["rotation", "collimation-clipping", "low-exposure", "scapulae", "chin", "motion", "inspiration", "low-penetration", "marker"] },
};
const SUBSET = ["correct", "rotation-pos", "clip-left", "low-exposure", "motion", "combined"];

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); if (!cond) console.log("  FAIL", name, extra); };

async function setRange(page, labelText, value) {
  const el = page.getByRole("slider", { name: labelText, exact: true });
  await el.evaluate((node, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(node, String(v));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
async function choose(page, device, locator) { await (DEVICES[device].hasTouch ? locator.tap() : locator.click()); }

async function configure(page, device, loc, s) {
  const m = msgs[loc];
  const radio = (text) => page.locator("label", { hasText: text }).filter({ has: page.locator('input[type="radio"]') }).first();
  await choose(page, device, radio(m.console.projections[s.projection]));
  await setRange(page, m.positioning.rotation, s.rotation);
  await choose(page, device, radio(m.positioning.chinOptions[s.chin]));
  await choose(page, device, radio(m.positioning.shoulderOptions[s.shoulders]));
  await choose(page, device, page.locator('label:has(input[name="side-marker"])').nth(s.marker === "L" ? 1 : 2));
  if (s.markerMove) {
    const handle = page.getByRole("button", { name: m.positioning.markerHandle.replace("{side}", s.marker), exact: true });
    await handle.focus();
    for (let i = 0; i < s.markerMove[1]; i++) await page.keyboard.press(s.markerMove[0]);
  }
  await setRange(page, m.positioning.centerX, s.cx);
  await setRange(page, m.positioning.centerY, s.cy);
  await setRange(page, m.positioning.collWidth, s.cw);
  await setRange(page, m.positioning.collHeight, s.ch);
  await setRange(page, m.console.sid, s.sid);
  await setRange(page, m.console.kvp, s.kvp);
  if (!MAS.includes(s.mas)) throw new Error(`mAs ${s.mas} is not a console station`);
  await setRange(page, m.console.mas, MAS.indexOf(s.mas));
  await choose(page, device, radio(m.patient.breathingOptions[s.breathing]));
  await choose(page, device, radio(m.patient.motionOptions[s.motion]));
}

const hash = (b) => createHash("sha1").update(b).digest("hex").slice(0, 12);

async function run() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const canvasByKey = new Map();
  for (const loc of ["en", "ar"]) {
    for (const device of Object.keys(DEVICES)) {
      const ctx = await browser.newContext({ ...DEVICES[device], locale: loc === "ar" ? "ar" : "en-US" });
      if (DEV && !DEV.includes(device)) { await ctx.close(); continue; }
      const names = (ONLY ?? (device === "desktop" ? Object.keys(SCENARIOS) : SUBSET));
      for (const name of names) {
        const sc = SCENARIOS[name];
        const tag = `${loc}/${device}/${name}`;
        const page = await ctx.newPage();
        const errors = [];
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.goto(`${BASE}/${loc}/simulation/chest-pa-erect`, { waitUntil: "networkidle" });
        ok(`${tag}: html dir`, (await page.getAttribute("html", "dir")) === (loc === "ar" ? "rtl" : "ltr"));
        if (name === "correct" && device === "desktop") {
          // Keyboard: the patient-instruction radio groups are reachable and arrow keys change the selection.
          const group = page.locator('input[name="motion-instruction"]');
          await group.first().focus();
          const before = await group.evaluateAll((n) => n.findIndex((x) => x.checked));
          await page.keyboard.press("ArrowDown");
          const after = await group.evaluateAll((n) => n.findIndex((x) => x.checked));
          ok(`${tag}: keyboard changes the keep-still instruction`, after === before + 1, `${before}->${after}`);
          const breath = page.locator('input[name="breathing-instruction"]');
          await breath.first().focus();
          await page.keyboard.press("ArrowDown");
          ok(`${tag}: keyboard changes the breathing instruction`, (await breath.evaluateAll((n) => n.findIndex((x) => x.checked))) === 1);
        }
        await configure(page, device, loc, { ...CORRECT, ...sc.set });
        // Practice Mode must not reveal the answer before the exposure: no radiograph, no effects list yet.
        ok(`${tag}: no result before exposure`, (await page.locator('[data-testid="radiograph"]').count()) === 0);
        await choose(page, device, page.getByRole("button", { name: msgs[loc].console.expose, exact: true }));
        const holder = page.locator('[data-testid="radiograph"]');
        await holder.waitFor({ state: "visible", timeout: 15000 });
        await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
        const effects = (await holder.locator("canvas").getAttribute("data-effects")).split(" ");
        for (const e of sc.effects) ok(`${tag}: effect ${e}`, effects.includes(e), effects.join(","));
        for (const e of sc.absent ?? []) ok(`${tag}: no effect ${e}`, !effects.includes(e), effects.join(","));
        const resultText = await page.locator('[aria-labelledby="result-heading"]').innerText();
        const pixelAt = (px, py) => holder.locator("canvas").evaluate((c, [x, y]) => c.getContext("2d").getImageData(x, y, 1, 1).data[0], [px, py]);
        if (sc.marker) {
          // Marker boxes (2.2 cm at the default y ≈ 12 cm; 24 px/cm): viewer's LEFT ≈ x 2.8 cm, viewer's RIGHT ≈ x 32.2 cm.
          const bright = (bx) => holder.locator("canvas").evaluate((c, bx0) => {
            const d = c.getContext("2d").getImageData(bx0, 263, 52, 52).data;
            let n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i] > 235) n++;
            return n;
          }, bx);
          const left = await bright(41), right = await bright(747);
          ok(`${tag}: marker glyph ${sc.marker.right ? "on" : "not on"} the viewer's right half`, sc.marker.right ? right > 80 : right === 0, `right=${right}`);
          ok(`${tag}: marker glyph ${sc.marker.left ? "on" : "not on"} the viewer's left half`, sc.marker.left ? left > 80 : left === 0, `left=${left}`);
          const flagged = /wrong side of the image|الجانب الخطأ من الصورة/.test(resultText);
          ok(`${tag}: wrong-side marker ${sc.marker.wrongSide ? "is flagged in the feedback" : "is not flagged"}`, flagged === sc.marker.wrongSide);
        }
        if (sc.hatchProbe) {
          // Bottom band (≈ 38.2–43 cm) and left band (< 1.8 cm) are inside the open field but beyond the reference image.
          for (const [x, y] of [[420, 1000], [300, 1010], [20, 500], [30, 700]]) {
            const v = await pixelAt(x, y);
            ok(`${tag}: no-data hatch at ${x},${y} is neutral grey (not black)`, v === 92 || v === 112, String(v));
          }
        }
        if (sc.notRepresentative) ok(`${tag}: not-representative notice`, (await page.locator('[data-testid="not-representative"]').count()) === 1);
        else ok(`${tag}: no not-representative notice`, (await page.locator('[data-testid="not-representative"]').count()) === 0);
        // Regression: observed settings are shown translated, never as raw ids.
        ok(`${tag}: no raw setting ids in feedback`, !/\b(pa-erect|ap-erect|no-instruction|rolled-forward|remain-still|deep-inspiration-hold|expiration-hold)\b/.test(resultText));
        const shown = await page.locator("[data-effect]").evaluateAll((n) => n.map((x) => x.getAttribute("data-effect")));
        ok(`${tag}: effects list matches canvas`, shown.join(" ") === effects.join(" "), shown.join(","));
        // Layout: no horizontal overflow, canvas fully inside the viewport width.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(`${tag}: no horizontal overflow`, overflow <= 0, String(overflow));
        const box = await holder.boundingBox();
        ok(`${tag}: radiograph inside viewport`, box && box.x >= 0 && box.x + box.width <= DEVICES[device].viewport.width + 0.5, JSON.stringify(box));
        const canvasDir = await holder.locator("canvas").evaluate((c) => getComputedStyle(c).direction);
        ok(`${tag}: canvas direction ltr`, canvasDir === "ltr");
        const png = await holder.locator("canvas").evaluate((c) => c.toDataURL("image/png"));
        canvasByKey.set(`${loc}/${device}/${name}`, hash(png));
        ok(`${tag}: no console errors`, errors.length === 0, errors.join(" | "));
        if (name === "correct") {
          // Retry keeps the learner's instructions, clears the result; exposing again reproduces the same picture.
          await choose(page, device, page.getByRole("button", { name: msgs[loc].result.retry, exact: true }));
          ok(`${tag}: retry clears the result`, (await page.locator('[data-testid="radiograph"]').count()) === 0);
          ok(`${tag}: retry keeps the keep-still instruction`, await page.locator('input[name="motion-instruction"]').nth(1).isChecked());
          await choose(page, device, page.getByRole("button", { name: msgs[loc].console.expose, exact: true }));
          await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
          const again = await page.locator('[data-testid="radiograph"] canvas').evaluate((c) => c.toDataURL("image/png"));
          ok(`${tag}: same actions → identical picture after retry`, hash(again) === hash(png));
        }
        await holder.screenshot({ path: `${OUT}/${loc}-${device}-${name}-image.png` });
        if (name === "combined" || name === "correct" || device !== "desktop") await page.screenshot({ path: `${OUT}/${loc}-${device}-${name}-page.png`, fullPage: true });
        await page.close();
      }
      await ctx.close();
    }
  }
  // Anatomy is never mirrored by RTL: the same acquisition gives a byte-identical radiograph in EN and AR.
  for (const [k, h] of canvasByKey) {
    if (!k.startsWith("en/")) continue;
    const ar = canvasByKey.get(k.replace("en/", "ar/"));
    ok(`RTL identical canvas: ${k}`, ar === h, `${h} vs ${ar}`);
  }
  // Same acquisition on different devices → same pixels (determinism at fixed working resolution).
  for (const [k, h] of canvasByKey) {
    if (!k.startsWith("en/desktop/")) continue;
    for (const d of ["tablet", "mobile"]) { const o = canvasByKey.get(k.replace("desktop", d)); if (o) ok(`deterministic across devices: ${k} vs ${d}`, o === h, `${h} vs ${o}`); }
  }
  // Different faults must give different pictures; excess exposure must equal the baseline picture.
  const px = (k) => canvasByKey.get(`en/desktop/${k}`);
  if (!ONLY) {
    ok("excess exposure picture == correct picture (no darkening)", px("excess-exposure") === px("correct"));
    for (const n of ["rotation-pos", "rotation-neg", "low-exposure", "motion", "scapulae", "chin", "inspiration", "low-penetration"]) ok(`${n} differs from correct`, px(n) !== px("correct"));
    ok("rotation ± are different pictures", px("rotation-pos") !== px("rotation-neg"));
  }
  await browser.close();
  const failed = results.filter((r) => !r.pass);
  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed; screenshots in ${OUT}`);
  if (failed.length) { for (const f of failed) console.log(" ✗", f.name, f.extra); process.exit(1); }
}
run().catch((e) => { console.error(e); process.exit(2); });
