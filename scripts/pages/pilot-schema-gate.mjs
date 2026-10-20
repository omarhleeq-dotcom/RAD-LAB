// Offline deployment gate: an owner attests compatibility after the documented read-only SQL + signed-in checks.
// No database connection, credentials or account data. The attestation binds to this project and the reviewed frontend-required SQL contents.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { assertPublishableKey, supabaseOrigin } from "./headers.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const codeExtensions = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"];
const sourceFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
  ? sourceFiles(resolve(dir, e.name)) : /\.(ts|tsx|mjs|js)$/.test(e.name) && !/\.(test|spec|d)\.tsx?$/.test(e.name) ? [resolve(dir, e.name)] : []);
const typeOnly = (node) => node.isTypeOnly || (node.importClause && (node.importClause.isTypeOnly ||
  (!node.importClause.name && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings) &&
    node.importClause.namedBindings.elements.every((e) => e.isTypeOnly))));

/** Conservative source dependency review, not a proof about arbitrary JS/network libraries.
 * Every client module is a root. Runtime local imports/reexports/dynamic imports are followed.
 * DB/network boundaries must match the reviewed source bytes; new ones fail closed.
 */
export function inspectBrowserBoundaries(projectRoot = root) {
  const files = sourceFiles(resolve(projectRoot, "src"));
  const parsed = new Map();
  const load = (path) => {
    if (!parsed.has(path)) parsed.set(path, ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true));
    return parsed.get(path);
  };
  const pending = files.filter((f) => load(f).statements.some((n) => ts.isExpressionStatement(n) && ts.isStringLiteral(n.expression) && n.expression.text === "use client"));
  if (!pending.length) throw new Error("Frontend contract has no client roots.");
  const seen = new Set(), boundaries = {}, calls = [], literals = [];
  while (pending.length) {
    const file = pending.pop(); if (seen.has(file)) continue; seen.add(file);
    const path = relative(projectRoot, file).replaceAll("\\", "/");
    const tree = load(file); let boundary = false;
    const follow = (specifier) => {
      if (specifier === "@supabase/supabase-js") boundary = true;
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return;
      const base = specifier.startsWith("@/") ? resolve(projectRoot, "src", specifier.slice(2)) : resolve(dirname(file), specifier);
      const target = codeExtensions.map((ext) => base + ext).find((p) => /\.(ts|tsx|mjs|js)$/.test(p) && existsSync(p));
      if (target) pending.push(target);
      else if (!/\.(css|json|svg|png|jpg|woff2?)$/.test(specifier)) throw new Error(`Unresolved frontend import in ${path}`);
    };
    const visit = (node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (!typeOnly(node)) follow(node.moduleSpecifier.text);
        // Type imports of the SDK also mark a DB adapter requiring explicit review.
        if (node.moduleSpecifier.text === "@supabase/supabase-js") boundary = true;
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (!arg || !ts.isStringLiteral(arg)) throw new Error(`Computed frontend import requires review: ${path}`);
        follow(arg.text);
      }
      if (ts.isIdentifier(node) && ["getPilotClient", "fetch", "XMLHttpRequest", "WebSocket", "EventSource"].includes(node.text)) boundary = true;
      if (ts.isPropertyAccessExpression(node) && ["rpc", "schema", "from"].includes(node.name.text) &&
        !["Array", "Buffer", "Object"].includes(node.expression.getText(tree))) boundary = true;
      if (ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteral(node.argumentExpression) && ["rpc", "schema", "from"].includes(node.argumentExpression.text)) boundary = true;
      ts.forEachChild(node, visit);
    };
    visit(tree);
    if (boundary) {
      boundaries[path] = digest(readFileSync(file));
      const inspect = (node) => {
        if (ts.isStringLiteral(node)) literals.push({ path, name: node.text });
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["rpc", "from"].includes(node.expression.name.text) &&
          !["Array", "Buffer", "Object", "Float32Array"].includes(node.expression.expression.getText(tree))) {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg)) {
            const receiver = node.expression.expression;
            let schema = "public";
            if (ts.isCallExpression(receiver) && ts.isPropertyAccessExpression(receiver.expression) && receiver.expression.name.text === "schema") {
              if (!receiver.arguments[0] || !ts.isStringLiteral(receiver.arguments[0])) throw new Error(`Computed schema requires review: ${path}`);
              schema = receiver.arguments[0].text;
            }
            calls.push({ path, kind: node.expression.name.text, name: arg.text, schema });
          }
        }
        ts.forEachChild(node, inspect);
      };
      inspect(tree);
    }
  }
  return { reachable: [...seen].map((f) => relative(projectRoot, f).replaceAll("\\", "/")).sort(), boundaries, calls, literals };
}

