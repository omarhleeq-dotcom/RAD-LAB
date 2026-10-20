/** Trusted E authoring boundary. Never imported by a client component. */
import { getExam } from "@/data/exams";
import { PRACTICAL_SCENES,practicalLabel,type PracticalView } from "./practical-presentation";
import { leafValues,resolveCase,validatePublication,validateValues } from "./server-validation";
import type { ContentWorkerPort } from "./server-presentation";
export function validatePracticalContent(document:unknown) {
  const checked=validatePublication(document),a=checked.publication.assessment;
  if(a.track!=="full-practical")throw new Error("Practical only");
  const views:Record<string,PracticalView>=Object.create(null);
  for(const item of a.items) {
    const key=checked.publication.privateItems.find(p=>p.ref.id===item.ref.id)!;
    if(key.type!=="full-practical")throw new Error("Practical key required");
    const c=resolveCase(key.caseRef,key.evaluatorVersion),exam=getExam(c.id.split("/")[0]!);
    if(!exam||!PRACTICAL_SCENES.includes(exam.scene.id as typeof PRACTICAL_SCENES[number]))throw new Error("Unsupported practical scene");
    const controls=checked.specs[item.ref.id]!;
    if(Object.keys(controls).some(p=>!practicalLabel(p)))throw new Error("Unsupported practical control");
    validateValues(controls,leafValues(c.initialSettings,controls));
    const labels=Object.fromEntries(Object.keys(controls).map(p=>[p,practicalLabel(p)!]));
    // Choice names are neutral control labels, not the help/feedback/ideal values in Practice.
    for(const choice of c.choiceControls??[])labels[`choices.${choice.id}`]=choice.label.en;
    const increments=Object.fromEntries(Object.entries(c.controls).map(([p,v])=>[p,{step:v!.step,...(v!.stations?{stations:[...v!.stations]}:{})}]));
    views[item.ref.id]={schemaVersion:1,controls,initial:leafValues(c.initialSettings,controls),sceneValues:{},labels,increments,
      scene:{id:exam.scene.id as PracticalView["scene"]["id"],detector:{...c.detector},anatomyFrame:{...c.requiredAnatomy},markerSizeCm:c.positioning.markerSizeCm}};
  }
  return {...checked,views};
}
/** Atomic installation uses a distinct E worker RPC. Candidate and used versions remain immutable. */
export async function installPracticalContent(worker:ContentWorkerPort,version:string) {
  const document=await worker.call("content_read_v1",{p_version:version});
  const {specs,views}=validatePracticalContent(document);
  await worker.call("content_install_practical_v1",{p_version:version,p_specs:specs,p_views:views});
}
