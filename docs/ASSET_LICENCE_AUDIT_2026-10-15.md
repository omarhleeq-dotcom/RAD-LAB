# Asset licence audit (RAD-018, O10 follow-up) — 2026-10-15

Docs-only session. Policy: S10-3 (own work, public domain / CC0, CC BY, purchased licence; NC / ND excluded; SA only with explicit approval). **"Verified now" means: read from the official source in this session.** Nothing here is legal advice.

## 1. Method and limits

- **Local integrity:** every registered file was hashed (SHA-1 or SHA-256, whichever the registry records) and compared with the registry; every file under `public/images/` (18) is registered.
- **Source check:** Commons file pages (normal HTML, descriptive User-Agent, paced requests) for licence template, author, date and the `CC-Zero` category; the original file was downloaded from Commons and its SHA-1 compared with the registered one (byte identity with the source).
- **Stops (S-STD-1 rule "one retry then stop"):** the Commons **API** answered HTTP 429 (one retry, then stopped; same as the earlier sessions). Several **downloads** answered 429 / 403 after the first successful ones; I stopped there instead of continuing. Those assets are marked "bytes not re-verified". No mirrors, no bypass.
- **Not done:** the Commons file titles for the ankle pair were taken from a Commons search listing only and their pages were not read; NIH terms could not be read (the NIH download page is a JavaScript app, 119 characters of text).

## 2. Result per source image

| Asset | Used by | Licence on source (read now) | Source identified | Bytes vs source | Status |
|---|---|---|---|---|---|
| A-001 | Chest PA | CC0 1.0 (template + `CC-Zero`), Mikael Häggström, 28 Jun 2017 | `File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg` | **SHA-1 equal** | **Verified now** |
| A-006 | Chest Lateral | CC0 1.0, Mikael Häggström, 28 Jun 2017 | `File:Normal_lateral_chest_radiograph_(X-ray).jpg` | **SHA-1 equal** | **Verified now** (closes the S12 "re-verify on Commons" note) |
| A-014 | Hand PA | CC0 1.0, Mikael Häggström, 29 Oct 2017 | `File:X-ray_of_normal_hand_by_dorsoplantar_projection.jpg` | **SHA-1 equal** | **Verified now** |
| A-020 | Elbow lateral | CC0 1.0, Mikael Häggström, 29 Oct 2017 | `File:X-ray_of_normal_elbow_by_lateral_projection.jpg` (was "unknown") | **SHA-1 equal** | **Verified now**; source identified (closes the O47 title gap for this file) |
| A-024 | Knee lateral | CC0 1.0, Mikael Häggström, 5 Jan 2018 | `File:X-ray_of_a_normal_knee_by_lateral_projection.jpg` | **SHA-1 equal** | **Verified now**; source identified (O56 for this file) |
| A-010 | Wrist PA | CC0 1.0, Häggström, 29 Oct 2017 | `File:X-ray_of_normal_wrist_by_dorsoplantar_projection_(crop).jpg` | not re-downloaded (429) | Page verified now; bytes pending |
| A-012 | Wrist lateral | CC0 1.0, Häggström, 29 Oct 2017 | `File:X-ray_of_normal_wrist_by_lateral_projection.jpg` | not re-downloaded (429) | Page verified now; bytes pending |
| A-016 | Hand lateral | CC0 1.0, Häggström, 29 Oct 2017 | `File:X-ray_of_normal_hand_by_lateral_projection.jpg` | not re-downloaded (429) | Page verified now; bytes pending |
| A-018 | Elbow AP | CC0 1.0 page, Häggström, 29 Oct 2017 (date equals the registry) | candidate `File:X-ray_of_normal_elbow_by_anteroposterior_projection.jpg` | not re-downloaded (429) | **Candidate only**; identity not proven |
| A-022 | Knee AP | CC0 1.0 page, Häggström, 5 Jan 2018 (date equals the registry) | candidate `File:X-ray_of_a_normal_knee_by_anteroposterior_projection.jpg` | not re-downloaded (429) | **Candidate only** |
| A-026 | Foot AP | CC0 1.0 page, Häggström, 28 Jul 2017 (date equals the registry) | candidate `File:X-ray_of_normal_right_foot_by_dorsoplantar_projection.jpg` | download 403 | **Candidate only** |
| A-028 | Foot oblique | page request 403 | candidate `File:X-ray_of_normal_right_foot_by_oblique_projection.jpg` (search listing) | not checked | **Unverified** (owner-verified only) |
| A-030 | Ankle AP | not read | candidate `File:X-ray_of_normal_ankle_-_frontal.jpg` (search listing) | not checked | **Unverified** (owner-verified only; registry date 24 Oct 2017) |
| A-032 | Ankle lateral | not read | candidate `File:X-ray_of_normal_ankle_-_lateral.jpg` (search listing) | not checked | **Unverified** (owner-verified only) |
| A-034 | Pelvis AP | Public domain (declared by Commons: US medical-imaging basis, VRT ticket 2018030210000886); verified earlier today | `File:X-ray_of_the_pelvis_of_an_18_year_old_male_-_case_1_-_anteroposterior.jpg` | SHA-1 matched on 2026-10-15 (earlier this day) | Verified earlier today; **note:** public-domain by declaration, not a CC0 dedication |
| A-037 | Shoulder Grashey | CC0 1.0, Häggström; API read on 2026-10-15 | `File:Anteroposterior_glenoid_(Grashey_view)_X-ray_of_a_normal_shoulder.jpg` | SHA-1 matched on 2026-10-15 | Verified earlier today |
| **A-008** | **Chest AP** | **NIH terms NOT read** (download page is a JavaScript app; terms recorded earlier only from a secondary source) | NIH ChestX-ray14 `00023616_000` | SHA-256 matches the registry (local) | **UNRESOLVED — release blocker (O16)** |

