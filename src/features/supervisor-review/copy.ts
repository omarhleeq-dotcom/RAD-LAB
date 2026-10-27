import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
/** Local harness strings share the existing message catalogues with the app. */
export const copy = { en: en.supervisorReview, ar: ar.supervisorReview };
export const appCopy = { en: en.supervisor, ar: ar.supervisor };
export type ReviewCopy = { [K in keyof typeof copy.en]: string };
