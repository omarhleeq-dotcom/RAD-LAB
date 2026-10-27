"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { P1_AVAILABLE } from './p1-availability';
import { useOptionalSessionAccount, useSessionAccount } from '../pilot/SessionGate';
import { needsConsent } from '../pilot/consent';
import { PILOT } from '../pilot/config';
import type { Person, ReviewAdapter } from '../supervisor-review/contracts';
import { ReviewSession } from '../supervisor-review/ReviewSession';
import { appCopy } from '../supervisor-review/copy';

type SupervisorScope = { status: 'loading' | 'appointed' | 'not-supervisor' | 'offline'; adapter?: ReviewAdapter; refresh: () => void };
const ScopeContext = createContext<SupervisorScope | undefined>(undefined);
/** One normal groups read serves both navigation and the supervisor page. */
export function P1SupervisorScope({ children }: { children: ReactNode }) {
 const account = useOptionalSessionAccount(), state = account?.state;
 const identity = P1_AVAILABLE && PILOT && state?.kind === 'signedIn' && state.profile.status === 'approved'
  && state.profile.role === 'participant' && !needsConsent(state.consentVersion) ? state.userId : null;
 return identity ? <BoundSupervisorScope key={identity} identity={identity}>{children}</BoundSupervisorScope> : <ScopeContext.Provider value={undefined}>{children}</ScopeContext.Provider>;
}
export function useSupervisorAppointment() { return useContext(ScopeContext)?.status === 'appointed'; }
function BoundSupervisorScope({ identity, children }: { identity: string; children: ReactNode }) {
 const [scope, setScope] = useState<Omit<SupervisorScope, 'refresh'>>({ status: 'loading' });
 const [revision, setRevision] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  async function load() {
   if (P1_AVAILABLE) {
    try {
     const binding = await import('./p1-live');
     const adapter = await binding.bindP1({ id: identity, role: 'supervisor', name: identity }, appointed => {
      if (!controller.signal.aborted) setScope(current => current.adapter ? { ...current, status: appointed ? 'appointed' : 'not-supervisor' } : current);
     });
     const snapshot = await adapter.read({ actorId: identity }, controller.signal);
     if (!controller.signal.aborted) setScope({ status: snapshot.appointed === true ? 'appointed' : 'not-supervisor', adapter });
    } catch { if (!controller.signal.aborted) setScope({ status: 'offline' }); }
   }
  }
  void load();
  const visibility = () => {
   controller.abort(); setScope({ status: 'loading' });
   if (document.visibilityState === 'visible') setRevision(value => value + 1);
  };
  document.addEventListener('visibilitychange', visibility);
  return () => { controller.abort(); document.removeEventListener('visibilitychange', visibility); };
 }, [identity, revision]);
 return <ScopeContext.Provider value={{ ...scope, refresh: () => { setScope({ status: 'loading' }); setRevision(value => value + 1); } }}>{children}</ScopeContext.Provider>;
}

export function P1Session({ role }: { role: Person['role'] }) {
 const { state } = useSessionAccount();
 const scope = useContext(ScopeContext), locale = useLocale() === 'ar' ? 'ar' : 'en', t = appCopy[locale];
 const identity = PILOT && state.kind === 'signedIn' && state.profile.status === 'approved' && !needsConsent(state.consentVersion)
  && (role === 'owner' ? state.profile.role === 'owner' : state.profile.role === 'participant') ? state.userId : null;
 if (!P1_AVAILABLE) return null;
 if (role === 'supervisor') {
  if (!identity || scope?.status === 'not-supervisor') return <p role="status">{t.notSupervisor}</p>;
  if (!scope || scope.status === 'loading') return <p role="status">{t.loading}</p>;
  if (scope.status === 'offline') return <div><p role="alert">{t.offline}</p><button className="min-h-11 rounded border border-line px-3" onClick={scope.refresh}>{t.retry}</button></div>;
  return scope.adapter ? <section data-p1-role="supervisor"><P1View adapter={scope.adapter} actorId={identity} locale={locale}/></section> : null;
 }
 if (!identity) return null;
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