Derived / served copies (A-002, 003, 007, 009, 011, 013, 015, 017, 019, 021, 023, 025, 027, 029, 031, 033, 036, 038): all present, all checksums equal the registry, each inherits its master's status above. A-004 / A-005 are documentation images derived from A-003.

**Commercial-use reading (S10-3):** every verified or candidate source above is CC0 or declared public domain (compatible). Nothing found is NC / ND / SA. The only asset whose commercial status is **not established** is A-008 (NIH).

## 3. Credit lines shown under result images

- All 17 served baselines have an EN + AR credit line; none uses internal codes.
- Chest Lateral credit (A-006) names CC0 but not the author (CC0 needs no attribution; voluntary credit is advisable now that the author is verified).
- The knee / foot / ankle (and other owner-verified) credits say "licence confirmed by the project owner". That wording is not a source statement: **after the pending checks it should name the Commons file and CC0 instead** (credits-page session).
- Chest AP credit (A-008): wording depends on the NIH terms (O16).

## 4. Findings for the owner (details: DECISIONS O100–O102)

1. **O101 (release blocker): A-008 / NIH terms.** Needs a person to read the terms at NIH (the page needs a browser) or the image to be replaced. Chest AP stays "provisional" until then.
2. **O100:** bytes of 9 masters not re-verified (429 / 403), of which 6 only by candidate title. A later run with a pause (or a browser session) closes it; the owner may also paste the Commons page URLs for ankle and foot oblique.
3. **O102:** credit wording (section 3).

## 5. Proposed spec for the bilingual sources and credits page (docs only, not built)

Content from the registry only; one row per exam baseline: image thumbnail is NOT repeated; text = exam name, source title + link, author, licence name + link, date, "modified: crop / web copy / marker removal" in plain words, and a line "educational appearance reference, not a diagnostic image". Section "Textbook and guideline sources" from `docs/sources/REGISTER.md` (title, edition, page cited, nothing quoted). Section "Not external": own drawings. Both languages, logical CSS, no internal ids (S-VIS-1-2), reachable from the footer on every page, static (no runtime third-party requests). Implementation is a separate code session after O100–O102.

## 6. Owner decisions (2026-10-15, after this audit)

- **O100 closed:** the owner's screenshots of the Commons file pages (taken from the site) are accepted as licence evidence for A-010, A-012, A-016, A-018, A-022, A-026, A-028, A-030, A-032. The "owner-verified" label stays on them; nothing more is asked of the web.
- **O101 deferred:** A-008 (Chest AP, NIH) stays "owner-verified" for now and is revisited later. Claude Code has **not** read the NIH terms and no screenshot of them exists, so the commercial-use status is still not established by evidence; it remains a pre-release item (RAD-038).
- **O102** (credit wording) unchanged: handled in the credits-page session.
