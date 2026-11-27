/** Server-anchored student state; never infer emergency replacement eligibility here. */
export type StudentExamKind = 'unavailable' | 'cancelled' | 'upcoming' | 'open' | 'in-progress' | 'submitted' | 'grading' | 'graded' | 'missed' | 'expired';
export type WindowInfo = { opensAt: string; closesAt: string; closed: boolean; now: string };
export type SessionInfo = { state: 'active' | 'grading' | 'graded' | 'grading-failed' | 'awaiting-manual' | 'void'; deadline: string | null; resultReady: boolean; held?: boolean; expiresAt?: string | null; grading?: boolean };
export function studentExamKind(window: WindowInfo | null, session: SessionInfo | null): StudentExamKind {
 if (!window) return 'unavailable';
 const now=Date.parse(window.now),opens=Date.parse(window.opensAt),closes=Date.parse(window.closesAt);
 if (![now,opens,closes].every(Number.isFinite)) return 'unavailable';
 if (session) {
  if (session.expiresAt && now>=Date.parse(session.expiresAt) || session.state==='void') return 'expired';
  if (session.held) return 'unavailable';
  if (session.resultReady) return 'graded';
  if (session.state==='active') return session.deadline&&now<Date.parse(session.deadline)?'in-progress':'expired';
  if (session.grading || session.state==='awaiting-manual') return 'grading';
  return 'submitted';
 }
 if(window.closed)return 'cancelled';
 if(now<opens)return 'upcoming';
 return now<closes?'open':'missed';
}
