/** Private injected port; no environment/URL fallback and no role grant in M02. */
import type { BridgeConnection, BridgeBoundary } from './server-authoring-bridge-postgres';
import type { BridgePortV2, BridgeSnapshotV2 } from './server-authoring-bridge-v2';
const uuid = (s: string) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
export function postgresAuthoringBridgeV2(connect: () => Promise<BridgeConnection>, identity: string, group: string, boundary?: BridgeBoundary): BridgePortV2 {
 if (!uuid(identity) || !uuid(group)) throw Error('invalid_bound_scope');
 return { async transaction(draft, revision, run) {
  if (!uuid(draft) || !Number.isSafeInteger(revision) || revision < 1 || revision > 100) throw Error('invalid_revision');
  const check = async () => { boundary?.signal.throwIfAborted(); await boundary?.check(); boundary?.signal.throwIfAborted(); };
  await check(); const c = await connect(); const abort = () => { void c.end().catch(() => {}); };
  boundary?.signal.addEventListener('abort', abort, { once: true });
  let committing = false;
  try {
   await check(); await c.query('begin'); await c.query('set local role assess_authoring_bridge');
   await c.query("select set_config('request.jwt.claim.sub',$1,true)", [identity]);
   const stored = (await c.query<{ v: BridgeSnapshotV2 }>('select assess.authoring_bridge_read_v2($1,$2,$3) v', [group, draft, revision])).rows[0]!.v;
   await check();
   const result = await run(stored, async publication => { await check(); return (await c.query<{ v: string }>('select assess.content_submit_v2($1,$2,$3,$4) v', [group, draft, revision, publication])).rows[0]!.v; });
   await check(); committing = true; await c.query('commit'); return result;
  } catch (error) {
   if (!committing) await c.query('rollback').catch(() => {});
   // An uncertain commit is never retried automatically.
   throw error;
  } finally { boundary?.signal.removeEventListener('abort', abort); await c.end(); }
 } };
}
