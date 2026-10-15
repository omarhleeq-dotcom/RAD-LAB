import { describe, expect, it } from "vitest";
import { authErrorKey, HEARTBEAT_MS, parseProfile, passwordProblem, shouldHeartbeat } from "./account-state";

describe("authErrorKey maps real Supabase Auth codes to a message key", () => {
  it.each([
    ["invalid_credentials", "invalidCredentials"],
    ["email_not_confirmed", "emailNotConfirmed"],
    ["over_request_rate_limit", "rateLimited"],
    ["over_email_send_rate_limit", "rateLimited"],
    ["weak_password", "weakPassword"],
    ["signup_disabled", "signupDisabled"],
    ["email_address_invalid", "invalidEmail"],
  ])("%s → %s", (code, key) => expect(authErrorKey({ code })).toBe(key));

  it("falls back on status / name, then to generic (never echoes server text)", () => {
    expect(authErrorKey({ status: 429 })).toBe("rateLimited");
    expect(authErrorKey({ name: "AuthRetryableFetchError" })).toBe("network");
    expect(authErrorKey({ code: "something_new" })).toBe("generic");
    expect(authErrorKey(null)).toBe("generic");
  });

  it("an unknown e-mail and a wrong password give the SAME message (no account enumeration)", () => {
    expect(authErrorKey({ code: "invalid_credentials" })).toBe(authErrorKey({ code: "invalid_credentials", status: 400 }));
  });
});

describe("passwordProblem mirrors the project rule (min 8, four classes)", () => {
  it("flags short, then missing classes", () => {
    expect(passwordProblem("Ab1!")).toBe("short");
    expect(passwordProblem("abcdefgh1!")).toBe("classes");
    expect(passwordProblem("ABCDEFGH1!")).toBe("classes");
    expect(passwordProblem("Abcdefgh!!")).toBe("classes");
    expect(passwordProblem("Abcdefgh12")).toBe("classes");
  });
  it("accepts a compliant password", () => expect(passwordProblem("Abcdef1!")).toBeNull());
});

describe("parseProfile accepts only a well-formed profiles row", () => {
  it("parses", () => expect(parseProfile({ status: "pending", role: "participant", participant_code: "P-1" })).toEqual({ status: "pending", role: "participant", code: "P-1" }));
  it.each([null, undefined, {}, { status: "admin", role: "participant", participant_code: "P-1" }, { status: "approved", role: "root", participant_code: "P-1" }, { status: "approved", role: "owner", participant_code: 5 }])("rejects %j", (row) => expect(parseProfile(row)).toBeNull());
});

describe("shouldHeartbeat", () => {
  const now = 10 * HEARTBEAT_MS;
  it("beats first time, then at most once per interval", () => {
    expect(shouldHeartbeat({ status: "approved", visible: true, nowMs: now, lastMs: null })).toBe(true);
    expect(shouldHeartbeat({ status: "approved", visible: true, nowMs: now, lastMs: now - HEARTBEAT_MS + 1 })).toBe(false);
    expect(shouldHeartbeat({ status: "approved", visible: true, nowMs: now, lastMs: now - HEARTBEAT_MS })).toBe(true);
  });
  it("never while hidden or with no known profile", () => {
    expect(shouldHeartbeat({ status: "approved", visible: false, nowMs: now, lastMs: null })).toBe(false);
    expect(shouldHeartbeat({ status: null, visible: true, nowMs: now, lastMs: null })).toBe(false);
  });
  it("pending and suspended users also beat (activity.ts routes them to touch_last_seen)", () => {
    expect(shouldHeartbeat({ status: "pending", visible: true, nowMs: now, lastMs: null })).toBe(true);
    expect(shouldHeartbeat({ status: "suspended", visible: true, nowMs: now, lastMs: null })).toBe(true);
  });
});
