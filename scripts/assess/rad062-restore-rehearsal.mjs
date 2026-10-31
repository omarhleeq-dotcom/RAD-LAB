// Synthetic current-schema -> actual logical archive -> fresh local database.
// Docker supplies pinned dump/restore tools, network=none; only a private Unix socket.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { localeArgs } from '../ops/laptop-backup-lib.mjs';
import { openLocalDatabase } from './local-database.mjs';
import { apply, checks, manifest, readOnly, verifyMigrations } from './rad062-db-day.mjs';
const image = 'postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382';
function docker(args, input) {
  const env = { ...process.env };
  for (const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[key];
  return execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args], { env, input, stdio: ['pipe','pipe','pipe'], timeout: 120000, maxBuffer: 32 * 1024 * 1024 });
}
const read = file => readFileSync(file, 'utf8');
async function snapshot(db) {
  // Never print bodies, identifiers or data; compare only in memory.
  return (await db.query(`select (select jsonb_agg(to_jsonb(p) order by oid) from pg_proc p where pronamespace in ('assess'::regnamespace,'public'::regnamespace)) functions,
    (select jsonb_agg(to_jsonb(c) order by oid) from pg_class c where relnamespace in ('assess'::regnamespace,'public'::regnamespace)) relations,
    (select jsonb_agg(to_jsonb(s) order by version) from supabase_migrations.schema_migrations s) ledger,
    (select jsonb_agg(to_jsonb(w) order by counter) from rad062_witness w) data`)).rows;
}
export async function rehearse() {
  const source = await openLocalDatabase('postgres');
  let target, original;
  try {
    await source.exec(`create role assess_job_a nologin; create role assess_job_b nologin;
      alter table auth.users add column banned_until timestamptz;
      create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id uuid);
      create schema supabase_migrations;
      create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[]);
      create table public.rad062_witness(counter integer primary key,payload text);
      insert into public.rad062_witness values(1,'SYNTHETIC_PRIVATE_CANARY');`);
    const aclSQL = `select relname,relacl::text raw_acl,
      (select jsonb_agg(jsonb_build_array(grantor,grantee,privilege_type,is_grantable) order by grantor,grantee,privilege_type,is_grantable)
       from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))) effective_acl
      from pg_class c where relnamespace='assess'::regnamespace and relkind in ('r','p') order by relname`;
    const sourceACL = await source.query(aclSQL);
    // Existing SQL check requires initialization evidence. Rehearsal explicitly
    // uses its documented pre-initializer phase, never fabricates a live initializer.
    const cfg = (await source.query("select current_setting('unix_socket_directories') host,current_setting('port') port,current_setting('server_version_num') version")).at(0);
    original = new Client({ host: cfg.host, port: Number(cfg.port), user: 'postgres', database: 'postgres', password: '', ssl: false });
    await original.connect();
    await original.query("set rad085.sharing_phase='pre-initializer'");
    const bCheck = 'supabase/checks/rad085-p1-b-ready.sql';
    const diagnostic = 'scripts/assess/sql/rad062-b-diagnostic.sql';
    await checks(original, [bCheck, diagnostic]);
    const common = ['run','--rm','-i','--network=none','--user',`${process.getuid()}:${process.getgid()}`,
      '--mount',`type=bind,src=${cfg.host},dst=${cfg.host}`,'--entrypoint'];
    const archive = docker([...common,'pg_dump',image,'-h',cfg.host,'-p',cfg.port,'-U','postgres','-d','postgres','-Fc']);
    const locale = (await source.query("select datlocprovider, datlocale, datcollate, datctype from pg_database where datname=current_database()"))[0];
    docker([...common,'createdb',image,'-h',cfg.host,'-p',cfg.port,'-U','postgres','-T','template0',...localeArgs(locale),'rad062_restored']);
    docker([...common,'pg_restore',image,'--exit-on-error','-h',cfg.host,'-p',cfg.port,'-U','postgres','-d','rad062_restored'], archive);
    target = new Client({ host: cfg.host, port: Number(cfg.port), user: 'postgres', database: 'rad062_restored', password: '', ssl: false, query_timeout: 120000 });
    await target.connect();
    const restoredLocale = (await target.query("select datlocprovider, datlocale, datcollate, datctype from pg_database where datname=current_database()")).rows[0];
    assert.deepEqual(restoredLocale, locale, 'STOP collation');
    const restoredACL = (await target.query(aclSQL)).rows;
    assert.equal(sourceACL.length, restoredACL.length);
    const aclRepresentationDifferences = sourceACL.filter((r,n) => r.raw_acl !== restoredACL[n].raw_acl).length;
    const aclEffectiveDifferences = sourceACL.filter((r,n) => JSON.stringify(r.effective_acl) !== JSON.stringify(restoredACL[n].effective_acl)).length;
    await target.query("set rad085.sharing_phase='pre-initializer'");
    // Frozen B still fails representation-only restore; its normalized diagnostic
    // must pass before additions. Neither check is a post-M08 acceptance waiver.
    await checks(target, [diagnostic]);
    await target.query('begin');
    await target.query('grant select on assess.sessions to anon');
    await assert.rejects(checks(target, [diagnostic]));
    await target.query('rollback');
    let baselineFailures = 0;
    const baselineFailedFiles = [];
    for (const file of manifest().checks) {
      try { await checks(target, [file]); } catch { baselineFailures++; baselineFailedFiles.push(file); }
    }
    assert.deepEqual(baselineFailedFiles, [bCheck]);
    const baselineB = await target.query(read(bCheck));
    assert.deepEqual(baselineB.flatMap(r => r.rows ?? []).filter(r => r.ready !== true).map(r => r.kind), ['relations']);
    const baseline = await snapshot(target);
    let rollbacks = 0;
    for (const [index, file] of verifyMigrations().entries()) {
      const before = await snapshot(target), sql = read('supabase/migrations/' + file);
      // Real failure after all DDL but before COMMIT; exact catalogue/data/ledger proof.
      await assert.rejects(target.query(sql.replace(/commit;\s*$/i, "select 1/0; commit;")));
      await target.query('rollback');
      assert.deepEqual(await snapshot(target), before); rollbacks++;
      await apply(target, `M0${index + 1}`, { RAD062_SECRET_STATE: 'DISABLED' });
    }
    assert.deepEqual((await snapshot(target))[0].data, baseline[0].data);
    const readiness = await target.query(read('supabase/checks/rad062-ready.sql'));
    const readinessFailures = readiness.rows.filter(r => r.ok !== true).length;
    assert.equal(aclEffectiveDifferences, 0);
    assert.equal(readinessFailures, 0);
    // Restored effective-equal ACLs pass; real relation/function/column grants,
    // and grantability differences, must all fail. Roll back each independently.
    let tamperedGrantFailures = 0;
    for (const drift of [
      'grant select on assess.sessions to anon',
      'grant execute on function assess.freeze_v2() to authenticated',
      'grant select(answers) on assess.session_details to authenticated',
      'grant execute on function assess.start_v2(uuid,uuid) to authenticated with grant option',
    ]) {
      await target.query('begin');
      await target.query(drift);
      const changed = await target.query(read('supabase/checks/rad062-ready.sql'));
      assert.ok(changed.rows.some(r => r.ok === false)); tamperedGrantFailures++;
      await target.query('rollback');
    }
    await checks(target, ['supabase/checks/rad062-ready.sql']);
    const bDiagnostic = await target.query(read(diagnostic));
    const diagnosticFailures = bDiagnostic.flatMap(r => r.rows ?? []).filter(r => r.ready !== true).map(r => r.kind).sort();
    assert.deepEqual(diagnosticFailures, ['columns','constraints','effective_privileges','functions','indexes','relations','triggers']);
    const counts = (await readOnly(target, read('scripts/assess/sql/rad062-precounts.sql'))).rows[0];
    assert.ok(Object.values(counts).every(n => /^\d+$/.test(String(n))));
    // M06/M08 themselves raise on every missing anchor. Readiness additionally
    // fingerprints all patched bodies/ACLs. Explicitly witness the ten v1 guards.
    const guards = (await target.query(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess' and (
      (p.proname in ('read_session_v1','command_v1','result_v1','finish_v1','fail_v1','recover_v1') and position('require_lifecycle_v2(p_session,1)' in p.prosrc)>0)
      or (p.proname in ('claim_v1','maintain_v1','health_v1') and position('lifecycle_version=1' in p.prosrc)>0)
      or (p.proname='start_v1' and position('assignment version denied' in p.prosrc)>0))`)).rows[0].n;
    assert.equal(guards, 10);
    const patches = (await target.query(`select count(*)::int n from pg_proc where
      (proname in ('owner_account_deletion_v1','account_management_v1','transfer_management_d3_v1','erase_account_d3_v1') and position('rad062-capacity' in prosrc)>0)
      or (proname in ('d3_needs_transfer_v1','d3_shared_group_v1') and position('authoring_holds_v1' in prosrc)>0)
      or (proname='d3_inventory_v1' and position('v2-revision' in prosrc)>0)
      or (proname='authoring_write_guard_v1' and position('d3_erasing_v1(old.writer_id)' in prosrc)>0)`)).rows[0].n;
    assert.equal(patches, 8);
    const installedB = await target.query(read(bCheck));
    assert.deepEqual(installedB.flatMap(r => r.rows ?? []).filter(r => r.ready !== true).map(r => r.kind).sort(), diagnosticFailures);
    let requiredFailures = 0;
    const requiredFailedFiles = [];
    for (const file of manifest().checks) {
      try { await checks(target, [file]); } catch { requiredFailures++; requiredFailedFiles.push(file); }
    }
    assert.deepEqual(requiredFailedFiles, [bCheck]);
    return { original_b_ready: 1, restored_b_diagnostic_ready: 1, tampered_b_diagnostic_failed: 1, post_package_b_diagnostic_failures: diagnosticFailures.length, tampered_grant_failures: tamperedGrantFailures, restored_acl_representation_differences: aclRepresentationDifferences, restored_acl_effective_differences: aclEffectiveDifferences, server_version_num: Number(cfg.version), restored_archives: 1, migrations_committed: 8, rollback_witnesses: rollbacks,
      v1_anchors_found: guards + patches, readiness_passed: Number(readinessFailures === 0), readiness_failures: readinessFailures, baseline_check_failures: baselineFailures, required_check_failures: requiredFailures, ...counts };
  } finally { if (target) await target.end(); if (original) await original.end(); await source.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) { console.error('STOP synthetic_only'); process.exitCode = 1; }
  else rehearse().then(r => { console.log(JSON.stringify(r)); if (r.readiness_failures || r.baseline_check_failures !== 1 || r.required_check_failures !== 1) { console.error('STOP required_checks'); process.exitCode = 1; } })
    .catch(() => { console.error('STOP restore_rehearsal'); process.exitCode = 1; });
}
