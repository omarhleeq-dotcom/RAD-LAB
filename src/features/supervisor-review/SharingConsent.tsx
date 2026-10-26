import type { Command, Snapshot } from './contracts';
import { sharingPolicy } from './sharing-policy';
import { control } from './SupervisorReview';
export function SharingConsent({ data, locale, act }: { data: Snapshot; locale: string; act: (c: Command) => void }) {
 const ar = locale === 'ar', policy = data.sharingPolicy;
 return <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
  <h2 className="text-xl font-semibold">{ar ? 'مشاركة بياناتي' : 'Sharing my data'}</h2>
  {policy?.known ? <>
   <p className="whitespace-pre-line">{sharingPolicy[ar ? 'ar' : 'en']}</p>
   <p>{ar ? 'الإصدار: ' : 'Version: '}<bdi>{policy.version}</bdi></p>
   <p>{ar ? 'تبدأ النافذة من أحدث وقت: الانضمام، بداية المجموعة، تعيين المشرف، أو قبول المشاركة. التدريب بوقت التسجيل الخادمي، والاختبارات بوقت بدء المحاولة وفي مجموعة الإسناد فقط. تبقى الدرجات المخفية محجوبة، ولا تشمل المشاركة الاستبيانات.' : 'The window starts at the latest of joining, group start, supervisor appointment or sharing acceptance. Practice uses server recording time; exams use attempt start time and only the assigned group. Hidden grades remain hidden. Surveys are excluded.'}</p>
   <a className="underline" href={`/${ar ? 'ar' : 'en'}/terms`}>{ar ? 'شروط الاستخدام' : 'Terms of Use'}</a>
   {data.sharing ? <><p role="status">{ar ? 'موافقتك سارية.' : 'Your consent is active.'}</p><button className={control} onClick={() => act({ kind: 'sharing', version: policy.version, digest: policy.digest, accept: false })}>{ar ? 'سحب موافقتي' : 'Withdraw my consent'}</button></> :
    <form key={policy.version + policy.digest} className="space-y-3" onSubmit={e => { e.preventDefault(); if (new FormData(e.currentTarget).get('sharing') === 'yes') act({ kind: 'sharing', version: policy.version, digest: policy.digest, accept: true }); }}>
     <label className="flex items-start gap-3"><input className="mt-1 min-h-6 min-w-6" type="checkbox" name="sharing" value="yes" required/>{ar ? 'قرأت المعلومات أعلاه وأوافق بنفسي على هذه المشاركة.' : 'I have read the information above and personally agree to this sharing.'}</label>
     <button className={control}>{ar ? 'تأكيد موافقتي' : 'Confirm my consent'}</button>
     <p>{ar ? 'يمكنك عدم الموافقة ومواصلة استخدام ما هو متاح خارج المجموعة.' : 'You may decline and continue using what is available outside the group.'}</p>
    </form>}
  </> : <p role="alert">{ar ? 'نص المشاركة غير متاح أو تغيّر. لا يمكن قبول نسخة غير معروفة. حدّث البيانات.' : 'The sharing text is unavailable or has changed. An unknown version cannot be accepted. Refresh.'}</p>}
  {!policy?.known && <button className={control} onClick={() => act({ kind: 'sharing', version: policy?.version ?? '', digest: policy?.digest ?? '', accept: false })}>{ar ? 'سحب موافقتي' : 'Withdraw my consent'}</button>}
 </section>;
}
