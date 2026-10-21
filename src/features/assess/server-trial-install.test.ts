import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
it.each(["lf","crlf"])("checks atomic dormant installation and catalog tampering on a %s reference",lineEndings=>{
 const child=spawnSync(process.execPath,["scripts/assess/trial-install-rehearsal.mjs","--synthetic-disposable","--backend=pglite",`--line-endings=${lineEndings}`],{encoding:"utf8",timeout:60000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);
 expect(JSON.parse(child.stdout)).toMatchObject({outcome:"PASS",code:"complete",cleanup:true,checks:expect.arrayContaining(["failed-install-atomic","dormant-worker-stops","postinstall-acl-trigger-order-definer-rejected","no-reinstall-or-repair"])});
 expect(child.stdout).not.toMatch(/PRIVATE|00000000-|@example|prosrc/);
},65000);
it("rejects remote/extra selectors before a disposable database is opened",()=>{
 const child=spawnSync(process.execPath,["scripts/assess/trial-install-rehearsal.mjs","--synthetic-disposable","--backend=https://PRIVATE","--line-endings=lf"],{encoding:"utf8",timeout:10000});
 expect(child.status).toBe(1);expect(JSON.parse(child.stdout)).toMatchObject({outcome:"STOP",code:"configuration",checks:[],cleanup:true});expect(child.stdout).not.toContain("PRIVATE");
});
