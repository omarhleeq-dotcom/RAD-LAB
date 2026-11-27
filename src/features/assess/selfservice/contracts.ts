import type { HistoryPage } from '../history-data';
import type { StudentItem, StatusCounts } from './SelfServiceViews';
export type Page<T> = { rows: T[]; next: string | null; serverTime?: string };
export type Metadata = { id: string; name: string; track: 'mixed' | 'full-practical'; durationSeconds: number; versionId?: string; revision?: number; audience?: 'group' | 'all-students'; opensAt?: string | null; closesAt?: string | null; closedAt?: string | null };
export type Eligibility = { studentId: string; sessionId: string; eligible: boolean; reason: string; serverTime: string };
export type Permission = { user_id: string; all_students: boolean; all_students_key: string };
export type Recommendation = { version: 1; selected: number; available: number; recommended: boolean; defaultWindowSeconds: number; maxWindowSeconds: number };
export type Status = { counts: StatusCounts; rows: { userId: string; state: string }[]; now: string; opensAt: string | null; closesAt: string | null; closed: boolean };
export type Issue = 'denied' | 'conflict' | 'invalid' | 'window' | 'limit' | 'unavailable' | 'unknown';
export class SelfServiceError extends Error { constructor(readonly kind: Issue) { super(kind); } }
export interface SelfServicePort {
 capability(): Promise<boolean>;
 permissions(after?: string | null): Promise<Page<Permission>>;
 permission(supervisor: string, enabled: boolean): Promise<void>;
 metadata(kind: 'versions' | 'assignments', after?: string | null): Promise<Page<Metadata>>;
 recommendation(version: string): Promise<Recommendation>;
 publish(version: string, operation: string, opens: string, closes: string): Promise<string>;
 schedule(id: string, revision: number, opens: string, closes: string): Promise<number>;
 close(id: string, revision: number, quiz: boolean): Promise<void>;
 status(id: string, after?: string | null): Promise<Status>;
 eligibility(id: string, after?: string | null): Promise<Page<Eligibility>>;
 extra(id: string, student: string, seconds: number): Promise<void>;
 grant(id: string, session: string): Promise<void>;
 students(after?: string | null): Promise<Page<StudentItem>>;
 history(after?: string | null): Promise<HistoryPage>;
 resume(confirm: string): Promise<{ released: number; stillHeld: number; heldActive: number; gateOpen: boolean; loginEnabled: boolean }>;
 accept(confirm: string): Promise<{ epoch: string; acceptedAt: string }>;
}
export type Transport = (name: string, args: Record<string, unknown>) => Promise<unknown>;
