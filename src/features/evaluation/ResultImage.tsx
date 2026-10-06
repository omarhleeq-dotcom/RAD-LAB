"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { ImageVariantId, SimulationSettings } from "@/domain/simulation";
import type { NoiseLevel } from "@/domain/technique";
import { collimatedField } from "@/features/simulation/geometry";

const U = 10;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  variants: ImageVariantId[];
  /** Quantum-noise tendency from the exposure model (renderer input; never derived from the picture). */
  noise: NoiseLevel;
}

const NOISE_OPACITY: Record<NoiseLevel, number> = { reduced: 0, target: 0, increased: 0.22, marked: 0.45 };

/**
 * PLACEHOLDER result visualisation. It is a labelled schematic, not a radiograph.
 * Real, validated image variants will replace it (see CLAUDE.md "Image variants").
 *
 * Exposure is shown as a NOISE tendency only. Displayed brightness/contrast is intentionally held constant:
 * DR processing normalises it, so brightness is not an exposure indicator (technique reference §5).
 */
export function ResultImage({ radCase, settings, variants, noise }: Props) {
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
  const lowPenetration = has("low-penetration");
  const blur = has("magnified-geometry") ? 1.2 : 0;
  const ribs = poorInsp ? 6 : 10;
  const lungBottom = poorInsp ? 250 : 320;
  const mid = W / 2;
  const marker = settings.sideMarker;
  const mx = ((settings.markerPosition.x + 1) / 2) * W;
  const my = ((settings.markerPosition.y + 1) / 2) * H;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("alt")} className="h-auto w-full max-w-sm rounded border border-console-line" style={{ direction: "ltr" }}>
        <defs>
          <clipPath id="result-field">
            <rect x={f.x1 * U} y={f.y1 * U} width={(f.x2 - f.x1) * U} height={(f.y2 - f.y1) * U} />
          </clipPath>
          <filter id="result-noise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern id="result-hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={14} height={14} fill="#e8edf1" />
            <line x1={0} y1={0} x2={0} y2={14} stroke="#c3ced6" strokeWidth={4} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#result-hatch)" />
        <g clipPath="url(#result-field)">
          <g style={blur ? { filter: `blur(${blur}px)` } : undefined}>
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
            {/* low penetration: the heart shadow stays opaque, hiding the spine behind it */}
            {lowPenetration && <line x1={mid + shift} y1={20} x2={mid + shift} y2={lungBottom + 30} stroke="#cfd6db" strokeWidth={14} opacity={0.7} />}
            <ellipse cx={mid - 25 + shift} cy={lungBottom - 85} rx={50 * heartScale} ry={65 * heartScale} fill="#aab3b9" opacity={lowPenetration ? 1 : 0.85} />
            {has("scapulae-overlap") && (
              <g fill="#8a949b" opacity={0.55}>
                <ellipse cx={mid - 105} cy={190} rx={26} ry={72} />
                <ellipse cx={mid + 105} cy={190} rx={26} ry={72} />
              </g>
            )}
            {has("chin-overlap") && <ellipse cx={mid} cy={52} rx={62} ry={34} fill="#aab3b9" opacity={0.8} />}
            {!lowPenetration && <line x1={mid + shift} y1={20} x2={mid + shift} y2={lungBottom + 30} stroke="#cfd6db" strokeWidth={14} opacity={0.7} />}
            <path d={`M 20 ${lungBottom + 15} Q ${mid} ${lungBottom - 25} ${W - 20} ${lungBottom + 15}`} stroke="#9aa5ac" strokeWidth={6} fill="none" />
            {NOISE_OPACITY[noise] > 0 && (
              <rect width={W} height={H} filter="url(#result-noise)" opacity={NOISE_OPACITY[noise]} style={{ mixBlendMode: "overlay" }} />
            )}
          </g>
          {marker && (
            <text x={mx} y={my + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill="#f4f6f8" stroke="#16191c" strokeWidth={0.5}>
              {marker}
            </text>
          )}
        </g>
        <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={20} fontWeight={700} fill="#b3261e">
          PLACEHOLDER
        </text>
      </svg>
      <figcaption className="mt-2 text-xs font-medium text-bad">{t("placeholderLabel")}</figcaption>
      <p className="mt-1 text-xs text-muted">{t("imageBrightnessNote")}</p>
    </figure>
  );
}
