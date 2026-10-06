# RAD-LAB --- Medical Reference: Adult PA Chest Technique (Digital Radiography)

**Purpose:** Evidence pack for RAD-LAB Session 3\
**Scope:** Adult, erect PA chest radiography using general digital
radiography (DR).\
**Use:** Educational simulation only. This document deliberately
separates established physics/guidance from local-protocol,
vendor-dependent, and provisional simulator choices.

## 1. Evidence hierarchy used

Only institutional, standards-body, or professional-scientific sources
were used for the core rules:

1.  **IAEA** --- International Atomic Energy Agency
2.  **ICRP** --- International Commission on Radiological Protection
3.  **AAPM** --- American Association of Physicists in Medicine
4.  **ACR** --- American College of Radiology
5.  **IEC** --- International Electrotechnical Commission
6.  **WHO / IAEA** --- joint technical guidance
7.  **FDA** --- U.S. Food and Drug Administration

No blogs, commercial technique charts, forums, or unsourced teaching
websites are used as medical authority.

------------------------------------------------------------------------

## 2. Classification system for RAD-LAB

Every technique rule implemented by the simulator should carry one of
these labels:

-   **VALIDATED:** supported directly by authoritative
    scientific/professional guidance or fundamental radiographic
    physics.
-   **COMMON REFERENCE / NOT UNIVERSAL:** supported as a recognized
    reference technique, but not a universal prescription for every
    modern DR system.
-   **VENDOR / LOCAL-PROTOCOL DEPENDENT:** depends on detector,
    generator, image processing, AEC design, patient habitus, department
    protocol, or local optimization.
-   **EDUCATIONAL SIMPLIFICATION:** intentionally simplified behavior
    used to teach a relationship.
-   **PROVISIONAL:** a numerical threshold or scoring band not
    sufficiently supported for universal clinical use.

RAD-LAB must never silently convert the last three categories into
"validated clinical truth."

------------------------------------------------------------------------

## 3. Adult PA chest geometry and technique anchors

### 3.1 Source-to-image distance (SID / FFD)

An IAEA reference technique for chest radiography gives an FFD/SID of
**180 cm**, with a broader reference range of **140--200 cm** in the
cited quality-criteria document.

**RAD-LAB decision:**\
- **180 cm:** COMMON REFERENCE / strong educational target. - Do not
claim that 180 cm is the only clinically valid SID worldwide. - Any
score bands around 180 cm remain **PROVISIONAL / EDUCATIONAL** unless a
specific protocol is adopted.

### 3.2 Tube potential (kVp)

The same IAEA quality-criteria reference gives **100--150 kV** as an
example technique range for chest radiography.

This supports teaching adult PA chest as a relatively high-kVp
examination, but it does **not** justify choosing one exact "correct"
kVp for all adults, detectors, grids, patient sizes, and local
protocols.

**RAD-LAB decision:**\
- A broad selectable range may include the IAEA reference range. - Do
**not** encode a single universal optimum such as 120 or 125 kVp as
validated truth without a chosen protocol. - Any narrower "recommended"
target for a simulated average adult must be labelled **PROVISIONAL /
LOCAL-PROTOCOL DEPENDENT**.

### 3.3 mAs

The reviewed authoritative sources do not provide a single universal
adult PA chest mAs that is appropriate across modern DR equipment and
patients.

mAs requirements depend on system output, patient attenuation,
detector/receptor, grid, SID, AEC use, and local optimization.

**RAD-LAB decision:**\
- Do not call one exact mAs "the correct adult PA chest mAs." - If
Session 3 needs an average-adult manual-technique target, store it as a
configurable **PROVISIONAL educational protocol**, not a medical
constant. - Architecture should allow future protocol profiles rather
than hard-coding one number.

------------------------------------------------------------------------

## 4. Automatic Exposure Control (AEC)

IAEA quality-control guidance describes the purpose of AEC as producing
**consistent, reproducible exposures** over a range of tube potentials
and compensating for differences in anatomical thickness.

