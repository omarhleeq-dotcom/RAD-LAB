# WHO-TECH — extraction notes

> **Provenance:** Claims recorded from the owner's advisor reading (full text read by the advisor; not re-verified against the originals by Claude Code); locators to be spot-checked during educator/physicist review (O5).
> The claims below were supplied to Claude Code by the owner in the Session 10b delta prompt. Claude Code did not fetch the document and holds no copy; **the PDF is never committed**.

**Source:** Sandstrom S (eds Ostensen H, Pettersson H). *The WHO manual of diagnostic imaging: Radiographic technique and projections.* World Health Organization with the International Society of Radiology, 2003, ISBN 92-4-154608-5; iris.who.int handle 10665/42720.
**Region:** international.
**Locators:** printed page numbers.
**Terms / commercial use (S10-3):** © WHO 2003, all rights reserved; **facts paraphrased and cited only, no text or figures reused** (the illustrations are cited by locator, never copied or redrawn).
**Strength:** a WHO technique manual for general / district-hospital use; its exposure values are locally adjusted examples, not universal protocols.

## General (technique)
- **p.4** — The exposure values given assume an FFD of 140 cm and a fixed 10:1 grid, for a reference adult of 180 cm height / 80 kg; the values are to be adjusted locally. kV sets the contrast; mAs sets the blackening. **Correction (Session 10b final addition): the 140 cm FFD is the WHIS-RAD installation basis for the manual's exposure tables, not a target SID** (so it does not conflict with 180 cm in EC16260 or ≥ 183 cm in ACR-CHEST / BONTRAGER-9).

## Chest PA (standing)
- **p.6** — Shoulders pressed well forward; deep breath held. Adult: **120 kV**, mAs average 2–2.5 (range 1–12). Right / Left marker. Image criteria: apices visible; **rib 10 posterior and rib 6 anterior** above the diaphragm; lower diaphragm and both costophrenic angles visible; lung structure and spine seen behind the heart.

## Chest LATERAL (standing; sitting)
- **p.7 (standing)** — **Normally the LEFT lateral (right optional).** Patient upright **or leaning slightly forwards, not backwards**; the patient **holds the cassette-holder arm** (the illustration shows the arms raised forward, clear of the chest); deep breath held. Adult **120 kV**, mAs average **4–5 (range 2–16)** — about twice the PA values. **No side-marker instruction on this page.** Criteria: apices visible, **straight lateral sternum**, lower diaphragm visible. The illustration shows the centring cross at **mid-thorax on the lateral chest wall**; **no level is stated in the text** (so no T7 or other level is supported).
- **p.9 (sitting)** — same rules as p.7.

## Chest AP
- **p.8 (sitting)** — only when the patient cannot stand; sitting erect; deep breath held; **120 kV**, mAs 2–2.5; Right / Left marker; same criteria as the PA.
- **p.10 (supine)** — small pillow under the head; centre; deep breath held; **120 kV**, mAs 2–3.2; Right / Left marker; same criteria as the PA.

## How RAD-LAB may use this source
- `common-reference` for: 120 kV adult chest, left lateral as the normal lateral (right optional), upright / slightly-forward lateral posture, straight lateral sternum, AP sitting and supine as variants, Right / Left marker on PA and AP, rib 10 posterior / 6 anterior.
- Not for: a lateral centring *level*, a numeric mAs target (values are locally adjusted), a lateral marker convention, or a collimation region size beyond the film sizes it lists.
- Sizes: the manual lists adult film sizes of 35 × 43 and 35 × 35 cm and 24 × 30 cm for children, advising collimation further where possible (**locator corrected: printed pp.6–10**); not decisive for O2 / S10b-15.
