// UI-3 (RAD-067) phone simulator layout audit (Playwright + axe-core; run manually, not part of CI).
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core && BASE=http://localhost:3100 node scripts/qa/simulator-layout-audit.mjs [exam-id ...]
// EN/AR x desktop 1440 / phone 390, per exam: axe on the set-up and result screens, no horizontal overflow, and
//  - the scene SVGs are the same drawings on both layouts (outerHTML compared with React ids removed);
//  - every form control of the desktop layout exists on the phone layout with the same accessible label, in the same order per group;
//  - phone: tablist/tab/tabpanel roles, arrow keys follow the visual order (mirrored in RTL), the "not ready" dot,
//    44px targets, sticky scene and bottom bar, the readiness sheet takes and returns focus, Expose shows the result;
//  - desktop: no tablist, the console keeps its readiness box and Expose button.
// Screenshots in OUT (default /tmp/rad-lab-qa-ui3). Exit code 1 on any failure.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const EXAMS = process.argv.slice(2).length ? process.argv.slice(2) : ["chest-pa-erect", "wrist-pa", "elbow-ap", "knee-ap", "pelvis-ap-supine", "shoulder-grashey-erect"];
const OUT = process.env.OUT ?? "/tmp/rad-lab-qa-ui3";
mkdirSync(OUT, { recursive: true });
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const MSGS = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const DEVICES = { desktop: { viewport: { width: 1440, height: 900 } }, phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };
let failed = 0, checks = 0, axeRuns = 0;
const ok = (name, cond, extra = "") => { checks++; if (!cond) { failed++; console.log("  FAIL", name, extra); } };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });

