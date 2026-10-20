import type { SimulatorPartItem } from "./contracts";
import type { ItemView } from "./presentation";
import { controlLabel } from "./presentation";
/** No Practice workspace, evaluator, readiness hints, image pipeline or hidden controls. */
export function PartControls({item,view,values,disabled,onChange}:{item:SimulatorPartItem;view:ItemView;values:Record<string,unknown>;disabled:boolean;onChange:(values:Record<string,unknown>)=>void}) {
  const scene={...view.sceneValues,...values};
  const number=(p:string,fallback=0)=>typeof scene[p]==="number"?scene[p] as number:fallback;
  return <div className="space-y-4" dir="ltr" lang="en">
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 font-semibold">Settings</legend>
      {item.presentation.controls.map(path=>{const s=view.controls[path]!;return <div key={path} className="block min-w-0 text-sm"><label htmlFor={`assess-control-${path}`}>{controlLabel(path)}</label>
        {s.kind==="number"?<><input id={`assess-control-${path}`} className="mt-2 block w-full" type="range" min={s.min} max={s.max} step="any" value={Number(values[path])} onChange={e=>onChange({...values,[path]:Number(e.target.value)})}/><output>{String(values[path])}</output></>:
          <select id={`assess-control-${path}`} className="mt-2 block min-h-11 w-full rounded border border-line bg-panel p-2" value={s.values.findIndex(v=>JSON.stringify(v)===JSON.stringify(values[path]))} onChange={e=>onChange({...values,[path]:s.values[Number(e.target.value)]})}>
            {s.values.map((v,i)=><option key={i} value={i}>{v===null?"None":Array.isArray(v)?v.join(", ")||"None":String(v)}</option>)}
          </select>}
      </div>;})}
    </fieldset>
    {item.presentation.sceneElements.length>0&&<figure aria-label="Selected scene elements" className="rounded border border-line p-3">
      <svg viewBox="0 0 320 240" role="img" aria-label="Settings diagram" className="mx-auto max-h-64 w-full">
        <title>Selected scene elements</title>
        {item.presentation.sceneElements.includes("detector")&&<rect x="30" y="30" width="260" height="180" fill="none" stroke="currentColor"/>}
        {item.presentation.sceneElements.includes("tube")&&<g><rect x="130" y="5" width="60" height="20" fill="none" stroke="currentColor"/><text x="160" y="55" textAnchor="middle" fill="currentColor" fontSize="14">SID {number("sidCm")} cm</text></g>}
        {item.presentation.sceneElements.includes("beam")&&<rect x={160+number("centralRay.x")*100-number("collimation.width",1)*100} y={120+number("centralRay.y")*70-number("collimation.height",1)*70} width={number("collimation.width",1)*200} height={number("collimation.height",1)*140} fill="none" stroke="currentColor" strokeDasharray="6 4"/>}
        {item.presentation.sceneElements.includes("marker")&&scene.sideMarker!==null&&<text x={160+number("markerPosition.x")*110} y={120+number("markerPosition.y")*75} textAnchor="middle" fill="currentColor" fontSize="20">{String(scene.sideMarker)}</text>}
      </svg>
      <figcaption className="break-words text-sm">{Object.entries(scene).map(([p,v])=>`${controlLabel(p)??p}: ${String(v)}`).join("; ")}</figcaption>
    </figure>}
  </div>;
}
