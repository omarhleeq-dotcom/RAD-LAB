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

### A-003 — Chest PA educational baseline: web-resolution copy (derived from A-002)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Chest PA educational baseline, web resolution |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Original filename | n/a (derived). Source chain: A-001 → A-002 → A-003. |
| Creator / author | Original: Mikael Häggström. Derivation: RAD-LAB (`scripts/derive-chest-pa-baseline.py`). |
| Original organization / source | Wikimedia Commons (via A-001) |
| Original source URL | see A-001 |
| License | CC0 1.0 Universal (inherited; RAD-LAB asserts no additional rights) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. A voluntary credit line is shown under the result image (`RadCase.radiograph.credit`, EN + AR). |
| Local project path | `public/images/chest-pa/chest-pa-baseline-1000.jpg` (the file the app loads) |
| RAD-LAB modifications | Downscaled from A-002 to 1000 × 1144 px (Lanczos), converted to 8-bit greyscale (the source content is greyscale), JPEG quality 88. No other processing. |
| Date / method of verification | 2026-10-06. Reproducible with `python3 -I scripts/derive-chest-pa-baseline.py` (fixed inputs; checks the A-001 SHA-1 first). |
| Checksum | SHA-1 `5eca10ae10303ad4082e9b0c4ebd58bf7d982559` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1000 × 1144 px, 147,359 bytes |
| Notes | The renderer decodes this file in the browser and applies deterministic educational effects at display time. Those effects are **runtime transformations of this asset**, not new assets; they are documented in `docs/session-4-radiograph-renderer.md`. The schematic scapula and jaw overlays are drawn procedurally by RAD-LAB code and use no external imagery. |

### A-004 — Effects contact sheet (documentation image, derived from A-003)

| Field | Value |
|---|---|
| Asset name | Session 4 rendered results (documentation images) |
| Asset type | Documentation image (JPEG montage of application screenshots) |
| Original source | Screenshots of the RAD-LAB result renderer (production build, EN desktop) applied to A-003 |
| License | CC0 1.0 (derived solely from A-003 plus RAD-LAB UI/rendering output) |
| Attribution legally required | No (credit given in the app and in A-001) |
| Local project path | `docs/session-4-renders/*.jpg` (13 renderer outputs in EN and AR plus a contact sheet per language); documentation only, not served by the app |
| RAD-LAB modifications | Screenshots of renderer outputs (resized to 480 px wide, JPEG quality 86) and captioned montages. Each image is a simulated educational result, **not** a clinical image. |
| Date / method | 2026-10-06; produced from `scripts/verify-session4.mjs` screenshots |
| Notes | Contains the learner-style L marker where shown; no real patient data. |

### A-005 — Visual-regression goldens and matrix contact sheet (derived from A-003)

| Field | Value |
|---|---|
| Asset name | Session 5 scenario-matrix golden images (test fixtures) and contact sheet (documentation) |
| Asset type | 8-bit greyscale PNG (420 × 516, 53 files) + one JPEG montage |
| Original source | Output of the RAD-LAB renderer (production build, desktop, EN) applied to A-003 |
| License | CC0 1.0 (derived solely from A-003 plus RAD-LAB rendering output) |
| Attribution legally required | No (credit given in the app and in A-001) |
| Local project path | `scripts/qa/golden/images/*.png` (test fixtures, not served by the app); `docs/session-5-renders/matrix-contact-sheet.jpg` (documentation) |
| RAD-LAB modifications | Canvas luminance, 2× box-downscaled, one image per scenario in `scripts/qa/scenarios.json`; each is a simulated educational result, **not** a clinical image. Reproducible with `node scripts/qa/run-matrix.mjs --update-goldens`. |
| Date / method | 2026-10-06; generated by `scripts/qa/run-matrix.mjs` |
| Notes | Contains the learner-style L / R marker where shown; no real patient data. Candidate baselines for a future adult-male image are **not** registered here (nothing was downloaded); see `docs/session-5-baseline-options.md`. |

### A-006 — Normal lateral chest radiograph: unmodified master (owner-supplied)

