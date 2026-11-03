// RAD-041 live isolation checks (docs/PILOT_SUPABASE_SETUP.md §9, owner decision D5 2026-11-03).
// Owner-run, after the RAD-059/RAD-085 promotion; see docs/RAD-041_LIVE_ISOLATION_RUNBOOK.md.
// Public URL + publishable key only. Two synthetic accounts from a mode-600 file. Never changes account status.
// Output is fixed text: check number, label, PASS/FAIL/UNKNOWN and a fixed reason code. Never emails, passwords,
// tokens, ids or row payloads. A network error or timeout is UNKNOWN, never PASS. At most one heartbeat is meant to be written per run.
import { readFileSync, statSync } from 'node:fs';
import { setDefaultResultOrder } from 'node:dns';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { assertPublishableKey, supabaseOrigin } from '../pages/headers.mjs';

export const PHASES = Object.freeze({
  pending: { checks: [1, 2], states: 'A = pending (B not used)' },
  approved: { checks: [1, 3, 4, 5], states: 'A = approved, B = pending or approved' },
  suspended: { checks: [1, 6, 5], states: 'A = suspended, B = pending or approved' },
});
const LABELS = {
  1: 'anon request to profiles is denied',
  2: 'pending account cannot insert an event',
  3: 'approved account inserts exactly one own heartbeat',
  4: "event with the other account's user_id is denied",
  5: "other account's profile/events/attempts return zero rows",
  6: 'suspended account reads own rows, cannot insert events/attempts/feedback',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STATUSES = new Set(['pending', 'approved', 'suspended']);
const PRODUCER = 'rad041-live-isolation';

/** Reads the owner's protected credentials file. Throws a fixed message; never echoes content. */
export function loadAccounts(path, { stat = statSync, read = readFileSync, uid = process.getuid?.() } = {}) {
  if (!path) throw Error('RAD041_ACCOUNTS_FILE is not set');
  let st;
  try { st = stat(path); } catch { throw Error('accounts file not found'); }
  if (!st.isFile()) throw Error('accounts file is not a regular file');
  if ((st.mode & 0o777) !== 0o600) throw Error('accounts file must have mode 600 (run: chmod 600 <file>)');
  if (uid !== undefined && st.uid !== uid) throw Error('accounts file must be owned by you');
  let data;
  try { data = JSON.parse(read(path, 'utf8')); } catch { throw Error('accounts file is not valid JSON'); }
  const pick = (k) => {
    const a = data?.[k];
    if (!a || typeof a.email !== 'string' || !/^[^@\s]+@[^@\s]+$/.test(a.email) || typeof a.password !== 'string' || a.password.length < 6 || a.password.length > 256)
      throw Error(`accounts file: entry ${k} needs "email" and "password"`);
    return { email: a.email, password: a.password };
  };
  const accounts = { A: pick('A'), B: pick('B') };
  if (accounts.A.email.toLowerCase() === accounts.B.email.toLowerCase()) throw Error('accounts file: A and B must be different accounts');
  return accounts;
}

/** Public URL + publishable key from the environment (same validation as the site build). */
export function readPublicConfig(env) {
  const url = supabaseOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  const key = assertPublishableKey(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) throw Error('set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (public values only)');
  return { url, key };
}

function transport({ url, key, fetch, timeoutMs }) {
  return async function call(method, path, { token, body, prefer } = {}) {
    const headers = { apikey: key, accept: 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (prefer) headers.prefer = prefer;
    let res, text;
    try {
      res = await fetch(url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
      text = method === 'HEAD' ? '' : await res.text();
    } catch { return { net: true }; }
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    const code = typeof json?.code === 'string' && /^[0-9A-Z]{5}$/.test(json.code) ? json.code : null;
    const range = /\/(\d+)$/.exec(res.headers?.get?.('content-range') ?? '');
    return { status: res.status, code, json, count: range ? Number(range[1]) : null };
  };
}

// Fixed-vocabulary outcomes. `why` is never server text.
const pass = () => ({ result: 'PASS' });
const fail = (why) => ({ result: 'FAIL', why });
const unknown = (why) => ({ result: 'UNKNOWN', why });
const httpWhy = (r) => (r.net ? 'network/timeout' : `HTTP ${r.status}${r.code ? ` ${r.code}` : ''}`);
/** A write probe: 42501 denial = expected; 2xx = written (FAIL); anything else cannot be judged. */
function judgeDenied(r) {
  if (r.net) return unknown('network/timeout');
  if ((r.status === 401 || r.status === 403) && r.code === '42501') return pass();
  if (r.status >= 200 && r.status < 300) return fail('write accepted');
  return unknown(httpWhy(r));
}
const worst = (parts) => parts.find((p) => p.result === 'FAIL') ?? parts.find((p) => p.result === 'UNKNOWN') ?? pass();

const eventRow = (extra = {}) => ({ type: 'heartbeat', payload: {}, payload_format_version: 1, mode: 'practice', record_kind: 'event', producer_version: PRODUCER, engine_version: 'unknown', ...extra });
const attemptRow = () => ({ attempt_no: 1, exam_id: 'rad041-probe', case_id: 'rad041-probe', definition_version: 'rad041-probe', settings: {}, result: {}, locale: 'en', settings_format_version: 1, result_format_version: 1, mode: 'practice', record_kind: 'attempt', producer_version: PRODUCER, engine_version: 'unknown' });
const feedbackRow = () => ({ exam_id: 'rad041-probe', attempt_id: null, text: 'rad041 synthetic probe', note_format_version: 1, mode: 'practice', record_kind: 'feedback', producer_version: PRODUCER, engine_version: 'unknown' });

async function signIn(call, account) {
  const r = await call('POST', '/auth/v1/token?grant_type=password', { body: { email: account.email, password: account.password } });
  if (r.net) return { error: 'network/timeout' };
  const token = r.json?.access_token, id = r.json?.user?.id;
  if (r.status !== 200 || typeof token !== 'string' || !token || typeof id !== 'string' || !UUID.test(id)) return { error: `sign-in refused (HTTP ${r.status})` };
  return { token, id };
}
async function ownState(call, s) {
  const r = await call('GET', `/rest/v1/profiles?select=status,role&user_id=eq.${s.id}`, { token: s.token });
  if (r.net) return { error: 'network/timeout' };
  const row = Array.isArray(r.json) && r.json.length === 1 ? r.json[0] : null;
  if (r.status !== 200 || !row || !STATUSES.has(row.status)) return { error: `own profile unreadable (${httpWhy(r)})` };
  return { status: row.status, role: row.role === 'participant' ? 'participant' : 'other' };
}
async function countRows(call, s, table, owner, extra = '') {
  return call('HEAD', `/rest/v1/${table}?select=user_id&user_id=eq.${owner}${extra}`, { token: s.token, prefer: 'count=exact' });
}
async function readsNothing(call, reader, owner) {
  const parts = [];
  for (const table of ['profiles', 'events', 'attempts']) {
    const r = await call('GET', `/rest/v1/${table}?select=user_id&user_id=eq.${owner}&limit=1`, { token: reader.token });
    if (r.net) parts.push(unknown('network/timeout'));
    else if (r.status !== 200 || !Array.isArray(r.json)) parts.push(unknown(`${table} ${httpWhy(r)}`));
    else parts.push(r.json.length === 0 ? pass() : fail(`${table} row visible`));
  }
  return worst(parts);
}

const checks = {
  async 1({ call }) {
    const r = await call('GET', '/rest/v1/profiles?select=user_id&limit=1');
    if (r.net) return unknown('network/timeout');
    if ((r.status === 401 || r.status === 403) && r.code === '42501') return pass();
    if (r.status === 200) return fail('anon read allowed');
    return unknown(httpWhy(r));
  },
  async 2({ call, A }) { return judgeDenied(await call('POST', '/rest/v1/events', { token: A.token, body: eventRow(), prefer: 'return=minimal' })); },
  async 3({ call, A }) {
    const before = await countRows(call, A, 'events', A.id, '&type=eq.heartbeat');
    if (before.net || before.status < 200 || before.status > 299 || before.count === null) return unknown(`count before: ${httpWhy(before)}`);
    const w = await call('POST', '/rest/v1/events', { token: A.token, body: eventRow(), prefer: 'return=minimal' });
    if (w.net) return unknown('network/timeout');
    if ((w.status === 401 || w.status === 403) && w.code === '42501') return fail('approved write denied');
    if (w.status < 200 || w.status > 299) return unknown(`write ${httpWhy(w)}`);
    const after = await countRows(call, A, 'events', A.id, '&type=eq.heartbeat');
    if (after.net || after.status < 200 || after.status > 299 || after.count === null) return unknown(`count after: ${httpWhy(after)}`);
    return after.count - before.count === 1 ? pass() : fail('own heartbeat count did not rise by exactly 1');
  },
  async 4({ call, A, B }) { return judgeDenied(await call('POST', '/rest/v1/events', { token: A.token, body: eventRow({ user_id: B.id }), prefer: 'return=minimal' })); },
  async 5({ call, A, B, phase }) { return phase === 'suspended' ? readsNothing(call, B, A.id) : readsNothing(call, A, B.id); },
  async 6({ call, A }) {
    const parts = [];
    const own = await call('GET', `/rest/v1/profiles?select=status&user_id=eq.${A.id}`, { token: A.token });
    if (own.net) parts.push(unknown('network/timeout'));
    else if (own.status === 200 && Array.isArray(own.json) && own.json.length === 1) parts.push(pass());
    else if ((own.status === 401 || own.status === 403) || (own.status === 200 && Array.isArray(own.json) && own.json.length === 0)) parts.push(fail('own profile not readable'));
    else parts.push(unknown(`own profile ${httpWhy(own)}`));
    const ev = await countRows(call, A, 'events', A.id);
    if (ev.net || ev.status < 200 || ev.status > 299 || ev.count === null) parts.push(unknown(`own events ${httpWhy(ev)}`));
    else if (ev.count === 0) parts.push(unknown('no own events to read; run phase approved first'));
    else parts.push(pass());
    for (const [table, row] of [['events', eventRow()], ['attempts', attemptRow()], ['feedback', feedbackRow()]]) {
      const v = judgeDenied(await call('POST', `/rest/v1/${table}`, { token: A.token, body: row, prefer: 'return=minimal' }));
      parts.push(v.why ? { ...v, why: `${table}: ${v.why}` } : v);
    }
    return worst(parts);
  },
};

const EXPECT = { pending: ['pending'], approved: ['approved'], suspended: ['suspended'] };
const NEEDS_B = { pending: false, approved: true, suspended: true };

/** Runs one phase. Returns [{ n, result, why? }] in the phase's check order; never throws on network trouble. */
export async function runPhase({ phase, url, key, accounts, fetch, timeoutMs = 15000 }) {
  const plan = PHASES[phase];
  if (!plan) throw Error('unknown phase');
  const call = transport({ url, key, fetch, timeoutMs });
  const out = [];
  const allUnknown = (why, from = 0) => { for (const n of plan.checks.slice(from)) out.push({ n, ...unknown(why) }); return out; };
  out.push({ n: 1, ...(await checks[1]({ call })) });
  const sessions = [];
  try {
    const A = await signIn(call, accounts.A);
    if (A.error) return allUnknown(`A ${A.error}`, 1);
    sessions.push(A);
    const sa = await ownState(call, A);
    if (sa.error) return allUnknown(`A ${sa.error}`, 1);
    if (sa.role !== 'participant') return allUnknown('A is not a synthetic participant; STOP', 1);
    if (!EXPECT[phase].includes(sa.status)) return allUnknown(`state: A is ${sa.status}, phase needs ${EXPECT[phase][0]}`, 1);
    let B;
    if (NEEDS_B[phase]) {
      B = await signIn(call, accounts.B);
      if (B.error) return allUnknown(`B ${B.error}`, 1);
      sessions.push(B);
      if (B.id === A.id) return allUnknown('A and B are the same account; STOP', 1);
      const sb = await ownState(call, B);
      if (sb.error) return allUnknown(`B ${sb.error}`, 1);
      if (sb.role !== 'participant') return allUnknown('B is not a synthetic participant; STOP', 1);
      if (sb.status === 'suspended') return allUnknown('state: B is suspended, phase needs pending or approved', 1);
    }
    for (const n of plan.checks.slice(1)) out.push({ n, ...(await checks[n]({ call, A, B, phase })) });
    return out;
  } finally {
    for (const s of sessions) await call('POST', '/auth/v1/logout?scope=local', { token: s.token });
  }
}

export function formatReport(phase, results) {
  const lines = [`RAD-041 live isolation - phase ${phase}`];
  for (const r of results) lines.push(`${r.n} ${LABELS[r.n]}: ${r.result}${r.why ? ` (${r.why})` : ''}`);
  lines.push('7 restore: NOT RUN - see RAD-086 evidence');
  const t = (k) => results.filter((r) => r.result === k).length;
  lines.push(`TOTAL ${results.length} checks: PASS ${t('PASS')} FAIL ${t('FAIL')} UNKNOWN ${t('UNKNOWN')}`);
  return lines;
}
export const exitCode = (results) => (results.some((r) => r.result === 'FAIL') ? 1 : results.some((r) => r.result === 'UNKNOWN') ? 2 : 0);

/** Interactive entry. `ask` returns the typed answer; `print` writes one line. */
export async function main({ env = process.env, fetch = globalThis.fetch, ask, print = (l) => process.stdout.write(l + '\n'), loadOptions } = {}) {
  let config, accounts;
  try {
    config = readPublicConfig(env);
    accounts = loadAccounts(env.RAD041_ACCOUNTS_FILE, loadOptions);
  } catch (e) {
    print(`STOP: ${e instanceof Error && !/sb_|eyJ/.test(e.message) ? e.message : 'configuration error'}`);
    return 3;
  }
  print('Phases (set the states in the owner panel first; this tool never changes them):');
  for (const [name, p] of Object.entries(PHASES)) print(`  ${name}: ${p.states}`);
  const phase = String((await ask('Phase to run (pending / approved / suspended): ')) ?? '').trim().toLowerCase();
  if (!PHASES[phase]) { print('STOP: unknown phase; nothing was sent'); return 3; }
  const results = await runPhase({ phase, ...config, accounts, fetch });
  for (const l of formatReport(phase, results)) print(l);
  return exitCode(results);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setDefaultResultOrder('ipv4first');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  main({ ask: (q) => rl.question(q) }).then((code) => { rl.close(); process.exitCode = code; }, () => { rl.close(); process.stdout.write('STOP: unexpected error (no details printed)\n'); process.exitCode = 3; });
}
