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
- A radiograph used by a case is an **educational baseline, not clinical ground truth** for every simulated error (see `docs/archive/sessions/session-4-radiograph-renderer.md`).

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
| Re-verification (RAD-018) | **Re-verified 2026-10-15 (RAD-018):** file page HTTP 200, CC0 template + `CC-Zero`, author and date as registered; downloaded original SHA-1 equals the registered SHA-1. Full detail: `docs/ASSET_LICENCE_AUDIT_2026-10-15.md`. |

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
| Local project path | `assets/source/chest-pa/chest-pa-baseline.jpg` (full-resolution derivative kept for provenance; **not** served by the app — the app loads A-003. Moved from `public/images/chest-pa/` in RAD-061 batch 6, bytes unchanged) |
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
| Notes | The renderer decodes this file in the browser and applies deterministic educational effects at display time. Those effects are **runtime transformations of this asset**, not new assets; they are documented in `docs/archive/sessions/session-4-radiograph-renderer.md`. The schematic scapula and jaw overlays are drawn procedurally by RAD-LAB code and use no external imagery. |

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
| Notes | Contains the learner-style L / R marker where shown; no real patient data. Candidate baselines for a future adult-male image are **not** registered here (nothing was downloaded); see `docs/archive/sessions/session-5-baseline-options.md`. |

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
| Re-verification (RAD-018) | **Re-verified 2026-10-15 (RAD-018):** file page HTTP 200, CC0 template + `CC-Zero`, Mikael Häggström, 28 Jun 2017; downloaded original SHA-1 equals the registered SHA-1 (closes the S12 re-verify note). Detail in the audit file. |

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
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** NIH terms still NOT readable (the Box download page is a JavaScript app, ~119 characters of text); commercial status NOT established. See O101. **Owner decision 2026-10-15: kept as "owner-verified" for now (terms not read by Claude Code, no screenshot); revisit before release (O101 deferred, RAD-038).** |

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
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** file page read (CC0, Häggström, 29 Oct 2017); original download answered HTTP 429, so bytes are NOT re-verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

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
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** file page read (CC0, Häggström, 29 Oct 2017); original download answered HTTP 429, so bytes are NOT re-verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

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
| Re-verification (RAD-018) | **Re-verified 2026-10-15 (RAD-018):** file page HTTP 200, CC0, Häggström, 29 Oct 2017; downloaded original SHA-1 equals the registered SHA-1 (no longer owner-verified only). |

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
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** file page read (CC0, Häggström, 29 Oct 2017); original download answered HTTP 429, so bytes are NOT re-verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

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

### A-018 — Normal elbow, AP (fully extended), left elbow: unmodified master (S14.3)

