"use client";

import { createContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface Position { x: number; y: number }
interface Measurement { key: string; x: number; y: number; width: number; height: number }
export interface FrameRows { positions: Record<string, Position>; width: number; height: number }

// Null on the original scene path: neither the desktop markup nor its labels change.
export const PhoneFrameLabelContext = createContext<FrameRows | null>(null);
export const frameLabelKey = (x: number, y: number, size: number, text: string) => JSON.stringify([x, y, size, text]);

/** Pack measured text pills left-to-right in a separate band, clear of the interactive detector. */
export function frameRows(width: number, measurements: readonly Measurement[]): FrameRows {
  const inset = 3, gap = 6, padX = 5, padY = 1;
  let left = inset, top = inset, rowHeight = 0;
  const positions: Record<string, Position> = {};
  for (const m of measurements) {
    const pillWidth = m.width + 2 * padX, pillHeight = m.height + 2 * padY;
    if (left > inset && left + pillWidth > width - inset) {
      top += rowHeight + gap; left = inset; rowHeight = 0;
    }
    positions[m.key] = { x: left + padX - m.x, y: top + padY - m.y };
    left += pillWidth + gap;
    rowHeight = Math.max(rowHeight, pillHeight);
  }
  return { positions, width, height: top + rowHeight + inset };
}

export type OrientationSlot = "start" | "centre" | "end";
export const orientationSlot = (x: number, detectorWidth: number): OrientationSlot =>
  x < detectorWidth / 3 ? "start" : x > 2 * detectorWidth / 3 ? "end" : "centre";

/** Physical image slots: never reverse them for Arabic or UI direction. */
export function orientationRows(width: number, detectorWidth: number, measurements: readonly Measurement[]): FrameRows {
  const inset = 3, gap = 6;
  const rows: { height: number; labels: { m: Measurement; left: number; right: number }[] }[] = [];
  for (const m of measurements) {
    const slot = orientationSlot(Number(JSON.parse(m.key)[0]), detectorWidth);
    const pillWidth = m.width + 10;
    const left = slot === "start" ? inset : slot === "end" ? width - inset - pillWidth : (width - pillWidth) / 2;
    let row = rows.find((r) => r.labels.every((l) => left >= l.right + gap || left + pillWidth + gap <= l.left));
    if (!row) { row = { height: 0, labels: [] }; rows.push(row); }
    row.labels.push({ m, left, right: left + pillWidth });
    row.height = Math.max(row.height, m.height + 2);
  }
  const positions: Record<string, Position> = {};
  let top = inset;
  for (const row of rows) {
    for (const { m, left } of row.labels) positions[m.key] = { x: left + 5 - m.x, y: top + 1 - m.y };
    top += row.height + gap;
  }
  return { positions, width, height: rows.length ? top - gap + inset : 1 };
}

/**
 * Chip scale (RAD-101 D2, amends RAD-077 A1): CSS px per label unit, so the smallest label font of a band renders at `minPx`
 * (never enlarged above its authored size). Labels keep their relative sizes; the band lays them out in label units.
 */
export const chipScale = (minPx: number, fontSizes: readonly number[]) => {
  const smallest = Math.min(...fontSizes.filter((s) => s > 0));
  return Number.isFinite(smallest) ? Math.min(1, minPx / smallest) : 1;
};

/**
 * Phone only. Its own SVG bands next to the detector do not change the detector's viewBox or touch transform.
 * `minPx` (RAD-101 D2): draw the labels as small chips whose smallest font is `minPx` CSS px, instead of at 1 label unit = 1 px.
 */
export function PhoneFrameLabels({ children, detectorWidth, minPx }: { children: ReactNode; detectorWidth?: number; minPx?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<FrameRows & { scale: number }>({ positions: {}, width: 1, height: 1, scale: 1 });
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const measure = () => {
      const cssWidth = svg.getBoundingClientRect().width;
      if (!cssWidth) return;
      const texts = [...svg.querySelectorAll<SVGTextElement>("text[data-phone-frame-label]")];
      const measurements = texts.map((t) => {
        const b = t.getBBox();
        return { key: t.dataset.phoneFrameLabel!, x: b.x - t.x.baseVal[0]!.value, y: b.y - t.y.baseVal[0]!.value, width: b.width, height: b.height };
      });
      // Bounding boxes are in label units, whatever the viewBox: lay out in units over the CSS width divided by the chip scale.
      const scale = minPx === undefined ? 1 : chipScale(minPx, texts.map((t) => Number(t.getAttribute("font-size"))));
      const width = cssWidth / scale;
      const next = { ...(detectorWidth === undefined ? frameRows(width, measurements) : orientationRows(width, detectorWidth, measurements)), scale };
      setRows((old) => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [children, detectorWidth, minPx]);
  return <svg ref={ref} aria-hidden="true" width="100%" height={rows.height * rows.scale} viewBox={`0 0 ${rows.width} ${rows.height}`} style={{ direction: "ltr", pointerEvents: "none" }}>
    <PhoneFrameLabelContext.Provider value={rows}>{children}</PhoneFrameLabelContext.Provider>
  </svg>;
}
