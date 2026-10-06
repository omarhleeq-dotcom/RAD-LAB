/**
 * Session 7 zero-behaviour-change guarantee, kept in CI: the Chest PA scenario matrix, the composed case and the
 * golden image checksums must be byte-identical to the characterisation committed BEFORE the refactor
 * (see `characterisation.ts`). Never "fix" a failure by regenerating; a difference is a behaviour change.
 *
 * Regenerate only for a deliberate, reviewed behaviour change:  npm run qa:characterise
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCaseSnapshot,
  buildGoldenChecksums,
  buildScenarioSnapshot,
  CASE_FILE,
  CHARACTERISATION_DIR,
  GOLDEN_CHECKSUMS_FILE,
  SNAPSHOT_FILE,
  stableStringify,
} from "./characterisation";
import { SCENARIOS } from "./scenario-matrix";

const WRITE = process.env.UPDATE_CHARACTERISATION === "1";
const read = (f: string) => readFileSync(f, "utf8");

function expectIdentical(file: string, now: string) {
  if (WRITE) {
    mkdirSync(CHARACTERISATION_DIR, { recursive: true });
    writeFileSync(file, now);
  }
  // Byte comparison first; on a mismatch fall back to a structural diff that names the first differing path.
  const committed = read(file);
  if (committed === now) return;
  expect(JSON.parse(now)).toEqual(JSON.parse(committed));
  expect.fail("serialisation differs from the committed characterisation");
}

describe("Session 7 characterisation (zero behaviour change)", () => {
  it("scenario snapshot (scores, verdicts, checks, EN/AR feedback and alt text, result, render plan, render hash) is byte-identical", () => {
    expectIdentical(SNAPSHOT_FILE, stableStringify(buildScenarioSnapshot()));
  });

  it("composed Chest PA case object is byte-identical", () => {
    expectIdentical(CASE_FILE, stableStringify(buildCaseSnapshot()));
  });

  it("golden image files are byte-identical (checksums)", () => {
    expectIdentical(GOLDEN_CHECKSUMS_FILE, stableStringify(buildGoldenChecksums()));
  });

  it("covers all 53 scenarios of the QA matrix", () => {
    expect(SCENARIOS.length).toBe(53);
    expect(Object.keys(JSON.parse(read(SNAPSHOT_FILE)))).toEqual(SCENARIOS.map((s) => s.id).sort());
  });
});
