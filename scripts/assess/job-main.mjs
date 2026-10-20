// The only executable job entrypoint. No flags, fallback destination, scheduler or HTTP server.
import { open } from "node:fs/promises";
import { runAssessJobProcess } from "./assess-job.cjs";

async function load() {
  if (process.argv.length !== 2 || process.env.ASSESS_JOB_ENABLED !== "1") throw new Error();
  // One explicit, externally mounted secret. Never read a host .env or Google credentials.
  const file = await open("/run/secrets/assess-worker.json", "r");
  try {
    if (!(await file.stat()).isFile()) throw new Error();
    const buffer = Buffer.alloc(65537);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await file.read(buffer, total, buffer.length - total, total);
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (!total || total > 65536) throw new Error();
    return JSON.parse(buffer.subarray(0, total).toString("utf8"));
  } finally { await file.close(); }
}
try {
  const { report, exitCode } = await runAssessJobProcess(load);
  process.stdout.write(JSON.stringify(report) + "\n");
  process.exitCode = exitCode;
} catch {
  process.stdout.write(JSON.stringify({ contract: "assess-job/1", outcome: "STOP", code: "unavailable", runtimeOrLaunchVerified: false }) + "\n");
  process.exitCode = 1;
}
