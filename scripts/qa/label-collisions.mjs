// Scene label-collision measurement (S14-0; reusable form of the throw-away S13b-2 script). Run manually, not part of CI:
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core   # (axe-core is not needed here; same install line as the audits)
//   BASE=http://localhost:3100 node scripts/qa/label-collisions.mjs chest-ap-supine [--spec scripts/qa/label-states/chest-ap-supine.json] [--max-states 200]
// For an exam's practice page, EN + AR x viewport 390 / 1440 x guides ON / OFF x every state of the exam's axes, it measures every
// scene label (an SVG <text> inside the positioning section, with the pill the component draws: the text box padded 5 / 1 as in
// SceneLabel) and reports (a) label boxes that overlap another label of the same drawing and (b) boxes outside the drawing's
// viewBox. Both are measured in SVG user units, so they do not depend on the page scale; the smallest on-screen label font size is
// reported per viewport. Exit code 1 on any collision / out-of-frame box, or when no label was found.
//
// States = the cartesian product of the axes (a state set is run ONCE; do not rerun it across all states for every small change):
//   default axes: every radio group (fieldset legend) inside the positioning section + the rotation slider at min / 0 / max.
//   --spec <json>: replaces the defaults. {"radios": [<text>...], "sliders": {<text>: [values...]}}, where <text> is a message path
//   ("positioning.chinLegend", "console.tubeAngulation") or {"en": "...", "ar": "..."} (an exam's own choice-control legend).
//   --obstacles (S-VIS-1-4): also reports guide labels that touch the crosshair, a collimation handle or the collimated-field edge of the
//   detector drawing (anatomy is not measured). Off by default so the chest scenes keep their recorded results.
//   A radio axis iterates the options of the group; a slider axis sets each value. More states than --max-states (default 200)
//   aborts before measuring: narrow the axes instead of raising the limit casually.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const exam = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--spec" && args[args.indexOf(a) - 1] !== "--max-states");
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
if (!exam) { console.error("usage: node scripts/qa/label-collisions.mjs <exam-id> [--spec file.json] [--max-states N] [--modality xray]"); process.exit(2); }
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? `/tmp/rad-lab-qa-labels-${exam}`;
const OBSTACLES = args.includes("--obstacles");
const MODALITY = opt("--modality") ?? "xray";
const MAX_STATES = Number(opt("--max-states") ?? 200);
const spec = opt("--spec") ? JSON.parse(readFileSync(opt("--spec"), "utf8")) : null;
mkdirSync(OUT, { recursive: true });

const MSGS = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const msg = (loc, path) => path.split(".").reduce((o, k) => o?.[k], MSGS[loc]);
const text = (loc, t) => (typeof t === "string" ? (msg(loc, t) ?? t) : t[loc]);
const VIEWPORTS = { 1440: { viewport: { width: 1440, height: 900 } }, 390: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };
const POS = 'section[aria-labelledby="pos-heading"]';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const failures = [];
const summary = [];

