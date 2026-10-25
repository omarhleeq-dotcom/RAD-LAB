// @vitest-environment jsdom
import { act, createElement as h, useEffect, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_VERSION } from "./consent";
import type { AccountState } from "./useAccount";
import { savedAttempt } from "./saved-attempt";

const fixture = vi.hoisted(() => ({ account: {} as Record<string, unknown> }));
vi.mock("./SessionGate", () => ({ useSessionAccount: () => fixture.account, useOptionalSessionAccount: () => fixture.account }));
vi.mock("./useAccount", () => ({ useAccount: () => fixture.account }));
vi.mock("./PilotSessionKeeper", () => ({ PilotSessionKeeper: () => null }));
vi.mock("./C2Session", () => ({ C2Participant: () => h("p", { "data-testid": "participant-reader" }, "participant reader") }));
vi.mock("./config", () => ({ PILOT: { url: "https://synthetic.test" } }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, ...props }: { children: ReactNode }) => h("a", props, children) }));
import { ConsentGate } from "./ConsentGate";
import { AttemptSaveNote } from "./AttemptSaveNote";
import { FeedbackContent } from "./FeedbackContent";
import { ParticipantSurvey } from "./ParticipantSurvey";
import type { C2Adapter } from "./c2-ui";

let root: Root, container: HTMLDivElement;
const signedIn = (consentVersion: string | null = "2020-01-01", status: "approved" | "pending" | "suspended" = "approved", role: "participant" | "owner" = "participant"): AccountState => ({ kind: "signedIn", email: "synthetic@example.test", userId: "synthetic", consentVersion, profile: { role, status, code: "P-test" } });
const app = h("div", { "data-testid": "original-page" }, "Original app content");
async function render(state: AccountState, content: ReactNode = h(ConsentGate, null, app)) {
  fixture.account.state = state;
  await act(async () => root.render(content));
}
const gate = () => container.querySelector('[data-testid="consent-gate"]');
const button = (label: string) => [...container.querySelectorAll("button")].find(b => b.textContent === label)!;
async function click(node: HTMLElement) { await act(async () => node.click()); }
async function agree() { await click(container.querySelector("input")!); }

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  savedAttempt.set(null);
  fixture.account = { state: signedIn(), acceptTerms: vi.fn(async () => true), signOut: vi.fn(async () => {}) };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe("blocking consent gate", () => {
  it.each([null, "2020-01-01"])("outdated or missing consent %s hides the entire app", async version => {
    await render(signedIn(version)); expect(gate()).not.toBeNull(); expect(container.textContent).not.toContain("Original app content");
    expect(container.querySelector('a[href="/terms"]')).not.toBeNull();
  });
  it.each(["pending", "approved", "suspended"] as const)("applies to %s, including owners", async status => {
    for (const role of ["participant", "owner"] as const) { await render(signedIn(null, status, role)); expect(gate()).not.toBeNull(); }
  });
  it("current consent and signed-out visitors have no gate", async () => {
    for (const state of [signedIn(CONSENT_VERSION), { kind: "signedOut" } as const]) {
      await render(state); expect(gate()).toBeNull(); expect(container.textContent).toContain("Original app content");
    }
  });
  it("loading shows only the existing loading state", async () => {
    await render({ kind: "loading" }); expect(container.textContent).toBe("loading"); expect(container.querySelector('[role="status"]')).not.toBeNull();
  });
  it("accept uses the existing action and restores the same page, query and fragment", async () => {
    history.replaceState(null, "", "/ar/xray/chest-pa-erect/practice?case=one#result"); const url = location.href;
    fixture.account.acceptTerms = vi.fn(async () => { fixture.account.state = signedIn(CONSENT_VERSION); root.render(h(ConsentGate, null, app)); return true; });
    await render(signedIn()); expect(button("consent.accept").disabled).toBe(true);
    await agree(); await click(button("consent.accept"));
    expect(fixture.account.acceptTerms).toHaveBeenCalledOnce(); expect(gate()).toBeNull(); expect(container.textContent).toContain("Original app content"); expect(location.href).toBe(url);
  });
  it("failed acceptance stays blocked and permits retry", async () => {
    fixture.account.acceptTerms = vi.fn(async () => false); await render(signedIn()); await agree(); await click(button("consent.accept"));
    expect(gate()).not.toBeNull(); expect(container.querySelector('[role="alert"]')?.textContent).toBe("consent.failed"); expect(button("consent.accept").disabled).toBe(false);
  });
  it("sign out from the gate restores visitor content on the same URL", async () => {
    const url = location.href;
    fixture.account.signOut = vi.fn(async () => { fixture.account.state = { kind: "signedOut" }; root.render(h(ConsentGate, null, app)); });
    await render(signedIn()); await click(button("signOut"));
    expect(fixture.account.signOut).toHaveBeenCalledOnce(); expect(gate()).toBeNull(); expect(container.textContent).toContain("Original app content"); expect(location.href).toBe(url);
  });
});

