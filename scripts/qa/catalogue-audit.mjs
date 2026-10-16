// RAD-053: local static export only, with a synthetic approved account and fully mocked Supabase.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const parts = JSON.parse(readFileSync("src/data/body-parts.json", "utf8")).bodyParts;
const messages = Object.fromEntries(["en", "ar"].map((loc) => [loc, JSON.parse(readFileSync(`messages/${loc}.json`, "utf8"))]));
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const supa = "https://abcdefghijklmnop.supabase.co";
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
let checks = 0, audits = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
mkdirSync("/tmp/rad-053", { recursive: true });
async function setup(signedIn, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const calls = [], errors = [];
  if (signedIn) await ctx.addInitScript((value) => localStorage.setItem("sb-abcdefghijklmnop-auth-token", value), JSON.stringify(session));
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    ok(url.origin === supa, `unexpected external request ${url.origin}`);
    calls.push(url.pathname);
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify({ status: "approved", role: "participant", participant_code: "P-test", consent_version: consent }) });
    if (url.pathname === "/rest/v1/events") return route.fulfill({ status: 201, headers });
    assert.fail(`unexpected mocked request ${req.method()} ${url.pathname}`);
  });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { ctx, page, calls, errors };
}
async function audit(page, label) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: overflow`);
  audits++;
}
async function catalogue(page, loc) {
  const groups = page.locator('[data-testid^="body-part-"]');
  await groups.first().waitFor();
  const actualIds = await groups.evaluateAll((els) => els.map((el) => el.dataset.testid.slice("body-part-".length)));
  ok(new Set(actualIds).size === actualIds.length && actualIds.length > 0, `${loc}: unique nonempty regions`);
  await page.getByTestId(`body-part-${actualIds[0]}`).getByRole("heading", { name: parts.find((part) => part.id === actualIds[0]).name[loc], exact: true }).waitFor();
  assert.deepEqual(actualIds, parts.filter((part) => actualIds.includes(part.id)).map((part) => part.id));
  for (const id of actualIds) {
    const group = page.getByTestId(`body-part-${id}`), part = parts.find((p) => p.id === id);
    ok(await group.getByRole("heading", { name: part.name[loc], exact: true }).isVisible(), `${loc}/${id}: localized heading`);
    ok(await group.locator('li[data-testid^="exam-"]').count() > 0, `${loc}/${id}: no empty group`);
  }
  const hrefs = await page.locator('[data-testid^="exam-"] a').evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  const exported = readdirSync(`out/${loc}/xray`).filter((name) => name.endsWith(".html")).map((name) => `/${loc}/xray/${name.slice(0, -5)}`);
  assert.deepEqual([...hrefs].sort(), exported.sort(), `${loc}: every exported exam appears exactly once with its existing URL`);
  ok(new Set(hrefs).size === hrefs.length, `${loc}: no duplicate exam`);
  ok(await page.locator("html").getAttribute("dir") === (loc === "ar" ? "rtl" : "ltr"), `${loc}: direction`);
}
try {
  for (const loc of ["en", "ar"]) for (const width of [390, 1440]) {
    const tag = `${loc}-${width}`, m = messages[loc];
    const { ctx, page, errors } = await setup(true, width);
    await page.goto(`${base}/${loc}`, { waitUntil: "networkidle" });
    const available = page.getByTestId("available-modalities"), planned = page.getByTestId("planned-modalities");
    ok(await available.getByRole("heading", { level: 2, name: m.home.catalogTitle }).isVisible(), `${tag}: available section`);
    ok(await planned.getByRole("heading", { level: 2, name: m.common.comingSoon }).isVisible(), `${tag}: separate planned section`);
    for (const id of ["ct", "mri", "us"]) {
      const card = planned.getByTestId(`modality-${id}`);
      ok(await card.isVisible() && await available.getByTestId(`modality-${id}`).count() === 0, `${tag}/${id}: only in planned section`);
      ok(await card.locator("a,img").count() === 0 && await card.locator("p").count() === 1 && await card.locator("p").innerText() === m.common.comingSoon, `${tag}/${id}: name and coming-soon only`);
      ok(!existsSync(`out/${loc}/${id}.html`), `${tag}/${id}: no route added`);
    }
    await audit(page, `${tag}/home`);
    await page.screenshot({ path: `/tmp/rad-053/${tag}-home.png`, fullPage: true });
    await available.getByTestId("modality-xray").getByRole("link").click();
    await page.waitForURL(`${base}/${loc}/xray`);
    await catalogue(page, loc);
    await audit(page, `${tag}/catalogue`);
    await page.screenshot({ path: `/tmp/rad-053/${tag}-catalogue.png`, fullPage: true });
    const other = loc === "en" ? "ar" : "en";
    await page.getByRole("link", { name: other === "ar" ? "العربية" : "English", exact: true }).click();
    await page.waitForURL(`${base}/${other}/xray`);
    await catalogue(page, other);
    await audit(page, `${tag}/switched`);
    await page.goto(`${base}/${loc}/xray`, { waitUntil: "networkidle" });
    const examLink = page.locator('[data-testid^="exam-"] a').first();
    const href = await examLink.getAttribute("href");
    await examLink.click();
    await page.waitForURL(`${base}${href}`);
    await page.getByTestId("mode-practice").waitFor();
    await audit(page, `${tag}/exam`);
    await page.getByRole("link", { name: m.exam.startCase, exact: true }).first().click();
    await page.locator("#case-heading").waitFor();
    ok(new URL(page.url()).pathname === `${href}/practice`, `${tag}: existing practice URL`);
    await audit(page, `${tag}/practice`);
    ok(errors.length === 0, `${tag}: page errors ${errors.join(", ")}`);
    await ctx.close();
    const visitor = await setup(false, width);
    await visitor.page.goto(`${base}/${loc}/xray`, { waitUntil: "networkidle" });
    await visitor.page.waitForURL(`**/${loc}/account?*`);
    ok(new URL(visitor.page.url()).pathname === `/${loc}/account`, `${tag}: visitor still blocked`);
    ok(await visitor.page.locator('[data-testid^="body-part-"]').count() === 0 && visitor.calls.length === 0, `${tag}: no visitor content or API request`);
    await audit(visitor.page, `${tag}/visitor`);
    await visitor.ctx.close();
    console.log(`ok ${tag}`);
  }
  console.log(`PASS: ${checks} checks, ${audits} axe audits`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
