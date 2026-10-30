import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { FORTY_INCH_SID_IDEAL_CM } from "@/data/exams/xray/forty-inch-sid";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "./engine";
import { comparisonVersion } from "./comparison-version";
import { PRACTICE_EVALUATION_VERSION } from "./version";

const certificates = readFileSync("docs/RAD-081_100_SETTINGS_2026-10-25.md", "utf8").split("\n");
const extended = CASES.filter(c => ["pelvis", "shoulder"].includes(c.bodyPart));

// Exercise the documented certificate through the real engine for every registered case.
function correctSettings(id: string): SimulationSettings {
  const exam = id.split("/")[0];
  const row = certificates.find(l => l.startsWith(`| \`${exam}\` | 100 / 100 |`));
  if (!row) throw new Error(`Missing 100-point certificate: ${id}`);
  const cols = row.split("|").map(s => s.trim());
  const cell = (index: number): string => {
    const value = cols[index];
    if (value === undefined) throw new Error(`Missing certificate column ${index}: ${id}`);
    return value;
  };
  const pair = (text: string): [number, number] => {
    const values = text.replace(/[`()]/g, "").split(",").map(Number);
    const [x, y] = values;
    if (values.length !== 2 || x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Invalid coordinates: ${id}`);
    return [x, y];
  };
  const [x, y] = pair(cell(5)), [width, height] = pair(cell(6));
  const marker = cell(7).match(/`([LR])`.*`\(([^)]+)\)/);
  if (!marker?.[1] || !marker[2]) throw new Error(`Missing certificate marker: ${id}`);
  const [mx, my] = pair(marker[2]);
  const [sidCm, kvp, mas] = cell(8).split("/").map(Number);
  const extra = certificates.find(l => l.startsWith(`| \`${exam}\` | \`{`));
  return {
    projection: cell(3).replace(/`/g, "") as SimulationSettings["projection"], rotationDeg: Number(cell(4)),
    centralRay: { x, y }, collimation: { width, height }, sideMarker: marker[1] as "L" | "R",
    markerPosition: { x: mx, y: my }, sidCm, kvp, mas, exposureMode: "manual", aecChambers: [], motionInstruction: "remain-still",
    ...(extra ? JSON.parse((extra.split("|")[2] ?? "").trim().replace(/^`|`$/g, "")) : {}),
  };
}

describe("owner 2026-10-30: shared 40-inch SID contract", () => {
  it.each(CASES)("$id has a documented fully correct 100/100 answer", c => {
    const result = evaluate(c, correctSettings(c.id));
    expect(result.score.total).toBe(100);
    expect(result.score.passed).toBe(true);
    expect(result.criticalFindings).toEqual([]);
    expect(result.checks.every(check => check.outcome === "pass")).toBe(true);
    const sid = c.rules.find(r => r.id === "sid");
    if (c.bodyPart === "chest") {
      expect(sid).toMatchObject({ ideal: [180, 185] });
      if (c.id.startsWith("chest-ap-supine")) expect(sid).toMatchObject({ acceptable: [102, 200] });
    } else {
      expect(sid).toMatchObject({ ideal: [100, 110], acceptable: [95, 130], evidence: { status: "provisional" } });
      expect(sid && "ideal" in sid ? sid.ideal : null).toBe(FORTY_INCH_SID_IDEAL_CM);
    }
  });

  it.each(extended)("$id changes SID grading only in [100, 102)", async c => {
    const previous = { ...c, rules: c.rules.map(r => r.id === "sid" && r.kind === "range" ? { ...r, ideal: [102, 110] as [number, number] } : r) };
    for (const sidCm of [80, 94, 95, 99, 99.99, 100, 100.01, 101, 101.99, 102, 110, 111, 130, 131, 200]) {
      const settings = { ...correctSettings(c.id), sidCm };
      const before = evaluate(previous, settings), after = evaluate(c, settings);
      if (sidCm >= 100 && sidCm < 102) {
        expect(before.checks.find(r => r.ruleId === "sid")?.outcome).toBe("partial");
        expect(after.checks.find(r => r.ruleId === "sid")?.outcome).toBe("pass");
        expect(after.score.total).toBe(100);
        expect(after.exposure).toEqual(before.exposure);
        expect(after.checks.filter(r => r.ruleId !== "sid")).toEqual(before.checks.filter(r => r.ruleId !== "sid"));
        expect(after.resultState).toEqual({ ...before.resultState, findings: before.resultState.findings.filter(f => f.ruleId !== "sid") });
      } else expect(after).toEqual(before);
    }
    expect(PRACTICE_EVALUATION_VERSION).toBe("radlab-practice-evaluation/9");
    expect(await comparisonVersion(c, PRACTICE_EVALUATION_VERSION)).not.toBe(await comparisonVersion(previous, "radlab-practice-evaluation/8"));
  });
});
