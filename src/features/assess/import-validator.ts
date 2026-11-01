import type { Draft, DraftItem, StudentPreviewData } from '../authoring-review/contracts';
import type { AuthoringDraftV2 } from './contracts-v2';
import { assertAttemptPolicy, decimalPoints } from './policies';
import { AUTHORING_LIMITS_V1 } from './authoring-limits';
import { randomPoolMaximum } from './random-pool';
import { validateProvenanceV2 } from './provenance-v2';
import { IMPORT_LIMITS, ImportError, MISSING_CACHED_VALUE, XLSX_VALUES, type ImportTable } from './import-parser';
export type BatchNotes = { reference: string; licenceNotes: string };
export type ImportRow = Record<string, string> & { [XLSX_VALUES]?: true };
export type RowIssue = { column: string; code: 'required' | 'answer' | 'options' | 'points' | 'formula' | 'length' | 'column' };
export type ChoiceDraft = Extract<DraftItem, { type: 'single-choice' }>;
export function optionLetter(index: number): string { return index < 26 ? String.fromCharCode(65 + index) : 'A' + String.fromCharCode(65 + index - 26); }
export const OPTION_COLUMNS = Array.from({ length: IMPORT_LIMITS.options }, (_, n) => optionLetter(n));
const allowed = new Set(['Question', ...OPTION_COLUMNS, 'Answer', 'Points', 'Reference']);
/** The single validator for form, paste and both file formats. Formula text is never evaluated. */
export function validateAssessImportRowV1(row: ImportRow, batch: BatchNotes) {
 const issues: RowIssue[] = [], add = (column: string, code: RowIssue['code']) => issues.push({ column, code });
 for (const [key, value] of Object.entries(row)) {
  if (!allowed.has(key)) add(key, 'column');
  if ((!row[XLSX_VALUES] && /^\s*(?:[=@]|[+-][\p{L}(])/u.test(value)) || value.includes(MISSING_CACHED_VALUE)) add(key, 'formula');
 }
 row = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.replaceAll(MISSING_CACHED_VALUE, '')]));
 const question = row.Question ?? '', reference = row.Reference?.trim() ? row.Reference : batch.reference, licenceNotes = batch.licenceNotes;
 if (!question.trim()) add('Question', 'required');
 if ([...question].length > 10000) add('Question', 'length');
 const options = OPTION_COLUMNS.filter(key => row[key]?.trim()).map(key => ({ letter: key, text: row[key]! }));
 if (options.length < 2 || options.length > IMPORT_LIMITS.options || !row.A?.trim() || !row.B?.trim()) add('A/B', 'options');
 for (const o of options) if ([...o.text].length > 5000) add(o.letter, 'length');
 const answer = row.Answer?.trim() ?? '';
 if (!options.some(o => o.letter === answer)) add('Answer', 'answer');
 const points = row.Points?.trim() || '1';
 try { if (decimalPoints(points).numerator <= 0n) throw Error(); } catch { add('Points', 'points'); }
 for (const [column, value] of [['Reference', reference], ['Licence', licenceNotes]]) {
  if (!value!.trim()) add(column!, 'required');
  if ([...value!].length > 2000) add(column!, 'length');
 }
 return { issues, value: { question, options, answer, points, reference, licenceNotes } };
}
export function importTableRows(table: ImportTable): { row: number; values: ImportRow }[] {
 const header = table[0]?.map(v => v.trim()) ?? [];
 if (!header.length || new Set(header).size !== header.length || header.some(h => !allowed.has(h)) || ['Question', 'A', 'B', 'Answer'].some(h => !header.includes(h))) throw new ImportError('header');
 return table.slice(1).map((row, n) => ({ row: n + 2, values: { ...(table[XLSX_VALUES] ? { [XLSX_VALUES]: true as const } : {}), ...Object.fromEntries(header.map((h, i) => [h, row[i] ?? ''])), ...(row.length > header.length ? { __extra: 'Unexpected cells' } : {}) } }));
}
export function rowToQuestion(row: ImportRow, batch: BatchNotes): ChoiceDraft {
 const result = validateAssessImportRowV1(row, batch); if (result.issues.length) throw Error('invalid_import_row');
 const value = result.value, options = value.options.map(o => ({ id: crypto.randomUUID(), text: o.text }));
 return { id: crypto.randomUUID(), type: 'single-choice', prompt: value.question, options, correctOptionId: options[value.options.findIndex(o => o.letter === value.answer)]!.id, maximum: value.points, shuffleOptions: true, authoring: { author: '', reference: value.reference, licenceNotes: value.licenceNotes, notes: '' } };
}
export function questionToRow(item: ChoiceDraft): ImportRow {
 // Draft text is already stored content, not a spreadsheet expression. Never reclassify it on reopen/save.
 return { [XLSX_VALUES]: true, Question: item.prompt, ...Object.fromEntries(item.options.map((o, n) => [optionLetter(n), o.text])), Answer: optionLetter(item.options.findIndex(o => o.id === item.correctOptionId)), Points: item.maximum, Reference: item.authoring.reference };
}
export function authoringV2Issues(draft: Draft): { path: string; message: string }[] {
 const issues: { path: string; message: string }[] = [];
 if (!draft.name.trim() || [...draft.name].length > 200) issues.push({ path: 'name', message: 'required' });
 try { assertAttemptPolicy(draft.policy); if ((draft.policy.durationSeconds ?? 0) > 604800 || draft.policy.maxAttempts > 1000) throw Error(); } catch { issues.push({ path: 'policy', message: 'policy' }); }
 if (draft.track === 'full-practical' || !draft.items.length || draft.items.length > 200 || new Set(draft.items.map(i => i.id)).size !== draft.items.length) issues.push({ path: 'items', message: 'limit' });
 draft.items.forEach((item, n) => {
  if (item.type !== 'single-choice') { issues.push({ path: `items.${n + 1}`, message: 'options' }); return; }
  if (item.options.length > 50 || new Set(item.options.map(o => o.id)).size !== item.options.length || item.options.some(o => !o.id)) issues.push({ path: `items.${n + 1}`, message: 'options' });
  for (const issue of validateAssessImportRowV1(questionToRow(item), item.authoring).issues) issues.push({ path: `items.${n + 1}.${issue.column}`, message: issue.code });
 });
 try { randomPoolMaximum(draft.items.map(i => ({ ...i, maximum: i.type === 'full-practical' ? '1' : i.maximum })), draft.randomPool ?? { version: 1, size: draft.items.length }); }
 catch (e) { issues.push({ path: 'K/N', message: e instanceof Error ? e.message : 'pool_size_exceeds_questions' }); }
 return issues;
}
/** Whitelist the wire contract: attribution, private notes and file columns cannot cross it. */
export function draftToV2(draft: Draft): AuthoringDraftV2 {
 if (authoringV2Issues(draft).length) throw Error('invalid_import_draft');
 const document: AuthoringDraftV2 = { schemaVersion: 2, id: draft.id, revision: draft.revision, name: draft.name, track: 'mixed', policy: { ...draft.policy }, randomPool: { version: 1, size: draft.randomPool?.size ?? draft.items.length }, items: draft.items.map(item => {
  if (item.type !== 'single-choice') throw Error('unsupported_import_item');
  const provenance = validateProvenanceV2({ kind: 'uploader-authored', reviewStatus: 'no-medical-review', sources: [{ reference: item.authoring.reference, licenceEvidence: item.authoring.licenceNotes }], licenceNotes: item.authoring.licenceNotes }, 'single-choice', true);
  return { id: item.id, type: 'single-choice', prompt: item.prompt, maximum: item.maximum, options: item.options.map(o => ({ id: o.id, text: o.text })), correctOptionId: item.correctOptionId, shuffleOptions: item.shuffleOptions ?? true, provenance };
 }) };
 if (new TextEncoder().encode(JSON.stringify(document)).length > AUTHORING_LIMITS_V1.documentBytes) throw Error('documentLimit');
 return document;
}

/** Author preview uses the existing display DTO, with no attribution or answer key. */
export function authoringPreviewV2(draft: Draft): StudentPreviewData {
 const document = draftToV2(draft);
 return { name: document.name, policy: { ...document.policy }, items: document.items.map(item => {
  if (item.type !== 'single-choice') throw Error('unsupported_import_item');
  return { schemaVersion: 1, ref: { id: item.id, version: String(document.revision) }, contentLanguage: 'en', prompt: item.prompt, type: 'single-choice', options: item.options.map(option => ({ id: option.id, text: option.text })) };
 }) };
}
