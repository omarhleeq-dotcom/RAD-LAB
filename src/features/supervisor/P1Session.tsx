"use client";
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { P1_AVAILABLE } from './p1-availability';
import { useSessionAccount } from '../pilot/SessionGate';
import { needsConsent } from '../pilot/consent';
import { PILOT } from '../pilot/config';
import type { Person, ReviewAdapter } from '../supervisor-review/contracts';
import { ReviewSession } from '../supervisor-review/ReviewSession';
import { appCopy } from '../supervisor-review/copy';

export function P1Session({ role }: { role: Person['role'] }) {
 const { state } = useSessionAccount();
 const identity = PILOT && state.kind === 'signedIn' && state.profile.status === 'approved' && !needsConsent(state.consentVersion)
  && (role === 'owner' ? state.profile.role === 'owner' : state.profile.role === 'participant') ? state.userId : null;
 if (!P1_AVAILABLE || !identity) return null;
 return <BoundSession key={`${identity}:${role}`} self={{ id: identity, role, name: identity }}/>;
}
function BoundSession({ self }: { self: Person }) {
 const [adapter, setAdapter] = useState<ReviewAdapter>(), [failed, setFailed] = useState(false);
 const locale = useLocale() === 'ar' ? 'ar' : 'en', t = appCopy[locale];
 useEffect(() => {
  let active = true;
  // The schema gate verifies this exact manifest-derived guard before following the import.
  if (P1_AVAILABLE) {
   void import('./p1-live').then(module => module.bindP1(self)).then(value => { if (active) setAdapter(value); }).catch(() => { if (active) setFailed(true); });
  }
  return () => { active = false; };
 }, [self]);
 return <section data-p1-role={self.role} className="mt-8 space-y-4">
  {self.role !== 'supervisor' && <h2 className="text-2xl font-semibold">{self.role === 'owner' ? t.owner : t.accountTitle}</h2>}
  {failed ? <p role="alert">{t.offline}</p> : adapter ? <P1View adapter={adapter} actorId={self.id} locale={locale}/> : <p role="status">{t.loading}</p>}
 </section>;
}
/** Same injected view for app bindings and isolated database acceptance checks. */
export function P1View({ adapter, actorId, locale }: { adapter: ReviewAdapter; actorId: string; locale: 'en' | 'ar' }) {
 const [groupId, setGroupId] = useState<string>();
 const [visible, setVisible] = useState(true), [epoch, setEpoch] = useState(0);
 useEffect(() => {
  const change = () => { setVisible(document.visibilityState === 'visible'); setEpoch(value => value + 1); };
  document.addEventListener('visibilitychange', change);
  return () => document.removeEventListener('visibilitychange', change);
 }, []);
 return visible ? <><p>{appCopy[locale].archiveHint}</p><p>{appCopy[locale].refreshHint}</p><ReviewSession key={epoch} adapter={adapter} actorId={actorId} groupId={groupId} selectGroup={setGroupId} locale={locale} text={appCopy[locale]}/></> : null;
}
