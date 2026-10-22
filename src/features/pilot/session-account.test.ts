import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// CLN-030 (RAD-061 batch 4): SessionGate owns the only account instance. A second useAccount() records its own initial
// heartbeat and duplicates the profile read (see PilotSessionKeeper.tsx). Pages read the shared one with useSessionAccount().
const ROOT = resolve(__dirname, "../../..");
const ALLOWED = new Set(["src/features/pilot/SessionGate.tsx", "src/features/pilot/useAccount.ts", "src/features/pilot/session-account.test.ts"]);
const CALL = /(?<![\w$.])useAccount\s*\(/;
// A value import of the hook (aliased or not) would allow a call under another name; `import type` stays allowed.
const IMPORT = /import\s*\{[^}]*(?<![\w$])useAccount(?![\w$])[^}]*\}\s*from/;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(ts|tsx|mts|js|jsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}

function accountInstanceViolations(files: Record<string, string>): string[] {
  return Object.entries(files).filter(([file, text]) => !ALLOWED.has(file) && (CALL.test(text) || IMPORT.test(text))).map(([file]) => file).sort();
}

describe("one account instance per page", () => {
  it("useAccount is called and imported only by SessionGate (and its own definition)", () => {
    const files = Object.fromEntries(sources(join(ROOT, "src")).map((path) => [relative(ROOT, path).split("\\").join("/"), readFileSync(path, "utf8")]));
    expect(Object.keys(files).length).toBeGreaterThan(100);
    expect(accountInstanceViolations(files)).toEqual([]);
  });

  it("detects direct, aliased and spaced calls but not useSessionAccount or type imports", () => {
    expect(accountInstanceViolations({
      "src/a.tsx": 'import { useAccount } from "./useAccount";\nconst { state } = useAccount("");',
      "src/b.tsx": 'import { useAccount as account } from "@/features/pilot/useAccount";',
      "src/c.tsx": "const x = useAccount (redirect);",
      "src/d.tsx": 'import { useSessionAccount } from "./SessionGate";\nconst { state } = useSessionAccount();',
      "src/e.ts": 'import type { AccountState } from "./useAccount";',
      "src/features/pilot/SessionGate.tsx": "const account = useAccount(redirectTo);",
    })).toEqual(["src/a.tsx", "src/b.tsx", "src/c.tsx"]);
  });
});
