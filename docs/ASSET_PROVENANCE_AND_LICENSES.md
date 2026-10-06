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
