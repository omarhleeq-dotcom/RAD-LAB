/** Preparatory, single-operation tools. Importing this file opens no connection.
 * No grading tick, identity override, gate toggle, environment or destination fallback.
 */
import { open, constants } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createWorkerBinding } from "../../src/features/assess/server-runtime";
import { parseJobConfig } from "../../src/features/assess/server-job";
import { installMixedContent } from "../../src/features/assess/server-presentation";
import { retentionService, type AssessRpc } from "../../src/features/assess/server-service";

const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const projectUrl = "https://vlacestfruxooznrcjqc.supabase.co";
type Worker = AssessRpc & { close(): Promise<void> };
type Report = { contract: "assess-trial-tools/1"; outcome: "COMPLETE" | "STOP";
  code: "complete" | "configuration" | "unavailable_or_uncertain" | "cleanup_failed"; runtimeOrLaunchVerified: false };
const report = (code: Report["code"]): Report => ({ contract: "assess-trial-tools/1", outcome: code === "complete" ? "COMPLETE" : "STOP", code, runtimeOrLaunchVerified: false });

/** Exactly one existing immutable pending candidate; validation precedes installation.
 * On a lost install COMMIT acknowledgement, STOP means uncertain: never retry blindly.
 */
export async function installOneMixed(version: unknown, load: () => Promise<unknown>,
  make: (config: ReturnType<typeof parseJobConfig>) => Worker = createWorkerBinding): Promise<Report> {
  let worker: Worker | undefined, code: Report["code"] = "configuration";
  try {
    if (!uuid(version)) return report(code);
    const config = parseJobConfig(await load());
    worker = make(config);
    code = "unavailable_or_uncertain";
    await installMixedContent(worker, version);
    code = "complete";
  } catch { /* whitelist only; validation may contain private authoring fields */ }
  finally { if (worker) { try { await worker.close(); } catch { code = "cleanup_failed"; } } }
  return report(code);
}

type OwnerConfig = { url: string; publicKey: string; accessToken: string };
function parseOwnerConfig(raw: unknown): OwnerConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error();
  const c = raw as Record<string, unknown>;
  if (Object.keys(c).length !== 3 || c.url !== projectUrl ||
    typeof c.publicKey !== "string" || typeof c.accessToken !== "string" ||
    !c.publicKey || c.publicKey.length > 16384 || c.accessToken.length > 16384) throw new Error();
  // Key classification only, never identity verification. Auth verifies the user below.
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.publicKey)) {
    const key = JSON.parse(Buffer.from(c.publicKey.split(".")[1] ?? "", "base64url").toString());
    if (key.role !== "anon" || c.publicKey.split(".").length !== 3) throw new Error();
  }
  const token = JSON.parse(Buffer.from(c.accessToken.split(".")[1] ?? "", "base64url").toString());
  if (c.accessToken.split(".").length !== 3 || token.role !== "authenticated") throw new Error();
  return c as OwnerConfig;
}

/** Actual Auth getUser validation, then the existing owner/assignment SQL guard.
 * Never accepts a user id, worker binding, service key, claims injection or auth.uid override.
 */
export async function closeOneAssignment(assignment: unknown, load: () => Promise<unknown>,
  make: (config: OwnerConfig) => SupabaseClient = c => createClient(c.url, c.publicKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${c.accessToken}` },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000), redirect: "error" }) },
  })): Promise<Report> {
  let code: Report["code"] = "configuration";
  try {
    if (!uuid(assignment)) return report(code);
    const config = parseOwnerConfig(await load());
    const client = make(config);
    code = "unavailable_or_uncertain";
    const { data, error } = await client.auth.getUser(config.accessToken);
    if (error || !uuid(data.user?.id)) return report(code);
    const user: AssessRpc = { async call<T>(name: string, args: Record<string, unknown>): Promise<T> {
      if (name !== "close_assignment_v1") throw new Error();
      const result = await client.schema("assess").rpc(name, args);
      if (result.error || result.data !== null) throw new Error();
      return result.data as T;
    } };
    await retentionService(user).close(assignment);
    code = "complete";
  } catch { /* Never print JWT, identity, raw PostgREST errors or response bodies. */ }
  return report(code);
}

async function loadFile(path: string, owner = false) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > 65536 || (owner && (stat.mode & 0o077) !== 0)) throw new Error();
    const buffer = Buffer.alloc(65537);
    let n = 0;
    while (n < buffer.length) {
      const { bytesRead } = await file.read(buffer, n, buffer.length - n, n);
      if (!bytesRead) break;
      n += bytesRead;
    }
    if (!n || n > 65536) throw new Error();
    return JSON.parse(buffer.subarray(0, n).toString("utf8"));
  } finally { await file.close(); }
}

export async function main(args: string[]): Promise<Report> {
  if (args.length !== 2 || !uuid(args[1])) return report("configuration");
  // These explicit execution flags are for a future authorized window only.
  if (args[0] === "--authorized-install-mixed") return installOneMixed(args[1], () => loadFile("/run/secrets/assess-worker.json"));
  if (args[0] === "--authorized-close-assignment") return closeOneAssignment(args[1], () => loadFile("/run/secrets/assess-owner.json", true));
  return report("configuration");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await main(process.argv.slice(2));
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exitCode = result.outcome === "COMPLETE" ? 0 : 1;
}
