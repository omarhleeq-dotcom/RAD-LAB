import type {SupabaseClient} from '@supabase/supabase-js';
import {ASSESS_WRITTEN_CONSENT_VERSION} from './review-availability';
export async function writtenConsent(client:SupabaseClient,accept=false):Promise<boolean>{
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
 try{
  const {data,error}=await client.schema('assess').rpc('consent_v3',{p_version:accept?ASSESS_WRITTEN_CONSENT_VERSION:null}).abortSignal(c.signal);
  if(error||!data||typeof data.accepted!=='boolean'||Object.keys(data).join()!=='accepted')throw new Error('Consent unavailable');
  return data.accepted;
 }finally{clearTimeout(timer);}
}
