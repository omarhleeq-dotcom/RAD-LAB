import { getPilotClient } from '../pilot/client';
import { createSqlReview, type ScopeTransport } from '../supervisor-review/sql-adapter';
import type { Person } from '../supervisor-review/contracts';

const parameters: Record<string, readonly string[]> = {
 scope_page_v1: ['p_kind', 'p_group', 'p_after', 'p_limit'],
 sharing_consent_v1: ['p_version', 'p_digest', 'p_accept'],
 appointment_v1: ['p_user', 'p_appoint'],
 supervisor_group_v1: ['p_action', 'p_group', 'p_revision', 'p_name', 'p_ends'],
 join_request_v1: ['p_code'], join_decide_v1: ['p_request', 'p_revision', 'p_action'], group_leave_v1: ['p_group'],
};
export async function bindP1(self: Person) {
 const client = await getPilotClient();
 if (!client) throw Error('unavailable');
 const transport: ScopeTransport = {
  async rpc(name, args, signal) {
   const names = parameters[name];
   if (!names || args.length > names.length) throw Error('invalid operation');
   const { data, error } = await client.schema('assess').rpc(name, Object.fromEntries(args.map((value, i) => [names[i]!, value]))).abortSignal(signal);
   if (error) throw error;
   return data;
  },
 };
 // Identity comes from SessionGate; the transport uses the signed-in publishable client.
 // No account selector, service key, subscription, polling, automatic retry or worker.
 return createSqlReview(self, transport);
}
