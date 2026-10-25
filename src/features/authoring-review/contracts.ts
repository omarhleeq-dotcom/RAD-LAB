/** Local review DTO v1; neither a schema nor final RPC names. Never a publication. */
import type { AttemptPolicy, SingleChoiceItem, SimulatorPartItem, VersionRef } from '../assess/contracts';
import type { ItemView } from '../assess/presentation';
import type { Group, Member, Page, Person, ReviewAdapter } from '../supervisor-review/contracts';
export type { Group, Member, Page, Person };
export type Scope = { actorId: string; groupId: string };
export type Scenario = 'normal' | 'slow' | 'offline' | 'conflict';
export type AuthorNotes = { author: string; reference: string; licenceNotes: string; notes: string };
export type PartReference = { id: string; label: string; caseRef: VersionRef; ruleId: string; part: string; view: ItemView };
export type DraftItem = { id: string; prompt: string; maximum: string; authoring: AuthorNotes } & (
 | { type: 'single-choice'; options: { id: string; text: string }[]; correctOptionId: string }
 | { type: 'simulator-part'; partId: string }
);
export type Draft = { schemaVersion: 1; id: string; revision: number; name: string; policy: AttemptPolicy; items: DraftItem[] };
/** Whitelist only. No DraftItem, key, authoring, source, rubric or review record. */
export type StudentPreviewData = { name: string; policy: AttemptPolicy; items: ((SingleChoiceItem | SimulatorPartItem) & { view?: ItemView })[] };
export type AssignmentReview = { token: string; draftName: string; draftRevision: number; groupName: string; groupRevision: number; targetCount: number; expiresAt: number; targets: Page<Member> };
export interface AuthoringAdapter {
 readonly accounts: readonly Person[];
 readonly parts: readonly PartReference[];
 groups(actorId: string, cursor: string | undefined, signal: AbortSignal): Promise<Page<Group>>;
 context(scope: Scope, signal: AbortSignal): Promise<{ group: Group; now: number; draft?: Draft }>;
 save(scope: Scope, draft: Draft, signal: AbortSignal): Promise<Draft>;
 prepare(scope: Scope, draft: Draft, signal: AbortSignal): Promise<AssignmentReview>;
 targets(scope: Scope, token: string, cursor: string | undefined, signal: AbortSignal): Promise<Page<Member>>;
 confirm(scope: Scope, token: string, signal: AbortSignal): Promise<void>;
}
export type ReviewFixture = { adapter: AuthoringAdapter; membership: ReviewAdapter; scenario(value: Scenario): void; expire(): void; revoke(actorId: string): void };
