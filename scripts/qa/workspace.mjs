// Shared helper for the browser audits: reach a simulator control the way a learner does (RAD-074).
// Since UI-3 the simulator below 1024 px is a full-screen app view: a modal case sheet opens first, the controls sit in
// four tabs (only the active tab panel is visible) and "fine adjustment" is a closed <details>. Locating a control by role and
// name therefore fails while its tab or panel is closed. `reveal` opens the right tab/panel through the real UI (tab click,
// summary click) and returns the locator; on the desktop layout everything is already visible and it returns at once.
// No test ids and no store access: only roles, accessible names and the messages files.
export const PHONE_QUERY = "(max-width: 1023px)"; // SimulationWorkspace.tsx PHONE_QUERY
export const WORKSPACE_TABS = ["positioning", "centring", "patient", "technique"]; // workspace-tabs.ts

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const isPhone = (page) => page.evaluate((q) => matchMedia(q).matches, PHONE_QUERY);
const seen = (locator, timeout = 0) => (timeout
  ? locator.first().waitFor({ state: "visible", timeout }).then(() => true, () => false)
  : locator.first().isVisible());
const lastTab = new WeakMap(); // page -> the tab where the previous control was found (tried first)

/** Closes the modal case-details sheet that opens once when a case loads on the phone layout (Start button). No-op elsewhere. */
export async function dismissCaseSheet(page, msgs) {
  const start = page.getByRole("dialog").getByRole("button", { name: msgs.workspace.startCase, exact: true });
  if (await start.isVisible()) {
    await start.click();
    await page.getByRole("dialog").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }
}

/** Opens a workspace tab by its visible name (EN/AR); the name may carry the sr-only "not ready" suffix. */
export async function openTab(page, msgs, id) {
  const tab = page.getByRole("tab", { name: new RegExp(`^\\s*${escapeRe(msgs.workspace.tabs[id])}`) });
  if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
  await tab.and(page.locator('[aria-selected="true"]')).waitFor({ timeout: 5000 });
  lastTab.set(page, id);
}

/** Opens the closed <details> panels of the visible workspace (fine adjustment) by clicking their summaries. */
export async function expandDetails(page) {
  const closed = page.locator('[role="tabpanel"]:not([hidden]) details:not([open]) > summary, section[aria-labelledby="pos-heading"] details:not([open]) > summary');
  for (let n = await closed.count(); n > 0; n--) await closed.first().click();
}

/** Ready for control access after `goto(.../practice)`: waits for the simulator and closes the phone case sheet. */
export async function startPractice(page, msgs) {
  await page.locator('section[aria-labelledby="pos-heading"], [data-phone-app]').first().waitFor({ timeout: 20000 });
  await dismissCaseSheet(page, msgs);
}

/** Returns `locator` once it is visible, opening the phone tab and/or <details> that hold it. Throws if no tab shows it. */
export async function reveal(page, msgs, locator) {
  if (await seen(locator)) return locator;
  if (await isPhone(page)) {
    await dismissCaseSheet(page, msgs);
    // The control exists in a hidden panel: open the tab that owns that panel.
    const owner = await locator.first().evaluate((el) => el.closest('[role="tabpanel"]')?.getAttribute("aria-labelledby") ?? null, null, { timeout: 500 }).catch(() => null);
    if (owner) {
      const id = WORKSPACE_TABS.find((t) => owner.endsWith(`-tab-${t}`));
      if (id) await openTab(page, msgs, id);
    } else {
      // Role-based locators skip hidden nodes, so there is no panel to ask: try the tabs, last hit first.
      const order = [lastTab.get(page), ...WORKSPACE_TABS].filter((t, i, a) => t && a.indexOf(t) === i);
      for (const id of order) {
        await openTab(page, msgs, id);
        await expandDetails(page);
        if (await seen(locator, 400)) return locator;
      }
      throw new Error(`control not visible in any phone tab: ${locator}`);
    }
  }
  await expandDetails(page);
  if (await seen(locator, 2000)) return locator;
  throw new Error(`control not visible after opening its tab/panel: ${locator}`);
}

/** Convenience drivers bound to a page: a learner's slider drag, radio/button click or tap, all through `reveal`. */
export function driver(page, msgs, { touch = false } = {}) {
  const setSlider = async (locator, value) => {
    await reveal(page, msgs, locator);
    await locator.evaluate((node, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, String(v));
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  const slider = (name, value) => setSlider(page.getByRole("slider", { name, exact: true }), value);
  const click = async (locator) => {
    await reveal(page, msgs, locator);
    return touch ? locator.tap() : locator.click();
  };
  return { reveal: (l) => reveal(page, msgs, l), setSlider, slider, click };
}
