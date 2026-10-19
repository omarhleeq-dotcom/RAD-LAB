// Local Node 24 reference spike only. Not a production loader or a provider compatibility claim.
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^(react|react-dom|next|zustand)(\/|$)/.test(specifier)) throw new Error(`Impure evaluation import: ${specifier}`);
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? pathToFileURL(resolvePath(root, "src", specifier.slice(2))).href
        : new URL(specifier, context.parentURL).href;
      for (const candidate of [base, `${base}.ts`, `${base}/index.ts`]) {
        if (candidate.endsWith(".ts") && existsSync(fileURLToPath(candidate))) return { url: candidate, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context);
    if (!url.endsWith(".ts")) return loaded;
    return { format: "module", source: stripTypeScriptTypes(String(loaded.source), { mode: "strip" }), shortCircuit: true };
  },
});
