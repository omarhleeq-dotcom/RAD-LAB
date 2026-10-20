// Local library artifact only: no env, credentials, DB connection, entrypoint loop or deployment.
import { build } from "esbuild";
import { mkdtemp, writeFile, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (process.argv.length !== 2) throw new Error("No runtime flags accepted");
const output = await mkdtemp(join(tmpdir(), "radlab-assess-build-"));
const result = await build({
  entryPoints: { "assess-runtime": "src/features/assess/server-runtime.ts", "assess-job": "src/features/assess/server-job.ts" },
  outdir: output, outExtension: { ".js": ".cjs" },
  bundle: true, platform: "node", target: "node24", format: "cjs",
  define: { "process.env.NODE_PG_FORCE_NATIVE": "false" },
  metafile: true, sourcemap: false, logLevel: "silent",
});
if (Object.keys(result.metafile.inputs).some(path => /node_modules\/(react|react-dom|next|zustand)\//.test(path))) {
  throw new Error("Impure runtime graph");
}
await writeFile(join(output, "package.json"), JSON.stringify({ private: true, engines: { node: ">=24 <25" } }));
await copyFile("scripts/assess/job-main.mjs", join(output, "job-main.mjs"));
await copyFile("scripts/assess/runtime.Dockerfile", join(output, "Dockerfile"));
console.log(JSON.stringify({ contract: "assess-runtime-build/1", output, runtimeOrLaunchVerified: false }));
