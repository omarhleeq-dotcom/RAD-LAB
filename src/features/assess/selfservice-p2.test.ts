/** RAD-105 P2: dormant self-service screens. Pure and server-rendered; no database. */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { AMMAN, ammanLocalToUtc, defaultWindow, formatAmman, latestFullStart, utcToAmmanLocal, validateWindow, MAX_WINDOW_MS } from './selfservice/window-time';
import { studentExamKind, type SessionInfo, type WindowInfo } from './selfservice/student-state';
import { selfServiceStrings } from './selfservice/strings';
import { StatusBoard, StudentExamList, SupervisorSchedule } from './selfservice/SelfServiceViews';

const now = '2026-11-05T09:00:00.000Z';
const win = (o: number, c: number, closed = false): WindowInfo => ({ opensAt: new Date(Date.parse(now) + o * 60000).toISOString(), closesAt: new Date(Date.parse(now) + c * 60000).toISOString(), closed, now });
const sess = (state: SessionInfo['state'], deadlineMin: number | null, ready = false): SessionInfo => ({ state, deadline: deadlineMin === null ? null : new Date(Date.parse(now) + deadlineMin * 60000).toISOString(), resultReady: ready });

describe('window time (UTC storage, Amman display)', () => {
 it('round-trips Amman wall time through UTC using the tz database offset', () => {
  for (const local of ['2026-11-05T09:00', '2026-07-01T23:45', '2027-01-15T00:00']) {
   const utc = ammanLocalToUtc(local)!;
   expect(utcToAmmanLocal(utc)).toBe(local);
   const offset = new Intl.DateTimeFormat('en-US', { timeZone: AMMAN, timeZoneName: 'longOffset' }).formatToParts(new Date(utc)).find(p => p.type === 'timeZoneName')!.value; // e.g. GMT+03:00
   const hours = Number(/GMT([+-]\d{2}):(\d{2})/.exec(offset)![1]);
   expect(Date.parse(utc) + hours * 3600000).toBe(Date.parse(local + ':00Z'));
  }
  expect(ammanLocalToUtc('2026-11-05 09:00')).toBeNull();
  expect(ammanLocalToUtc('not a time')).toBeNull();
 });
 it('mirrors the server rules', () => {
  const t = Date.parse(now), iso = (ms: number) => new Date(t + ms).toISOString();
  expect(validateWindow(null, iso(1), t)).toBe('invalid');
  expect(validateWindow(iso(3600000), iso(3600000), t)).toBe('order');
  expect(validateWindow(iso(0), iso(MAX_WINDOW_MS + 1), t)).toBe('cap');
  expect(validateWindow(iso(-3600000), iso(3600000), t)).toBe('past');
  expect(validateWindow(iso(-30000), iso(MAX_WINDOW_MS - 30000), t)).toBeNull();
  expect(latestFullStart(iso(3600000), 1800)).toBe(iso(1800000));
  const d = defaultWindow(t);
  expect(validateWindow(ammanLocalToUtc(d.opensLocal), ammanLocalToUtc(d.closesLocal), t)).toBeNull();
  expect(formatAmman(now, 'ar')).not.toBe('');
 });
});

describe('student exam state', () => {
 it.each([
  [null, null, 'unavailable'], [win(60, 120), null, 'upcoming'], [win(-5, 60), null, 'open'], [win(-120, -60), null, 'missed'], [win(60, 120, true), null, 'cancelled'],
  [win(-5, 60), sess('active', 30), 'in-progress'], [win(-5, 60), sess('active', -1), 'expired'], [win(-5, 60), sess('grading', null), 'submitted'],
  [win(-120, -60), sess('grading-failed', null), 'submitted'], [win(-5, 60), sess('grading', null, true), 'graded'], [win(60, 120, true), sess('active', 30), 'in-progress'],
 ] as const)('%#', (w, s, kind) => expect(studentExamKind(w, s)).toBe(kind));
});