// Scene drawings (all SVGs of the positioning section and its portalled cues) and form controls, from the live DOM.
const snapshot = (page) => page.evaluate(() => {
  // Label pills are sized from the browser's text measurement at the rendered scale; their geometry is not drawing code.
  const clean = (s) => s.replace(/_R_[A-Za-z0-9_]+_/g, "ID").replace(/\s(?:hidden|aria-hidden)="[^"]*"/g, "")
    .replace(/<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"( rx="5" fill="#06101a" opacity="0.82")/g, "<rect PILL$1");
  const svgs = [...document.querySelectorAll("main svg")].filter((s) => s.closest("section[aria-labelledby='pos-heading']") || s.closest("[role='tabpanel']"))
    .filter((s) => !s.closest("button")).map((s) => clean(s.outerHTML)).sort();
  const label = (el) => {
    if (el.labels?.length) return [...el.labels].map((l) => l.textContent.trim()).join(" ");
    return el.getAttribute("aria-label") ?? el.closest("label")?.textContent.trim() ?? "";
  };
  const controls = [...document.querySelectorAll("main input, main select, main textarea")]
    .filter((el) => !el.closest("form"))
    .map((el) => `${el.type}|${el.name}|${label(el)}`);
  return { svgs, controls };
});

for (const exam of EXAMS) for (const loc of ["en", "ar"]) {
  const m = MSGS[loc];
  const ref = {};
  for (const [dev, opts] of Object.entries(DEVICES)) {
    const tag = `${exam}/${loc}/${dev}`;
    const ctx = await browser.newContext({ ...opts, locale: loc === "ar" ? "ar" : "en-US" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const axe = async (area) => {
      axeRuns++;
      await page.evaluate(axeSrc);
      const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
      ok(`${tag} axe ${area}`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, n: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) }))));
    };
    const noOverflow = async (area) => ok(`${tag} no horizontal overflow ${area}`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

    await page.goto(`${BASE}/${loc}/xray/${exam}/practice`, { waitUntil: "networkidle" });
    await page.waitForSelector("section[aria-labelledby='pos-heading']");
    await axe("setup");
    await noOverflow("setup");
    await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-setup.png` });
    const snap = await snapshot(page);
    const tablist = page.getByRole("tablist");

    if (dev === "desktop") {
      Object.assign(ref, snap);
      ok(`${tag} no tablist on desktop`, (await tablist.count()) === 0);
      ok(`${tag} console Expose`, await page.getByRole("button", { name: m.console.expose, exact: true }).isVisible());
      ok(`${tag} console readiness`, await page.getByText(`${m.console.readiness.title}:`).first().isVisible());
    } else {
      ok(`${tag} same scene drawings as desktop`, JSON.stringify(snap.svgs) === JSON.stringify(ref.svgs), `${snap.svgs.length} vs ${ref.svgs.length}`);
      ok(`${tag} every control kept (labels, ids/names, order)`, JSON.stringify(snap.controls.slice().sort()) === JSON.stringify(ref.controls.slice().sort()),
        JSON.stringify({ phoneOnly: snap.controls.filter((c) => !ref.controls.includes(c)), desktopOnly: ref.controls.filter((c) => !snap.controls.includes(c)) }));
      // Order inside each group: the desktop order of the controls, restricted to those in one tab panel, is the panel's order.
      const tabs = page.getByRole("tab");
      ok(`${tag} four tabs`, (await tabs.count()) === 4);
      const names = Object.values(m.workspace.tabs);
      for (let i = 0; i < 4; i++) {
        const tab = tabs.nth(i);
        ok(`${tag} tab ${i} label`, (await tab.textContent()).startsWith(names[i]));
        const box = await tab.boundingBox();
        ok(`${tag} tab ${i} 44px`, box.height >= 44, String(box.height));
        await tab.click();
        ok(`${tag} tab ${i} selected`, (await tab.getAttribute("aria-selected")) === "true");
        const panel = page.locator(`[id="${await tab.getAttribute("aria-controls")}"]`);
        ok(`${tag} panel ${i} visible + labelled`, (await panel.isVisible()) && (await panel.getAttribute("role")) === "tabpanel" && (await panel.getAttribute("aria-labelledby")) === (await tab.getAttribute("id")));
        const inPanel = await panel.evaluate((p) => [...p.querySelectorAll("input")].map((el) => `${el.type}|${el.name}|${el.labels?.length ? [...el.labels].map((l) => l.textContent.trim()).join(" ") : el.closest("label")?.textContent.trim() ?? ""}`));
        const desktopOrder = ref.controls.filter((c) => inPanel.includes(c));
        ok(`${tag} panel ${i} order as desktop`, JSON.stringify(inPanel.filter((c) => ref.controls.includes(c))) === JSON.stringify(desktopOrder));
        ok(`${tag} panel ${i} has controls`, inPanel.length > 0);
        await noOverflow(`tab ${i}`);
        await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-tab${i}.png` });
      }
      // Keyboard: arrows follow the visual order (RTL mirrored), focus moves with the selection.
      await tabs.nth(0).focus();
      await page.keyboard.press(loc === "ar" ? "ArrowLeft" : "ArrowRight");
      ok(`${tag} arrow -> second tab`, (await tabs.nth(1).getAttribute("aria-selected")) === "true" && (await page.evaluate(() => document.activeElement?.getAttribute("role"))) === "tab");
      await page.keyboard.press("End");
      ok(`${tag} End -> last tab`, (await tabs.nth(3).getAttribute("aria-selected")) === "true");
      await page.keyboard.press("Home");
      ok(`${tag} Home -> first tab`, (await tabs.nth(0).getAttribute("aria-selected")) === "true");
      // Dot: the initial case has an unready item (no marker yet); the dot is announced in the tab name.
      ok(`${tag} attention dot`, (await page.locator("[role=tab]", { hasText: m.workspace.needsAttention }).count()) > 0);
      // Sticky scene + bottom bar after scrolling into the longest panel (Technique).
      await tabs.nth(3).click();
      await page.evaluate(() => window.scrollTo(0, document.querySelector("[role=tablist]").closest(".sticky").previousElementSibling.getBoundingClientRect().top + scrollY + 250));
      await page.waitForTimeout(200);
      const pos = await page.evaluate(() => {
        const s = document.querySelector("section[aria-labelledby='pos-heading']").getBoundingClientRect();
        const bar = document.querySelector("[aria-controls$='-sheet']")?.closest("div").getBoundingClientRect();
        return { sceneTop: s.top, sceneBottom: s.bottom, barBottom: bar?.bottom, vh: innerHeight };
      });
      ok(`${tag} sticky scene`, pos.sceneTop >= 0 && pos.sceneTop < 140 && pos.sceneBottom < pos.vh * 0.62, JSON.stringify(pos));
      ok(`${tag} sticky bottom bar`, Math.abs(pos.barBottom - pos.vh) < 2, JSON.stringify(pos));
      await tabs.nth(0).click();
      // Readiness sheet: opens as a modal, focus moves in, Escape closes and returns focus to the trigger.
      const trigger = page.locator("[aria-controls$='-sheet']");
      for (const b of [trigger, page.getByRole("button", { name: m.console.expose, exact: true })]) {
        const box = await b.boundingBox();
        ok(`${tag} bar button 44px`, box.height >= 44, String(box.height));
      }
      await trigger.click();
      const dialog = page.getByRole("dialog");
      ok(`${tag} sheet open`, await dialog.isVisible());
      ok(`${tag} sheet focus inside`, await page.evaluate(() => !!document.activeElement?.closest("dialog")));
      ok(`${tag} sheet lists readiness`, await dialog.getByText(`${m.console.readiness.title}:`).isVisible());
      await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-sheet.png` });
      await axe("readiness sheet");
      await page.keyboard.press("Escape");
      ok(`${tag} sheet closed`, !(await dialog.isVisible()));
      ok(`${tag} focus back on trigger`, await page.evaluate(() => document.activeElement?.getAttribute("aria-haspopup") === "dialog"));
    }

    // Expose from where the learner is (bar on the phone, console on desktop): the result appears; the radiograph only after Expose.
    ok(`${tag} no radiograph before Expose`, (await page.locator("canvas").count()) === 0);
    await page.getByRole("button", { name: m.console.expose, exact: true }).click();
    await page.waitForTimeout(1000);
    ok(`${tag} result shown`, (await page.locator("canvas, img[alt]").count()) > 0);
    await axe("result");
    await noOverflow("result");
    await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-result.png`, fullPage: true });
    ok(`${tag} no page errors`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }
}
await browser.close();
console.log(`${checks} checks, ${axeRuns} axe runs, ${failed} failed`);
process.exit(failed ? 1 : 0);
