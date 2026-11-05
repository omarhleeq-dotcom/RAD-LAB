/** RAD-105 P6: the read-only content inventory, and the honest count of reusable items in this repository. Synthetic only. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fixture } from './selfservice-fixture';
import { trialFixture } from '../../../scripts/assess/trial-fixture';

const sql = readFileSync('supabase/staged/self-service/p6-inventory.sql', 'utf8');
it('the inventory is read-only, never touches answer keys or learner data, and counts what is installed', async () => {
 expect(sql.replace(/^--.*$/gm, '')).not.toMatch(/specs|sessions|results|session_details|insert|update|delete|grant/i);
 const db = await fixture();
 try {
  const out = await db.admin.query(sql) as unknown as Array<{ rows: Array<Record<string, unknown>> }>;
  const rows = out.flatMap(r => r.rows);
  expect(rows[0]).toMatchObject({ name: 'SYNTHETIC', items: 3, single_choice: '3', available: true });
  expect(rows[1]).toMatchObject({ available_single_choice_items: '3' });
  expect((await db.admin.query('select count(*)::int c from assess.publications')).rows[0].c).toBe(1); // nothing written
 } finally { await db.close(); }
}, 120000);
it('the repository holds only two reusable auto-graded items, both non-clinical engineering fixtures: fewer than the 20 required', () => {
 const items = trialFixture('11111111-1111-4111-8111-111111111111', 'visible').assessment.items;
 expect(items.map(i => i.prompt)).toEqual(['Select the letter A.', 'Select the letter B.']);
 expect(items.every(i => i.type === 'single-choice')).toBe(true);
 expect(items.length).toBeLessThan(20);
});
