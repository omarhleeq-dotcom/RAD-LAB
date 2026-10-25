// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSimulationStore } from "@/stores/simulation-store";
import { savedAttempt } from "@/features/pilot/saved-attempt";
import { CONSENT_VERSION } from "@/features/pilot/consent";

const fixture = vi.hoisted(() => ({ locale: "en", comparisonGate: null as Promise<void> | null, writes: [] as { table: string; row: Record<string, unknown> }[] }));
vi.mock("@/features/evaluation/version", async importOriginal => {
  const actual = await importOriginal<typeof import("@/features/evaluation/version")>();
  return { ...actual, evaluationComparison: async (...args: Parameters<typeof actual.evaluationComparison>) => {
    await fixture.comparisonGate;
    return actual.evaluationComparison(...args);
  } };
});
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("next-intl", () => ({ useLocale: () => fixture.locale, useTranslations: () => (key: string) => key }));
vi.mock("@/features/pilot/config", () => ({ PILOT: { url: "https://synthetic.test" }, sessionStorageKey: () => "synthetic-session" }));
vi.mock("@/features/pilot/client", () => ({ getPilotClient: async () => ({
  auth: { getSession: async () => ({ data: { session: { user: { id: "synthetic" } } } }) },
  from: (table: string) => ({
    insert: async (row: Record<string, unknown>) => { fixture.writes.push({ table, row }); return { error: null }; },
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: "approved", role: "participant", participant_code: "P-test", consent_version: CONSENT_VERSION } }) }) }),
  }),
}) }));
vi.mock("@/features/evaluation/ResultPanel", () => ({ ResultPanel: () => null }));
vi.mock("@/features/patient/PatientInstructionsPanel", () => ({ PatientInstructionsPanel: () => null }));
vi.mock("@/features/positioning/scenes", () => ({ PositioningScene: () => null }));
vi.mock("@/features/xray-console/ConsolePanel", () => ({ ConsolePanel: () => null }));
vi.mock("@/features/pilot/FeedbackBox", () => ({ FeedbackBox: () => null }));
vi.mock("@/features/pilot/AttemptSaveNote", () => ({ AttemptSaveNote: () => null }));
import { SimulationWorkspace } from "./SimulationWorkspace";

let root: Root, container: HTMLDivElement;
const st = () => useSimulationStore.getState();
const mount = async (locale: string, caseId = "wrist-pa") => {
  fixture.locale = locale;
  // Changing key reproduces the localized route's React remount; the real store/logger/recorder are retained.
  await act(async () => root.render(h(SimulationWorkspace, { key: locale, caseId })));
};
const flush = async () => { await act(async () => { await new Promise(r => setTimeout(r, 50)); }); };
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  HTMLElement.prototype.scrollIntoView = () => {};
  useSimulationStore.setState({ activeCase: null, settings: null, result: null, phase: "setup", attempt: 1 });
  localStorage.setItem("synthetic-session", "synthetic-login");
  fixture.writes = [];
  fixture.comparisonGate = null;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.clear(); });

describe("locale navigation with the real attempt logger", () => {
  it.each(["en", "ar"])("keeps setup and result through %s round trips without extra writes", async locale => {
    const other = locale === "en" ? "ar" : "en";
    await mount(locale);
    await act(async () => { st().setSetting("kvp", 60); st().setSetting("markerPosition", { x: -.8, y: .1 }); });
    await flush();
    const setup = st();
    const before = [...fixture.writes];
    await mount(other); await mount(locale); await flush();
    expect(st()).toBe(setup);
    expect(fixture.writes).toEqual(before);
    await act(async () => st().expose()); await flush();
    const result = st(), saved = savedAttempt.get(), submitted = [...fixture.writes];
    expect(result.phase).toBe("result");
    expect(saved?.status).toBe("saved");
    await mount(other); await mount(locale); await flush();
    expect(st()).toBe(result);
    expect(savedAttempt.get()).toEqual(saved);
    expect(fixture.writes).toEqual(submitted);
    expect(fixture.writes.filter(w => w.table === "attempts")).toHaveLength(1);
    expect(fixture.writes.filter(w => w.table === "events").map(w => w.row.type)).toEqual(["exam_opened", "attempt_started", "attempt_submitted"]);
    // A genuine Retry still starts the next attempt; its submission records the current locale.
    await act(async () => st().retry());
    await mount(other);
    expect(st().attempt).toBe(2);
    await act(async () => st().expose()); await flush();
    expect(fixture.writes.filter(w => w.table === "attempts").map(w => [w.row.attempt_no, w.row.locale])).toEqual([[1, locale], [2, other]]);
    expect(fixture.writes.filter(w => w.row.type === "attempt_retry")).toHaveLength(1);
  });

  it("keeps the save in flight across a locale remount", async () => {
    await mount("en");
    let release!: () => void;
    fixture.comparisonGate = new Promise<void>(resolve => { release = resolve; });
    await act(async () => st().expose());
    const result = st();
    await mount("ar");
    release();
    await flush();
    expect(st()).toBe(result);
    expect(savedAttempt.get()?.status).toBe("saved");
    expect(fixture.writes.filter(w => w.table === "attempts")).toHaveLength(1);
    expect(fixture.writes.find(w => w.table === "attempts")?.row.locale).toBe("en");
    expect(fixture.writes.filter(w => w.row.type === "attempt_submitted")).toHaveLength(1);
    expect(fixture.writes.filter(w => w.row.type === "exam_opened")).toHaveLength(1);
  });

  it("loads a different case and keeps Restart explicit", async () => {
    await mount("en");
    await act(async () => st().setSetting("kvp", 60));
    await mount("ar", "wrist-lateral");
    expect(st().activeCase?.id).toBe("wrist-lateral");
    expect(st().settings).toEqual(st().activeCase?.initialSettings);
    await act(async () => { st().setSetting("kvp", 65); st().expose(); st().reset(); });
    expect(st().phase).toBe("setup");
    expect(st().result).toBeNull();
    expect(st().attempt).toBe(1);
    expect(st().settings).toEqual(st().activeCase?.initialSettings);
    await flush();
    expect(fixture.writes.filter(w => w.row.type === "exam_opened")).toHaveLength(2);
  });
});
