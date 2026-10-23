import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { CASES } from "@/data/cases";
import { publicReference, publicText } from "@/features/evidence/public-text";

/**
 * RAD-068 part 2 (D1 / D5): the words the owner removed from the learner-visible text never come back. The check reads every
 * displayed string: all messages (EN + AR), every text field of every case / exam, and (RAD-068 final part) the evidence `note` and
 * `reference` in the form the result panel draws them. Internal ids, data keys, the evidence `status` and notes that no screen
 * renders (technique profile, radiograph and exam-level notes) are out of scope.
 */
type Tree = { [k: string]: string | Tree };

const EN_BANNED = /provisional|validated|normally (be )?repeated|awaiting educator|educator review|demo values?|pending educator|physicist review|owner-verified/i;
/** The credits page states licence evidence ("owner-verified licence evidence", D3); that is licence status, not a claim about a value. */
const EN_EXEMPT_PREFIX = ["credits"];
/** Arabic: «مؤقت» (provisional) and «مثبت» (validated) as a label, and "the image is normally repeated" («تُعاد الصورة عادةً»). */
const AR_BANNED = /مؤقت|مثبت|تُعاد الصورة|تعاد الصورة|بانتظار مراجعة|مراجعة المعلم|مراجعة الفيزيائي/;
/**
 * In the Assess and credits namespaces «مؤقت» means "temporary" (a temporary test, a temporary save), «مثبت» means "pinned / installed"
 * (a pinned test version) or "not established" (a licence not yet confirmed): ordinary words, not the evidence badge.
 */
const AR_EXEMPT_PREFIX = ["assess", "credits", "admin", "account"];

function leaves(tree: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : leaves(v, `${prefix}${k}.`)));
}
const SKIP_FIELD = new Set(["note", "reference", "status", "id", "examId", "kind"]);
function caseStrings(v: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => caseStrings(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) if (!SKIP_FIELD.has(k)) caseStrings(x, `${path}.${k}`, out);
}

describe("no removed wording in any displayed string (D1 / D5, RAD-068 part 2)", () => {
  it("messages: English", () => {
    const hits = leaves(en as Tree).filter(([k, s]) => EN_BANNED.test(s) && !(EN_EXEMPT_PREFIX.some((p) => k.startsWith(p)) && !/provisional|validated|educator|physicist|demo/i.test(s)));
    expect(hits.map(([k]) => k)).toEqual([]);
  });
  it("messages: Arabic", () => {
    const hits = leaves(ar as Tree).filter(([k, s]) => AR_BANNED.test(s) && !AR_EXEMPT_PREFIX.some((p) => k.startsWith(p)));
    expect(hits.map(([k]) => k)).toEqual([]);
  });
  it("every exam and case text field (EN + AR), evidence status excluded", () => {
    const all: Array<[string, string]> = [];
    for (const c of CASES) caseStrings(c, c.id, all);
    expect(all.length).toBeGreaterThan(5000);
    const hits = all.filter(([, s]) => EN_BANNED.test(s) || AR_BANNED.test(s));
    expect(hits.map(([p, s]) => `${p}: ${s.slice(0, 80)}`)).toEqual([]);
  });
  it("every evidence note and reference the screens draw (rules, critical findings, technique references), as displayed", () => {
    const shown: Array<[string, string]> = [];
    for (const c of CASES) {
      const add = (path: string, e?: { note?: string; reference?: string }, withNote = true) => {
        if (withNote && e?.note) shown.push([`${c.id}.${path}.note`, publicText(e.note)]);
        if (e?.reference) shown.push([`${c.id}.${path}.reference`, publicReference(e.reference) ?? ""]);
      };
      (c.rules ?? []).forEach((r, i) => add(`rules[${i}].evidence`, (r as { evidence?: { note?: string; reference?: string } }).evidence));
      (c.scoring.criticalFindings ?? []).forEach((f, i) => { add(`crit[${i}].concept`, f.concept); add(`crit[${i}].evidence`, f.evidence, true); });
      (c.technique.assumptions ?? []).forEach((a, i) => add(`assumptions[${i}].evidence`, a.evidence, false));
    }
    expect(shown.length).toBeGreaterThan(500);
    expect(shown.filter(([, s]) => EN_BANNED.test(s) || /\bTODO\b|demo (region|target)|educator (decision|confirmation)/i.test(s)).map(([p, s]) => `${p}: ${s.slice(0, 80)}`)).toEqual([]);
  });
});

describe("evidence badge labels (owner decision, 2026-10-22): D5 never says validated", () => {
  it("shows SOURCE-BASED / TEACHING VALUE (EN) and «مستند إلى مصدر» / «قيمة تعليمية» (AR); internal ids are unchanged", () => {
    expect((en as Tree & { evidence: Tree }).evidence.validated).toBe("SOURCE-BASED");
    expect((en as Tree & { evidence: Tree }).evidence.provisional).toBe("TEACHING VALUE");
    expect((ar as Tree & { evidence: Tree }).evidence.validated).toBe("مستند إلى مصدر");
    expect((ar as Tree & { evidence: Tree }).evidence.provisional).toBe("قيمة تعليمية");
    for (const id of ["validated", "common-reference", "vendor-protocol-dependent", "educational-simplification", "provisional"])
      for (const m of [en, ar]) expect((m as Tree & { evidence: Tree }).evidence[id], id).toBeTruthy();
  });
});

describe("Arabic age line (ICU plural: 1 «عام واحد», 2 «عامان», 3–10 «أعوام», 11+ «عامًا»)", () => {
  const t = createTranslator({ locale: "ar", messages: ar as never }) as unknown as (key: string, values?: Record<string, string | number>) => string;
  it.each([
    [1, "عام واحد"], [2, "عامان"], [3, "3 أعوام"], [10, "10 أعوام"], [11, "11 عامًا"], [21, "21 عامًا"], [45, "45 عامًا"],
  ])("age %i", (age, text) => {
    expect(t("home.patientLine", { sex: "male", sexLabel: "ذكر", age })).toBe(`ذكر عمره ${text}`);
    expect(t("home.patientLine", { sex: "female", sexLabel: "أنثى", age })).toBe(`أنثى عمرها ${text}`);
  });
});
