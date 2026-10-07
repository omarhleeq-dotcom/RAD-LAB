/**
 * Presentation-layer filter (S-VIS-1-2): internal working codes — decision / open-item ids ("S14.2-10", "S10b-9", "O26") and
 * section pointers into the repo's reference docs ("Technique ref §8", "§6.1") — live in the exam / case data and the repo docs,
 * but a student must not see them. Textbook and guideline citations with a page ("BONTRAGER-9 p.150", "EC16260 p.21") stay.
 * Pure string functions: no React, no data edits; every place that renders an evidence `reference`, `note` or credit line calls them.
 */

// S10b-9 · S14.2-10 · S14.1c-4 · S14.2-6…11 · S14.2a · S11b · S-STD-1 · S-VIS-1 · O26
const CODE = String.raw`(?:S-(?:STD|VIS|DOCS)-\d+|S\d+[a-z]?(?:\.\d+[a-z]?)?(?:-\d+(?:…\d+)?|[a-z])?|O\d{1,2})(?:\s+(?:option\s+[A-Z]|phase\s+\d))?`;
const CODE_RE = new RegExp(`(?<![\\w.])${CODE}(?![\\w])`, "g");
/** A segment that still names a source with a page, or a known source id, after the codes are removed. */
const CITATION_RE = /\bp{1,2}\.\s?\d|\b(?:BONTRAGER|EC16260|WHO|ACR|STATPEARLS|CLARK)\b/;
/** "Technique ref §8", "AP ref §3", "§2 Head and shoulders", "docs/…": pointers into the repo's own documents. */
const INTERNAL_POINTER_RE = /§|\bref\b|\bdocs\//i;

/** Remove internal codes from running text and tidy the punctuation they leave behind. Textbook citations are untouched. */
export function stripInternalCodes(text: string): string {
  return text
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
 * The student-visible form of an evidence `reference`: only the textbook / guideline citations (with a page or a source id) remain.
 * `null` = nothing citable is left, so the "Reference:" line is not drawn at all.
 */
export function publicReference(reference: string): string | null {
  const kept = reference
    .split(";")
    .map((seg) => seg.trim())
    .filter((seg) => seg && !INTERNAL_POINTER_RE.test(seg))
    .map(stripInternalCodes)
    .filter((seg) => CITATION_RE.test(seg));
  return kept.length ? kept.join("; ") : null;
}

/** The student-visible form of an evidence note or a credit line. */
export function publicText(text: string): string {
  return stripInternalCodes(text);
}