An older IAEA chest reference includes AEC as part of an example chest
technique. However, chamber configuration and selection should not be
generalized to every modern DR system.

**RAD-LAB decision:** - Teaching the **purpose of AEC** is VALIDATED. -
AEC chamber shape, number, position, selection logic, termination
behavior, and exact target are **VENDOR / LOCAL-PROTOCOL DEPENDENT**. -
The simulator may show a **vendor-neutral educational chamber diagram**,
but it must be labelled as such. - Do not state that one chamber
combination is universally correct across all systems unless RAD-LAB
later adopts a named, educator-reviewed protocol.

### AEC and positioning

For educational modelling, it is reasonable to teach that anatomy/field
placement over the active sensing region matters to an AEC exposure.
However, exact consequences depend on equipment and configuration.

Therefore, Session 3 should model AEC errors
qualitatively/deterministically for learning, while classifying the
precise thresholds and chamber geometry as **EDUCATIONAL / VENDOR
DEPENDENT**.

------------------------------------------------------------------------

## 5. Digital radiography: brightness is NOT a reliable exposure meter

This is one of the most important rules for Session 3.

AAPM TG-116 states that digital systems can produce acceptable-looking
images across a much wider exposure range than film-screen systems. In
digital imaging, displayed brightness and contrast can be strongly
controlled by image processing. Therefore overexposure or underexposure
may not be obvious simply from displayed brightness.

IAEA quality-control guidance similarly notes that digital systems have
a wide response range and may provide visually acceptable images despite
under- or overexposure.

**RAD-LAB must therefore NOT teach:** - "dark image = too much
exposure" - "light image = too little exposure"

as a general rule for modern DR.

**Instead teach:** - detector exposure / exposure indicator, - image
noise and adequacy, - exposure relative to a target, - dose-awareness
and optimization, - post-processing/display brightness as a separate
concept.

This distinction should be **VALIDATED** in the simulator.

------------------------------------------------------------------------

## 6. Exposure Index (EI), Target Exposure Index (EIT), and Deviation Index (DI)

IEC 62494-1 defines standardized exposure-index concepts for general
digital radiography. AAPM TG-116 and TG-232 provide clinical
implementation guidance.

### 6.1 Exposure Index

EI is an indicator associated with radiation exposure to the digital
image receptor under the defined system/calibration framework. It should
not be presented to students as a direct patient-dose number.

**RAD-LAB rule:**\
EI ≠ patient effective dose, and EI should not be described as such.

### 6.2 Target Exposure Index (EIT)

AAPM material emphasizes that target exposure is
**body-part/view/procedure/site specific** and can be manufacturer/site
specified.

**RAD-LAB decision:**\
Do not invent a universal Chest PA EIT.

If RAD-LAB later displays a numerical EIT, it must come from: - a
documented local/educator protocol, or - a clearly labelled simulator
protocol.

### 6.3 Deviation Index

AAPM/IEC use:

**DI = 10 × log10(EI / EIT)**

Therefore: - **DI = 0** means EI equals the target EIT. - Positive DI
means detector exposure is above target. - Negative DI means detector
exposure is below target. - Approximately **+3** corresponds to twice
the target exposure. - Approximately **−3** corresponds to half the
target exposure.

These mathematical relationships are suitable for the simulation when
EI/EIT are being modelled.

### 6.4 Do not turn DI into a universal pass/fail rule

AAPM TG-232 found substantial real-world variation and recommended that
target/action levels be reviewed from actual site data as part of
continuous quality improvement. Earlier fixed limits should not be
treated as universally correct for every clinical environment.

**RAD-LAB decision:**\
- The DI equation is **VALIDATED**. - A universal pass/fail DI band is
**NOT validated**. - Any scoring band used by RAD-LAB must be labelled
**EDUCATIONAL / PROVISIONAL** until an educator-reviewed protocol is
selected.

------------------------------------------------------------------------

## 7. "Dose creep" and optimization

AAPM warns that the broad dynamic range and post-processing capability
of digital radiography can make excessive detector exposure less
visually obvious, allowing exposure levels to drift upward over time
("dose creep").

