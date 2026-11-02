"use client";
import {useSyncExternalStore,useEffect} from 'react';
import {useTranslations} from 'next-intl';
let limited=false;
const listeners=new Set<()=>void>();
export function reportWriteLimit(error:unknown):boolean{
 const code=error&&typeof error==='object'&&'code' in error?error.code:null;
 if(code!=='P0851'&&code!=='P0852')return false;
 limited=true;for(const fn of listeners)fn();return true;
}
export function clearWriteLimit(){limited=false;for(const fn of listeners)fn();}
export function WriteLimitNotice({identity}:{identity:string|null}){
 const t=useTranslations('rad085Disclosure');
 const show=useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>limited,()=>false);
 useEffect(()=>{if(!identity)clearWriteLimit();},[identity]);
 return identity&&show?<p role="status" className="mx-auto max-w-3xl rounded border border-line p-4">{t('writeLimit')}</p>:null;
}
