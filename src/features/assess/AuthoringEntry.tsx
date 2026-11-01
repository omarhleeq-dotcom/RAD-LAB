"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSessionAccount } from '../pilot/SessionGate';
import { getPilotClient } from '../pilot/client';
import { createSqlAuthoringV2 } from '../authoring-review/sql-adapter';
import type { AuthoringAdapter, Scope } from '../authoring-review/contracts';
import { AuthoringSession, GroupPicker } from '../authoring-review/Session';
import { copy, sqlCopy } from '../authoring-review/copy';
import { clearAuthoringBatchMemory } from './import-preferences';
import { Rad062Entry } from './Rad062Entry';
const parameters: Record<string, readonly string[]> = {
 scope_page_v1: ['p_kind', 'p_group', 'p_after', 'p_limit'],
 draft_page_v2: ['p_group', 'p_id', 'p_after', 'p_limit'],
 draft_save_v2: ['p_group', 'p_id', 'p_revision', 'p_document', 'p_refs'],
};
/** Authenticated public client; only the existing scoped authoring RPCs, never a publisher. */
export function AuthoringEntry() {
 const { state } = useSessionAccount(), t = useTranslations('assessImport');
 if (state.kind !== 'signedIn' || state.profile.status !== 'approved') return null;
 return <section className="mt-8 min-w-0 space-y-4 border-t border-line pt-5" data-testid="assess-authoring">
  <h2 className="text-xl font-semibold">{t('title')}</h2>
  {state.profile.role === 'owner' ? <p>{t('ownerOnly')}</p> : <Rad062Entry><BoundAuthoring key={state.userId} actor={state.userId} role="supervisor" name={state.displayName ?? ''}/></Rad062Entry>}
 </section>;
}
function BoundAuthoring({ actor, role, name }: { actor: string; role: 'owner' | 'supervisor'; name: string }) {
 const locale = useLocale() === 'ar' ? 'ar' : 'en', t = useTranslations('assessImport');
 const [adapter, setAdapter] = useState<AuthoringAdapter>(), [scope, setScope] = useState<Scope>(), [error, setError] = useState(false);
 useEffect(() => {
  let active = true;
  void getPilotClient()?.then(client => {
   const binding = createSqlAuthoringV2({ id: actor, role, name }, {
    async rpc(operation, args, signal) {
     const keys = parameters[operation]; if (!keys || args.length > keys.length) throw Error('invalid_operation');
     const values = args.map((value, n) => ['p_document', 'p_refs'].includes(keys[n]!) && typeof value === 'string' ? JSON.parse(value) : value);
     const { data, error } = await client.schema('assess').rpc(operation, Object.fromEntries(values.map((v, n) => [keys[n]!, v]))).abortSignal(signal);
     if (error) throw error; return data;
    },
    subscribe(invalidate) {
     const { data } = client.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || session && session.user.id !== actor) { clearAuthoringBatchMemory(); invalidate(); } });
     return () => data.subscription.unsubscribe();
    },
   });
   if (active) setAdapter(binding);
  }).catch(() => { if (active) setError(true); });
  return () => { active = false; };
 }, [actor, role, name]);
 const select = useCallback((groupId: string) => setScope({ actorId: actor, groupId }), [actor]);
 const text = useMemo(() => ({ ...copy[locale], ...sqlCopy[locale], ...Object.fromEntries(['create', 'save', 'saved', 'loading', 'busy', 'reviewHint', 'limit'].map(key => [key, t(`authoringCopy.${key}`)])) }), [locale, t]);
 return <div className="min-w-0 space-y-4" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  {!scope && <h3 className="text-lg font-semibold">{t('step', { n: 1 })} · {t('chooseGroup')}</h3>}
  {error && <p role="alert">{t('unavailable')}</p>}
  {adapter && <><div hidden={!!scope}><GroupPicker adapter={adapter} actorId={actor} select={select} t={text} autoSelect/></div>{scope && <AuthoringSession adapter={adapter} scope={scope} locale={locale} text={text}/>}</>}
 </div>;
}
