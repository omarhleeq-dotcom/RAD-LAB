// Offline deployment gate: an owner attests compatibility after the documented read-only SQL + signed-in checks.
// No database connection, credentials or account data. The attestation binds to this project and the reviewed frontend-required SQL contents.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { assertPublishableKey, supabaseOrigin } from "./headers.mjs";

const require = createRequire(import.meta.url);
let ts;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const codeExtensions = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"];
const sourceFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
  ? sourceFiles(resolve(dir, e.name)) : /\.(ts|tsx|mjs|js)$/.test(e.name) && !/\.(test|spec|d)\.tsx?$/.test(e.name) ? [resolve(dir, e.name)] : []);
// Built-in receivers whose static `.from` is never a DB/network call. Shared by the boundary
// detector and the call collector so both classify these receivers identically.
const nonClientReceivers = new Set(["Array", "Buffer", "Object", "Float32Array", "Float64Array", "Int8Array", "Int16Array", "Int32Array",
  "Uint8Array", "Uint16Array", "Uint32Array", "Uint8ClampedArray", "BigInt64Array", "BigUint64Array"]);
const typeOnly = (node) => node.isTypeOnly || (node.importClause && (node.importClause.isTypeOnly ||
  (!node.importClause.name && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings) &&
    node.importClause.namedBindings.elements.every((e) => e.isTypeOnly))));

/** Conservative source dependency review, not a proof about arbitrary JS/network libraries.
 * Every client module is a root. Runtime local imports/reexports/dynamic imports are followed.
 * DB/network boundaries must match the reviewed source bytes; new ones fail closed.
 */
