"use client";
import type { SceneProps } from "./scenes";
import { PositioningView } from "./PositioningView";
import { SHOULDER_LAYOUT } from "./scene-layouts";

/** Local font metrics keep the landscape diagram's label pills inside their margin slots (as the pelvis scene); no earlier scene changes. */
export function ShoulderScene(props: SceneProps) {
  return <div className="shoulder-scene">
    <style>{".shoulder-scene svg { font-family: Arial, sans-serif; }"}</style>
    <PositioningView {...props} layout={SHOULDER_LAYOUT} />
  </div>;
}
