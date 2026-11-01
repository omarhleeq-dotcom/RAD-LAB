import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
test("rule B parser moves destinations while preserving prose, code, titles and fragments", () => {
  const script = fileURLToPath(new URL("verify_restructure.py", import.meta.url));
  const code = `import importlib.util
spec=importlib.util.spec_from_file_location('proof',${JSON.stringify(script)})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
s='[label](a.md#id "title") and ![image](<img (1).png>)\\n[ref]: a.md#id\\n<img src="a.md">\\n\u0060[a](a.md)\u0060\\n\u0060\u0060\u0060md\\n[a](a.md)\\n\u0060\u0060\u0060\\n'
n=m.relocate(s,'docs/a.md','docs/archive/a.md',{'docs/a.md':'docs/archive/a.md'})
assert m.strip_targets(s)==m.strip_targets(n)
assert '[label](a.md#id "title")' in n
assert '<../img%20(1).png>' in n
assert '[ref]: a.md#id' in n
assert '\u0060[a](a.md)\u0060' in n
assert n==m.relocate(n,'docs/archive/a.md','docs/archive/a.md',{})
print('PASS')`;
  assert.match(execFileSync("python3", ["-B", "-c", code], { encoding: "utf8" }), /PASS/);
});
