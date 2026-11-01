type BatchNotes = { reference: string; licenceNotes: string };
const prefix = 'radlab:assess-import:v1:';
const empty = (): BatchNotes => ({ reference: '', licenceNotes: '' });
export const originalQuestionNotes = (author: string): BatchNotes => author ? { reference: `Original question by ${author}`, licenceNotes: `Original work by ${author}; provided to RAD-LAB for teaching and assessment use.` } : empty();
const key = (user: string) => prefix + user;
export function readImportNotes(user: string | null, author = ''): BatchNotes {
 try {
  if (!user) { clearAuthoringBatchMemory(); return empty(); }
  for (let n = localStorage.length - 1; n >= 0; n--) { const name = localStorage.key(n); if (name?.startsWith(prefix) && name !== key(user)) localStorage.removeItem(name); }
  const defaults = originalQuestionNotes(author);
  const value: unknown = JSON.parse(localStorage.getItem(key(user)) ?? 'null'); if (value && typeof value === 'object' && 'userId' in value && value.userId === user) {
   const result = { ...defaults };
   for (const field of ['reference', 'licenceNotes'] as const) { if (field in value) { const note = (value as Record<string, unknown>)[field]; if (typeof note !== 'string' || [...note].length > 2000) throw Error('invalid_notes'); result[field] = note; } }
   return result;
  }
  localStorage.removeItem(key(user));
 } catch { /* Storage is optional, never an authoring prerequisite. */ }
 return originalQuestionNotes(author);
}
export function writeImportNotes(user: string, value: BatchNotes, author = '') { try { const defaults = originalQuestionNotes(author); const edited = Object.fromEntries(Object.entries(value).filter(([field, note]) => (field === 'reference' || field === 'licenceNotes') && (!author || note !== defaults[field]))); if (!Object.keys(edited).length) localStorage.removeItem(key(user)); else localStorage.setItem(key(user), JSON.stringify({ userId: user, ...edited })); } catch { /* Private mode and quota errors keep the form usable. */ } }
export function clearAuthoringBatchMemory() {
 try { for (let n = localStorage.length - 1; n >= 0; n--) { const name = localStorage.key(n); if (name?.startsWith(prefix)) localStorage.removeItem(name); } } catch { /* Sign-out must still complete if storage is inaccessible. */ }
}

export function rememberImportField(user: string, field: keyof BatchNotes, value: string, author: string) { writeImportNotes(user, { ...readImportNotes(user, author), [field]: value }, author); }
