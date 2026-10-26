/** Private host boundary, deliberately unconfigured. No HTTP route, token parser, ENV,
 * provider, credential storage, retry loop or second publication implementation. */
import type { Pool } from 'pg';
import { postgresAuthoringBridge, type BridgeConnection } from './server-authoring-bridge-postgres';

export type BridgePrincipal = Readonly<{ subject: string; group: string; expiresAt: number }>;
export type BridgeAuthenticator = (credential: string) => Promise<BridgePrincipal>;
const uuid = (v: string) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const denied = () => Error('bridge_session_denied');

/** The injected authenticator must verify the credential AND resolve an authorized
 * group from trusted state. Merely decoding a JWT or accepting a request actor is unsafe.
 * Revocation is terminal, including channel loss; recovery requires a new host/session.
 * The host closes its dedicated pool on disconnect. Credential rotation is external. */
export function bridgeSessionHost(pool: Pool, serviceRole: string, authenticate: BridgeAuthenticator, capacity = 32) {
 if (!Number.isSafeInteger(capacity) || capacity < 1) throw denied();
 const sessions = new Set<{ principal: BridgePrincipal; stop(): void }>();
 let available = true;
 let closing: Promise<void> | undefined;
 async function open(credential: string) {
  if (!available || sessions.size >= capacity) throw denied();
  let principal: BridgePrincipal;
  try { principal = Object.freeze({ ...await authenticate(credential) }); }
  catch { throw denied(); }
  if (!available || sessions.size >= capacity || !uuid(principal.subject) || !uuid(principal.group) || !Number.isFinite(principal.expiresAt) || principal.expiresAt <= Date.now()) throw denied();
  const controller = new AbortController(), listeners = new Set<() => void>();
  let expiryTimer: ReturnType<typeof setTimeout>;
  const entry = { principal, stop() {
   if (controller.signal.aborted) return;
   clearTimeout(expiryTimer);
   controller.abort(denied()); sessions.delete(entry);
   for (const listener of listeners) { try { listener(); } catch { /* one observer cannot prevent revocation */ } }
   listeners.clear();
  } };
  sessions.add(entry);
  // Expiry must also interrupt a query blocked in PostgreSQL, without another call.
  function expire() {
   const remaining = principal.expiresAt - Date.now();
   if (remaining <= 0) entry.stop();
   else { expiryTimer = setTimeout(expire, Math.min(remaining, 2147483647)); expiryTimer.unref(); }
  }
  expire();
  async function check() {
   if (!available || controller.signal.aborted || Date.now() >= principal.expiresAt) { entry.stop(); throw denied(); }
   try {
    const current = await authenticate(credential);
    if (current.subject !== principal.subject || current.group !== principal.group || !Number.isFinite(current.expiresAt) || current.expiresAt <= Date.now() || principal.expiresAt <= Date.now()) throw denied();
   } catch { entry.stop(); throw denied(); }
   if (!available || controller.signal.aborted) throw denied();
  }
  async function connect(): Promise<BridgeConnection> {
   await check(); const client = await pool.connect();
   let ending: Promise<void> | undefined;
   const end = () => ending ??= (async () => {
    if (controller.signal.aborted) { client.release(true); return; }
    try { await client.query('rollback'); await client.query('discard all'); client.release(controller.signal.aborted); }
    catch { client.release(true); }
   })();
   try {
    // A stale borrower must never lend role/claims/open transactions to the next one.
    await client.query('rollback'); await client.query('discard all');
    const { rows } = await client.query<{ allowed: boolean }>(`select
     session_user=$1 and current_user=session_user and rolcanlogin and not
     (rolsuper or rolinherit or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls)
     and pg_has_role(session_user,'assess_authoring_bridge','SET') as allowed
     from pg_roles where rolname=session_user`, [serviceRole]);
    if (rows[0]?.allowed !== true) { entry.stop(); throw denied(); }
    await check();
    return { query: client.query.bind(client), end };
   } catch (error) { client.release(true); throw error; }
  }
  const port = postgresAuthoringBridge(connect, principal.subject, principal.group, { check, signal: controller.signal });
  return { port, close: entry.stop, subscribe(listener: () => void) {
   if (controller.signal.aborted) { listener(); return () => {}; }
   listeners.add(listener); return () => { listeners.delete(listener); };
  } };
 }
 return { open,
  revoke(match: (principal: BridgePrincipal) => boolean) { for (const s of sessions) if (match(s.principal)) s.stop(); },
  disconnect() { available = false; for (const s of sessions) s.stop(); return closing ??= pool.end(); },
 };
}