ICRP Publication 160 emphasizes optimization in digital radiography:
radiation levels should remain commensurate with the diagnostic benefit.

ICRP Publication 135 explains that Diagnostic Reference Levels (DRLs)
are optimization tools for groups of examinations/patients and **are not
dose limits for individual patients**.

**RAD-LAB teaching rule:** A technically acceptable-looking DR image is
not a reason to use more radiation than necessary. The goal is adequate
diagnostic image quality with optimized exposure.

The simulator should reward appropriate technique and dose awareness,
not simply "more exposure."

------------------------------------------------------------------------

## 8. kVp and mAs --- what the simulator may safely teach

### kVp

RAD-LAB may teach the general physical relationship that changing tube
potential changes the X-ray beam spectrum/penetrating ability and
output. In a real clinical system, the resulting receptor exposure,
contrast appearance, image processing, and patient dose depend on the
full imaging chain.

Therefore Session 3 should avoid an oversimplified equation such as:

> "higher kVp = darker digital image."

That is inappropriate for a processed DR display.

### mAs

RAD-LAB may teach that mAs controls X-ray quantity/output under
otherwise comparable conditions. More mAs generally means more photons
produced; lower mAs means fewer.

For the simulated result: - too little detector exposure can be
associated with increased quantum noise / inadequate signal, -
unnecessary excess exposure should trigger dose-awareness feedback.

Exact clinical thresholds remain protocol/system dependent.

------------------------------------------------------------------------

## 9. SID and exposure --- physics versus clinical scoring

The simulation already uses SID in positioning. Session 3 should use
that same state rather than create a second SID.

The intensity of an X-ray beam changes with distance according to
inverse-square behavior under the relevant geometric assumptions. This
relationship can be used as the physics basis of the educational model.

However:

-   the simulator should document its assumptions,
-   it should not imply that a simple inverse-square calculation
    captures the entire clinical imaging chain,
-   AEC may compensate for changes differently depending on system
    behavior,
-   any resulting "acceptable technique" thresholds remain protocol
    dependent.

**Recommended implementation classification:**\
- distance-intensity relationship: **VALIDATED PHYSICS**; - simplified
deterministic SID → detector-exposure calculation: **EDUCATIONAL
MODEL**; - score thresholds: **PROVISIONAL**.

------------------------------------------------------------------------

## 10. Patient size / habitus

IAEA describes AEC as compensating for differences in anatomical
thickness. FDA's NEXT program also uses patient-equivalent attenuation
phantoms because clinical exposure behavior varies with attenuation and
technique.

Therefore a future RAD-LAB case system should not assume one technique
is ideal for every adult.

**Architecture recommendation for Session 3:**\
Prepare technique logic for case inputs such as: - simulated attenuation
/ patient habitus, - manual vs AEC, - SID, - kVp, - mAs, - selected AEC
sensing region, - positioning/collimation state.

Do not need to build multiple patient cases in Session 3, but do not
hard-code the engine so they become impossible later.

------------------------------------------------------------------------

## 11. Exposure time

Older IAEA chest quality criteria include short exposure time in the
example technique (the cited document lists **\<40 ms** for the example
chest technique). Short exposure is educationally relevant in chest
radiography because motion can degrade sharpness.

However, exact exposure-time limits and generator combinations should
not be treated as universal modern DR prescriptions.

**RAD-LAB decision:**\
If exposure time is not an explicit Session 3 control, preserve it as a
future extension. If shown, classify exact limits as **COMMON REFERENCE
/ PROTOCOL DEPENDENT**, not a universal pass/fail threshold.

------------------------------------------------------------------------

## 12. Grid and equipment dependencies

The IAEA example chest technique assumes a grid and specific historical
equipment characteristics. Modern systems and departmental protocols
vary.

Therefore: - do not derive a universal mAs from the IAEA example, - do
not assume identical technique requirements with/without a grid, -
future RAD-LAB protocol profiles should be able to specify
detector/grid/system assumptions.

------------------------------------------------------------------------

