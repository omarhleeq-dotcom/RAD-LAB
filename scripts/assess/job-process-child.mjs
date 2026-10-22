// QA only. The disposable parent selects its private Unix socket over IPC; never a URL/DSN.
import { Client } from "pg";
import { pathToFileURL } from "node:url";

if (process.argv.length !== 3 || process.argv[2] !== "--synthetic-disposable-child" || !process.send) process.exit(1);
process.once("message", async input => {
  let client;
  try {
    if (!input || !/^\/tmp\/radlab-assess-ops-[a-zA-Z0-9]+$/.test(input.socket) ||
        !/^\/tmp\/radlab-assess-build-[a-zA-Z0-9]+\/assess-job\.cjs$/.test(input.bundle) ||
        !["before", "after"].includes(input.stage)) throw new Error();
    const { runAssessJobProcess } = await import(pathToFileURL(input.bundle).href);
    const onSignal = () => process.send?.({ stage: "signal-received" });
    const continueAtBoundary = () => new Promise(resolve => process.once("message", message => {
      if (message !== "continue") process.exit(1);
      resolve();
    }));
    const fields = { maintain_v1: ["p_limit"], claim_v1: [], finish_v1: ["p_session", "p_token", "p_n", "p_d"], fail_v1: ["p_session", "p_token"], health_v1: [] };
    const make = () => {
      client = new Client({ host: input.socket, port: 55432, database: "postgres", user: "assess_job_qa", password: "", ssl: false, connectionTimeoutMillis: 10000, query_timeout: 10000 });
      const ready = client.connect();
      return {
        async call(name, args) {
          await ready;
          if (!Object.hasOwn(fields, name) || Object.keys(args).length !== fields[name].length) throw new Error();
          await client.query("begin");
          try {
            await client.query("set local role assess_worker");
            const result = await client.query(`select assess.${name}(${fields[name].map((field, i) => `${field}=>$${i + 1}`).join(",")}) as value`, fields[name].map(field => args[field]));
            if (name === "finish_v1" && input.stage === "before") {
              const resumed = continueAtBoundary(); process.send({ stage: "before" }); await resumed;
            }
            await client.query("commit");
            if (name === "finish_v1" && input.stage === "after") {
              const resumed = continueAtBoundary(); process.send({ stage: "after" }); await resumed;
            }
            return result.rows[0].value;
          } catch (error) { try { await client.query("rollback"); } catch { /* parent checks DB independently */ } throw error; }
        },
        async close() { await ready; await client.end(); client = undefined; },
      };
    };
    const pending = runAssessJobProcess(async () => ({ host: "synthetic.invalid", port: 5432, database: "synthetic", user: "assess_job_qa", password: "synthetic", ca: "synthetic" }), make);
    process.on("SIGTERM", onSignal); process.on("SIGINT", onSignal);
    const { report, exitCode } = await pending;
    process.off("SIGTERM", onSignal); process.off("SIGINT", onSignal);
    process.stdout.write(JSON.stringify(report) + "\n"); process.exitCode = exitCode;
  } catch {
    if (client) { try { await client.end(); } catch { /* no raw errors */ } }
    process.stdout.write(JSON.stringify({ outcome: "STOP", code: "fixture" }) + "\n"); process.exitCode = 1;
  } finally { process.disconnect(); }
});
