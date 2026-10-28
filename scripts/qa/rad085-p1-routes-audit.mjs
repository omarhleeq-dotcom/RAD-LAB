// Actual exported app routes, isolated PostgreSQL, intercepted synthetic Auth/PostgREST.
// No hosted URL, provider connection, subscription, polling, real credentials or data.
// Run after NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co and a synthetic
// publishable key npm run build:pages. The required manifest is built in a disposable
// non-git test copy; the repository's manifest and marker remain deferred.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
const root = process.cwd(), dir = mkdtempSync('/tmp/rad085-p1-routes-');
// RAD085-DB-DAY-PROMOTION-20261027: once the repository manifest is promoted (nothing deferred) the audit exercises the real export.
const promoted = Object.keys(JSON.parse(readFileSync('scripts/pages/frontend-schema.json', 'utf8')).deferredMigrations).length === 0;
const consentVersion = /CONSENT_VERSION = "([^"]+)"/.exec(readFileSync('src/features/pilot/consent.ts', 'utf8'))[1];
const syntheticOrigin = 'https://synthetic.supabase.co';
const publicEnv = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: syntheticOrigin, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic_local_test_123456' };
const msgs = Object.fromEntries(['en', 'ar'].map(l => [l, JSON.parse(readFileSync(`messages/${l}.json`))]));
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const helper = await build({ stdin: { resolveDir: root, contents: "export {openRad085Database,fixtureId} from './src/features/assess/rad085-local-db';" }, bundle: true, write: false, format: 'esm', platform: 'node', packages: 'external' });
writeFileSync(join(dir, 'db.mjs'), helper.outputFiles[0].text);
const { openRad085Database, fixtureId: id } = await import(join(dir, 'db.mjs'));
const policy = msgs.en.supervisor.consentText;
assert.ok(policy.includes('assigned to me within this group'));
const params = { scope_page_v1: ['p_kind', 'p_group', 'p_after', 'p_limit'], sharing_consent_v1: ['p_version', 'p_digest', 'p_accept'], appointment_v1: ['p_user', 'p_appoint'], supervisor_group_v1: ['p_action', 'p_group', 'p_revision', 'p_name', 'p_ends'], join_request_v1: ['p_code'], join_decide_v1: ['p_request', 'p_revision', 'p_action'], group_leave_v1: ['p_group'] };
let db, initial;
async function reset() {
 await db?.close(); db = await openRad085Database();
 for (let n = 1; n <= 6; n++) await db.admin.query("insert into auth.users values($1,$2,now(),$3)", [id(n), `synthetic${n}@example.test`, JSON.stringify({ display_name: 'Synthetic P1', consent_version: consentVersion })]);
 await db.admin.query("update public.profiles set status=case when user_id=$2 then 'pending' else 'approved' end,role=case when user_id=$1 then 'owner' else 'participant' end", [id(1), id(5)]);
 for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
 await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
 // Verify the new read-only readiness file and the packet probe on the real local DB.
 const checks = await db.admin.query(readFileSync('supabase/checks/rad085-d3-ready.sql', 'utf8'));
 assert.ok(checks.find(r => r.rows?.length).rows.every(row => row.ready === true));
 const probe = readFileSync('docs/RAD-085_DB_DAY_P1.md', 'utf8').match(/```sql\n([\s\S]*?)```/)[1];
 const result = await db.admin.query(probe); assert.ok(Object.values(result.find(r => r.rows?.length).rows[0]).every(v => v === true));
 initial = await db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'Synthetic route group', new Date(Date.now() + 3600000).toISOString()]);
 await db.rpc(3, 'supervisor_group_v1', ['create', null, null, 'Other supervisor group', new Date(Date.now() + 3600000).toISOString()]);
 await practice(901, 9); // Before joining: excluded by the server window.
}
async function practice(n, score) {
 await db.transaction(4, c => c.query(`insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}',$3,'en')`, [id(n), id(4), JSON.stringify({ total: score })]));
}
const mime = path => path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.woff2') ? 'font/woff2' : path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8';
async function serve(folder) {
 const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const path = resolve(folder, '.' + pathname);
  if (!path.startsWith(resolve(folder) + '/') && path !== resolve(folder)) return res.writeHead(403).end();
  const target = [path, path + '.html', join(path, 'index.html')].find(p => existsSync(p) && statSync(p).isFile());
  res.setHeader('Cache-Control', 'no-store');
  if (!target) return res.writeHead(404, { 'Content-Type': 'text/html' }).end(readFileSync(join(folder, '404.html')));
  res.writeHead(200, { 'Content-Type': mime(target) }).end(readFileSync(target));
 });
 await new Promise(r => server.listen(0, '127.0.0.1', r));
 return { base: `http://127.0.0.1:${server.address().port}`, close: async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); } };
}
let p1Calls = 0; const outbound = [], errors = [], rows = [], captures = []; let audits = 0;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
async function context(base, who, locale, width, theme) {
 const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, locale });
 await ctx.addInitScript(({ who, userId, theme }) => {
  localStorage.setItem('radlab-theme', theme);
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: `synthetic${who}@example.test`, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const payload = btoa(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({ access_token: 'eyJhbGciOiJIUzI1NiJ9.' + payload + '.synthetic', refresh_token: 'synthetic-local-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
 }, { who, userId: id(who), theme });
 await ctx.route('**/*', async route => {
  const request = route.request(), url = new URL(request.url());
  if (url.origin === base) return route.continue();
  if (url.origin !== syntheticOrigin) { outbound.push(url.origin + url.pathname); return route.abort(); }
  const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  if (url.pathname.startsWith('/auth/')) return respond({ id: id(who), aud: 'authenticated', role: 'authenticated', email: `synthetic${who}@example.test` });
  if (url.pathname === '/rest/v1/profiles') {
   const result = await db.admin.query('select status,role,participant_code,consent_version,display_name from public.profiles where user_id=$1', [id(who)]);
   return respond(result.rows[0]);
  }
  const name = url.pathname.split('/').at(-1);
  if (params[name] && request.headers()['content-profile'] === 'assess') {
   p1Calls++; const input = request.postDataJSON() ?? {}, names = params[name];
   assert.ok(Object.keys(input).every(k => names.includes(k)), 'no actor substitution');
   const args = names.map(k => input[k] ?? null);
   // Omitted arguments use SQL defaults; the app intentionally sends none on policy reads.
   while (args.length && !(names[args.length - 1] in input)) args.pop();
   try { return await respond(await db.rpc(who, name, args)); }
   catch (e) { return respond({ code: e.code ?? '', message: 'Synthetic RPC denied', details: null, hint: null }, 400); }
  }
  if (url.pathname === '/rest/v1/events') return respond([], 201);
  if (name === 'owner_account_directory_v1') return respond({ version: 1, boundary: new Date().toISOString(), rows: [], counts: { pending: 0, approved: 0, suspended: 0 }, next: null });
  if (name === 'owner_account_deletion_v1' || name === 'owner_surveys_v1') return respond({ rows: [], next: null });
  if (name === 'owner_page_v1') return respond({ version: 1, boundary: new Date().toISOString(), rows: [], next: null });
  return respond(null);
 });
 return ctx;
}
async function audit(page, label) {
 await page.evaluate(axe);
 const violations = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }).then(r => r.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))));
 assert.deepEqual(violations, [], label); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflow');
 assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1, label + ' h1'); audits++;
}
async function open(ctx, base, locale, route) {
 const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
 page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource:.*404/.test(message.text())) errors.push(message.text()); });
 await page.goto(`${base}/${locale}/${route}`); return page;
}
let deferredServer, requiredServer;
try {
 await reset(); deferredServer = await serve(join(root, 'out'));
 for (const locale of promoted ? [] : ['en', 'ar']) for (const route of ['account', 'owner', 'supervisor']) {
  const ctx = await context(deferredServer.base, route === 'owner' ? 1 : route === 'supervisor' ? 2 : 4, locale, 390, 'dark');
  const before = p1Calls, page = await open(ctx, deferredServer.base, locale, route);
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('[data-p1-role]').count(), 0);
  assert.equal(await page.locator('.site-nav a[href$="/supervisor"]').count(), 0);
  assert.equal(p1Calls, before); await ctx.close();
 }
 console.log(promoted ? 'Promoted export: deferred checks skipped.' : 'Deferred production export: 6 route/locale checks, zero P1 RPCs.');
 await deferredServer.close(); deferredServer = null;
 if (process.argv.includes('--deferred-only')) process.exitCode = 0;
 else {
  if (promoted) requiredServer = await serve(join(root, 'out'));
  else {
   const copy = join(dir, 'required'); mkdirSync(copy);
   for (const file of ['src', 'messages', 'public', 'scripts', 'supabase', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'next-env.d.ts', 'postcss.config.mjs']) if (existsSync(file)) cpSync(file, join(copy, file), { recursive: true });
   execFileSync('cp', ['-a', '--reflink=auto', join(root, 'node_modules'), join(copy, 'node_modules')]);
   const file = join(copy, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(file));
   for (const migration of m.guardedFeatures.supervisorP1.migrations) { m.requiredMigrations.push(migration); delete m.deferredMigrations[migration]; }
   writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
   console.log('Building the required-manifest test copy (no git checkout/worktree).');
   await new Promise((resolveBuild, reject) => {
    const child = spawn('npm', ['run', 'build:pages'], { cwd: copy, env: publicEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', c => output += c); child.stderr.on('data', c => output += c);
    child.on('exit', code => code === 0 ? resolveBuild() : reject(Error(output))); child.on('error', reject);
   });
   requiredServer = await serve(join(copy, 'out'));
  }
  for (const width of [390, 1440]) for (const locale of ['en', 'ar']) for (const theme of ['light', 'dark']) {
   console.log(`Required routes ${locale}/${width}/${theme}`); await reset(); const t = msgs[locale].supervisor;
   const sc = await context(requiredServer.base, 2, locale, width, theme), uc = await context(requiredServer.base, 4, locale, width, theme), oc = await context(requiredServer.base, 1, locale, width, theme);
   try {
    const supervisor = await open(sc, requiredServer.base, locale, 'supervisor');
    await supervisor.getByRole('button', { name: 'Synthetic route group', exact: true }).click();
    await supervisor.getByRole('heading', { name: t.results, exact: true }).waitFor(); await audit(supervisor, 'supervisor');
    await supervisor.getByRole('button', { name: t.rotate, exact: true }).click();
    const receipt = supervisor.getByRole('heading', { name: t.code, exact: true }).locator('..'); await receipt.waitFor();
    const code = await receipt.locator('p[dir=ltr]').textContent(); assert.match(code, /^[a-f0-9]{64}$/);
    // P1-USABILITY-F1: refresh must retain the code until explicit Done.
    await supervisor.getByRole('button', { name: t.copyCode, exact: true }).click();
    await supervisor.getByRole('button', { name: t.retry, exact: true }).click();
    await supervisor.getByRole('heading', { name: t.code, exact: true }).waitFor();
    await supervisor.getByRole('button', { name: t.done, exact: true }).click();
    await supervisor.getByRole('heading', { name: t.results, exact: true }).waitFor(); assert.equal(await supervisor.getByRole('heading', { name: t.code, exact: true }).count(), 0);
    const student = await open(uc, requiredServer.base, locale, 'account'), studentPanel = student.locator('[data-p1-role=student]');
    await studentPanel.getByRole('checkbox').waitFor(); assert.equal(await studentPanel.getByRole('checkbox').isChecked(), false);
    assert.equal(await studentPanel.getByRole('button', { name: t.join, exact: true }).count(), 0); await audit(student, 'student unchecked');
    await studentPanel.getByRole('button', { name: t.accept, exact: true }).click(); assert.equal(await studentPanel.getByRole('button', { name: t.withdraw, exact: true }).count(), 0);
    await studentPanel.getByRole('checkbox').check(); await studentPanel.getByRole('button', { name: t.accept, exact: true }).click();
    await studentPanel.getByLabel(t.enter).fill(code); await studentPanel.getByRole('button', { name: t.join, exact: true }).click();
    await studentPanel.getByRole('button', { name: t.cancel, exact: true }).waitFor(); await audit(student, 'student pending');
    const refresh = async p => { await p.getByRole('button', { name: t.retry, exact: true }).click(); };
    await refresh(supervisor); await supervisor.getByRole('button', { name: t.reject, exact: true }).click();
    await refresh(studentPanel); await studentPanel.getByText(new RegExp(t.rejected)).first().waitFor();
    await studentPanel.getByLabel(t.enter).fill(code); await studentPanel.getByRole('button', { name: t.join, exact: true }).click();
    await studentPanel.getByRole('button', { name: t.cancel, exact: true }).waitFor();
    await refresh(supervisor); await supervisor.getByRole('button', { name: t.approve, exact: true }).click();
    await refresh(studentPanel); await studentPanel.getByRole('button', { name: t.leave, exact: true }).waitFor();
    await practice(902, 37); await refresh(supervisor);
    await supervisor.getByText(`${t.total}: 1`, { exact: true }).last().waitFor();
    const results = supervisor.getByRole('heading', { name: t.results, exact: true }).locator('..'); assert.ok((await results.textContent()).includes('37')); await audit(supervisor, 'practice window');
    if (width === 390 && theme === 'dark') { const path = `docs/review/p1-usability-${locale}.jpg`; mkdirSync('docs/review', { recursive: true }); await supervisor.screenshot({ path, type: 'jpeg', quality: 65, fullPage: true }); captures.push(path); }
    await studentPanel.getByRole('button', { name: t.withdraw, exact: true }).click();
    await studentPanel.getByRole('checkbox').waitFor(); await refresh(supervisor);
    await results.getByText(`${t.total}: 0`, { exact: true }).waitFor(); await audit(student, 'withdrawn');
    await studentPanel.getByRole('checkbox').check(); await studentPanel.getByRole('button', { name: t.accept, exact: true }).click();
    await studentPanel.getByRole('button', { name: t.leave, exact: true }).click(); await studentPanel.getByRole('button', { name: t.confirmLeave, exact: true }).click();
    await studentPanel.getByRole('button', { name: t.retry, exact: true }).waitFor();
    const owner = await open(oc, requiredServer.base, locale, 'owner'), ownerPanel = owner.locator('[data-p1-role=owner]');
    // P1-USABILITY-F6: revoke returns success; #149 owns the appointment picker.
    await ownerPanel.getByLabel(t.appointmentSearch).waitFor(); await audit(owner, 'owner appointments');
    const row = ownerPanel.getByRole('listitem').filter({ hasText: id(2) }); await row.getByRole('button', { name: t.revoke, exact: true }).click();
    await ownerPanel.getByRole('button', { name: t.confirmRevoke, exact: true }).click();
    await refresh(supervisor); await supervisor.getByText(t.denied, { exact: true }).or(supervisor.getByText(t.notSupervisor, { exact: true })).waitFor();
    await ownerPanel.getByText(t.success, { exact: true }).waitFor();
    await db.rpc(1, 'appointment_v1', [id(2), true]);
    await supervisor.reload(); await supervisor.getByRole('button', { name: 'Synthetic route group', exact: true }).click(); await supervisor.getByRole('button', { name: t.end, exact: true }).click();
    await supervisor.getByRole('button', { name: t.confirmEnd, exact: true }).click();
    // P1-USABILITY-F6: successful end returns the list, never denied.
    await supervisor.getByText(t.success, { exact: true }).waitFor();
    assert.equal(await supervisor.getByText(t.denied, { exact: true }).count(), 0);
    await supervisor.getByText(t.selectGroupHint, { exact: true }).waitFor();
    await supervisor.getByText(t.create, { exact: true }).first().click();
    await supervisor.getByLabel(t.name, { exact: true }).fill('Created from app route');
    await supervisor.getByLabel(t.ends, { exact: true }).fill(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
    await supervisor.getByRole('button', { name: t.create, exact: true }).click(); await supervisor.getByRole('heading', { name: t.code, exact: true }).waitFor();
    const otherContext = await context(requiredServer.base, 3, locale, width, theme);
    const other = await open(otherContext, requiredServer.base, locale, 'supervisor'); await other.getByRole('button', { name: 'Other supervisor group', exact: true }).waitFor();
    assert.equal(await other.getByRole('button', { name: 'Synthetic route group', exact: true }).count(), 0);
    assert.equal(await other.getByLabel(t.appointmentSearch).count(), 0); await audit(other, 'other supervisor'); await otherContext.close();
    // Direct SQL authorization witnesses complement the UI, using synthetic identities only.
    await assert.rejects(() => db.rpc(2, 'appointment_v1', [id(3), true]), e => e.code === '42501');
    await assert.rejects(() => db.rpc(1, 'appointment_v1', [id(5), true]), e => e.code === '22023');
    await assert.rejects(() => db.rpc(2, 'scope_page_v1', ['appointments']), e => e.code === '42501');
    await assert.rejects(() => db.rpc(2, 'scope_page_v1', ['members', initial.id]), e => ['42501', '55000'].includes(e.code));
    rows.push({ locale, width, theme, passed: true });
   } finally { await sc.close(); await uc.close(); await oc.close(); }
  }
 }
 assert.deepEqual(errors, []); assert.deepEqual(outbound, []);
 const screenshotBytes = captures.reduce((sum, path) => sum + statSync(path).size, 0); assert.ok(screenshotBytes <= 5 * 1024 * 1024);
 const summary = { deferredChecks: 6, deferredCalls: 0, requiredMatrix: rows, audits, p1Calls, errors, outbound, screenshotBytes, captures };
 writeFileSync('/tmp/rad085-p1-routes-summary.json', JSON.stringify(summary, null, 2)); console.log(JSON.stringify(summary));
} finally {
 await browser.close(); await deferredServer?.close(); await requiredServer?.close(); await db?.close(); rmSync(dir, { recursive: true, force: true });
}
