import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_THEME, THEME_INIT_SCRIPT, THEME_KEY, parseTheme, readStoredTheme, saveTheme } from "./theme";

/** Minimal browser doubles (the suite runs in node). */
function browser(storage: { get: () => string | null; set: () => void }) {
  const attrs: Record<string, string> = {};
  const meta = { content: "dark", setAttribute: (_: string, v: string) => { meta.content = v; } };
  const doc = {
    documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } },
    querySelector: (q: string) => (q.includes("color-scheme") ? meta : null),
  };
  const win = { localStorage: { getItem: storage.get, setItem: storage.set }, dispatchEvent: () => true };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", win);
  vi.stubGlobal("localStorage", win.localStorage);
  vi.stubGlobal("Event", class { constructor(public type: string) {} });
  return { attrs, meta };
}
const run = () => new Function(THEME_INIT_SCRIPT)();
const blocked = () => { throw new Error("blocked"); };

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe("theme", () => {
  it("defaults to dark and only a stored 'light' turns the site light", () => {
    expect(DEFAULT_THEME).toBe("dark");
    expect(parseTheme(null)).toBe("dark");
    expect(parseTheme("system")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it("the pre-paint script sets dark with nothing stored", () => {
    const b = browser({ get: () => null, set: () => {} });
    run();
    expect(b.attrs["data-theme"]).toBe("dark");
    expect(b.meta.content).toBe("dark");
  });

  it("the pre-paint script sets light, and the colour-scheme meta, when light is stored", () => {
    const b = browser({ get: () => "light", set: () => {} });
    run();
    expect(b.attrs["data-theme"]).toBe("light");
    expect(b.meta.content).toBe("light");
  });

  it("falls back to dark when storage throws", () => {
    const b = browser({ get: blocked, set: () => {} });
    expect(readStoredTheme()).toBe("dark");
    run();
    expect(b.attrs["data-theme"]).toBe("dark");
  });

  it("saveTheme applies the theme even when storage cannot be written", () => {
    const b = browser({ get: () => null, set: blocked });
    saveTheme("light");
    expect(b.attrs["data-theme"]).toBe("light");
    expect(b.meta.content).toBe("light");
  });

  it("saveTheme stores the choice under the theme key", () => {
    const set = vi.fn();
    browser({ get: () => null, set });
    saveTheme("light");
    expect(set).toHaveBeenCalledWith(THEME_KEY, "light");
  });
});