| Field | Value |
|---|---|
| Asset name | Normal lateral chest radiograph (X-ray) |
| Asset type | Radiograph (adult lateral chest), JPEG |
| Original filename | `Normal lateral chest radiograph (X-ray).jpg` |
| Creator / author | **Not verified by Claude Code.** The owner's message says "see file page"; the Commons file page could not be read (HTTP 429). To be recorded at re-verification. No author is assumed. |
| Original organization / source | Wikimedia Commons |
| Original source URL | <https://commons.wikimedia.org/wiki/File:Normal_lateral_chest_radiograph_(X-ray).jpg> |
| License | **CC0 1.0 Universal**, as stated by the owner, who copied the licence text from the file page (2026-10-07). |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted under CC0 (as stated; **owner-verified, attached file, re-verify later**) |
| Attribution legally required | No (CC0). A voluntary credit line is shown under the result image. |
| Local project path | `assets/source/chest-lateral/Normal_lateral_chest_radiograph_(X-ray).jpg` (provenance master; **not** served by the app) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached. |
| Date / method of verification | 2026-10-07. **Licence: owner-verified** (licence text copied by the owner from the file page; Claude Code could not re-check it because Commons returned HTTP 429 to every request on the shared egress IP, one retry allowed by the owner also 429). **Re-verify** the licence, author, upload date and the Commons SHA-1 later, and amend this entry. **Content checks by Claude Code:** (1) normal-looking adult true lateral chest (apices to costophrenic recesses visible, posterior ribs close together); (2) **no burned-in text, letters, numbers, dates or markers** (whole image and all four corners inspected); (3) **metadata**: only a JFIF header (96 dpi); no EXIF, ICC, XMP, comment or DICOM-style tags (read with Pillow and `strings`); (4) no patient identifiers of any kind. |
| Checksum | SHA-1 `6a2ac62e9e0965ac0cc21110018ecf3c6fcd1ad5` (of the attached file). Not compared with Commons (blocked). |
| File facts | `image/jpeg`, JFIF, 1769 × 2453 px, 1,114,909 bytes, RGB-encoded greyscale content |
| De-identification evidence | Visual inspection of the full image and the four corners (no text), metadata scan (nothing beyond JFIF), no DICOM tags. The image shows an anonymous chest only. |
| Notes | **S12-4:** a representative normal adult lateral of a **different person** from the PA case baseline (A-001); D7 applies to the PA baseline only. A teaching approximation. Which side of the patient was against the detector cannot be read from the image and is not claimed (the anterior chest is on the viewer's left). |

### A-007 — Chest Lateral educational baseline: web-resolution copy (derived from A-006)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Chest Lateral educational baseline, web resolution |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-006. Derivation: RAD-LAB (`scripts/derive-chest-lateral-baseline.py`). |
| License | CC0 1.0 Universal (inherited from A-006; RAD-LAB asserts no additional rights) |
| Modification / redistribution / commercial use | Permitted (CC0, as stated for A-006) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR), which also says it is a different person (S12-4). |
| Local project path | `public/images/chest-lateral/chest-lateral-baseline-1000.jpg` (the file the app loads) |
| RAD-LAB modifications | Converted to 8-bit greyscale, downscaled to 1000 × 1387 px (Lanczos), JPEG quality 88, **saved without any metadata**. The script refuses to run if the master carries EXIF / ICC / comments. No annotation was removed (none exists), nothing painted over, no crop, tone or contrast change. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-chest-lateral-baseline.py` (checks the A-006 SHA-1 first). Output re-read: no EXIF, JFIF only. |
| Checksum | SHA-1 `21e5da524de8dac2e39818e0d282b275575571e1` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1000 × 1387 px, 194,965 bytes |
| Notes | The renderer decodes this file in the browser and applies the same deterministic educational effects at display time (runtime transformations, not new assets). Landmarks (`src/data/cases/chest-lateral-radiograph.ts`) were read by eye. No jaw / arm / scapula overlay exists for the lateral. |

### A-008 — NIH ChestX-ray14 image 00023616_000: AP chest radiograph, unmodified master (S13)

| Field | Value |
|---|---|
| Asset name | NIH ChestX-ray14 image `00023616_000.png` |
| Asset type | Radiograph (adult AP chest), PNG, 8-bit greyscale |
| Creator / author | NIH Clinical Center (data provider); dataset paper: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, *ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases*, IEEE CVPR, pp. 3462-3471, 2017 |
| Original source | NIH download site <https://nihcc.app.box.com/v/ChestXray-NIHCC> (the page loaded, HTTP 200, but is a JavaScript app: **no terms text was readable**) |
| **Terms (SECONDARY source — re-verify at the official NIH page, O16)** | Google Cloud documentation "NIH Chest X-ray dataset", <https://docs.cloud.google.com/healthcare-api/docs/resources/public-datasets/nih-chest> (page "Last updated 2026-10-05 UTC", read 2026-10-06). Section "License and attribution", exact wording: **"There are no restrictions on the use of the NIH chest x-ray images. However, the dataset has the following attribution requirements:"** (1) "Provide a link to the NIH download site: https://nihcc.app.box.com/v/ChestXray-NIHCC" (2) "Include a citation to the CVPR 2017 paper: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017" (3) "Acknowledge that the NIH Clinical Center is the data provider". |
| Official NIH wording | **Not read.** One attempt per host (2026-10-06): `nihcc.app.box.com` HTTP 200 but no terms text (JS app, 119 characters of text); `www.nih.gov` news release HTTP 403 (Cloudflare "Attention Required"); `clinicalcenter.nih.gov` not retried after the allowlist change. The owner approved using the dataset on the secondary wording (S13-1). |
| Licence class | NIH statement "no restrictions on use" + three attribution conditions (not a CC licence). Commercial use: the wording imposes no restriction; owner-approved basis, **pending re-verification at the NIH page (O16)**. |
| Transport route (mirror, NOT the licence source) | Hugging Face dataset `alkzar90/NIH-Chest-X-ray-dataset` (its card says licence "unknown"; irrelevant here): one PNG extracted with HTTP range requests from `data/images/images_010.zip` (no archive downloaded), metadata from `data/Data_Entry_2017_v2020.csv` (SHA-256 `dc1d2df67fdc1c5a7601d48699cda2b13dc2c4841488b4183dcf04884dbaca11`). The mirrored bytes were **not compared with the NIH original** (NIH unreachable). The Google Cloud bucket `gcs-public-data--healthcare-nih-chest-xray` is "Requester Pays" (needs credentials): **not used**. |
| Dataset metadata for the image | `Finding Labels` = No Finding; `Follow-up #` 0; `Patient Age` 31; `Patient Gender` M; `View Position` AP; original 2500 × 2048 px at 0.168 mm (the dataset PNG is 1024 × 1024). |
| Selection | From the CSV: View Position AP, No Finding, age 25–60, follow-up 0 (1366 candidates); 24 randomly chosen candidates were viewed; on the contact sheets (thumbnails) nearly all of the others showed burned-in text (side markers, "PORTABLE" / "AP"), lines / leads / devices, or were cropped / rotated; this one was inspected at full size: no text, no tubes / leads / devices, whole lungs with both costophrenic angles, clavicles roughly horizontal, spine roughly central, adequate quality. Borderline remarks: the lower diaphragm is cropped, the shoulders are slightly asymmetric. |
| Local project path | `assets/source/chest-ap/NIH-ChestXray14_00023616_000.png` (provenance master; **not** served by the app) |
| RAD-LAB modifications | **None** (byte-identical to the file fetched). |
| Checksum | SHA-256 `c85b227f5154d8f5248551b8f93e6ee43803652027167c969c6c5f31eea1f3b5` |
| File facts | `image/png`, 1024 × 1024 px, 8-bit greyscale, 348 / 383 KB; chunks IHDR, one `tIME` (2016-09-19 19:05:49, a file timestamp), IDAT, IEND. No text chunks. |
| De-identification evidence | Visual inspection of the full image (no text in any corner or margin), PNG chunk scan (only `tIME`), no DICOM tags. The file name is the dataset's pseudonymous index; it is recorded here but not shown in the product. |
| Date verified | 2026-10-06 (terms read, image fetched, SHA-256 computed, image inspected) |
| Notes | **S12-4 / S13:** a representative normal adult AP chest of a **different person** from the PA and lateral baselines. **The patient position of the original exposure (supine, semi-erect, erect) is not known and not claimed**; the supine state of the exam is a teaching approximation of the exam variant. |