| Field | Value |
|---|---|
| Asset name | Normal elbow, AP (fully extended), left elbow |
| Asset type | Radiograph (adult left elbow, AP, extended, supinated), JPEG |
| Original filename | **Unknown.** The Commons file title was not read (HTTP 429 twice, S14.3-6). The master is stored as `elbow-ap-extended-owner-attached.jpg` (a descriptive name given by RAD-LAB) |
| Creator / author | Mikael Häggström, M.D. (per the owner's description: own work, self-exam). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; taken at Uddevalla Hospital, 29 Oct 2017 (per the owner) |
| Original source URL | **Not known / not read** (O47) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/elbow/elbow-ap-extended-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached to the S14.3 session |
| Date / method of verification | 2026-10-07. The owner attached the original. Commons API request: **HTTP 429 twice** (one retry), nothing else tried. Dimensions and size match the owner's description. Re-verification = **O47** |
| Checksum | SHA-1 `2d2a1e9d6e051df58f9b05d1dca717f2b71867cf`; SHA-256 `89cd1ca067ecfc2bf52f7b015b563043938b7801194df6cb993279ffae9dee38` |
| File facts | `image/jpeg`, JFIF only (no EXIF / ICC / XMP / comment), 849 × 1138 px, 100160 bytes |
| De-identification evidence | **Burned-in text found: a mirrored "Sin" (mid-right, master rows 977–1023, columns 691–763, in the dark background) and a small "F" (bottom centre, rows ≈ 1105–1120, columns ≈ 454–464).** A 1-px frame line (rows 0–1) is also present. All three are removed in A-019. Visual inspection of the full image and a contrast-stretched view: no other text, ruler, date or identifier. No metadata beyond JFIF. No device, cast, implant or pathology. The description gives age and sex only (31, male); no name is recorded anywhere in RAD-LAB. |
| Notes | Both epicondyles are inside the image (the medial one at the viewer's left); the distal humerus shows ≈ 8 cm above the joint line and ≈ 9 cm of forearm below it (at the **assumed** scale 0.0155 cm / px, S14.3-9); the radial head, neck and tuberosity are separated from the ulna or only slightly superimposed (a near-true AP). The same person as the wrist, hand and elbow-lateral images (per the author). **Not** the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_normal_elbow_by_anteroposterior_projection.jpg` (page read: CC0, Häggström, 29 Oct 2017 = registry date); download 429, so identity is NOT proven. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-019 — RAD-LAB Elbow AP educational baseline: web copy (derived from A-018)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Elbow AP educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-018. Derivation: RAD-LAB (`scripts/derive-elbow-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-018; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/elbow/elbow-ap-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in text removed (S14.3-7): crop of the lowest 38 rows (rows ≥ 1100, the "F") and the top 3 rows (frame line) → 849 × 1097 px; fill of the "Sin"** (pixels brighter than 40 inside the master box left 685, top 965, right 775, bottom 1032, grown by 9 px, replaced row by row by the straight line between the mean of 3 clean pixels on each side, then smoothed over 13 rows inside the mask). 8-bit greyscale, no resampling, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-elbow-baselines.py` (checks the master's SHA-1 first and refuses a master with metadata). Output re-read: no EXIF, JFIF only; after the fill no pixel above 46 grey remains in x ≥ 600, y 920–1060 other than the soft-tissue edge, and no text is visible at 5× contrast (a faint smooth patch remains, O48). |
| Checksum | SHA-1 `a6b616982087217bfa0880883a931066a1d7406e`; SHA-256 `a41f8d7006dc153116f135f1b49e62f4f0cfa77362eb311dceeb45f70c8fd878` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 849 × 1097 px, 61,862 bytes |
| Notes | Landmarks (`src/data/cases/elbow-ap-radiograph.ts`) were read by eye. The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-020 — Normal elbow, lateral (flexed 90°), left elbow: unmodified master (S14.3)

| Field | Value |
|---|---|
| Asset name | Normal elbow, lateral (flexed 90°), left elbow |
| Asset type | Radiograph (adult left elbow, lateral, flexed ≈ 90°, thumb side up), JPEG |
| Original filename | **Unknown.** The Commons file title was not read (HTTP 429 twice, S14.3-6). The master is stored as `elbow-lateral-flexed-owner-attached.jpg` (a descriptive name given by RAD-LAB) |
| Creator / author | Mikael Häggström, M.D. (per the owner's description: own work, self-exam). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; taken at Uddevalla Hospital, 29 Oct 2017 (per the owner) |
| Original source URL | **Not known / not read** (O47) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/elbow/elbow-lateral-flexed-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None.** Byte-identical to the file the owner attached to the S14.3 session |
| Date / method of verification | 2026-10-07. The owner attached the original. Commons API request: **HTTP 429 twice** (one retry), nothing else tried. Dimensions and size match the owner's description. Re-verification = **O47** |
| Checksum | SHA-1 `0beb1fc74b207e8617d52b906087e921567f9da1`; SHA-256 `00f9e12ee716e59c709bd6beaf1a91ba52c6ea315394256979b65e40e7b35b63` |
| File facts | `image/jpeg`, JFIF only (no EXIF / ICC / XMP / comment), 1086 × 1103 px, 117916 bytes |
| De-identification evidence | **No burned-in text found** (full-image view and a 5× contrast stretch of the whole image; the image edges carry only bone and soft tissue). No ruler, marker, date or identifier. No metadata beyond JFIF. No device, cast, implant or pathology. Age and sex only (31, male); no name. |
| Notes | Humerus vertical (cut by the top edge), forearm horizontal toward the viewer's left, radius on top (thumb side up), the olecranon at the lower right; the distal humerus outline is close to a single circle (near-true lateral). The same person as A-018. A teaching approximation. Which side is medial / lateral is not read from the image. |
| Re-verification (RAD-018) | **Re-verified 2026-10-15 (RAD-018):** source identified as `File:X-ray_of_normal_elbow_by_lateral_projection.jpg` (CC0, Häggström, 29 Oct 2017); downloaded original SHA-1 equals the registered SHA-1. |

### A-021 — RAD-LAB Elbow lateral educational baseline: web copy (derived from A-020)

| Field | Value |
|---|---|
| Asset name | RAD-LAB Elbow lateral educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-020. Derivation: RAD-LAB (`scripts/derive-elbow-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-020; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/elbow/elbow-lateral-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **None except the re-encode:** no text was found, so no crop and no fill. 8-bit greyscale, native size (1086 × 1103 px, no resampling), JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-elbow-baselines.py` (checks the master's SHA-1 first and refuses a master with metadata). Output re-read: no EXIF, JFIF only. |
| Checksum | SHA-1 `59b2c7b20761aae300499212ba7ae3c5155b4d0e`; SHA-256 `3ebc6207178816723a115e8b8822bd0fb504f6a115621049262332f95c73f474` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1086 × 1103 px, 82,969 bytes |
| Notes | Landmarks (`src/data/cases/elbow-lateral-radiograph.ts`) were read by eye. The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### H. Knee and foot baselines (S14.4, 2026-10-07)
Four images of **right** limbs were attached by the owner (A-022, A-024, A-026, A-028): CC0 **as seen by the owner on the file pages**, author Mikael Häggström, M.D. The Commons `imageinfo` request was **HTTP 429 twice** (one retry), so they are recorded as **owner-verified** and **not** compared with the Commons SHA-1 (open item O56). A `list=search` request (HTTP 200) listed the two knee titles; nothing else was fetched. All four carry a burned-in "Dx" (Swedish *dexter* = right); the handling (crop where possible, otherwise a documented fill; EXIF stripped) is done in Phase B and recorded in the web-copy records A-023, A-025, A-027, A-029. Commercial-compatible (CC0, S10-3): yes, if the owner's statement holds. Not registered: any overlay art, scene image or font.

### A-022 — Normal knee, AP, right knee: unmodified master (S14.4)

| Field | Value |
|---|---|
| Asset name | Normal knee, AP, right knee: unmodified master |
| Asset type | Radiograph (adult right knee, AP, extended), JPEG |
| Original filename | `File:X-ray of a normal knee by anteroposterior projection.jpg` (**title from a Commons search, HTTP 200; match with the attached file NOT confirmed**). The master is stored under the descriptive name `knee-ap-owner-attached.jpg` |
| Creator / author | Mikael Häggström, M.D. (per the owner: own work, Uddevalla Hospital). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; 5 Jan 2018 (per the owner) |
| Original source URL | **Not read** (O56) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API (HTTP 429 twice) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/knee/knee-ap-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.4 session) |
| Date / method of verification | 2026-10-07. The owner attached the original; checksums computed locally. Commons API: `imageinfo` HTTP 429 twice. Re-verification = O56 |
| Checksum | SHA-1 `14c693482a6a103d5e47b6924536da6104be995c`; SHA-256 `12c6ea7926ce2b064208dfbb3dfa0b32212e3b966eb63b6166f5b4a210106400` |
| File facts | `image/jpeg`, 1067 × 1913 px, 250,133 bytes, JFIF only (no EXIF) |
| De-identification evidence | Burned-in text found: a mirrored **"Dx"** at the left edge in the dark background (≈ x 55–105, y 885–930). No ruler, device or other identifier seen on the full image. Removed in the web copy (S14.2-7 policy, O60). No name or date stamp seen; no device, implant or cast. |
| Notes | Distal femur, femorotibial joint and proximal tibia / fibula are inside the image; the fibula is at the viewer's left (a right knee). Right knee of a 31-year-old male per the Commons search snippet. Same author as the wrist, hand and elbow images; not the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_a_normal_knee_by_anteroposterior_projection.jpg` (page read: CC0, Häggström, 5 Jan 2018 = registry date); download 429, so identity is NOT proven. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-023 — RAD-LAB knee-ap educational baseline: web copy (derived from A-022) (S14.4)

| Field | Value |
|---|---|
| Asset name | RAD-LAB knee-ap educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-022. Derivation: RAD-LAB (`scripts/derive-knee-foot-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-022; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/knee/knee-ap-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in "Dx" removed by a fill** (pixels differing from the local 31 × 31 median by more than 6 grey levels inside the master box left 45, top 855, right 112, bottom 937, grown by 4 px, replaced by the least-squares plane of the clean pixels of the box plus residuals resampled with a fixed seed); **edge artefact repaired** (the bright, ringing strip of the master: 20 columns from the left and 12 rows from the top overwritten by the nearest clean column / row, outside every required region). No crop, no resampling. 8-bit greyscale, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-knee-foot-baselines.py` (checks the master's SHA-1 first and refuses a master with ICC / XMP / comment data or an EXIF tag other than the GDI+ pixel-density tags). Output re-read: no EXIF, JFIF only; the filled regions were reviewed at high contrast (a faint smooth patch may remain, O60). |
| Checksum | SHA-1 `b6653310e301253bd665e16ffaad7545eb386562`; SHA-256 `c04e13735dacb13dfd3c7968dc0eaa7ccf05518cbb9470be5d4397a8b42087e3` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1067 × 1913 px, 173,167 bytes |
| Notes | Landmarks (`src/data/cases/lower-limb-radiographs.ts`, `src/features/positioning/lower-limb-outlines.json`) were read by eye (O62). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-024 — Normal knee, lateral, right knee: unmodified master (S14.4)

| Field | Value |
|---|---|
| Asset name | Normal knee, lateral, right knee: unmodified master |
| Asset type | Radiograph (adult right knee, lateral, flexed), JPEG |
| Original filename | `File:X-ray of a normal knee by lateral projection.jpg` (**title from a Commons search, HTTP 200; match NOT confirmed**). The master is stored under the descriptive name `knee-lateral-owner-attached.jpg` |
| Creator / author | Mikael Häggström, M.D. (per the owner: own work, Uddevalla Hospital). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; 5 Jan 2018 (per the owner) |
| Original source URL | **Not read** (O56) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API (HTTP 429 twice) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/knee/knee-lateral-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.4 session) |
| Date / method of verification | 2026-10-07. The owner attached the original; checksums computed locally. Commons API: `imageinfo` HTTP 429 twice. Re-verification = O56 |
| Checksum | SHA-1 `9351b3c446919ce164ba85cc32595aa7a43f24a2`; SHA-256 `47d94c6770b3dfe1eef7553e8723e829dfb1b4d7e92b425c366f064d2936d64f` |
| File facts | `image/jpeg`, 1133 × 1939 px, 292,935 bytes, JFIF only (no EXIF) |
| De-identification evidence | Burned-in text found: **"Dx"** (mirrored) in the dark background left of the knee (≈ x 150–230, y 1185–1240). No ruler or device seen. Removed in the web copy (O60). No name or date stamp seen; no device, implant or cast. |
| Notes | **Per its Commons description the image shows a minimal osteophyte at the superior rim of the patellofemoral joint; the owner accepted it as a near-normal teaching image (S14.4-4, O57). No pathology is mentioned in student-facing text.** Flexion read by eye ≈ 45° (femur and tibia axes ≈ 23–24° each from vertical) versus Bontrager 20–30° (O58). Patella, distal femur, joint, proximal tibia and fibula inside the image. Same author as the wrist, hand and elbow images; not the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **Re-verified 2026-10-15 (RAD-018):** source identified as `File:X-ray_of_a_normal_knee_by_lateral_projection.jpg` (CC0, Häggström, 5 Jan 2018); downloaded original SHA-1 equals the registered SHA-1. |

### A-025 — RAD-LAB knee-lateral educational baseline: web copy (derived from A-024) (S14.4)

| Field | Value |
|---|---|
| Asset name | RAD-LAB knee-lateral educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-024. Derivation: RAD-LAB (`scripts/derive-knee-foot-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-024; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/knee/knee-lateral-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in "Dx" removed by a fill** (master box left 145, top 1170, right 235, bottom 1245; threshold 6, grown by 4 px; same method as A-023); **edge artefact repaired** (20 columns from the left, 12 rows from the top). No crop, no resampling. 8-bit greyscale, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-knee-foot-baselines.py` (checks the master's SHA-1 first and refuses a master with ICC / XMP / comment data or an EXIF tag other than the GDI+ pixel-density tags). Output re-read: no EXIF, JFIF only; the filled regions were reviewed at high contrast (a faint smooth patch may remain, O60). |
| Checksum | SHA-1 `c9bff830a7c8d69c0f8bbd02c059ca610ecf1602`; SHA-256 `e25e9cd7a158089a7c009d4df81755fabe062d0d95ec598a3d46b147911cf658` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1133 × 1939 px, 203,829 bytes |
| Notes | Landmarks (`src/data/cases/lower-limb-radiographs.ts`, `src/features/positioning/lower-limb-outlines.json`) were read by eye (O62). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-026 — Normal foot, DP (AP), right foot: unmodified master (S14.4)

| Field | Value |
|---|---|
| Asset name | Normal foot, DP (AP), right foot: unmodified master |
| Asset type | Radiograph (adult right foot, dorsoplantar), JPEG |
| Original filename | **Unknown** (the one Commons search made did not list a foot file). The master is stored under the descriptive name `foot-ap-owner-attached.jpg` |
| Creator / author | Mikael Häggström, M.D. (per the owner: own work, Uddevalla Hospital). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; 28 Jul 2017 (per the owner) |
| Original source URL | **Not read** (O56) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API (HTTP 429 twice) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/foot/foot-ap-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.4 session) |
| Date / method of verification | 2026-10-07. The owner attached the original; checksums computed locally. Commons API: `imageinfo` HTTP 429 twice. Re-verification = O56 |
| Checksum | SHA-1 `ab0e4059fa4f264461c397cba90f5429b9a90ce5`; SHA-256 `51b2160fe2b827d1e96b63baaf87ee51f892926da1a9ac725ffa86dd1c372801` |
| File facts | `image/jpeg`, 1061 × 2431 px, 836,201 bytes, JFIF **plus an EXIF block** (to be stripped). **The owner stated 1067 × 1913 px; the attached file differs (O59)** |
| De-identification evidence | Burned-in text found: **"Dx"** in an angled label box, top right corner; also a **bright frame line along the bottom edge** (rows >= ~2405) and a bright ringing strip at the left / top edges. No ruler or device seen. Removed in the web copy (O60). No name or date stamp seen; no device, implant or cast. |
| Notes | All phalanges, metatarsals, cuneiforms, navicular and cuboid inside the image; talus and calcaneus partly at the bottom edge; sesamoids visible under the 1st metatarsal head; hallux at the viewer's left (a right foot). Patient description for the foot not verified (O65). Same author as the wrist, hand and elbow images; not the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_normal_right_foot_by_dorsoplantar_projection.jpg` (page read: CC0, Häggström, 28 Jul 2017 = registry date); download 403, so identity is NOT proven. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-027 — RAD-LAB foot-ap educational baseline: web copy (derived from A-026) (S14.4)

| Field | Value |
|---|---|
| Asset name | RAD-LAB foot-ap educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-026. Derivation: RAD-LAB (`scripts/derive-knee-foot-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-026; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/foot/foot-ap-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in "Dx" removed by a fill** (master box left 815, top 78, right 915, bottom 168; threshold 8, grown by 4 px; the label card's own lighter edge is an edge, not text, and is left); **edge artefact repaired** (24 columns from the left, 3 rows from the top); **the bottom rows >= 2405 CROPPED** (a bright frame line and its ringing; a bottom crop keeps every coordinate) → 1061 × 2405 px. EXIF stripped. 8-bit greyscale, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-knee-foot-baselines.py` (checks the master's SHA-1 first and refuses a master with ICC / XMP / comment data or an EXIF tag other than the GDI+ pixel-density tags). Output re-read: no EXIF, JFIF only; the filled regions were reviewed at high contrast (a faint smooth patch may remain, O60). |
| Checksum | SHA-1 `9afba18ee49d57b4986975cd6261725d16ef2532`; SHA-256 `c1cbbeba56e629a978d1330064c7e41da76e3c051381590c06da6a101cefd463` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1061 × 2405 px, 596,434 bytes |
| Notes | Landmarks (`src/data/cases/lower-limb-radiographs.ts`, `src/features/positioning/lower-limb-outlines.json`) were read by eye (O62). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-028 — Normal foot, AP medial oblique, right foot: unmodified master (S14.4)

| Field | Value |
|---|---|
| Asset name | Normal foot, AP medial oblique, right foot: unmodified master |
| Asset type | Radiograph (adult right foot, medial oblique), JPEG |
| Original filename | **Unknown** (not listed by the one Commons search). The master is stored under the descriptive name `foot-oblique-owner-attached.jpg` |
| Creator / author | Mikael Häggström, M.D. (per the owner: own work, Uddevalla Hospital). **Not verified through Commons** |
| Original organization / source | Wikimedia Commons; 28 Jul 2017 (per the owner) |
| Original source URL | **Not read** (O56) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner saw CC0 on the file page). Not confirmed through the Commons API (HTTP 429 twice) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/foot/foot-oblique-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.4 session) |
| Date / method of verification | 2026-10-07. The owner attached the original; checksums computed locally. Commons API: `imageinfo` HTTP 429 twice. Re-verification = O56 |
| Checksum | SHA-1 `100926d407da2b21953d91a7a4d0e203d825a376`; SHA-256 `fad6242e57c74133c4915601d3eb12c1fc6ad0e9a58c38ca8901d24de6c38d56` |
| File facts | `image/jpeg`, 1077 × 2029 px, 571,297 bytes, JFIF **plus an EXIF block** (to be stripped) |
| De-identification evidence | Burned-in marks found: **"Dx"** in an angled label box (top right), **a small rectangular mark** near the middle of the forefoot (≈ x 640, y 908) and **a bright frame line along the bottom edge**. Removed in the web copy (a fill and a bottom crop; O60). No name or date stamp seen; no device, implant or cast. |
| Notes | Obliquity read by eye only (O63). The bottom edge ends at the proximal tarsals: **the posterior calcaneus is not inside the image** (O61). Metatarsals 3–5 appear free of superimposition; the 5th metatarsal tuberosity is in profile. Same author as the wrist, hand and elbow images; not the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_normal_right_foot_by_oblique_projection.jpg` from a Commons search listing; page request 403; NOT verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-029 — RAD-LAB foot-oblique educational baseline: web copy (derived from A-028) (S14.4)

| Field | Value |
|---|---|
| Asset name | RAD-LAB foot-oblique educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-028. Derivation: RAD-LAB (`scripts/derive-knee-foot-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-028; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/foot/foot-oblique-baseline.jpg` (the file the app loads) |
| RAD-LAB modifications | **Burned-in "Dx" removed by a fill** (master box left 802, top 60, right 902, bottom 152; threshold 8, grown by 4 px); **the small white mark removed by a fill** (box left 642, top 912, right 660, bottom 930; absolute threshold 120, grown by 3 px); **the slanted bright frame line along the bottom edge CROPPED** (rows >= 1960 removed; the line runs from row ~1975 at the left to ~2025 at the right) → 1077 × 1960 px. EXIF stripped. 8-bit greyscale, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-07. Reproducible: `python3 -I scripts/derive-knee-foot-baselines.py` (checks the master's SHA-1 first and refuses a master with ICC / XMP / comment data or an EXIF tag other than the GDI+ pixel-density tags). Output re-read: no EXIF, JFIF only; the filled regions were reviewed at high contrast (a faint smooth patch may remain, O60). |
| Checksum | SHA-1 `9cd05a8c25b941ef157a107b3b17bf62a7625ebc`; SHA-256 `60a280fc4409793a6040bb0ad31ec1428edc1b999cca690b634cedad5283e6d7` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 1077 × 1960 px, 395,448 bytes |
| Notes | Landmarks (`src/data/cases/lower-limb-radiographs.ts`, `src/features/positioning/lower-limb-outlines.json`) were read by eye (O62). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### I. Ankle baselines (S14.5, 2026-10-08)
Two images of the same patient's ankle (a 24-year-old male after a sprain, no injuries seen, 24 October 2017) were attached by the owner (A-030, A-032), with screenshots of both Commons file pages: author **Mikael Häggström**, source "Own work", **CC0 1.0 Universal**. The Commons API request was **HTTP 429 on the request and on its one retry**, so they are recorded as **owner-verified** and **not** compared with the Commons SHA-1 (open item O75). The side is **not stated** on the pages; **LEFT is inferred** from the fibula position on the AP image (O76). The lateral file's description calls it "somewhat suboptimal by not seeing straight through the ankle joint" (O78). Commercial-compatible (CC0, S10-3): yes, if the owner's statement holds. Not registered: any overlay art, scene image or font.

### A-030 — Normal ankle, AP (frontal), left ankle (inferred): unmodified master (S14.5)

| Field | Value |
|---|---|
| Asset name | Normal ankle, AP (frontal), left ankle (inferred): unmodified master |
| Asset type | Radiograph (adult ankle, AP / frontal), JPEG |
| Original filename | **Not read** (the Commons page title was not retrieved: the API answered HTTP 429, O75). The master is stored under the descriptive name `ankle-ap-owner-attached.jpg` |
| Creator / author | Mikael Häggström (as shown on the file page in the owner's screenshots: "Own work", author Mikael Häggström). **Not verified through Commons API** |
| Original organization / source | Wikimedia Commons; 24 Oct 2017 (file page, via the owner) |
| Original source URL | **Not read** (O75) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner's screenshots of the file page show the CC0 1.0 Universal Public Domain Dedication, "can copy, modify, distribute and perform the work, even for commercial purposes"). Not confirmed through the Commons API (HTTP 429 on the request and its one retry) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/ankle/ankle-ap-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.5 session) |
| Date / method of verification | 2026-10-08. The owner attached the original and screenshots of the Commons file page; checksums computed locally. Commons API: HTTP 429 on the one request and the one retry (no workaround). Re-verification = O75 |
| Checksum | SHA-1 `798b5775be4e6683a82617423f531d94197ce23f`; SHA-256 `c386843f8d030d49c2d56f4f748dda97286293888bbff15a03fbc245e60a4fac` |
| File facts | `image/jpeg`, 728 × 1631 px, 324,767 bytes, JFIF only (no EXIF) |
| De-identification evidence | Full image reviewed at high contrast: no burned-in text, marker, ruler, device or identifier seen. A **bright ringing strip along the left edge** (≈ 8 columns in the lower half, 2 in the upper) and a **1-px bright last column at the right edge** (rows 759–1630) are edge artefacts, repaired in the web copy (O79). Description (file page): ankle of a 24-year-old male, frontal projection, continuing pain 3 weeks after a sprain, no injuries seen. |
| Notes | Distal tibia-fibula (≈ 13 cm above the joint at the assumed scale), both malleoli, talus and the upper calcaneus are inside; the proximal half of the metatarsals is **not** shown (O77). Side inferred LEFT (fibula on the viewer's right, O76). Same author as the wrist, hand, elbow, knee and foot images; not the person of any chest case (S12-4). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_normal_ankle_-_frontal.jpg` from a Commons search listing only; page not read; NOT verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-031 — RAD-LAB ankle-ap educational baseline: web copy (derived from A-030) (S14.5)

| Field | Value |
|---|---|
| Asset name | RAD-LAB ankle-ap educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-030. Derivation: RAD-LAB (`scripts/derive-ankle-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-030; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/ankle/ankle-ap-baseline.jpg` (the file the app loads; **created in Phase B**) |
| RAD-LAB modifications | **Edge artefact repaired** (the master's left 8 columns overwritten by the nearest clean column, the 1-px bright last column overwritten by its neighbour; outside every required region). No fill, no crop. 8-bit greyscale, JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-08. Reproducible: `python3 -I scripts/derive-ankle-baselines.py` (checks the master's SHA-1 first and refuses a master with ICC / XMP / comment data or any EXIF). Output re-read: no EXIF, JFIF only. |
| Checksum | SHA-1 `9ab6577e7801b86328e893009001df634b922d38`; SHA-256 `b8fb5b74e3b39ba1c49a4a10e6bd8d3f664443910850e81786bbd39a4b156806` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 728 × 1631 px, 233,291 bytes |
| Notes | Landmarks were read by eye (O80). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

### A-032 — Normal ankle, lateral, left ankle (inferred): unmodified master (S14.5)

| Field | Value |
|---|---|
| Asset name | Normal ankle, lateral, left ankle (inferred): unmodified master |
| Asset type | Radiograph (adult ankle, lateral), JPEG |
| Original filename | **Not read** (the Commons page title was not retrieved: the API answered HTTP 429, O75). The master is stored under the descriptive name `ankle-lateral-owner-attached.jpg` |
| Creator / author | Mikael Häggström (as shown on the file page in the owner's screenshots: "Own work", author Mikael Häggström). **Not verified through Commons API** |
| Original organization / source | Wikimedia Commons; 24 Oct 2017 (file page, via the owner) |
| Original source URL | **Not read** (O75) |
| License | **CC0 1.0 Universal — OWNER-VERIFIED** (the owner's screenshots of the file page show the CC0 1.0 Universal Public Domain Dedication, "can copy, modify, distribute and perform the work, even for commercial purposes"). Not confirmed through the Commons API (HTTP 429 on the request and its one retry) |
| License URL | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Modification / redistribution / commercial use | Permitted (CC0) if the owner's statement holds |
| Attribution legally required | No. A voluntary credit line is shown under the result image (EN + AR) |
| Local project path | `assets/source/ankle/ankle-lateral-owner-attached.jpg` (provenance master; **not** served) |
| RAD-LAB modifications | **None** to the master (byte-identical to the file attached to the S14.5 session) |
| Date / method of verification | 2026-10-08. The owner attached the original and screenshots of the Commons file page; checksums computed locally. Commons API: HTTP 429 on the one request and the one retry (no workaround). Re-verification = O75 |
| Checksum | SHA-1 `566abbd5601cdfd3ba5ce7816b8754a3fc3d268f`; SHA-256 `21fe7a5e39ad71e37593d4b9ef522d844748bfde1ee55128b3db05aaae5336e0` |
| File facts | `image/jpeg`, 932 × 1678 px, 394,422 bytes, JFIF only (no EXIF) |
| De-identification evidence | Full image reviewed at high contrast: no burned-in text, marker, ruler, device or identifier seen. A smooth bright gradient at the left edge (≈ 10 columns, soft tissue) without a step and a slightly brighter top row were checked and judged natural: **not repaired** (O79). Description (file page): same patient and date as A-030; lateral projection, "albeit somewhat suboptimal by not seeing straight through the ankle joint"; no injuries seen. |
| Notes | Distal tibia and fibula (the fibula overlapped by the tibia), talus, calcaneus and the heel soft tissue are inside; the navicular and cuboid are only partly at the left edge and the 5th metatarsal tuberosity is not shown (O77). The residual obliquity is a documented limit (O78). Same person as A-030 (per the file page). A teaching approximation, never ground truth. |
| Re-verification (RAD-018) | **RAD-018, 2026-10-15:** candidate source `File:X-ray_of_normal_ankle_-_lateral.jpg` from a Commons search listing only; page not read; NOT verified. **Owner decision 2026-10-15: the owner's screenshots of the Commons page are accepted as licence evidence (O100 closed).** |

### A-033 — RAD-LAB ankle-lateral educational baseline: web copy (derived from A-032) (S14.5)

| Field | Value |
|---|---|
| Asset name | RAD-LAB ankle-lateral educational baseline |
| Asset type | Radiograph, derived JPEG (8-bit greyscale) |
| Creator / author | As A-032. Derivation: RAD-LAB (`scripts/derive-ankle-baselines.py`). |
| License | CC0 1.0 Universal (inherited from A-032; owner-verified) |
| Modification / redistribution / commercial use | Permitted (CC0) |
| Attribution legally required | No. Voluntary credit line in `RadCase.radiograph.credit` (EN + AR). |
| Local project path | `public/images/ankle/ankle-lateral-baseline.jpg` (the file the app loads; **created in Phase B**) |
| RAD-LAB modifications | **None to the pixels** (the master's smooth left-edge gradient has no step, so no repair was made); re-encoded as 8-bit greyscale JPEG quality 88, no metadata. |
| Date / method of verification | 2026-10-08. Reproducible: `python3 -I scripts/derive-ankle-baselines.py`. Output re-read: no EXIF, JFIF only. |
| Checksum | SHA-1 `2e971eced516de4fa54d5994de129170be4fdc62`; SHA-256 `db5c67ba2320a59d7ed0a9c43ab4ed1314b6faf9a5e4cd68e35339c85a6e6946` (may vary with Pillow / libjpeg version) |
| File facts | `image/jpeg`, 932 × 1678 px, 286,952 bytes |
| Notes | Landmarks were read by eye (O80). The renderer's rotation effect is a runtime transformation of this file, not a new asset. |

## Pelvis AP review assets — 2026-10-15 (S-PELVIS-REF-2; not served)

### A-034 — Pelvis AP original, review candidate

| Field | Value |
|---|---|
| Type/name | External radiograph master; X-ray of the pelvis of an 18 year old male - case 1 - anteroposterior.jpg |
| Author / source / date | Staff at Department of Radiology, UC San Diego Health; bonepit.com; 14 March 2018, per Commons |
| Canonical source | https://commons.wikimedia.org/wiki/File:X-ray_of_the_pelvis_of_an_18_year_old_male_-_case_1_-_anteroposterior.jpg |
| Licence | Public domain, https://creativecommons.org/publicdomain/mark/1.0/ ; file page states US medical-imaging basis and VRT ticket 2018030210000886 |
| Commercial use / attribution | Compatible with declared public-domain status; no mandatory attribution stated; retain voluntary author/source credit if later used |
| Local path | `assets/source/pelvis/pelvis-ap-original.jpg` (not served) |
| Verification | 2026-10-15, canonical page read via web tool; original downloaded from linked upload.wikimedia.org URL; SHA-1 matched page: `0f895d77d5aef214ad0caaee13fbf0dafb11b5a0` |
| SHA-256 | `d8236c03447a1aba6535f925ec1f95704a07616cb777e8649f96d137a1d07342` |
| File facts | JPEG, 2675 × 2084 px, 493,556 bytes; no EXIF tags |
| Modifications | None; immutable source for A-035 |
| De-identification / limits | No patient name/date/ID visually seen; R, lettering and circular edge graphic present. Uploader describes normal male age 18; normality/coverage not independently clinically validated. O84 remains. |

### A-035 — Pelvis AP marker-free review derivative

| Field | Value |
|---|---|
| Type/source | Review derivative of A-034, same public-domain basis; **not yet a product baseline** |
| Local path | `assets/source/pelvis/pelvis-ap-marker-removed.png` (not served; no public copy) |
| Author / attribution | Original author as A-034; RAD-LAB background-only cleanup, owner request 2026-10-15 |
| Modifications | Deterministic per-column background interpolation using median rows immediately above/below the marker, feathered within x=[0,96), y=[850,1300). Removes R, lettering and circular graphic. No generative fill, crop, resize, anatomy repaint or contrast change. Script: `scripts/derive-pelvis-baseline.py` (Pillow/numpy). |
| Pixel verification | 27,522 pixels changed in the external-background rectangle; **0 changed outside**. Save/readback is exact; lossless RGB PNG, no EXIF. Full frame and edge comparison inspected visually. |
| SHA-256 | `5337360693c4939cee02f0225cd0e082fcf55dd7a5f09bd02658dcdc2297c7d9` |
| File facts | PNG, 2675 × 2084 px, 2,686,371 bytes |
| Licence / commercial use | Inherited public-domain source status; commercial-compatible under A-034 declaration; voluntary credit retained in documentation |
| Limits / next gate | Pixel cleanup is completed, not clinical validation. Educator/owner coverage/suitability review remains O84. No new exam or learner-visible radiograph registered. |

### Not external assets (for completeness)
- `docs/RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md` and the other medical references in `docs/` are project documents supplied by the project owner, not binary assets.
- No fonts, icons, audio or datasets were added in Session 4.
- Session 6 added no external assets (hosting configuration, a text banner and documents only). Candidate sources / datasets for other modalities are listed — **not downloaded, not registered** — in `docs/archive/analysis/MODALITY_SOURCES_CANDIDATES.md`.

---

## O10 commercial-licence audit (Session 12, step 1 — 2026-10-06)

Criteria: S10-3 (own work, public domain / CC0, CC BY or purchased licence; NC / ND excluded; SA only with owner approval; Radiopaedia not used).

### A. Registered assets (A-001 … A-005)

| Entry | Source / licence | Commercial-compatible | In repo | Result |
|---|---|---|---|---|
| A-001 master (PA chest, Häggström) | Wikimedia Commons, CC0 1.0, verified 2026-10-06 directly against Commons (see entry) | Yes | `assets/source/chest-pa/` (not served) | Pass. Nothing to revisit; no attribution legally required, voluntary credit kept. |
| A-002 derived (annotations neutralised) | CC0 (inherited) | Yes | `assets/source/chest-pa/` (not served) | Pass |
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
| Lateral positioning scene art | schematic, authored by RAD-LAB (no generated scene art, owner decision) | own work | Yes | Yes | See ART-RAD072-CHEST below (current drawing); historical needs audit retained. |

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

## A-036 — Pelvis AP product copy (S-PELVIS-1)

| Field | Value |
|---|---|
| Type / file | Educational result baseline; `public/images/pelvis/pelvis-ap-baseline.png` |
| Source / author / date | Exact copy of A-035, derived from A-034; UC San Diego Health radiology staff / bonepit.com; 14 March 2018 |
| Canonical source | https://commons.wikimedia.org/wiki/File:X-ray_of_the_pelvis_of_an_18_year_old_male_-_case_1_-_anteroposterior.jpg |
| Licence/commercial use | Public domain / Public Domain Mark 1.0, https://creativecommons.org/publicdomain/mark/1.0/ ; source page verified 2026-10-15 and original SHA-1 matched. Commercial-compatible; retain voluntary credit. |
| Modification | None after A-035: the source marker/graphics had already been removed from background only; no crop/resize or re-encoding. Runtime rotation is a labelled educational warp, never written back to this file. |
| Reproduce | `python scripts/derive-pelvis-baseline.py --output public/images/pelvis/pelvis-ap-baseline.png` |
| Facts | PNG RGB, 2675 × 2084, 2,686,371 B, no EXIF. SHA-256 `5337360693c4939cee02f0225cd0e082fcf55dd7a5f09bd02658dcdc2297c7d9` equals A-035. |
| De-identification / attribution | A-034/A-035 visual/EXIF review; no remaining burned-in text/marker seen. Voluntary bilingual credit under result image identifies source, cleanup and single-image approximation. |
| Limits | Owner selected the image and requested the existing exam approach. Clinical normality/coverage, assumed scale/landmarks and model remain provisional O5/O84/O85. No hidden anatomy is reconstructed. |

---

## A-037 — Shoulder AP oblique glenoid (Grashey) original (S-SHOULDER-3; not served)

| Field | Value |
|---|---|
| Type / file | External radiograph master; `assets/source/shoulder/shoulder-grashey-original.jpg` (not served) |
| Author / source / date | Mikael Häggström, own work; 27 August 2017 (creation); single version uploaded to Commons 21 December 2017 09:54 UTC |
| Canonical source | https://commons.wikimedia.org/wiki/File:Anteroposterior_glenoid_(Grashey_view)_X-ray_of_a_normal_shoulder.jpg |
| Licence | CC0 1.0 Universal Public Domain Dedication, https://creativecommons.org/publicdomain/zero/1.0/ ; Commons page carries the CC0 template and the category `CC-Zero`; owner screenshot agrees |
| Commercial use / attribution | Compatible; no attribution required; voluntary credit shown under the result image |
| Verification | 2026-10-15: file page read (HTTP 200) and official API `prop=imageinfo` read; the downloaded original's SHA-1 equals the API-declared SHA-1 (S-SHOULDER-2-1) |
| Checksums | SHA-1 `74f436796ab839c9edd89ebbebfd08598c5e8337`; SHA-256 `16927a1303eca61691e1048c3c2545bd4bd44df2060f11fd04b7315658d4c9d4` |
| File facts | JPEG (JFIF, 96 dpi), 1193 × 1800 px, 641,341 bytes; three equal colour channels; no EXIF |
| Modifications | None; immutable source of A-038 |
| De-identification / limits | No name, date, ID or marker found (visual review of the full frame and the four corners). Uploader describes a 31-year-old man, right shoulder, recurrent dislocation, no visible abnormality; the file name says "normal": it is NOT presented as a normal or asymptomatic shoulder. The frame is a rotated / cropped copy (right margin straight at about 11–13° from vertical) and ends in mid-humerus. Educator review of suitability: O91 / O5. |

## A-038 — Shoulder Grashey product copy (S-SHOULDER-3)

| Field | Value |
|---|---|
| Type / file | Educational result baseline; `public/images/shoulder/shoulder-grashey-baseline.png` |
| Source | Lossless greyscale copy of A-037 (same decoded pixels, 8-bit `L`, no EXIF); same author and licence |
| Reproduce | `python3 -I scripts/derive-shoulder-baseline.py` (checks the master's SHA-1 first; asserts equal channels and a pixel-exact read-back) |
| Facts | PNG greyscale, 1193 × 1800, 1,105,329 bytes; SHA-256 `b254bec66a36b304bd8a683c7e7480cf23db1008778efcb68b722730755d7bc2` |
| Modification | None to the pixels: no crop, resize, retouch or contrast change. Runtime joint-space closure is a labelled educational warp, never written back to this file. |
| Attribution | Voluntary bilingual credit under the result image names the author and licence, the clinical context of the source and the single-image approximation. |
| Limits | Scale (0.011 cm / px), region box and landmarks are read by eye (S-SHOULDER-3-4); clinical suitability pending O91 / O5. |

## RAD-045 — learner-facing credits (2026-10-16)

- `src/data/credits.ts` transcribes the existing registry and licence audit §2/§6. `/{locale}/credits` lists each used baseline once; the footer links it on normal pages and the bilingual static 404. Result captions remain unchanged: their full markup is protected by scene-dom hashes, and no hash/test exception was granted. No `RadCase`, case definition or fingerprint edit.
- The latest evidence takes precedence over historical entry wording: A-006 author Mikael Häggström is independently verified in the audit; A-001/A-006/A-014/A-020/A-024/A-034/A-037 have independent page/checksum evidence. A-010/A-012/A-016/A-018/A-022/A-026/A-028/A-030/A-032 retain accepted **owner-verified** evidence (O100 closed). Candidate source titles are linked with an explicit identity limitation, not promoted to independent byte verification.
- A-034/A-036 remain public domain by Commons declaration, **not CC0**. No asset, licence grant, checksum, image or derivation changed.
- A-008/A-009 remain owner-verified on the previous secondary-source basis; **official NIH terms and commercial compatibility are unestablished** (O101 deferred / RAD-038). The original provider acknowledgement, NIH download link and full Wang et al. CVPR 2017 citation appear on the new page and remain unchanged under the result.
- O102 wording is implemented on the credits page for review: named source, author, licence where established, modifications and evidence limits. The owner explicitly chose to finish the page and temporarily retain existing result captions after the guard conflict was explained. O102 remains partial until that later wording update. No new external verification or release clearance is claimed. Details: [session report](archive/sessions/session-rad-045-credits-2026-10-16.md).

## RAD-054 — Platform fonts and symbolic catalogue artwork (2026-10-16)

These are platform navigation assets, not diagnostic images or validated positioning illustrations. Existing radiograph masters, web copies and scene artwork remain unchanged.

- **FONT-RAD054-IBM:** IBM Plex Sans Arabic 1.1.0 from IBM's official npm package `@ibm/plex-sans-arabic`, tarball `https://registry.npmjs.org/@ibm/plex-sans-arabic/-/plex-sans-arabic-1.1.0.tgz`; repository https://github.com/IBM/plex. Original complete WOFF2 Regular/Medium/SemiBold/Bold copied byte-for-byte. Copyright © 2017 IBM Corp.; Reserved Font Name “Plex”. Package WOFF2 licence read on 2026-10-16: SIL OFL 1.1 permits bundling/embedding and commercial software distribution with the copyright and licence; fonts are not sold separately or renamed/modified. Notice shipped at `public/fonts/IBM-Plex-OFL.txt`.
- **FONT-RAD054-INTER:** Inter normal Latin variable WOFF2 from pinned Fontsource distribution `@fontsource-variable/inter` 5.3.0, tarball `https://registry.npmjs.org/@fontsource-variable/inter/-/inter-5.3.0.tgz`; upstream https://github.com/rsms/inter, distribution https://github.com/fontsource/font-files/tree/main/fonts/variable/inter. Package metadata and complete SIL OFL 1.1 read on 2026-10-16. Copyright 2016 The Inter Project Authors. Distributed subset copied unmodified, not subsetted or renamed by RAD-LAB. Commercial bundling/embedding permitted subject to OFL; notice shipped at `public/fonts/Inter-OFL.txt`.
- Both use local `/fonts/` URLs and `font-display: swap`, restricted to platform chrome/pages; no runtime font provider. Downloaded archives are not committed. No installed/recurring npm dependency or package-lock change.
- **ART-RAD054-CATALOGUE:** original SVG path artwork authored in `src/features/platform/ExamGraphic.tsx` for this session, using only basic shapes and original paths. No third-party image, tracing, scene paths or generated diagnostic radiograph. Revision S-UI-054-8: all 17 current exam/projection combinations have distinct original geometry: chest PA/AP/side, cropped wrist PA/side versus whole hand PA/extension-side, extended/bent elbow, shoulder Grashey, pelvis AP, knee/ankle front/side, and foot front/oblique (compressed/rotated symbolic perspective). Head/Spine symbols mark inactive categories only. Generic artwork remains the fallback for unmapped future parts. Decorative `aria-hidden` because the card gives its complete exam title in text; geometry remains the same in both locales. Colour derives from scoped UI tokens. Artwork is not medical validation of anatomy/projection or an engine input. The approved image-generation concept board guided composition only and is not shipped.

Shipped font/notice bytes (SHA-256); font binaries are unmodified. In the IBM notice only a trailing space was removed to satisfy repository whitespace checks; copyright and complete OFL text are preserved:

| File | Bytes | SHA-256 |
|---|---:|---|
| `public/fonts/IBM-Plex-OFL.txt` | 4359 | `db1e3a7a5b94313662e967f1db27ecbced0955a52427f8e63a27ebd4d36c11ad` |
| `public/fonts/IBMPlexSansArabic-Bold.woff2` | 73788 | `db6650a05969c144ab5ab9bb6c3beca6ca4dbb3537bb5f2311c878dd293875b4` |
| `public/fonts/IBMPlexSansArabic-Medium.woff2` | 75936 | `c72f6986f50ded745d06e71e508096209c52a55a6b3a81029954e33c52ba1dd2` |
| `public/fonts/IBMPlexSansArabic-Regular.woff2` | 71904 | `74112e1b7bf2e2c547989a4e947a60cba6cd1f9156e0065670134636e717199d` |
| `public/fonts/IBMPlexSansArabic-SemiBold.woff2` | 76408 | `869b2acd0a9660607a2025f0fe1c640110bf23d33417509328f07722922b8063` |
| `public/fonts/Inter-OFL.txt` | 4477 | `3b0a5fca3d17942cde889069889dedbbbd075e9b599968c82a95f4d944e9b345` |
| `public/fonts/inter-latin-wght-normal.woff2` | 48256 | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |

### RAD-054 — phone-feedback navigation symbols (2026-10-16)

`src/features/platform/ExamGraphic.tsx`: six replacement original schematic SVGs (knee AP/lateral, ankle AP/lateral, foot AP/oblique) and two new category symbols (full upper/lower limb), authored directly as vector paths for this repository. No external image, generated raster, tracing, copied scene or diagnostic radiograph. The owner's screenshots identify the old symbols to replace; they are not product assets. Existing font licences remain. These symbols aid navigation only; they do not validate anatomy or clinical positioning. Category mappings are in the version-1 presentation registry.


### ART-RAD072-CHEST — project scene SVG drawings (2026-10-23, F8)

| Field | Record |
|---|---|
| Authorship / licence basis | Original vector paths and basic SVG shapes authored directly for RAD-LAB; project own work, commercial-compatible. No copied or traced image, textbook figure, image-generation output or external asset. |
| Source files | `src/features/positioning/LateralFigure.tsx`, `src/features/positioning/PlanView.tsx`, `src/features/positioning/FrontalFigure.tsx`; binding in `src/features/positioning/detector-figures.tsx`. Existing scene palette and primitives reused. |
| Lateral detector | Profile facing anterior/viewer left, tapered lung apex, diaphragm as basal contour with deepest posterior recess, anterior/inferior cardiac silhouette, vertebral bodies with mild kyphosis, sternum and raised/anterior arms. Existing rib-separation effect retained. |
| Lateral top | Left side on detector, transverse axis perpendicular to detector, AP dimension parallel; tube on the patient's right (viewer left in the overhead layout), anterior toward the bottom of this view; arms above head or in front of chest. Rotation from the lateral baseline. |
| Shared frontal detector | AP supine and PA use the same original lung paths: apices, pointed lateral costophrenic angles, asymmetric domes, left cardiac notch, cardiac silhouette, central mediastinum and trachea. |
| Geometry / accessibility | Drawing fits the existing scored landmark boxes via `fitAnatomyBox`; no changed regions/targets/marker coordinates. Same SVG on desktop/phone and in both locales; EN/AR alt descriptions updated, existing captions remain accurate. |
| Limits / acceptance | Schematic scene, not a diagnostic image or a new radiograph. Existing reference assets and scoring untouched. [Owner decision](DECISIONS.md#rad072-chest-owner-2026-10-23); phone visual acceptance pending. [Part report](RAD-072_PART1_REPORT_2026-10-23.md). |
| Part 1b (2026-10-23) | Same own-work basis, redrawn with the shared `BODY` proportions and chest tonal tokens (`scene-style.ts`); now also covers `ApSupineView.tsx` (AP side view) and the PA cue side diagram in `PatientCues.tsx`. The top view draws the chosen side (L or R) against the detector. No external, traced or generated asset. [Owner decision 1b](DECISIONS.md#rad072-1b-owner-2026-10-23); [part 1b report](RAD-072_PART1B_REPORT_2026-10-23.md). |

### ART-RAD072-HAND-TRACE — traced hand outlines and review overlays (2026-10-23, RAD-072 2a Phase A)

| Field | Record |
|---|---|
| Type | (1) Drawing data `src/features/positioning/hand-outlines.json` (point lists, image px); (2) eight review PNGs in `docs/review/rad-072-hand/` (`pa-all`, `pa-soft-tissue`, `pa-digits-joints`, `pa-metacarpals-thumb`, `pa-wrist`, `lateral-all`, `lateral-digits-thumb`, `lateral-wrist`). Not served to learners; the PNGs are review material only. |
| Source / licence | Derived **only** from A-015 (from A-014) and A-017 (from A-016): CC0 1.0, owner-verified (licence basis unchanged, see those entries). Derivatives of CC0 works; released by RAD-LAB as **CC0 1.0** derivatives. Commercial-compatible if the owner's CC0 statement holds. No other image, textbook figure, web image, Bontrager figure or generated image used. |
| Modification | JSON: outlines traced semi-automatically (curated seeds + edge detection, simplified); no pixels copied. PNGs: the web copy, cropped and downscaled (Lanczos), with coloured traced lines, labels and a title bar drawn over it; the radiograph pixels are otherwise unchanged and carry no identifying text (A-015/A-017 text already removed). |
| Reproduce | `python3 -I scripts/trace-outlines/trace-hand-outlines.py --overlays` (Pillow 12.3.0, NumPy 2.5.3); `--check` proves the JSON byte-identical. Re-running reproduced all eight PNGs byte-identically on 2026-10-23 (may vary with other Pillow versions). |
| Limits | Illustrative, drawing-only; **not a measurement**, not a diagnostic image, no clinical validation. Carpus simplified to one outline; CMC lines approximate. [Owner decision](DECISIONS.md#rad072-2a-hand-owner-2026-10-23); [Phase A report](RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md). |
| Owner corrections (2026-10-23) | Same sources, licence and method; re-traced after the owner's Phase A review (thumb chains, tufts, mc2/mc3, carpus, ulnar styloid, lateral digit group; sesamoid-like densities kept but marked `drawn: false`). JSON and the six changed PNGs re-generated; both re-runs byte-identical. [Addendum](RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md#addendum-owner-corrections). |
| Soft-tissue fix (2026-10-23) | Soft-tissue outline re-traced so it stays outside every bone outline (10 px margin where the soft tissue is faint); `pa-all`, `pa-soft-tissue`, `lateral-all` re-generated, byte-identical on re-run. |
| Phase B use (2026-10-23) | The hand detector-view scene (`HandFigure.tsx` via `hand-outline-drawing.ts`) now draws these CC0-derived outlines, moved by the unchanged hand model; the side view (`HandSideView.tsx`) reads its hand / forearm heights from them. Project own work on a CC0 basis; no other image. Drawing only: result images, scores and regions unchanged. [Phase B report](RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md). |

### ART-RAD072-LIMB-TRACE-2B — traced wrist and foot outlines and review overlays (2026-10-23, RAD-072 2b Phase A)

| Field | Record |
|---|---|
| Type | (1) Drawing data `src/features/positioning/wrist-outlines.json` and `foot-outlines.json` (point lists, image px); (2) review PNGs in `docs/review/rad-072-wrist/` (`pa-all`, `pa-soft-tissue`, `pa-carpals`, `pa-forearm-metacarpals`, `lateral-all`, `lateral-carpals`, `lateral-forearm`) and `docs/review/rad-072-foot/` (`ap-all`, `ap-toes`, `ap-metatarsals`, `ap-tarsals`, `ap-soft-tissue`, `oblique-all`, `oblique-toes`, `oblique-metatarsals`, `oblique-tarsals`, `oblique-soft-tissue`, `ankle-lateral-orientation-check`). Not served to learners; review material only. |
| Source / licence | Wrist: **only** A-011 (from A-010) and A-013 (from A-012), CC0 1.0, Commons-API verified. Foot: **only** A-027 (from A-026) and A-029 (from A-028), CC0 1.0, owner-verified. `ankle-lateral-orientation-check.png`: A-033 (from A-032, CC0 1.0, owner-verified) with the existing scene outlines (`ankle-outlines.ts`, project own work) drawn over it. Derivatives of CC0 works; released by RAD-LAB as **CC0 1.0** derivatives. No other image, textbook figure, web image, Bontrager figure or generated image used. |
| Modification | JSON: outlines traced semi-automatically (polygons / axes read by eye from the same image, moved onto the steepest edge, simplified); no pixels copied. PNGs: the web copy, cropped and downscaled (Lanczos), with coloured traced lines, labels and a title bar drawn over it; the radiograph pixels are otherwise unchanged and carry no identifying text (side marks already removed in A-011, A-013, A-027, A-029, A-033). |
| Reproduce | `python3 -I scripts/trace-outlines/trace-wrist-outlines.py --overlays` and `trace-foot-outlines.py --overlays` (shared module `trace_lib.py`; Pillow 12.3.0, NumPy 2.5.3); `--check` / `--check-overlays` prove the JSON / PNGs byte-identical. The hand script re-generates its JSON and eight PNGs byte-identically after the module split. The ankle check image is produced by a one-off drawing of the outline data over A-033 (not a committed script) and is not covered by `--check-overlays`. |
| Limits | Illustrative, drawing-only; **not a measurement**, not a diagnostic image, no clinical validation. Overlapping bones are traced as one named outline (PA triquetrum + pisiform; lateral scaphoid + trapezium and the dorsal carpal mass; foot lateral cuneiform + cuboid, and the oblique lateral tarsal mass; talus + calcaneus). [Owner decision](DECISIONS.md#rad072-2b-owner-2026-10-23); [Phase A report](RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md). |
