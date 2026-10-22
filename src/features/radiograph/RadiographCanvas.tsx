"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { RadiographAssetSpec } from "@/domain/radiograph";
import type { RenderPlan } from "./plan";
import { renderRadiograph, type LumaImage, type RenderedRadiograph } from "./pipeline";

/** Working resolution of the canvas: output pixels per detector cm (display scales it with CSS). */
const PX_PER_CM = 24;
/** Upper bound of the canvas pixel count when an asset asks for a higher resolution (phone memory / time). */
const MAX_CANVAS_PIXELS = 1_800_000;

/** Output pixels per cm: the shared default, or the asset's request capped by the canvas pixel budget. */
export function resultPxPerCm(spec: RadiographAssetSpec, areaCm2: number): number {
  const want = spec.render?.pxPerCm;
  if (want === undefined) return PX_PER_CM;
  return Math.max(PX_PER_CM, Math.min(want, Math.sqrt(MAX_CANVAS_PIXELS / areaCm2)));
}

/** Canvas pixel of the marker's centre: its detector position relative to the canvas origin (the same orientation as the scene). */
export function markerCanvasPoint(centerCm: { x: number; y: number }, out: Pick<RenderedRadiograph, "originCm" | "pxPerCm">): { x: number; y: number } {
  return { x: (centerCm.x - out.originCm.x) * out.pxPerCm, y: (centerCm.y - out.originCm.y) * out.pxPerCm };
}

const lumaCache = new Map<string, Promise<LumaImage>>();

/** Decodes the baseline once per page and converts it to plain luminance for the pure pipeline. */
function loadLuma(src: string): Promise<LumaImage> {
  let p = lumaCache.get(src);
  if (!p) {
    p = new Promise<LumaImage>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return reject(new Error("no 2d context"));
        ctx.drawImage(img, 0, 0);
        const rgba = ctx.getImageData(0, 0, c.width, c.height).data;
        const data = new Float32Array(c.width * c.height);
        for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4]!; // greyscale content: R = G = B
        resolve({ width: c.width, height: c.height, data });
      };
      img.onerror = () => reject(new Error(`cannot load ${src}`));
      img.src = src;
    });
    p.catch(() => lumaCache.delete(src));
    lumaCache.set(src, p);
  }
  return p;
}

interface Props {
  plan: RenderPlan;
  spec: RadiographAssetSpec;
  alt: string;
}

/**
 * Draws the educational radiograph for a plan. The picture is derived FROM the result state and is never read
 * back: nothing here (or anywhere downstream) scores, classifies or measures pixels.
 *
 * The canvas is `direction: ltr` and is drawn in detector coordinates, so Arabic (RTL) never mirrors the
 * anatomy or the learner's L/R marker.
 */
export function RadiographCanvas({ plan, spec, alt }: Props) {
  const t = useTranslations("radiograph");
  const ref = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Where the canvas sits on the detector (QA hook for the result-marker audit; display only).
  // Set only after the client render, so the server-rendered markup is unchanged.
  const [placement, setPlacement] = useState<{ originCm: { x: number; y: number }; pxPerCm: number; detector: { widthCm: number; heightCm: number } } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLuma(spec.src)
      .then((src) => {
        const canvas = ref.current;
        if (cancelled || !canvas) return;
        const viewW = plan.view ? plan.view.x2 - plan.view.x1 : plan.detector.widthCm;
        const viewH = plan.view ? plan.view.y2 - plan.view.y1 : plan.detector.heightCm;
        const out = renderRadiograph(plan, spec, src, resultPxPerCm(spec, viewW * viewH));
        canvas.width = out.width;
        canvas.height = out.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        const rgba = ctx.createImageData(out.width, out.height);
        for (let i = 0; i < out.luma.length; i++) {
          const v = out.luma[i]!;
          rgba.data[i * 4] = v;
          rgba.data[i * 4 + 1] = v;
          rgba.data[i * 4 + 2] = v;
          rgba.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(rgba, 0, 0);

        // Annotation layer: the learner's marker, exactly where it was placed, recorded only inside the field.
        const m = plan.marker;
        if (m && m.visibleFraction > 0) {
          const f = out.fieldPx;
          ctx.save();
          ctx.beginPath();
          ctx.rect(f.x1, f.y1, f.x2 - f.x1, f.y2 - f.y1);
          ctx.clip();
          ctx.direction = "ltr";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `700 ${Math.round(m.sizeCm * out.pxPerCm * 0.95)}px ui-sans-serif, "Segoe UI", Arial, sans-serif`;
          const { x, y } = markerCanvasPoint(m.centerCm, out);
          ctx.lineWidth = (4 * out.pxPerCm) / PX_PER_CM;
          ctx.strokeStyle = "rgba(0,0,0,0.65)";
          ctx.strokeText(m.side, x, y);
          ctx.fillStyle = "#f6f8fa";
          ctx.fillText(m.side, x, y);
          ctx.restore();
        }
        setPlacement({ originCm: out.originCm, pxPerCm: out.pxPerCm, detector: plan.detector });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [plan, spec]);

  const aspect = plan.view ? `${plan.view.x2 - plan.view.x1} / ${plan.view.y2 - plan.view.y1}` : `${plan.detector.widthCm} / ${plan.detector.heightCm}`;
  return (
    <div className="relative" style={{ aspectRatio: aspect }} data-testid="radiograph"
      data-status={status}
      data-detector-w={placement?.detector.widthCm}
      data-detector-h={placement?.detector.heightCm}
      data-origin-x={placement?.originCm.x}
      data-origin-y={placement?.originCm.y}
      data-px-per-cm={placement?.pxPerCm}
    >
      <canvas
        ref={ref}
        role="img"
        aria-label={alt}
        className="block h-full w-full rounded border border-console-line bg-black"
        style={{ direction: "ltr" }}
        data-effects={plan.effects.map((e) => e.id).join(" ")}
      />
      {status !== "ready" && (
        <p role="status" className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white">
          {status === "loading" ? t("loading") : t("failed")}
        </p>
      )}
    </div>
  );
}
