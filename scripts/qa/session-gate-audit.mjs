// Local artifacts only, synthetic Supabase; never opens a hosted preview or live account.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const messages = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const disabled = process.env.GATE_DISABLED === "1";
const hosted = disabled ? null : await startServer("out", 0);
const base = disabled ? "http://127.0.0.1:3100" : `http://127.0.0.1:${hosted.port}`;
const supa = "https://abcdefghijklmnop.supabase.co";
const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
let checks = 0, audits = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
mkdirSync("/tmp/rad-052", { recursive: true });
async function audit(page, label) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: overflow`);
  audits++;
}
async function setup(locale, width, status) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const calls = [], errors = [];
  if (status !== "visitor") await ctx.addInitScript((s) => {
    // Seed once per tab; signing out must survive a navigation.
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("sb-abcdefghijklmnop-auth-token", s);
      sessionStorage.setItem("seeded", "1");
    }
  }, JSON.stringify(session));
  await ctx.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    ok(url.origin === supa, `unexpected external origin ${url.origin}`);
    calls.push({ path: url.pathname, method: req.method(), body: req.method() === "POST" ? req.postDataJSON() : null });
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (body) => route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/auth/v1/token") return json(session);
    if (url.pathname === "/auth/v1/user") return json(user);
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return json({ status: status === "visitor" ? "approved" : status, role: "participant", participant_code: "P-test", consent_version: consent });
    if (url.pathname === "/rest/v1/events" || url.pathname === "/rest/v1/rpc/touch_last_seen") return route.fulfill({ status: 201, headers });
    assert.fail(`unexpected request ${req.method()} ${url.pathname}`);
  });
  const page = await ctx.newPage();
  await page.clock.install();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page, calls, errors, locale, width };
}
try {
  for (const locale of ["en", "ar"]) for (const width of [390, 1440]) {
    const m = messages[locale];
    if (disabled) {
      const { ctx, page, calls } = await setup(locale, width, "visitor");
      for (const route of ["", "/xray", "/credits", "/xray/chest-pa-erect/practice"]) {
        await page.goto(`${base}/${locale}${route}`, { waitUntil: "networkidle" });
        ok(new URL(page.url()).pathname === `/${locale}${route}`, "disabled stays open");
        ok(await page.locator("main h1").count() > 0, "disabled content visible");
      }
      ok(calls.length === 0, "disabled has no external request");
      await ctx.close();
      continue;
    }
    for (const status of ["visitor", "pending", "approved", "suspended"]) {
      const { ctx, page, calls, errors } = await setup(locale, width, status);
      const tag = `${locale}-${width}-${status}`;
      const path = `/${locale}/xray/chest-pa-erect/practice?case=adult-demo#main-content`;
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      if (status === "approved") {
        ok(page.url() === `${base}${path}`, `${tag}: approved exact destination`);
        ok(await page.locator("#case-heading").isVisible(), `${tag}: practice shown`);
      } else {
        const url = new URL(page.url());
        ok(url.pathname === `/${locale}/account` && url.searchParams.get("returnTo") === path, `${tag}: return path`);
        ok(await page.locator("#result-heading").count() === 0, `${tag}: practice absent`);
        if (status === "visitor") {
          ok(calls.length === 0, `${tag}: no request before login`);
          await page.getByRole("tab", { name: m.account.tabs.signIn }).waitFor();
        } else {
          await page.getByTestId(`account-${status}`).waitFor();
          ok(await page.getByText(m.account.status[status].body, { exact: true }).isVisible(), `${tag}: clear status`);
        }
      }
      if (status !== "visitor") {
        const reads = () => calls.filter((c) => c.path === "/rest/v1/profiles" && c.method === "GET").length;
        const writes = () => calls.filter((c) => c.body?.type === "heartbeat" || c.path === "/rest/v1/rpc/touch_last_seen" && c.method === "POST").length;
        // Practice has its existing independent attempt-recorder consent read, besides the shared shell read.
        const initialReads = status === "approved" ? 2 : 1;
        ok(reads() === initialReads, `${tag}: no duplicate shell profile read (actual=${reads()}, expected=${initialReads})`);
        ok(writes() === 1, `${tag}: one initial activity write`);
        // Move the browser clock through a heartbeat interval without waiting five real minutes.
        await page.clock.fastForward(5 * 60 * 1000);
        await page.waitForTimeout(100);
        ok(writes() === 2, `${tag}: exactly one recurring heartbeat`);
        ok(reads() === initialReads, `${tag}: recurring heartbeat reuses profile`);
        await page.clock.resume();
      }
      await audit(page, tag);
      await page.screenshot({ path: `/tmp/rad-052/${tag}.png`, fullPage: true });
      for (const route of ["", "/xray", "/xray/chest-pa-erect", "/credits", "/owner"]) {
        await page.goto(`${base}/${locale}${route}`, { waitUntil: "networkidle" });
        ok(new URL(page.url()).pathname === (status === "approved" ? `/${locale}${route}` : `/${locale}/account`), `${tag}: route ${route}`);
      }
      if (status === "visitor") {
        await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
        await page.getByRole("link", { name: locale === "en" ? "العربية" : "English", exact: true }).click();
        await page.waitForURL(`**/${locale === "en" ? "ar" : "en"}/account?*`);
        ok(new URL(page.url()).searchParams.get("returnTo") === `/${locale}`, `${tag}: language switch retains destination`);
        await page.goto(`${base}/${locale}/account?returnTo=${encodeURIComponent(path)}`, { waitUntil: "networkidle" });
        await page.getByLabel(m.account.email, { exact: true }).fill(user.email);
        await page.getByLabel(m.account.password, { exact: true }).fill("Synthetic1!");
        await page.getByRole("button", { name: m.account.submit.signIn, exact: true }).click();
        await page.waitForURL(`${base}${path}`);
        await page.locator("#case-heading").waitFor();
        ok(page.url() === `${base}${path}`, `${tag}: password login returns exactly`);
        await audit(page, `${tag}-returned`);
        await page.goto(`${base}/${locale}/account`, { waitUntil: "networkidle" });
        // Sign-out moved to the side menu for approved accounts (UI-1); open the menu on narrow screens.
        const signOutButton = page.getByRole("button", { name: m.account.signOut, exact: true });
        if (!(await signOutButton.count())) await page.getByTestId("menu-toggle").click();
        await signOutButton.click();
        await page.getByRole("tab", { name: m.account.tabs.signIn }).waitFor();
        await page.goto(`${base}/${locale}/credits`, { waitUntil: "networkidle" });
        ok(new URL(page.url()).pathname === `/${locale}/account`, `${tag}: signout revokes UI access`);
      }
      for (const route of ["terms", "does-not-exist"]) {
        await page.goto(`${base}/${locale}/${route}`, { waitUntil: "networkidle" });
        ok(new URL(page.url()).pathname === `/${locale}/${route}`, `${tag}: public ${route}`);
        await audit(page, `${tag}-${route}`);
      }
      if (status === "pending" || status === "suspended") ok(!calls.some((c) => c.path.includes("attempt") || c.path.includes("owner_page")), `${tag}: no protected data request`);
      ok(errors.length === 0, `${tag}: no page errors ${errors.join(", ")}`);
      await ctx.close();
    }
  }
  console.log(`PASS: ${checks} checks, ${audits} axe audits, disabled=${disabled}`);
} finally {
  await browser.close();
  if (hosted) await new Promise((resolve) => hosted.server.close(resolve));
}
