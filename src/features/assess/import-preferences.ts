type BatchNotes = { reference: string; licenceNotes: string };
const prefix = 'radlab:assess-import:v1:';
const empty = (): BatchNotes => ({ reference: '', licenceNotes: '' });
const key = (user: string) => prefix + user;
export function readImportNotes(user: string | null): BatchNotes {
 try {
  if (!user) { clearAuthoringBatchMemory(); return empty(); }
  for (let n = localStorage.length - 1; n >= 0; n--) { const name = localStorage.key(n); if (name?.startsWith(prefix) && name !== key(user)) localStorage.removeItem(name); }
  const value: unknown = JSON.parse(localStorage.getItem(key(user)) ?? 'null'); if (value && typeof value === 'object' && 'userId' in value && value.userId === user && 'reference' in value && 'licenceNotes' in value && typeof value.reference === 'string' && typeof value.licenceNotes === 'string' && [...value.reference].length <= 2000 && [...value.licenceNotes].length <= 2000) return { reference: value.reference, licenceNotes: value.licenceNotes };
  localStorage.removeItem(key(user));
 } catch { /* Storage is optional, never an authoring prerequisite. */ }
 return empty();
}
export function writeImportNotes(user: string, value: BatchNotes) { try { localStorage.setItem(key(user), JSON.stringify({ userId: user, ...value })); } catch { /* Private mode and quota errors keep the form usable. */ } }
export function clearAuthoringBatchMemory() {
 try { for (let n = localStorage.length - 1; n >= 0; n--) { const name = localStorage.key(n); if (name?.startsWith(prefix)) localStorage.removeItem(name); } } catch { /* Sign-out must still complete if storage is inaccessible. */ }
}
