import { mkdtempSync,mkdirSync,writeFileSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { expect,it } from "vitest";

// The fast prefilter must retain the previous AST semantics, including roots
// with escapes and literal statements outside a directive prologue.
it("keeps escaped client roots, follows ordinary dependencies, and rejects textual false positives",()=>{
  const root=mkdtempSync(join(tmpdir(),"radlab-client-discovery-"));
  try{
    mkdirSync(join(root,"src"));
    const files:Record<string,string>={
      "ordinary.tsx":'"use client"; import {value} from "./plain"; export const a=value;',
      "escaped-space.tsx":'"use\\x20client"; export const b=1;',
      "escaped-letter.tsx":'"use \\u0063lient"; export const c=1;',
      "late.tsx":'const before=1; "use client"; export const d=before;',
      "plain.ts":'export const value=1;',
      "server.ts":'export const server=1;',
      "comment.tsx":'// "use client"\nexport const comment=1;',
      "nested.tsx":'export function nested(){ return "use client"; }',
      "template.tsx":'`use client`; export const template=1;',
      "other-escape.tsx":'"something\\nelse"; export const other=1;',
    };
    for(const [file,source] of Object.entries(files))writeFileSync(join(root,"src",file),source);
    const script=`import {inspectBrowserBoundaries} from ${JSON.stringify(new URL("../../../scripts/pages/pilot-schema-gate.mjs",import.meta.url).href)};console.log(JSON.stringify(inspectBrowserBoundaries(${JSON.stringify(root)})));`;
    const result=spawnSync(process.execPath,["--input-type=module","-e",script],{encoding:"utf8"});
    expect(result.status,result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).reachable).toEqual([
      "src/escaped-letter.tsx","src/escaped-space.tsx","src/late.tsx","src/ordinary.tsx","src/plain.ts",
    ]);
  }finally{rmSync(root,{recursive:true,force:true});}
});
