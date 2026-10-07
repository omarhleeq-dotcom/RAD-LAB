/**
 * S14-0: the open registries (projection ids, wording namespaces, scene layouts). Chest PA / Lateral / AP stay byte-identical
 * (characterisation, goldens and `qa/scene-dom.test.ts`); this pins the registry contract a new exam relies on.
 */
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { EXAMS } from "@/data/exams";
import { PROJECTIONS, isRegisteredProjection } from "@/data/projections";
import { SCENE_IDS } from "@/domain/exam";
import { SCENES } from "@/features/positioning/scenes";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateExam } from "./validate";
import messagesEn from "../../../messages/en.json";

describe("projection registry (ProjectionId is open)", () => {
  it("every projection an exam or case names is registered", () => {
    for (const e of EXAMS) for (const id of [e.requiredProjection, ...e.availableProjections]) expect(isRegisteredProjection(id), `${e.id}: ${id}`).toBe(true);
    for (const c of CASES) for (const id of [c.requiredProjection, ...c.availableProjections]) expect(isRegisteredProjection(id), `${c.id}: ${id}`).toBe(true);
  });

  it("the chest wording namespaces are exactly as before the registry (PA = common wording)", () => {
    expect(wordingNsOf(undefined)).toBeUndefined();
    expect(wordingNsOf("pa-erect")).toBeUndefined();
    expect(wordingNsOf("lateral-left")).toBe("lateral");
    expect(wordingNsOf("ap-erect")).toBe("ap");
    expect(wordingNsOf("not-registered")).toBeUndefined();
    expect(wordingNsOf("toString")).toBeUndefined();
  });

  it("every declared wording namespace has result wording in the messages", () => {
    const rad = messagesEn.radiograph as Record<string, unknown>;
    for (const [id, spec] of Object.entries(PROJECTIONS)) if (spec.wordingNs) expect(rad[spec.wordingNs], `${id} → radiograph.${spec.wordingNs}`).toBeDefined();
  });

  it("validateExam rejects an unregistered projection", () => {
    const exam = EXAMS[0]!;
    expect(validateExam(exam)).toEqual([]);
    const bad = { ...exam, availableProjections: [...exam.availableProjections, "unregistered-projection"] };
    expect(validateExam(bad).some((m) => m.includes("unregistered-projection"))).toBe(true);
  });
});

describe("scene registry", () => {
  it("every registered scene id has a scene component", () => {
    for (const id of SCENE_IDS) expect(SCENES[id], id).toBeTypeOf("function");
  });
});
