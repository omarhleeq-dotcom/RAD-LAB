// RAD-046 browser audit with a MOCKED Supabase (no real project, no secret, no real participant data): "forgot your password" + choosing a new password.
//   npm run build:pages with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY set (env defaults below), then:
//   CHROMIUM=/path/to/chrome node scripts/qa/pilot-reset-audit.mjs     (needs `npm i --no-save playwright`; axe-core is a dev dependency)
// Checks, EN + AR on a phone (390) and a desktop (1440) viewport: the sign-in form offers the link; asking for a reset POSTs /auth/v1/recover with the e-mail and the
// account page as redirect_to, and the answer never says whether the address has an account; rate-limit / network failures are shown; a recovery link (fragment) opens the
// new-password form, not the signed-in card; weak / mismatched passwords are refused before any request; a valid password is PUT to /auth/v1/user once, the same-password
// refusal is shown, success shows the confirmation and the signed-in view and clears the token from the address bar; an expired link or one that creates no session shows the
// "cannot be used" screen with a way to ask again; a normal sign-in page is unchanged; axe WCAG A/AA on every state.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { startServer } from "../preview/serve-out.mjs";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://abcdefghijklmnop.supabase.co";
const msgs = { en: JSON.parse(readFileSync("messages/en.json", "utf8")), ar: JSON.parse(readFileSync("messages/ar.json", "utf8")) };
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
let failed = 0;
const ok = (name, cond, detail = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${!cond && detail ? ` :: ${detail}` : ""}`); };

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`;
const USER = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "tester@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-15T00:00:00Z" };
const GOOD = "Abcdef1!x";
const linkHash = () => `#access_token=${jwt(USER.id)}&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery`;
const EXPIRED = "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

/** One mocked project per scenario; `log` records the auth calls the page makes. */
async function setup(browser, vp, { recoverStatus = 200, userStatus = 200, updateError = null } = {}) {
  const ctx = await browser.newContext({ viewport: vp });
  const log = { recover: [], updates: [], userGets: 0 };
  await ctx.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { "access-control-allow-origin": "*" };
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", headers: cors, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (url.pathname.startsWith("/auth/v1/recover")) {
      log.recover.push({ body: req.postDataJSON(), redirect: url.searchParams.get("redirect_to") });
      if (recoverStatus === 429) return json(429, { code: 429, error_code: "over_email_send_rate_limit", msg: "rate" });
      if (recoverStatus === 0) return route.abort("failed");
      return json(200, {});
    }
    if (url.pathname.startsWith("/auth/v1/user")) {
      if (req.method() === "PUT") {
        log.updates.push(req.postDataJSON());
        return updateError ? json(422, { code: 422, error_code: updateError, msg: updateError }) : json(200, USER);
      }
      log.userGets++;
      return userStatus === 200 ? json(200, USER) : json(401, { code: 401, error_code: "bad_jwt", msg: "invalid" });
    }
    if (url.pathname === "/rest/v1/profiles" && req.method() === "GET") return json(200, { status: "approved", role: "participant", participant_code: "P-ab12cd34", consent_version: "2026-10-17" });
    return route.fulfill({ status: 204, headers: cors, body: "" });
  });
  return { ctx, page: await ctx.newPage(), log };
}

