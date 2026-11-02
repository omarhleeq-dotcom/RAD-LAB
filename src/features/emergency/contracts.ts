export type Phase = 1|2|3|4|5|6;
export type StopStatus = 'PENDING'|'PARTIAL'|'FAILED'|'STOPPED';
export type Receipt = {version:1;operation:string;nextPhase:number;status:StopStatus;phases:{phase:Phase;ok:boolean}[];verification:{gateClosed:boolean;loginDisabled:boolean;missingRoles:number;backendSessions:number;unheldSessions:number}|null;at:string;cloudStopVerified:false;poolerCacheVerified:false};
export type Appointment = {id:string|null;name:string|null;appointedAt:string|null;revision:number;active:boolean};
export type Audit = {id:number;at:string;action:'appoint'|'remove'|'stop';result:StopStatus|'RECORDED'};
export type OwnerSnapshot = {appointment:Appointment;audit:Audit[];next:number|null};
export type Candidate = {id:string;name:string;email:string};
export interface EmergencyPort {
 access():Promise<boolean>;
 appoint(target:string):Promise<void>;
 remove():Promise<void>;
 owner(after?:number|null):Promise<OwnerSnapshot>;
 start(operation:string):Promise<Receipt>;
 phase(operation:string,phase:Phase):Promise<Receipt>;
 receipt(operation:string):Promise<Receipt|null>;
}
export class EmergencyError extends Error {
 constructor(readonly kind:'denied'|'rejected'|'unknown') {super(kind);}
}
export const validOperation=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
/** Aggregate response validation fails closed; raw server errors are never UI text. */
export function parseReceipt(value:unknown):Receipt {
 if(!value||typeof value!=='object')throw new EmergencyError('unknown');
 const r=value as Receipt,v=r.verification;
 if(r.version!==1||!validOperation(r.operation)||!Number.isInteger(r.nextPhase)||r.nextPhase<1||r.nextPhase>7
  ||!['PENDING','PARTIAL','FAILED','STOPPED'].includes(r.status)||!Array.isArray(r.phases)||r.phases.length!==r.nextPhase-1
  ||r.phases.some((p,i)=>p.phase!==i+1||typeof p.ok!=='boolean')||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at))
  ||r.cloudStopVerified!==false||r.poolerCacheVerified!==false)throw new EmergencyError('unknown');
 if(v!==null&&(!v||typeof v.gateClosed!=='boolean'||typeof v.loginDisabled!=='boolean'||[v.missingRoles,v.backendSessions,v.unheldSessions].some(n=>!Number.isSafeInteger(n)||n<0)))throw new EmergencyError('unknown');
 if(r.status==='STOPPED'&&(r.nextPhase!==7||r.phases.some(p=>!p.ok)||!v||!v.gateClosed||!v.loginDisabled||v.backendSessions!==0||v.unheldSessions!==0))throw new EmergencyError('unknown');
 return r;
}
