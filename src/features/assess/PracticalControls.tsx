import { useLocale, useTranslations } from "next-intl";
import { dirFor } from "@/i18n/routing";
import type { PracticalView } from "./practical-presentation";
/** Every declared setting, with neutral labels and selectable bounds; no Practice help or computed readiness. */
export function PracticalControls({view,values,disabled,onChange}:{view:PracticalView;values:Readonly<Record<string,unknown>>;disabled:boolean;onChange:(v:Record<string,unknown>)=>void}){
  const t=useTranslations("assess.part"),locale=useLocale();
  const aec=view.controls.exposureMode?.kind==="enum"&&view.controls.exposureMode.values.includes("aec");
  return <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2" dir="ltr" lang="en">
    <legend className="mb-3 font-semibold" lang={locale} dir={dirFor(locale)}>{t("settings")}</legend>
    {Object.entries(view.controls).filter(([p])=>p!=="aecChambers"||aec).map(([path,s])=>{
      const id=`practical-control-${path}`,increment=view.increments[path],stations=increment?.stations;
      return <div key={path} className="min-w-0 text-sm"><label htmlFor={id}>{view.labels[path]}</label>
        {s.kind==="enum"?<select id={id} className="mt-2 min-h-11 w-full rounded border border-line bg-panel p-2" value={s.values.findIndex(v=>JSON.stringify(v)===JSON.stringify(values[path]))} onChange={e=>onChange({...values,[path]:s.values[Number(e.target.value)]})}>
          {s.values.map((v,n)=><option key={n} value={n}>{v===null?"None":Array.isArray(v)?v.join(", ")||"None":String(v)}</option>)}
        </select>:stations?<select id={id} className="mt-2 min-h-11 w-full rounded border border-line bg-panel p-2" value={Number(values[path])} onChange={e=>onChange({...values,[path]:Number(e.target.value)})}>
          {(!stations.includes(Number(values[path])))&&<option value={Number(values[path])}>{String(values[path])}</option>}{stations.map(v=><option key={v} value={v}>{v}</option>)}
        </select>:<><input id={id} className="mt-2 block min-h-11 w-full" type="range" min={s.min} max={s.max} step={increment?.step??0.01} value={Number(values[path])} onChange={e=>onChange({...values,[path]:Number(e.target.value)})}/><output htmlFor={id}>{String(values[path])}</output></>}
      </div>;
    })}
  </fieldset>;
}
