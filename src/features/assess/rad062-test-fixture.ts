/** Synthetic engineering fixtures only; never a provider connection or clinical content. */
import { readFileSync } from 'node:fs';
import { openRad085Database, fixtureId } from './rad085-local-db';
import type { AuthoringDraftV2 } from './contracts-v2';
export const id = fixtureId;
export const migration = (part: number) => readFileSync(`supabase/migrations/20261030000${part}00_rad062_${['', 'full_name', 'provenance_v2', 'authoring_limits', 'random_pool'][part]}.sql`, 'utf8');
export const syntheticDraft = (n = 10): AuthoringDraftV2 => ({ schemaVersion: 2, id: id(n), revision: 0, track: 'mixed', name: 'SYNTHETIC engineering', policy: { durationSeconds: null, maxAttempts: 2, gradeVisibility: 'hidden' }, items: [
 { id: 'q', type: 'single-choice', prompt: 'SYNTHETIC question', maximum: '1', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a', provenance: { kind: 'uploader-authored', reviewStatus: 'no-medical-review', sources: [{ reference: 'Own synthetic fixture', licenceEvidence: 'Own engineering test only' }], licenceNotes: 'No medical assertion' } },
] });
export async function rad062Fixture(parts = 3) {
 const db = await openRad085Database();
 try {
  await db.admin.query(readFileSync('supabase/migrations/20261028000100_p1_short_codes_names.sql', 'utf8'));
  for (const n of [1, 2, 3]) await db.admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n), `synthetic${n}@example.invalid`, { display_name: 'SYNTHETIC Account Name' }]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  const group = (await db.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC group', new Date(Date.now() + 3600000).toISOString()])).id;
  for (let n = 1; n <= parts; n++) await db.admin.query(migration(n));
  async function call<T = unknown>(name: string, args: unknown[] = [], user = 2): Promise<T> {
   if (!/^[a-z][a-z0-9_]*$/.test(name)) throw Error('invalid fixture call');
   const c = await db.connect();
   try {
    await c.query('begin'); await c.query("select set_config('request.jwt.claim.sub',$1,true)", [id(user)]);
    const v = (await c.query<{ v: T }>(`select assess.${name}(${args.map((_, n) => '$' + (n + 1)).join(',')}) v`, args)).rows[0]!.v;
    await c.query('commit'); return v;
   } catch (e) { await c.query('rollback'); throw e; } finally { await c.end(); }
  }
  const save = (d: AuthoringDraftV2, g = group) => call<{ document: AuthoringDraftV2; capacity: { authorWarning: boolean } }>('draft_save_v2', [g, d.id, d.revision, d, '[]']);
  return { ...db, group, call, save };
 } catch (e) { await db.close(); throw e; }
}
