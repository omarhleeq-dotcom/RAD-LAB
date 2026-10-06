# RAD-LAB — Asset provenance & license registry

This is the permanent registry for **every external asset** RAD-LAB uses now or in future: radiographs, anatomical images, illustrations, icons, fonts, audio, datasets, textures, and any other externally sourced educational asset. Even CC0 / public-domain assets are recorded voluntarily.

**Rule: no external asset enters the repository without an entry here, in the same commit.**

## Policy

Preferred, in order:
1. CC0 / public domain
2. CC BY
3. other clearly open licenses — only after a compatibility review

Avoid: unclear licensing; permission-required assets; request-access datasets; assets that prohibit redistribution; ND assets when modification is required; NC assets unless explicitly approved for the project.

Rules for entries:
- Keep the **unmodified master** (original bytes) separate from any **derived** file; each gets its own entry and the derived entry lists every modification.
- Record a content checksum (SHA-1 for Wikimedia Commons assets, since Commons publishes SHA-1) of the master and of the derived file.
- Record *how* and *when* the license was verified, and by whom. "Verified by checksum" means byte identity with the file the source lists, not license verification.
- A script that produces a derived asset lives in `scripts/` and is deterministic, so the derivation can be audited and reproduced.
- A radiograph used by a case is an **educational baseline, not clinical ground truth** for every simulated error (see `docs/session-4-radiograph-renderer.md`).

## Entry template

| Field | Value |
|---|---|
| Asset name | |
| Asset type | |
| Original filename | |
| Creator / author | |
| Original organization / source | |
| Original source URL | |
| License | |
| License URL | |
| Modification permitted | |
| Redistribution permitted | |
| Commercial use permitted | |
| Attribution legally required | |
| Attribution text (if required) | |
| Local project path | |
| RAD-LAB modifications | |
| Date / method of verification | |
| Checksum | |
| Notes | |

---

## Registered assets

### A-001 — Normal PA chest radiograph: unmodified master

| Field | Value |
|---|---|
| Asset name | Normal posteroanterior (PA) chest radiograph (X-ray) |
| Asset type | Radiograph (adult PA erect chest), JPEG |
| Original filename | `Normal posteroanterior (PA) chest radiograph (X-ray).jpg` |
| Creator / author | Mikael Häggström (Commons credit line: "Own work") |
| Original organization / source | Wikimedia Commons |
| Original source URL | <https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg> |
| Original file URL | <https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg> |
| License | CC0 1.0 Universal Public Domain Dedication (Commons short name `CC0`, "Creative Commons Zero, Public Domain Dedication") |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> (Commons records `http://creativecommons.org/publicdomain/zero/1.0/deed.en`) |
| Modification permitted | Yes |
| Redistribution permitted | Yes |
| Commercial use permitted | Yes |
| Attribution legally required | No (Commons `AttributionRequired: false`). Preserved voluntarily. |
| Attribution text (voluntary) | "Normal posteroanterior (PA) chest radiograph (X-ray)" by Mikael Häggström, Wikimedia Commons, CC0 1.0. |
| Local project path | `assets/source/chest-pa/Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg` (provenance master; **not** served by the app) |
| RAD-LAB modifications | **None.** Byte-identical to the Commons original. |
| Date / method of verification | 2026-10-06, by RAD-LAB development session, directly against Commons: (1) file page HTTP 200; (2) Commons API `imageinfo` + `extmetadata` — title, artist, credit, license `cc0`, `LicenseUrl`, `AttributionRequired=false`, `Restrictions` empty, `sha1`, `mime`, size, upload user/time; (3) the file-page licensing text ("This file is made available under the Creative Commons CC0 1.0 Universal Public Domain Dedication … without asking permission"); (4) file history (single revision); (5) download of the original from `upload.wikimedia.org` and local checksum. The project owner had verified the same record independently. |
| Checksum | SHA-1 `3124c4cf4c55eb3d2defa9b909f08f94e941ec43` — equals the Commons-listed value |
| File facts | `image/jpeg`, JFIF, 1929 × 2207 px, 906,335 bytes (Commons "885 KB"), 8-bit RGB-encoded greyscale content, 96 dpi |
| File history (Commons) | One revision: 2017-08-17 10:59:27 UTC, user Mikael Häggström, comment "User created page with UploadWizard". Work dated 2017-06-28. Categories: CC-Zero · Self-published work · X-rays of normal chest. |
| Notes | Author's description: a posteroanterior chest radiograph of a **21-year-old woman** who presented with pain on the left side of the thorax after colliding with another player during a soccer game; the author states it "shows a normal chest without any signs of injury". "Dx" and "Sin" in the image stand for "right" and "left" respectively (per the Commons description). The imaged patient therefore differs from the case patient in the simulation (45-year-old male); the image is an educational baseline for *appearance*, not a depiction of the case patient. The image is not a validated reference for any simulated error. See also A-002 for the annotation handling. |

