// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { SceneLabel } from "./SceneParts";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe("desktop measured label containment", () => {
  it.each([false, true])("bounds provided=%s; unbounded phone coordinates stay unchanged", async bounded => {
    const node = document.createElement("div"); document.body.append(node); const root = createRoot(node);
    Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value: function(this: SVGElement) { return { x: Number(this.getAttribute("x")), y: Number(this.getAttribute("y")) - 27, width: 80, height: 42 }; } });
    await act(async () => root.render(h("svg", null, h(SceneLabel, { x: 44, y: 329, size: 22, bounds: bounded ? { x: -30, y: -148, width: 300, height: 486 } : undefined, children: "Forearm" }))));
    const text = node.querySelector("text")!;
    expect(Number(text.getAttribute("x"))).toBe(44);
    expect(Number(text.getAttribute("y"))).toBe(bounded ? 321 : 329);
    await act(async () => root.unmount()); node.remove();
  });
});
