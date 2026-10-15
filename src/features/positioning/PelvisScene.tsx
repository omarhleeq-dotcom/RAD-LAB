"use client";
import type { SceneProps } from "./scenes";
import { PositioningView } from "./PositioningView";
import { PELVIS_LAYOUT } from "./scene-layouts";

/** Local font metrics keep the new landscape diagram's label pills inside its
 * established margin slots. No earlier scene typography or shared layout changes.
 */
export function PelvisScene(props: SceneProps) {
  return <div className="pelvis-scene">
    <style>{".pelvis-scene svg { font-family: Arial, sans-serif; }"}</style>
    <PositioningView {...props} layout={PELVIS_LAYOUT} />
  </div>;
}
