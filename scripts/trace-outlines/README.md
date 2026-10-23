# Traced drawing outlines (RAD-072 part 2a)

`trace-hand-outlines.py` traces the drawing outlines of the hand from the project's own two baseline radiographs and writes
`src/features/positioning/hand-outlines.json`. Owner decision: [RAD-072 2a](../../docs/DECISIONS.md#rad072-2a-hand-owner-2026-10-23).

```sh
python3 -I scripts/trace-outlines/trace-hand-outlines.py              # write the JSON
python3 -I scripts/trace-outlines/trace-hand-outlines.py --check      # regenerate in memory; exit 1 unless byte-identical
python3 -I scripts/trace-outlines/trace-hand-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-hand/
```

Offline; needs only Pillow and NumPy. Deterministic (no randomness, no timestamps). Reads **only** A-015
`public/images/hand/hand-pa-baseline.jpg` and A-017 `public/images/hand/hand-lateral-baseline.jpg` (CC0, owner-verified; their
SHA-256 is written into the JSON header). No textbook, web, Bontrager or generated image is used.

## Method

1. **Curated seeds** (in the script): for each structure an approximate axis (distal and proximal end centres) and half-widths,
   read by eye from the same two images. Seeds only place a search window.
2. **Edge candidates**: the image is Gaussian-smoothed; intensity profiles are sampled perpendicular to the axis (the sides) and in
   a fan at each end. The edge is the steepest bright-to-dark step going outward, mildly weighted toward the seed width; for a
   superimposed group (lateral digits, metacarpal stack, carpus, radius+ulna) the outermost strong step whose inner side is
   bone-bright. Candidates are median-filtered against outliers.
   **Radial tracer** (`"tracer": "radial"`, the bones re-traced after the owner's Phase A review: distal-phalanx tufts, mc2/mc3,
   the thumb chain in both views, the ulnar styloid): rays from the bone centre through evenly spaced points of a rounded-box
   prior, the edge searched within ±0.6 × the local prior half-width, then the radius ratios smoothed round the whole outline
   by a low-order Fourier fit with outlier rejection (no-edge rays filled by interpolation first). A process growing out of a
   larger bone (ulnar styloid) is kept as an open tip curve (`openBelowY`).
3. **Joint spaces** first: on stations across each joint, the darkest point of the axial profile (the radiolucent gap). A bone
   end that meets a traced joint line stops at the near side of that gap. Where the midpoint of the two seed ends misses the
   gap, `JOINT_CENTRE` / `JOINT_HALF` give the search centre and half-length (PA thumb MCP). The PA carpus is also capped
   (`ulnarBound`, a search cap, not a joint) by the line from the ulnar end of the radiocarpal line to the ulnar styloid tip,
   and takes the steepest edge in its lower-ulnar sector (`steepSector`), so it stays on the carpal bones.
4. **Soft tissue** (traced last, stored first): Otsu threshold of the smoothed image (darker 75 % of pixels), united with every
   traced bone outline grown by `SOFT_MARGIN` (10 px), largest region, boundary walk; image-edge runs are cut, so the forearm
   end is open. Where the soft tissue is too faint to threshold (lateral thumb) the outline is therefore a smooth margin outside
   the bone. The script exits with an error if any soft-tissue point lies inside a bone outline; the same check runs in
   `src/features/positioning/hand-outlines.test.ts`.
5. **Simplify**: Ramer–Douglas–Peucker to a small number of integer control points.

The output is illustrative and drawing-only, **not a measurement**. What the images do not show clearly is simplified, not
invented: the carpus is one outline (no individual carpal bones), the CMC lines are approximate (overlapped bases), and in the
lateral the digits and metacarpals are one outline each.

## JSON format (`rad-lab-traced-outlines/1`)

Header: `note`, `region`, `side`, `date`, `method`, `coordinates`, `sources` (asset id, parent, file, SHA-256). Then
`views.<view>.structures[]`, each `{ id, group, closed, follows, drawn?, note?, points: [[x, y], …] }` in image px of the web copy; `drawn: false` keeps a structure in the data but out of the drawing (the thumb-MCP sesamoid-like densities).
`follows` names the `features/hand-model` tube (or tube group: `column` = one copy per digit, `forearm` = radius and ulna copies, `carpals`) whose rotation the drawing follows (a drawing link; the model is unchanged).

## Reuse for other regions

The tracers (ribbon, blob, joint gap, soft tissue), the simplifier, the overlay writer and the JSON shape are region-neutral.
A new region needs its own seed table, source list, output path and `follows` vocabulary (its own model's part ids); the
curated thresholds (`SOFT_TOWARD_BG`, `BRIGHT_FACTOR`, `OUTER_STRENGTH`) may need per-image values. Splitting the shared code
into a module is deferred until a second region actually uses it.
