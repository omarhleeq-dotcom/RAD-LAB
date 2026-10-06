# RAD-LAB --- Medical Reference: Adult PA Chest Image Quality & Educational Result Rendering

**Purpose:** Evidence pack for RAD-LAB Session 4\
**Scope:** Adult erect PA chest radiography using digital radiography
(DR).\
**Use:** Educational simulation only. This document separates supported
image-quality relationships from visual approximations.

## Evidence hierarchy

Core rules prioritize IAEA, WHO, AAPM, ACR, IEC concepts represented by
AAPM/ACR, and peer-reviewed chest-radiography studies indexed by PubMed.
No blogs, forums, commercial technique charts, or unsourced teaching
sites are used as medical authority.

## Classification

-   **VALIDATED:** directly supported by authoritative guidance or
    established imaging physics.
-   **COMMON QUALITY CRITERION:** recognized criterion for an adequate
    PA chest image without implying a universal numeric threshold.
-   **EVIDENCE-SUPPORTED DIRECTIONAL EFFECT:** direction/nature
    supported, exact magnitude patient/system dependent.
-   **VENDOR / PROCESSING DEPENDENT:** depends materially on detector or
    processing.
-   **EDUCATIONAL VISUAL APPROXIMATION:** simplified rendering used to
    teach a supported concept.
-   **PROVISIONAL:** numeric mapping not established as universal
    clinical truth.

A clinical concept can be validated while its exact pixel transformation
remains educational.

## Core PA chest image-quality criteria

IAEA criteria support: deep/full inspiration with suspended respiration;
symmetrical thorax; medial scapular borders outside lung fields; whole
rib cage above the diaphragm; vascular pattern through the lungs
including peripheral vessels; sharp trachea/proximal bronchi; sharp
heart/aortic borders; sharp diaphragm and costophrenic angles; and
visualization of retrocardiac lung and mediastinum.

These are suitable as common quality criteria. Do not invent numeric
thresholds for each criterion.

## Anatomical coverage and collimation

Required thoracic anatomy must be included. The existing field/centering
geometry should drive the result. If required anatomy falls outside the
simulated field, mask/crop that anatomy in the corresponding direction.
Excess field may show a larger exposed region, but do not invent an
exact scatter/contrast penalty without a physical model.

**Classification:** anatomy inclusion = common criterion; geometric
cropping = validated geometry plus educational implementation; exact
excess-field degradation = provisional.

## Rotation

WHO describes a correctly centred frontal CXR as projecting thoracic
spinous processes approximately midway between medial clavicular ends.
Rotation changes this relationship and can alter relative lung
transradiancy, hilar appearance, and mediastinal/sternal projection.
Experimental work confirms asymmetric thoracic projection with rotation,
but body morphology changes the apparent clavicle--spinous-process
relationship.

Render rotation with coordinated cues: thoracic asymmetry, changed
clavicle/spinous-process relationship, and corresponding hemithoracic
projection. Optional subtle hilar/mediastinal effects are acceptable
only if the asset/model supports them.

Do not rotate the whole rectangular image like a photograph. Do not
claim a fixed pixel difference equals a clinical degree of rotation.

**Classification:** evidence-supported directional effect + educational
visual mapping.

## Scapular positioning

IAEA criteria specify medial scapular borders outside the lung fields.
Correct shoulders-forward state should largely displace scapulae from
lung fields; incorrect preparation may show greater scapular
superimposition.

Exact simulated scapular displacement is an educational visual
approximation.

## Chin / upper-chest positioning

Preserve the existing validated positioning rule for chin elevation. A
failed chin cue may be represented by educational superimposition of
lower-jaw/soft-tissue anatomy over the upper thoracic/apical region. Do
not map the UI value to a claimed anatomical angle.

## Inspiration

IAEA/WHO support deep/full inspiration for chest radiography, and modern
quality-control research treats inspiration as a distinct quality
feature. A reduced-inspiration state may show reduced apparent lung
expansion, relatively elevated diaphragms, and reduced vertical lung
extent.

Do not create a universal rib-count pass/fail rule unless an adopted
protocol explicitly defines it. If the current simulation has no
inspiration state, do not fabricate it from unrelated technique
variables.

## Motion

Patient/respiratory motion can produce blur and loss of sharpness. If a
motion or breath-hold error state exists, represent it as reduced
sharpness/motion blur. Do not claim a pixel blur radius corresponds to a
clinical motion distance.

