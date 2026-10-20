/** Public presentation vocabulary: selectable bounds only, never scoring targets. */
export type ControlSpec = {kind:"number";min:number;max:number} | {kind:"enum";values:unknown[]};
export const CONTROL_LABELS: Readonly<Record<string,string>> = Object.freeze({
  sidCm:"SID (cm)",kvp:"kVp",mas:"mAs",rotationDeg:"Rotation (degrees)",tubeAngleDeg:"Tube angle (degrees)",
  projection:"Projection",exposureMode:"Exposure mode",aecChambers:"AEC chambers",sideMarker:"Marker letter",
  "markerPosition.x":"Marker horizontal position","markerPosition.y":"Marker vertical position",
  "centralRay.x":"Beam horizontal position","centralRay.y":"Beam vertical position",
  "collimation.width":"Field width","collimation.height":"Field height",
  breathing:"Breathing instruction",motionInstruction:"Motion instruction",chinPosition:"Chin position",shoulderPosition:"Shoulder position",
});
export const SCENE_PATHS: Readonly<Record<string,readonly string[]>> = Object.freeze({
  detector:[],tube:["sidCm"],marker:["sideMarker","markerPosition.x","markerPosition.y"],
  beam:["centralRay.x","centralRay.y","collimation.width","collimation.height"],
});
export function controlLabel(path:string):string | null {
  return Object.hasOwn(CONTROL_LABELS,path)?CONTROL_LABELS[path]!: (/^choices\.[a-zA-Z0-9_-]{1,80}$/.test(path)?path.slice(8):null);
}
export interface ItemView {
  controls: Record<string,ControlSpec>;
  initial: Record<string,unknown>;
  /** Only reviewed fields required by the explicitly selected scene elements. */
  sceneValues: Record<string,unknown>;
}
