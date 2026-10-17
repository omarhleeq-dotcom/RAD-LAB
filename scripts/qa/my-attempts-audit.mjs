// Local static export + intercepted synthetic Supabase only. No hosted preview, live accounts or writes to a provider.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../preview/serve-out.mjs";
const messages = Object.fromEntries(["en", "ar"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const consent = readFileSync("src/features/pilot/consent.ts", "utf8").match(/CONSENT_VERSION = "([^"]+)"/)[1];
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const disabled = process.env.ATTEMPTS_DISABLED === "1";
const server = process.env.ATTEMPTS_BASE ? null : await startServer("out", 0);
const base = process.env.ATTEMPTS_BASE ?? `http://127.0.0.1:${server.port}`;
assert.equal(new URL(base).hostname, "127.0.0.1", "local audit only");
const supa = "https://abcdefghijklmnop.supabase.co";
const uid = "00000000-0000-0000-0000-000000000001", other = "00000000-0000-0000-0000-000000000002";
const user = { id: uid, aud: "authenticated", role: "authenticated", email: "synthetic@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: uid, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, refresh_token: "synthetic", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user };
const id = (i) => `10000000-0000-0000-0000-${String(i).padStart(12,"0")}`;
const row = (i, userId = uid) => ({ id: id(i), user_id: userId, attempt_no: i, exam_id: i === 2 ? "archived-exam" : "chest-pa-erect", case_id: "default", definition_version: "saved-version-not-current", settings: { kvp: 110, rotation: 3 },
  result: { total: 82.25, passed: false, critical: ["saved-critical"], categories: [{ c: "positioning", earned: 20, weight: 28 }], checks: [{ id: "rotation", o: "fail", credit: 0.5 }] },
  locale: "ar", started_at: "2026-10-16T09:59:00Z", finished_at: "2026-10-16T10:00:00.123456+00:00", mode: "practice", record_kind: "attempt", settings_format_version: 1, result_format_version: 1, producer_version: "unknown", engine_version: "unknown" });
const rows = [...Array.from({ length: 25 }, (_, i) => row(i + 1)), row(26, other)];
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
let checks = 0, audits = 0;
const ok = (v, label) => { assert.ok(v, label); checks++; };
mkdirSync("/tmp/my-attempts", { recursive: true });
async function audit(page, label) {
  await page.evaluate(axe);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(r.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`); audits++;
}
async function setup(locale, width, scenario = "ready", role = "participant") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390, isMobile: width === 390 });
  const calls = [], errors = [];
  let fail = scenario === "error", release, activeId = uid;
  const delayed = new Promise((resolve) => { release = resolve; });
  if (scenario !== "visitor") await context.addInitScript((s) => { localStorage.setItem("sb-abcdefghijklmnop-auth-token", s); }, JSON.stringify(session));
  await context.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    ok(url.origin === supa, `unexpected external origin: ${url.origin}`);
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (body, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/auth/v1/user") return json(user);
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/profiles") return json({ status: ["pending", "suspended"].includes(scenario) ? scenario : "approved", role, participant_code: "P-synthetic", consent_version: consent });
    if (["/rest/v1/events", "/rest/v1/rpc/touch_last_seen"].includes(url.pathname)) return route.fulfill({ status: 201, headers });
    if (url.pathname === "/rest/v1/attempts") {
      ok(req.method() === "GET", "attempt feature is read-only");
      const q = url.searchParams; calls.push(q);
      ok(q.get("user_id") === `eq.${activeId}`, "own-user equality reaches server, including owner");
      ok(q.get("mode") === "eq.practice" && q.get("record_kind") === "eq.attempt", "Practice-only server filters");
      ok(q.get("limit") === "21" && q.get("order") === "finished_at.desc,id.asc", "bounded stable server page");
      ok(!q.get("select").match(/\*|email|device/), "explicit minimal projection");
      if (scenario === "expired") return json({ message: "synthetic expired" }, 401);
      if (fail) return json({ message: "synthetic read error" }, 500);
      if (scenario === "delay") await delayed;
      let selected = scenario === "empty" ? [] : scenario === "foreign" ? [row(1, other)] : scenario === "unsupported" ? [{ ...row(1), result_format_version: 2 }] : rows.filter((r) => `eq.${r.user_id}` === q.get("user_id"));
      const cursorId = q.get("or")?.match(/id\.gt\.([0-9a-f-]+)/)?.[1];
      if (cursorId) selected = selected.filter((r) => r.id > cursorId);
      return json(selected.slice(0, Number(q.get("limit"))));
    }
    assert.fail(`unexpected provider path ${req.method()} ${url.pathname}`);
  });
  const page = await context.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/${locale}/account`, { waitUntil: scenario === "delay" ? "domcontentloaded" : "networkidle" });
  return { context, page, calls, errors, release, recover: () => { fail = false; }, switchUser: async () => {
    const tab = await context.newPage(); await tab.goto(`${base}/${locale}/terms`, { waitUntil: "networkidle" });
    activeId = other;
    const next = { ...session, access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: other, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`, user: { ...user, id: other } };
    await tab.evaluate((s) => {
      const key = "sb-abcdefghijklmnop-auth-token";
      localStorage.setItem(key, JSON.stringify(s));
      // The SDK announces cross-tab sign-in through this browser channel, not a storage event.
      const channel = new BroadcastChannel(key); channel.postMessage({ event: "SIGNED_IN", session: s }); channel.close();
    }, next);
    await tab.close();
  } };
}
try {
  for (const locale of ["en", "ar"]) for (const width of [390, 1440]) {
    const m = messages[locale], label = `${locale}-${width}`;
    if (disabled) {
      const s = await setup(locale, width, "visitor");
      await s.page.getByTestId("account-off").waitFor();
      ok(s.calls.length === 0 && await s.page.getByTestId("my-attempts").count() === 0, `${label}: disabled has no attempts or network`);
      await audit(s.page, `${label}-off`); await s.context.close(); continue;
    }
    for (const role of ["participant", "owner"]) {
      const s = await setup(locale, width, "ready", role), p = s.page;
      await p.getByTestId("my-attempt").first().waitFor();
      ok(await p.getByTestId("my-attempt").count() === 20, `${label}: first page replaces bounded rows`);
      ok(s.calls.length === 1, `${label}: one initial attempt query`);
      ok((await p.getByTestId("my-attempts").textContent()).includes("82.25"), "stored score shown without recomputation");
      ok((await p.getByTestId("my-attempts").textContent()).includes("archived-exam"), "unregistered historical exam preserved");
      ok(await p.locator("html").getAttribute("dir") === (locale === "ar" ? "rtl" : "ltr"), "locale direction");
      const summary = p.getByTestId("my-attempt-details").first().locator("summary");
      await summary.focus(); await p.keyboard.press("Enter");
      ok(await p.getByTestId("my-attempt-details").first().getAttribute("open") !== null, "keyboard disclosure works");
      ok((await p.getByTestId("my-attempt-details").first().textContent()).includes("saved-version-not-current"), "saved definition version");
      await audit(p, `${label}-${role}-details`);
      if (role === "participant") await p.screenshot({ path: `/tmp/my-attempts/${label}.png`, fullPage: false });
      await p.getByRole("button", { name: m.myAttempts.next, exact: true }).click();
      await p.getByText(m.myAttempts.pageCount.replace("{count}","5"), { exact: true }).waitFor();
      ok(await p.getByTestId("my-attempt").count() === 5, "next page replaces, no accumulated rows");
      ok(await p.locator("#my-attempts-heading").evaluate((el) => document.activeElement === el), "page change moves focus to heading");
      ok(s.calls[1].get("or").includes("123456"), "cursor retains PostgreSQL precision");
      await p.getByRole("button", { name: m.myAttempts.refresh, exact: true }).click();
      await p.getByText(m.myAttempts.pageCount.replace("{count}","20"), { exact: true }).waitFor();
      ok(!s.calls.at(-1).has("or"), "refresh returns to newest");
      if (role === "participant") {
        await s.switchUser();
        await p.getByText(m.myAttempts.pageCount.replace("{count}","1"), { exact: true }).waitFor();
        ok(await p.getByTestId("my-attempt").count() === 1 && (await p.getByTestId("my-attempts").textContent()).includes(m.myAttempts.attemptNo.replace("{no}","26")), "account change replaces all previous user's rows");
        await audit(p, `${label}-changed-user`);
      }
      await p.getByRole("button", { name: m.account.signOut, exact: true }).click();
      await p.getByRole("tab", { name: m.account.tabs.signIn, exact: true }).waitFor();
      ok(await p.getByTestId("my-attempts").count() === 0, "signout clears all saved data");
      ok(s.errors.length === 0, `browser errors: ${s.errors.join(",")}`); await s.context.close();
    }
    for (const scenario of ["empty", "error", "expired", "foreign", "unsupported", "pending", "suspended", "visitor", "delay"]) {
      const s = await setup(locale, width, scenario), p = s.page;
      if (["pending", "suspended", "visitor"].includes(scenario)) {
        ok(s.calls.length === 0 && await p.getByTestId("my-attempts").count() === 0, `${label}-${scenario}: no reads or data`);
      } else if (scenario === "delay") {
        await p.getByText(m.myAttempts.loading, { exact: true }).waitFor(); await audit(p, `${label}-loading`);
        await p.getByRole("button", { name: m.account.signOut, exact: true }).click();
        await p.getByRole("tab", { name: m.account.tabs.signIn, exact: true }).waitFor(); s.release();
        await p.waitForTimeout(150);
        ok(await p.getByTestId("my-attempts").count() === 0, "late response after logout cannot restore data");
      } else {
        await p.getByText(m.myAttempts[scenario === "empty" ? "empty" : scenario === "expired" ? "expired" : "error"], { exact: true }).waitFor();
        ok(await p.getByTestId("my-attempt").count() === 0, `${scenario}: no stale data`);
        await audit(p, `${label}-${scenario}`);
        if (scenario === "error") {
          s.recover(); await p.getByRole("button", { name: m.myAttempts.retry, exact: true }).click(); await p.getByTestId("my-attempt").first().waitFor();
          ok(s.calls.length === 2, "error retry sends one new bounded read");
        }
        if (scenario === "expired") {
          await p.getByRole("button", { name: m.myAttempts.signInAgain, exact: true }).click();
          await p.getByRole("tab", { name: m.account.tabs.signIn, exact: true }).waitFor();
          ok(await p.getByTestId("my-attempts").count() === 0, "expired returns to existing login flow");
        }
      }
      ok(s.errors.length === 0, `browser errors ${scenario}: ${s.errors.join(",")}`); await s.context.close();
    }
  }
  console.log(`My Attempts local audit: ${checks} checks, ${audits} axe audits passed; synthetic data only.`);
} finally { await browser.close(); server?.server.close(); }
