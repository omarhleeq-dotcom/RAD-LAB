"use client";
import type { ReactNode } from "react";
/** Presentation-only owner helpers: no data access, no state beyond the native disclosure. */
export const ownerControl = "min-h-11 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:opacity-60";
/** Paging controls appear only when there is more than one page (F7). */
export function Pager({ atStart, hasNext, first, next, firstLabel, nextLabel, disabled = false, nextTestId, className = ownerControl }: {
 atStart: boolean; hasNext: boolean; first: () => void; next: () => void; firstLabel: string; nextLabel: string; disabled?: boolean; nextTestId?: string; className?: string;
}) {
 if (atStart && !hasNext) return null;
 return <div className="flex flex-wrap gap-2">
  <button type="button" className={className} disabled={disabled || atStart} onClick={first}>{firstLabel}</button>
  <button type="button" data-testid={nextTestId} className={className} disabled={disabled || !hasNext} onClick={next}>{nextLabel}</button>
 </div>;
}
/** A long section, collapsed by default, with a visible labelled toggle (F3/F4). */
export function Fold({ title, children, open, testId, className = "", onToggle }: { title: ReactNode; children: ReactNode; open?: boolean; testId?: string; className?: string; onToggle?: (open: boolean) => void }) {
 return <details open={open} data-testid={testId} onToggle={onToggle ? e => onToggle(e.currentTarget.open) : undefined} className={`min-w-0 rounded-lg border border-line bg-panel ${className}`}>
  <summary className="flex min-h-11 cursor-pointer items-center px-3 py-2 font-semibold">{title}</summary>
  <div className="min-w-0 space-y-3 px-3 pb-3">{children}</div>
 </details>;
}
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "warn" }) {
 return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${tone === "warn" ? "border-signal" : "border-line bg-paper"}`}>{children}</span>;
}