describe('screens', () => {
 const s = selfServiceStrings;
 it('student list: empty, every state, English and Arabic, link to the assessment history', () => {
  for (const locale of ['en', 'ar'] as const) {
   const html = (items: Parameters<typeof StudentExamList>[0]['items'], enabled = true) => renderToStaticMarkup(createElement(StudentExamList, { enabled, items, strings: s[locale], locale, historyHref: '/assess/history', onStart: () => {} }));
   expect(html([])).toContain(s[locale].empty);
   const all = html([
    { id: 'a', name: 'A', window: win(60, 120), session: null }, { id: 'b', name: 'B', window: win(-5, 60), session: null }, { id: 'c', name: 'C', window: win(-5, 60), session: sess('active', 30) },
    { id: 'd', name: 'D', window: win(-5, 60), session: sess('grading', null) }, { id: 'e', name: 'E', window: win(-5, 60), session: sess('grading', null, true) },
    { id: 'f', name: 'F', window: win(-120, -60), session: null }, { id: 'g', name: 'G', window: win(60, 120, true), session: null }, { id: 'h', name: 'H', window: null, session: null },
   ]);
   for (const kind of ['upcoming', 'open', 'in-progress', 'submitted', 'graded', 'missed', 'cancelled', 'unavailable']) expect(all).toContain(`data-state="${kind}"`);
   expect(all.match(/href="\/assess\/history"/g)).toHaveLength(2);
   expect(all).toContain(s[locale].historyLink);
   expect(html([{ id: 'a', name: 'A', window: win(60, 120), session: null }], false)).toBe('');
  }
 });
 it('supervisor screens are inert when unavailable; status board shows all five counts', () => {
  const off = renderToStaticMarkup(createElement(SupervisorSchedule, { adapter: { available: false, schedule: async () => {} }, strings: s.en, locale: 'en', durationSeconds: 3600, nowMs: Date.parse(now), clock: () => Date.parse(now) }));
  expect(off).toContain(s.en.unavailable);
  const on = renderToStaticMarkup(createElement(SupervisorSchedule, { adapter: { available: true, schedule: async () => {} }, strings: s.ar, locale: 'ar', durationSeconds: 3600, nowMs: Date.parse(now), clock: () => Date.parse(now) }));
  expect(on).toContain('type="datetime-local"');
  expect(on).toContain(s.ar.timezone);
  const board = renderToStaticMarkup(createElement(StatusBoard, { counts: { notStarted: 1, inProgress: 2, submitted: 3, graded: 4, missed: 5 }, strings: s.en }));
  for (const label of ['Not started', 'In progress', 'Submitted', 'Graded', 'Missed']) expect(board).toContain(label);
 });
});

describe('mounted only through the schema-detected S3 entry', () => {
 const files = (dir: string): string[] => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
 const production = files('src').filter(f => /\.(ts|tsx|mjs)$/.test(f) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx') && f !== 'src/features/assess/selfservice-audit.mjs');
 it('only the reviewed entrypoints mount it; database calls stay in the pinned adapters', () => {
  const entries=new Set(['src/features/assess/AssessPanel.tsx','src/features/assess/OwnerAssessPanel.tsx','src/features/emergency/EmergencySession.tsx']);
  for (const f of production.filter(p => !p.startsWith('src/features/assess/selfservice/'))) {
   const text = readFileSync(f, 'utf8');
   if(!entries.has(f))expect(text, f).not.toMatch(/selfservice\//);
   expect(text, f).not.toMatch(/assignment_window_set_v1|my_windows_v1|assignment_status_v1/);
  }
  for (const f of production.filter(p => p.startsWith('src/features/assess/selfservice/')&&!['adapter.ts','runner.ts'].some(name=>p.endsWith('/'+name)))) expect(readFileSync(f, 'utf8'), f).not.toMatch(/\.rpc\(|\.from\(|supabase/);
 });
 it('the promotion adapter template matches the staged SQL signatures', () => {
  const adapter = readFileSync('supabase/staged/self-service/p2-adapter.ts.txt', 'utf8'), sql = readFileSync('supabase/staged/self-service/p1-windows.sql', 'utf8');
  for (const [name, args] of [['assignment_window_set_v1', ['p_assignment', 'p_revision', 'p_opens', 'p_closes']], ['my_windows_v1', ['p_assignments']], ['assignment_status_v1', ['p_assignment', 'p_after', 'p_limit']]] as const) {
   expect(adapter).toContain(`rpc("${name}"`);
   const decl = new RegExp(`create function assess\\.${name}\\(([^)]*)\\)`).exec(sql)![1]!;
   for (const a of args) { expect(adapter, a).toContain(a); expect(decl, a).toContain(a); }
  }
 });
 it('the deploy schema gate accepts the freshly calibrated S4 marker', () => {
  const run = spawnSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'A'.repeat(24), PILOT_SCHEMA_VERIFIED: 'pilot-v1:84c980aa7325174878ccb41d73c044f9961aacb7f8ef68f64af58cd9ccc5f3d6' } });
  expect(run.status, run.stderr).toBe(0);
 });
});
