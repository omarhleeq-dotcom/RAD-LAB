// Display metadata only: never import this registry into exam definitions, evaluation or scoring.
import presentation from "./catalogue-presentation.json";
import { BODY_PARTS, type BodyPartEntry } from "@/data/modalities";
import type { LocalizedText } from "@/domain/localized";

export interface LibraryItem {
  id: string;
  title: LocalizedText;
  bodyPart: string;
  projection: string;
  href: string;
  caseCount: number;
  provisional: boolean;
}
export interface LibraryRegion {
  id: string;
  name: LocalizedText;
  bodyParts: readonly string[];
}
export interface LibrarySection {
  region: LibraryRegion;
  items: LibraryItem[];
}
if (presentation.version !== 1) throw new Error("Unsupported catalogue presentation version");
export const LIBRARY_REGIONS: readonly LibraryRegion[] = presentation.regions;

/** A new registered body part keeps its own name/filter until an optional broader mapping is added. */
export function librarySections(items: readonly LibraryItem[], parts: readonly BodyPartEntry[] = BODY_PARTS, regions: readonly LibraryRegion[] = LIBRARY_REGIONS): LibrarySection[] {
  const sections: LibrarySection[] = regions.map((region) => ({ region, items: [] }));
  const byPart = new Map<string, LibrarySection>();
  for (const section of sections) for (const part of section.region.bodyParts) {
    if (byPart.has(part)) throw new Error(`Duplicate presentation region for ${part}`);
    byPart.set(part, section);
  }
  for (const item of items) {
    let section = byPart.get(item.bodyPart);
    if (!section) {
      const part = parts.find((entry) => entry.id === item.bodyPart);
      if (!part) throw new Error(`Unregistered body part: ${item.bodyPart}`);
      // Prefix prevents collision with broader display region ids.
      section = { region: { id: `body-part:${part.id}`, name: part.name, bodyParts: [part.id] }, items: [] };
      sections.push(section);
      byPart.set(part.id, section);
    }
    section.items.push(item);
  }
  return sections.filter((section) => section.items.length > 0);
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").replace(/ـ/g, "").replace(/[إأآٱ]/g, "ا").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}
export function filterLibrary(sections: readonly LibrarySection[], query: string, regionId: string): LibrarySection[] {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  return sections.filter(({ region }) => !regionId || region.id === regionId).map(({ region, items }) => ({
    region,
    items: items.filter((item) => {
      const haystack = normalizeSearch([item.title.en, item.title.ar, item.projection, region.name.en, region.name.ar].join(" "));
      return words.every((word) => haystack.includes(word));
    }),
  })).filter(({ items }) => items.length > 0);
}

/** In a mixed list the per-item warning remains; a uniform provisional list has one shared warning. */
export const uniformlyProvisional = (items: readonly LibraryItem[]): boolean => items.length > 0 && items.every((item) => item.provisional);
export function graphicOf(item: Pick<LibraryItem, "bodyPart" | "projection">): string {
  const variants: Record<string, Record<string, string>> = presentation.projectionGraphics;
  const graphics: Record<string, string> = presentation.graphics;
  return variants[item.bodyPart]?.[item.projection] ?? graphics[item.bodyPart] ?? "generic";
}
