/**
 * Educational magnitudes of the Session 4 visual effects, in ONE place.
 *
 * Every number here is an EDUCATIONAL VISUAL APPROXIMATION chosen so that a supported clinical DIRECTION is
 * clearly visible (docs/RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md "Do NOT implement as clinical
 * truth"). None is calibrated against phantom or clinical data, none maps pixels to degrees, millimetres of
 * movement, a real detector's noise or any dose, and none may be shown to a learner as such.
 * TODO(medical-review): an educator / medical physicist should review these magnitudes.
 */
export const TUNING = {
  /** Rotation is drawn with coordinated cues; there is no whole-image rotation anywhere. */
  rotation: {
    /** Control range of the console; larger magnitudes are clamped (never extrapolated). */
    maxDeg: 20,
    /** Shift of the spinous-process / mediastinal column per degree, as a fraction of image width. */
    spineShiftPerDeg: 0.004,
    /** Gaussian width (fraction of image width) of that column shift: medial clavicle ends move far less. */
    spineSigma: 0.06,
    /** Shift of the whole thoracic interior per degree (lateral rib margins stay put): hemithorax asymmetry. */
    thoraxShiftPerDeg: 0.0015,
    /** Relative lung-transradiancy difference between the hemithoraces per degree (gain fraction at the edge). */
    transradiancyPerDeg: 0.003,
  },
  /** Reduced inspiration: shorter lung fields and a higher diaphragm (fraction of the apex→dome distance). */
  inspiration: { extentReduction: 0.12 },
  /** Schematic overlays, in display grey levels added where the overlay lies (dense = brighter). */
  scapula: { body: 24, border: 52 },
  jaw: { ridge: 36, softTissue: 15 },
  /** Motion: loss of sharpness as an anisotropic box blur, in detector cm. NOT a movement distance. */
  motion: { verticalCm: 0.35, horizontalCm: 0.12 },
  /** Low exposure: added quantum-noise-like texture and loss of fine low-contrast detail. */
  noise: {
    /** Grey levels of added noise per unit of sqrt(relativeNoise² − 1), relativeNoise = 1/√(EI/EIT). */
    sigmaPerUnit: 9,
    /** Noise is slightly stronger in denser (brighter) regions, where fewer photons reached the detector. */
    densityBias: 0.7,
    /** Fine-detail gain = 1 / (1 + detailLoss · (relativeNoise² − 1)). */
    detailLoss: 0.25,
    detailRadiusCm: 0.09,
  },
  /** Low penetration: fraction of local structure contrast kept inside the dense zones. */
  penetration: { contrastKept: 0.3, baseRadiusCm: 1.6 },
  /** Soft edge of the collimated field / image extent (penumbra), detector cm. */
  featherCm: 0.1,
  /** Unexposed area: outside the collimated field (a collimator shadow). */
  background: 4,
  /**
   * "No reference data": detector area INSIDE the field that the baseline image does not cover. It must never
   * read as exposure (black), collimation (dark) or anatomy, so it is a neutral mid-grey diagonal hatch.
   */
  noData: { light: 112, dark: 92, periodCm: 0.4 },
  /** Display normalisation may not stretch the image by more than this factor. */
  maxDisplayGain: 1.25,
} as const;
