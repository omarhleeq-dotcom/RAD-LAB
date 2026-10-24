import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import type { SimulationSettings } from "@/domain/simulation";
import { ShoulderSideView } from "./ShoulderSideView";

const radCase = CASES.find((c) => c.id === "shoulder-grashey-erect")!;
const render = (locale: "en" | "ar", rotationDeg: number, showGuides: boolean) =>
  renderToStaticMarkup(createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" },
    createElement(ShoulderSideView, { radCase, settings: { ...radCase.initialSettings, rotationDeg } as SimulationSettings, showGuides, mode: "practice" } as never)));

/** RAD-072 2c (owner D1): the turn reads without the practice guides. */
describe("shoulder plan view without the guides toggle", () => {
  for (const locale of ["en", "ar"] as const)
    for (const deg of [0, 20, 40, 60]) {
      it(`${locale} ${deg}°: angle readout, detector-parallel line, chest arrow${deg > 0 ? " and turn wedge" : ""} are drawn with the guides OFF`, () => {
        const off = render(locale, deg, false), on = render(locale, deg, true);
        const turn = (locale === "en" ? en : ar).sceneShoulder.turn.replace("{deg}", String(deg));
        expect(off).toContain(turn);
        expect(off).toContain((locale === "en" ? en : ar).scene.anterior);
        expect(off).toContain("stroke-dasharray=\"6 5\""); // the reference line
        expect(off.includes("fill-opacity=\"0.28\"")).toBe(deg > 0); // the wedge
        // the guides add only the source range and the SID (and the band arc, detector, side labels)
        expect(on).toContain((locale === "en" ? en : ar).sceneShoulder.band.replace("{lo}", "35").replace("{hi}", "45"));
        expect(off).not.toContain((locale === "en" ? en : ar).sceneShoulder.band.replace("{lo}", "35").replace("{hi}", "45"));
      });
    }
});