export function frontendRequirements(projectRoot = root) {
  const manifest = JSON.parse(readFileSync(resolve(projectRoot, "scripts/pages/frontend-schema.json"), "utf8"));
  if (manifest.version !== 1 || typeof manifest.contract !== "string" || !Array.isArray(manifest.requiredMigrations) || !manifest.requiredMigrations.length ||
    !Array.isArray(manifest.checks) || !manifest.checks.length || !manifest.deferredMigrations || !manifest.browserBoundaries) throw new Error("Invalid frontend schema contract.");
  const required = manifest.requiredMigrations;
  if (new Set(required).size !== required.length || required.some((f) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(f))) throw new Error("Invalid required migration list.");
  const actual = readdirSync(resolve(projectRoot, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
  if (required.some((f) => !actual.includes(f))) throw new Error("Required frontend migration is missing.");
  for (const file of actual) {
    if (required.includes(file)) continue;
    const entry = manifest.deferredMigrations[file];
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256) || !entry.reason || !Array.isArray(entry.serverModules) || !entry.serverModules.length ||
      digest(readFileSync(resolve(projectRoot, "supabase/migrations", file))) !== entry.sha256) throw new Error(`Unreviewed deferred migration: ${file}`);
  }
  if (Object.keys(manifest.deferredMigrations).some((f) => required.includes(f) || !actual.includes(f))) throw new Error("Invalid deferred migration classification.");
  const graph = inspectBrowserBoundaries(projectRoot);
  for (const entry of Object.values(manifest.deferredMigrations)) for (const file of entry.serverModules) {
    if (typeof file !== "string" || !file.startsWith("src/") || file.includes("..") || !existsSync(resolve(projectRoot, file))) throw new Error("Invalid server module boundary.");
    if (graph.reachable.includes(file)) throw new Error(`Deferred backend reached the frontend: ${file}`);
  }
  // Literal API calls must exist in required SQL; references to deferred-only function names
  // are also rejected inside reviewed dynamic adapters (e.g. a switch assigning rpc(name)).
  const objects = (files) => {
    const functions = new Set(), functionNames = new Set(), tables = new Set();
    for (const file of files) {
      const sql = readFileSync(resolve(projectRoot, "supabase/migrations", file), "utf8");
      for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) { functions.add(`${m[1] ?? "public"}.${m[2]}`); functionNames.add(m[2]); }
      for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) tables.add(`${m[1] ?? "public"}.${m[2]}`);
    }
    return { functions, functionNames, tables };
  };
  const needed = objects(required), deferred = objects(Object.keys(manifest.deferredMigrations));
  for (const call of graph.calls) if (!(call.kind === "rpc" ? needed.functions : needed.tables).has(`${call.schema}.${call.name}`)) {
    throw new Error(`Frontend API missing from required SQL: ${call.path} (${call.name})`);
  }
  for (const literal of graph.literals) if (deferred.functionNames.has(literal.name) && !needed.functionNames.has(literal.name)) {
    throw new Error(`Deferred RPC used by frontend: ${literal.path} (${literal.name})`);
  }
  // Required migrations do not make private Node modules safe to ship to participants.
  if (manifest.serverModules !== undefined && (!Array.isArray(manifest.serverModules) || manifest.serverModules.some((file) => typeof file !== "string" || !file.startsWith("src/") || !existsSync(resolve(projectRoot, file))))) throw new Error("Invalid server-only module list.");
  for (const file of manifest.serverModules ?? []) if (graph.reachable.includes(file)) throw new Error(`Server-only backend reached the frontend: ${file}`);
  const expected = manifest.browserBoundaries;
  if (Object.keys(expected).length !== Object.keys(graph.boundaries).length || Object.entries(graph.boundaries).some(([file, hash]) => expected[file] !== hash)) {
    throw new Error("Frontend database boundary changed. Review frontend-schema.json and promote any newly required backend migrations before attestation.");
  }
  if (new Set(manifest.checks).size !== manifest.checks.length || manifest.checks.some((f) => !/^supabase\/checks\/[a-z0-9-]+\.sql$/.test(f) || !existsSync(resolve(projectRoot, f)))) throw new Error("Invalid frontend readiness checks.");
  return manifest;
}

function requiredMarker(origin, projectRoot) {
  const manifest = frontendRequirements(projectRoot);
  // Preserve the already verified B attestation byte-for-byte. Source pins enforce review but do not
  // claim any new live SQL verification. Promoting C changes this hash and requires fresh evidence.
  const hash = createHash("sha256").update(`${origin}\n`);
  for (const file of [...manifest.requiredMigrations].sort()) hash.update(`${file}\0`).update(readFileSync(resolve(projectRoot, "supabase/migrations", file))).update("\0");
  for (const file of manifest.checks) hash.update(readFileSync(resolve(projectRoot, file)));
  return `pilot-v1:${hash.digest("hex")}`;
}
export function runSchemaGate(env, printMarker = false, projectRoot = root) {
  const origin = supabaseOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  if (printMarker) {
    if (!origin) throw new Error("Set the public NEXT_PUBLIC_SUPABASE_URL for the project being verified.");
    return requiredMarker(origin, projectRoot);
  }
  const key = assertPublishableKey(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!origin && !key) return "Pilot disabled: schema attestation is not needed.";
  if (!origin || !key) throw new Error("Incomplete pilot configuration: both public project URL and publishable key are required.");
  const attestation = (env.PILOT_SCHEMA_VERIFIED ?? "").trim();
  if (!/^pilot-v1:[a-f0-9]{64}$/.test(attestation) || attestation !== requiredMarker(origin, projectRoot)) {
    throw new Error("Pilot deployment blocked: schema compatibility has not been attested for this project and required frontend schema. Follow docs/PILOT_SUPABASE_SETUP.md; run the read-only SQL and signed-in checks before setting PILOT_SCHEMA_VERIFIED. No preview link should be published.");
  }
  return "Schema attestation matches this project and required frontend schema. This check does not deploy or enable deferred backend services. This offline gate does not query the live database.";
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(runSchemaGate(process.env, process.argv.includes("--print-marker"))); }
  catch (error) { console.error(error instanceof Error ? error.message : "Pilot schema gate failed."); process.exitCode = 1; }
}
