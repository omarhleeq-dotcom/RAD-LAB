// S14.2b-FIX phase 2 acceptance: at 390 px the hand-lateral baseline strip is >= 70% of the result canvas width (hatch = field without image data).
//   BASE=http://localhost:3100 node scripts/qa/hand-lateral-layout.mjs [en|ar]   (needs a running server and `npm i --no-save playwright`)
import { chromium } from "playwright";
const loc = process.argv[2] ?? "en";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: loc })).newPage();
await p.goto(`${process.env.BASE ?? "http://localhost:3100"}/${loc}/xray/hand-lateral/practice`, { waitUntil: "networkidle" });
await p.locator("label", { hasText: /Hand lateral|جانبي/ }).first().click();
await p.locator('label:has(input[name="side-marker"])').nth(1).click();
const vals = [0, 0, 15, 16, 30, 105, 65, 7];
await p.locator('input[type="range"]').evaluateAll((els, vs) => vs.forEach((v, i) => { const n = els[i]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(n, String(v)); n.dispatchEvent(new Event("input", { bubbles: true })); n.dispatchEvent(new Event("change", { bubbles: true })); }), vals);
await p.locator("button", { hasText: /expose|تعريض/i }).first().click();
await p.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 30000 });
const el = p.locator('[data-testid="radiograph"] canvas');
// analyse the canvas pixels directly (not the screenshot scaling): hatch columns = mid-row luma >= 85
const frac = await el.evaluate((c) => { const ctx = c.getContext("2d"); const w = c.width, h = c.height; const d = ctx.getImageData(0, Math.floor(h * 0.45), w, Math.floor(h * 0.1)).data; let strip = 0; for (let x = 0; x < w; x++) { let hatch = 0, n = 0; for (let y = 0; y < Math.floor(h * 0.1); y++) { const v = d[(y * w + x) * 4]; n++; if (v >= 85 && v <= 120) hatch++; } if (hatch / n < 0.5) strip++; } return { w, h, strip, frac: strip / w }; });
console.log(loc, JSON.stringify(frac));
await b.close();
if (frac.frac < 0.7) { console.log("FAIL: strip < 70% of the canvas width"); process.exit(1); }
