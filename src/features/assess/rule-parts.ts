import type { CheckRule } from "@/domain/case";

export interface RulePart {
  ruleId: string;
  part: string;
  /** Dependencies, NOT permissions. Mutable paths and presentation are reviewed per item. */
  inputs: readonly string[];
  adapter: "existing-check-credit" | "requires-marker-adapter";
}

/** Inventory of current rule kinds; no global ControlSpec and no inference from category weights. */
export function ruleParts(rule: CheckRule): readonly RulePart[] {
  const one = (part: string, inputs: readonly string[]): readonly RulePart[] => [
    { ruleId: rule.id, part, inputs, adapter: "existing-check-credit" },
  ];
  switch (rule.kind) {
    case "equals": return one(rule.setting, [rule.setting]);
    case "range": return one(rule.setting, [rule.setting]);
    case "centering": return one(`centering-${rule.axis}`, [`centralRay.${rule.axis}`]);
    case "coverage": return one(`coverage-${rule.check}`, ["centralRay.x", "centralRay.y", "collimation.width", "collimation.height"]);
    case "technique":
      if (rule.check === "kvp-band") return one("kvp", ["kvp"]);
      // Conservative dependency set: exact mode/case restrictions belong to the reviewed item adapter.
      return one(rule.check, ["kvp", "mas", "sidCm", "projection", "exposureMode", "aecChambers", "centralRay", "collimation"]);
    case "marker": return [
      { ruleId: rule.id, part: "marker-side", inputs: ["sideMarker", "markerPosition", "choices"], adapter: "requires-marker-adapter" },
      { ruleId: rule.id, part: "marker-placement", inputs: ["sideMarker", "markerPosition", "centralRay", "collimation"], adapter: "requires-marker-adapter" },
    ];
    default: throw new Error("Unsupported Assess rule kind");
  }
}

/** Reject a draft criterion that cannot safely reuse a complete check; never reuse combined marker credit. */
export function assertReusablePart(part: RulePart): void {
  if (part.adapter !== "existing-check-credit") throw new Error("Marker separation requires a reviewed adapter before use");
}
