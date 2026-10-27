import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { sharingPolicy, knownSharingPolicy } from './sharing-policy';
import { createSqlReview } from './sql-adapter';
import { fixtureId as id, openRad085Database } from '../assess/rad085-local-db';

it('pins both displayed languages to one versioned UTF-8 digest, independent of global consent', () => {
 const { version, ar, en, digest } = sharingPolicy;
 expect(createHash('sha256').update(JSON.stringify({ version, ar, en }), 'utf8').digest('hex')).toBe(digest);
 expect(knownSharingPolicy(version, digest)).toBe(true);
 expect(knownSharingPolicy(version, '0'.repeat(64))).toBe(false);
 expect(knownSharingPolicy('unknown', digest)).toBe(false);
 expect(knownSharingPolicy("supervisor-sharing-2026-10-26-v1", digest)).toBe(false);
 expect(knownSharingPolicy(version, "c1ad94d66041af575cd7c53635bf97b6938618fcca397f75b92d5401cb0cf510")).toBe(false);
});
it('real PostgreSQL self consent: refusal, acceptance, withdrawal, reacceptance, changed policy, lost ACK and lost authority', async () => {
 const db = await openRad085Database();
 const signal = () => new AbortController().signal;
 let loseAck = false, calls = 0;
 try {
  for (let n = 1; n <= 4; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"consent_version\":\"2026-10-24\"}')", [id(n), `sharing${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  const self = { id: id(4), name: 'SYNTHETIC', role: 'student' as const };
  const a = createSqlReview(self, { async rpc(name, args) { calls++; const result = await db.rpc(4, name, args); if (loseAck) throw Error('ACK lost'); return result; } });
  const read = () => a.read({ actorId: id(4) }, signal());
  const consent = (accept: boolean, version: string = sharingPolicy.version, digest: string = sharingPolicy.digest) => a.execute(id(4), { kind: 'sharing', version, digest, accept }, signal());
  expect((await read()).sharing).toBe(false);
  await expect(consent(true)).rejects.toMatchObject({ reason: 'expired' });
  // Owner-approved file is exercised only inside this disposable synthetic fixture.
  const proposed = readFileSync('docs/archive/RAD-085_SHARING_SQL_PROPOSAL_2026-10-26.patch', 'utf8').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)).join('\n');
  const sql = readFileSync('supabase/manual/rad085-sharing-policy-local.sql', 'utf8');
  expect(sql).toBe(proposed + '\n');
  await db.admin.query(sql); await db.admin.query(sql);
  expect((await db.admin.query('select * from assess.sharing_consents')).rowCount).toBe(0);
  expect((await read()).sharingPolicy?.known).toBe(true);
  expect((await db.admin.query('select * from assess.sharing_consents')).rowCount).toBe(0); // Declining means no mutation.
  await expect(consent(true, 'unknown')).rejects.toMatchObject({ reason: 'denied' });
  await expect(consent(true, "supervisor-sharing-2026-10-26-v1", "c1ad94d66041af575cd7c53635bf97b6938618fcca397f75b92d5401cb0cf510")).rejects.toMatchObject({ reason: 'denied' });
  await expect(consent(true, sharingPolicy.version, "c1ad94d66041af575cd7c53635bf97b6938618fcca397f75b92d5401cb0cf510")).rejects.toMatchObject({ reason: 'denied' });
  await expect(consent(true, sharingPolicy.version, '0'.repeat(64))).rejects.toMatchObject({ reason: 'denied' });
  await consent(true); expect((await read()).sharing).toBe(true);
  const first = (await db.admin.query('select accepted_at from assess.sharing_consents')).rows[0].accepted_at;
  await db.admin.query(sql);
  expect((await db.admin.query('select accepted_at from assess.sharing_consents')).rows).toEqual([{ accepted_at: first }]);
  await consent(true); expect((await db.admin.query('select accepted_at from assess.sharing_consents')).rows[0].accepted_at).toEqual(first);
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  const group = await db.rpc<{id:string;code:string}>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC', new Date(Date.now()+3600000).toISOString()]);
  const request = await db.rpc<{id:string;revision:number}>(4, 'join_request_v1', [group.code]);
  await db.rpc(2, 'join_decide_v1', [request.id, request.revision, 'approve']);
  const record = (n:number) => db.transaction(4, c => c.query(`insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'SYNTHETIC','SYNTHETIC','1','{}','{"total":37}','en')`,[id(n),id(4)]));
  const visible = () => db.rpc<{total:number}>(2, 'scope_page_v1', ['practice',group.id,null,20]);
  await record(100); expect((await visible()).total).toBe(1);
  await consent(false); expect((await read()).sharing).toBe(false); expect((await visible()).total).toBe(0);
  await consent(false); await consent(true); expect((await visible()).total).toBe(0);
  await record(101); expect((await visible()).total).toBe(1);
  await db.admin.query("update assess.sharing_policy set required_version='unknown-v2'");
  expect((await read()).sharing).toBe(false); expect((await read()).sharingPolicy?.known).toBe(false);
  await expect(db.admin.query(sql)).rejects.toMatchObject({ code: '55000' });
  await db.admin.query('rollback');
  expect((await db.admin.query('select required_version from assess.sharing_policy')).rows[0].required_version).toBe('unknown-v2');
  await expect(consent(true)).rejects.toMatchObject({reason:'expired'});
  await consent(false, 'unknown-v2');
  await db.admin.query('update assess.sharing_policy set required_version=$1', [sharingPolicy.version]);
  loseAck = true; const before = calls;
  await expect(consent(true)).rejects.toMatchObject({reason:'offline'}); expect(calls-before).toBe(1);
  loseAck = false; expect((await read()).sharing).toBe(true);
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1", [id(4)]);
  await expect(consent(false)).rejects.toMatchObject({reason:'denied'});
  await expect(read()).rejects.toMatchObject({reason:'denied'});
  await db.admin.query('delete from auth.users where id=$1', [id(4)]);
  expect((await db.admin.query('select * from assess.sharing_consents')).rowCount).toBe(0);
  await expect(consent(true)).rejects.toMatchObject({reason:'denied'});
 } finally { await db.close(); }
},30000);

it('approved initializer matches the exact proposal bytes and rolls back an update failure without creating consent', async () => {
 const sql = readFileSync('supabase/manual/rad085-sharing-policy-local.sql');
 const proposal = readFileSync('docs/archive/RAD-085_SHARING_SQL_PROPOSAL_2026-10-26.patch', 'utf8').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)).join('\n') + '\n';
 expect(sql.equals(Buffer.from(proposal, 'utf8'))).toBe(true);
 // RAD085-SQL-SHARING-POLICY-LOCAL-V2-20261027: hash computed from regenerated local SQL.
 expect(createHash('sha256').update(sql).digest('hex')).toBe('3085c1fb07c84b589fcdc9ef802b0fcedda8d750b755e992aa87573e4d4734d2');
 expect(sql.toString('utf8').split('\n')).toHaveLength(19); // 18 LF-terminated lines.
 const db = await openRad085Database();
 try {
  await db.admin.query(`create function assess.synthetic_policy_failure() returns trigger language plpgsql as $$begin raise exception 'SYNTHETIC rollback witness' using errcode='P0001'; end$$;
   create trigger synthetic_policy_failure after update on assess.sharing_policy for each row execute function assess.synthetic_policy_failure()`);
  await expect(db.admin.query(sql.toString('utf8'))).rejects.toMatchObject({ code: 'P0001' });
  await db.admin.query('rollback');
  expect((await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows).toEqual([{ required_version: null, text_digest: null }]);
  expect((await db.admin.query('select * from assess.sharing_consents')).rowCount).toBe(0);
  await db.admin.query('drop trigger synthetic_policy_failure on assess.sharing_policy; drop function assess.synthetic_policy_failure()');
  await db.admin.query(sql.toString('utf8'));
  expect((await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows).toEqual([{ required_version: sharingPolicy.version, text_digest: sharingPolicy.digest }]);
  await db.admin.query('update assess.sharing_policy set text_digest=$1', ['0'.repeat(64)]);
  await expect(db.admin.query(sql.toString('utf8'))).rejects.toMatchObject({ code: '55000' });
  await db.admin.query('rollback');
  expect((await db.admin.query('select text_digest from assess.sharing_policy')).rows[0].text_digest).toBe('0'.repeat(64));
  expect((await db.admin.query('select * from assess.sharing_consents')).rowCount).toBe(0);
 } finally { await db.close(); }
},30000);