### A-009 — Chest AP educational baseline: web copy (derived from A-008)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Chest AP educational baseline, 1024 px |
| Asset type | Radiograph, derived PNG (8-bit greyscale) |
| Creator / author | As A-008. Derivation: RAD-LAB (`scripts/derive-chest-ap-baseline.py`). |
| Licence | As A-008 (NIH terms, secondary source, O16). Attribution **required** (link to the NIH download site, the CVPR 2017 citation, NIH Clinical Center acknowledged as data provider): shown as the credit line under the result image (`RadiographAssetSpec.credit`, EN + AR draft). **No separate sources / credits page exists in the app**; a page is open item O18. |
| RAD-LAB modifications | Lossless re-encode without the `tIME` chunk. **No pixel change** (the script asserts pixel equality), no crop, no resize (the owner accepts 1024 px as the minimum for this asset), no tone change, nothing painted over. |
| Local project path | `public/images/chest-ap/chest-ap-baseline-1024.png` (the file the app loads) |
| Date / method of verification | 2026-10-06. Reproducible: `python3 -I scripts/derive-chest-ap-baseline.py` (checks the A-008 SHA-256 first). Output re-read: chunks IHDR / IDAT / IEND only. |
| Checksum | SHA-256 `dff1f737cfcccc3e4728a9314c5c49787c48ceb9508997ad701bd42dc4d84f1a` |
| File facts | `image/png`, 1024 × 1024 px, 404,226 bytes |
| Notes | Landmarks (`src/data/cases/chest-ap-radiograph.ts`) were read by eye. No scapula / jaw overlay exists for the AP. |

