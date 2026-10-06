// Session 5 end-to-end QA + visual regression (Playwright + Chromium) against a PRODUCTION build.
//
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright                 # not a project dependency; CI does not run this
//   BASE=http://localhost:3100 node scripts/qa/run-matrix.mjs [options]
//
// Options (all optional):
//   --update-goldens      (re)write scripts/qa/golden/images/<scenario>.png from this run (desktop / EN only)
//   --only=a,b            run only these scenario ids
//   --locales=en,ar       default both
//   --devices=desktop,tablet,mobile   default all (tablet/mobile run the SUBSET unless --all-devices)
//   --all-devices         run every scenario on every device
//
// Drives the REAL UI (never the store): sets every control the way a learner would, exposes, then checks that the
// score shown, the feedback, the effect cards, the text alternative and the canvas pixels all agree with the
// scenario golden produced by the unit-test matrix (scripts/qa/golden/matrix.json), and compares the canvas with
// the committed golden image. Exit code 1 on any failed check.
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decodeGrey, downscale2, encodeGrey, compareGrey } from "./png.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const flag = (name) => process.argv.includes(`--${name}`);
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "/tmp/rad-lab-qa";
const UPDATE = flag("update-goldens");
const ONLY = arg("only")?.split(",");
const LOCALES = arg("locales")?.split(",") ?? ["en", "ar"];
const DEVICE_NAMES = arg("devices")?.split(",") ?? ["desktop", "tablet", "mobile"];
const SUBSET = ["correct", "rotation-pos12", "clip-left", "mas-low", "motion-none", "marker-L-wrong-side", "combo-all-wrong"];
mkdirSync(OUT, { recursive: true });
mkdirSync("scripts/qa/golden/images", { recursive: true });

const file = JSON.parse(readFileSync("scripts/qa/scenarios.json", "utf8"));
const golden = JSON.parse(readFileSync("scripts/qa/golden/matrix.json", "utf8"));
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, hasTouch: false },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true },
  mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
};
const MAS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 32, 40];

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); if (!cond) console.log("  FAIL", name, extra); };
const sha = (b) => createHash("sha1").update(b).digest("hex").slice(0, 12);

