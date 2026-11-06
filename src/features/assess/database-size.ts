/** Aggregate monitoring only; no credentials, RPC, connection or background job. */
import { sizeSignal } from '../../../scripts/assess/database-size.mjs';
export function databaseSizeMonitor(rawLimit: unknown) {
 const limit=typeof rawLimit==='string'&&/^[1-9][0-9]{0,15}$/.test(rawLimit)?Number(rawLimit):NaN;
 const valid=Number.isSafeInteger(limit)&&limit>0;
 let measured: ReturnType<typeof sizeSignal> | undefined;
 let reason=valid?'sample_missing':'plan_limit_unknown';
 return {
  enabled:valid,
  observe(raw:unknown) {
   if(!valid)return;
   const n=typeof raw==='string'&&/^(0|[1-9][0-9]{0,15})$/.test(raw)?Number(raw):NaN;
   if(!Number.isSafeInteger(n)||n<0){measured=undefined;reason='sample_invalid';return;}
   measured=sizeSignal(n,limit);
  },
  report() { return measured?{state:'MEASURED' as const,...measured}:{state:'UNKNOWN' as const,reason}; },
 };
}