### A-010 — Normal wrist, PA (dorsoplantar) projection, left wrist: unmodified master (S14.1c)

| Field | Value |
|---|---|
| Asset name | X-ray of normal wrist by dorsoplantar projection (crop) |
| Asset type | Radiograph (adult left wrist, PA), JPEG |
| Original filename | `X-ray of normal wrist by dorsoplantar projection (crop).jpg` |
| Creator / author | Mikael Häggström, M.D. (Commons user *Mikael Häggström*), own work (self-exam) — per the Commons API record (`Artist`, `Credit`) |
| Original organization / source | Wikimedia Commons; taken at Uddevalla Hospital |
| Original source URL | <https://commons.wikimedia.org/wiki/File:X-ray_of_normal_wrist_by_dorsoplantar_projection_(crop).jpg> |
| License | **CC0 1.0 Universal** (`LicenseShortName` CC0, `UsageTerms` "Creative Commons Zero, Public Domain Dedication", `AttributionRequired` false) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/wrist/X-ray_of_normal_wrist_by_dorsoplantar_projection_(crop).jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached and to the Commons file (same SHA-1). |
| Date / method of verification | 2026-10-07, through the **Wikimedia Commons API** (`action=query&prop=imageinfo`; HTTP 200 on the first request): uploader, upload time 2018-11-02 10:25 UTC, size 209,131 bytes, 690 × 980 px, SHA-1, licence fields, categories "CC-Zero", "X-rays of normal wrists"; description "X-ray on the left side of a 31 year old male, showing normal anatomy and no injuries. Taken at Uddevalla Hospital." Date taken 2017-10-29. The HTML file page was not read (O27). The owner's screenshots agree. |
| Checksum | SHA-1 `d58697fe9e74a208c00d1b92a61ab3d7dd0efd7a` (equals the Commons SHA-1); SHA-256 `dde7c775544535845aa6195b0419150187e5b79520b4ff5df818f1f8aab2e029` |
| File facts | `image/jpeg`, JFIF only (no EXIF / ICC / XMP / comment), 690 × 980 px, 209,131 bytes, RGB-encoded greyscale content |
| De-identification evidence | Visual inspection of the full image and its four edges (no burned-in text, no markers, no ruler, no date), pixel scan of the dark margins (no text-like bright blobs), no metadata beyond JFIF. No device, cast, implant or pathology. The author's description gives age and sex only (31, male); no name is recorded anywhere in RAD-LAB. |
| Notes | **A crop by its author** (the proximal metacarpals are cut by the top edge; the thumb side is cut by the right edge). Shows the distal radius and ulna, the carpals and the proximal metacarpals; the **mid-metacarpal area Bontrager names is not in the image** (S14.1c-7, O28). Left wrist (thumb on the viewer's right). Same person as the lateral A-012. **Not** the person of any chest case (S12-4). A teaching approximation, never ground truth. |

### A-011 — Wrist PA educational baseline: web copy (derived from A-010)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Wrist PA educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-010. Derivation: RAD-LAB (`scripts/derive-wrist-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-010; RAD-LAB asserts no additional rights) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR), which also says it is a real adult left wrist used as a teaching approximation. |
| Local project path | `public/images/wrist/wrist-pa-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | Converted to 8-bit greyscale, **no crop, no resampling** (native 690 × 980 px), JPEG quality 88, saved without any metadata. The script refuses to run if the master carries EXIF / ICC / comments or if its SHA-1 differs. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-wrist-baselines.py`. Output re-read: no EXIF, JFIF only. |
| Checksum | SHA-1 `1f43e5db59ce3ed6b94a7a3b093cf69bd0609726` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 690 × 980 px, 133,941 bytes |
| Notes | Landmarks (`src/data/cases/wrist-pa-radiograph.ts`) were read by eye. The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-012 — Normal wrist, lateral projection, left wrist: unmodified master (S14.1c)

| Field | Value |
|---|---|
| Asset name | X-ray of normal wrist by lateral projection |
| Asset type | Radiograph (adult left wrist, lateral), JPEG |
| Original filename | `X-ray of normal wrist by lateral projection.jpg` |
| Creator / author | Mikael Häggström (Commons user), own work — per the Commons API record |
| Original organization / source | Wikimedia Commons; taken at Uddevalla Hospital |
| Original source URL | <https://commons.wikimedia.org/wiki/File:X-ray_of_normal_wrist_by_lateral_projection.jpg> |
| License | **CC0 1.0 Universal** (`LicenseShortName` CC0, `AttributionRequired` false) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No (voluntary credit under the result image) |
| Local project path | `assets/source/wrist/X-ray_of_normal_wrist_by_lateral_projection.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached and to the Commons file. |
| Date / method of verification | 2026-10-07 through the Commons API (as A-010): uploaded 2017-10-29 17:18 UTC, 199,006 bytes, 559 × 1756 px, SHA-1; description "X-ray on the left side of a 31 year old male, showing normal anatomy and no injuries. Taken at Uddevalla Hospital."; date taken 2017-10-29. |
| Checksum | SHA-1 `209c218e704562042150b2b58205564a0c327820` (equals the Commons SHA-1); SHA-256 `41350729d8c3f1bb7c680dce7cba58152cfc6cb4b1c65d38a7bbacad3c594dc0` |
| File facts | `image/jpeg`, JFIF only, 559 × 1756 px, 199,006 bytes |
| De-identification evidence | **Burned-in text found: "Sin" (bottom right; rows 1411–1492, columns 507–555)** — a side annotation. It is removed by the crop recorded in A-013. After the crop a pixel scan of the remaining margins finds no text-like bright pixels. No metadata beyond JFIF. No device, cast, implant or pathology. |
| Notes | The master still contains the burned-in text (a provenance copy, not served). Shows the carpals, distal radius / ulna and proximal metacarpals; the mid-metacarpal area is not in the image (O28). Which side is dorsal is **not** claimed. Same person as A-010. A teaching approximation. |

### A-013 — Wrist lateral educational baseline: web copy (derived from A-012)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Wrist lateral educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-012. Derivation: RAD-LAB (`scripts/derive-wrist-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-012) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/wrist/wrist-lateral-baseline.jpg` |
| RAD-LAB modifications | **Cropped to remove the burned-in side text "Sin": crop box (left 0, top 0, right 559, bottom 1400) of the 559 × 1756 master** (i.e. the lower 356 rows, which carry the text and only distal forearm, are removed); 8-bit greyscale, no resampling, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible with the same script; after the crop no pixel above 110 grey remains in x ≥ 460, y ≥ 800. Output re-read: no EXIF. |
| Checksum | SHA-1 `5471cadf7381303422e5f49c248b0f3856ef45aa` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 559 × 1400 px, 115,640 bytes |
| Notes | Landmarks (`src/data/cases/wrist-lateral-radiograph.ts`) were read by eye. |

### A-014 — Normal hand, PA (dorsoplantar) projection, left hand: unmodified master (S14.2b)

| Field | Value |
|---|---|
| Asset name | X-ray of normal hand by dorsoplantar projection |
| Asset type | Radiograph (adult left hand, PA), JPEG |
| Original filename | `X-ray of normal hand by dorsoplantar projection.jpg` (**assumed** from a Commons search title; the match with the attached file is **not** confirmed, O39) |
| Creator / author | Mikael Häggström, M.D. (per the owner's description: own work, self-exam). **Not verified through Commons** (HTTP 429, S14.2-9) |
| Original organization / source | Wikimedia Commons; taken at Uddevalla Hospital, 29 Oct 2017 (per the owner) |
| Original source URL | <https://commons.wikimedia.org/wiki/File:X-ray_of_normal_hand_by_dorsoplantar_projection.jpg> (**not read**) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/hand/X-ray_of_normal_hand_by_dorsoplantar_projection.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached to the S14.2b session |
| Date / method of verification | 2026-10-07. The owner attached the original. Commons API `imageinfo` request: **HTTP 429 twice** (one retry), nothing else tried. Dimensions and size match the owner's description (1466 × 2082 px, 493 KB). Re-verification = **O39** |
| Checksum | SHA-1 `07af22bc384109454889ce1c52415922ddc8c0aa`; SHA-256 `fc625315086c915ab0170a6bcb1fc93ffc58ab1cd2bdf331ec2710ee03192b35` |
| File facts | `image/jpeg`, JFIF only (no EXIF / ICC / XMP / comment), 1466 × 2082 px, 505,312 bytes, RGB-encoded greyscale content |
| De-identification evidence | **Burned-in text found: a mirrored "Sin" (top left, rows 79–158, columns 64–148)** on a slightly lighter label card above the little finger. Removed in A-015. After the fill no pixel above 90 grey remains in the top-left 300 × 260 px. Visual inspection of the full image: no other text, ruler, date or marker. No metadata beyond JFIF. No device, cast, implant or pathology. The description gives age and sex only (31, male); no name is recorded anywhere in RAD-LAB. |
| Notes | Shows the whole left hand (thumb on the viewer's right, fingers spread slightly), the carpals and the distal radius and ulna (≈ 3 cm of forearm beyond the 2.5 cm line, S14.2-10). The same person as the wrist images A-010 … A-013 and the hand lateral A-016 (per the author). **Not** the person of any chest case (S12-4). A teaching approximation, never ground truth. |

### A-015 — Hand PA educational baseline: web copy (derived from A-014)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Hand PA educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-014. Derivation: RAD-LAB (`scripts/derive-hand-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-014; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/hand/hand-pa-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in text removed by a fill, no crop** (S14.2-7): pixels brighter than 90 inside the box (left 56, top 70, right 160, bottom 166), grown by 3 px, replaced by the least-squares plane fitted to the surrounding non-text ring of the label card. 8-bit greyscale, no resampling (native 1466 × 2082 px), JPEG quality 88, no metadata. The script refuses to run if the master's SHA-1 differs or if it carries EXIF / ICC / comments. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-hand-baselines.py`. Output re-read: no EXIF, JFIF only; the fill region inspected at 2× (no text, no visible seam apart from the card edge). |
| Checksum | SHA-1 `a2d9d743cffd97299d321b4e4e2954e832dc91e8`; SHA-256 `22f45127bb9b42362bebf72857a0523420b0b872a47ae94313692dbb6776206f` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1466 × 2082 px, 364,565 bytes |
| Notes | Landmarks (`src/data/cases/hand-pa-radiograph.ts`) were read by eye. The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-016 — Normal hand, lateral projection (extension), left hand: unmodified master (S14.2b)

