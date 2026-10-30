/** Explicit dual-version reader. v1 still rejects v2; no fabricated review conversion. */
import { validatePublication, validatePublicationV2 } from './server-validation';
export { validatePublicationV2 };
export function readPublicationV2(input: unknown) {
 if (input && typeof input === 'object' && 'schemaVersion' in input && input.schemaVersion === 1) return validatePublication(input);
 return validatePublicationV2(input);
}
