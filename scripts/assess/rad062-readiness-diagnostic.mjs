// Owners D2/D3: synthetic-only catalogue evidence; never waives a failed check.
// Reuses both existing helper paths and their exact fixture; never accepts a connection selector.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { openLocalDatabase } from './local-database.mjs';
import { manifest } from './rad062-db-day.mjs';

const readySQL = readFileSync('supabase/checks/rad062-ready.sql', 'utf8');
// Read the exact checked catalogue shapes in memory, without changing the check file.
const catalogueCTE = readySQL.slice(readySQL.indexOf('with functions as ('), readySQL.indexOf('), fingerprints as (')) + ')';
const catalogueSQL = catalogueCTE + ` select jsonb_build_object(
 'functions',(select jsonb_agg(to_jsonb(f) order by signature collate "C") from functions f),
 'relations',(select jsonb_agg(to_jsonb(r) order by nspname,relname) from relations r)) catalogue`;
const fingerprintSQL = catalogueCTE + ` select md5((select jsonb_agg(to_jsonb(r) order by nspname,relname)::text from relations r)) relations`;
const scope = "(n.nspname='assess' or (n.nspname='public' and c.relname='profiles'))";
const constraintsSQL = `select n.nspname||'.'||c.relname relation,k.conname,k.contype
 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where ${scope} order by n.nspname,c.relname,k.conname`;
const fixtureSQL = `select jsonb_build_object(
 'roles',(select jsonb_agg(to_jsonb(r)-'oid' order by rolname) from pg_roles r where rolname !~ '^pg_'),
 'schemas',(select jsonb_agg(jsonb_build_array(nspname,pg_get_userbyid(nspowner),nspacl::text) order by nspname) from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema'),
 'auth_columns',(select jsonb_agg(jsonb_build_array(c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull) order by c.relname,a.attnum)
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='auth' and a.attnum>0 and not a.attisdropped),
 'extensions',(select jsonb_agg(jsonb_build_array(extname,extversion) order by extname) from pg_extension)) fixture`;

function namesOnly(result) {
  const out = { false: [], null: [] };
  for (const part of Array.isArray(result) ? result : [result]) {
    for (const row of part.rows ?? []) {
      const name = row.check_name ?? row.kind ?? 'single_row';
      for (const [column, value] of Object.entries(row)) {
        if (value === false || value === null) out[value === false ? 'false' : 'null'].push({ row: name, column });
      }
    }
  }
  return out;
}

async function runCase(productionVersion, locale) {
  const db = await openLocalDatabase('postgres', { through: 'latest', productionVersion, locale });
  let client;
  try {
    // Byte-for-byte same fixture statements as the existing locale regression.
    await db.exec(`create role assess_job_a nologin; create role assess_job_b nologin;
        alter table auth.users add column banned_until timestamptz;
        create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id uuid);`);
    const [cfg] = await db.query("select current_setting('unix_socket_directories') host,current_setting('port') port,current_database() database,current_setting('server_version_num')::int version");
    assert.equal(cfg.version, productionVersion ? 170011 : 180004);
    const [order] = await db.query(`select (select jsonb_agg(e order by e->>0,e->>1,e->>2) from jsonb_array_elements(assess.d3_fk_inventory_v1()) e)=assess.d3_fk_inventory_v1() default_order,
      (select jsonb_agg(e order by (e->>0) collate "C",(e->>1) collate "C",(e->>2) collate "C") from jsonb_array_elements(assess.d3_fk_inventory_v1()) e)=assess.d3_fk_inventory_v1() c_order`);
    assert.deepEqual(order, { default_order: locale === 'C' || locale === 'icu-en-US', c_order: true });
    client = new Client({ host: cfg.host, port: Number(cfg.port), database: cfg.database, user: 'postgres', password: '', ssl: false });
    await client.connect();
    await client.query("set rad085.sharing_phase='pre-initializer'");
    const files = [];
    for (const file of manifest().checks) {
      try { files.push({ file, ...namesOnly(await client.query(readFileSync(file, 'utf8'))) }); }
      catch (e) { files.push({ file, sqlstate: e.code ?? 'unavailable' }); }
      finally { await client.query('rollback'); }
    }
    const catalogue = (await client.query(catalogueSQL)).rows[0].catalogue;
    const fingerprints = (await client.query(fingerprintSQL)).rows[0];
    const constraints = (await client.query(constraintsSQL)).rows;
    const fixture = (await client.query(fixtureSQL)).rows[0].fixture;
    return { label: `${productionVersion ? '17.11' : '18.4'}/${locale}`, files, catalogue, fingerprints, constraints, fixture };
  } finally { if (client) await client.end(); await db.close(); }
}

