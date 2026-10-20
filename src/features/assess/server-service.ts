/** Node service ports. The user client must be bound by a verified JWT; never use a service/admin key for it.
 * All user calls are enforced again by SQL's auth.uid(). Worker capability is separate and never sent to the browser.
 * No HTTP server or production credential/scheduler is installed by this module.
 */
import type { AttemptCommand } from "./contracts";
import { FOUNDATION_LIMITS } from "./policies";
import { validatePublication } from "./server-validation";
import { gradePublication } from "./server-grader";

export interface AssessRpc {
  call<T>(name:string,args:Record<string,unknown>):Promise<T>;
}
export class AssessServiceError extends Error {
  readonly code:string;
  constructor(code:string) {super(code);this.name="AssessServiceError";this.code=code;}
}
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
async function safe<T>(fn:()=>Promise<T>):Promise<T> {
  try{return await fn();}catch(error){
    // Do not expose SQL messages, error bodies, submitted settings, identity or key material.
    const code=typeof error==="object"&&error!==null&&"code" in error?String(error.code):"";
    throw new AssessServiceError(({"42501":"denied","40001":"conflict","22023":"invalid","54000":"limit","55000":"unavailable"} as Record<string,string>)[code]??"unavailable");
  }
}
export function attemptService(user:AssessRpc) {
  return {
    start(assignment:string,operation:string) {if(!uuid(assignment)||!uuid(operation))throw new AssessServiceError("invalid");return safe(()=>user.call("start_v1",{p_assignment:assignment,p_operation:operation}));},
    read(attempt:string) {if(!uuid(attempt))throw new AssessServiceError("invalid");return safe(()=>user.call("read_session_v1",{p_session:attempt}));},
    result(attempt:string) {if(!uuid(attempt))throw new AssessServiceError("invalid");return safe(()=>user.call("result_v1",{p_session:attempt}));},
    command(raw:string) {
      if(Buffer.byteLength(raw)>FOUNDATION_LIMITS.commandBytes)throw new AssessServiceError("invalid");
      let c:AttemptCommand;
      try {
        c=JSON.parse(raw);
        if(!c||Object.keys(c).some(k=>!["schemaVersion","attemptId","operationId","expectedRevision","action"].includes(k))||c.schemaVersion!==1||!uuid(c.attemptId)||!uuid(c.operationId)||!Number.isSafeInteger(c.expectedRevision)||c.expectedRevision<0||!c.action||typeof c.action!=="object")throw new Error();
      }catch{throw new AssessServiceError("invalid");}
      return safe(()=>user.call("command_v1",{p_session:c.attemptId,p_operation:c.operationId,p_revision:c.expectedRevision,p_action:c.action}));
    },
  };
}
/** User-bound administrative/self-service commands; SQL rechecks identity and ownership.
 * No worker capability is accepted here. Disable is one-way in this local package.
 */
export function retentionService(user:AssessRpc) {
  return {
    close(assignment:string) {if(!uuid(assignment))throw new AssessServiceError("invalid");return safe(()=>user.call("close_assignment_v1",{p_assignment:assignment}));},
    disable(account:string) {if(!uuid(account))throw new AssessServiceError("invalid");return safe(()=>user.call("disable_account_v1",{p_user:account}));},
  };
}
export function publicationService(worker:AssessRpc) {
  return { async install(version:string,document:unknown) {
    if(!uuid(version))throw new AssessServiceError("invalid");
    const {publication,specs}=validatePublication(document);
    await safe(()=>worker.call("install_publication_v1",{p_version:version,p_document:publication,p_specs:specs}));
  }};
}
interface GradingClaim {
  attemptId:string;token:string;
  publication:Parameters<typeof gradePublication>[0];
  answers:Parameters<typeof gradePublication>[1];locked:string[];
}
/** One bounded tick for a scheduler. No student response or logs contain the private claim/grade.
 * At-least-once execution is safe: DB lease/token prevents stale finalisation and SQL commits grade+deletion atomically.
 */
export async function runAssessJobs(worker:AssessRpc,limit=50,signal?:AbortSignal) {
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new AssessServiceError("invalid");
  // Stop cooperatively: never cancel an in-flight RPC or abandon its acknowledgement.
  // A process killed outright still relies on SQL lease expiry/recovery, not this signal.
  if(signal?.aborted)throw new AssessServiceError("stopped");
  const maintenance=await safe(()=>worker.call<{expired:number;purged:number;reservationsPurged?:number;consentsPurged?:number}>("maintain_v1",{p_limit:limit}));
  let graded=0,failed=0;
  for(let i=0;i<limit;i++) {
    if(signal?.aborted)break;
    const claim=await safe(()=>worker.call<GradingClaim|null>("claim_v1",{}));if(!claim)break;
    try {
      const grade=gradePublication(claim.publication,claim.answers,claim.locked);
      await worker.call("finish_v1",{p_session:claim.attemptId,p_token:claim.token,p_n:grade.numerator,p_d:grade.denominator});graded++;
    } catch {
      // A lost finalize acknowledgement can mean commit succeeded: fail only under a still-current claim.
      try {await worker.call("fail_v1",{p_session:claim.attemptId,p_token:claim.token});}catch{/* Counts/health, not raw error text, drive operational recovery. */}
      failed++;
    }
  }
  const health=await safe(()=>worker.call<{failed:number;alert:number;overdue:number;purgeDue:number}>("health_v1",{}));
  return {maintenance,graded,failed,health};
}