for (const loc of ["en", "ar"]) for (const [vw, opts] of Object.entries(VIEWPORTS)) {
  const tag = `${loc}/${vw}`;
  const ctx = await browser.newContext({ ...opts, locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const click = (l) => (opts.hasTouch ? l.tap() : l.click());
  await page.goto(`${BASE}/${loc}/${MODALITY}/${exam}/practice`, { waitUntil: "networkidle" });
  await page.waitForSelector(POS);

  // --- axes
  const radioAxes = [];
  const legends = spec ? spec.radios ?? [] : null;
  if (legends) for (const l of legends) radioAxes.push({ name: text(loc, l) });
  else for (const name of await page.locator(`${POS} fieldset > legend`).allInnerTexts()) radioAxes.push({ name });
  for (const ax of radioAxes) {
    ax.group = page.locator("fieldset", { has: page.locator("legend", { hasText: ax.name }) }).first();
    ax.n = await ax.group.locator("label").count();
    if (!ax.n) throw new Error(`${tag}: no options found for radio group "${ax.name}"`);
  }
  const sliderAxes = Object.entries(spec ? spec.sliders ?? {} : { "positioning.rotation": ["min", 0, "max"] }).map(([name, values]) => ({ name: text(loc, name), values }));
  for (const ax of sliderAxes) {
    const el = page.getByRole("slider", { name: ax.name, exact: true });
    const [min, max] = await el.evaluate((n) => [Number(n.min), Number(n.max)]);
    ax.vals = ax.values.map((v) => (v === "min" ? min : v === "max" ? max : v));
    ax.el = el;
  }
  const axes = [...radioAxes.map((a) => ({ kind: "radio", a, count: a.n })), ...sliderAxes.map((a) => ({ kind: "slider", a, count: a.vals.length }))];
  const total = axes.reduce((n, x) => n * x.count, 1);
  if (total > MAX_STATES) { console.error(`${tag}: ${total} states > --max-states ${MAX_STATES}; narrow the axes (--spec).`); process.exit(2); }

  const setSlider = (el, v) => el.evaluate((node, val) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, String(val));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, v);
  const guides = page.locator(`${POS} input[type="checkbox"]`).first();

  const measure = () => page.evaluate(([POS, OBSTACLES]) => {
    const out = { labels: 0, overlaps: [], outside: [], minPx: Infinity };
    for (const svg of document.querySelectorAll(`${POS} svg`)) {
      const vb = svg.viewBox.baseVal;
      const scale = svg.getBoundingClientRect().width / vb.width;
      const boxes = [];
      for (const t of svg.querySelectorAll("text")) {
        if (t.closest('[role="button"]')) continue; // the marker letter is an interactive element, not a label
        const s = (t.textContent ?? "").trim();
        if (!s) continue;
        const b = t.getBBox();
        if (!b.width) continue;
        boxes.push({ s, x1: b.x - 5, y1: b.y - 1, x2: b.x + b.width + 5, y2: b.y + b.height + 1 });
        out.minPx = Math.min(out.minPx, parseFloat(t.getAttribute("font-size") ?? "0") * scale);
      }
      out.labels += boxes.length;
      if (OBSTACLES) {
        const ray = svg.querySelector('[aria-describedby="ray-status"]');
        if (ray) {
          const obstacles = [];
          const cross = ray.querySelector("g[stroke]");
          if (cross) { const b = cross.getBBox(); obstacles.push({ n: "crosshair", x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height }); }
          for (const r of svg.querySelectorAll('g[aria-hidden] > rect[width="14"]')) { const b = r.getBBox(); obstacles.push({ n: "handle", x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height }); }
          const beam = [...svg.querySelectorAll("rect")].find((r) => r.getAttribute("fill") === "none" && r.getAttribute("stroke-dasharray")?.startsWith("14"));
          // 2 units: the label pill's own padding (1) plus the handle's 2-unit stroke are not a visible overlap
          const hit = (a, o) => Math.min(a.x2, o.x2) - Math.max(a.x1, o.x1) > 2 && Math.min(a.y2, o.y2) - Math.max(a.y1, o.y1) > 2;
          for (const a of boxes) {
            for (const o of obstacles) if (hit(a, o)) out.overlaps.push(`${a.s} × ${o.n}`);
            if (beam) {
              const b = beam.getBBox(), m = 3;
              const outer = { x1: b.x - m, y1: b.y - m, x2: b.x + b.width + m, y2: b.y + b.height + m };
              const inside = a.x1 >= b.x + m && a.y1 >= b.y + m && a.x2 <= b.x + b.width - m && a.y2 <= b.y + b.height - m;
              if (hit(a, outer) && !inside) out.overlaps.push(`${a.s} × field edge`);
            }
          }
        }
      }
      boxes.forEach((a, i) => {
        if (a.x1 < vb.x - 0.5 || a.y1 < vb.y - 0.5 || a.x2 > vb.x + vb.width + 0.5 || a.y2 > vb.y + vb.height + 0.5) out.outside.push(a.s);
        for (const b of boxes.slice(i + 1)) {
          const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1), h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
          if (w > 0.5 && h > 0.5) out.overlaps.push(`${a.s} × ${b.s}`);
        }
      });
    }
    return out;
  }, [POS, OBSTACLES]);
  const settle = () => page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));

  // --- iterate the product (odometer; only axes that changed are touched)
  const idx = axes.map(() => 0);
  const applied = axes.map(() => -1);
  let states = 0, labelsSeen = 0, minPx = Infinity;
  for (let s = 0; s < total; s++) {
    for (let k = 0; k < axes.length; k++) {
      if (applied[k] === idx[k]) continue;
      const ax = axes[k];
      if (ax.kind === "radio") await click(ax.a.group.locator("label").nth(idx[k]));
      else await setSlider(ax.a.el, ax.a.vals[idx[k]]);
      applied[k] = idx[k];
    }
    for (const on of [true, false]) {
      if ((await guides.isChecked()) !== on) await click(guides.locator("xpath=ancestor::label"));
      await settle();
      const r = await measure();
      labelsSeen += r.labels;
      minPx = Math.min(minPx, r.minPx);
      const state = axes.map((x, k) => `${x.a.name}=${x.kind === "radio" ? idx[k] : x.a.vals[idx[k]]}`).join(" ");
      if (r.overlaps.length || r.outside.length) failures.push({ tag, guides: on, state, overlaps: r.overlaps, outside: r.outside });
      states++;
    }
    for (let k = axes.length - 1; k >= 0; k--) { if (++idx[k] < axes[k].count) break; idx[k] = 0; }
  }
  summary.push({ tag, statesMeasured: states, labelMeasurements: labelsSeen, minLabelPx: Number(minPx.toFixed(1)) });
  await ctx.close();
}
await browser.close();

writeFileSync(`${OUT}/label-collisions.json`, JSON.stringify({ exam, summary, failures }, null, 1));
for (const s of summary) console.log(`${s.tag}: ${s.statesMeasured} states (x guides), ${s.labelMeasurements} label measurements, smallest label ${s.minLabelPx}px on screen`);
for (const f of failures.slice(0, 40)) console.log("  COLLISION", f.tag, `guides=${f.guides}`, f.state, "overlap:", f.overlaps.join("; "), "outside:", f.outside.join("; "));
if (failures.length > 40) console.log(`  … ${failures.length - 40} more in ${OUT}/label-collisions.json`);
const none = summary.some((s) => s.labelMeasurements === 0);
if (none) console.log("FAIL: no labels were found (wrong exam id or selectors?)");
console.log(failures.length || none ? `${failures.length} state(s) with a collision or out-of-frame label` : "no label overlaps, none outside the frame");
process.exit(failures.length || none ? 1 : 0);
