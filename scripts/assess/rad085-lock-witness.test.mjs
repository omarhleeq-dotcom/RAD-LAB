// Required in CI; no dump tools, provider connection, skip, or baseline rewrite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehearse } from './rad085-security-rehearsal.mjs';
for (const baseline of [true, false]) test(`pinned audit regression witnesses: ${baseline ? 'old defects reproduced' : 'corrected source rejects'}`, async () => {
 const r = await rehearse({baseline, lockWitnessOnly: true});
 assert.equal(r.findings.bridgeReadAfterExpiry.returned, baseline);
 assert.match(r.findings.ownerManagedMemberDelete, baseline ? /42501/ : /fixed/);
 assert.equal(r.checks.expiryAfterAdvisoryWaitRejected, !baseline);
 assert.equal(r.checks.expiryAfterVersionWaitRejected, !baseline);
 assert.equal(r.checks.proposedFixesOnlyInSyntheticDatabase, true);
 assert.equal(r.checks.roleBoundary, true);
 assert.equal(r.cleanup, true);
 assert.equal(r.checks.dumpRestoreExact, undefined);
});
