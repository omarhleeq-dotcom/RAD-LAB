"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionAccount } from '../pilot/SessionGate';
import { useSupervisorAppointment } from '../supervisor/P1Session';
import { MANUAL_GRADING_AVAILABLE } from './manual-grading-availability';
import { connectManualGrading, type ManualGradingPort } from './manual-grading-data';
import { ManualGradingPanel } from './ManualGradingPanel';

export function ManualGradingEntry({ onQueue }: { onQueue?: (count: number, more: boolean) => void } = {}) {
 const { state } = useSessionAccount(), supervisor = useSupervisorAppointment();
 if (!MANUAL_GRADING_AVAILABLE || state.kind !== 'signedIn' || state.profile.status !== 'approved' || (!supervisor && state.profile.role !== 'owner')) return null;
 return <BoundGrading key={state.userId} actor={state.userId} owner={state.profile.role === 'owner'} onQueue={onQueue}/>;
}
function BoundGrading({ actor, owner, onQueue }: { actor: string; owner: boolean; onQueue?: (count: number, more: boolean) => void }) {
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
 return unavailable ? <p role="alert">{t('errors.unavailable')}</p> : port ? <ManualGradingPanel port={port} owner={owner} onQueue={onQueue}/> : <p role="status">{t('busy')}</p>;
}
