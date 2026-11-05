/** RAD-105 P5: external restore witness (RAD-097). Pure decision plus a REST store with injected fetch/token; all times come from the DB clock. */
export type DbWitness = { epoch: string; seq: number; now: string; acceptedAt: string; credentialValidUntil: string | null };
export type StoredWitness = { projectRef: string; epoch: string; seq: number; updatedAt: string };
export type WitnessVerdict =
 | { ok: true; action: 'init' | 'advance' | 'adopt'; next: StoredWitness }
 | { ok: false; code: 'db-witness-missing' | 'witness-unreadable' | 'project-mismatch' | 'epoch-mismatch' | 'restore-suspected' };
const isoMs = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? Date.parse(v) : NaN;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function parseDbWitness(raw: unknown): DbWitness | null {
 const w = raw as Partial<DbWitness> | null | undefined;
 if (!w || typeof w !== 'object' || typeof w.epoch !== 'string' || !uuid.test(w.epoch) || !Number.isSafeInteger(w.seq) || (w.seq as number) < 0 ||
  !Number.isFinite(isoMs(w.now)) || !Number.isFinite(isoMs(w.acceptedAt))) return null;
 return { epoch: w.epoch, seq: w.seq as number, now: w.now as string, acceptedAt: w.acceptedAt as string, credentialValidUntil: typeof w.credentialValidUntil === 'string' ? w.credentialValidUntil : null };
}
/** stored: null = no object yet (first run); 'unreadable' = any read/parse failure (fails closed). */
export function judgeWitness(projectRef: string, db: DbWitness | null, stored: StoredWitness | null | 'unreadable'): WitnessVerdict {
 if (!db) return { ok: false, code: 'db-witness-missing' };
 if (stored === 'unreadable') return { ok: false, code: 'witness-unreadable' };
 const next = (): StoredWitness => ({ projectRef, epoch: db.epoch, seq: db.seq, updatedAt: db.now }); // updatedAt = DB clock
 if (stored === null) return { ok: true, action: 'init', next: next() };
 if (stored.projectRef !== projectRef) return { ok: false, code: 'project-mismatch' };
 if (stored.epoch !== db.epoch) {
  // Only the owner's "Accept restored database" (accepted_at stamped by the DB clock after the last witness write) may change the epoch.
  return isoMs(db.acceptedAt) > isoMs(stored.updatedAt) ? { ok: true, action: 'adopt', next: next() } : { ok: false, code: 'epoch-mismatch' };
 }
 return db.seq >= stored.seq ? { ok: true, action: 'advance', next: next() } : { ok: false, code: 'restore-suspected' };
}
export function parseStoredWitness(raw: unknown): StoredWitness | null {
 const w = raw as Partial<StoredWitness> | null;
 if (!w || typeof w !== 'object' || Object.keys(w).sort().join() !== 'epoch,projectRef,seq,updatedAt' || typeof w.projectRef !== 'string' || typeof w.epoch !== 'string' ||
  !uuid.test(w.epoch) || !Number.isSafeInteger(w.seq) || (w.seq as number) < 0 || !Number.isFinite(isoMs(w.updatedAt))) return null;
 return w as StoredWitness;
}
export type WitnessStore = { read(): Promise<{ value: StoredWitness | null; generation: string } | 'unreadable'>; write(value: StoredWitness, generation: string): Promise<boolean> };
type Fetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ status: number; headers: { get(name: string): string | null }; text(): Promise<string> }>;
/** Google Cloud Storage JSON API with generation preconditions. Endpoints and headers follow the public JSON API and are NOT verified here (P7 shadow mode proves reachability). */
export function gcsWitnessStore(bucket: string, object: string, token: () => Promise<string>, fetchImpl: Fetch): WitnessStore {
 const b = encodeURIComponent(bucket), o = encodeURIComponent(object);
 return {
  async read() {
   try {
    const r = await fetchImpl(`https://storage.googleapis.com/storage/v1/b/${b}/o/${o}?alt=media`, { headers: { authorization: 'Bearer ' + await token() } });
    if (r.status === 404) return { value: null, generation: '0' };
    const generation = r.headers.get('x-goog-generation');
    if (r.status !== 200 || !generation || !/^\d+$/.test(generation)) return 'unreadable';
    const value = parseStoredWitness(JSON.parse(await r.text()));
    return value ? { value, generation } : 'unreadable';
   } catch { return 'unreadable'; }
  },
  async write(value, generation) {
   try {
    const r = await fetchImpl(`https://storage.googleapis.com/upload/storage/v1/b/${b}/o?uploadType=media&name=${o}&ifGenerationMatch=${encodeURIComponent(generation)}`,
     { method: 'POST', headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json' }, body: JSON.stringify(value) });
    return r.status === 200;
   } catch { return false; }
  },
 };
}
