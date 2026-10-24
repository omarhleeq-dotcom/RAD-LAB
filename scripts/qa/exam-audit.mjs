// Layout + axe audit for any list of exams, EN/AR x 390/1440 (RAD-074). Run manually, not part of CI.
//   npm run build && npx next start -p 3100 &
//   npm i --no-save playwright axe-core
//   BASE=http://localhost:3100 npm run qa:exam-audit -- chest-pa-erect pelvis-ap-supine      (a list of exam ids)
//   BASE=http://localhost:3100 npm run qa:exam-audit -- --all                                 (every exam of the registry)
// Options: --locales=en,ar  --widths=390,1440  (defaults: both locales, both widths). Env: BASE, OUT (screenshots), CHROMIUM.
// Per exam / locale / width, through the real UI (roles and accessible names only; `workspace.mjs` opens the phone tabs):
//   hub page            one h1, axe WCAG 2 A/AA, no horizontal overflow;
//   practice (set-up)   axe + no horizontal overflow on every control view: the phone's case sheet and each of the four tabs,
//                       or the whole desktop page (desktop: no tablist); Expose reachable;
//   result              after Expose with the default settings: the radiograph is ready with a text alternative, axe, no overflow;
//   whole flow          no uncaught page error and no console error.
// It replaces the throw-away layout/axe scripts of the RAD-072 sessions; it does not score an attempt (the per-exam
// `*-audit.mjs` scripts do that). Exit code 1 on any failed check.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { WORKSPACE_TABS, isPhone, openTab, startPractice } from "./workspace.mjs";

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "/tmp/rad-lab-qa-exam-audit";
const LOCALES = opt("locales")?.split(",") ?? ["en", "ar"];
const WIDTHS = (opt("widths")?.split(",") ?? ["390", "1440"]).map(Number);
const MODALITY = "xray";
const registryIds = () => [...readFileSync("src/data/exams/index.ts", "utf8").matchAll(/from "\.\/xray\/([a-z0-9-]+)"/g)].map((m) => m[1]);
const EXAMS = args.includes("--all") ? registryIds() : args.filter((a) => !a.startsWith("--"));
if (!EXAMS.length) {
  console.error("usage: npm run qa:exam-audit -- <exam-id> [<exam-id> ...] | --all   [--locales=en,ar] [--widths=390,1440]");
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const MSGS = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const VIEW = (w) => (w < 1024 ? { viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: 900 } });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
let checks = 0, failed = 0;
const rows = [];

for (const exam of EXAMS) for (const loc of LOCALES) for (const width of WIDTHS) {
  const tag = `${exam} ${loc}/${width}`;
  const msgs = MSGS[loc];
  let c = 0, f = 0;
  const ok = (name, cond, extra = "") => { c++; if (!cond) { f++; console.log("  FAIL", `${tag}: ${name}`, extra); } };
  const ctx = await browser.newContext({ ...VIEW(width), locale: loc === "ar" ? "ar" : "en-US" });
  if (process.env.THEME) await ctx.addInitScript((t) => localStorage.setItem("radlab-theme", t), process.env.THEME); // RAD-069 B2a: THEME=light|dark (default: the site default, dark)
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const axe = async (area) => {
    await page.evaluate(axeSrc);
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
    ok(`axe ${area}`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, n: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) }))));
  };
  const overflow = async (area) => ok(`no horizontal overflow ${area}`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  const shot = (name) => page.screenshot({ path: `${OUT}/${exam}-${loc}-${width}-${name}.png`, fullPage: true });

  try {
    const hub = await page.goto(`${BASE}/${loc}/${MODALITY}/${exam}`, { waitUntil: "networkidle" });
    ok("hub page exists", hub?.status() === 200, `HTTP ${hub?.status()}`);
    if (hub?.status() === 200) {
      ok("hub has one h1", (await page.getByRole("heading", { level: 1 }).count()) === 1);
      await axe("hub");
      await overflow("hub");

      await page.goto(`${BASE}/${loc}/${MODALITY}/${exam}/practice`, { waitUntil: "networkidle" });
      await page.locator('section[aria-labelledby="pos-heading"], [data-phone-app]').first().waitFor({ timeout: 20000 });
      const phone = await isPhone(page);
      ok("layout matches the width", phone === width < 1024);
      if (phone) {
        ok("case sheet opens on load", await page.getByRole("dialog").getByRole("button", { name: msgs.workspace.startCase, exact: true }).isVisible());
        await axe("case sheet");
        await startPractice(page, msgs);
        for (const id of WORKSPACE_TABS) {
          await openTab(page, msgs, id);
          await axe(`tab ${id}`);
          await overflow(`tab ${id}`);
        }
        await openTab(page, msgs, "positioning");
        await shot("setup");
      } else {
        ok("desktop has no tablist", (await page.getByRole("tablist").count()) === 0);
        await axe("setup");
        await overflow("setup");
        await shot("setup");
      }
      const expose = page.getByRole("button", { name: msgs.console.expose, exact: true });
      ok("Expose is visible and enabled", (await expose.isVisible()) && (await expose.isEnabled()));
      await expose.click();
      await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]', { timeout: 30000 });
      const alt = (await page.locator('[data-testid="radiograph"] canvas').first().getAttribute("aria-label")) ?? "";
      ok("result image has a text alternative", alt.trim().length > 0, alt);
      await axe("result");
      await overflow("result");
      await shot("result");
    }
  } catch (e) {
    ok("flow completed", false, String(e.message).split("\n")[0]);
  }
  ok("no uncaught page error or console error", errors.length === 0, JSON.stringify(errors.slice(0, 3)));
  await ctx.close();
  checks += c; failed += f;
  rows.push({ tag, checks: c, failed: f });
}
await browser.close();

console.log("\n| exam | locale/width | checks | failed |\n|---|---|---|---|");
for (const r of rows) console.log(`| ${r.tag.split(" ")[0]} | ${r.tag.split(" ")[1]} | ${r.checks} | ${r.failed} |`);
console.log(`\n${checks} checks over ${EXAMS.length} exam(s) x ${LOCALES.length} locale(s) x ${WIDTHS.length} width(s), ${failed} failure(s). Screenshots in ${OUT}.`);
process.exit(failed ? 1 : 0);
