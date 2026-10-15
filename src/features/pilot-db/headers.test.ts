// The pilot's only CSP exception (RAD-041a / DECISIONS S-PILOT-5): one validated Supabase origin, added at build time.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { supabaseOrigin, withConnectSrc } from "../../../scripts/pages/headers.mjs";

const HEADERS = readFileSync(join(process.cwd(), "public/_headers"), "utf8");

describe("supabaseOrigin", () => {
  it("returns null when unset or blank (feature off, CSP unchanged)", () => {
    expect(supabaseOrigin(undefined)).toBeNull();
    expect(supabaseOrigin("")).toBeNull();
    expect(supabaseOrigin("   ")).toBeNull();
  });

  it("accepts a project URL and returns only its origin", () => {
    expect(supabaseOrigin("https://abcdefghij.supabase.co")).toBe("https://abcdefghij.supabase.co");
    expect(supabaseOrigin(" https://abcdefghij.supabase.co/ ")).toBe("https://abcdefghij.supabase.co");
  });

  it.each([
    "http://abcdefghij.supabase.co",
    "https://supabase.co.evil.example",
    "https://evil.example/abcdefghij.supabase.co",
    "https://abcdefghij.supabase.co:8443",
    "https://user:pw@abcdefghij.supabase.co",
    "https://abcdefghij.supabase.co/rest/v1",
    "https://abcdefghij.supabase.co/?x=1",
    "https://*.supabase.co",
    "https://supabase.co",
    "not a url",
  ])("rejects %s", (bad) => {
    expect(() => supabaseOrigin(bad)).toThrow();
  });
});

describe("withConnectSrc", () => {
  it("the real public/_headers has the directive exactly once and stays strict by default", () => {
    expect(HEADERS.split("connect-src 'self';").length - 1).toBe(1);
    expect(HEADERS).not.toMatch(/https:\/\/[^ ;]*supabase/);
  });

  it("adds one origin to connect-src and changes nothing else", () => {
    const out = withConnectSrc(HEADERS, "https://abcdefghij.supabase.co");
    expect(out).toContain("connect-src 'self' https://abcdefghij.supabase.co; object-src 'none'");
    expect(out.replace(" https://abcdefghij.supabase.co", "")).toBe(HEADERS);
  });

  it("throws when the directive is missing or duplicated", () => {
    expect(() => withConnectSrc("Content-Security-Policy: default-src 'self'", "https://a.supabase.co")).toThrow();
    expect(() => withConnectSrc("connect-src 'self'; connect-src 'self';", "https://a.supabase.co")).toThrow();
  });
});
