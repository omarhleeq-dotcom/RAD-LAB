// Review contact sheets for the library graphics (RAD-069 B2b): every graphic, old next to new, at phone-card size and large,
// one compressed JPEG per theme. Renders the real ExamGraphic components (old from a git ref, new from the working tree).
//   node scripts/library-graphics/contact-sheet.mjs --old-ref <commit> [--out docs/review/rad-069b2b-contact] [--only kind,kind]
// Phase A compared the pre-B2b drawings with the new ones; Phase B compares the Phase A commit with the working tree for the changed kinds.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const oldRef = arg("--old-ref", "origin/main"), outBase = arg("--out", "docs/review/rad-069b2b-contact");
const require = createRequire(path.resolve("package.json"));
const { build: bundle } = require("esbuild"), { renderToStaticMarkup } = require("react-dom/server"), React = require("react");
const { chromium } = require("playwright");

// inside node_modules so the bundles resolve the project's own react
mkdirSync("node_modules/.cache", { recursive: true });
const dir = mkdtempSync(path.resolve("node_modules/.cache/rad-contact-"));
async function loadGraphic(name, source, assetDir) {
  const file = path.join(dir, `${name}.tsx`);
  writeFileSync(file, source);
  const out = path.join(dir, `${name}.mjs`);
  await bundle({ entryPoints: [file], outfile: out, bundle: true, platform: "node", format: "esm", jsx: "automatic", nodePaths: [path.resolve("node_modules")], absWorkingDir: assetDir, external: ["react", "react/jsx-runtime"], logLevel: "error" });
  return (await import(pathToFileURL(out).href)).ExamGraphic;
}
const present = JSON.parse(readFileSync("src/features/platform/catalogue-presentation.json", "utf8"));
const oldSource = execFileSync("git", ["show", `${oldRef}:src/features/platform/ExamGraphic.tsx`], { encoding: "utf8" });
const oldOldKinds = (kind) => !oldJson && kind === "body" ? "chest-pa" : kind;   // before B2b the body region reused the chest PA drawing
// from Phase A on the old ExamGraphic reads its drawings from library-graphics.json at that ref
let oldJson = null;
try { oldJson = execFileSync("git", ["show", `${oldRef}:src/features/platform/library-graphics.json`], { encoding: "utf8" }); } catch { /* the pre-B2b component has no data file */ }
const oldJsonFile = path.join(dir, "old-library-graphics.json");
if (oldJson) writeFileSync(oldJsonFile, oldJson);
const Old = await loadGraphic("old", oldJson ? oldSource.replace('"./library-graphics.json"', JSON.stringify(oldJsonFile)) : oldSource, path.resolve("."));
const New = await loadGraphic("new", readFileSync("src/features/platform/ExamGraphic.tsx", "utf8").replace('"./library-graphics.json"', JSON.stringify(path.resolve("src/features/platform/library-graphics.json"))), path.resolve("."));
const markup = (Component, kind) => renderToStaticMarkup(React.createElement(Component, { kind }));

const SOURCE = {
  traced: ["hand-pa", "hand-lateral", "wrist-pa", "wrist-lateral", "foot-ap", "foot-oblique", "shoulder-grashey"],
  kept: ["chest-pa", "chest-ap", "chest-lateral", "upper-limb", "lower-limb", "head"],
  project: ["knee-ap", "knee-lateral", "ankle-ap", "ankle-lateral", "elbow-ap", "elbow-lateral", "pelvis-ap"],
};
const sourceOf = (kind) => SOURCE.traced.includes(kind) ? "traced" : SOURCE.project.includes(kind) ? "project geometry" : SOURCE.kept.includes(kind) ? "old drawing kept, restyled" : "hand-built (new)";
const only = arg("--only", "") ? arg("--only", "").split(",") : null;
const kinds = [
  ...present.regions.map((r) => r.graphic),
  ...Object.values(present.projectionGraphics).flatMap((v) => Object.values(v)),
].filter((k) => !only || only.includes(k));
const THEMES = {
  dark: { paper: "#0d151c", ink: "#e6edf2", bg: "#12313a", brand: "#8ad8e3", soft: "#234d59" },
  light: { paper: "#f5f8fa", ink: "#15283b", bg: "#e5f4f6", brand: "#07555d", soft: "#bde4e9" },
};
const tile = (svg, w, h) => `<div class="art" style="width:${w}px;height:${h}px">${svg}</div>`;
const cell = (kind) => `<section><h2>${kind} <small>${sourceOf(kind)}</small></h2><div class="row">
  <div><p>before, card</p>${tile(markup(Old, oldOldKinds(kind)), 175, 80)}</div><div><p>after, card</p>${tile(markup(New, kind), 175, 80)}</div>
  <div><p>before, large</p>${tile(markup(Old, oldOldKinds(kind)), 280, 160)}</div><div><p>after, large</p>${tile(markup(New, kind), 280, 160)}</div></div></section>`;

const browser = await chromium.launch({ args: ["--no-sandbox"], ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
for (const [theme, t] of Object.entries(THEMES)) {
  const page = await browser.newPage({ viewport: { width: 2000, height: 1000 } });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    :root{--art-soft:${t.soft}} body{margin:0;padding:16px;background:${t.paper};color:${t.ink};font:12px/1.3 sans-serif}
    main{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px} h2{margin:0 0 4px;font-size:13px} small{font-weight:400;opacity:.7}
    .row{display:flex;gap:10px;align-items:flex-start} p{margin:0 0 2px;opacity:.65;font-size:10px}
    .art{background:${t.bg};color:${t.brand};overflow:hidden} .art svg{display:block;width:100%;height:100%;direction:ltr}
  </style><main>${kinds.map(cell).join("")}</main>`);
  await page.screenshot({ path: `${outBase}-${theme}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await page.close();
}
await browser.close();
console.log(kinds.length, "graphics;", `${outBase}-dark.jpg`, `${outBase}-light.jpg`);
