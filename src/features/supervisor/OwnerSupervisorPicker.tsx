"use client";
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { OwnerDirectory } from '../pilot/OwnerDirectory';
import type { DirectoryPerson } from '../pilot/owner-dashboard-data';
import type { Command, ReviewAdapter } from '../supervisor-review/contracts';
import { appCopy } from '../supervisor-review/copy';
import { control } from '../supervisor-review/SupervisorReview';

/** The directory exposes status/role, but no Terms version. The server owns eligibility. */
export function appointmentReason(person: DirectoryPerson, appointed: boolean) {
 if (person.role === 'owner') return 'appointmentOwner';
 if (person.status !== 'approved') return 'appointmentNotApproved';
 if (appointed) return 'appointmentAlready';
 return null;
}
export function OwnerSupervisorPicker({ adapter, act, locale }: { adapter: ReviewAdapter; act: (command: Command) => void; locale: 'en' | 'ar' }) {
 const t = appCopy[locale];
 return <section aria-label={t.appointmentSearch} className="min-w-0 space-y-3 rounded-xl border border-line p-4">
  <h3 className="text-lg font-semibold">{t.appointmentSearch}</h3>
  <OwnerDirectory approvedOnly>{person => <Candidate key={person.userId} person={person} adapter={adapter} act={act} locale={locale}/>}</OwnerDirectory>
 </section>;
}
function Candidate({ person, adapter, act, locale }: { person: DirectoryPerson; adapter: ReviewAdapter; act: (command: Command) => void; locale: 'en' | 'ar' }) {
 const t = appCopy[locale], d = useTranslations('owner.dashboard');
 const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading'), [appointed, setAppointed] = useState(false), [confirming, setConfirming] = useState(false);
 const button = useRef<HTMLButtonElement>(null), reasonId = `appointment-reason-${person.userId}`;
 const staticReason = appointmentReason(person, false);
 useEffect(() => {
  if (staticReason) return;
  const controller = new AbortController();
  void adapter.readAppointment?.(person.userId, controller.signal).then(value => {
   if (!controller.signal.aborted) { setAppointed(value); setStatus('ready'); }
  }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
  return () => controller.abort();
 }, [adapter, person.userId, staticReason]);
 const reason = appointmentReason(person, appointed) ?? (status === 'loading' ? 'loading' : status === 'error' ? 'offline' : null);
 const name = person.name || d('unnamed');
 function cancel() { setConfirming(false); button.current?.focus(); }
 return <div className="min-w-0 space-y-2">
  <strong className="block break-words">{name}</strong><bdi className="block break-all text-sm">{person.email}</bdi>
  {reason && <p id={reasonId} className="text-sm text-muted">{t[reason]}</p>}
  <button ref={button} className={control} disabled={!!reason} aria-label={`${t.appoint}: ${name}, ${person.email}`} aria-describedby={reason ? reasonId : undefined} onClick={() => setConfirming(true)}>{t.appoint}</button>
  {confirming && <section role="alertdialog" aria-label={t.appointmentConfirm} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } }} className="space-y-3 rounded-xl border border-line p-4">
   <p>{t.appointmentConfirm}</p><strong className="block break-words">{name}</strong><bdi className="block break-all">{person.email}</bdi>
   <div className="flex flex-wrap gap-2"><button autoFocus className={control} onClick={() => { setConfirming(false); act({ kind: 'appoint', personId: person.userId }); }}>{t.confirmAction}</button><button className={control} onClick={cancel}>{t.cancelAction}</button></div>
  </section>}
 </div>;
}
