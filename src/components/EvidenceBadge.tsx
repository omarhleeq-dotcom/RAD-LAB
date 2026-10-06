"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { EvidenceClass } from "@/domain/technique";

/** Colour-independent: the class name is always spelled out, colour only reinforces it. */
const STYLE: Record<EvidenceClass, string> = {
  validated: "border-ok/50 bg-ok/10 text-ok",
  "common-reference": "border-brand/50 bg-brand/10 text-brand-strong",
  "vendor-protocol-dependent": "border-warn/50 bg-warn/10 text-warn",
  "educational-simplification": "border-line bg-paper text-muted",
  provisional: "border-bad/40 bg-bad/10 text-bad",
};

export function EvidenceBadge({ status, className }: { status: EvidenceClass; className?: string }) {
  const t = useTranslations("evidence");
  return (
    <span
      className={clsx(
        "inline-block rounded border px-1.5 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide",
        STYLE[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