describe("result save safety note", () => {
  it.each([null, "pending", "unavailable", "saved"] as const)("participant save status %s", async status => {
    savedAttempt.set(status ? { id: "synthetic-attempt", status } : null);
    await render(signedIn(CONSENT_VERSION), h(AttemptSaveNote));
    expect(container.textContent).toBe(status === "saved" ? "" : "attemptNotSaved");
    await act(async () => savedAttempt.set({ id: "synthetic-attempt", status: "saved" })); expect(container.textContent).toBe("");
  });
  it("visitors and owners have no participant warning", async () => {
    for (const state of [{ kind: "signedOut" } as const, signedIn(CONSENT_VERSION, "approved", "owner")]) {
      await render(state, h(AttemptSaveNote)); expect(container.textContent).toBe("");
    }
  });
});

// Exercise the real provider separately from the injected gate fixture. The account page must receive reset intent
// even when it mounts only after the client has consumed the fragment during the loading/consent screen.
it.each([
  ["#access_token=synthetic&type=recovery", "recovery"],
  ["#error=synthetic&error_code=expired", "linkError"],
])("preserves account-link intent through loading and consent: %s", async (hash, expected) => {
  const actual = await vi.importActual<typeof import("./SessionGate")>("./SessionGate");
  let mountKey = 0;
  function DelayedAccount() {
    const { recovery, consumeRecovery } = actual.useSessionAccount();
    const [intent] = useState(recovery);
    useEffect(() => { consumeRecovery(); }, [consumeRecovery]);
    return h("p", null, intent);
  }
  function Screen() { return h(actual.SessionProvider, null, fixture.account.state && (fixture.account.state as AccountState).kind === "signedIn" ? h(DelayedAccount, { key: mountKey }) : null); }
  history.replaceState(null, "", "/en/account" + hash);
  fixture.account.state = { kind: "loading" };
  await act(async () => root.render(h(Screen)));
  history.replaceState(null, "", "/en/account");
  fixture.account.state = signedIn(CONSENT_VERSION);
  await act(async () => root.render(h(Screen)));
  expect(container.textContent).toBe(expected);
  mountKey++;
  await act(async () => root.render(h(Screen)));
  expect(container.textContent).toBe("");
});

describe("feedback empty states", () => {
  it("owners see an explanation and owner link instead of the participant reader", async () => {
    await render(signedIn(CONSENT_VERSION, "approved", "owner"), h(FeedbackContent));
    expect(container.textContent).toContain("ownerFeedback");
    expect(container.querySelector('a[href="/owner"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="participant-reader"]')).toBeNull();
  });
  it("participants retain the existing survey reader", async () => {
    await render(signedIn(CONSENT_VERSION), h(FeedbackContent));
    expect(container.querySelector('[data-testid="participant-reader"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="owner-feedback"]')).toBeNull();
  });
  it("no open survey shows the explicit no-survey message", async () => {
    const pending = vi.fn(async () => ({ kind: "ready", data: null }));
    const adapter = { pending } as unknown as C2Adapter;
    await render(signedIn(CONSENT_VERSION), h(ParticipantSurvey, { adapter, participantId: "synthetic" }));
    expect(pending).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="status"]')?.textContent).toBe("noPending");
    expect(container.querySelector("form")).toBeNull();
  });
});