async function setRange(page, label, value) {
  await page.getByRole("slider", { name: label, exact: true }).evaluate((node, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, String(v));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
const choose = (page, device, locator) => (DEVICES[device].hasTouch ? locator.tap() : locator.click());

async function configure(page, device, loc, u) {
  const m = msgs[loc];
  const radio = (text) => page.locator("label", { hasText: text }).filter({ has: page.locator('input[type="radio"]') }).first();
  await choose(page, device, radio(m.console.projections[u.projection]));
  await setRange(page, m.positioning.rotation, u.rotation);
  await choose(page, device, radio(m.positioning.chinOptions[u.chin]));
  await choose(page, device, radio(m.positioning.shoulderOptions[u.shoulders]));
  // Marker: index 0 = none, 1 = L, 2 = R.
  await choose(page, device, page.locator('label:has(input[name="side-marker"])').nth(u.marker === "L" ? 1 : u.marker === "R" ? 2 : 0));
  if (u.marker && u.markerPlacement === "mirror") {
    await page.getByRole("button", { name: m.positioning.markerHandle.replace("{side}", u.marker), exact: true }).focus();
    for (let i = 0; i < 17; i++) await page.keyboard.press(u.marker === "L" ? "Shift+ArrowLeft" : "Shift+ArrowRight");
  }
  await setRange(page, m.positioning.centerX, u.cx);
  await setRange(page, m.positioning.centerY, u.cy);
  await setRange(page, m.positioning.collWidth, u.cw);
  await setRange(page, m.positioning.collHeight, u.ch);
  await setRange(page, m.console.sid, u.sid);
  await setRange(page, m.console.kvp, u.kvp);
  if (!MAS.includes(u.mas)) throw new Error(`mAs ${u.mas} is not a console station`);
  await choose(page, device, radio(u.mode === "aec" ? m.console.modeAec : m.console.modeManual));
  if (u.mode === "manual") await setRange(page, m.console.mas, MAS.indexOf(u.mas));
  else for (const id of u.chambers) {
    const label = file.chamberLabels[id][loc];
    await choose(page, device, page.locator("label", { hasText: label }).filter({ has: page.locator('input[type="checkbox"]') }).first());
  }
  await choose(page, device, radio(m.patient.breathingOptions[u.breathing]));
  await choose(page, device, radio(m.patient.motionOptions[u.motion]));
}

/** Expected glyph position of the marker (24 px/cm; default y ≈ 12 cm): viewer's left x ≈ 2.8 cm, right x ≈ 32.2 cm. */
const markerBox = { left: 41, right: 747 };

async function lumaOf(canvas) {
  const b64 = await canvas.evaluate((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const g = new Uint8Array(c.width * c.height);
    for (let i = 0; i < g.length; i++) g[i] = d[i * 4];
    let s = ""; const CH = 0x8000;
    for (let i = 0; i < g.length; i += CH) s += String.fromCharCode(...g.subarray(i, i + CH));
    return { w: c.width, h: c.height, data: btoa(s) };
  });
  return { width: b64.w, height: b64.h, pixels: new Uint8Array(Buffer.from(b64.data, "base64")) };
}

const fullHashByScenario = new Map();

async function runScenario(browser, loc, device, sc) {
  const tag = `${loc}/${device}/${sc.id}`;
  const g = golden[sc.id];
  const u = { ...file.defaults, ...sc.set };
  const ctx = await browser.newContext({ ...DEVICES[device], locale: loc === "ar" ? "ar" : "en-US" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/${loc}/simulation/chest-pa-erect`, { waitUntil: "networkidle" });
  ok(`${tag}: html dir`, (await page.getAttribute("html", "dir")) === (loc === "ar" ? "rtl" : "ltr"));
  if (!sc.fromInitial) await configure(page, device, loc, u);
  ok(`${tag}: no result / effects before the exposure (Practice Mode does not leak)`, (await page.locator('[data-testid="radiograph"]').count()) === 0);
  await choose(page, device, page.getByRole("button", { name: msgs[loc].console.expose, exact: true }));
  const holder = page.locator('[data-testid="radiograph"]');
  await holder.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 20000 });
  const canvas = holder.locator("canvas");

  // 1. Picture ⇔ unit-test golden: the same effects, in the same order.
  const effects = (await canvas.getAttribute("data-effects")).split(" ");
  ok(`${tag}: effects on the canvas equal the golden`, effects.join(" ") === g.effects.join(" "), `${effects} vs ${g.effects}`);
  const cards = await page.locator("[data-effect]").evaluateAll((n) => n.map((x) => x.getAttribute("data-effect")));
  ok(`${tag}: effect cards match the canvas`, cards.join(" ") === effects.join(" "), cards.join(","));

  // 2. Score ⇔ golden.
  const scoreText = (await page.locator('[aria-labelledby="result-heading"] [role="status"] div').first().innerText()).trim();
  ok(`${tag}: score shown equals the golden (${g.score})`, Number(scoreText) === g.score, scoreText);

  // 2b. Pass mark + critical findings ⇔ golden (critical findings gate the pass mark; the number is unchanged).
  const passLabel = (await page.locator('[aria-labelledby="result-heading"] p.rounded-md').first().innerText()).trim();
  ok(`${tag}: pass-mark label equals the golden (${g.passed ? "meets" : "below"})`, passLabel === (g.passed ? msgs[loc].result.passed : msgs[loc].result.failed), passLabel);
  const critical = await page.locator("[data-critical]").evaluateAll((n) => n.map((x) => x.getAttribute("data-critical")));
  ok(`${tag}: critical findings shown equal the golden (${g.critical.join(",") || "none"})`, critical.join(",") === g.critical.join(","), critical.join(","));
  if (g.critical.length) {
    const crit = await page.locator("#critical-heading").locator("xpath=..").innerText();
    ok(`${tag}: critical reason is shown in ${loc.toUpperCase()}`, loc === "ar" ? /[\u0600-\u06FF]/.test(crit) && /دون درجة النجاح/.test(crit) : /below the pass mark/i.test(crit));
  }

  // 3. Feedback ⇔ golden: wrong-side flag, 'not drawn' labels, no raw ids.
  const resultText = await page.locator('[aria-labelledby="result-heading"]').innerText();
  const flagged = /wrong side of the image|الجانب الخطأ من الصورة/.test(resultText);
  ok(`${tag}: wrong-side marker ${g.marker?.wrongSide ? "is" : "is not"} flagged in the feedback`, flagged === !!g.marker?.wrongSide);
  // Fix pass 3: a clip that cuts only the margin of the provisional region is labelled (effect card + under the check), in the picture's text alternative too.
  const marginNotes = await page.locator('[data-testid="clip-margin-note"]').count();
  ok(`${tag}: 'margin only' clipping notes ${g.marginOnlySides.length ? "present" : "absent"} (golden: ${g.marginOnlySides.join(",") || "none"})`, g.marginOnlySides.length ? marginNotes === 2 : marginNotes === 0);
  ok(`${tag}: 'not drawn' labels equal the golden (${g.notDrawn})`, (await page.locator('[data-testid="not-drawn"]').count()) === g.notDrawn);
  ok(`${tag}: no raw setting ids in feedback`, !/\b(pa-erect|ap-erect|lateral-left|no-instruction|rolled-forward|remain-still|deep-inspiration-hold|expiration-hold)\b/.test(resultText));

  // 4. Text alternative describes the visible findings (and the marker).
  const alt = await canvas.getAttribute("aria-label");
  const R = msgs[loc].radiograph;
  ok(`${tag}: alt text is the intro sentence`, alt.startsWith(R.alt));
  for (const id of effects.filter((e) => e !== "baseline" && e !== "marker")) {
    const stem = R.altFindings[id].split("{")[0].trim();
    ok(`${tag}: alt text describes ${id}`, alt.includes(stem), alt);
  }
  if (effects.includes("baseline")) ok(`${tag}: alt text says reference appearance`, alt.includes(R.altReference));
  if (!g.marker) ok(`${tag}: alt text says no marker`, alt.includes(R.altMarkerNone));
  else if (g.marker.visibleFraction <= 0) ok(`${tag}: alt text says marker not recorded`, alt.includes(R.altMarkerHidden.split("{")[0].trim()));
  else {
    const side = g.marker.viewerSide === "viewer-left" ? "left" : g.marker.viewerSide === "viewer-right" ? "right" : "midline";
    ok(`${tag}: alt text places the marker on the viewer's ${side}`, alt.includes(R.altMarkerSides[side]));
    ok(`${tag}: alt text ${g.marker.wrongSide ? "flags" : "does not flag"} the wrong side`, alt.includes(R.altMarkerWrong) === g.marker.wrongSide);
  }

  // 5. Laterality in the PIXELS (never mirrored by RTL): glyph on the half the plan says, only when the default position is used.
  if (g.marker && u.marker && g.marker.visibleFraction >= 1) {
    const bright = (bx) => canvas.evaluate((c, bx0) => {
      const d = c.getContext("2d").getImageData(bx0, 263, 52, 52).data;
      let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 235) n++;
      return n;
    }, bx);
    const [l, r] = [await bright(markerBox.left), await bright(markerBox.right)];
    const onRight = g.marker.viewerSide === "viewer-right";
    ok(`${tag}: marker glyph is on the viewer's ${onRight ? "right" : "left"} half only`, // Heavy quantum noise can put a few bright pixels in the other box, so require a clear margin, not zero.
      onRight ? r > 80 && r > 3 * l : l > 80 && l > 3 * r, `l=${l} r=${r}`);
  }

  // 6. Layout / direction / console.
  ok(`${tag}: no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  const box = await holder.boundingBox();
  ok(`${tag}: radiograph inside the viewport`, box && box.x >= 0 && box.x + box.width <= DEVICES[device].viewport.width + 0.5, JSON.stringify(box));
  ok(`${tag}: canvas direction ltr`, (await canvas.evaluate((c) => getComputedStyle(c).direction)) === "ltr");
  ok(`${tag}: not-representative notice only for non-PA`, (await page.locator('[data-testid="not-representative"]').count()) === (u.projection === "pa-erect" ? 0 : 1) || sc.fromInitial);

  // 7. Pixels: identical across locales/devices; golden image on desktop/EN.
  const luma = await lumaOf(canvas);
  const h = sha(luma.pixels);
  const prior = fullHashByScenario.get(sc.id);
  if (prior) ok(`${tag}: pixels identical to the first run of this scenario (RTL/device independent)`, prior === h, `${prior} vs ${h}`);
  else fullHashByScenario.set(sc.id, h);
  const goldenPath = `scripts/qa/golden/images/${sc.id}.png`;
  const small = downscale2(luma.width, luma.height, luma.pixels);
  if (UPDATE && loc === "en" && device === "desktop") writeFileSync(goldenPath, encodeGrey(small.width, small.height, small.pixels));
  else if (existsSync(goldenPath)) {
    const cmp = compareGrey(small, decodeGrey(readFileSync(goldenPath)));
    ok(`${tag}: matches the golden image`, cmp.sameSize && cmp.meanAbs < 0.75 && cmp.badFraction < 0.002, JSON.stringify(cmp));
  } else ok(`${tag}: golden image exists (run with --update-goldens)`, false);
  ok(`${tag}: no console errors`, errors.length === 0, errors.join(" | "));
  if (device === "desktop" && loc === "en" && ["correct", "combo-all-wrong"].includes(sc.id)) await page.screenshot({ path: `${OUT}/${tag.replaceAll("/", "-")}-page.png`, fullPage: true });
  if (device !== "desktop") await page.screenshot({ path: `${OUT}/${tag.replaceAll("/", "-")}-page.png`, fullPage: true });
  await ctx.close();
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const all = file.scenarios.filter((s) => !ONLY || ONLY.includes(s.id));
for (const device of DEVICE_NAMES) {
  const list = device === "desktop" || flag("all-devices") ? all : all.filter((s) => SUBSET.includes(s.id));
  for (const loc of LOCALES) for (const sc of list) await runScenario(browser, loc, device, sc);
}
await browser.close();
const failed = results.filter((r) => !r.pass);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} checks passed (${all.length} scenarios; ${LOCALES.join("+")} × ${DEVICE_NAMES.join("+")}); output in ${OUT}`);
if (failed.length) { for (const f of failed) console.log(" ✗", f.name, f.extra); process.exit(1); }
