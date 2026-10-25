// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
import { ProfileName } from "./ProfileName";
let root: Root, node: HTMLDivElement;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { node = document.createElement("div"); document.body.append(node); root = createRoot(node); });
afterEach(async () => { await act(async () => root.unmount()); node.remove(); });
const click = async (label: string) => { await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === label)!.click()); };
const fill = async (value: string) => { await act(async () => { const input = node.querySelector("input")!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); }); };
it("shows a saved name as text; Edit/Cancel restores it without saving", async () => {
  const save = vi.fn(async () => true);
  await act(async () => root.render(h(ProfileName, { name: "Old Name", email: "synthetic@example.test", save })));
  expect(node.querySelector("input")).toBeNull();
  await click("editName"); await fill("Unsaved Name"); await click("cancelName");
  expect(node.textContent).toContain("Old Name"); expect(node.textContent).not.toContain("Unsaved Name"); expect(save).not.toHaveBeenCalled();
  await click("editName"); expect(node.querySelector("input")!.value).toBe("Old Name");
  await fill("  New Name  "); await click("save");
  expect(save).toHaveBeenCalledExactlyOnceWith("New Name"); expect(node.querySelector("input")).toBeNull(); expect(node.textContent).toContain("New Name");
  await click("editName"); await fill("Discarded Name"); await click("cancelName"); expect(node.textContent).toContain("New Name");
});
it("keeps the field and draft when the same save action fails", async () => {
  const save = vi.fn(async () => false);
  await act(async () => root.render(h(ProfileName, { name: null, email: "synthetic@example.test", save })));
  await fill("First Name"); await click("save");
  expect(node.querySelector("input")!.value).toBe("First Name"); expect(node.querySelector('[role="alert"]')).not.toBeNull();
});
