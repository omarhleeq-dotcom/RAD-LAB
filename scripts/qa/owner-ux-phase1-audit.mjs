// UX phase 1: real static /owner (every tab) and /assess (before/after consent) with a synthetic API.
// Never contacts a live provider or hosted preview. Writes are refused: the audit only reads and navigates.
// Usage after a synthetic static export (see the phase report): OUT_DIR=out node scripts/qa/owner-ux-phase1-audit.mjs
// MODE=before only captures screenshots of the previous layout for comparison (no structure assertions).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { startServer } from '../preview/serve-out.mjs';
const require = createRequire(process.env.ASSESS_BROWSER_MANIFEST ?? new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');
const axe = readFileSync(process.env.AXE_CORE_PATH ?? require.resolve('axe-core/axe.min.js'), 'utf8');
const messages = Object.fromEntries(['en', 'ar'].map(l => [l, JSON.parse(readFileSync(`messages/${l}.json`, 'utf8'))]));
// RAD085_REVIEW_AVAILABLE is true in the promoted repository, so the first literal is the current version.
const consent = readFileSync('src/features/pilot/consent.ts', 'utf8').match(/CONSENT_VERSION = RAD085_REVIEW_AVAILABLE \? '([^']+)'/)[1];
const before = process.env.MODE === 'before', shots = process.env.SCREENSHOTS;
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const supa = 'https://abcdefghijklmnop.supabase.co', stamp = '2026-11-02T09:30:00.000Z';
const b64 = v => Buffer.from(JSON.stringify(v)).toString('base64url');
const user = { id: id(1), aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
const session = { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: 4102444800 })}.sig`, refresh_token: 'synthetic', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user };
const people = [
  { user_id: id(11), participant_code: 'P-SYN-0011', role: 'participant', status: 'pending', name: 'Synthetic Student Alpha', email: 'alpha@example.test', created_at: '2026-10-30T08:00:00Z', last_seen_at: null },
  { user_id: id(12), participant_code: 'P-SYN-0012', role: 'participant', status: 'approved', name: 'طالب تجريبي باء', email: 'beta@example.test', created_at: '2026-10-29T08:00:00Z', last_seen_at: '2026-11-01T10:00:00Z' },
  { user_id: id(13), participant_code: 'P-SYN-0013', role: 'participant', status: 'suspended', name: null, email: 'gamma@example.test', created_at: '2026-10-28T08:00:00Z', last_seen_at: null },
];
const { server, port } = await startServer(process.env.OUT_DIR ?? 'out', 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] });
let checks = 0, audits = 0;
function ok(v, label) { assert.ok(v, label); checks++; }
async function shot(page, name) {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${before ? 'before' : 'after'}-${name}.png`, fullPage: true });
}
async function audit(page, label) {
  if (before) return;
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
  assert.deepEqual(violations, [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`);
  const text = await page.locator('main').innerText();
  ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text), `${label}: no UUID rendered`);
  ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text), `${label}: no raw ISO timestamp rendered`);
  audits++;
}
async function setup(locale, width, { role = 'owner', path = 'owner', accepted = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390, locale, timezoneId: 'Asia/Amman' });
  await ctx.addInitScript(s => localStorage.setItem('sb-abcdefghijklmnop-auth-token', s), JSON.stringify(session));
  const calls = [], errors = [], state = { accepted };
  await ctx.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    ok(url.origin === supa, `unexpected external request: ${url.origin}`);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const json = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/rest/v1/profiles') return json({ role, status: 'approved', participant_code: 'P-SYN-0001', consent_version: consent, display_name: 'Synthetic Three Names' });
    if (['/rest/v1/events', '/rest/v1/rpc/touch_last_seen'].includes(url.pathname)) return route.fulfill({ status: 201, headers });
    const fn = url.pathname.split('/').at(-1), p = req.postDataJSON() ?? {}, schema = req.headers()['content-profile'] ?? 'public';
    calls.push({ fn, p, schema });
    const page = rows => ({ version: 1, rows, next: null });
    if (schema === 'public') {
      if (fn === 'owner_account_directory_v1') { const rows = people.filter(r => (!p.p_status || r.status === p.p_status) && (!p.p_search || `${r.name} ${r.email}`.toLowerCase().includes(p.p_search.toLowerCase()))); return json({ version: 1, boundary: stamp, counts: { pending: 1, approved: 1, suspended: 1 }, rows, next: null }); }
      if (fn === 'owner_page_v1') return json({ version: 1, boundary: stamp, total: 0, pending: 0, rows: [], next: null });
      if (fn === 'owner_dashboard_v1') return json({ version: 1, boundary: stamp, rows: p.p_view === 'summary' ? [{ exam: 'chest-pa-erect', attempts: 4, passed: 3, known: 4, wrong: [{ id: 'synthetic-rule', count: 1 }] }] : [], next: null });
      if (fn === 'owner_account_deletion_v1' && p.p_action === 'list') return json({ rows: [{ user_id: id(14), participant_code: 'P-SYN-0014', days_left: 12, expires_at: '2026-11-15T00:00:00Z' }], next: null });
      if (fn === 'owner_surveys_v1' && ['versions', 'rounds'].includes(p.p_action)) return json({ rows: [], next: null });
      if (fn === 'emergency_access_v1') return json(false);
      if (fn === 'emergency_alternate_read_v1') return json({ appointment: { id: id(12), name: 'طالب تجريبي باء', appointedAt: stamp, revision: 1, active: true }, audit: [{ id: 1, at: stamp, action: 'appoint', result: 'RECORDED' }], next: null });
      assert.fail(`unexpected public RPC ${fn} ${JSON.stringify(p)}`);
    }
    if (fn === 'owner_page_v1') {
      const rows = { groups: [{ id: id(201), name: 'Synthetic group A' }], versions: [{ id: id(301), name: 'Synthetic mixed exam', version: 'v1', track: 'mixed' }], assignments: [{ id: id(401), name: 'Synthetic mixed exam', version: 'v1', track: 'mixed', revision: 1 }] }[p.p_kind] ?? [];
      return json(page(rows));
    }
    if (fn === 'assignment_page_v2') return json({ rows: [{ id: id(401), name: 'Synthetic mixed exam', revision: 1, closed_at: null }], next: null });
    if (fn === 'manual_queue_v1') return json({ rows: [{ id: id(501), finalize_before: '2026-11-08T09:30:00Z' }, { id: id(502), finalize_before: '2026-11-09T09:30:00Z' }], next: null });
    if (fn === 'content_page_v1') return json(page([]));
    if (fn === 'scope_page_v1') return json({ version: 1, rows: [], next: null, serverNow: stamp, visibleUntil: null, appointed: role === 'owner' });
    if (fn === 'sharing_consent_v1') return json({ version: 'supervisor-sharing-2026-10-27-v2', textDigest: 'cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb', accepted: true });
    if (fn === 'consent_v3') { ok(p.p_version === null, 'consent is only read, never accepted by the audit'); return json({ accepted: state.accepted }); }
    if (fn === 'assigned_page_v1' || fn === 'assigned_practical_page_v1') return json({ version: 1, rows: [{ id: id(401), name: 'Synthetic mixed exam', version: 'v1' }], next: null });
    if (fn === 'name_entry_v1') return json(true);
    assert.fail(`unexpected Assess RPC ${fn} ${JSON.stringify(p)}`);
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/${locale}/${path}`, { waitUntil: 'networkidle' });
  return { ctx, page, calls, errors };
}
const writes = calls => calls.filter(c => /(_write_v1|^assign_v1|appointment_v1|set_participant_status|emergency_(alternate_(set|remove)|stop)|manual_(score|finalize)|content_submit)/.test(c.fn) || (c.fn === 'owner_account_deletion_v1' && c.p.p_action !== 'list') || (c.fn === 'owner_surveys_v1' && !['versions', 'rounds'].includes(c.p.p_action)));
try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
    const m = messages[locale], ux = m.ownerUx, label = `${locale}-${width}`;
    const s = await setup(locale, width, { path: before ? 'owner?tab=participants' : 'owner' });
    try {
      if (before) {
        await s.page.getByTestId('owner-directory').first().waitFor(); await s.page.waitForLoadState('networkidle'); await shot(s.page, `${label}-owner-participants`);
        await s.page.goto(`${base}/${locale}/owner?tab=assess`, { waitUntil: 'networkidle' }); await shot(s.page, `${label}-owner-assess`);
        continue;
      }
      ok(await s.page.locator('html').getAttribute('dir') === (locale === 'ar' ? 'rtl' : 'ltr'), `${label}: direction`);
      const bar = s.page.getByTestId('owner-status'), stop = s.page.getByTestId('owner-emergency-button');
      await bar.getByRole('button').first().waitFor();
      const nav = s.page.getByRole('navigation', { name: m.owner.dashboard.tabs, exact: true });
      ok(await nav.getByRole('link').count() === 6, `${label}: six tabs`);
      await s.page.getByTestId('owner-student').first().waitFor();
      ok(await s.page.getByTestId('owner-directory').count() === 1, `${label}: one participant list on Students`);
      ok(await s.page.locator('[data-testid="c2-deletion"],[data-testid="c2-surveys"],[data-testid="assess-admin"]').count() === 0, `${label}: Students hosts no other list`);
      ok(await s.page.getByTestId('participants-next').count() === 0, `${label}: single page has no paging controls`);
      await audit(s.page, `${label}-students`); await shot(s.page, `${label}-owner-students`);
      await s.page.getByTestId('owner-student').first().locator(':scope > summary').click();
      const details = s.page.getByTestId('owner-student-details').first();
      await details.getByRole('button', { name: m.owner.actions.approved, exact: true }).waitFor();
      ok(await details.getByRole('button', { name: m.c2.deactivate, exact: true }).count() === 1, `${label}: disable/delete in details`);
      ok(await details.getByText('P-SYN-0011', { exact: true }).count() === 1, `${label}: code shown with name in details`);
      await audit(s.page, `${label}-student-details`); await shot(s.page, `${label}-owner-student-details`);
      const filters = s.page.getByRole('group', { name: ux.filterLabel, exact: true });
      await filters.getByRole('button', { name: ux.filter.deletion, exact: true }).click(); await s.page.getByTestId('c2-deletion').getByText('P-SYN-0014').waitFor();
      ok(await s.page.getByTestId('c2-deletion').getByRole('button', { name: m.c2.next, exact: true }).count() === 0, `${label}: deletion single page has no paging`);
      await audit(s.page, `${label}-deletion`);
      await filters.getByRole('button', { name: ux.filter.supervisors, exact: true }).click(); await s.page.waitForLoadState('networkidle');
      await audit(s.page, `${label}-supervisors`);
      for (const tab of ['groups', 'assess', 'practice', 'surveys', 'safety']) {
        await nav.getByRole('link', { name: ux.tabs[tab], exact: true }).click(); await s.page.waitForLoadState('networkidle');
        ok(await stop.isVisible(), `${label}-${tab}: emergency stop reachable`);
        if (tab === 'groups') { await s.page.getByText('Synthetic group A').first().waitFor(); ok(await s.page.getByTestId('owner-row').count() === 0, `${label}: Groups shows no full participant list`); }
        if (tab === 'assess') {
          for (const f of ['assess-assign', 'assess-published', 'assess-grading', 'assess-content-section']) ok(await s.page.getByTestId(f).evaluate(e => !e.open), `${label}: ${f} collapsed`);
          // The count replaces the plain title once the already-loaded queue reports (Arabic dual has no digit).
          await s.page.waitForFunction(title => document.querySelector('[data-testid="assess-grading"] > summary')?.textContent !== title, m.manualGrading.title);
          await bar.getByRole('button').nth(1).waitFor();
        }
        if (tab === 'practice') { ok(await s.page.getByTestId('practice-filters').evaluate(e => !e.open), `${label}: filters collapsed`); await s.page.getByTestId('owner-training').locator('details summary').filter({ hasText: '75%' }).first().waitFor(); }
        if (tab === 'surveys') await s.page.getByTestId('c2-surveys').waitFor();
        if (tab === 'safety') {
          // RAD-095: the owner sees the alternate's stop card (owner intro) above the appointment section; no dialog until asked.
          const card = s.page.getByTestId('emergency-stop'); await card.waitFor();
          ok(await card.getByText(m.emergency.ownerIntro, { exact: true }).count() === 1 && await card.getByText(m.emergency.pageIntro, { exact: true }).count() === 0, `${label}: owner stop intro`);
          ok(!(await card.locator('dialog').evaluate(e => e.open)), `${label}: stop dialog closed on plain tab visit`);
          ok((await card.getByRole('button', { name: m.emergency.startStop, exact: true }).boundingBox()).height >= 44, `${label}: start target >= 44px`);
          await s.page.getByTestId('emergency-owner').waitFor();
        }
        await audit(s.page, `${label}-${tab}`);
        if (['assess', 'practice'].includes(tab)) await shot(s.page, `${label}-owner-${tab}`);
      }
      await nav.getByRole('link', { name: ux.tabs.groups, exact: true }).click();
      await stop.click(); await s.page.getByTestId('emergency-owner').waitFor();
      // RAD-095: the status-bar button opens the same confirmation dialog. SYNTHETIC: Stop now is never pressed.
      const dialog = s.page.getByTestId('emergency-stop').locator('dialog');
      await s.page.waitForFunction(() => document.querySelector('[data-testid="emergency-stop"] dialog')?.open === true);
      ok(await dialog.getAttribute('aria-modal') === 'true', `${label}: stop dialog is modal`);
      ok(await dialog.evaluate(e => e.contains(document.activeElement)), `${label}: focus inside the stop dialog`);
      const stopNow = dialog.getByRole('button', { name: m.emergency.stopNow, exact: true });
      ok(await stopNow.isDisabled(), `${label}: Stop now disabled before confirmation`);
      for (const target of [dialog.getByRole('button', { name: m.emergency.dialogCancel, exact: true }), stopNow, dialog.locator('label')]) ok((await target.boundingBox()).height >= 44, `${label}: dialog target >= 44px`);
      await dialog.getByRole('checkbox').check(); ok(await stopNow.isEnabled(), `${label}: Stop now enabled only after confirmation`);
      await audit(s.page, `${label}-stop-dialog`); await shot(s.page, `${label}-owner-stop-dialog`);
      await s.page.keyboard.press('Escape'); ok(!(await dialog.evaluate(e => e.open)), `${label}: Esc closes the stop dialog`);
      await s.page.waitForFunction(() => document.querySelector('[data-testid="emergency-stop"] dialog input[type=checkbox]')?.checked === false, null, { timeout: 5000 }); checks++;
      ok(await s.page.getByTestId('emergency-audit').evaluate(e => !e.open), `${label}: audit log collapsed`);
      await s.page.getByTestId('emergency-audit').locator(':scope > summary').click();
      const shown = await s.page.getByTestId('emergency-audit').locator('time').first().textContent();
      ok(shown === new Date(stamp).toLocaleString(locale, { timeZone: 'Asia/Amman' }), `${label}: audit time in Asia/Amman`);
      await audit(s.page, `${label}-safety-open`); await shot(s.page, `${label}-owner-safety`);
      assert.deepEqual(writes(s.calls), [], `${label}: no write RPC`); assert.deepEqual(s.errors, [], `${label}: no page errors`);
    } catch (e) { console.error(JSON.stringify({ label, calls: s.calls.map(c => c.fn), errors: s.errors })); throw e; } finally { await s.ctx.close(); }
  }
  if (!before) for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
    // RAD-095: a non-owner never sees the owner stop or the status-bar button.
    const label = `${locale}-${width}-participant-owner`, s = await setup(locale, width, { role: 'participant' });
    try {
      await s.page.getByTestId('owner-denied').waitFor();
      ok(await s.page.locator('[data-testid="owner-emergency-button"],[data-testid="emergency-stop"],[data-testid="emergency-owner"]').count() === 0, `${label}: no owner stop`);
      assert.deepEqual(writes(s.calls), [], `${label}: no write RPC`); assert.deepEqual(s.errors, [], `${label}: no page errors`);
    } finally { await s.ctx.close(); }
  }
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const accepted of [false, true]) {
    const m = messages[locale], label = `${locale}-${width}-${accepted ? 'after' : 'before'}-consent`;
    const s = await setup(locale, width, { role: 'participant', path: 'assess?track=mixed', accepted });
    try {
      const section = s.page.getByTestId('assess-consent');
      await section.waitFor(); await s.page.waitForLoadState('networkidle');
      if (accepted) await s.page.getByText('Synthetic mixed exam', { exact: false }).first().waitFor();
      else await section.getByRole('checkbox').waitFor();
      if (!before) {
        ok(await section.getByTestId('written-disclosure').count() === 1, `${label}: written disclosure in DOM`);
        ok(await section.getByText(m.assessConsentV2.summary, { exact: true }).count() === 1, `${label}: identical consent text present`);
        ok(await section.locator('details').count() === (accepted ? 1 : 0), `${label}: collapsed only after consent`);
        if (accepted) ok(await section.locator('details').evaluate(e => !e.open), `${label}: consent text collapsed`);
        else ok(await section.getByText(m.assessConsentV2.summary, { exact: true }).isVisible(), `${label}: consent text visible before consent`);
        await audit(s.page, label);
      }
      await shot(s.page, `${label}`);
      assert.deepEqual(writes(s.calls), [], `${label}: no write RPC`); assert.deepEqual(s.errors, [], `${label}: no page errors`);
    } catch (e) { console.error(JSON.stringify({ label, calls: s.calls.map(c => c.fn), errors: s.errors, body: (await s.page.locator('body').innerText()).slice(0, 1500) })); throw e; } finally { await s.ctx.close(); }
  }
  console.log(before ? 'Before captures written.' : `UX phase 1: ${checks} checks; ${audits} EN/AR 390/1440 axe/overflow/UUID/ISO audits passed. Local synthetic API only.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