function compare(left, right) {
  const differences = [];
  for (const kind of ['functions', 'relations']) {
    const key = x => kind === 'functions' ? x.signature : `${x.nspname}.${x.relname}`;
    const a = new Map(left.catalogue[kind].map(x => [key(x), x]));
    const b = new Map(right.catalogue[kind].map(x => [key(x), x]));
    for (const name of new Set([...a.keys(), ...b.keys()])) {
      const attributes = [...new Set([...Object.keys(a.get(name) ?? {}), ...Object.keys(b.get(name) ?? {})])]
        .filter(k => JSON.stringify(a.get(name)?.[k]) !== JSON.stringify(b.get(name)?.[k]));
      if (attributes.length) differences.push({ kind, name, attributes });
    }
  }
  if (differences.length) throw Object.assign(new Error('catalogue differs'), {
    differingFields: differences.flatMap(d => d.attributes.map(a => `${d.kind}.${d.name}.${a}`)) });
  // D3: filtered catalogue shapes must match exactly; raw NOT NULL entries still
  // differ by major version, independently of the attnotnull proof in columns.
  const notNull = new Set(right.constraints.filter(c => c.contype === 'n').map(c => `${c.relation}.${c.conname}`));
  const withoutNotNull = right.catalogue.relations.map(r => ({ ...r,
    constraints: r.constraints?.filter(c => !notNull.has(`${r.nspname}.${r.relname}.${c[0]}`)) ?? null }));
  assert.deepEqual(left.catalogue.relations, withoutNotNull, 'unexplained relation catalogue difference');
  assert.deepEqual(left.catalogue.functions, right.catalogue.functions, 'function catalogue difference');
  assert.deepEqual(left.fixture, right.fixture, 'fixture difference');
  assert.ok(left.constraints.every(c => c.contype !== 'n'));
  assert.deepEqual(left.constraints, right.constraints.filter(c => c.contype !== 'n'));
  return { cases: [left.label, right.label], differences,
    evidence: ['same_fixture_roles_schemas_auth_columns_extensions', 'same_function_catalogue',
      'same_relation_catalogue_after_reviewed_not_null_filter', 'same_non_not_null_constraints',
      'pg18_not_null_entries_checked_separately_by_not_null_constraints_plain'],
    pg18_not_null_constraint_names: [...notNull].sort() };
}

export async function diagnose() {
  const cases = [];
  for (const locale of ['C', 'en_US.UTF-8', 'icu-en-US']) cases.push(await runCase(true, locale));
  for (const locale of ['C', 'en_US.UTF-8']) cases.push(await runCase(false, locale));
  // Locale must not change the checked catalogue or fixture in either version.
  for (const [a, b] of [[0, 1], [0, 2], [3, 4]]) {
    assert.deepEqual(cases[a].catalogue, cases[b].catalogue);
    assert.deepEqual(cases[a].fixture, cases[b].fixture);
  }
  const comparisons = [compare(cases[0], cases[3]), compare(cases[1], cases[4])];
  if (cases.some(c => c.fingerprints.relations !== cases[0].fingerprints.relations))
    throw Object.assign(new Error('fingerprint differs'), { differingFields: ['relations'] });
  return { cases: cases.map(({ label, files, fingerprints }) => ({ label, files, fingerprints })), comparisons };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw Error('no selectors accepted');
  diagnose().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(JSON.stringify({ diagnostic_failed: e.code ?? e.name, differing_fields: e.differingFields ?? [] })); process.exitCode = 1; });
}
