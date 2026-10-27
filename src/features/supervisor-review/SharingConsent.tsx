import type { Command, Snapshot } from './contracts';
import { appCopy } from './copy';
import { control } from './SupervisorReview';
export function SharingConsent({ data, locale, act }: { data: Snapshot; locale: string; act: (c: Command) => void }) {
 const ar = locale === 'ar', policy = data.sharingPolicy, t = appCopy[ar ? 'ar' : 'en'];
 return <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
  <h2 className="text-xl font-semibold">{t.sharingTitle}</h2>
  {policy?.known ? <>
   <p className="whitespace-pre-line">{t.consentText}</p>
   <p>{t.policyVersion}<bdi>{policy.version}</bdi></p>
   <p>{t.sharingWindow}</p>
   <a className="underline" href={`/${ar ? 'ar' : 'en'}/terms`}>{t.terms}</a>
   {data.sharing ? <><p role="status">{t.active}</p><button className={control} onClick={() => act({ kind: 'sharing', version: policy.version, digest: policy.digest, accept: false })}>{t.withdraw}</button></> :
    <form key={policy.version + policy.digest} className="space-y-3" onSubmit={e => { e.preventDefault(); if (new FormData(e.currentTarget).get('sharing') === 'yes') act({ kind: 'sharing', version: policy.version, digest: policy.digest, accept: true }); }}>
     <label className="flex items-start gap-3"><input className="mt-1 min-h-6 min-w-6" type="checkbox" name="sharing" value="yes" required/>{t.agree}</label>
     <button className={control}>{t.accept}</button>
     <p>{t.decline}</p>
    </form>}
  </> : <p role="alert">{t.unknown}</p>}
  {!policy?.known && <button className={control} onClick={() => act({ kind: 'sharing', version: policy?.version ?? '', digest: policy?.digest ?? '', accept: false })}>{t.withdraw}</button>}
 </section>;
}
