# Session 11 — combined needs summary (Chest PA · Chest Lateral · Chest AP)

**Status:** input for the deferred generalisation (S7-4), produced in Session 10 (docs only). It combines §8 "Needs" and §9 of [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md) and [`RAD-LAB_Medical_Reference_Chest_AP.md`](RAD-LAB_Medical_Reference_Chest_AP.md) against Chest PA as implemented today. Rules (S10-2): generalise only against concrete needs from **merged** references, and apply the rule of three where possible; never against placeholders; Session 11 must keep Chest PA **byte-identical** (characterisation snapshot, goldens, matrix).

**Honest limit:** both new references are drafts with many "source needed" items (the authoritative criteria sources could not be read in Session 10). Session 11 must therefore generalise *mechanisms* — vocabularies declared as data, optional groups, a scene registry — not specific lateral / AP members. Specific members (e.g. which controls exist) are filled by Sessions 12–13 after the sources are read. Under S10-2, **Session 11 should not start until the references are merged to main and their §8 sections are complete**; "complete" here means every row marked, every "unknown" tied to a named missing source (they are), and the owner has accepted that unknowns remain unknowns.

## 1. Combined needs (PA vs Lateral vs AP)
Marks: **same** as PA · **differs** · **new** · **unknown** (source needed).

| Area | Chest PA (today) | Chest Lateral | Chest AP | Needed by |
|---|---|---|---|---|
| Control list | fixed `SimulationSettings` keys | same: SID, kVp, mAs, exposure mode, AEC, breathing, motion · differs: projection options, rotation meaning, centring, collimation · **new**: side against detector, arm position · **unknown**: chin | same controls · **new / unknown**: patient state (O9), grid in / out, tube angulation · differs: centring / collimation / shoulders | **Lateral and AP** (existence of new controls unknown for both) |
| Scoring categories | six fixed ids, 25/20/15/20/10/10 | own list / weights (unknown) | own list / weights (unknown) | **Lateral and AP** (and PA must keep its six) |
| Critical findings | wrong-projection, patient-motion, wrong-side-marker (viewer-half rule) | same, same, **differs / unknown** (O6) | same, same, **differs / unknown** (O8); AP-specific unknown | **Lateral and AP** (marker rule differs per projection) |
| Image variants / effects | 12 variants / 14 effects | same principles; **differs**: rotation, inspiration; **new**: arm / humeral overlap, hemithorax superimposition (unknown) | same principles; **differs / new**: projection-driven magnification; **new / unknown**: grid cut-off | **Lateral and AP** |
| Positioning scene | `chest-pa-frontal` (one hand-drawn SVG; `scene.id` resolved by nothing) | **new** lateral scene | **new** AP scene(s) (count: O9) | **both** (three scenes in total → a registry is justified) |
| Landmark groups | required `scapulae`, `jaw`, `midlineU`, `lungApexV`, `diaphragmDomeV`, `denseZones` | `midlineU`, `scapulae`, `jaw` do not fit; two hemidiaphragms; arm group new; `denseZones` differs | AP-erect frontal anatomy fits the PA groups; `scapulae` / `jaw` behaviour unknown | **Lateral** (needs optional groups); AP does not by itself |
| Case fields | one scalar attenuation; cooperation profile; baseline | **differs**: attenuation is projection-dependent (lateral path longer) | same / unknown; ill-patient cooperation = new case profiles, not fields | **Lateral** (attenuation); both (new baselines) |
| Marker convention | viewer-half rule | **open** (O6) | **open** (O8) | **both** (decision, not code) |
| Assets | A-001 / A-002 baseline | lateral baseline **open** | AP baseline(s) **open** | both |

## 2. S7-4 item → needed (by which exam, why) / deferred

| S7-4 item | Verdict | Needed by | Why / rule-of-three note |
|---|---|---|---|
| `SimulationSettings` / `ControlSpec[]` | **Needed** (limited to control *kinds* actually used: enum, numeric, point, size) | Lateral (side against detector, arm position; `rotationDeg` meaning), AP (patient state, grid, tube angulation — existence unknown) | Two exams beyond PA need controls with no PA key → three-exam rule of three is met for the *mechanism*. The specific new controls stay data and stay unknown until sourced. |
| `CATEGORIES` / `CategoryId` | **Needed** | Lateral, AP | Both declare their own categories / weights; the fixed union and per-id message keys block it. PA's six and weights must stay byte-identical. |
| `ImageVariantId` / `EffectId` (+ evidence tables) | **Needed** (limited) | Lateral (obliquity, arm overlap, superimposition), AP (projection-driven magnification; grid cut-off) | Both add effects PA does not have. Members unknown → generalise the *registry*, add members in Sessions 12–13. |
| `CriticalFindingId` + `isPresent` | **Needed** (limited) | Lateral and AP | The marker rule differs per projection (O6, O8); `wrong-projection` and `patient-motion` are shared. |
| Console JSX | **Needed**, minimal | Lateral (arm position, side), AP (conditional on O9 / grid) | PA-only JSX would force per-exam components, which rule 2 forbids; PA DOM / ARIA must stay identical. |
| Positioning scene art | **Scene registry: needed** · **fully generated (SceneSpec-driven) art: deferred** | Lateral, AP (three scenes in total: PA, Lateral, AP) | A registry resolving `ExamDefinition.scene.id` is justified at three scenes; generating SVG from data is not required for hand-drawn scenes. |
| `RadiographAssetSpec` landmark groups | **Needed** (make groups optional / per exam) | Lateral | Only Lateral proves the PA groups do not fit; AP-erect fits them. Single-exam need, but the PA-required shape cannot represent Lateral at all, so the optionality is justified. |
| Per-projection patient attenuation (case) | **Needed** (new item, not in S7-4) | Lateral | A patient attenuates more along the lateral path (observed 29.2 vs 23.5 cm in one study). One scalar per case no longer suffices; the mechanism (per-exam factor or per-projection value) is Session 11's design question, the magnitude is "source needed". Must keep PA values identical. |
| Move to `modalities/xray/*` | **Not needed → deferred** | none | No dependency from either exam; tied to the first non-X-ray engine (`PLATFORM_ARCHITECTURE.md` §2.4). |
| Migrating consumers off `RadCase` | **Not needed → deferred** | none | S7-2 strangler: both exams compose through `composeCase()`. |

## 3. Open items that gate Session 12 / 13 (not Session 11)
- **Provisional marker defaults (S10-5):** Lateral option E and AP option D — unscored and ungated — until a full-text source and a final owner decision (before Session 12 / 13). PA unchanged.
- **Owner decisions:** O6 lateral marker convention · O7 lateral side(s) · O8 AP marker / display convention · O9 AP variants (exam vs control vs case; the spec §6 portable / ICU decision is not in `DECISIONS.md`).
- **Sources to read before implementing** (each is also in the references' §1.2): EC EUR 16260; IAEA publications; ACR chest / digital-radiography / portable parameters; WHO chest manual PDF; StatPearls positioning; AIR / RCR criteria; Fitzgerald & Lockwood 2025 full text (AP SID).
- **Assets:** a lateral baseline and AP baseline(s), openly licensed and registered; none fetched or added.
