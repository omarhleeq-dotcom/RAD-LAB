import type { RadiographAssetSpec } from "@/domain/radiograph";

/**
 * Educational baseline radiograph for Chest PA v1 (registry entries A-001 → A-002 → A-003 in
 * docs/ASSET_PROVENANCE_AND_LICENSES.md; CC0 1.0, Mikael Häggström, Wikimedia Commons).
 *
 * The image shows a different (young adult female) patient from the case patient; it is an EDUCATIONAL
 * APPEARANCE REFERENCE only. Landmarks below were read from the image by eye and are approximate:
 * TODO(medical-review): have an educator confirm the landmark placement and the schematic overlays.
 */
export const chestPaRadiograph: RadiographAssetSpec = {
  id: "chest-pa-baseline",
  src: "/images/chest-pa/chest-pa-baseline-1000.jpg",
  widthPx: 1000,
  heightPx: 1144,
  registryIds: ["A-001", "A-002", "A-003"],
  credit: {
    en: "Reference radiograph: “Normal posteroanterior (PA) chest radiograph (X-ray)”, Mikael Häggström, Wikimedia Commons, CC0 1.0.",
    ar: "الصورة المرجعية: «Normal posteroanterior (PA) chest radiograph (X-ray)»، ميكائيل هاغستروم (Mikael Häggström)، ويكيميديا كومنز، CC0 1.0.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "Image-quality ref (Asset requirements); docs/ASSET_PROVENANCE_AND_LICENSES.md",
    note: "Educational appearance baseline. Not clinical ground truth for any simulated error and not an image of the case patient.",
  },
  // Apices (top of the lung fields) to costophrenic angles; lateral lung / rib margins.
  anatomyBox: { u1: 0.07, v1: 0.12, u2: 0.93, v2: 0.9 },
  midlineU: 0.49,
  lungApexV: 0.12,
  diaphragmDomeV: 0.8,
  scapulae: {
    left: { cu: 0.19, cv: 0.3, ru: 0.085, rv: 0.18 },
    right: { cu: 0.8, cv: 0.3, ru: 0.085, rv: 0.18 },
  },
  jaw: {
    border: [
      { u: 0.3, v: 0 },
      { u: 0.34, v: 0.07 },
      { u: 0.4, v: 0.12 },
      { u: 0.49, v: 0.145 },
      { u: 0.58, v: 0.12 },
      { u: 0.64, v: 0.07 },
      { u: 0.68, v: 0 },
    ],
    softTissueRect: { u1: 0.31, v1: 0, u2: 0.67, v2: 0.14 },
  },
  denseZones: [
    { cu: 0.52, cv: 0.45, ru: 0.075, rv: 0.36 }, // mediastinum + spine
    { cu: 0.58, cv: 0.67, ru: 0.18, rv: 0.16 }, // heart + retrocardiac region
  ],
};
