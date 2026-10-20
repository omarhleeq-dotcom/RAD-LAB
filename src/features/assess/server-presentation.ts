/** Node-only D authoring validation. Existing C installation remains a separate trusted port. */
import type { AssessmentPublication } from "./server-contracts";
import { validatePublication } from "./server-validation";
import { controlLabel, SCENE_PATHS } from "./presentation";
export function validateMixedContent(document:unknown) {
  const checked=validatePublication(document);
  const a=checked.publication.assessment;
  if(a.track!=="mixed")throw new Error("Mixed only");
  for(const item of a.items)if(item.type==="simulator-part") {
    const paths=Object.keys(checked.specs[item.ref.id]!);
    if(item.presentation.controls.length!==paths.length || new Set(item.presentation.controls).size!==paths.length ||
      item.presentation.controls.some(p=>!paths.includes(p)||!controlLabel(p)) ||
      new Set(item.presentation.sceneElements).size!==item.presentation.sceneElements.length ||
      item.presentation.sceneElements.some(e=>!Object.hasOwn(SCENE_PATHS,e)))throw new Error("Unsupported presentation");
    const p=checked.publication.privateItems.find(p=>p.ref.id===item.ref.id)!;
    if(p.type!=="simulator-part")throw new Error("Invalid part");
    // Scene dependencies and all fixed background must be included in O108's review scope.
    if(!p.review.scope.trim())throw new Error("Review scope required");
  }
  return checked;
}
export interface ContentWorkerPort { call<T>(name:string,args:Record<string,unknown>):Promise<T> }
/** Called by the separately authorized trusted runtime, never from the browser. No gate changes. */
export async function installMixedContent(worker:ContentWorkerPort,version:string) {
  const document=await worker.call<AssessmentPublication|null>("content_read_v1",{p_version:version});
  const {specs}=validateMixedContent(document);
  await worker.call("content_install_v1",{p_version:version,p_specs:specs});
}
