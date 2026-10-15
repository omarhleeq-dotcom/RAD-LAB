// Pure rules for the owner page (RAD-044a). No React, no network. Tested in owner-state.test.ts.
import { isStatus, type ProfileRole, type ProfileStatus } from "./account-state";

export type Participant = {
  readonly userId: string;
  readonly code: string;
  readonly role: ProfileRole;
  readonly status: ProfileStatus;
  readonly email: string;
  readonly emailConfirmed: boolean;
  readonly createdAt: string;
  readonly lastSeenAt: string | null;
  readonly lastEventAt: string | null;
};

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** One row of `owner_list_participants()`; anything malformed is dropped (never guessed). */
export function parseParticipant(row: unknown): Participant | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  const userId = str(r.user_id), code = str(r.participant_code), email = str(r.email), createdAt = str(r.created_at);
  if (!userId || !code || !email || !createdAt || !isStatus(r.status) || (r.role !== "participant" && r.role !== "owner") || typeof r.email_confirmed !== "boolean") return null;
  return { userId, code, role: r.role, status: r.status, email, emailConfirmed: r.email_confirmed, createdAt, lastSeenAt: str(r.last_seen_at), lastEventAt: str(r.last_event_at) };
}

export function parseParticipants(rows: unknown): Participant[] {
  return Array.isArray(rows) ? rows.map(parseParticipant).filter((p): p is Participant => p !== null) : [];
}

/** The most recent sign of life: a heartbeat / event or a pending user's `touch_last_seen`. */
export function lastActivity(p: Pick<Participant, "lastSeenAt" | "lastEventAt">): string | null {
  const times = [p.lastSeenAt, p.lastEventAt].filter((t): t is string => t !== null);
  return times.length === 0 ? null : times.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b));
}

/** Buttons offered per status. The owner never changes their own row (the database refuses it too). */
export function actionsFor(p: Pick<Participant, "status" | "userId">, ownerId: string): ProfileStatus[] {
  if (p.userId === ownerId) return [];
  if (p.status === "pending") return ["approved", "suspended"];
  if (p.status === "approved") return ["suspended"];
  return ["approved"];
}

/** Approving someone whose e-mail was never confirmed deserves a warning (anyone can type any address). */
export function needsConfirmedEmail(p: Pick<Participant, "emailConfirmed">, target: ProfileStatus): boolean {
  return target === "approved" && !p.emailConfirmed;
}

/** `2026-10-15 16:20` in local time; digits and dashes only, so it reads the same in Arabic and English. */
export function formatStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
