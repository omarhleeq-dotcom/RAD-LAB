/** Shared browser/server validator: author input is never review evidence. */
import type { AuthoringProvenanceInputV2, ContentProvenanceV2 } from './contracts-v2';
function object(v: unknown): asserts v is Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('invalid_provenance'); }
function keys(v: Record<string, unknown>, allowed: string[]) { if (Object.keys(v).some(k => !allowed.includes(k))) throw Error('forbidden_provenance_field'); }
function text(v: unknown, max = 2000): asserts v is string { if (typeof v !== 'string' || !v.trim() || [...v].length > max) throw Error('provenance_text_required'); }
function sources(v: unknown) { if (!Array.isArray(v) || !v.length || v.length > 50) throw Error('sources_required'); for (const s of v) { object(s); keys(s, ['reference', 'licenceEvidence']); text(s.reference); text(s.licenceEvidence); } }
export function validateProvenanceV2(value: unknown, type: string, input: true): AuthoringProvenanceInputV2;
export function validateProvenanceV2(value: unknown, type: string, input?: false): ContentProvenanceV2;
export function validateProvenanceV2(value: unknown, type: string, input = false): ContentProvenanceV2 | AuthoringProvenanceInputV2 {
 object(value);
 if (type === 'single-choice' || type === 'written-answer') {
  keys(value, ['kind', 'reviewStatus', 'sources', 'licenceNotes', ...(input ? [] : ['authorDisplayName'])]);
  if (value.kind !== 'uploader-authored' || value.reviewStatus !== 'no-medical-review') throw Error('no_medical_review_required');
  sources(value.sources); text(value.licenceNotes);
  if (!input && value.authorDisplayName !== null) text(value.authorDisplayName, 100);
 } else if (type === 'simulator-part' || type === 'full-practical') {
  keys(value, input ? ['kind'] : ['kind', 'review']);
  if (value.kind !== 'simulator-reviewed') throw Error('simulator_review_required');
  if (!input) { object(value.review); const r = value.review; keys(r, ['sources', 'reviewedBy', 'reviewedAt', 'scope']); sources(r.sources); text(r.reviewedBy, 100); text(r.scope); text(r.reviewedAt, 100); if (new Date(r.reviewedAt).toISOString() !== r.reviewedAt) throw Error('invalid_review_date'); }
 } else throw Error('unsupported_provenance_type');
 return value as ContentProvenanceV2 | AuthoringProvenanceInputV2;
}
