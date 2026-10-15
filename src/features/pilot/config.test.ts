import { describe, expect, it } from "vitest";
import { assertPublishableKey } from "../../../scripts/pages/headers.mjs";
import { readPilotConfig, sessionStorageKey } from "./config";

const URL = "https://abcdefghij.supabase.co";
const jwt = (role: string) => `h.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.s`;

describe("readPilotConfig: the account feature is ON only with a valid URL AND a publishable key", () => {
  it("is off when either value is missing or blank", () => {
    expect(readPilotConfig({})).toBeNull();
    expect(readPilotConfig({ url: URL })).toBeNull();
    expect(readPilotConfig({ key: "sb_publishable_x" })).toBeNull();
    expect(readPilotConfig({ url: "  ", key: "sb_publishable_x" })).toBeNull();
  });

  it("is on with a project URL and a publishable key", () => {
    expect(readPilotConfig({ url: `${URL}/`, key: " sb_publishable_abc " })).toEqual({ url: URL, key: "sb_publishable_abc" });
  });

  it("is OFF (never throws) for a SECRET key, a service_role JWT or a foreign host", () => {
    expect(readPilotConfig({ url: URL, key: "sb_secret_abc" })).toBeNull();
    expect(readPilotConfig({ url: URL, key: jwt("service_role") })).toBeNull();
    expect(readPilotConfig({ url: "https://evil.example", key: "sb_publishable_x" })).toBeNull();
  });

  it("accepts the legacy anon JWT only", () => {
    expect(readPilotConfig({ url: URL, key: jwt("anon") })?.key).toBe(jwt("anon"));
  });

  it("derives the supabase-js session key from the project ref", () => {
    expect(sessionStorageKey(URL)).toBe("sb-abcdefghij-auth-token");
  });
});

describe("assertPublishableKey (the build guard)", () => {
  it("returns null for empty / unset", () => {
    expect(assertPublishableKey(undefined)).toBeNull();
    expect(assertPublishableKey("")).toBeNull();
  });
  it.each(["sb_secret_abc", jwt("service_role"), jwt(""), "not-a-key", "a.b.c"])("throws for %s", (bad) => {
    expect(() => assertPublishableKey(bad)).toThrow();
  });
  it("passes publishable keys", () => {
    expect(assertPublishableKey("sb_publishable_abc")).toBe("sb_publishable_abc");
  });
});
