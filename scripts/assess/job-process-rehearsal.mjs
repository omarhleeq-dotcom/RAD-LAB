// Finite real-process crash QA against a NEW disposable PostgreSQL cluster only.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { openLocalDatabase } from "./local-database.mjs";
import { attemptService, runAssessJobs } from "../../src/features/assess/server-service.ts";
import { installMixedContent } from "../../src/features/assess/server-presentation.ts";

let db, phase = "configuration", cleanup = true, outcome = "STOP";
const checks = [], children = new Set();
try {
  assert.deepEqual(process.argv.slice(2), ["--synthetic-disposable"]);
  phase = "build";
  const built = spawnSync(process.execPath, ["scripts/assess/build-runtime.mjs"], { encoding: "utf8", timeout: 15000 });
  assert.equal(built.status, 0);
  const bundle = `${JSON.parse(built.stdout).output}/assess-job.cjs`;
  phase = "setup"; db = await openLocalDatabase("postgres");
  const { query, exec, port } = db;
  const socket = (await query("show unix_socket_directories"))[0].unix_socket_directories;
  await exec("create role assess_job_qa login noinherit;grant assess_worker to assess_job_qa");
  const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  for (const n of [1, 2]) await query("insert into auth.users values($1,$2,now(),$3)", [uid(n), `synthetic${n}@example.test`, JSON.stringify({ display_name: "Synthetic" })]);
  await exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}'`);
  const owner = port("authenticated", uid(1)), student = port("authenticated", uid(2)), worker = port("assess_worker"), service = attemptService(student);
  const item = { schemaVersion: 1, ref: { id: "q", version: "1" }, type: "single-choice", contentLanguage: "en", prompt: "Synthetic", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] };
  const document = { schemaVersion: 1, assessment: { schemaVersion: 1, ref: { id: uid(10), version: "1" }, name: "Synthetic crash QA", track: "mixed", maximum: "10", policy: { durationSeconds: 3600, maxAttempts: 10, gradeVisibility: "hidden" }, items: [item] }, itemMarks: [{ item: item.ref, maximum: "10" }], privateItems: [{ schemaVersion: 1, ref: item.ref, type: "single-choice", correctOptionId: "a", review: { sources: [{ reference: "Synthetic", licenceEvidence: "Own fixture" }], reviewedBy: "Engineering", reviewedAt: "2026-10-21T00:00:00.000Z", scope: "No clinical evidence" } }] };
  const version = await owner.call("content_submit_v1", { p_document: document }); await installMixedContent(worker, version);
  const assignment = await owner.call("assign_v1", { p_version: version, p_users: [uid(2)], p_groups: [] });
  await student.call("consent_v2", { p_version: "assess-pilot-2026-10-20-v2" });
  assert.equal((await query("select enabled from assess.launch_gate"))[0].enabled, false);
  await exec("update assess.launch_gate set enabled=true"); // ONLY this fresh disposable fixture
  async function submitted() {
    const { attemptId } = await service.start(assignment, randomUUID());
    const command = (revision, action) => JSON.stringify({ schemaVersion: 1, attemptId, operationId: randomUUID(), expectedRevision: revision, action });
    await service.command(command(0, { type: "save", item: item.ref, answer: { type: "single-choice", optionId: "a" } }));
    await service.command(command(1, { type: "submit" })); return attemptId;
  }
  async function childAt(stage) {
    const child = spawn(process.execPath, ["scripts/assess/job-process-child.mjs", "--synthetic-disposable-child"], { stdio: ["ignore", "pipe", "pipe", "ipc"] });
    children.add(child); let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; }); child.stderr.on("data", chunk => { stderr += chunk; });
    const messages = [], waiters = new Map();
    child.on("message", message => { const resolve = waiters.get(message.stage); if (resolve) { waiters.delete(message.stage); resolve(); } else messages.push(message.stage); });
    const wait = expected => new Promise((resolve, reject) => {
      if (messages.includes(expected)) return resolve();
      const timer = setTimeout(() => { waiters.delete(expected); reject(new Error("child_boundary")); }, 15000);
      waiters.set(expected, () => { clearTimeout(timer); resolve(); });
    });
    const exited = new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code, signal) => { children.delete(child); resolve({ code, signal }); }); });
    child.send({ socket, bundle, stage }); await wait(stage);
    return { child, wait, exited, output: () => ({ stdout, stderr }) };
  }
  const snapshot = async session => {
    // Lock waits for the killed backend's transaction to end; no polling or timing assumption.
    await exec("begin;set local lock_timeout='5s'");
    try { return (await query("select state,lease from assess.sessions where id=$1 for update", [session]))[0]; }
    finally { await exec("commit"); }
  };
  const count = async (table, session) => (await query(`select count(*)::int n from assess.${table} where session_id=$1`, [session]))[0].n;
  for (const signal of ["SIGTERM", "SIGINT"]) {
    phase = signal; const session = await submitted(), child = await childAt("before");
    child.child.kill(signal); await child.wait("signal-received"); child.child.send("continue");
    assert.deepEqual(await child.exited, { code: 130, signal: null });
    const output = child.output(); assert.equal(output.stderr, "");
    const report = JSON.parse(output.stdout); assert.equal(report.code, "stopped"); assert.equal(report.counts.graded, 1);
    assert(!/correctOptionId|optionId|p_token|example.test/.test(output.stdout));
    assert.equal((await snapshot(session)).state, "graded"); assert.equal(await count("results", session), 1);
    checks.push(`${signal.toLowerCase()}-drains-finish`);
  }
  phase = "kill-before-commit";
  const before = await submitted(), beforeChild = await childAt("before"); beforeChild.child.kill("SIGKILL");
  assert.deepEqual(await beforeChild.exited, { code: null, signal: "SIGKILL" });
  const pending = await snapshot(before); assert.equal(pending.state, "grading");
  assert.equal(await count("results", before), 0); assert.equal(await count("session_details", before), 1);
  assert.equal((await runAssessJobs(worker, 1)).graded, 0); // existing lease prevents immediate replay
  await query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [before]);
  assert.equal((await runAssessJobs(worker, 1)).graded, 1);
  await assert.rejects(() => worker.call("finish_v1", { p_session: before, p_token: pending.lease, p_n: "10", p_d: "1" }), { code: "40001" });
  assert.equal(await count("results", before), 1); assert.equal(await count("session_details", before), 0);
  checks.push("kill-before-commit-rollback", "lease-recovery-no-second-result", "stale-token-rejected");
  phase = "kill-after-commit";
  const after = await submitted(), afterChild = await childAt("after"); afterChild.child.kill("SIGKILL");
  assert.deepEqual(await afterChild.exited, { code: null, signal: "SIGKILL" });
  assert.equal((await snapshot(after)).state, "graded"); assert.equal(await count("results", after), 1); assert.equal(await count("session_details", after), 0);
  assert.equal((await runAssessJobs(worker, 1)).graded, 0); assert.equal(await count("results", after), 1);
  checks.push("lost-commit-ack-keeps-one-result");
  phase = "retry-window";
  const retry = await submitted(), claimed = await worker.call("claim_v1", {});
  assert.equal(claimed.attemptId, retry); await worker.call("fail_v1", { p_session: retry, p_token: claimed.token });
  assert.equal((await runAssessJobs(worker, 1)).graded, 0); assert.equal(await count("results", retry), 0);
  await worker.call("recover_v1", { p_session: retry }); assert.equal((await runAssessJobs(worker, 1)).graded, 1);
  for (const session of [before, after, retry]) {
    const grade = (await query("select earned_n::text n,earned_d::text d from assess.results where session_id=$1", [session]))[0];
    assert.deepEqual(grade, { n: "10", d: "1" });
  }
  checks.push("no-invented-grade");
  checks.push("retry-at-respected-explicit-recovery");
  const expired = await submitted();
  await query("update assess.sessions set submitted_at=clock_timestamp()-interval '8 days' where id=$1", [expired]);
  phase = "recovery-window";
  assert.equal((await runAssessJobs(worker, 1)).graded, 0);
  // C sets void+expiry and purges in the SAME maintenance transaction; no durable void row remains.
  assert.equal(await snapshot(expired), undefined); assert.equal(await count("results", expired), 0);
  assert.equal(await count("session_details", expired), 0);
  await assert.rejects(() => worker.call("recover_v1", { p_session: expired }), { code: "55000" });
  checks.push("recovery-window-no-invented-zero");
  for (const table of ["attempts", "events", "feedback"]) assert.equal((await query(`select count(*)::int n from public.${table}`))[0].n, 0);
  checks.push("no-practice-or-events");
  await exec("update assess.launch_gate set enabled=false"); outcome = "PASS"; phase = "complete";
} catch { /* phase only; never raw SQL, credentials, claims or assertions */ }
finally {
  for (const child of children) { const ended = new Promise(resolve => child.once("exit", resolve)); child.kill("SIGKILL"); await ended; }
  if (db) { try { await db.close(); } catch { cleanup = false; outcome = "STOP"; phase = "cleanup_failed"; } }
}
console.log(JSON.stringify({ contract: "assess-job-process/1", outcome, code: phase, checks, cleanup, runtimeOrLaunchVerified: false }));
process.exitCode = outcome === "PASS" ? 0 : 1;
