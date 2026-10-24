// RAD-069 B2a: theme audit, EN/AR x 390/1440 x dark/light. Local only, fixtures only, no hosted preview.
//   BASE=http://localhost:3100 node scripts/qa/rad-069b2a-themes-audit.mjs --set=main   (a `next start` build: home, library, hub, practice, result, credits, terms)
//   BASE=http://127.0.0.1:PORT node scripts/qa/rad-069b2a-themes-audit.mjs --set=pilot  (pilot static export: account login page)
// Checks: default dark, saved choice, storage failure, no flash (theme set before the body exists), colour-scheme meta + CSS, the toggle
// (button, name, aria-pressed, keyboard, header/menu placement), axe WCAG 2 A/AA, no overflow, screenshots, and that the result image and the
// simulator scene pixels are identical in both themes. --forced-dark adds a Chromium forced-dark comparison.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d;
const SET = arg("set", "main"), BASE = process.env.BASE ?? "http://localhost:3100", OUT = process.env.OUT ?? "docs/review";
const FORCED = process.argv.includes("--forced-dark");
mkdirSync(OUT, { recursive: true });
const MSGS = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const EXE = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium";
const PAGES = SET === "pilot" ? [["account", "/account"]] : [["home", ""], ["library", "/xray"], ["exam-hub", "/xray/chest-pa-erect"], ["practice", "/xray/chest-pa-erect/practice"], ["result", "RESULT"], ["credits", "/credits"], ["terms", "/terms"]];
const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
let checks = 0, axes = 0, shots = 0;
const ok = (v, label) => { assert.ok(v, label); checks++; };
const view = (w) => ({ viewport: { width: w, height: w === 390 ? 844 : 900 }, hasTouch: w === 390, isMobile: w === 390 });

async function ctxFor(theme, loc, w, extra = {}) {
  const ctx = await browser.newContext({ ...view(w), locale: loc === "ar" ? "ar" : "en-US", ...extra });
  if (theme) await ctx.addInitScript((t) => localStorage.setItem("radlab-theme", t), theme);
  return ctx;
}
async function axe(page, label) {
  await page.evaluate(axeSrc);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(r.violations.map((v) => ({ id: v.id, n: v.nodes.slice(0, 4).map((x) => x.target.join(" ")) })), [], `axe ${label}`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`);
  axes++;
}
async function openResult(page, loc) {
  await page.goto(`${BASE}/${loc}/xray/chest-pa-erect/practice`, { waitUntil: "networkidle" });
  const phone = await page.evaluate(() => matchMedia("(max-width: 1023px)").matches);
  if (phone) await page.getByRole("dialog").getByRole("button", { name: MSGS[loc].workspace.startCase, exact: true }).click();
  await page.getByRole("button", { name: MSGS[loc].console.expose, exact: true }).click();
  await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 30000 });
}
// Pixels of an element, inset so rounded corners (which show the themed page behind them) are not compared.
async function inner(page, loc, inset = 6) {
  const b = await loc.boundingBox(); const [sx, sy] = await page.evaluate(() => [scrollX, scrollY]);
  return page.screenshot({ fullPage: true, clip: { x: b.x + sx + inset, y: b.y + sy + inset, width: b.width - 2 * inset, height: b.height - 2 * inset } });
}
async function diffPixels(page, a, b) {
  return page.evaluate(async ([x, y]) => {
    const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${s}`; });
    const [A, B] = await Promise.all([load(x), load(y)]);
    if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height], diff: -1 };
    const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
    const p = px(A), q = px(B); let d = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2] || p[i + 3] !== q[i + 3]) d++;
    return { size: [A.width, A.height], diff: d };
  }, [a.toString("base64"), b.toString("base64")]);
}

