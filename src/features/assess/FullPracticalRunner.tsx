"use client";
import {useTranslations,useLocale} from "next-intl";
import type {AttemptPort} from "./attempt-controller";
import type {PracticalSession} from "./practical-data";
import {PracticalRunner} from "./practical-state";
import {PracticalControls} from "./PracticalControls";
import {PracticalScene} from "./PracticalScene";
import {AssessSetup,RunnerView,useRunnerController,runnerButton as button} from "./RunnerView";
export function FullPracticalRunner({port,attempt,leave}:{port:AttemptPort<PracticalSession>;attempt:string;leave:()=>void}) {
  const t=useTranslations("assess"),locale=useLocale();
  const c=useRunnerController(changed=>new PracticalRunner(port,changed),attempt),s=c.session,issue=c.issue;
  return <RunnerView controller={c} attempt={attempt} leave={leave} testId="assess-practical-runner">
    {s?.ack.state==="active"&&<>
        {(()=>{const item=s.assessment!.items[c.index]!,locked=s.ack.lockedItemIds.includes(item.ref.id),answer=c.drafts[item.ref.id];
          return <article className="space-y-4 rounded border border-line bg-panel p-4" dir="ltr" lang="en" aria-labelledby="assess-prompt">
            <h3 id="assess-prompt" className="font-semibold">{item.prompt}</h3>
            <AssessSetup question={item.ref.id} paths={Object.keys(s.views![item.ref.id]!.controls)} locked={locked} disabled={c.busy||!!issue||!!c.pending}>{step=><>
            <PracticalScene view={s.views![item.ref.id]!} values={answer?.type==="full-practical"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending||step.id!=="centring"} onChange={values=>c.edit(item.ref.id,{type:"full-practical",values})}/>
            <PracticalControls view={{...s.views![item.ref.id]!,controls:Object.fromEntries(step.paths.map(path=>[path,s.views![item.ref.id]!.controls[path]!]))}} values={answer?.type==="full-practical"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending} onChange={values=>c.edit(item.ref.id,{type:"full-practical",values})}/>
            <p lang={locale} dir={locale==="ar"?"rtl":"ltr"}>{locked?t("locked"):t("oneExposure")}</p>
            <button lang={locale} dir={locale==="ar"?"rtl":"ltr"} className={button} disabled={!step.ready||locked||c.busy||!!issue||!!c.pending} onClick={()=>void c.expose()}>{t("expose")}</button>
            </>}</AssessSetup>
          </article>;})()}
    </>}
  </RunnerView>;
}
