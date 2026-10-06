"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { ImageVariantId, SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";

const U = 10;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  variants: ImageVariantId[];
}

/**
 * PLACEHOLDER result visualisation. It is a labelled schematic, not a radiograph.
 * Real, validated image variants will replace it (see CLAUDE.md "Image variants").
 */
export function ResultImage({ radCase, settings, variants }: Props) {
  const t = useTranslations("result");
  const { detector } = radCase;
  const W = detector.widthCm * U;
  const H = detector.heightCm * U;
  const f = collimatedField(settings, detector);
  const has = (v: ImageVariantId) => variants.includes(v);

  const rotated = has("rotated") ? settings.rotationDeg : 0;
  const shift = Math.sin((rotated * Math.PI) / 180) * 60;
  const poorInsp = has("poor-inspiration");
  const heartScale = poorInsp || has("magnified-geometry") || settings.projection === "ap-erect" ? 1.18 : 1;
  const brightness = has("underexposed") ? 0.5 : has("overexposed") ? 1.9 : 1;
  const contrast = has("underexposed") ? 1.3 : has("overexposed") ? 0.55 : 1;
  const blur = has("magnified-geometry") ? 1.2 : 0;
  const ribs = poorInsp ? 6 : 10;
  const lungBottom = poorInsp ? 250 : 320;
  const mid = W / 2;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("alt")} className="h-auto w-full max-w-sm rounded border border-console-line" style={{ direction: "ltr" }}>
        <defs>
          <clipPath id="result-field">
            <rect x={f.x1 * U} y={f.y1 * U} width={(f.x2 - f.x1) * U} height={(f.y2 - f.y1) * U} />
          </clipPath>
          <pattern id="result-hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={14} height={14} fill="#e8edf1" />
            <line x1={0} y1={0} x2={0} y2={14} stroke="#c3ced6" strokeWidth={4} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#result-hatch)" />
        <g clipPath="url(#result-field)">
          <g style={{ filter: `brightness(${brightness}) contrast(${contrast})${blur ? ` blur(${blur}px)` : ""}` }}>
            <rect width={W} height={H} fill="#16191c" />
            <g fill="#4a5258" opacity={0.95}>
              <rect x={mid - 130 + shift * 0.4} y={40} width={115} height={lungBottom - 20} rx={55} />
              <rect x={mid + 15 + shift * 0.4} y={40} width={115 + shift * 0.3} height={lungBottom - 20} rx={55} />
            </g>
            <g stroke="#8a949b" strokeWidth={3} fill="none" opacity={0.8}>
              {Array.from({ length: ribs }, (_, i) => {
                const y = 70 + i * ((lungBottom - 70) / ribs);
                return (
                  <g key={i}>
                    <path d={`M ${mid + shift} ${y} Q ${mid - 80 + shift} ${y - 18} ${mid - 125} ${y + 22}`} />
                    <path d={`M ${mid + shift} ${y} Q ${mid + 80 + shift} ${y - 18} ${mid + 125} ${y + 22}`} />
                  </g>
                );
              })}
            </g>
            <ellipse cx={mid - 25 + shift} cy={lungBottom - 85} rx={50 * heartScale} ry={65 * heartScale} fill="#aab3b9" opacity={0.85} />
            <line x1={mid + shift} y1={20} x2={mid + shift} y2={lungBottom + 30} stroke="#cfd6db" strokeWidth={14} opacity={0.7} />
            <path d={`M 20 ${lungBottom + 15} Q ${mid} ${lungBottom - 25} ${W - 20} ${lungBottom + 15}`} stroke="#9aa5ac" strokeWidth={6} fill="none" />
          </g>
        </g>
        <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={20} fontWeight={700} fill="#b3261e">
          PLACEHOLDER
        </text>
      </svg>
      <figcaption className="mt-2 text-xs font-medium text-bad">{t("placeholderLabel")}</figcaption>
    </figure>
  );
}
