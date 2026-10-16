import { describe, expect, it } from "vitest";
import { accountDestination, safeReturnPath, sessionAccess } from "./session-access";
import type { AccountState } from "./useAccount";

const states: Record<string, AccountState> = {
  visitor: { kind: "signedOut" },
  loading: { kind: "loading" },
  error: { kind: "profileError", email: "synthetic@example.test" },
  ...Object.fromEntries((["pending", "approved", "suspended"] as const).map((status) => [status, {
    kind: "signedIn", email: "synthetic@example.test", userId: "synthetic", consentVersion: null,
    profile: { status, role: "participant", code: "P-test" },
  }])),
};

describe("static session access", () => {
  for (const locale of ["en", "ar"]) {
    for (const [name, state] of Object.entries(states)) {
      it(`${locale}: ${name} across protected and public routes`, () => {
        for (const route of ["", "/xray", "/xray/chest-pa-erect/practice", "/credits", "/owner", "/future-page"]) {
          expect(sessionAccess(true, `/${locale}${route}`, state)).toBe(name === "approved" ? "allow" : name === "loading" ? "wait" : "account");
          expect(sessionAccess(false, `/${locale}${route}`, state)).toBe("allow");
        }
        for (const route of ["/account", "/terms", "/terms/"]) expect(sessionAccess(true, `/${locale}${route}`, state)).toBe("allow");
      });
    }
  }
  it("preserves locale, query and fragment", () => {
    const path = "/ar/xray/chest-pa-erect/practice?case=one%2Ftwo#result-heading";
    expect(safeReturnPath(path)).toBe(path);
    expect(new URL(accountDestination("ar", path), "https://local.invalid").searchParams.get("returnTo")).toBe(path);
  });
  it.each([null, "", "https://evil.test", "//evil.test/en", "/\\evil.test/en", "/en/\nxray", "/owner", "/en/account", "/en/terms/../account/?returnTo=/en", "/en/../account"])("rejects unsafe destinations and auth loops: %s", (path) => {
    expect(safeReturnPath(path)).toBeNull();
  });
});
