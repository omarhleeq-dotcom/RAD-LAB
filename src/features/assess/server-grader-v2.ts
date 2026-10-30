/** Private v2 automatic grading. Existing simulator evaluation is reused unchanged. */
import type { AssessmentPublicationV2 } from './server-contracts-v2';
import type { ItemAnswer } from './contracts';
import type { AssessmentPublication, PrivateItemVersion } from './server-contracts';
import { validatePublicationV2 } from './server-validation';
import { gradePublication } from './server-grader';
import { decimalPoints, type Fraction } from './policies';
export function gradePublicationV2(input: AssessmentPublicationV2, answers: Record<string, ItemAnswer>, locked: readonly string[]) {
 const { publication } = validatePublicationV2(input);
 const items = publication.assessment.items;
 if (Object.keys(answers).some(id => !items.some(i => i.ref.id === id && i.type !== 'written-answer')) ||
  locked.some(id => !items.some(i => i.ref.id === id && ['simulator-part', 'full-practical'].includes(i.type)))) throw Error('Invalid automatic answer');
 let total: Fraction = { numerator: 0n, denominator: 1n };
 for (const item of items) {
  if (item.type === 'written-answer') continue;
  const answer = answers[item.ref.id]; if (!answer) continue;
  if (answer.type !== item.type) throw Error('Answer type mismatch');
  const key = publication.privateItems.find(k => k.ref.id === item.ref.id)!;
  const mark = publication.itemMarks.find(m => m.item.id === item.ref.id)!;
  let earned: Fraction;
  if (item.type === 'single-choice' && key.type === 'single-choice' && answer.type === 'single-choice') {
   if (answer.optionId !== null && !item.options.some(o => o.id === answer.optionId)) throw Error('Invalid option');
   earned = answer.optionId === key.correctOptionId ? decimalPoints(mark.maximum) : { numerator: 0n, denominator: 1n };
  } else {
   // Only simulator-reviewed content can enter the old evaluator. No invented
   // reviewer for uploader-authored choice/written items and no score changes.
   if (key.provenance.kind !== 'simulator-reviewed') throw Error('Simulator review required');
   const { provenance, ...privateKey } = key;
   const assessment = { ...publication.assessment }; delete assessment.randomPool;
   const legacy: AssessmentPublication = { schemaVersion: 1,
    assessment: { ...assessment, schemaVersion: 1, maximum: mark.maximum,
     items: [{ ...item, schemaVersion: 1 }] } as AssessmentPublication['assessment'],
    itemMarks: [mark], privateItems: [{ ...privateKey, schemaVersion: 1, review: provenance.review } as PrivateItemVersion] };
   const result = gradePublication(legacy, { [item.ref.id]: answer }, locked.filter(id => id === item.ref.id));
   earned = { numerator: BigInt(result.numerator), denominator: BigInt(result.denominator) };
  }
  total = { numerator: total.numerator * earned.denominator + earned.numerator * total.denominator, denominator: total.denominator * earned.denominator };
  const gcd = (a: bigint, b: bigint): bigint => b ? gcd(b, a % b) : a;
  const divisor = gcd(total.numerator, total.denominator);
  total = { numerator: total.numerator / divisor, denominator: total.denominator / divisor };
 }
 return { numerator: String(total.numerator), denominator: String(total.denominator) };
}