## 13. Recommended Session 3 medical-rule table

  ------------------------------------------------------------------------------
  Rule                      Classification for      Implementation guidance
                            RAD-LAB                 
  ------------------------- ----------------------- ----------------------------
  Adult PA chest uses       COMMON REFERENCE        IAEA example range 100--150
  relatively high kVp                               kV; do not make one exact
                                                    value universal

  180 cm SID                COMMON REFERENCE        Strong educational target;
                                                    score bands remain
                                                    provisional

  One exact universal mAs   UNSUPPORTED             Do not encode as validated

  AEC provides              VALIDATED               Teach concept
  consistent/reproducible                           
  exposure and compensates                          
  for anatomical thickness                          

  Exact AEC chamber         VENDOR/PROTOCOL         Use labelled vendor-neutral
  geometry/selection        DEPENDENT               educational model

  Display brightness        FALSE / DO NOT TEACH    Use EI/DI/noise/dose
  directly indicates DR                             concepts instead
  exposure                                          

  EI represents detector    VALIDATED WITH SYSTEM   Do not equate with patient
  exposure information      CONTEXT                 dose

  EIT is universal for      FALSE                   Site/procedure/system
  Chest PA                                          dependent

  DI = 10 log10(EI/EIT)     VALIDATED               Suitable for simulator model

  DI = 0 when EI = EIT      VALIDATED               Suitable for feedback

  DI +3 ≈ 2× target; −3 ≈ ½ VALIDATED mathematical  Suitable educational
  target                    consequence             feedback

  Universal DI pass/fail    UNSUPPORTED             Must be
  limits                                            provisional/site-derived

  More mAs → more X-ray     VALIDATED PHYSICS       Connect to detector
  quantity, other factors                           exposure/noise and dose
  held comparable                                   awareness

  kVp affects beam          VALIDATED PHYSICS       Do not map simply to
  energy/penetration and                            displayed darkness
  output                                            

  SID affects beam          VALIDATED PHYSICS       Use documented simplified
  intensity geometrically                           model

  DR can conceal excessive  VALIDATED               Teach dose-creep risk
  exposure visually                                 

  DRL is an                 FALSE                   DRLs are
  individual-patient dose                           optimization/investigation
  limit                                             tools for populations/groups

  One technique fits all    FALSE                   Prepare engine for
  adult patients                                    patient/case variation
  ------------------------------------------------------------------------------

------------------------------------------------------------------------

## 14. Recommended deterministic model for RAD-LAB

Session 3 should keep **physics state**, **clinical/protocol target**,
**scoring**, and **rendering** separate.

Suggested conceptual flow:

`case attenuation + kVp + mAs/AEC + SID + collimation/positioning` →
`educational detector-exposure tendency` → `target comparison` →
`DI-like / target-relative result` →
`noise/adequacy tendency + dose-awareness feedback` → `scoring evidence`
→ `future image-renderer state`

The model should be deterministic so the same settings produce the same
educational result.

Do not claim that this simplified engine predicts real patient dose or
real detector EI unless it is later calibrated and validated against a
specified system.

------------------------------------------------------------------------

## 15. What should remain provisional after this research

The following should **NOT** be promoted to universal clinical truth in
Session 3:

1.  One exact Chest PA kVp.
2.  One exact Chest PA mAs.
3.  Universal kVp/mAs pass bands.
4.  Universal EI/EIT values.
5.  Universal DI pass/fail bands.
6.  Exact AEC chamber layout or universally correct chamber selection.
7.  Exact response of AEC to every positioning/collimation error.
8.  Exact patient-dose estimates from the simulator.
9.  Exact technique adjustment by patient body size.
10. Exact SID scoring tolerance around 180 cm.

These require a defined equipment/protocol profile and ideally
educator/medical-physicist review.

------------------------------------------------------------------------

## 16. High-priority design consequences for Session 3