export function inspectBrowserBoundaries(projectRoot = root) {
  // Load the compiler only for dependency review; early rejection paths stay cheap.
  ts ??= require("typescript");
  const files = sourceFiles(resolve(projectRoot, "src"));
  const sources = new Map(files.map((file) => [file, readFileSync(file, "utf8")]));
  const parsed = new Map();
  // Each file is parsed at most once. JSDoc is never visited by forEachChild, so skipping
  // its parse (RAD-SCHEMA-GATE S8) leaves every import/call/literal check unchanged.
  const parse = (path, text) => ts.createSourceFile(path, text, { languageVersion: ts.ScriptTarget.Latest, jsDocParsingMode: ts.JSDocParsingMode.ParseNone }, false);
  const load = (path) => {
    if (!parsed.has(path)) parsed.set(path, parse(path, sources.get(path) ?? readFileSync(path, "utf8")));
    return parsed.get(path);
  };
  const pending = files.filter((file) => {
    const source = sources.get(file);
    // A StringLiteral whose decoded value is "use client" must contain either
    // that exact text or an escape. This only skips impossible roots; the AST
    // still decides every candidate, including escaped and non-prologue literals.
    if (!source.includes("use client") && !source.includes("\\")) return false;
    return load(file).statements.some((n) => ts.isExpressionStatement(n) && ts.isStringLiteral(n.expression) && n.expression.text === "use client");
  });
  if (!pending.length) throw new Error("Frontend contract has no client roots.");
  // Reviewed adapters pinned by name in the contract, independent of how their source happens to read.
  const manifestPath = resolve(projectRoot, "scripts/pages/frontend-schema.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const explicit = manifest.explicitBoundaries ?? [];
  // Reviewed, manifest-derived feature guards may keep an adapter dormant. Only a
  // positive if(GUARD) branch around a literal import is eligible; ordinary imports,
  // unguarded clients and every other API boundary retain the conservative rules.
  const features = Object.values(manifest.guardedFeatures ?? {});
  for (const feature of features) {
    if (!Array.isArray(feature.migrations) || !feature.migrations.length || !feature.guard || !feature.boundaries
      || !/^src\/[a-zA-Z0-9_./-]+\.ts$/.test(feature.guard.path) || feature.guard.path.includes("..")
      || !/^[A-Z][A-Z0-9_]*$/.test(feature.guard.symbol)
      || digest(readFileSync(resolve(projectRoot, feature.guard.path))) !== feature.guard.sha256) throw new Error("Unreviewed schema feature guard.");
    if (!feature.consumer?.path?.startsWith("src/") || feature.consumer.path.includes("..")
      || digest(readFileSync(resolve(projectRoot, feature.consumer.path))) !== feature.consumer.sha256) throw new Error("Unreviewed schema feature consumer.");
    for (const [path, hash] of Object.entries(feature.boundaries)) {
      if (!path.startsWith("src/") || path.includes("..") || digest(readFileSync(resolve(projectRoot, path))) !== hash) throw new Error("Unreviewed guarded database boundary.");
    }
    if (feature.migrations.some(file => !manifest.requiredMigrations?.includes(file) && !manifest.deferredMigrations?.[file])) throw new Error("Unclassified feature migration.");
    // RAD085-SEC-FIXES-20261027 SEC-04: availability is one exported const boolean literal
    // with no runtime imports/re-exports, so no client module can change it before it is
    // evaluated. It must equal this manifest's classification, read here from disk.
    feature.available = feature.migrations.every(m => manifest.requiredMigrations.includes(m) && !manifest.deferredMigrations[m]);
    const guardTree = load(resolve(projectRoot, feature.guard.path));
    const named = (s) => ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s) || ts.isEnumDeclaration(s) || ts.isModuleDeclaration(s)
      ? [s.name?.text] : ts.isVariableStatement(s) ? s.declarationList.declarations.map(d => ts.isIdentifier(d.name) ? d.name.text : undefined) : [];
    const switches = guardTree.statements.filter(s => named(s).includes(feature.guard.symbol));
    const literal = switches.length === 1 && ts.isVariableStatement(switches[0]) && switches[0].declarationList.declarations.length === 1
      && (switches[0].declarationList.flags & ts.NodeFlags.Const) && switches[0].modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
      ? switches[0].declarationList.declarations[0] : undefined;
    if (guardTree.statements.some(s => ts.isImportDeclaration(s) || ts.isImportEqualsDeclaration(s) || ts.isExportDeclaration(s) || ts.isExportAssignment(s))
      || !literal || (literal.type && literal.type.kind !== ts.SyntaxKind.BooleanKeyword)
      || ![ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(literal.initializer?.kind)) throw new Error("Schema feature guard must be a literal constant.");
    if ((literal.initializer.kind === ts.SyntaxKind.TrueKeyword) !== feature.available) throw new Error("Schema feature guard does not match the manifest.");
  }
  if (!Array.isArray(explicit) || explicit.some((f) => typeof f !== "string" || !f.startsWith("src/") || f.includes(".."))) throw new Error("Invalid explicit boundary list.");
  const seen = new Set(), boundaries = {}, calls = [], literals = [];
  while (pending.length) {
    const file = pending.pop(); if (seen.has(file)) continue; seen.add(file);
    const path = relative(projectRoot, file).replaceAll("\\", "/");
    const tree = load(file); let boundary = explicit.includes(path);
    const follow = (specifier) => {
      if (specifier === "@supabase/supabase-js") boundary = true;
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return;
      const base = specifier.startsWith("@/") ? resolve(projectRoot, "src", specifier.slice(2)) : resolve(dirname(file), specifier);
      const target = codeExtensions.map((ext) => base + ext).find((p) => /\.(ts|tsx|mjs|js)$/.test(p) && existsSync(p));
      if (target) pending.push(target);
      else if (!/\.(css|json|svg|png|jpg|woff2?)$/.test(specifier)) throw new Error(`Unresolved frontend import in ${path}`);
    };
    const guarded = new Map();
    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      const specifier = statement.moduleSpecifier.text;
      const base = specifier.startsWith("@/") ? resolve(projectRoot, "src", specifier.slice(2)) : resolve(dirname(file), specifier);
      for (const feature of features) if (path === feature.consumer.path && base + ".ts" === resolve(projectRoot, feature.guard.path)) {
        for (const binding of bindings.elements) if (!binding.isTypeOnly && (binding.propertyName ?? binding.name).text === feature.guard.symbol) {
          guarded.set(binding.name.text, feature.available);
        }
      }
    }
    const visit = (node) => {
      if (ts.isIfStatement(node) && ts.isIdentifier(node.expression) && guarded.get(node.expression.text) === false) {
        // Still inspect the condition/else branch. No API call may be hidden in the
        // branch itself: only the import of the separately pinned adapter is dormant.
        const inspectDormant = (child) => {
          if (ts.isCallExpression(child) && child.expression.kind === ts.SyntaxKind.ImportKeyword) {
            if (child.arguments.length !== 1 || !ts.isStringLiteral(child.arguments[0])) throw new Error(`Computed frontend import requires review: ${path}`);
            return;
          }
          if (ts.isPropertyAccessExpression(child) && ["rpc", "schema", "from"].includes(child.name.text)) throw new Error(`Inline API inside schema guard: ${path}`);
          if (ts.isIdentifier(child) && ["getPilotClient", "fetch", "XMLHttpRequest", "WebSocket", "EventSource"].includes(child.text)) throw new Error(`Inline network inside schema guard: ${path}`);
          ts.forEachChild(child, inspectDormant);
        };
        inspectDormant(node.thenStatement);
        visit(node.expression);
        if (node.elseStatement) visit(node.elseStatement);
        return;
      }
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
        !nonClientReceivers.has(node.expression.getText(tree))) boundary = true;
      if (ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteral(node.argumentExpression) && ["rpc", "schema", "from"].includes(node.argumentExpression.text)) boundary = true;
      ts.forEachChild(node, visit);
    };
    visit(tree);
    if (boundary) {
      boundaries[path] = digest(readFileSync(file));
      const inspect = (node) => {
        if (ts.isStringLiteral(node)) literals.push({ path, name: node.text });
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["rpc", "from"].includes(node.expression.name.text) &&
          !nonClientReceivers.has(node.expression.expression.getText(tree))) {
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
  for (const file of explicit) if (!boundaries[file]) throw new Error(`Explicit boundary is not reachable from the frontend: ${file}`);
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
  const expected = { ...manifest.browserBoundaries };
  for (const feature of Object.values(manifest.guardedFeatures ?? {})) if (feature.migrations.every(m => required.includes(m) && !manifest.deferredMigrations[m])) {
    Object.assign(expected, feature.boundaries);
  }
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