| Field | Value |
|---|---|
| Asset name | X-ray of normal hand by lateral projection |
| Asset type | Radiograph (adult left hand, lateral, fingers extended and superimposed, thumb separated), JPEG |
| Original filename | `X-ray of normal hand by lateral projection.jpg` (**assumed** from a Commons search title; not confirmed, O39) |
| Creator / author | As A-014 (per the owner's description). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; Uddevalla Hospital, 29 Oct 2017 (per the owner) |
| Original source URL | <https://commons.wikimedia.org/wiki/File:X-ray_of_normal_hand_by_lateral_projection.jpg> (**not read**) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (as A-014) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No (voluntary credit under the result image) |
| Local project path | `assets/source/hand/X-ray_of_normal_hand_by_lateral_projection.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached |
| Date / method of verification | As A-014 (HTTP 429 twice; re-verification O39). 686 × 2123 px and 246 KB match the owner's description |
| Checksum | SHA-1 `b1708a29ae292ccff95a123087383af1f6d9a32f`; SHA-256 `d0e25d438a770eb0c5c03c7045707111ad14a684392981a366aab771953c0539` |
| File facts | `image/jpeg`, JFIF only, 686 × 2123 px, 252,377 bytes |
| De-identification evidence | **Burned-in text found: "SIDA" (bottom right, rows ≈ 2083–2113, from column 604 to the right edge)** over the soft-tissue edge and the black background. Removed in A-017. Visual inspection of the full image: no other text, ruler, date or marker. No metadata beyond JFIF. No device, cast, implant or pathology. |
| Notes | Fingers extended and superimposed, thumb separated (the extension variant, Bontrager p.153, S14.2-6). Shows the carpals and ≈ 4 cm of distal radius / ulna beyond the 2.5 cm line (S14.2-10). Which side is dorsal / palmar is **not** claimed. The same person as A-014. A teaching approximation. |

### A-017 — Hand lateral educational baseline: web copy (derived from A-016)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Hand lateral educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-016. Derivation: RAD-LAB (`scripts/derive-hand-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-016; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/hand/hand-lateral-baseline.jpg` |
| RAD-LAB modifications | **Burned-in text removed by a fill, no crop** (S14.2-7): pixels brighter than 100 inside the box (left 596, top 2072, right 686, bottom 2123), grown by 3 px, replaced by the mean of the 4 clean rows above the box continued straight down the same columns. (A crop of the lower 51 rows would have cut the radius / ulna shafts.) 8-bit greyscale, no resampling (native 686 × 2123 px), JPEG quality 88, no metadata. **A small local fill artefact remains** at the lower right (soft tissue only, about 15 × 35 px); no anatomy beyond the soft-tissue edge in the box is altered. |
| Date / method of verification | 2026-10-07. Reproducible with the same script; after the fill no pixel above 100 grey remains in x ≥ 596, y ≥ 2072. Output re-read: no EXIF. |
| Checksum | SHA-1 `1b37166d34eacaaf1f4a5346f218d09f2afd1d72`; SHA-256 `3b19a73cbc735042f40fb05c0d0e4c6ca755ed8cf218ba9e585936fd7674f950` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 686 × 2123 px, 180,645 bytes |
| Notes | Landmarks (`src/data/cases/hand-lateral-radiograph.ts`) were read by eye. |

### Not external assets (for completeness)
- `docs/RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md` and the other medical references in `docs/` are project documents supplied by the project owner, not binary assets.
- No fonts, icons, audio or datasets were added in Session 4.
- Session 6 added no external assets (hosting configuration, a text banner and documents only). Candidate sources / datasets for other modalities are listed — **not downloaded, not registered** — in `docs/MODALITY_SOURCES_CANDIDATES.md`.

---

## O10 commercial-licence audit (Session 12, step 1 — 2026-10-06)

Criteria: S10-3 (own work, public domain / CC0, CC BY or purchased licence; NC / ND excluded; SA only with owner approval; Radiopaedia not used).

### A. Registered assets (A-001 … A-005)

| Entry | Source / licence | Commercial-compatible | In repo | Result |
|---|---|---|---|---|
| A-001 master (PA chest, Häggström) | Wikimedia Commons, CC0 1.0, verified 2026-10-06 directly against Commons (see entry) | Yes | `assets/source/chest-pa/` (not served) | Pass. Nothing to revisit; no attribution legally required, voluntary credit kept. |
| A-002 derived (annotations neutralised) | CC0 (inherited) | Yes | `public/images/chest-pa/` | Pass |
| A-003 web copy | CC0 (inherited) | Yes | `public/images/chest-pa/` | Pass |
| A-004 doc screenshots | CC0 (derived from A-003 + RAD-LAB output) | Yes | `docs/session-4-renders/` | Pass |
| A-005 goldens / contact sheet | CC0 (derived from A-003 + RAD-LAB output) | Yes | `scripts/qa/golden/`, `docs/session-5-renders/` | Pass |

No fonts, icons, audio or datasets are registered. The A-001 licence record was **not re-fetched** in this audit (the Commons API was rate-limited, see B); the entry's 2026-10-06 verification stands and no derivative or attribution line needs revisiting on the evidence in the repo.

### B. Assets the Chest Lateral exam would need

| Needed asset | Source | Licence | Commercial-compatible | In repo | Result |
|---|---|---|---|---|---|
| Lateral chest baseline radiograph (adult, erect, annotations neutral) | Wikimedia Commons file `Normal lateral chest radiograph (X-ray).jpg`, **supplied by the owner** (2026-10-07) | CC0 1.0 as stated by the owner from the file page | Yes | **Yes — A-006 / A-007** (added in the S12 implementation commit) | **UNBLOCKED (owner-verified; Commons re-verification pending, see A-006).** Superseded by section E. |
| Lateral overlays (arms, scapula, soft tissue) | would be authored procedurally by RAD-LAB code | own work | Yes | n/a | Not yet needed |
| R / L side marker | learner-controlled annotation layer drawn by the renderer | own work | Yes | already in renderer | Pass |
| Lateral positioning scene art | schematic, authored by RAD-LAB (no generated scene art, owner decision) | own work | Yes | No | Not yet authored |

Verification attempt: `commons.wikimedia.org` API (search for lateral chest radiographs; `meta=siteinfo` retry) returned **HTTP 429 "too many requests"** from the session's shared egress IP on three attempts. Not bypassed. No Wikimedia, Radiopaedia or other image was downloaded, so none can be registered. **No asset was used.**

### C. Options (cost / licence / effort)

1. **Retry Commons from another network route or later** (the owner can also check candidates by hand and give file titles). Licence: CC0 / CC BY only; verify `extmetadata` licence, `AttributionRequired`, SHA-1, annotations and patient demographics per A-001 practice. Cost: free. Effort: low. **Recommended**, with the owner supplying 1-3 candidate file titles if rate limiting persists.
2. **Owner-supplied or purchased image** with a written commercial licence (e.g. a hospital-owned or stock radiograph with patient-consent / de-identification evidence). Cost: money / legal time. Effort: medium.
3. **Open dataset image** (NIH / OpenI, etc.): each dataset's terms must be read first; only after a compatibility review. Effort: medium-high; many are "to verify".
4. **Schematic / phantom fallback**: lower realism, must be labelled; owner has ruled out generated scene art, so only a hand-authored vector schematic would qualify. Effort: high.

Per the S12 rule, no implementation starts until an image is licence-verified.

### D. Follow-up attempts (S12-5, 2026-10-06 / 07)

| Source | Attempt | Result |
|---|---|---|
| Wikimedia Commons (API) | One further retry after a pause (no mirrors / caches / workarounds) | **HTTP 429 again**; nothing fetched. Cumulative: 4 attempts, all 429. |
| CDC PHIL (`wwwn.cdc.gov/phil`) | Site reachable (HTTP 200). `Search.aspx?q=` errors; the Quick Search form returned **no result list** to a plain server-side request (it appears to need an interactive browser session). One request each; no scraping, no mirrors. | **No candidate identified.** PHIL's holdings are mainly pathogen / public-health imagery (chest films there are typically disease cases), so a *normal adult lateral* is unlikely; no record was read, so no licence text or de-identification evidence could be recorded. |
| NIH / OpenI and other datasets | Not attempted (S12-5: terms must be read, recorded and the owner must approve first) | n/a |

**Outcome: still no licence-verified lateral chest baseline. Nothing downloaded or registered; no image used.** Per S12-5 the Lateral exam is not implemented. To unblock: the owner can supply 1–3 Commons file titles / PHIL image IDs (or a purchased / owner-owned image with a written commercial licence), or approve a named dataset after its terms are read.

### E. Outcome (2026-10-07)

The owner supplied the lateral image (owner-verified CC0, attached file); the one allowed Commons retry was again HTTP 429, so it is recorded as **"owner-verified, attached file, re-verify later"** (A-006). Content, burned-in text and metadata checks passed (A-006); a metadata-free web copy is A-007. **No other asset was added** (no overlay art, no scene image: the Lateral positioning scene is hand-drawn SVG code). CDC PHIL and datasets were not used. **O10 (audit of A-001 … A-005): all pass.** Open: re-verify A-006 on Commons (licence, author, upload date, SHA-1) and amend the entry.

### F. Wrist baselines (S14.1c, 2026-10-07)
Two images of the same person's left wrist were supplied by the owner and verified through the **Commons API** (HTTP 200, one attempt): author Mikael Häggström, M.D., CC0 1.0, no attribution required, SHA-1 identical to the owner's downloads (A-010, A-012). The lateral carried a burned-in side text and was **cropped** (A-013); the PA is the author's own crop and needed none (A-011). Web copies carry no metadata. Open: the Commons file pages (HTML) were not read, only their API record (O27). Commercial-compatible (CC0, S10-3): yes. Not registered: any overlay art, scene image or font (the wrist scene is hand-drawn SVG code).

### G. Hand baselines (S14.2b, 2026-10-07)
Two images of the same person's left hand were attached by the owner (A-014, A-016): CC0 **as seen by the owner on the file pages**. The Commons API request was **HTTP 429 twice**, so they are recorded as **owner-verified** and **not** compared with the Commons SHA-1 (open item O39). Both carried a burned-in text ("Sin" mirrored on the PA, "SIDA" on the lateral); it was removed by a documented **fill** (no crop, S14.2-7) in the derive script (A-015, A-017). Web copies carry no metadata. Commercial-compatible (CC0, S10-3): yes, if the owner's statement holds. Not registered: any overlay art, scene image or font (the hand scene is hand-drawn SVG code).
