# Traced drawing outlines (RAD-072 part 2a hand, part 2b wrist and foot)

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

## One tracer, one seed file per exam family (since RAD-072 2b)

`trace_lib.py` holds everything region-neutral (image helpers, ribbon / radial / blob / **snap** / **axis-snap** tracers, joint spaces and
joint paths, the soft-tissue outline with its "never inside a bone" check, the simplifier, the JSON writer and the overlays). Each exam
family is a short script of seeds, sources, hooks and a `SPEC`: `trace-hand-outlines.py` (2a), `trace-wrist-outlines.py` and
`trace-foot-outlines.py` (2b); `python3 -I` does not add the script directory, so each script inserts it into `sys.path`.

```sh
python3 -I scripts/trace-outlines/trace-wrist-outlines.py --check            # JSON byte-identical
python3 -I scripts/trace-outlines/trace-wrist-outlines.py --check-overlays   # JSON and every review PNG byte-identical
```

- **snap tracer** (`"tracer": "snap"`, `poly`): a polygon read by eye at 3x is resampled and every sample moves along its outward normal
  (± `search` px) to the steepest bright-to-dark step; samples without a clear step keep the seed; shifts are median-filtered and smoothed.
  A sample on the image border is pinned and the outline is open there (bones cut by the image edge). Used for carpal bones and forearm bones.
- **axis-snap** (`"tracer": "axis-snap"`, `a`, `b`, `he`, `hs`): the radial tracer's rounded-box prior built from an axis seed, then snapped
  (default `search` = a third of the shaft half-width). Used for phalanges and metatarsals.
- **joint path** (`lines[].pts`): the darkest point along the local normal of a curated polyline (±`g` px), for curved joint lines.
- **along line** (`lines[].along = {bone, from, to, offset}`): a joint line that follows the edge of an already traced bone (e.g. the radius's
  articular surface), smooth by construction. `lines[].smooth` smooths a darkest-point path; `cfg.joint_g` / `joint_centre` / `joint_half`
  set a joint space's search for the joints the seed ends do not bracket (foot MTP). `cfg.soft_smooth` (per view or one number) smooths the
  soft-tissue runs and drops spikes (an interior point whose two segments enclose < 50 degrees). All optional: the hand is unchanged.
- `cfg.soft_hint` (per view): curated soft-tissue polygons (read by eye at 2-3x) united with the thresholded region and the grown bone outlines, for a soft-tissue border too faint for the threshold (wrist PA radial border).
- `cfg.soft_runs`: keep up to N soft-tissue runs when the silhouette is cut into several open runs by the image edge (wrist, foot).
- Where two bones overlap and the image does not separate them the seed names ONE combined outline (`note`), never an invented split.

For the shoulder (2c) the lib works unchanged: add `trace-shoulder-outlines.py` with its seeds, sources, `follows` vocabulary and review list.
