// UI-3 (RAD-067) phone simulator layout audit (Playwright + axe-core; run manually, not part of CI).
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core && BASE=http://localhost:3100 node scripts/qa/simulator-layout-audit.mjs [exam-id ...]
// EN/AR x desktop 1440 / phone 390, per exam: axe on the set-up and result screens, no horizontal overflow, and
//  - the scene SVGs are the same drawings on both layouts (outerHTML compared with React ids removed);
//  - every form control of the desktop layout exists on the phone layout with the same accessible label, in the same order per group;
//  - phone (a full-screen app view): the document never scrolls; tablist/tab/tabpanel roles, arrow keys follow the visual order
//    (mirrored in RTL), the "not ready" dot, 44px targets, tabs and bottom bar visible without scrolling, a one-row scene
//    header, no keyboard-hint text, fine adjustment collapsed, compact technique rows, the schematic note once (in the case
//    sheet), the case-details (i) sheet auto-opens once and takes/returns focus like the readiness sheet, Expose shows the
//    result inside the view, Retry does not reopen the case sheet;
//  - touch (owner phone check 2): hit areas of the side marker, the field handles and the crosshair are >= 44 CSS px, the marker letter is
//    larger, the marker's visible centre is at the same place on the detector as on desktop, "Enlarge scene" opens a near-full-screen
//    scene (no tabs or bottom bar, no document scroll, settings kept) and closes with Close or Escape, focus moving in and back;
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
    .replace(/<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"( rx="5" fill="#06101a" opacity="0.82")/g, "<rect PILL$1")
    // Phone-only touch geometry (owner phone check 2): hit areas and the handle size follow the on-screen scale.
    .replace(/<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"( fill="transparent")/g, "<rect HIT$1")
    .replace(/<circle cx="([^"]*)" cy="([^"]*)" r="[^"]*" fill="transparent"/g, '<circle cx="$1" cy="$2" r="HIT" fill="transparent"')
    .replace(/<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"( rx="3")/g, "<rect HANDLE$1");
  const svgs = [...document.querySelectorAll("main svg")].filter((s) => s.closest("section[aria-labelledby='pos-heading']") || s.closest("[role='tabpanel']"))
    .filter((s) => !s.closest("button") && !s.hasAttribute("data-ui-icon")).map((s) => clean(s.outerHTML)).sort();
  const label = (el) => {
    if (el.labels?.length) return [...el.labels].map((l) => l.textContent.trim()).join(" ");
    return el.getAttribute("aria-label") ?? el.closest("label")?.textContent.trim() ?? "";
  };
  const controls = [...document.querySelectorAll("main input, main select, main textarea")]
    .filter((el) => !el.closest("form"))
    .map((el) => `${el.type}|${el.name}|${label(el)}`);
  return { svgs, controls };
});

// Visible marker centre (normalised to the detector SVG box) and the hit areas of the marker, the field handles and the crosshair.
const touch = (page) => page.evaluate(() => {
  const svg = document.querySelector("section[aria-labelledby='pos-heading'] figure svg[role=group]");
  const box = svg.getBoundingClientRect();
  const r = (el) => el.getBoundingClientRect();
  const marker = svg.querySelector("g[role=button]:not([aria-describedby])");
  const visible = marker && marker.querySelector("rect:not([fill=transparent])");
  const letter = marker && marker.querySelector("text");
  // In scene units (viewBox space), so letterboxing and scale do not matter: the stored position maps to the same centre.
  const vb = svg.viewBox.baseVal, inv = svg.getScreenCTM().inverse();
  const centre = visible && (() => { const u = new DOMPoint(r(visible).x + r(visible).width / 2, r(visible).y + r(visible).height / 2).matrixTransform(inv); return { x: (u.x - vb.x) / vb.width, y: (u.y - vb.y) / vb.height }; })();
  return {
    width: box.width,
    centre,
    markerHit: marker && Math.min(r(marker.querySelector("rect[fill=transparent]")).width, r(marker.querySelector("rect[fill=transparent]")).height),
    letterHeight: letter && r(letter).height,
    handleHits: [...svg.querySelectorAll(":scope > g[aria-hidden] > rect[fill=transparent]")].map((el) => Math.min(r(el).width, r(el).height)),
    rayHit: Math.min(r(svg.querySelector("g[aria-describedby] > circle[fill=transparent]")).width, r(svg.querySelector("g[aria-describedby] > circle[fill=transparent]")).height),
  };
});
const pickMarker = async (page) => { await page.locator("label:has(input[name='side-marker'])").nth(1).click(); await page.waitForTimeout(150); };

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
      await pickMarker(page);
      ref.touch = await touch(page);
      ok(`${tag} no tablist on desktop`, (await tablist.count()) === 0);
      ok(`${tag} console Expose`, await page.getByRole("button", { name: m.console.expose, exact: true }).isVisible());
      ok(`${tag} console readiness`, await page.getByText(`${m.console.readiness.title}:`).first().isVisible());
    } else {
      ok(`${tag} same scene drawings as desktop`, JSON.stringify(snap.svgs) === JSON.stringify(ref.svgs), `${snap.svgs.length} vs ${ref.svgs.length}`);
      ok(`${tag} every control kept (labels, ids/names, order)`, JSON.stringify(snap.controls.slice().sort()) === JSON.stringify(ref.controls.slice().sort()),
        JSON.stringify({ phoneOnly: snap.controls.filter((c) => !ref.controls.includes(c)), desktopOnly: ref.controls.filter((c) => !snap.controls.includes(c)) }));
      // Case-details sheet: it auto-opened once when the case loaded; "Start" closes it and focus returns to the (i) button.
      const caseDialog = page.getByRole("dialog", { name: m.workspace.caseDetails });
      const caseButton = page.getByRole("button", { name: m.workspace.caseDetails, exact: true });
      ok(`${tag} case sheet auto-opens on load`, await caseDialog.isVisible());
      ok(`${tag} case sheet focus inside`, await page.evaluate(() => !!document.activeElement?.closest("dialog")));
      const note = await caseDialog.evaluate((d) => d.querySelector("div.\\[\\&_p\\]\\:px-0 p")?.textContent ?? "");
      ok(`${tag} schematic note is in the case sheet`, note.length > 10);
      ok(`${tag} schematic note appears once`, (await page.evaluate((n) => [...document.querySelectorAll("p")].filter((p) => p.textContent === n).length, note)) === 1);
      await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-case-sheet.png` });
      await axe("case sheet");
      await caseDialog.getByRole("button", { name: m.workspace.startCase, exact: true }).click();
      ok(`${tag} case sheet closed by Start`, !(await caseDialog.isVisible()));
      ok(`${tag} focus back on (i)`, await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === m.workspace.caseDetails);
      await caseButton.click();
      ok(`${tag} (i) reopens the sheet`, await caseDialog.isVisible());
      await page.keyboard.press("Escape");
      ok(`${tag} Escape closes the case sheet`, !(await caseDialog.isVisible()));

      // Touch: hit areas >= 44 CSS px, a larger marker letter, and the marker's visible centre where it is on desktop.
      await pickMarker(page);
      const tc = await touch(page);
      ok(`${tag} marker hit area >= 44px`, tc.markerHit >= 43.5, String(tc.markerHit));
      ok(`${tag} every field handle hit area >= 44px`, tc.handleHits.length === 8 && tc.handleHits.every((h) => h >= 43.5), tc.handleHits.join(","));
      ok(`${tag} crosshair hit area >= 44px`, tc.rayHit >= 43.5, String(tc.rayHit));
      ok(`${tag} marker letter larger than the scaled-down default`, tc.letterHeight >= 14, String(tc.letterHeight));
      ok(`${tag} marker centre unchanged vs desktop (scored position)`, Math.abs(tc.centre.x - ref.touch.centre.x) < 0.003 && Math.abs(tc.centre.y - ref.touch.centre.y) < 0.003, JSON.stringify({ phone: tc.centre, desktop: ref.touch.centre }));
      // Enlarge scene: near full screen, no tabs or bottom bar, no document scroll, settings kept; focus moves in and back.
      const enlargeButton = page.getByRole("button", { name: m.workspace.enlargeScene, exact: true });
      const markerBefore = await page.locator("input[name='side-marker']:checked").evaluate((el) => el.closest("label").textContent.trim());
      await enlargeButton.click();
      const big = page.getByRole("dialog", { name: m.workspace.enlargeScene });
      ok(`${tag} enlarge opens a dialog`, await big.isVisible());
      ok(`${tag} enlarged: tabs hidden and the bottom bar is covered`, !(await page.getByRole("tablist").isVisible()) && await page.evaluate(() => {
        const e = [...document.querySelectorAll("button")].find((b) => b.closest("[inert]") && b.textContent.trim().length > 0 && b.getBoundingClientRect().bottom > innerHeight - 80);
        if (!e) return true;
        const r = e.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return !!top?.closest("[role=dialog][aria-modal]");
      }));
      ok(`${tag} enlarged: focus on Close`, await page.evaluate((c) => document.activeElement?.textContent?.trim() === c, m.workspace.closeSheet));
      const te = await touch(page);
      ok(`${tag} enlarged: scene wider than the small one`, te.width >= tc.width * 0.99, `${te.width} vs ${tc.width}`);
      ok(`${tag} enlarged: hit areas still >= 44px`, te.markerHit >= 43.5 && te.rayHit >= 43.5 && te.handleHits.every((h) => h >= 43.5));
      const enlargedFrame = await page.evaluate(() => { const d = document.querySelector("[role=dialog][aria-modal]").getBoundingClientRect(); return { top: d.top, left: d.left, w: d.width, h: d.height, vw: innerWidth, vh: innerHeight }; });
      ok(`${tag} enlarged: covers the screen`, enlargedFrame.w >= enlargedFrame.vw - 1 && enlargedFrame.h >= enlargedFrame.vh - 1, JSON.stringify(enlargedFrame));
      await page.evaluate(() => window.scrollTo(0, 600));
      ok(`${tag} no document scroll (enlarged)`, await page.evaluate(() => scrollY === 0 && document.documentElement.scrollHeight <= innerHeight + 1));
      await noOverflow("enlarged");
      await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-enlarged.png` });
      await axe("enlarged scene");
      await page.keyboard.press("Escape");
      ok(`${tag} Escape closes the enlarged scene`, !(await big.isVisible()) && (await page.getByRole("tablist").isVisible()));
      ok(`${tag} focus back on Enlarge`, await page.evaluate((c) => document.activeElement?.getAttribute("aria-label") === c, m.workspace.enlargeScene));
      ok(`${tag} settings kept after closing`, (await page.locator("input[name='side-marker']:checked").evaluate((el) => el.closest("label").textContent.trim())) === markerBefore);
      await enlargeButton.click();
      await page.getByRole("button", { name: m.workspace.closeSheet, exact: true }).click();
      ok(`${tag} Close button closes the enlarged scene`, !(await big.isVisible()) && (await page.getByRole("tablist").isVisible()));

      // Full-screen app view: the document never scrolls.
      const noScroll = async (area) => {
        await page.evaluate(() => window.scrollTo(0, 600));
        const r = await page.evaluate(() => ({ y: window.scrollY, sh: document.documentElement.scrollHeight, vh: window.innerHeight }));
        ok(`${tag} no document scroll (${area})`, r.y === 0 && r.sh <= r.vh + 1, JSON.stringify(r));
      };
      await noScroll("setup");
      // Top bar: back, title, (i), menu; the site header is hidden.
      ok(`${tag} top bar controls`, (await page.getByRole("link", { name: m.workspace.backToLibrary }).isVisible()) && (await caseButton.isVisible())
        && (await page.getByRole("button", { name: m.shell.openMenu, exact: true }).isVisible()) && (await page.getByRole("heading", { level: 1 }).isVisible()));
      ok(`${tag} site header hidden`, !(await page.locator(".site-header").isVisible()));
      // Scene header on one row: the view switch and the guides toggle share a line.
      const sw = await page.getByRole("group", { name: m.workspace.sceneViews }).boundingBox();
      const gt = await page.getByLabel(m.positioning.guides).locator("xpath=..").boundingBox();
      ok(`${tag} scene header is one row`, Math.abs((sw.y + sw.height / 2) - (gt.y + gt.height / 2)) < 6 && sw.height < 60, JSON.stringify({ sw, gt }));
      const switchNames = await page.getByRole("group", { name: m.workspace.sceneViews }).getByRole("button").allTextContents();
      ok(`${tag} short view switch labels`, switchNames[0] === m.workspace.viewDetector && [m.workspace.viewTop, m.workspace.viewSide].includes(switchNames[1]), switchNames.join("|"));
      ok(`${tag} guides toggle 44px + labelled`, (await gt.height) >= 44 && (await page.getByLabel(m.positioning.guides).count()) === 1);

      const tabs = page.getByRole("tab");
      ok(`${tag} four tabs`, (await tabs.count()) === 4);
      const names = Object.values(m.workspace.tabs);
      const hintRe = /arrow keys|page up|keyboard|home and end|مفاتيح الأسهم|لوحة المفاتيح/i;
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
        // No keyboard instructions anywhere in the phone view (only the visible text of the open panel counts).
        const visible = await page.evaluate(() => document.querySelector("[data-phone-app]").innerText);
        ok(`${tag} tab ${i} no keyboard-hint text`, !hintRe.test(visible) && !visible.includes(m.console.adjustHint) && !visible.includes(m.positioning.workspaceHint), (visible.match(hintRe) ?? [""])[0]);
        // Tabs and bottom bar are in view without scrolling; the panel scrolls inside only when needed.
        const frame = await page.evaluate(() => {
          const vh = innerHeight, r = (el) => el.getBoundingClientRect();
          const tab = document.querySelector("[role=tablist]"), bar = document.querySelector("[aria-controls$='-sheet']").parentElement;
          return { vh, tabsBottom: r(tab).bottom, barTop: r(bar).top, barBottom: r(bar).bottom };
        });
        ok(`${tag} tab ${i} tabs + bottom bar visible without scrolling`, frame.tabsBottom <= frame.barTop && frame.barBottom <= frame.vh + 1 && frame.tabsBottom > 0, JSON.stringify(frame));
        await noScroll(`tab ${i}`);
        await noOverflow(`tab ${i}`);
        await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-tab${i}.png` });
        if (i === 1) {
          ok(`${tag} fine adjustment collapsed by default`, await panel.locator("details").evaluate((d) => !d.open));
          ok(`${tag} touch hint in Centring`, (await panel.innerText()).includes(m.positioning.touchHint));
        }
        if (i === 3) {
          const heights = await panel.locator("[role=group][aria-labelledby]").evaluateAll((els) => els.filter((e) => e.querySelector("input[type=range]")).map((e) => e.getBoundingClientRect().height));
          ok(`${tag} technique rows are compact`, heights.length >= 3 && heights.every((h) => h <= 84), heights.join(","));
        }
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
      // Readiness sheet: opens as a modal, focus moves in, Escape closes and returns focus to the trigger.
      const trigger = page.locator("[aria-controls$='-sheet']");
      for (const b of [trigger, page.getByRole("button", { name: m.console.expose, exact: true })]) {
        const box = await b.boundingBox();
        ok(`${tag} bar button 44px`, box.height >= 44, String(box.height));
      }
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: m.workspace.readinessDetails });
      ok(`${tag} sheet open`, await dialog.isVisible());
      ok(`${tag} sheet focus inside`, await page.evaluate(() => !!document.activeElement?.closest("dialog")));
      ok(`${tag} sheet lists readiness`, await dialog.getByText(`${m.console.readiness.title}:`).isVisible());
      await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-sheet.png` });
      await axe("readiness sheet");
      await page.keyboard.press("Escape");
      ok(`${tag} sheet closed`, !(await dialog.isVisible()));
      ok(`${tag} focus back on trigger`, await page.evaluate(() => document.activeElement?.getAttribute("aria-haspopup") === "dialog" && document.activeElement?.getAttribute("aria-controls")?.endsWith("-sheet")));
      // The menu button opens the site navigation (side menu + language switch).
      await page.getByRole("button", { name: m.shell.openMenu, exact: true }).click();
      ok(`${tag} menu reachable from the top bar`, await page.locator("#mobile-navigation").isVisible());
      await page.keyboard.press("Escape");
    }

    // Expose from where the learner is (bar on the phone, console on desktop): the result appears; the radiograph only after Expose.
    ok(`${tag} no radiograph before Expose`, (await page.locator("canvas").count()) === 0);
    await page.getByRole("button", { name: m.console.expose, exact: true }).click();
    await page.waitForTimeout(1000);
    ok(`${tag} result shown`, (await page.locator("canvas, img[alt]").count()) > 0);
    await axe("result");
    await noOverflow("result");
    if (dev === "phone") {
      ok(`${tag} result inside the view (document still does not scroll)`, await page.evaluate(() => { window.scrollTo(0, 600); return scrollY === 0 && document.documentElement.scrollHeight <= innerHeight + 1; }));
      await page.getByRole("button", { name: m.result.retry }).click();
      await page.waitForTimeout(300);
      ok(`${tag} Retry does not reopen the case sheet`, !(await page.getByRole("dialog", { name: m.workspace.caseDetails }).isVisible()));
    }
    await page.screenshot({ path: `${OUT}/${exam}-${loc}-${dev}-result.png`, fullPage: dev === "desktop" });
    ok(`${tag} no page errors`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }
}
await browser.close();
console.log(`${checks} checks, ${axeRuns} axe runs, ${failed} failed`);
process.exit(failed ? 1 : 0);