**Classification:** motion → loss of sharpness is validated; exact blur
magnitude is educational.

## Digital exposure and brightness

AAPM TG-116 and ACR guidance establish that displayed brightness and
contrast in DR can be strongly controlled by post-processing. Therefore
brightness is a poor indicator of acquisition exposure.

Session 4 MUST NOT teach: - low exposure = simply a light image; - high
exposure = simply a dark image.

Preserve Session 3's removal of brightness-based exposure variants.

## Low detector exposure / quantum noise

AAPM and ACR support that insufficient detector exposure can manifest as
increased noise and impaired low-contrast information. For low-exposure
tendency, add a deterministic educational quantum-noise component and
reduce subtle-detail visibility appropriately while keeping overall
displayed brightness approximately normalized.

Do not claim the texture quantitatively predicts a real detector.

## Excess detector exposure

DR may produce visually acceptable images across a broad exposure range.
Excess exposure can therefore be visually inconspicuous while
representing unnecessary radiation exposure/dose creep.

Do not darken the image simply because exposure is high. It may remain
visually acceptable while Session 3's target/dose-awareness feedback
communicates the problem.

## EI / EIT / DI

Preserve Session 3 architecture: DI = 10 × log10(EI/EIT). EI is related
to receptor exposure in the standardized framework and is not a
patient-dose/risk metric.

Do not invent a universal adult PA Chest EIT, universal DI pass/fail
range, patient effective dose from EI, or derive DI from rendered pixel
brightness.

## Penetration and anatomical visibility

IAEA criteria include visualization of retrocardiac lung and
mediastinum. Low-penetration state may be represented as reduced
educational visibility through denser mediastinal/retrocardiac regions,
not a global brightness shift.

Penetration and detector-exposure tendency remain separate concepts.

## Image processing

Conceptually separate: 1. acquisition/simulation state; 2.
anatomy/projection; 3. detector-exposure/noise state; 4.
display/post-processing; 5. annotations/markers.

Medical scoring must never be inferred from final pixel brightness.

## Side marker and annotations

Current ACR digital-radiography guidance requires side identification to
be visible. Preserve the learner-selected L/R marker, detector-relative
location, and field clipping. Do not automatically correct the learner's
marker. Patient-side correctness remains unscored unless a validated
orientation mapping is adopted.

## Recommended renderer pipeline

`RadiographResultState` → `projection/anatomy transform` →
`field/collimation mask` → `positioning effects` →
`technique/noise/penetration effects` → `display processing` →
`marker/annotation layer` → `educational radiograph`

The renderer must be deterministic. Scoring remains independent of
rendering.

## Effect table

  -----------------------------------------------------------------------
  Input                   Educational image       Classification
                          effect                  
  ----------------------- ----------------------- -----------------------
  Correct PA              Symmetric frontal       Common quality
                          thorax                  criterion

  Rotation                Thoracic/clavicular     Evidence-supported +
                          asymmetry; shifted      educational mapping
                          spinous-process         
                          relation                

  Poor shoulders          Scapular overlap of     Common criterion +
                          lung fields             educational mapping

  Poor chin               Upper-chest/apical      Educational
                          superimposition         approximation

  Tight/misplaced         Required anatomy        Geometry + common
  collimation             clipped according to    criterion
                          field geometry          

  Excess field            Larger exposed region;  Educational
                          no invented exact       representation
                          scatter penalty         

  Poor centering          Anatomy/field           Geometric
                          relationship shifted    representation
                          consistently            

  Adequate inspiration    Expanded lungs /        Common criterion
                          appropriate diaphragm   
                          appearance              

  Reduced inspiration     Reduced expansion /     Evidence-supported +
                          elevated diaphragm      educational mapping
                          tendency                

  Motion                  Reduced sharpness /     Validated principle +
                          blur                    educational magnitude

  Low detector exposure   Increased quantum-noise Validated DR
                          tendency, no simple     principle + educational
                          brightness shift        noise

  Excess exposure         May remain visually     Validated DR principle
                          acceptable;             
                          dose-awareness feedback 

  Low penetration         Reduced visibility      Common criterion +
                          through                 educational mapping
                          dense/retrocardiac      
                          regions                 

  Marker                  Learner-selected marker Annotation behavior
                          at detector-relative    
                          position                

  DI                      Display target-relative Validated standardized
                          state; never derive     concept
                          from pixels             
  -----------------------------------------------------------------------

