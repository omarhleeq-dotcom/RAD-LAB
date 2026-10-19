import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
const project = "https://abcdefghijklmnop.supabase.co";
const key = "sb_publishable_synthetic_local_test_123456";
function run(env: Record<string, string> = {}, args: string[] = []) {
  return spawnSync(process.execPath, ["scripts/pages/pilot-schema-gate.mjs", ...args], {
    encoding: "utf8", env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", PILOT_SCHEMA_VERIFIED: "", ...env },
  });
}
it("blocks an enabled deployment without a matching project attestation", () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: project, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key };
  const marker = run(env, ["--print-marker"]);
  expect(marker.status).toBe(0); expect(marker.stdout.trim()).toMatch(/^pilot-v1:[a-f0-9]{64}$/);
  expect(run(env).status).toBe(1);
  expect(run({ ...env, PILOT_SCHEMA_VERIFIED: "true" }).status).toBe(1);
  expect(run({ ...env, PILOT_SCHEMA_VERIFIED: marker.stdout.trim() }).status).toBe(0);
  expect(run({ ...env, NEXT_PUBLIC_SUPABASE_URL: "https://different-project.supabase.co", PILOT_SCHEMA_VERIFIED: marker.stdout.trim() }).status).toBe(1);
});
it("allows an explicitly disabled pilot and rejects incomplete or unsafe configuration without printing keys", () => {
  expect(run().status).toBe(0);
  expect(run({ NEXT_PUBLIC_SUPABASE_URL: project }).status).toBe(1);
  expect(run({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }).status).toBe(1);
  const secret = "sb_secret_synthetic_never_publish";
  const result = run({ NEXT_PUBLIC_SUPABASE_URL: project, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret });
  expect(result.status).toBe(1); expect(result.stderr).not.toContain(secret);
});

it("places the schema gate before build/upload and replaces the existing link comment on a blocked deployment", () => {
  const workflow = readFileSync(".github/workflows/deploy-pages.yml", "utf8");
  expect(workflow.indexOf("name: Require verified pilot schema")).toBeLessThan(workflow.indexOf("name: Build static export"));
  for (const step of ["Build static export", "Ensure Pages project exists", "Deploy to Cloudflare Pages"]) {
    const fragment = workflow.slice(workflow.indexOf(`- name: ${step}`)).split("      - name:")[0]!;
    expect(fragment).toContain("steps.schema.outcome == 'success'");
  }
  expect(workflow).toContain("PILOT_SCHEMA_VERIFIED: ${{ vars.PILOT_SCHEMA_VERIFIED }}");
  expect(workflow).toContain("steps.schema.outcome == 'failure' || steps.deploy.outcome == 'success'");
  expect(workflow).toContain("if (process.env.SCHEMA_OUTCOME === 'failure')");
});

it("withdraws the previous preview URL when the gate fails instead of publishing a stale link", async () => {
  const workflow = readFileSync(".github/workflows/deploy-pages.yml", "utf8");
  const script = workflow.slice(workflow.lastIndexOf("          script: |\n") + "          script: |\n".length)
    .split("\n").map((line) => line.replace(/^ {12}/, "")).join("\n");
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const execute = new AsyncFunction("github", "context", "process", script);
  let body = "";
  const github = {
    paginate: async () => [{ id: 7, body: "<!-- rad-lab-pages-preview --> previous URL" }],
    rest: { issues: { listComments: () => {}, updateComment: async (args: { body: string }) => { body = args.body; }, createComment: async () => { throw new Error("Must update existing comment"); } } },
  };
  const context = { repo: { owner: "synthetic", repo: "synthetic" }, issue: { number: 88 }, sha: "synthetic" };
  await execute(github, context, { env: { SCHEMA_OUTCOME: "failure", DEPLOY_URL: "https://must-not-publish.invalid", ALIAS_URL: "https://must-not-publish.invalid" } });
  expect(body).toContain("deployment is blocked"); expect(body).not.toContain("https://"); expect(body).toContain("\n");
});
