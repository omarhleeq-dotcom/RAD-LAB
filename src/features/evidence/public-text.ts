/**
 * Presentation-layer filter (S-VIS-1-2): internal working codes — decision / open-item ids ("S14.2-10", "S10b-9", "O26") and
 * section pointers into the repo's reference docs ("Technique ref §8", "§6.1") — live in the exam / case data and the repo docs,
 * but a student must not see them. Textbook and guideline citations with a page ("BONTRAGER-9 p.150", "EC16260 p.21") stay.
 * Pure string functions: no React, no data edits; every place that renders an evidence `reference`, `note` or credit line calls them.
 */

// S10b-9 · S14.2-10 · S14.1c-4 · S14.2-6…11 · S14.2a · S11b · S-STD-1 · S-VIS-1 · O26
const CODE = String.raw`(?:S-(?:STD|VIS|DOCS)-\d+|S\d+[a-z]?(?:\.\d+[a-z]?)?(?:-\d+(?:…\d+)?|[a-z])?|O\d{1,2})(?:\s+(?:option\s+[A-Z]|phase\s+\d))?`;
const CODE_RE = new RegExp(`(?<![\\w.])${CODE}(?![\\w])`, "g");
/** "Technique ref §8", "AP ref §3", "§2 Head and shoulders", "docs/…": pointers into the repo's own documents. */
const INTERNAL_POINTER_RE = /§|\bref\b|\bdocs\//i;

/** Remove internal codes from running text and tidy the punctuation they leave behind. Textbook citations are untouched. */
export function stripInternalCodes(text: string): string {
  return text
    // "(O7 closed by S10b-4)": a parenthetical that is only codes and linking words
    .replace(new RegExp(`\\s*\\(\\s*${CODE}(?:\\s*(?:closed by|see|per|and|from|[,;]))*\\s*(?:${CODE}\\s*)?(?:(?:closed by|see|per|and|from|[,;])\\s*)*\\)`, "g"), "")
    .replace(new RegExp(`(\\()\\s*${CODE}\\s*:\\s*`, "g"), "$1") // "(S10b-8: presence required)" -> "(presence required)"
    .replace(new RegExp(`\\s+(?:is|are|see|per|in)\\s+${CODE}(?=[.)\\s]|$)`, "g"), "") // "variant is O9." -> "variant."
    .replace(CODE_RE, "")
    .replace(/\(\s*[,;:\s]*\)/g, "") // "(S10b-9)" -> "()"
    .replace(/\s*\(\s*[,;]\s*/g, " (") // "(, x)"
    .replace(/\s*[,;]\s*\)/g, ")") // "(x, )"
    .replace(/([,;])\s*(?:[,;]\s*)+/g, "$1 ") // doubled separators
    .replace(/\s+([,;:.)])/g, "$1")
    .replace(/(^|[.!?]\s+)[,;:\s]+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[—–-]\s*$/, "")
    .trim();
}

/**
 * The student-visible form of an evidence `reference`: segments (split at ";") that point into the repo's own documents, and
 * segments that are nothing but internal codes, are dropped; textbook / guideline citations and any other plain text remain.
 * `null` = nothing is left, so the "Reference:" line is not drawn at all.
 */
export function publicReference(reference: string): string | null {
  const kept = reference
    .split(";")
    .map((seg) => seg.trim())
    .filter((seg) => seg && !INTERNAL_POINTER_RE.test(seg))
    .map(stripInternalCodes)
    .filter(Boolean);
  return kept.length ? kept.join("; ") : null;
}

/** The student-visible form of an evidence note or a credit line. */
export function publicText(text: string): string {
  return stripInternalCodes(text);
}
