// RAD085-P1-B-20261028: required generator/real PostgreSQL proof also runs in normal CI.
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
it('requires the phone generator, exact readiness, indentation rejection and byte-exact rollback witnesses',()=>{
 const run=spawnSync(process.execPath,['--test','scripts/assess/phone-sql-packet.test.mjs'],{encoding:'utf8',timeout:120000,env:{...process.env,LD_LIBRARY_PATH:'/tmp/radlab-ops-postgres/node_modules/@embedded-postgres/linux-x64/native/lib'}});
 expect(run.status,run.stdout+run.stderr).toBe(0);expect(run.stdout).toMatch(/fail 0/);
},125000);
