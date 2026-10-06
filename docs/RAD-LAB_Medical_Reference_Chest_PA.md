# RAD-LAB Medical Reference Baseline — Adult Chest PA Erect
## Purpose
This document is a medical-reference baseline for RAD-LAB development. It separates well-supported positioning/image-quality criteria from provisional technique values.

**Scope:** Adult PA erect chest radiography only.  
**Use:** Educational simulation design, scoring logic, UI cues, and future validation.  
**Important:** This is not a substitute for local departmental protocols, equipment-specific technique charts, or educator/radiologist review.

---

## 1. Source hierarchy used

### Primary / high-authority sources
1. **International Atomic Energy Agency (IAEA)** — *IAEA-TECDOC-1423: Optimization of the radiological protection of patients undergoing radiography, fluoroscopy and computed tomography*.
2. **NCBI Bookshelf / StatPearls** — *X-ray Radiographic Patient Positioning*.
3. **NCBI Bookshelf** — *A Systematic Approach to Chest Radiographic Analysis*.
4. **PubMed / Journal of Medical Imaging and Radiation Sciences** — recent evidence on source-to-image distance for adult chest radiography.
5. **PubMed** — peer-reviewed evidence on the limitations of estimating chest rotation from clavicular asymmetry alone.

### Supporting source
- **WHO** chest radiography manual.

---

## 2. Well-supported positioning requirements for Adult PA Chest

### Patient orientation
- Patient erect.
- Anterior chest against the image receptor.
- PA projection is preferred for routine erect chest imaging because it reduces cardiac magnification compared with AP projection.

### Head and shoulders
- Chin slightly elevated / extended so it does not project over the upper chest.
- Shoulders rolled forward.
- Scapulae should be moved laterally so their medial borders are outside the lung fields.

### Rotation
- No clinically meaningful thoracic rotation.
- The thorax should appear symmetric.
- A classic image-quality sign is the relationship between the spinous processes and the medial clavicular ends.
- **Important limitation:** clavicular asymmetry is influenced by body morphology, so the simulator should not pretend that a single pixel-distance threshold perfectly measures degrees of patient rotation.

### Centering
- Patient midsagittal plane aligned with the receptor midline.
- Central ray centered to the mid-lung / mid-thoracic region.
- T7 is widely used as a teaching landmark for PA chest centering.
- The simulator should model centering educationally rather than claiming millimetric clinical accuracy.

### SID / source-to-image distance
- **180 cm (72 in)** is a well-established standard teaching/reference value for adult chest radiography.
- A 2025 peer-reviewed study found that reducing SID from 180 cm increased entrance skin dose and that 100 cm reduced image quality in the studied AP semi-erect setup.
- For the RAD-LAB Adult PA case, 180 cm can be used as the target reference value while keeping support for local protocol variation later.

### Respiration
- Exposure at full inspiration with suspended respiration.
- Adequate inspiration can be assessed using visible rib count criteria such as approximately 6 anterior ribs or 10 posterior ribs above the diaphragm.

### Coverage / collimation outcome
The final image should demonstrate:
- Lung apices.
- Both lungs.
- Costophrenic angles.
- Whole rib cage above the diaphragm.
- Avoid unnecessarily large exposed field outside the clinically required anatomy.

### Image-quality expectations
A technically adequate PA chest should support:
- Symmetric thorax.
- Scapulae largely outside lung fields.
- Sharp pulmonary vascular markings.
- Sharp heart/aortic and diaphragmatic borders.
- Visualization of the retrocardiac lung and mediastinum.
- Appropriate penetration sufficient to visualize the thoracic spine through the cardiac shadow without sacrificing lung detail.

---

## 3. What RAD-LAB should score in the positioning workspace

### A. Projection correctness
Target for this case:
- PA

### B. Rotation
Educational target:
- Neutral / no meaningful rotation.

Suggested simulator behavior:
- Use a visual rotation state and tolerance band.
- Do not claim exact clinical rotation in degrees from simulated clavicle spacing alone.

### C. Centering
Target:
- Midline and mid-thoracic / T7-region alignment.

Suggested simulator behavior:
- User drags the central-ray target on the detector.
- Convert detector coordinates to normalized offsets.
- Score horizontal and vertical deviation using configurable tolerances.

### D. Collimation
Target:
- Include all required anatomy while avoiding unnecessarily wide field size.

Suggested simulator behavior:
- Adjustable rectangular field.
- Penalize clipping of required anatomy.
- Penalize excessive field size separately or within the positioning category.

### E. Patient-position cue
Target:
- Erect PA orientation.
- Anterior chest toward receptor.
- Chin elevated.
- Shoulders rotated forward.

### F. Side marker
- Provide L/R marker placement as an educational interaction.
- Marker should not obscure clinically important anatomy.
- Keep marker behavior separate from scoring until a validated scoring rule is defined.

