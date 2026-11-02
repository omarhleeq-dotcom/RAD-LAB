import { GradingError, type GradingIssue, type ManualGradingPort } from './manual-grading-data';
import type { ManualFinalReceipt, ManualQueue, ManualRead, ManualScoreCommand } from './server-manual-contracts';

// Decimal comparison in integer micro-points; never round through binary floats.
const micro = (s: string) => {
 if (!/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(s)) return null;
 const [whole, fraction = ''] = s.split('.');
 return BigInt(whole!) * 1000000n + BigInt(fraction.padEnd(6, '0'));
};
export function validManualScore(value: string, maximum: string) {
 const n = micro(value), max = micro(maximum);
 return n !== null && max !== null && n <= max;
}
type Pending = { kind: 'score'; command: ManualScoreCommand } | { kind: 'finalize'; attempt: string; operation: string; revision: number };
export interface GradingState {
 queue: ManualQueue | null; read: ManualRead | null; receipt: ManualFinalReceipt | null;
 attempt: string | null; drafts: string[]; pending: Pending | null; busy: boolean;
 issue: GradingIssue | null; suspended: boolean; takeover: boolean;
}
const initial = (): GradingState => ({ queue: null, read: null, receipt: null, attempt: null, drafts: [], pending: null, busy: false, issue: null, suspended: false, takeover: false });
/** Screen lifetime only. No persisted answers, scores, identities or operation IDs. */
export class ManualGradingController {
 state = initial();
 private generation = 0;
 constructor(private port: ManualGradingPort, private owner: boolean, private changed: () => void, private operation = () => crypto.randomUUID()) {}
 private emit() { this.changed(); }
 clear(suspended = true) { this.generation++; this.state = { ...initial(), suspended }; this.emit(); }
 // Preserve only an uncertain operation while the page is hidden. Replayed with
 // the same payload after fresh authorization; answers and visible scores are cleared.
 suspend() {
  const { pending, attempt } = this.state;
  this.clear(); this.state = { ...this.state, pending, attempt }; this.emit();
 }
 edit(index: number, value: string) {
  if (this.state.busy || this.state.pending || this.state.receipt || !this.state.read) return;
  this.state = { ...this.state, drafts: this.state.drafts.map((v, i) => i === index ? value : v) }; this.emit();
 }
 confirmTakeover(value: boolean) { this.state = { ...this.state, takeover: value }; this.emit(); }
 get valid() { return !!this.state.read && this.state.read.items.every((item, i) => validManualScore(this.state.drafts[i] ?? '', item.maximum)); }
 get dirty() { return !!this.state.read && this.state.read.items.some((item, i) => this.state.drafts[i] !== item.score); }
 private async run(work: (current: () => boolean) => Promise<void>) {
  if (this.state.busy) return;
  const generation = this.generation, current = () => this.generation === generation;
  this.state = { ...this.state, busy: true, issue: null }; this.emit();
  try { await work(current); }
  catch (error) {
   if (!current()) return;
   let failure = error;
   if (error instanceof GradingError && error.kind === 'closed') {
    try { await this.closed(this.state.attempt, current); return; }
    catch (recoveryError) { failure = recoveryError; }
   }
   if (!current()) return;
   const issue = failure instanceof GradingError ? failure.kind : 'unavailable';
   if (issue === 'denied') this.clear(false);
   this.state = { ...this.state, issue, ...(failure instanceof GradingError && !failure.uncertain ? { pending: null } : {}) };
   this.emit();
  } finally { if (current()) { this.state = { ...this.state, busy: false }; this.emit(); } }
 }
 private async closed(attempt: string | null, current: () => boolean) {
  // Discard the rejected operation and loaded answers before any follow-up read.
  this.state = { ...initial(), busy: true, issue: 'closed' }; this.emit();
  if (attempt) {
   try {
    const receipt = await this.port.receipt(attempt);
    if (!current()) return;
    if (receipt) { this.state = { ...this.state, attempt, receipt, issue: null }; return; }
   } catch { /* Held/expired attempts can reject receipt reads too; no final state is inferred. */ }
  }
  if (!current()) return;
  try {
   const queue = await this.port.queue(null, 20);
   if (current()) this.state = { ...this.state, queue };
  } catch (error) {
   if (!current()) return;
   if (error instanceof GradingError && error.kind === 'denied') throw error;
   // Stay on the queue with the closed message and navigation/refresh available.
  }
 }
 async queue(more = false) {
  await this.run(async current => {
   const page = await this.port.queue(more ? this.state.queue?.next : null, 20);
   if (current()) this.state = { ...this.state, suspended: false, queue: { rows: [...(more ? this.state.queue?.rows ?? [] : []), ...page.rows], next: page.next } };
  });
 }
 private async load(attempt: string, current: () => boolean) {
  const receipt = await this.port.receipt(attempt);
  if (!current()) return;
  if (receipt) { this.state = { ...this.state, attempt, receipt, read: null, drafts: [], pending: null, suspended: false }; return; }
  const read = await this.port.read(attempt);
  if (current()) this.state = { ...this.state, attempt, read, receipt: null, drafts: read.items.map(i => i.score ?? ''), suspended: false };
 }
 async open(attempt: string) {
  if (this.state.pending) return;
  this.state = { ...this.state, read: null, receipt: null, drafts: [], takeover: false, attempt };
  await this.run(current => this.load(attempt, current));
 }
 async refresh() {
  const attempt = this.state.attempt;
  if (!attempt) return this.queue();
  await this.run(current => this.load(attempt, current));
 }
 async save() {
  if (!this.state.read || !this.valid || !this.dirty || this.state.read.operationCount >= 100 || this.state.pending || (this.owner && !this.state.takeover)) return;
  const read = this.state.read;
  this.state = { ...this.state, pending: { kind: 'score', command: {
   schemaVersion: 1, attemptId: read.attemptId, operationId: this.operation(), expectedGradingRevision: read.gradingRevision,
   scores: read.items.map((i, n) => ({ item: i.item, score: this.state.drafts[n]! })),
   reason: this.owner ? 'owner-takeover' : read.operationCount ? 'correction' : 'initial',
  } } };
  await this.retry();
 }
 async finalize() {
  if (!this.state.read || !this.valid || this.dirty || this.state.pending || (this.owner && !this.state.takeover)) return;
  this.state = { ...this.state, pending: { kind: 'finalize', attempt: this.state.read.attemptId, operation: this.operation(), revision: this.state.read.gradingRevision } };
  await this.retry();
 }
 async retry() {
  const pending = this.state.pending;
  if (!pending) return;
  await this.run(async current => {
   try {
    if (pending.kind === 'score') {
     await this.port.score(pending.command);
     if (!current()) return;
     this.state = { ...this.state, pending: null };
     await this.load(pending.command.attemptId, current);
    } else {
     const receipt = await this.port.finalize(pending.attempt, pending.operation, pending.revision);
     if (current()) this.state = { ...this.state, receipt, read: null, drafts: [], pending: null, suspended: false };
    }
   } catch (error) {
    if (error instanceof GradingError && !error.uncertain && this.state.pending === pending) {
     this.state = { ...this.state, pending: null }; this.emit();
    }
    if (!current()) return;
    // Follow-up read failures cannot make a definite write rejection uncertain.
    // Receipt is authoritative; an unavailable response alone proves no final state.
    if (error instanceof GradingError && ['conflict', 'unavailable', 'limit'].includes(error.kind)) {
     const attempt = pending.kind === 'score' ? pending.command.attemptId : pending.attempt;
     let receipt: ManualFinalReceipt | null;
     try { receipt = await this.port.receipt(attempt); }
     catch (receiptError) {
      // A receipt lookup rejection cannot settle an earlier transport-uncertain
      // write. Closed/denied still end the screen's access to that attempt.
      if (error.uncertain && !(receiptError instanceof GradingError && ['closed', 'denied'].includes(receiptError.kind))) throw error;
      throw receiptError;
     }
     if (!current()) return;
     if (receipt) { this.state = { ...this.state, receipt, read: null, drafts: [], pending: null, suspended: false }; return; }
     if (error.kind === 'conflict' || error.kind === 'limit') {
      this.state = { ...this.state, pending: null };
      await this.load(attempt, current);
     }
    }
    throw error;
   }
  });
 }
}