### A-002 — Chest PA educational baseline: derived, annotations neutralised

| Field | Value |
|---|---|
| Asset name | RAD-LAB Chest PA educational baseline (derived from A-001) |
| Asset type | Radiograph, derived JPEG |
| Original filename | n/a (derived). Source: A-001. |
| Creator / author | Original: Mikael Häggström. Derivation: RAD-LAB (script `scripts/derive-chest-pa-baseline.py`). |
| Original organization / source | Wikimedia Commons (via A-001) |
| Original source URL | see A-001 |
| License | CC0 1.0 Universal (inherited from A-001; RAD-LAB asserts no additional rights over the derivative) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification permitted | Yes (CC0) |
| Redistribution permitted | Yes |
| Commercial use permitted | Yes |
| Attribution legally required | No. Preserved voluntarily (see A-001) and shown on the result image's credit line. |
| Local project path | `public/images/chest-pa/chest-pa-baseline.jpg` (served by the app) |
| RAD-LAB modifications | See "Derivation record" below. |
| Date / method of verification | 2026-10-06. Derivation reproducible: `python3 -I scripts/derive-chest-pa-baseline.py` (numpy + Pillow; verifies the A-001 SHA-1 before running; fixed RNG seed). Output inspected visually (before/after crops of both regions; whole image). Pixel diff against A-001 checked: every pixel that differs by more than 12 grey levels lies inside the two annotation boxes (4,251 px, all inside the boxes). |
| Checksum | SHA-1 `c9010f963f51dd8ea31c500e52aacae7b79e1bb1` (reproducible by the script; if the Pillow/libjpeg version changes the checksum may change, the pixel statistics below do not) |
| File facts | `image/jpeg`, 1929 × 2207 px, 779,304 bytes, quality 92 |
| Notes | The student's side marker is **not** part of this asset. It is a separate, learner-controlled annotation layer drawn by the renderer. |

#### Derivation record (A-001 → A-002)

1. **Annotations removed:** the two embedded side annotations "Dx" (top-left, box x 60–300, y 40–200) and "Sin" (top-right, box x 1450–1700, y 0–200).
2. **Why this is not deceptive inpainting:** both annotations lie over smooth background — the air / soft-tissue gradient above and lateral to the shoulders, outside the thorax. No bone, lung, vessel, mediastinal or other diagnostic structure is under either glyph (checked visually at 3× on both regions). Because of this, conservative interpolation was judged appropriate and no masking/cropping of the image was needed. If a future asset's annotation overlapped anatomy, interpolation would **not** be acceptable and masking/cropping would be used instead.
3. **Method:** pixels brighter than 150 (the glyph and its anti-aliasing) within each box, dilated by 4 px (3,861 px for "Dx", 4,568 px for "Sin"), were replaced by a harmonic (Laplace) interpolation of the surrounding unmasked pixels, plus deterministic Gaussian grain (fixed seed 20261006; σ ≈ 2.1 / 2.4 grey levels, measured from the neighbouring unmasked pixels) so the patch does not look artificially smooth. Nothing outside the two boxes was edited.
4. **Known residual artefact:** under "Dx" the interpolation lies across a faint diagonal boundary between the dark corner and the soft-tissue background; the reconstructed boundary shows a small step. It is background only and not anatomy. Documented so it is not mistaken for source content.
5. **Re-encode:** saved as JPEG quality 92. This changes all pixels slightly (mean absolute change outside the annotation boxes ≈ 0.49 grey level on 0–255). No resampling, crop, rotation, tone-curve, sharpening or contrast change was applied.
6. **Not changed:** geometry, size, tonal rendering of any anatomy.
7. Any later derivative (e.g. a downscaled web copy, or per-frame renderer processing) must be added to this registry as its own entry.
