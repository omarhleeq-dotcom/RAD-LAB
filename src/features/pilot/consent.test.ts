import { describe, expect, it } from "vitest";
import { CONSENT_VERSION, needsConsent, parseConsentVersion } from "./consent";

describe("consent", () => {
  it("uses a date-shaped version the database accepts", () => {
    expect(CONSENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("needs consent unless the current version is recorded", () => {
    expect(needsConsent(null)).toBe(true);
    expect(needsConsent("2020-01-01")).toBe(true);
    expect(needsConsent(CONSENT_VERSION)).toBe(false);
  });
  it("reads only a well-formed version from a profile row", () => {
    expect(parseConsentVersion({ consent_version: "2026-10-16" })).toBe("2026-10-16");
    expect(parseConsentVersion({ consent_version: "yes" })).toBeNull();
    expect(parseConsentVersion({})).toBeNull();
    expect(parseConsentVersion(null)).toBeNull();
  });
});