## Do NOT implement as clinical truth

1.  Fixed pixel distance = fixed rotation degree.
2.  Universal rib-count rule alone = inspiration adequacy.
3.  Specific blur radius = specific patient motion.
4.  Specific noise amplitude = real EI or patient dose.
5.  Dark DR image = overexposure.
6.  Light DR image = underexposure.
7.  Universal processing appearance across vendors.
8.  Universal DI pass/fail threshold.
9.  Universal adult Chest PA EIT.
10. Simulated opacity = quantitative penetration measurement.
11. Exact scatter/contrast degradation from field size without a
    physical model.
12. Educational rendering predicts diagnostic accuracy or actual patient
    dose.

## Asset requirements

Prefer medically appropriate assets with explicit reuse permission. Do
not embed copyrighted clinical images without a compatible license.
Preferred: public-domain/explicitly reusable scientific assets,
purpose-created educational assets, or licensed de-identified references
permitting redistribution. Document provenance/license in the
repository.

If no suitable reusable radiograph exists, implement the renderer
architecture with a clearly labelled educational placeholder rather than
silently using an unlicensed image.

## Validation strategy

**Logic/state tests:** rotation selects rotation effect; clipping masks
correct side; low exposure selects noise; excess exposure does not
simply darken; penetration remains distinct; marker coordinates remain
consistent.

**Visual/browser tests:** deterministic screenshots; EN/AR;
desktop/tablet/mobile; no overflow; marker alignment; visible field
clipping; stable correct baseline; combinations do not break rendering.

Passing visual tests is not clinical validation.

## Primary sources

### IAEA

-   IAEA-TECDOC-796:
    https://www-pub.iaea.org/MTCD/Publications/PDF/te_796_web.pdf
-   IAEA-TECDOC-1423:
    https://www-pub.iaea.org/MTCD/Publications/PDF/te_1423_web.pdf

### WHO

-   WHO Manual of Diagnostic Imaging --- chest interpretation:
    https://iris.who.int/bitstream/handle/10665/43293/9241546778_eng.pdf
-   WHO radiographic quality material:
    https://iris.who.int/bitstream/handle/10665/66843/9241546328_eng_LR_part1.pdf

### AAPM

-   TG-116: https://www.aapm.org/pubs/reports/rpt_116.pdf
-   TG-116 page: https://www.aapm.org/pubs/reports/detail.asp?docid=111
-   TG-232: https://www.aapm.org/pubs/reports/detail.asp?docid=176
-   TG-151: https://aapm.org/pubs/reports/detail.asp?docid=130

### ACR

-   ACR--AAPM--SIIM--SPR Practice Parameter for Digital Radiography:
    https://gravitas.acr.org/PPTS/DownloadPreviewDocument?DocId=135&ReleaseId=2
-   ACR DIR DR Measures:
    https://acrsupport.acr.org/support/solutions/articles/11000134290-dir-dr-measures

### Peer-reviewed

-   Nousiainen K, et al. Automating chest radiograph imaging quality
    control: https://pubmed.ncbi.nlm.nih.gov/33770747/
-   Assessing sagittal rotation and body morphology:
    https://pubmed.ncbi.nlm.nih.gov/31052116/
-   Estimating rotation angle from asymmetric chest projection:
    https://pubmed.ncbi.nlm.nih.gov/34719433/
-   Ono T, et al. Motion detection in portable chest radiography:
    https://pubmed.ncbi.nlm.nih.gov/35793953/
-   Prokop M, et al. Principles of image processing in digital chest
    radiography: https://pubmed.ncbi.nlm.nih.gov/12867812/

## Final position for Session 4

Evidence is sufficient to build an educational PA Chest result renderer
responsive to rotation, centering, collimation/anatomical inclusion,
scapular and chin positioning, inspiration/motion when represented in
state, low detector exposure via noise rather than brightness, excess
exposure via dose-awareness rather than darkening, low penetration via
reduced visibility in dense regions, and learner marker position.

Use the pattern:

**validated clinical concept → simulation state → labelled educational
visual approximation**

not:

**invented pixel effect → claimed clinical truth**.

Exact visual magnitudes still require educator/medical-physicist review
and, for future quantitative realism, validation against controlled
phantom or clinical datasets.
