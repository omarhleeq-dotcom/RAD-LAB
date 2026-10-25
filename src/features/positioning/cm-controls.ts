/** Physical control inputs retain precision; display formatting must not quantize stored settings. */
export const normalizedSize = (cm: number, detectorCm: number) => cm / detectorCm;
export const normalizedCentreX = (cmFromCentre: number, detectorCm: number) => cmFromCentre / (detectorCm / 2);
export const normalizedCentreY = (cmFromTop: number, detectorCm: number) => (cmFromTop / detectorCm) * 2 - 1;
