"use client";

import { useId, useRef, useState, type ReactNode } from "react";

const COMPACT = "flex min-h-11 w-full items-center justify-between gap-2 rounded py-1 text-start text-xs text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Mounted content preserves all evidence for assistive tools and SSR guards; hidden content is out of the tab order.
 * Focus stays on the toggle on close; Escape from within the panel closes and returns to its toggle.
 * `compact` (RAD-100): a borderless, unpadded secondary toggle nested inside a check, still one ≥44 px tap target.
 */
export function ResultDisclosure({ title, children, className = "", label, compact = false }: { title: ReactNode; children: ReactNode; className?: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className={className}>
      <button ref={trigger} type="button" aria-label={label} aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(!open)} className={compact ? COMPACT : "group flex min-h-11 w-full items-start justify-between gap-2 rounded px-3 py-2 text-start text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"}>
        <span className="min-w-0 flex-1">{title}</span><svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${compact ? "size-4" : "mt-0.5 size-5"} shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={id} hidden={!open} className={compact ? "pb-1" : "px-3 pb-3"} onKeyDown={(e) => {
        if (e.key === "Escape") { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
      }}>{children}</div>
    </div>
  );
}
