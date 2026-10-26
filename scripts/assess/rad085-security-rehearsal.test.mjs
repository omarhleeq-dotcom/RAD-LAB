import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehearse } from './rad085-security-rehearsal.mjs';

test('isolated upgrade, privilege rejection, lock findings, dump/restore and cleanup',async()=>{
 const result=await rehearse();
 assert.equal(result.provider,false);assert.equal(result.worker,false);
 assert.equal(result.checks.legacyCompatibility,true);
 assert.equal(result.checks.roleBoundary,true);
 assert.equal(result.checks.failedMigrations.length,3);
 assert.equal(result.checks.dumpRestoreExact,true);
 assert.equal(result.cleanup,true);
 assert.equal(result.findings.bridgeReadAfterExpiry.returned,false);
 assert.match(result.findings.ownerManagedMemberDelete,/fixed/);
});
test('pinned audited head independently reproduces both corrected defects',async()=>{
 const result=await rehearse({baseline:true});
 assert.equal(result.findings.bridgeReadAfterExpiry.returned,true);
 assert.match(result.findings.ownerManagedMemberDelete,/42501/);
 assert.equal(result.checks.proposedFixesOnlyInSyntheticDatabase,true);
 assert.equal(result.cleanup,true);
});
