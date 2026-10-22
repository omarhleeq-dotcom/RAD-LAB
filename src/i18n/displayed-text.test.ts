import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { CASES } from "@/data/cases";

/**
 * RAD-068 part 2 (D1 / D5): the words the owner removed from the learner-visible text never come back. The check reads every
 * displayed string: all messages (EN + AR) and every text field of every case / exam, EXCEPT the internal evidence
 * `status`, `note` and `reference` (internal classes and working notes; their wording is a separate open item, see the part 2 report).
 */
type Tree = { [k: string]: string | Tree };

const EN_BANNED = /provisional|validated|normally (be )?repeated|awaiting educator|educator review|demo values?/i;
/** Arabic: «مؤقت» (provisional) and «مثبت» (validated) as a label, and "the image is normally repeated" («تُعاد الصورة عادةً»). */
const AR_BANNED = /مؤقت|مثبت|تُعاد الصورة|تعاد الصورة/;
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
    expect(leaves(en as Tree).filter(([, s]) => EN_BANNED.test(s)).map(([k]) => k)).toEqual([]);
  });
  it("messages: Arabic", () => {
    const hits = leaves(ar as Tree).filter(([k, s]) => AR_BANNED.test(s) && !AR_EXEMPT_PREFIX.some((p) => k.startsWith(p)));
    expect(hits.map(([k]) => k)).toEqual([]);
  });
  it("every exam and case text field (EN + AR), evidence status / note / reference excluded", () => {
    const all: Array<[string, string]> = [];
    for (const c of CASES) caseStrings(c, c.id, all);
    expect(all.length).toBeGreaterThan(5000);
    const hits = all.filter(([, s]) => EN_BANNED.test(s) || AR_BANNED.test(s));
    expect(hits.map(([p, s]) => `${p}: ${s.slice(0, 80)}`)).toEqual([]);
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
