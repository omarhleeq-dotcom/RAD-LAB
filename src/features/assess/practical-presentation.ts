/** E's public render contract. Geometry is visible drawing input, never tolerances, gates or scoring metadata. */
import type { SimulationSettings } from "@/domain/simulation";
import type { DetectorRegion, DetectorSpec } from "@/domain/case";
import type { ItemView } from "./presentation";
import { controlLabel } from "./presentation";
export const PRACTICAL_SCENES = ["chest-pa-frontal","chest-lateral","chest-ap-supine","wrist-pa","wrist-lateral","hand-pa","hand-lateral","elbow-ap","elbow-lateral","knee-ap","knee-lateral","foot-ap","foot-oblique","ankle-ap","ankle-lateral","pelvis-ap-supine","shoulder-grashey-erect"] as const;
export type PracticalSceneId = typeof PRACTICAL_SCENES[number];
export interface PracticalView extends ItemView {
  schemaVersion:1;
  scene:{id:PracticalSceneId;detector:DetectorSpec;anatomyFrame:DetectorRegion;markerSizeCm:number};
  labels:Record<string,string>;
  increments:Record<string,{step:number;stations?:number[]}>;
}
export const practicalLabel=(path:string)=>path==="tubeAngulationDeg"?"Tube angle (degrees)":controlLabel(path);
/** Rebuild only the editable settings; no case registry, evaluator or Practice state in the browser. */
export function practicalSettings(values:Readonly<Record<string,unknown>>):SimulationSettings {
  const out:Record<string,unknown>={};
  for(const [path,value] of Object.entries(values)) {
    const [root,leaf]=path.split(".");
    if(leaf){const nested=(out[root!]??={}) as Record<string,unknown>;nested[leaf]=value;}
    else out[path]=value;
  }
  return out as unknown as SimulationSettings;
}
