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

/** Phone fitted view only. Its own pixel-sized SVG bands do not change the detector's viewBox or touch transform. */
export function PhoneFrameLabels({ children }: { children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<FrameRows>({ positions: {}, width: 1, height: 1 });
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const measure = () => {
      const width = svg.getBoundingClientRect().width;
      if (!width) return;
      const measurements = [...svg.querySelectorAll<SVGTextElement>("text[data-phone-frame-label]")].map((t) => {
        const b = t.getBBox();
        return { key: t.dataset.phoneFrameLabel!, x: b.x - t.x.baseVal[0]!.value, y: b.y - t.y.baseVal[0]!.value, width: b.width, height: b.height };
      });
      const next = frameRows(width, measurements);
      setRows((old) => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [children]);
  return <svg ref={ref} aria-hidden="true" width="100%" height={rows.height} viewBox={`0 0 ${rows.width} ${rows.height}`} style={{ direction: "ltr", pointerEvents: "none" }}>
    <PhoneFrameLabelContext.Provider value={rows}>{children}</PhoneFrameLabelContext.Provider>
  </svg>;
}
