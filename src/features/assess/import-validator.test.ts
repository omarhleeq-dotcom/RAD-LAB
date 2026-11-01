import { expect, it } from 'vitest';
import { authoringPreviewV2, authoringV2Issues, draftToV2, importTableRows, optionLetter, rowToQuestion, validateAssessImportRowV1 } from './import-validator';
import { newDraft } from '../authoring-review/draft';
const batch = { reference: 'Own synthetic material', licenceNotes: 'Own engineering test only' };
const row = { Question: 'Synthetic question?', A: 'True', B: 'False', Answer: 'A' };
it('uses one values validator for default points, row references, all 50 letters and true/false without a new type', () => {
 expect(validateAssessImportRowV1(row, batch)).toMatchObject({ issues: [], value: { points: '1', reference: batch.reference } });
 expect(rowToQuestion(row, batch)).toMatchObject({ type: 'single-choice', shuffleOptions: true });
 expect(validateAssessImportRowV1({ ...row, Reference: 'Row source' }, batch).value.reference).toBe('Row source');
 expect(validateAssessImportRowV1({ ...row, Reference: ' ' }, batch).value.reference).toBe(batch.reference);
 const fifty = { ...row, ...Object.fromEntries(Array.from({ length: 50 }, (_, n) => [optionLetter(n), 'Value ' + n])), Answer: 'AX' };
 expect(validateAssessImportRowV1(fifty, batch).issues).toEqual([]);
 const q = rowToQuestion(fifty, batch); expect(q.correctOptionId).toBe(q.options[49]!.id);
 expect(validateAssessImportRowV1({ ...fifty, AY: '51' }, batch).issues).toContainEqual({ column: 'AY', code: 'column' });
});
it('rejects invalid rows with specific columns, missing rights and formula text without evaluating it', () => {
 for (const [bad, column, code] of [[{ ...row, Answer: '' }, 'Answer', 'answer'], [{ ...row, Answer: 'C', C: '' }, 'Answer', 'answer'], [{ ...row, B: '' }, 'A/B', 'options'], [{ ...row, Question: '' }, 'Question', 'required'], [{ ...row, Points: '0' }, 'Points', 'points'], [{ ...row, Points: '=1+1' }, 'Points', 'formula'], [{ ...row, Author: 'Forged' }, 'Author', 'column'], [{ ...row, Question: 'x'.repeat(10001) }, 'Question', 'length']] as const) expect(validateAssessImportRowV1(bad, batch).issues).toContainEqual({ column, code });
 expect(validateAssessImportRowV1(row, { reference: '', licenceNotes: '' }).issues).toEqual([{ column: 'Reference', code: 'required' }, { column: 'Licence', code: 'required' }]);
 for (const Points of ['NaN', 'Infinity', '-1', '1e2', '1.1234567']) expect(validateAssessImportRowV1({ ...row, Points }, batch).issues.some(i => i.column === 'Points')).toBe(true);
});
it('rejects duplicate, unknown, missing and attribution headers and reports extra cells at their source row', () => {
 for (const header of [['Question', 'A', 'A', 'Answer'], ['Question', 'A', 'B'], ['Question', 'A', 'B', 'Answer', 'Author'], ['Question', 'A', 'B', 'Answer', 'Licence']]) expect(() => importTableRows([header])).toThrow('header');
 const table = importTableRows([['Question', 'A', 'B', 'Answer'], ['Q', 'A', 'B', 'A', 'extra']]); expect(table[0]!.row).toBe(2); expect(validateAssessImportRowV1(table[0]!.values, batch).issues.some(i => i.code === 'column')).toBe(true);
});
it('whitelists v2 input, enforces equal decimal points, K/N and the full document size, never supplies an author', () => {
 const draft = { ...newDraft(), name: 'Synthetic assessment', randomPool: { version: 1 as const, size: 2 }, items: [rowToQuestion(row, batch), rowToQuestion({ ...row, Points: '1.000' }, batch)] };
 expect(authoringV2Issues(draft)).toEqual([]);
 draft.items[0]!.authoring.author = 'FORGED author';
 const wire = draftToV2(draft); expect(wire.schemaVersion).toBe(2); const preview = authoringPreviewV2(draft); expect(preview.items).toHaveLength(2); expect(JSON.stringify(preview)).not.toMatch(/correctOptionId|provenance|authoring|licence|FORGED|randomPool/); expect(JSON.stringify(wire)).not.toContain('FORGED'); expect(JSON.stringify(wire)).not.toMatch(/authorDisplayName|reviewedBy|authoring|notes"/);
 const unequal = structuredClone(draft); unequal.items[1]!.maximum = '2'; expect(authoringV2Issues(unequal)).toContainEqual({ path: 'K/N', message: 'pool_points_must_be_equal' });
 expect(authoringV2Issues({ ...draft, randomPool: { version: 1, size: 3 } })).toContainEqual({ path: 'K/N', message: 'pool_size_exceeds_questions' });
 expect(() => draftToV2({ ...draft, items: draft.items.slice(1) })).toThrow();
 const big = { ...draft, randomPool: { version: 1 as const, size: 1 }, items: Array.from({ length: 8 }, () => rowToQuestion({ ...row, Question: 'Q'.repeat(9000) }, batch)) };
 expect(() => draftToV2(big)).toThrow('documentLimit');
});
