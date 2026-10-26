/** Private injected connection port. No ENV/URL fallback or runtime entrypoint. Identity and
 * group are pinned by the trusted host, never read from a publish browser request. */
import type { Client } from 'pg';
import type { AuthoringBridgePort, IndependentPublication, StoredAuthoringRevision } from './server-authoring-bridge';
type Read = { snapshot: StoredAuthoringRevision; reviewed: IndependentPublication; installedVersion: string | null };
const uuid = (v: string) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export function postgresAuthoringBridge(connect: () => Promise<Client>, identity: string, group: string): AuthoringBridgePort & { receipt(draft: string, revision: number): Promise<string | null> } {
 if (!uuid(identity) || !uuid(group)) throw Error('invalid_bound_scope');
 async function transaction<T>(draft: string, revision: number, run: (read: Read, call: (sql: string, args: unknown[]) => Promise<unknown>) => Promise<T>, readOnly = false) {
  if (!uuid(draft) || !Number.isSafeInteger(revision) || revision < 1 || revision > 100) throw Error('invalid_revision');
  const client = await connect();
  try {
   await client.query('begin isolation level read committed');
   await client.query('set local role assess_authoring_bridge');
   await client.query("select set_config('request.jwt.claim.sub',$1,true)", [identity]);
   const read = (await client.query<{ v: Read }>('select assess.authoring_bridge_read_v1($1,$2,$3) v', [group,draft,revision])).rows[0]!.v;
   const result = await run(read, async (sql, args) => (await client.query<{ v: unknown }>(sql, args)).rows[0]!.v);
   // Receipt takes locks for an authorized consistent read, but writes no domain data.
   await client.query(readOnly ? 'rollback' : 'commit'); return result;
  } catch (error) { await client.query('rollback'); throw error; }
  finally { await client.end(); }
 }
 return {
  receipt(draft, revision) { return transaction(draft, revision, async read => read.installedVersion, true); },
  transaction(draft, revision, run) {
   return transaction(draft, revision, async (read, call) => run({
    snapshot: read.snapshot, installedVersion: read.installedVersion ?? undefined,
    async reviewed() { return read.reviewed; },
    async candidate(document) { return await call('select assess.content_submit_v1($1) v', [JSON.stringify(document)]) as string; },
    installer: { async call<T>(name: string, args: Record<string, unknown>) {
     if (name === 'content_read_v1') return await call('select assess.authoring_bridge_candidate_v1($1,$2,$3,$4) v', [group,draft,revision,args.p_version]) as T;
     if (name !== 'content_install_v1' && name !== 'content_install_practical_v1') throw Error('bridge_capability_denied');
     return await call('select assess.authoring_bridge_install_v1($1,$2,$3,$4,$5,$6) v', [group,draft,revision,args.p_version,JSON.stringify(args.p_specs),name === 'content_install_practical_v1' ? JSON.stringify(args.p_views) : null]) as T;
    } },
    async bind(version) { await call('select assess.authoring_bridge_bind_v1($1,$2,$3,$4) v', [group,draft,revision,version]); },
   }));
  },
 };
}
