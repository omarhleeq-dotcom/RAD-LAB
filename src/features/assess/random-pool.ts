/** Versioned author/server validation only. Selection and randomness live in PostgreSQL. */
import { decimalPoints } from './policies';
import type { RandomPoolV1 } from './contracts-v2';
type MarkedItem = { id: string; type: string; maximum: string; shuffleOptions?: boolean };
export function randomPoolMaximum(items: readonly MarkedItem[], input?: unknown): string {
 const pool = items.filter(i => i.type === 'single-choice');
 let size = pool.length;
 for (const i of items) if (i.shuffleOptions !== undefined && (i.type !== 'single-choice' || typeof i.shuffleOptions !== 'boolean')) throw Error('invalid_option_shuffle');
 if (input !== undefined) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['version', 'size'].includes(k))) throw Error('invalid_random_pool');
  const value = input as RandomPoolV1;
  if (value.version !== 1 || !Number.isSafeInteger(value.size) || value.size < 1 || value.size > pool.length || items.length > 200) throw Error('pool_size_exceeds_questions');
  size = value.size;
  const first = decimalPoints(pool[0]!.maximum);
  if (pool.some(i => { const n = decimalPoints(i.maximum); return n.numerator * first.denominator !== first.numerator * n.denominator; })) throw Error('pool_points_must_be_equal');
 }
 const scale = Math.max(0, ...items.map(i => i.maximum.split('.')[1]?.length ?? 0));
 const unit = 10n ** BigInt(scale);
 const points = (value: string) => { const p = decimalPoints(value); if (p.numerator <= 0n) throw Error('invalid_points'); return p.numerator * unit / p.denominator; };
 const total = items.filter(i => i.type !== 'single-choice').reduce((sum, i) => sum + points(i.maximum), 0n)
  + (input === undefined ? pool.reduce((sum, i) => sum + points(i.maximum), 0n) : BigInt(size) * points(pool[0]!.maximum));
 const digits = total.toString().padStart(scale + 1, '0');
 return scale ? digits.slice(0, -scale) + '.' + digits.slice(-scale) : digits;
}
