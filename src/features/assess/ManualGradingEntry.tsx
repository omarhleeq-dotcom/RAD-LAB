"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionAccount } from '../pilot/SessionGate';
import { useSupervisorAppointment } from '../supervisor/P1Session';
import { MANUAL_GRADING_AVAILABLE } from './manual-grading-availability';
import { connectManualGrading, type ManualGradingPort } from './manual-grading-data';
import { ManualGradingPanel } from './ManualGradingPanel';

export function ManualGradingEntry() {
 const { state } = useSessionAccount(), supervisor = useSupervisorAppointment();
 if (!MANUAL_GRADING_AVAILABLE || state.kind !== 'signedIn' || state.profile.status !== 'approved' || (!supervisor && state.profile.role !== 'owner')) return null;
 return <BoundGrading key={state.userId} actor={state.userId} owner={state.profile.role === 'owner'}/>;
}
function BoundGrading({ actor, owner }: { actor: string; owner: boolean }) {
 const [port, setPort] = useState<ManualGradingPort | null>(null), [unavailable, setUnavailable] = useState(false);
 const t = useTranslations('manualGrading');
 useEffect(() => {
  let active = true, close: (() => void) | undefined;
  void connectManualGrading(actor, () => { if (active) { setPort(null); setUnavailable(true); } }).then(binding => {
   close = binding.close;
   if (active) setPort(binding.port); else close();
  }).catch(() => { if (active) setUnavailable(true); });
  return () => { active = false; close?.(); };
 }, [actor]);
 return unavailable ? <p role="alert">{t('errors.unavailable')}</p> : port ? <ManualGradingPanel port={port} owner={owner}/> : <p role="status">{t('busy')}</p>;
}
