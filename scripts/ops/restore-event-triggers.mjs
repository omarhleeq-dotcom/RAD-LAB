// Restore-only metadata boundary. No error prose or SQL crosses this module's diagnostics.
import { Stop } from './laptop-backup-lib.mjs';

const IDENT = '[A-Za-z_][A-Za-z0-9_$]{0,62}';
const ident = new RegExp(`^(?:${IDENT})$`);
const token = `(?:"${IDENT}"|${IDENT})`;
const unquote = s => s?.replace(/^"|"$/g, '');
const safe = s => typeof s === 'string' && ident.exec(s)?.[0] === s ? s : 'unparsed';
const TYPES = ['EVENT TRIGGER', 'TABLE DATA', 'MATERIALIZED VIEW DATA', 'FOREIGN DATA WRAPPER', 'FOREIGN TABLE',
  'DEFAULT ACL', 'SEQUENCE OWNED BY', 'SEQUENCE SET', 'PROCEDURAL LANGUAGE', 'PUBLICATION TABLE',
  'ACCESS METHOD', 'TEXT SEARCH CONFIGURATION', 'TEXT SEARCH DICTIONARY', 'TEXT SEARCH PARSER', 'TEXT SEARCH TEMPLATE',
  'DATABASE', 'DATABASE PROPERTIES', 'SCHEMA', 'EXTENSION', 'FUNCTION', 'PROCEDURE', 'AGGREGATE', 'TYPE', 'DOMAIN',
  'TABLE', 'SEQUENCE', 'VIEW', 'MATERIALIZED VIEW', 'INDEX', 'INDEX ATTACH', 'TABLE ATTACH', 'CONSTRAINT',
  'FK CONSTRAINT', 'TRIGGER', 'RULE', 'POLICY', 'ROW SECURITY', 'ACL', 'COMMENT', 'SECURITY LABEL',
  'CAST', 'COLLATION', 'CONVERSION', 'OPERATOR CLASS', 'OPERATOR FAMILY', 'OPERATOR', 'SERVER', 'USER MAPPING',
  'PUBLICATION', 'SUBSCRIPTION', 'STATISTICS', 'ENCODING', 'STDSTRINGS', 'SEARCHPATH', 'BLOB', 'BLOB DATA', 'BLOBS'];
const typePattern = TYPES.sort((a, b) => b.length - a.length).join('|');
const fail = () => { throw new Stop('restore'); };

export function tocLines(toc) {
  if (typeof toc !== 'string' || Buffer.byteLength(toc) > 256 * 1024 * 1024) fail();
  return toc.match(/[^\n]*\n|[^\n]+$/g) ?? [];
}
export function tocEntries(toc) {
  return tocLines(toc).filter(l => /^\d+; /.test(l));
}
export function eventEntries(toc) {
  return tocEntries(toc).filter(l => /^\d+; \d+ \d+ EVENT TRIGGER /.test(l)).map(line => {
    const m = new RegExp(`^(\\d+); \\d+ \\d+ EVENT TRIGGER - (${token}) (${token})\\r?\\n?$`).exec(line);
    if (!m || !Number.isSafeInteger(Number(m[1]))) fail();
    return { line, id: m[1], name: unquote(m[2]), owner: unquote(m[3]) };
  });
}
export function proveCompleteness(toc, first, second) {
  const full = tocEntries(toc), parts = [...tocEntries(first), ...second.flatMap(tocEntries)];
  const ids = lines => lines.map(l => /^(\d+);/.exec(l)[1]);
  if (new Set(ids(full)).size !== full.length || new Set(ids(parts)).size !== parts.length || parts.length !== full.length) fail();
  const got = new Map(parts.map(l => [/^(\d+);/.exec(l)[1], l]));
  if (full.some(l => got.get(/^(\d+);/.exec(l)[1]) !== l)) fail();
  // Pass one must retain every remaining line (including comments) in its original order.
  const deferred = new Set(second.flatMap(tocEntries));
  if (tocLines(toc).filter(l => !deferred.has(l)).join('') !== first || second.some(s => tocEntries(s).length !== 1)) fail();
  return full.length;
}
export function restorePlan(toc, roles) {
  const events = eventEntries(toc);
  const second = events.filter(e => roles.get(e.owner) === false);
  const selected = new Set(second.map(e => e.line));
  const first = tocLines(toc).filter(l => !selected.has(l)).join('');
  const count = proveCompleteness(toc, first, second.map(e => e.line));
  return { first, second, events, count };
}

