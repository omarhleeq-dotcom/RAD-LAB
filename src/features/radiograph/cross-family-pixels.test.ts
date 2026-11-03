import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { checkIsDrawn } from "./consistency";
import { anchorShift, elbowApValue, handPaShiftU, renderRadiograph, type LumaImage } from "./pipeline";
import { WITNESS_CASES, witnessProbes, witnessResolution } from "./cross-family-test-utils";

const FILE = "scripts/qa/radiograph-pixel-witnesses.json";
const sha = (v: string | Uint8Array | Uint8ClampedArray) => createHash("sha256")
  .update(typeof v === "string" ? v : Buffer.from(v.buffer, v.byteOffset, v.byteLength)).digest("hex");
// Next's lockfile-pinned image decoder; no new dependency or browser/font requirement in CI.
const requireNext = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
const sharp = requireNext("sharp") as (input: Buffer) => {
  removeAlpha(): { raw(): { toBuffer(options: { resolveWithObject: true }): Promise<{ data: Buffer; info: { width: number; height: number; channels: number } }> } };
};
type Witness = { source: string; decoded: string; scenarios: Record<string, { effect: string; patch: unknown; plan: string; soloPlan: string; luma: string; soloLuma: string; size: number[]; effects: string[] }> };
const capture = process.env.CAPTURE_RADIOGRAPH_BASELINE === "origin/main";
if (capture && existsSync(FILE)) throw Error("Baseline already locked: never overwrite witnesses.");
const locked: Record<string, Witness> = capture ? {} : JSON.parse(readFileSync(FILE, "utf8")).exams;
const captured: Record<string, Witness> = {};

it("compatibility exports retain interpolation and neutral-image kernel contracts", () => {
  expect(anchorShift([{ u: 0, du: 0 }, { u: 1, du: 0.2 }], 0.5)).toBe(0.1);
  expect(handPaShiftU(0.5, 0.5, { kind: "hand-pa", degrees: 0, shiftU: 0, overlapShiftU: 0 }, { bands: [{ v1: 0.2, v2: 0.8 }] })).toBe(0);
  expect(elbowApValue([], { ulna: [], radius: [] }, { forearm: { v1: 0.4, v2: 1, splitU: 0.5 } }, () => 7, 0.5, 0.7)).toBe(7);
});

describe("real-asset cross-family byte witnesses (never regenerate after a product edit)", () => {
  for (const c of WITNESS_CASES) it(`${c.id}: plan and luma comparisons are separate`, async () => {
    const bytes = readFileSync(`public${c.radiograph.src}`);
    const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const red = Uint8Array.from({ length: info.width * info.height }, (_, i) => data[i * info.channels]!);
    const src: LumaImage = { width: info.width, height: info.height, data: Float32Array.from(red) };
    const witness: Witness = { source: sha(bytes), decoded: sha(red), scenarios: {} };
    const probes = witnessProbes(c);
    for (const probe of probes.filter(p => /^(centered-|fitted-excess-).*\/threshold-/.test(p.id))) {
      const before = probes.find(p => p.id === probe.id.replace("/threshold-", "/before-"))!;
      expect(probe.plan.effects.some(e => e.id === probe.effect), `${c.id}/${probe.id}: active boundary`).toBe(true);
      expect(before.plan.effects.some(e => e.id === probe.effect), `${c.id}/${before.id}: inactive neighbour`).toBe(false);
    }
    const rendered = new Map<string, { hash: string; size: number[] }>();
    const hash = (p: typeof probes[number]["plan"]) => {
      // Descriptive effect cards are not consumed by the renderer; identical numerical inputs share a render.
      const key = JSON.stringify({ ...p, effects: [] });
      const cached = rendered.get(key);
      if (cached) return cached;
      const out = renderRadiograph(p, c.radiograph, src, witnessResolution(p, c));
      const result = { hash: sha(out.luma), size: [out.width, out.height] };
      rendered.set(key, result);
      return result;
    };
    for (const probe of probes) {
      const actual = hash(probe.plan);
      const solo = probe.solo === probe.plan ? actual : hash(probe.solo);
      const row = {
        effect: probe.effect, patch: probe.patch, plan: sha(JSON.stringify(probe.plan)), soloPlan: sha(JSON.stringify(probe.solo)),
        luma: actual.hash, soloLuma: solo.hash, size: actual.size, effects: probe.plan.effects.map(e => e.id),
      };
      witness.scenarios[probe.id] = row;
      if (!capture) {
        const expected = locked[c.id]!.scenarios[probe.id];
        expect(expected, `${c.id}/${probe.id}: missing locked scenario`).toBeDefined();
        expect(row.plan, `${c.id}/${probe.id}: evaluated plan`).toBe(expected!.plan);
        expect(row.soloPlan, `${c.id}/${probe.id}: isolated pixel plan`).toBe(expected!.soloPlan);
        expect(row.luma, `${c.id}/${probe.id}: full-plan luma — STOP on mismatch`).toBe(expected!.luma);
        expect(row.soloLuma, `${c.id}/${probe.id}: isolated luma — STOP on mismatch`).toBe(expected!.soloLuma);
        expect(row, `${c.id}/${probe.id}: metadata`).toEqual(expected);
      }
    }
    if (["chest-lateral-erect", "pelvis-ap-supine", "shoulder-grashey-erect"].includes(c.id)) {
      const gap = probes.find(p => p.id === "penetration/min")!;
      expect(c.radiograph.denseZones, "known gap: asset has no penetration zones").toBeUndefined();
      expect(gap.plan.effects.find(e => e.id === "low-penetration")?.changesPixels).toBe(true);
      expect(checkIsDrawn("kvp", "fail", gap.plan), "known gap: declared drawn, although isolated pixels are identical").toBe(true);
      expect(witness.scenarios[gap.id]!.soloLuma).toBe(witness.scenarios.baseline!.luma);
    }
    if (!capture) expect(witness).toEqual(locked[c.id]);
    captured[c.id] = witness;
  }, 120_000);

  it("covers the locked exam set; capture is permitted only against untouched origin/main product code", () => {
    expect(Object.keys(captured).sort()).toEqual(WITNESS_CASES.map(c => c.id).sort());
    if (capture) {
      // One-time baseline lock; this mode refuses any product diff, including staged changes.
      const { execFileSync } = createRequire(import.meta.url)("node:child_process");
      expect(execFileSync("git", ["diff", "origin/main", "--", "src", ":(exclude)src/features/radiograph/*test*"], { encoding: "utf8" })).toBe("");
      writeFileSync(FILE, JSON.stringify({
        version: 1, baseline: execFileSync("git", ["rev-parse", "origin/main"], { encoding: "utf8" }).trim(),
        decoder: `Next dependency sharp ${requireNext("sharp").versions.sharp}; original resolution, red channel to Float32`,
        seed: "0x52414431", resolution: "resultPxPerCm; no annotation glyphs", exams: captured,
      }, null, 2) + "\n");
    } else expect(Object.keys(locked).sort()).toEqual(Object.keys(captured).sort());
  });
});