1.  **Do not use displayed brightness as the exposure score.**
2.  **Use one SID state shared with Session 2.**
3.  **Make technique targets configurable.**
4.  **Keep AEC vendor-neutral.**
5.  **Prepare for different patient/case attenuation later.**
6.  **Keep EI/DI separate from patient dose.**
7.  **Do not invent an EIT.**
8.  **Do not use a universal DI pass/fail threshold.**
9.  **Every numerical scoring tolerance must carry its evidence
    classification.**
10. **Future image rendering should consume result state; it should not
    determine the medical score by pixel appearance.**

------------------------------------------------------------------------

## 17. Primary sources

### IAEA

-   International Atomic Energy Agency. *IAEA-TECDOC-796: Quality
    criteria / example radiographic technique for diagnostic
    radiographic images.*\
    https://www-pub.iaea.org/MTCD/Publications/PDF/te_796_web.pdf

-   International Atomic Energy Agency. *Quality Control in Diagnostic
    Radiology / Human Health Series No. 47.* Includes AEC constancy and
    digital exposure-indicator quality-control principles.\
    https://www-pub.iaea.org/MTCD/publications/PDF/PUB2021_web.pdf

-   IAEA Safety Standards / SSG-46. *Radiation Protection and Safety in
    Medical Uses of Ionizing Radiation.*\
    https://www.iaea.org/publications/11102/radiation-protection-and-safety-in-medical-uses-of-ionizing-radiation

### AAPM

-   AAPM Task Group 116. *An Exposure Indicator for Digital
    Radiography.* AAPM Report 116.\
    https://www.aapm.org/pubs/reports/rpt_116.pdf

-   AAPM Task Group 232. *Current State of Practice Regarding Digital
    Radiography Exposure Indicators and Deviation Indices.* Medical
    Physics (2018).\
    https://www.aapm.org/pubs/reports/detail.asp?docid=176

### IEC

-   IEC 62494-1. *Medical electrical equipment --- Exposure index of
    digital X-ray imaging systems --- Part 1: Definitions and
    requirements for general radiography.*\
    https://webstore.iec.ch/en/publication/7107

### ICRP

-   ICRP Publication 160. *Practical Aspects in Optimisation of
    Radiological Protection in Digital Radiography, Fluoroscopy, and
    CT.*\
    https://icrp.org/publication.asp?id=ICRP%20Publication%20160

-   ICRP Publication 135. *Diagnostic Reference Levels in Medical
    Imaging.*\
    https://www.icrp.org/publication.asp?id=ICRP%20Publication%20135

### ACR

-   ACR--AAPM--SIIM--SPR. *Practice Parameter for Digital Radiography.*\
    https://gravitas.acr.org/PPTS/GetDocumentView?docId=135

-   ACR--AAPM--SPR. *Practice Parameter for Diagnostic Reference Levels
    and Achievable Doses in Medical X-Ray Imaging.*\
    https://www.acr.org/-/media/ACR/Files/Practice-Parameters/diag-ref-levels.pdf

### WHO / IAEA

-   WHO. *Portable digital radiography system: technical specifications*
    (joint WHO/IAEA technical work).\
    https://www.who.int/publications/i/item/9789240033818

### FDA

-   U.S. FDA. *Nationwide Evaluation of X-Ray Trends (NEXT).*\
    https://www.fda.gov/radiation-emitting-products/radiation-safety/nationwide-evaluation-x-ray-trends-next

------------------------------------------------------------------------

## 18. Final medical position for Session 3

RAD-LAB can now safely build a strong educational technique engine
around:

-   high-kVp adult PA chest as a reference concept,
-   180 cm SID as a common reference target,
-   manual kVp/mAs interaction,
-   AEC purpose and vendor-neutral educational behavior,
-   detector-exposure tendency,
-   EI/EIT/DI concepts,
-   digital-image post-processing versus detector exposure,
-   noise and dose-awareness feedback,
-   SID physics,
-   configurable patient/protocol inputs.

It should **not yet** claim universal clinical correctness for exact
kVp, mAs, EIT, DI tolerance, AEC chamber selection, or patient-specific
technique values.

Those values should remain configurable and clearly labelled until a
specific protocol/equipment profile and educator/medical-physicist
validation are added.
