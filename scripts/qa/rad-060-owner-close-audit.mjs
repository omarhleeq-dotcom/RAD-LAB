// Real static owner route + synthetic auth/API. Never contacts a live provider or hosted preview.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { startServer } from '../preview/serve-out.mjs';
const require = createRequire(process.env.ASSESS_BROWSER_MANIFEST ?? new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');
const axe = readFileSync(process.env.AXE_CORE_PATH ?? require.resolve('axe-core/axe.min.js'), 'utf8');
const messages = Object.fromEntries(['en', 'ar'].map(l => [l, JSON.parse(readFileSync(`messages/${l}.json`, 'utf8'))]));
const consent = readFileSync('src/features/pilot/consent.ts', 'utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const supa = 'https://abcdefghijklmnop.supabase.co', closedAt = '2026-10-29T19:00:00+00:00';
const b64 = v => Buffer.from(JSON.stringify(v)).toString('base64url');
const user = { id: id(1), aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' };
const session = { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: 4102444800 })}.sig`, refresh_token: 'synthetic', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user };
const { server, port } = await startServer('out', 0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
let checks = 0, audits = 0;
function ok(v, label) { assert.ok(v, label); checks++; }
async function audit(page, label) {
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
  assert.deepEqual(violations, [], label);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no overflow`);
  audits++;
}
async function setup(locale, width, role = 'owner', scenario = 'ready', path = 'owner?tab=assess') {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
  await ctx.addInitScript(s => localStorage.setItem('sb-abcdefghijklmnop-auth-token', s), JSON.stringify(session));
  const calls = [], errors = [];
  let mode = scenario;
  const rows = Array.from({ length: 42 }, (_, i) => ({ id: id(i + 100), name: i === 0 ? `Synthetic assessment ${'م'.repeat(170)}` : `Assessment ${i + 1}`, revision: 1, closed_at: i === 1 ? closedAt : null }));
  await ctx.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base) return route.continue();
    ok(url.origin === supa, `unexpected external request: ${url.origin}`);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const json = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/rest/v1/profiles') return json({ role, status: 'approved', participant_code: 'P-synthetic', consent_version: consent, display_name: 'Synthetic Three Names' });
    if (['/rest/v1/events', '/rest/v1/rpc/touch_last_seen'].includes(url.pathname)) return route.fulfill({ status: 201, headers });
    const fn = url.pathname.split('/').at(-1), p = req.postDataJSON(), schema = req.headers()['content-profile'];
    calls.push({ fn, p, schema });
    if (schema !== 'assess') {
      if (fn === 'owner_page_v1') return json({ version: 1, boundary: '2026-10-29T12:00:00Z', total: 0, pending: 0, rows: [], next: null });
      if (fn === 'owner_account_directory_v1') return json({ version: 1, boundary: '2026-10-29T12:00:00Z', counts: { approved: 0, pending: 0, suspended: 0 }, rows: [], next: null });
      if (fn === 'owner_account_deletion_v1' && p.p_action === 'list') return json({ rows: [], next: null });
      if (fn === 'owner_surveys_v1' && ['versions', 'rounds'].includes(p.p_action)) return json({ rows: [], next: null });
      assert.fail(`unexpected public RPC ${fn}`);
    }
    if (fn === 'assignment_page_v2') {
      assert.deepEqual(Object.keys(p).sort(), ['p_after', 'p_group', 'p_limit']);
      ok(p.p_limit === 20 && p.p_group === null, 'owner page20 with no group scope');
      if (mode === 'read-fail' || mode === 'read-denied') return json({ code: mode === 'read-denied' ? '42501' : 'XX000', message: 'private implementation' }, 400);
      const page = rows.filter(r => !p.p_after || r.id > p.p_after).slice(0, 20);
      return json({ rows: page, next: page.length === 20 ? page.at(-1).id : null });
    }
    if (fn === 'assignment_close_v2') {
      assert.deepEqual(Object.keys(p).sort(), ['p_assignment', 'p_revision']);
      const row = rows.find(r => r.id === p.p_assignment); ok(row, 'close existing assignment');
      if (mode === 'stale') { mode = 'ready'; row.revision++; return json({ code: '40001', message: 'private implementation' }, 400); }
      if (mode === 'denied') return json({ code: '42501', message: 'private implementation' }, 403);
      ok(p.p_revision === row.revision, 'current revision sent'); row.closed_at = closedAt; row.revision++;
      if (mode === 'ambiguous') { mode = 'ready'; return route.abort('connectionreset'); }
      return json(null);
    }
    if (fn === 'owner_page_v1' || fn === 'content_page_v1') return json({ version: 1, rows: [], next: null });
    if (fn === 'scope_page_v1') return json({ version: 1, rows: [], next: null, serverNow: '2026-10-29T19:00:00Z', visibleUntil: null, appointed: true });
    if (fn === 'sharing_consent_v1') return json({ version: 'supervisor-sharing-2026-10-27-v2', textDigest: 'cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb', accepted: true });
    assert.fail(`unexpected Assess RPC ${fn}`);
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/${locale}/${path}`, { waitUntil: 'networkidle' });
  return { ctx, page, calls, errors, setMode: v => { mode = v; } };
}
const count = (s, fn) => s.calls.filter(c => c.fn === fn).length;
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function click(root, name) { await root.getByRole('button', { name, exact: true }).click(); }
try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
    const t = messages[locale].ownerAssignments, label = `${locale}-${width}`;
    const s = await setup(locale, width), root = s.page.getByRole('region', { name: t.title, exact: true });
    try { await root.getByText('Assessment 20', { exact: true }).waitFor(); } catch (e) { console.error(JSON.stringify({ calls: s.calls, errors: s.errors, body: (await s.page.locator('body').innerText()).slice(0, 2000) })); throw e; }
    ok(await s.page.locator('html').getAttribute('dir') === (locale === 'ar' ? 'rtl' : 'ltr'), `${label}: direction`);
    ok(await root.locator('li').count() === 20, 'first page contains 20');
    ok(await root.locator('time').getAttribute('datetime') === closedAt, 'closed_at shown');
    await audit(s.page, `${label}-list`);
    const first = root.locator('li').first();
    await click(first, t.close); await first.getByRole('group', { name: t.confirmTitle }).waitFor();
    ok(count(s, 'assignment_close_v2') === 0, 'Close alone never writes');
    await audit(s.page, `${label}-confirm`);
    if (process.env.RAD060_SCREENSHOTS) { mkdirSync(process.env.RAD060_SCREENSHOTS, { recursive: true }); await s.page.screenshot({ path: `${process.env.RAD060_SCREENSHOTS}/${label}-confirm.jpg`, type: 'jpeg', quality: 80, fullPage: true }); }
    await click(first, t.keep); ok(count(s, 'assignment_close_v2') === 0, 'Keep open never writes');
    await click(root, t.next); await root.getByText('Assessment 21', { exact: true }).waitFor();
    assert.deepEqual(s.calls.filter(c => c.fn === 'assignment_page_v2').at(-1).p, { p_group: null, p_after: id(119), p_limit: 20 });
    const target = root.locator('li').first();
    s.setMode('stale'); await click(target, t.close); await click(target, t.confirm);
    await root.getByText(t.conflict, { exact: true }).waitFor(); await root.getByText('Assessment 21', { exact: true }).waitFor();
    ok(count(s, 'assignment_close_v2') === 1 && count(s, 'assignment_page_v2') === 3, 'stale: one write plus same-page re-read');
    ok(await root.getByRole('button', { name: t.confirm, exact: true }).count() === 0, 'stale confirmation cleared');
    await audit(s.page, `${label}-stale`);
    s.setMode('ambiguous'); await click(target, t.close); await click(target, t.confirm);
    await root.getByText(t.ambiguous, { exact: true }).waitFor(); await settle(s.page);
    ok(count(s, 'assignment_close_v2') === 2 && count(s, 'assignment_page_v2') === 3, 'lost ACK: no automatic read/write');
    ok(await root.getByRole('button', { name: t.close, exact: true }).count() === 0, 'lost ACK hides all close actions');
    await audit(s.page, `${label}-ambiguous`);
    await click(root, t.read); await root.locator('time').waitFor();
    ok(count(s, 'assignment_close_v2') === 2, 'explicit read does not repeat closure');
    const lastWrite = s.calls.filter(c => c.fn === 'assignment_close_v2').at(-1);
    ok(lastWrite.p.p_revision === 2, 'fresh revision after stale re-read');
    await click(root, t.next); await root.getByText('Assessment 42', { exact: true }).waitFor();
    ok(await root.locator('li').count() === 2, 'last page contains remainder');
    ok(await root.getByRole('button', { name: t.next, exact: true }).isDisabled(), 'no next after final page');
    await click(root.locator('li').last(), t.close); await click(root.locator('li').last(), t.confirm);
    await root.getByText(t.closed, { exact: true }).waitFor(); await root.locator('time').waitFor();
    await audit(s.page, `${label}-closed`);
    await click(root, t.first); await root.getByText('Assessment 20', { exact: true }).waitFor();
    s.setMode('denied'); await click(root.locator('li').first(), t.close); await click(root.locator('li').first(), t.confirm);
    await root.getByText(t.denied, { exact: true }).waitFor();
    ok(await root.getByRole('button', { name: t.close, exact: true }).count() === 0, 'denied clears actions');
    ok(!(await s.page.textContent('body')).includes('private implementation'), 'server text sanitised');
    await audit(s.page, `${label}-denied`); assert.deepEqual(s.errors, []); await s.ctx.close();

    const unavailable = await setup(locale, width, 'owner', 'read-fail');
    const unavailableRoot = unavailable.page.getByRole('region', { name: t.title, exact: true });
    await unavailableRoot.getByText(t.unavailable, { exact: true }).waitFor();
    unavailable.setMode('ready'); await click(unavailableRoot, t.read); await unavailableRoot.getByText('Assessment 20', { exact: true }).waitFor();
    await audit(unavailable.page, `${label}-read-recovery`); assert.deepEqual(unavailable.errors, []); await unavailable.ctx.close();
    for (const path of ['owner?tab=assess', 'supervisor']) {
      const student = await setup(locale, width, 'participant', 'ready', path);
      if (path.startsWith('owner')) await student.page.getByTestId('owner-denied').waitFor();
      ok(await student.page.getByRole('region', { name: t.title, exact: true }).count() === 0, `${path}: participant/supervisor has no close control`);
      ok(count(student, 'assignment_page_v2') === 0 && count(student, 'assignment_close_v2') === 0, `${path}: no owner-assignment RPC`);
      assert.deepEqual(student.errors, []); await student.ctx.close();
    }
  }
  console.log(`RAD-060 owner Assess: ${checks} checks; ${audits} EN/AR 390/1440 axe/overflow audits passed. Local synthetic API only.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
