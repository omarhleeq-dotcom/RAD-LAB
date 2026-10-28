// Clean local PostgreSQL catalogues only. No provider, URL, credential or live-DB input.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openLocalDatabase } from './local-database.mjs';
export const B_MIGRATION = '20261028000100_p1_short_codes_names.sql';
export const SIGNATURES = [
 'assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)',
 'assess.join_request_v1(text)',
 'assess.scope_page_v1(text,uuid,uuid,integer)',
];
export const sha256 = value => createHash('sha256').update(value.replaceAll('\r', '')).digest('hex');
const MAX = 15000; // Strictly less, including DO/base64 transport overhead.
export function lineBoundedParts(sql, max = MAX) {
 if (!Number.isInteger(max) || max < 2 || max > MAX) throw Error('invalid_part_limit');
 const parts = []; let part = '';
 for (const line of sql.split(/(?<=\n)/)) {
  if (line.length >= max) throw Error('oversized_line_requires_reviewed_alternative');
  if (part.length + line.length >= max) { parts.push(part); part = ''; }
  part += line;
 }
 if (part) parts.push(part);
 return parts;
}
export function functionStep({ signature, definition, fromDigest, toDigest }) {
 if (!/^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*\([a-z0-9_, ]*\)$/.test(signature)
  || !/^CREATE OR REPLACE FUNCTION /i.test(definition)
  || ![fromDigest,toDigest].every(h => /^[a-f0-9]{64}$/.test(h)) || sha256(definition) !== toDigest)
  throw Error('invalid_reviewed_function');
 const encoded = Buffer.from(definition, 'utf8').toString('base64');
 const sql = `DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('${signature}') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('${signature}'); IF old.digest NOT IN ('${fromDigest}','${toDigest}') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('${encoded}','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('${signature}'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM '${toDigest}' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;`;
 if (/[\r\n]/.test(sql) || sql.length >= MAX) throw Error('oversized_function_requires_reviewed_alternative');
 return sql;
}
export async function cleanCatalogues() {
 const db = await openLocalDatabase('postgres', { through: 'pre-rad085' });
 const read = p => readFileSync(p, 'utf8');
 const capture = async () => {
  const result = [];
  for (const signature of SIGNATURES) {
   const [r] = await db.query('select pg_get_functiondef(to_regprocedure($1)) definition', [signature]);
   if (!r?.definition) throw Error('clean_catalogue_missing');
   result.push({signature,definition:r.definition,digest:sha256(r.definition)});
  }
  return result;
 };
 try {
  for (const name of ['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql','20261027000100_assess_management_erasure.sql']) await db.exec(read('supabase/migrations/'+name));
  await db.exec(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  const before = await capture();
  await db.exec(read('supabase/migrations/'+B_MIGRATION));
  const after = await capture();
  return {before,after};
 } finally { await db.close(); }
}
const transactionStart = `begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table assess.launch_gate in share mode;
select singleton from assess.scope_lock for update;
`;
export function transport(catalogues, rollback = false) {
 const {before,after} = catalogues;
 return [transactionStart, ...SIGNATURES.map((signature,i) => {
  if (before[i]?.signature !== signature || after[i]?.signature !== signature) throw Error('catalogue_order');
  return functionStep({signature,definition:(rollback?before:after)[i].definition,fromDigest:(rollback?after:before)[i].digest,toDigest:(rollback?before:after)[i].digest});
 }), 'commit;'];
}
export function progressSql({before,after}) {
 return `begin read only;
set local statement_timeout='5s';
select (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed;
select sig, digest=old_digest m1_m4_exact, digest=new_digest b_exact from (values
${SIGNATURES.map((sig,i)=>`('${sig}','${before[i].digest}','${after[i].digest}')`).join(',\n')}
) expected(sig,old_digest,new_digest) cross join lateral (
 select encode(sha256(convert_to(replace(pg_get_functiondef(to_regprocedure(sig)),chr(13),''),'UTF8')),'hex') digest
) actual;
rollback;
`;
}
export const precheckSql = `begin read only;
set local statement_timeout='5s';
select version() postgres_version,
 (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed,
 not exists(select 1 from assess.sessions where state in ('active','grading','grading-failed')) no_active_sessions,
 to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)') is not null m1_present,
 to_regprocedure('assess.account_management_v1(text,uuid,text,uuid,integer)') is not null m4_present,
 (select required_version='supervisor-sharing-2026-10-27-v2' and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb' from assess.sharing_policy where singleton) initializer_matches;
rollback;
`;
// Read-only, explicit columns, private owner backup. No Auth/email, answers or raw codes.
// Counts over the ceiling stop data export rather than silently truncating it.
export const countsSql = `begin read only;
set local statement_timeout='5s';
select format('%I.%I',n.nspname,c.relname) table_name,
 (xpath('/row/c/text()',query_to_xml(format('select count(*) c from %I.%I',n.nspname,c.relname),false,true,'')))[1]::text::bigint row_count
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r' and (n.nspname in ('public','assess') or (n.nspname='auth' and c.relname='users')) order by 1;
rollback;
`;
export const backupSql = `begin read only;
set local statement_timeout='5s';
with rows(table_name,row_data) as (
 select 'assess.groups',to_jsonb(g) from assess.groups g
 union all select 'assess.group_join_codes',to_jsonb(c) from assess.group_join_codes c
 union all select 'assess.group_join_requests',to_jsonb(r) from assess.group_join_requests r
 union all select 'assess.join_request_throttles',to_jsonb(t) from assess.join_request_throttles t
 union all select 'public.profiles',jsonb_build_object('user_id',p.user_id,'display_name',p.display_name) from public.profiles p
), counts as (select table_name,count(*) n from rows group by table_name), bounded as (select coalesce(sum(n),0)<=5000 ok from counts)
select (select ok from bounded) export_complete_under_5000,
 (select coalesce(jsonb_object_agg(table_name,n),'{}') from counts) counts,
 case when (select ok from bounded) then (select coalesce(jsonb_agg(jsonb_build_object('table',table_name,'row',row_data) order by table_name,row_data::text),'[]') from rows) end affected_rows;
select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,pg_get_userbyid(p.proowner) owner,p.proacl::text acl,p.proconfig
from pg_proc p where p.oid in (
 'assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)'::regprocedure,
 'assess.join_request_v1(text)'::regprocedure,
 'assess.scope_page_v1(text,uuid,uuid,integer)'::regprocedure) order by 1;
rollback;
`;
export const smokeSql = `begin read only;
set local statement_timeout='5s';
select (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed,
 not has_table_privilege('authenticated','assess.group_join_codes','SELECT') codes_private,
 not has_function_privilege('anon','assess.join_request_v1(text)','EXECUTE') anon_denied,
 has_function_privilege('authenticated','assess.join_request_v1(text)','EXECUTE') signed_in_rpc_only,
 not exists(select 1 from assess.group_join_codes where digest !~ '^[a-f0-9]{64}$') digests_only,
 (select count(*) from assess.group_join_codes where revoked_at is null and expires_at>now()) codes_to_rotate_in_phone_test;
rollback;
`;
function block(sql) { return '```sql\n'+sql+'\n```\n'; }
export function renderPacket(catalogues) {
 const read = p => readFileSync(p,'utf8');
 const section = (title,sql) => `\n## ${title}\n\n`+lineBoundedParts(sql).map((p,i)=>`الجزء ${i+1} — ${p.length} حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.\n\n`+block(p)).join('\n');
 const procedure = (title,rollback) => `\n## ${title}\n\nاجمع الخطوات الخمس بالترتيب في استعلام واحد. لا تنفّذ جزءًا منفردًا ولا commit مبكرًا. الدوال أسطر base64 واحدة؛ لا تضف سطرًا داخلها.\n\n`+transport(catalogues,rollback).map((s,i)=>`الخطوة ${i+1} — ${s.length} حرفًا.\n\n`+block(s)).join('\n');
 return `# RAD-085 — mini DB day B للهاتف (مولّد محليًا)\n\nالمصدر: scripts/assess/phone-sql-packet.mjs. لا تشغيل حي من الوكيل. اقرأ [دليل التنفيذ](RAD-085_P1_B_DB_DAY.md) أولًا. جميع الأجزاء أقل من15000 حرف بعد غلاف النقل. readiness يحتفظ بالدقة modulo CR فقط. النسخ الاحتياطية الخاصة تبقى عند المالك ولا تدخل Git.\n`
 +section('1 الفحص المسبق — قراءة فقط',precheckSql)
 +section('2 الجاهزية قبل B — يجب 13/13',read('supabase/checks/rad085-d3-ready.sql'))
 +section('3a أعداد الجداول — احفظ للمقارنة بعد التطبيق والتراجع',countsSql)
 +section('3b النسخة الخفيفة — احفظ الناتج الخاص؛ export_complete_under_5000 يجب true',backupSql)
 +section('4 التقدم — قراءة فقط',progressSql(catalogues))
 +procedure('5 تطبيق B — معاملة واحدة',false)
 +section('6 الجاهزية بعد B — يجب 13/13',read('supabase/checks/rad085-p1-b-ready.sql'))
 +section('7 دخان الكتالوج — قراءة فقط',smokeSql)
 +procedure('8 التراجع إلى تعريفات M1–M4 — معاملة واحدة',true)
 +section('9 الجاهزية بعد التراجع — يجب 13/13',read('supabase/checks/rad085-d3-ready.sql'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const command = process.argv[2];
 if (!['--write','--check'].includes(command) || process.argv.length !== 3) throw Error('usage: node scripts/assess/phone-sql-packet.mjs --write|--check');
 const output = 'docs/RAD-085_P1_B_PHONE_PACKET.md';
 const packet = renderPacket(await cleanCatalogues());
 if (command === '--write') writeFileSync(output,packet);
 else if (readFileSync(output,'utf8') !== packet) throw Error('phone_packet_drift');
 console.log(command === '--write' ? 'Clean-local phone packet generated; not applied live.' : 'Phone packet matches clean-local catalogues.');
}
