/**
 * Site theme (RAD-069 B2a, F7). Dark is the default; the choice is kept on this device only and the site never follows the
 * device setting. Every storage access is guarded: when storage fails the theme is dark.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "radlab-theme";
export const DEFAULT_THEME: Theme = "dark";

export const parseTheme = (value: unknown): Theme => (value === "light" ? "light" : DEFAULT_THEME);

export function readStoredTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Sets the root attribute and the colour-scheme declaration the browser reads (so its own darkening stays off). */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme);
  window.dispatchEvent(new Event("radlab:theme"));
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* the choice then lasts for this page view only */
  }
  applyTheme(theme);
}

/** Runs in <head> before first paint (inline in the static HTML), so the page never shows one theme and then the other. */
export const THEME_INIT_SCRIPT = `(function(){var t="${DEFAULT_THEME}";try{if(localStorage.getItem("${THEME_KEY}")==="light")t="light"}catch(e){}var d=document.documentElement;d.setAttribute("data-theme",t);var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute("content",t)})()`;
