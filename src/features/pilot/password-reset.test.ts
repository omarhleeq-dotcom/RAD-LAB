import { describe, expect, it } from "vitest";
import { authErrorKey, recoveryFromHash } from "./account-state";

describe("recoveryFromHash (RAD-046)", () => {
  it("recognises a reset link: type=recovery with an access token", () => {
    expect(recoveryFromHash("#access_token=abc&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery")).toBe("recovery");
    expect(recoveryFromHash("access_token=abc&type=recovery")).toBe("recovery"); // without the leading #
  });
  it("recognises an expired or already used link", () => {
    expect(recoveryFromHash("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired")).toBe("linkError");
  });
  it.each(["", "#", "#access_token=abc&type=signup", "#type=recovery", "#error=server_error", "#foo=bar"])("ignores %j (a sign-up confirmation or no link at all)", (hash) => {
    expect(recoveryFromHash(hash)).toBeNull();
  });
});

describe("authErrorKey for the password change", () => {
  it("maps same_password to its own message, and keeps the others", () => {
    expect(authErrorKey({ code: "same_password" })).toBe("samePassword");
    expect(authErrorKey({ code: "weak_password" })).toBe("weakPassword");
    expect(authErrorKey({ code: "over_email_send_rate_limit" })).toBe("rateLimited");
  });
});
