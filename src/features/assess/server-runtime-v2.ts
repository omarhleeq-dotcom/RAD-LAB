/** Private Node binding. Importing/building opens no connections and starts no jobs. */
import { Pool, type PoolClient } from "pg";
import { AssessServiceError, type AssessRpc } from "./server-service";
export { runAssessJobsV2 } from "./server-service-v2";

// Identifiers and casts are source constants; neither is supplied by a caller.
const operations = {
  claim_v2: [],
  finish_v2: [["p_session", "uuid"], ["p_token", "uuid"], ["p_n", "text"], ["p_d", "text"]],
  fail_v2: [["p_session", "uuid"], ["p_token", "uuid"]],
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

/** Private v2 adapter. P6 grants no capabilities. The separately reviewed
 * grading role/credential must be provisioned and verified before any use. */
export function createGradingWorkerBindingV2(config: WorkerBinding): AssessRpc & { close(): Promise<void> } {
  if (config.sessionPoolerProjectRef !== undefined || (config.connections ?? 1) !== 1) invalid();
  return binding({ ...config, connections: 1 });
}
function binding(config: WorkerBinding): AssessRpc & { close(): Promise<void> } {
  const max = 1;
  const login = config.user;
  if (!/^[a-z0-9][a-z0-9.-]*$/i.test(config.host) || !Number.isInteger(config.port) || config.port < 1 || config.port > 65535 ||
      !config.database || !/^[a-z_][a-z0-9_]*$/.test(config.user) ||
      /^(postgres|supabase_admin|service_role|authenticated|anon|assess_worker)$/.test(config.user) ||
      !config.password || !config.ca.includes("-----BEGIN CERTIFICATE-----") || !Number.isInteger(max) || max < 1 || max > 4) invalid();
  const pool = new Pool({
    host: config.host, port: config.port, database: config.database,
    user: login, password: config.password,
    ssl: { ca: config.ca, rejectUnauthorized: true }, max,
    connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000,
    application_name: "radlab-assess-worker-v2",
    options: "-c search_path= -c statement_timeout=60000 -c lock_timeout=5000",
  });
  let closing = false, fault = false, active = 0, closePromise: Promise<void> | undefined;
  const watched = new WeakSet<PoolClient>();
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
          if (typeof value !== "string" || (cast === "uuid" ? !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) : !/^\d{1,1000}$/.test(value))) invalid();
          return value;
        });
      } catch { return invalid(); }
      const sql = `select assess.${name}(${fields.map(([, cast], i) => `$${i + 1}::${cast}`).join(",")}) as value`;
      active++;
      let client: PoolClient | undefined;
      let discard = false, committing = false;
      try {
        client = await pool.connect();
        if (!watched.has(client)) {
          watched.add(client);
          // Checked-out clients also emit errors; Pool only handles idle ones.
          client.on("error", () => { fault = true; });
        }
        await client.query("begin");
        const check = await client.query<{ allowed: boolean }>(`select (
          session_user = $1 and current_user = session_user and r.rolcanlogin and not r.rolinherit
          and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication
          and r.rolvaliduntil > clock_timestamp()
          and exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
            where m.member=r.oid and g.rolname='assess_grading_worker' and m.set_option and not m.inherit_option and not m.admin_option)
          and not exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
            where m.member=r.oid and (g.rolname<>'assess_grading_worker' or m.admin_option or m.inherit_option or not m.set_option))
          and not exists (select 1 from pg_catalog.pg_auth_members m where m.member='assess_grading_worker'::regrole)
          and exists (select 1 from pg_catalog.pg_roles g where g.rolname='assess_grading_worker'
            and not g.rolcanlogin and not g.rolsuper and not g.rolbypassrls and not g.rolinherit
            and not g.rolcreatedb and not g.rolcreaterole and not g.rolreplication)
        ) as allowed from pg_catalog.pg_roles r where r.rolname=session_user`, [login]);
        if (check.rows.length !== 1 || check.rows[0]?.allowed !== true) throw { code: "42501" };
        await client.query("set local role assess_grading_worker");
        {
          const acl = await client.query<{ allowed: boolean }>(`select
            not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
              where n.nspname='assess' and has_function_privilege(current_user,p.oid,'EXECUTE')
              and p.oid not in ('assess.claim_v2()'::regprocedure,
                'assess.finish_v2(uuid,uuid,text,text)'::regprocedure,'assess.fail_v2(uuid,uuid)'::regprocedure))
            and not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
              where n.nspname in ('assess','public','auth') and c.relkind in ('r','p','v','m','f')
              and has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
            and not has_database_privilege(current_user,current_database(),'CREATE,TEMP')
            and not exists (select 1 from pg_catalog.pg_namespace n where n.nspname not like 'pg_%'
              and n.nspname<>'information_schema' and has_schema_privilege(current_user,n.oid,'CREATE')) as allowed`);
          if (acl.rows.length !== 1 || acl.rows[0]?.allowed !== true) throw { code: "42501" };
        }
        await client.query("set local search_path = ''");
        await client.query("set local statement_timeout = '60s'");
        await client.query("set local lock_timeout = '5s'");
        const result = await client.query<{ value: T }>(sql, values);
        if (result.rows.length !== 1) throw new Error();
        committing = true;
        await client.query("commit");
        return result.rows[0]!.value;
      } catch (error) {
        discard = true;
        // General worker fails permanently on any connection/ACK fault. A new pool
        // must not silently resume this execution on a different backend.
        fault = true;
        // COMMIT may already have succeeded. Never replay or infer a zero/result absence.
        let rolledBack = false;
        if (client) { try { await client.query("rollback"); rolledBack = true; } catch { /* discard below */ } }
        const failure = redacted(error);
        if (!committing && rolledBack) Object.defineProperty(failure, "writeOutcome", { value: "rolled_back" });
        throw failure;
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
