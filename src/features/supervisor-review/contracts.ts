/** Review DTO v1 only: operation semantics, not a database schema or RPC design. */
export type Person = { id: string; name: string; role: 'owner' | 'supervisor' | 'student' };
export type Group = { id: string; name: string; supervisorId: string; startsAt: number; supervisedFrom: number; endsAt: number; revision: number };
export type JoinRequest = { id: string; groupId: string; studentId: string; status: 'pending' | 'approved' | 'rejected' | 'cancelled'; revision: number };
export type Member = { id: string; name: string; joinedAt: number };
export type Result = { id: string; studentId: string; kind: 'practice' | 'exam'; at: number; score: string; groupId?: string; supervisorId?: string; visibleUntil: number };
export type Page<T> = { rows: T[]; next: string | null; total?: number };
export type Query = { actorId: string; groupId?: string; peopleCursor?: string; groupsCursor?: string; requestsCursor?: string; membersCursor?: string; resultsCursor?: string };
export type Snapshot = { service?: 'sql'; codeGroupId?: string; now: number; appointed: boolean | null; sharing?: boolean; sharingPolicy?: { version: string; digest: string; known: boolean }; isMember: boolean | null; people: Page<Person & { appointed: boolean }>; groups: Page<Group>; group?: Group; requests: Page<JoinRequest>; members: Page<Member>; results: Page<Result>; visibilityUntil: number };
export type Command =
 | { kind: 'appoint' | 'revoke'; personId: string }
 | { kind: 'create'; name: string; endsAt: number }
 | { kind: 'end' | 'rotate' | 'revoke-code'; groupId: string; revision: number }
 | { kind: 'sharing'; version: string; digest: string; accept: boolean }
 | { kind: 'join'; code: string }
 | { kind: 'cancel' | 'approve' | 'reject'; requestId: string; revision: number }
 | { kind: 'leave'; groupId: string };
export type Failure = 'denied' | 'expired' | 'conflict' | 'invalid' | 'offline';
export class ReviewError extends Error { constructor(public reason: Failure) { super(reason); } }
export interface ReviewAdapter {
 subscribe?(invalidate: () => void): () => void;
 readonly accounts: readonly Person[];
 read(query: Query, signal: AbortSignal): Promise<Snapshot>;
 execute(actorId: string, command: Command, signal: AbortSignal): Promise<{ code?: string; groupId?: string }>;
}