export function restoreDiagnostic(stderr, result, toc = '') {
  const raw = String(stderr ?? '');
  // Overflow is also silent: a truncated tail could contain COPY or TABLE DATA.
  if (Buffer.byteLength(raw) > 1024 * 1024 || result.error?.code === 'ENOBUFS' || /COPY/i.test(raw) || /\bTABLE DATA\b/.test(raw)) return null;
  const prelude = raw.split(/^pg_restore: error:/m, 1)[0];
  const id = /^pg_restore: from TOC entry (\d+); /m.exec(prelude)?.[1];
  const line = id && tocEntries(toc).find(l => l.startsWith(id + '; '));
  const source = line ?? ''; // Metadata is trusted only from the archive TOC, never error-message text.
  const m = new RegExp(`^(\\d+); \\d+ \\d+ (${typePattern}) (\\S+) (.+) (\\S+)\\r?\\n?$`).exec(source);
  if (m?.[2] === 'TABLE DATA') return null;
  const state = /^pg_restore: error: (?:could not execute query: )?ERROR:  ([0-9A-Z]{5}): /m.exec(raw)?.[1] ?? 'unparsed';
  return { toc_id: m && /^\d{1,10}$/.test(m[1]) && Number(m[1]) <= 2147483647 ? m[1] : 'unparsed', type: m?.[2] ?? 'unparsed', schema: m?.[3] === '-' ? '-' : safe(m?.[3]),
    name: safe(unquote(m?.[4])), owner: safe(unquote(m?.[5])), sqlstate: state,
    exit: Number.isInteger(result.status) ? result.status : -1,
    signal: /^SIG[A-Z0-9]{1,12}$/.test(result.signal ?? '') ? result.signal : 'none' };
}
export const formatRestoreDiagnostic = d => `STOP laptop_restore_test:restore toc_id=${d.toc_id} type=${d.type} schema=${d.schema} name=${d.name} owner=${d.owner} sqlstate=${d.sqlstate} exit=${d.exit} signal=${d.signal}`;

// pg_restore's schema-only output for EVENT TRIGGER entries is metadata, never executed here.
// Reject unsupported grammar rather than guessing. Names are bounded ASCII identifiers.
export function archiveEventMetadata(sql, events) {
  if (Buffer.byteLength(sql) > 4 * 1024 * 1024 || events.length > 4096) fail();
  const result = [];
  const create = new RegExp(`^CREATE EVENT TRIGGER (${token}) ON (ddl_command_start|ddl_command_end|sql_drop|table_rewrite)\\s*(?:WHEN TAG IN \\(([^;]*)\\)\\s*)?EXECUTE (?:FUNCTION|PROCEDURE) (${token})\\.(${token})\\(\\);`, 'gm');
  for (const m of sql.matchAll(create)) {
    let tags = null;
    if (m[3] !== undefined) {
      const values = m[3].split(/,\s*/).map(s => s.trim());
      if (!values.length || values.length > 256 || values.some(s => !/^'[A-Z][A-Z0-9_ ]{0,62}'$/.test(s))) fail();
      tags = values.map(s => s.slice(1, -1)).sort();
    }
    const name = unquote(m[1]), entry = events.find(e => e.name === name);
    if (!entry) fail();
    const pattern = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const alters = [...sql.matchAll(new RegExp(`^ALTER EVENT TRIGGER (?:"${pattern}"|${pattern}) (ENABLE(?: REPLICA| ALWAYS)?|DISABLE);$`, 'gm'))];
    if (alters.length > 1) fail();
    const enabled = { ENABLE: 'O', 'ENABLE REPLICA': 'R', 'ENABLE ALWAYS': 'A', DISABLE: 'D' }[alters[0]?.[1] ?? 'ENABLE'];
    result.push({ name, owner: entry.owner, function: `${unquote(m[4])}.${unquote(m[5])}`, event: m[2], enabled, tags });
  }
  if (result.length !== events.length || new Set(result.map(e => e.name)).size !== result.length) fail();
  return result;
}
export const EVENT_QUERY = `select coalesce(json_agg(x order by name),'[]') from (
  select e.evtname as name, r.rolname as owner, n.nspname || '.' || p.proname as function,
    e.evtevent as event, e.evtenabled as enabled,
    (select array_agg(t order by t) from unnest(e.evttags) t) as tags
  from pg_event_trigger e join pg_roles r on r.oid=e.evtowner
  join pg_proc p on p.oid=e.evtfoid join pg_namespace n on n.oid=p.pronamespace
) x`;
export function compareEventMetadata(expected, actual) {
  if (!Array.isArray(actual) || actual.length > 4096 || new Set(actual.map(e => e.name)).size !== actual.length) fail();
  const keys = ['owner', 'function', 'event', 'enabled', 'tags'];
  const differences = [];
  for (const name of new Set([...expected, ...actual].map(e => e.name))) {
    const a = expected.find(e => e.name === name), b = actual.find(e => e.name === name);
    const value = (row, key) => key === 'tags' && Array.isArray(row[key]) ? [...row[key]].sort() : row[key];
    const changed = !a || !b ? ['presence'] : keys.filter(k => JSON.stringify(value(a, k)) !== JSON.stringify(value(b, k)));
    if (changed.length) differences.push({ name: safe(name), keys: changed.join(',') });
  }
  return differences;
}
export const formatEventMismatch = d => `STOP laptop_restore_test:restore kind=event_trigger_mismatch name=${d.name} keys=${d.keys}`;
