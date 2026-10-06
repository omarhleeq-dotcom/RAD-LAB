"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { ExposureReadiness } from "@/features/technique/readiness";

const LED: Record<ExposureReadiness["level"], string> = {
  ready: "bg-[#4ade80] shadow-[0_0_8px_#4ade80]",
  caution: "bg-signal shadow-[0_0_8px_#f2b134]",
  blocked: "bg-[#ff6b61] shadow-[0_0_8px_#ff6b61]",
};

/** Workflow status only. Never says whether a value is correct. */
export function ReadinessPanel({ readiness, id }: { readiness: ExposureReadiness; id: string }) {
  const t = useTranslations("console.readiness");
  return (
    <div id={id} className="rounded border border-console-line bg-black/20 p-3">
      <div className="flex items-center gap-2" role="status">
        <span aria-hidden className={clsx("h-3 w-3 shrink-0 rounded-full", LED[readiness.level])} />
        <h3 className="text-sm font-semibold text-white">
          {t("title")}: <span className="font-bold">{t(readiness.level)}</span>
        </h3>
      </div>
      {readiness.items.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-xs text-console-text">
          {readiness.items.map((i) => (
            <li key={i.id} className="flex gap-2">
              <span aria-hidden className={clsx("font-bold", i.level === "blocked" ? "text-[#ff8a80]" : "text-signal")}>
                {i.level === "blocked" ? "✕" : "!"}
              </span>
              <span>{t(`items.${i.id}`)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[0.7rem] text-console-text/60">{t("note")}</p>
    </div>
  );
}
