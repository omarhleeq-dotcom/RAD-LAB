import { describe, expect, it } from "vitest";
import { actionsFor, formatStamp, lastActivity, needsConfirmedEmail, parseParticipant, parseParticipants } from "./owner-state";

const row = { user_id: "u1", participant_code: "P-1", role: "participant", status: "pending", email: "a@b.co", email_confirmed: true, created_at: "2026-10-15T10:00:00Z", last_seen_at: null, last_event_at: null };

describe("parseParticipant", () => {
  it("maps a database row", () => expect(parseParticipant(row)).toEqual({ userId: "u1", code: "P-1", role: "participant", status: "pending", email: "a@b.co", emailConfirmed: true, createdAt: "2026-10-15T10:00:00Z", lastSeenAt: null, lastEventAt: null }));
  it.each([null, {}, { ...row, status: "root" }, { ...row, role: "admin" }, { ...row, email_confirmed: "yes" }, { ...row, email: null }])("drops %j", (bad) => expect(parseParticipant(bad)).toBeNull());
  it("keeps good rows and drops bad ones in a list; a non-array is empty", () => {
    expect(parseParticipants([row, { nope: 1 }, { ...row, user_id: "u2" }]).map((p) => p.userId)).toEqual(["u1", "u2"]);
    expect(parseParticipants(null)).toEqual([]);
  });
});

describe("lastActivity", () => {
  it("is the newest of last_seen_at and last_event_at, or null", () => {
    expect(lastActivity({ lastSeenAt: null, lastEventAt: null })).toBeNull();
    expect(lastActivity({ lastSeenAt: "2026-10-15T10:00:00Z", lastEventAt: null })).toBe("2026-10-15T10:00:00Z");
    expect(lastActivity({ lastSeenAt: "2026-10-15T10:00:00Z", lastEventAt: "2026-10-15T11:00:00Z" })).toBe("2026-10-15T11:00:00Z");
    expect(lastActivity({ lastSeenAt: "2026-10-15T12:00:00Z", lastEventAt: "2026-10-15T11:00:00Z" })).toBe("2026-10-15T12:00:00Z");
  });
});

describe("actionsFor", () => {
  it("offers sensible next states and never the owner's own row", () => {
    expect(actionsFor({ status: "pending", userId: "x" }, "me")).toEqual(["approved", "suspended"]);
    expect(actionsFor({ status: "approved", userId: "x" }, "me")).toEqual(["suspended"]);
    expect(actionsFor({ status: "suspended", userId: "x" }, "me")).toEqual(["approved"]);
    expect(actionsFor({ status: "pending", userId: "me" }, "me")).toEqual([]);
  });
});

describe("needsConfirmedEmail", () => {
  it("warns only when approving an unconfirmed e-mail", () => {
    expect(needsConfirmedEmail({ emailConfirmed: false }, "approved")).toBe(true);
    expect(needsConfirmedEmail({ emailConfirmed: false }, "suspended")).toBe(false);
    expect(needsConfirmedEmail({ emailConfirmed: true }, "approved")).toBe(false);
  });
});

describe("formatStamp", () => {
  it("is YYYY-MM-DD HH:mm with zero padding", () => expect(formatStamp(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05 07:03"));
});
