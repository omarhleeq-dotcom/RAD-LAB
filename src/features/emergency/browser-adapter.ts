import {getPilotClient} from '../pilot/client';
import {EmergencyError,parseReceipt,validOperation,type EmergencyPort,type OwnerSnapshot} from './contracts';
/** Loaded only behind the reviewed literal availability guard. No actor from input. */
export async function bindEmergency():Promise<EmergencyPort> {
 const client=await getPilotClient();if(!client)throw new EmergencyError('unknown');
 return createEmergencyPort(async(name,args)=>{const result=await client.rpc(name,args);if(result.error)throw result.error;return result.data;});
}
export function createEmergencyPort(call:(name:string,args:Record<string,unknown>)=>Promise<unknown>):EmergencyPort {
 async function rpc(name:string,args:Record<string,unknown>={}) {
  try{return await call(name,args);}catch(error){
   const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
   // Timeout/lock/deadlock/transport failures may follow partial nontransactional
   // backend termination; never claim a definite absence of effects.
   throw new EmergencyError(code==='42501'?'denied':code&& !['57014','55P03','40P01','08006'].includes(code)?'rejected':'unknown');
  }
 }
 const operation=(id:string)=>{if(!validOperation(id))throw new EmergencyError('rejected');return id;};
 return {
  async access(){return (await rpc('emergency_access_v1'))===true;},
  async appoint(target){await rpc('emergency_alternate_set_v1',{p_target:operation(target)});},
  async remove(){await rpc('emergency_alternate_remove_v1');},
  async owner(after=null){
   const value=await rpc('emergency_alternate_read_v1',{p_after:after,p_limit:20}) as OwnerSnapshot;
   if(!value||!value.appointment||!Array.isArray(value.audit)||value.audit.length>20||!Number.isSafeInteger(value.appointment.revision)
    ||value.audit.some(row=>!Number.isSafeInteger(row.id)||!['appoint','remove','stop'].includes(row.action)||!['RECORDED','PENDING','PARTIAL','FAILED','STOPPED'].includes(row.result)||!Number.isFinite(Date.parse(row.at))))throw new EmergencyError('unknown');
   return value;
  },
  async start(id){return parseReceipt(await rpc('emergency_stop_v1',{p_operation:operation(id)}));},
  async phase(id,phase){if(!Number.isInteger(phase)||phase<1||phase>6)throw new EmergencyError('rejected');return parseReceipt(await rpc('emergency_stop_phase_v1',{p_operation:operation(id),p_phase:phase}));},
  async receipt(id){const value=await rpc('emergency_stop_receipt_v1',{p_operation:operation(id)});return value===null?null:parseReceipt(value);},
 };
}
