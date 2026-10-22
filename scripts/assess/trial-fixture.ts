/** Original non-clinical engineering fixture only. No live IDs, Auth, creation or publication. */
import type { AssessmentPublication } from "../../src/features/assess/server-contracts";
export function trialFixture(assessmentId: string, label: "visible" | "hidden"): AssessmentPublication {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assessmentId) || !["visible", "hidden"].includes(label)) throw new Error("invalid");
  const review = {
    sources: [{ reference: "Original synthetic letters fixture RAD-LAB", licenceEvidence: "Project-authored engineering text; no third-party material" }],
    reviewedBy: "Engineering fixture only; no medical review", reviewedAt: "2026-10-22T00:00:00.000Z", scope: "Non-clinical software test only",
  };
  return {
    schemaVersion: 1,
    assessment: {
      schemaVersion: 1, ref: { id: assessmentId, version: label }, name: `Engineering letters (${label})`, track: "mixed",
      maximum: "10", policy: { durationSeconds: label === "visible" ? 300 : 120, maxAttempts: 1,
        gradeVisibility: label === "visible" ? "after-submission" : "hidden" },
      items: [1, 2].map(n => ({ schemaVersion: 1, ref: { id: `q${n}`, version: "1" }, type: "single-choice", contentLanguage: "en",
        prompt: n === 1 ? "Select the letter A." : "Select the letter B.",
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] })),
    },
    itemMarks: [1, 2].map(n => ({ item: { id: `q${n}`, version: "1" }, maximum: "5" })),
    privateItems: [1, 2].map(n => ({ schemaVersion: 1, ref: { id: `q${n}`, version: "1" }, type: "single-choice",
      correctOptionId: n === 1 ? "a" : "b", review })),
  };
}