---

## 4. Technique values: validated vs provisional

### SID
**Target reference:** 180 cm.

### kVp
High-kVp chest techniques are widely used, and the IAEA gives 125 kV as an example of good technique in older film-screen guidance.

However:
- detector technology has changed,
- AEC configuration varies,
- patient habitus varies,
- equipment/vendor technique charts vary,
- local protocols vary.

Therefore RAD-LAB should **not** yet treat one exact kVp value as universally correct.

### mAs
Do not hard-code a single universal mAs value as clinically correct.

mAs can vary substantially with:
- detector/system,
- AEC,
- patient size,
- filtration,
- grid,
- generator,
- local protocol.

For now:
- keep mAs values configurable,
- label them educational/provisional,
- avoid awarding a "perfect" score based solely on one exact mAs number.

### Exposure Index (future)
If RAD-LAB later models Exposure Index / Deviation Index:
- implement it as an explicitly educational model first,
- map it to vendor/IEC concepts only after source validation,
- do not imply that one EI target is universal across systems.

---

## 5. Recommended Session 2 medical rules

For **Interactive Positioning Workspace**, Session 2 should focus on:

1. PA orientation.
2. Erect patient.
3. No meaningful rotation.
4. Midline alignment.
5. Central-ray target at mid-thoracic / T7 region.
6. 180 cm SID reference.
7. Adequate collimation covering apices and costophrenic angles.
8. Chin clear of lung apices.
9. Shoulders rolled forward to move scapulae outside lung fields.
10. Full-inspiration / suspended-respiration instruction.

Do not add new medical technique claims beyond these without explicit source review.

---

## 6. Important modeling caveats

### Rotation
A peer-reviewed study showed that radiographic appearance of rotation depends on thoracic morphology. RAD-LAB may teach clavicular symmetry, but it should not claim that a fixed clavicle-to-spinous-process distance equals a specific rotation angle in all patients.

### Technique
IAEA's classic example is useful as a reference, but parts of the technique section are based on film-screen systems. For a modern digital simulator:
- use the image-quality criteria confidently,
- use 180 cm SID as a strong reference,
- keep kVp/mAs/AEC details configurable until modern digital-specific references and local protocols are selected.

### Image rejection
A radiograph that does not satisfy every textbook criterion is not automatically clinically unusable. RAD-LAB scoring should therefore be educational, not presented as a real-world automatic reject decision.

---

## 7. Sources

### International Atomic Energy Agency
**IAEA-TECDOC-1423 — Optimization of the radiological protection of patients undergoing radiography, fluoroscopy and computed tomography.**
Relevant material:
- Chest PA image-quality criteria.
- Full-inspiration criteria.
- Symmetry and scapular positioning criteria.
- Example FFD/SID of 180 cm.
- Example high-kVp chest technique.
- Radiation-protection optimization principles.

### StatPearls / NCBI Bookshelf
**Tafti A, Byerly DW. X-ray Radiographic Patient Positioning.**
Relevant material:
- Erect chest positioning.
- Chin position.
- Hands/shoulder positioning.
- Central-ray alignment with lung fields.
- Need to avoid thoracic rotation.
- Rationale for PA projection.

### NCBI Bookshelf
**A Systematic Approach to Chest Radiographic Analysis.**
Relevant material:
- Technical adequacy.
- Rotation assessment.
- Inspiration criteria.
- Scapular positioning.
- Penetration/image-quality assessment.

### PubMed
**Fitzgerald A, Lockwood P. The effect to dose and diagnostic quality of limiting source-to-image distance on anterior-posterior semi-erect adult chest X-rays. J Med Imaging Radiat Sci. 2025.**
Relevant material:
- 180 cm reference SID.
- Dose/image-quality consequences of shorter SID in the studied setup.

### PubMed
**Assessing Sagittal Rotation on Posteroanterior Chest Radiographs: The Effect of Body Morphology on Radiographic Appearances.**
Relevant material:
- Limitations of using clavicle/spinous-process appearance as an exact measure of patient rotation.

### World Health Organization
**The WHO manual of diagnostic imaging: radiographic anatomy and interpretation of the chest and the pulmonary system.**
Relevant material:
- Chest radiography interpretation and technical-quality context.

---

## 8. Development rule for Claude

When implementing medical behavior in RAD-LAB:

- Do not invent technique values.
- Prefer IAEA, WHO, peer-reviewed literature, NCBI/StatPearls, professional radiography guidance, and validated institutional protocols.
- Record the source for every medical rule introduced.
- Separate:
  - validated medical rule,
  - educational simplification,
  - provisional/demo value.
- If sources disagree, do not silently choose one. Document the disagreement and keep the rule configurable.
