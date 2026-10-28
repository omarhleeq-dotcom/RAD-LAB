import { expect, it, vi } from 'vitest';
import { createSqlReview } from '../supervisor-review/sql-adapter';
import { fixtureId as id, openRad085Database } from '../assess/rad085-local-db';
const self = { id: id(1), name: 'Synthetic owner', role: 'owner' as const };
const signal = () => new AbortController().signal;
it('looks up an exact appointment beyond page one with a single bounded existing RPC; revoked and absent stay false', async () => {
 const db = await openRad085Database();
 try {
  for (let n = 1; n <= 28; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic lookup\"}')", [id(n), `synthetic${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  for (let n = 2; n <= 27; n++) await db.rpc(1, 'appointment_v1', [id(n), true]);
  const rpc = vi.fn(async (name, args) => db.rpc(1, name, args));
  const adapter = createSqlReview(self, { rpc });
  expect(await adapter.readAppointment!(id(26), signal())).toBe(true);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('scope_page_v1', ['appointments', null, '00000000-0000-0000-0000-000000000025', 1], expect.any(AbortSignal));
  await db.rpc(1, 'appointment_v1', [id(26), false]);
  expect(await adapter.readAppointment!(id(26), signal())).toBe(false);
  expect(await adapter.readAppointment!(id(28), signal())).toBe(false);
  expect(await adapter.readAppointment!(id(0), signal())).toBe(false); // successor must not be mistaken for target.
  expect(await adapter.readAppointment!('ffffffff-ffff-ffff-ffff-ffffffffffff', signal())).toBe(false);
  expect(rpc.mock.calls.every(c => c[1][3] === 1)).toBe(true);
 } finally { await db.close(); }
}, 30000);
it('handles hexadecimal UUID predecessor and fails closed on refusal, malformed replies, nonowners and abort', async () => {
 const rpc = vi.fn(async () => ({ version: 1, rows: [], next: null }));
 const adapter = createSqlReview(self, { rpc });
 await adapter.readAppointment!('00000000-0000-0000-0001-000000000000', signal());
 expect(rpc).toHaveBeenLastCalledWith('scope_page_v1', ['appointments', null, '00000000-0000-0000-0000-ffffffffffff', 1], expect.any(AbortSignal));
 rpc.mockRejectedValueOnce({ code: '42501' }); await expect(adapter.readAppointment!(id(2), signal())).rejects.toMatchObject({ reason: 'denied' });
 rpc.mockResolvedValueOnce({ version: 1, rows: [{ id: id(1), revoked_at: null }], next: null } as never);
 await expect(adapter.readAppointment!(id(2), signal())).rejects.toMatchObject({ reason: 'offline' });
 const nonowner = createSqlReview({ ...self, role: 'student' }, { rpc });
 await expect(nonowner.readAppointment!(id(2), signal())).rejects.toMatchObject({ reason: 'denied' });
 const controller = new AbortController(); controller.abort(); const before = rpc.mock.calls.length;
 await expect(adapter.readAppointment!(id(2), controller.signal)).rejects.toThrow(); expect(rpc.mock.calls).toHaveLength(before);
});
