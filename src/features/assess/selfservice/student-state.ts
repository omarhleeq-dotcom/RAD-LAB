/** RAD-105 P2: the student's view of one scheduled exam, from server-provided times only (never the device clock). */
export type StudentExamKind = 'unavailable' | 'cancelled' | 'upcoming' | 'open' | 'in-progress' | 'submitted' | 'graded' | 'missed';
export type WindowInfo = { opensAt: string; closesAt: string; closed: boolean; now: string };
export type SessionInfo = { state: 'active' | 'grading' | 'grading-failed' | 'awaiting-manual' | 'void'; deadline: string | null; resultReady: boolean };
export function studentExamKind(window: WindowInfo | null, session: SessionInfo | null): StudentExamKind {
 if (!window) return 'unavailable';
 const now = Date.parse(window.now), opens = Date.parse(window.opensAt), closes = Date.parse(window.closesAt);
 if (![now, opens, closes].every(Number.isFinite)) return 'unavailable';
 if (session) {
  if (session.resultReady) return 'graded';
  if (session.state === 'active') return session.deadline && now < Date.parse(session.deadline) ? 'in-progress' : 'submitted';
  return 'submitted';
 }
 if (window.closed) return 'cancelled';
 if (now < opens) return 'upcoming';
 if (now < closes) return 'open';
 return 'missed';
}
