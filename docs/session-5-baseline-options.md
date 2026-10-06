# Session 5 — adult-male PA baseline: options for the owner

**Status: research only. Nothing was downloaded, committed, registered or used.** The current baseline (A-001, a 21-year-old woman) and the case patient (a 45-year-old man) are unchanged. The owner decides.

## What was asked
Up to three openly licensed (CC0 / Public Domain / CC BY only) adult-male PA chest radiograph candidates; licence verified at the source; resolution; positioning quality; no devices or pathology.

## Method and a caveat on verification
Wikimedia Commons file pages were read on 2026-10-06 (direct API access was rate-limited from this environment, so the pages were fetched through a page-reading tool that summarises the page). **The licence, author, description and size below were therefore read from the file pages but not from the Commons API `extmetadata` / SHA-1 record as was done for A-001. Before any candidate is adopted it must be re-verified byte-for-byte (SHA-1 from Commons) and registered in `docs/ASSET_PROVENANCE_AND_LICENSES.md` in the same commit.** No image was viewed (viewing requires downloading), so *positioning quality is unassessed* for every candidate.

## Candidates

| # | File | Licence (as read) | Author | Size | Patient | Projection | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | [`File:Chest Xray PA 3-8-2010.png`](https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png) | CC0 1.0 | Stillwaterising (own work), 2010-03-08 | 2412 × 1956 px | **sex and age not stated** | PA (stated) | Normal, no devices/annotations stated. Cannot be called “adult male” from the page; landscape-shaped canvas (wider than tall) may be a crop or include margins — needs visual inspection. |
| 2 | [`File:Chest X-ray 2346.jpg`](https://commons.wikimedia.org/wiki/File:Chest_X-ray_2346.jpg) | CC0 1.0 | Doctoroftcm, 2010-11-16 | 2026 × 2743 px | “30-years-old healthy man” | **not stated** | Right patient description and portrait aspect, but the EXIF shows a **Nikon Coolpix L12 camera**: probably a photograph of a film on a viewbox (glare, perspective, uneven illumination, not a DICOM export). Projection (PA vs AP) unknown. A 30-year-old is also not the 45-year-old of the case. |
| 3 | none found | — | — | — | — | — | Other results were illustrations (e.g. `202212 Chest X-ray Male.svg`, CC BY 4.0, a drawn graphic — **not a radiograph**) or CC BY-SA (e.g. `Pektoralisschatten … 38M` by Hellerhoff: a 38-year-old male but **AP**, CC BY-SA 4.0 — ShareAlike is outside the allowed licences). |

Excluded on licence: CC BY-SA, CC BY-NC, request-access datasets (NIH ChestX-ray14-type sets need per-use terms review; not evaluated here). No category listing of “male PA” radiographs exists on Commons (the category URLs tried returned 404).

## Recommendation (conservative)
1. **Keep A-001** until a genuinely suitable image is found; the UI already labels it “not an image of the case patient”.
2. Cheapest way to remove the mismatch without any new asset: change the case demographics (age/sex) to match A-001 (a young adult woman) — a data-only change, but it also changes the case narrative and was **not** done.
3. If a male baseline is wanted: the owner should open candidate 1 (and search for more, e.g. Commons categories “Chest radiographs”, “X-rays of normal chest”) and check: PA, symmetric, scapulae out of the lung fields, full inspiration, apices to costophrenic angles in frame, no markers/text/leads, adequate resolution. Candidate 2 is unlikely to qualify (camera photograph).
4. Adopting any image means re-placing the landmark data (`src/data/cases/chest-pa-radiograph.ts`: anatomy box, midline, dome, scapulae, jaw, dense zones) and regenerating the goldens (`npm run qa:visual -- --update-goldens`); the landmark box aspect must stay equal to the required-anatomy region's (a unit test enforces it).

## Decision for owner
Which of: (a) keep the female baseline and align the case demographics, (b) source and approve a male baseline, (c) leave as is. Nothing here is blocking.