try {
  if (SET === "main") {
    // --- theme mechanics (once) ---
    let c = await ctxFor(null, "en", 1440), p = await c.newPage();
    await p.addInitScript(() => { window.__sets = []; const o = Element.prototype.setAttribute; Element.prototype.setAttribute = function (n, v) { if (n === "data-theme") window.__sets.push({ v, body: !!document.body }); return o.call(this, n, v); }; });
    await p.goto(`${BASE}/en`, { waitUntil: "networkidle" });
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "dark", "default is dark with nothing stored");
    ok(await p.evaluate(() => document.querySelector('meta[name="color-scheme"]').content) === "dark", "meta color-scheme dark");
    ok(await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme) === "dark", "CSS color-scheme dark");
    ok(await p.evaluate(() => getComputedStyle(document.documentElement).backgroundColor) === "rgb(13, 21, 28)", "dark page background");
    const toggle = p.locator('[data-testid="theme-toggle"]:visible');
    ok(await toggle.count() === 1, "one visible toggle at 1440");
    ok(await p.evaluate(() => document.querySelector('.site-topbar [data-testid="theme-toggle"]') !== null), "toggle sits in the top bar");
    ok(await p.evaluate(() => { const l = document.querySelector(".site-topbar .language-switcher").getBoundingClientRect(), t = document.querySelector('.site-topbar [data-testid="theme-toggle"]').getBoundingClientRect(); return Math.abs(l.top - t.top) < 24 && Math.abs(l.right - t.left) < 40 || Math.abs(t.right - l.left) < 40; }), "toggle is next to the language switch");
    ok(await toggle.evaluate((n) => n.tagName === "BUTTON") && (await toggle.getAttribute("aria-label")) === MSGS.en.shell.theme && (await toggle.getAttribute("aria-pressed")) === "true", "real button, EN name, pressed in dark");
    await toggle.focus(); await p.keyboard.press("Enter");
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "light" && (await toggle.getAttribute("aria-pressed")) === "false", "Enter turns light and un-presses");
    ok(await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme) === "light" && await p.evaluate(() => document.querySelector('meta[name="color-scheme"]').content) === "light", "colour-scheme follows the active theme");
    ok(await p.evaluate(() => localStorage.getItem("radlab-theme")) === "light", "choice saved on the device");
    await p.keyboard.press("Space");
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "dark", "Space turns dark again");
    await p.keyboard.press("Enter");
    await p.reload({ waitUntil: "networkidle" });
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "light", "saved light survives a reload");
    const sets = await p.evaluate(() => window.__sets);
    ok(sets.length >= 1 && sets[0].v === "light" && sets[0].body === false, `no flash: light was set before the body existed (${JSON.stringify(sets[0])})`);
    ok(await p.evaluate(() => navigator.userAgent !== "") && (await (await browser.newContext({ colorScheme: "light" })).newPage().then(async (q) => { await q.goto(`${BASE}/en`, { waitUntil: "networkidle" }); return q.evaluate(() => document.documentElement.dataset.theme); })) === "dark", "device light preference is ignored (still dark)");
    await c.close();
    // storage failure -> dark
    c = await ctxFor(null, "ar", 390); await c.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("blocked"); }; Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
    p = await c.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(`${BASE}/ar`, { waitUntil: "networkidle" });
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "dark", "storage failure -> dark");
    await p.getByTestId("menu-toggle").click();
    const mt = p.locator('dialog [data-testid="theme-toggle"]');
    ok((await mt.getAttribute("aria-label")) === MSGS.ar.shell.theme && (await mt.getAttribute("aria-pressed")) === "true", "AR menu toggle: name + pressed");
    ok(await p.locator('.site-topbar [data-testid="theme-toggle"]:visible').count() === 0, "phone: toggle is in the menu, not the top bar");
    await mt.click();
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "light", "toggle works with storage blocked (this view only)");
    ok(errs.length === 0, "no page error with storage blocked");
    await c.close();
  }

  // --- pages x theme x locale x width ---
  const shotsBuf = {};
  for (const loc of ["en", "ar"]) for (const w of [390, 1440]) for (const theme of ["dark", "light"]) {
    const c = await ctxFor(theme, loc, w), p = await c.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    for (const [name, path] of PAGES) {
      const tag = `${theme}/${loc}/${w}/${name}`;
      if (path === "RESULT") await openResult(p, loc); else { const r = await p.goto(`${BASE}/${loc}${path}`, { waitUntil: "networkidle" }); ok(r?.status() === 200, `${tag}: HTTP 200`); }
      ok(await p.evaluate(() => document.documentElement.dataset.theme) === theme, `${tag}: theme applied`);
      if (name === "practice" && w === 390) await axe(p, `${tag}/case-sheet`);
      if (name === "practice" && w === 390) await p.getByRole("dialog").getByRole("button", { name: MSGS[loc].workspace.startCase, exact: true }).click();
      await axe(p, tag);
      await p.screenshot({ path: `${OUT}/rad-069b2a-${theme}-${loc}-${w}-${name}.png`, fullPage: name !== "practice" && name !== "result" }); shots++;
      if (name === "result") {
        const canvas = p.locator('[data-testid="radiograph"] canvas').first();
        (shotsBuf[`${loc}${w}`] ??= {})[theme] ??= { scene: [] };
        Object.assign(shotsBuf[`${loc}${w}`][theme], { image: await inner(p, canvas), data: await canvas.evaluate((c) => c.toDataURL()) });
      }
      if (name === "practice") {
        // The simulator scene drawings (SVG) on the practice page, before the exposure.
        (shotsBuf[`${loc}${w}`] ??= {})[theme] ??= { scene: [] };
        const svgs = p.locator('section[aria-labelledby="pos-heading"] svg:visible, [data-phone-app] svg:visible');
        for (let i = 0; i < Math.min(await svgs.count(), 12); i++) { const box = await svgs.nth(i).boundingBox(); if (box && box.width > 120 && box.height > 120) shotsBuf[`${loc}${w}`][theme].scene.push(await inner(p, svgs.nth(i))); }
      }
    }
    ok(errs.length === 0, `${theme}/${loc}/${w}: no page or console error ${JSON.stringify(errs.slice(0, 2))}`);
    await c.close();
  }
  if (SET === "main") {
    const pc = await (await browser.newContext()).newPage();
    for (const [k, v] of Object.entries(shotsBuf)) {
      const r = await diffPixels(pc, v.dark.image, v.light.image);
      ok(r.diff === 0 && v.dark.data === v.light.data, `${k}: result image identical in both themes (${JSON.stringify(r)}, canvas data equal: ${v.dark.data === v.light.data})`);
      ok(v.dark.scene.length === v.light.scene.length && v.dark.scene.length > 0, `${k}: same, non-zero scene count (${v.dark.scene.length})`);
      for (let i = 0; i < v.dark.scene.length; i++) { const s = await diffPixels(pc, v.dark.scene[i], v.light.scene[i]); ok(s.diff === 0, `${k}: scene drawing ${i} identical in both themes (${JSON.stringify(s)})`); }
      console.log(`pixel identity ${k}: result image ${JSON.stringify(r.size)} 0 differing; ${v.dark.scene.length} scene drawing(s) 0 differing`);
    }
  }
  if (SET === "main" && FORCED) {
    // Chromium forced-dark: our pages must keep our own colours in both themes.
    const fb = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--enable-features=WebContentsForceDark", "--force-dark-mode"] });
    const pc = await (await browser.newContext()).newPage();
    for (const theme of ["dark", "light"]) for (const [name, path] of PAGES.filter(([n]) => ["home", "library", "exam-hub", "credits"].includes(n))) {
      const norm = await (await ctxFor(theme, "en", 1440)).newPage(); await norm.goto(`${BASE}/en${path}`, { waitUntil: "networkidle" }); const a = await norm.screenshot();
      const fc = await fb.newContext({ ...view(1440) }); await fc.addInitScript((t) => localStorage.setItem("radlab-theme", t), theme);
      const fp = await fc.newPage(); await fp.goto(`${BASE}/en${path}`, { waitUntil: "networkidle" }); const b = await fp.screenshot();
      const r = await diffPixels(pc, a, b);
      const ratio = r.diff / (r.size[0] * r.size[1]);
      console.log(`forced-dark ${theme}/${name}: ${r.diff} differing pixels of ${r.size[0] * r.size[1]} (${(ratio * 100).toFixed(2)}%)`);
      // Dark declares color-scheme: dark, so Chromium leaves our colours (only 1px border lines are lightened). A light-scheme page cannot opt out of the flag: recorded, not asserted.
      if (theme === "dark") ok(ratio < 0.01, `forced-dark dark/${name}: page keeps our colours (${(ratio * 100).toFixed(2)}% differ)`);
      await fc.close();
    }
    await fb.close();
  }
} finally { await browser.close(); }
console.log(`B2a theme audit (${SET}): ${checks} checks, ${axes} axe audits, ${shots} screenshots in ${OUT}`);
