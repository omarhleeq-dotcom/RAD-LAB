/** Private Node binding. Importing/building opens no connections and starts no jobs. */
import { Pool, type PoolClient } from "pg";
import { AssessServiceError, type AssessRpc } from "./server-service";
export { runAssessJobs, publicationService } from "./server-service";
export { installMixedContent } from "./server-presentation";

// Identifiers and casts are source constants; neither is supplied by a caller.
const operations = {
  trial_maintain_v1: [["p_trial", "uuid"], ["p_limit", "integer"]],
  trial_claim_v1: [["p_trial", "uuid"]],
  trial_health_v1: [["p_trial", "uuid"]],
  trial_finish_v1: [["p_trial", "uuid"], ["p_session", "uuid"], ["p_token", "uuid"], ["p_n", "text"], ["p_d", "text"]],
  trial_fail_v1: [["p_trial", "uuid"], ["p_session", "uuid"], ["p_token", "uuid"]],
  maintain_v1: [["p_limit", "integer"]],
  claim_v1: [],
  finish_v1: [["p_session", "uuid"], ["p_token", "uuid"], ["p_n", "text"], ["p_d", "text"]],
  fail_v1: [["p_session", "uuid"], ["p_token", "uuid"]],
  health_v1: [],
  recover_v1: [["p_session", "uuid"]],
  content_read_v1: [["p_version", "uuid"]],
  content_install_v1: [["p_version", "uuid"], ["p_specs", "jsonb"]],
  install_publication_v1: [["p_version", "uuid"], ["p_document", "jsonb"], ["p_specs", "jsonb"]],
} as const;

export interface WorkerBinding {
  host: string; port: number; database: string; user: string; password: string;
  /** Explicit trust root; verification and hostname checking cannot be disabled. */
  ca: string;
  connections?: number;
  /** Explicit Supabase session-pooler routing suffix; user remains the DB login. */
  sessionPoolerProjectRef?: string;
}
function invalid(): never { throw new AssessServiceError("invalid"); }
function redacted(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";
  return new AssessServiceError(code === "42501" ? "denied" : code === "40001" ? "conflict" : "unavailable");
}

/** A separate login with NOINHERIT and ONLY assess_worker membership is required.
 * No connectionString, process env fallback, JWT/identity override, or admin key.
 * Provisioning, credentials, ACL review and provider TLS checks are external gates.
 */
export function createWorkerBinding(config: WorkerBinding): AssessRpc & { close(): Promise<void> } {
  const max = config.connections ?? 2;
  const login = config.user;
  const sessionPooler = Object.hasOwn(config, "sessionPoolerProjectRef");
  if (!/^[a-z0-9][a-z0-9.-]*$/i.test(config.host) || !Number.isInteger(config.port) || config.port < 1 || config.port > 65535 ||
      !config.database || !/^[a-z_][a-z0-9_]*$/.test(config.user) ||
      /^(postgres|supabase_admin|service_role|authenticated|anon|assess_worker)$/.test(config.user) ||
      !config.password || !config.ca.includes("-----BEGIN CERTIFICATE-----") || !Number.isInteger(max) || max < 1 || max > 4) invalid();
  if (sessionPooler && (typeof config.sessionPoolerProjectRef !== "string" ||
      !/^[a-z0-9]{1,63}$/.test(config.sessionPoolerProjectRef) || config.port !== 5432)) invalid();
  const pool = new Pool({
    host: config.host, port: config.port, database: config.database,
    user: sessionPooler ? `${login}.${config.sessionPoolerProjectRef}` : login, password: config.password,
    ssl: { ca: config.ca, rejectUnauthorized: true }, max,
    connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000,
    application_name: "radlab-assess-worker-v1",
    options: "-c search_path= -c statement_timeout=60000 -c lock_timeout=5000",
  });
  let closing = false, fault = false, active = 0, closePromise: Promise<void> | undefined;
  let drained: (() => void) | undefined;
  // pg emits idle connection errors. Consume them without logging credentials or SQL.
  pool.on("error", () => { fault = true; });
  return {
    async call<T>(name: string, args: Record<string, unknown>): Promise<T> {
      if (closing || fault) throw new AssessServiceError("unavailable");
      if (!Object.hasOwn(operations, name)) invalid();
      const fields = operations[name as keyof typeof operations];
      if (!args || Object.keys(args).length !== fields.length || fields.some(([key]) => !Object.hasOwn(args, key))) invalid();
      // No unbounded application queue; scheduling/backoff remains outside this binding.
      if (active >= max) throw new AssessServiceError("limit");
      let values: unknown[];
      try {
        values = fields.map(([key, cast]) => {
          const value = args[key];
          if (cast === "integer") { if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100) invalid(); return value; }
          if (cast === "jsonb") {
            const json = JSON.stringify(value);
            if (!json || Buffer.byteLength(json) > 2_000_000) invalid();
            return json;
          }
          if (typeof value !== "string" || (cast === "uuid" ? !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) : !/^\d{1,100}$/.test(value))) invalid();
          return value;
        });
      } catch { return invalid(); }
      const sql = `select assess.${name}(${fields.map(([, cast], i) => `$${i + 1}::${cast}`).join(",")}) as value`;
      active++;
      let client: PoolClient | undefined;
      let discard = false;
      try {
        client = await pool.connect();
        await client.query("begin");
        const check = await client.query<{ allowed: boolean }>(`select (
          session_user = $1 and current_user = session_user and r.rolcanlogin and not r.rolinherit
          and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication
          and exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
            where m.member=r.oid and g.rolname='assess_worker' and not m.admin_option)
          and not exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
            where m.member=r.oid and (g.rolname<>'assess_worker' or m.admin_option))
        ) as allowed from pg_catalog.pg_roles r where r.rolname=session_user`, [login]);
        if (check.rows.length !== 1 || check.rows[0]?.allowed !== true) throw { code: "42501" };
        await client.query("set local role assess_worker");
        await client.query("set local search_path = ''");
        await client.query("set local statement_timeout = '60s'");
        await client.query("set local lock_timeout = '5s'");
        const result = await client.query<{ value: T }>(sql, values);
        if (result.rows.length !== 1) throw new Error();
        await client.query("commit");
        return result.rows[0]!.value;
      } catch (error) {
        discard = true;
        // COMMIT may already have succeeded. Never replay or infer a zero/result absence.
        if (client) { try { await client.query("rollback"); } catch { /* discard below */ } }
        throw redacted(error);
      } finally {
        client?.release(discard);
        active--;
        if (active === 0) drained?.();
      }
    },
    close() {
      closing = true;
      // Also drain pending connects before pg.end; no checked-out call is cancelled.
      return closePromise ??= (async () => {
        if (active > 0) await new Promise<void>(resolve => { drained = resolve; });
        try { await pool.end(); } catch { throw new AssessServiceError("unavailable"); }
      })();
    },
  };
}