async function axe(page, name) {
  await page.evaluate(axeSrc);
  const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  ok(`${name}: axe WCAG A/AA, no violations`, r.violations.length === 0, JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }))));
}
const noHScroll = async (page, name) => ok(`${name}: no horizontal page scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

const { server, port } = await startServer("out", 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const VIEWPORTS = [["phone", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]];

for (const loc of ["en", "ar"]) {
  const m = msgs[loc].account;
  for (const [vpName, vp] of VIEWPORTS) {
    const tag = `${loc}/${vpName}`;
    // 1. asking for a link.
    {
      const { ctx, page, log } = await setup(browser, vp);
      await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
      const link = page.getByTestId("forgot-link");
      await link.waitFor({ state: "visible" });
      ok(`${tag}: sign-in form offers "${m.forgot.link}"`, (await link.innerText()) === m.forgot.link);
      await page.getByRole("tab", { name: m.tabs.signUp }).click();
      ok(`${tag}: the link is not shown on the sign-up tab`, (await page.getByTestId("forgot-link").count()) === 0);
      await page.getByRole("tab", { name: m.tabs.signIn }).click();
      await link.click();
      await page.getByTestId("forgot-form").waitFor({ state: "visible" });
      await noHScroll(page, `${tag}: forgot form`);
      await axe(page, `${tag}: forgot form`);
      await page.getByLabel(m.email).fill("nobody@example.test");
      await page.getByRole("button", { name: m.forgot.submit }).click();
      await page.getByTestId("forgot-sent").waitFor({ state: "visible" });
      ok(`${tag}: one /auth/v1/recover call with the e-mail and the account page as redirect_to`, log.recover.length === 1 && log.recover[0].body.email === "nobody@example.test" && log.recover[0].redirect === `${base}/${loc}/account`, JSON.stringify(log.recover));
      const sent = await page.getByTestId("forgot-sent").innerText();
      ok(`${tag}: the answer is neutral (says "if an account exists") and never "no such account"`, sent.includes(m.forgot.sentBody.replace("{email}", "nobody@example.test")) && !/not found|no account|لا يوجد حساب/i.test(sent), sent);
      await axe(page, `${tag}: link sent`);
      await page.getByRole("button", { name: m.forgot.back }).click();
      ok(`${tag}: back returns to the sign-in form`, await page.getByTestId("forgot-link").isVisible());
      await ctx.close();
    }
    // 2. rate limit and network failure are shown, nothing is claimed sent.
    for (const [name, opts, key] of [["rate limit", { recoverStatus: 429 }, "rateLimited"], ["network failure", { recoverStatus: 0 }, "network"]]) {
      const { ctx, page } = await setup(browser, vp, opts);
      await page.goto(`${base}/${loc}/account`, { waitUntil: "networkidle" });
      await page.getByTestId("forgot-link").click();
      await page.getByLabel(m.email).fill("a@example.test");
      await page.getByRole("button", { name: m.forgot.submit }).click();
      await page.getByTestId("forgot-error").waitFor({ state: "visible" });
      ok(`${tag}: ${name} is shown and no "sent" screen appears`, (await page.getByTestId("forgot-error").innerText()) === m.errors[key] && (await page.getByTestId("forgot-sent").count()) === 0);
      if (name === "rate limit") await axe(page, `${tag}: rate-limit error`);
      await ctx.close();
    }
    // 3. following the link: new-password form.
    {
      const { ctx, page, log } = await setup(browser, vp);
      await page.goto(`${base}/${loc}/account${linkHash()}`, { waitUntil: "networkidle" });
      await page.getByTestId("reset-form").waitFor({ state: "visible" });
      ok(`${tag}: the link opens the new-password form, not the signed-in card`, (await page.getByTestId("account-approved").count()) === 0);
      await noHScroll(page, `${tag}: reset form`);
      await axe(page, `${tag}: reset form`);
      const pw = page.getByLabel(m.reset.newPassword, { exact: true });
      const cf = page.getByLabel(m.reset.confirm, { exact: true });
      const save = page.getByRole("button", { name: m.reset.submit });
      await pw.fill("short");
      await cf.fill("short");
      await save.click();
      ok(`${tag}: a short password is refused before any request`, (await page.getByTestId("reset-error").innerText()) === m.errors.passwordShort && log.updates.length === 0);
      await pw.fill("alllowercase1");
      await cf.fill("alllowercase1");
      await save.click();
      ok(`${tag}: a password missing character classes is refused`, (await page.getByTestId("reset-error").innerText()) === m.errors.passwordClasses && log.updates.length === 0);
      await pw.fill(GOOD);
      await cf.fill(`${GOOD}x`);
      await save.click();
      ok(`${tag}: two different passwords are refused`, (await page.getByTestId("reset-error").innerText()) === m.errors.passwordMismatch && log.updates.length === 0);
      await axe(page, `${tag}: reset form with an error`);
      await cf.fill(GOOD);
      await save.click();
      await page.getByTestId("password-changed").waitFor({ state: "visible" });
      ok(`${tag}: ONE PUT /auth/v1/user with the new password`, log.updates.length === 1 && log.updates[0].password === GOOD, JSON.stringify(log.updates.map((u) => Object.keys(u))));
      ok(`${tag}: success confirmation and the signed-in view`, (await page.getByTestId("password-changed").innerText()) === m.reset.done && (await page.getByTestId("account-approved").isVisible()));
      ok(`${tag}: the token is gone from the address bar`, !(await page.evaluate(() => location.href)).includes("access_token"));
      await axe(page, `${tag}: after the change`);
      await ctx.close();
    }
    // 4. the server refuses the same password.
    {
      const { ctx, page } = await setup(browser, vp, { updateError: "same_password" });
      await page.goto(`${base}/${loc}/account${linkHash()}`, { waitUntil: "networkidle" });
      await page.getByTestId("reset-form").waitFor({ state: "visible" });
      await page.getByLabel(m.reset.newPassword, { exact: true }).fill(GOOD);
      await page.getByLabel(m.reset.confirm, { exact: true }).fill(GOOD);
      await page.getByRole("button", { name: m.reset.submit }).click();
      await page.getByTestId("reset-error").waitFor({ state: "visible" });
      ok(`${tag}: same_password from the server is shown, the form stays`, (await page.getByTestId("reset-error").innerText()) === m.errors.samePassword && (await page.getByTestId("reset-form").isVisible()));
      await ctx.close();
    }
    // 5. expired link, and a link whose token creates no session.
    for (const [name, hash, opts] of [["expired link", EXPIRED, {}], ["link that creates no session", linkHash(), { userStatus: 401 }]]) {
      const { ctx, page } = await setup(browser, vp, opts);
      await page.goto(`${base}/${loc}/account${hash}`, { waitUntil: "networkidle" });
      await page.getByTestId("reset-link-problem").waitFor({ state: "visible" });
      ok(`${tag}: ${name} shows "${m.reset.linkErrorTitle}"`, (await page.getByTestId("reset-link-problem").innerText()).includes(m.reset.linkErrorBody));
      if (name === "expired link") await axe(page, `${tag}: expired link`);
      await page.getByRole("button", { name: m.reset.requestNew }).click();
      ok(`${tag}: ${name}: "request a new link" opens the e-mail form`, await page.getByTestId("forgot-form").isVisible());
      await ctx.close();
    }
  }
}
// 6. a sign-up confirmation fragment or none: the normal page, no reset screens.
for (const loc of ["en", "ar"]) {
  const { ctx, page } = await setup(browser, VIEWPORTS[0][1]);
  await page.goto(`${base}/${loc}/account#access_token=${jwt(USER.id)}&expires_in=3600&refresh_token=r&token_type=bearer&type=signup`, { waitUntil: "networkidle" });
  await page.getByTestId("account-approved").waitFor({ state: "visible" });
  ok(`${loc}: a sign-up confirmation link still lands on the signed-in card (no reset form)`, (await page.getByTestId("reset-form").count()) === 0);
  await ctx.close();
}
await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall password reset checks passed");
process.exit(failed ? 1 : 0);
