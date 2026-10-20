/** One in-memory controller per authenticated account. No Practice store, storage, logs or score computation. */
import type { AttemptCommand, ItemAnswer } from "./contracts";
import { RunnerError } from "./runner-data";
import type { AssessmentVersion, AttemptAcknowledgement } from "./contracts";
import type { ItemView } from "./presentation";
export interface RunnerSession { attemptId:string; ack:AttemptAcknowledgement; assessment?:AssessmentVersion; answers?:Record<string,ItemAnswer>; views?:Record<string,ItemView> }
export interface AttemptPort<S extends RunnerSession> { read(attempt:string):Promise<S>; command(command:AttemptCommand):Promise<void> }
export class AttemptController<S extends RunnerSession> {
  session:S|null=null;
  drafts:Record<string,ItemAnswer>=Object.create(null);
  index=0;
  busy=false;
  issue:string|null=null;
  pending:AttemptCommand|null=null;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private stopped=false;
  constructor(private port:AttemptPort<S>,private changed:()=>void,private operation=()=>crypto.randomUUID(),private track:AssessmentVersion["track"]="mixed"){}
  dispose(){this.stopped=true;clearTimeout(this.timer);this.drafts=Object.create(null);this.session=null;this.pending=null;}
  private emit(){if(!this.stopped)this.changed();}
  private accept(s:S){if(s.assessment&&s.assessment.track!==this.track)throw new RunnerError("invalid");if(this.stopped)return;this.session=s;this.drafts=structuredClone(s.answers??{});this.index=Math.min(this.index,(s.assessment?.items.length??1)-1);}
  async open(attempt:string) {this.stopped=false;this.busy=true;this.emit();try{this.accept(await this.port.read(attempt));this.issue=null;}catch(e){this.fail(e);}finally{this.busy=false;this.emit();}}
  edit(id:string,answer:ItemAnswer){
    if(this.busy||this.issue||this.pending||this.session?.ack.state!=="active"||this.session.ack.lockedItemIds.includes(id))return;
    const item=this.session.assessment?.items.find(i=>i.ref.id===id);if(!item||item.type!==answer.type)return;
    this.drafts={...this.drafts,[id]:structuredClone(answer)};clearTimeout(this.timer);this.timer=setTimeout(()=>{void this.flush();},600);this.emit();
  }
  get dirty(){return !!this.session&&JSON.stringify(this.drafts)!==JSON.stringify(this.session.answers??{});}
  get unresolved(){return this.session?.assessment?.items.filter(i=>i.type!=="single-choice"?!this.session!.ack.lockedItemIds.includes(i.ref.id):!(this.drafts[i.ref.id]?.type==="single-choice"&&(this.drafts[i.ref.id] as {optionId:string|null}).optionId)).length??0;}
  private fail(e:unknown){this.issue=e instanceof RunnerError?e.code:"network";if(this.issue==="denied"){this.session=null;this.drafts=Object.create(null);this.pending=null;}}
  private async send(action:AttemptCommand["action"]){
    if(!this.session||this.busy||this.issue||this.pending||this.session.ack.state!=="active")return false;
    clearTimeout(this.timer);
    const c:AttemptCommand={schemaVersion:1,attemptId:this.session.attemptId,operationId:this.operation(),expectedRevision:this.session.ack.revision,action:structuredClone(action)};
    this.pending=c;this.busy=true;this.emit();
    try{const drafts=this.drafts;await this.port.command(c);this.accept(await this.port.read(c.attemptId));if(this.session?.ack.state==="active")for(const [id,answer] of Object.entries(drafts))if(id!==((action.type==="save"||action.type==="expose")?action.item.id:"")&&!this.session.ack.lockedItemIds.includes(id))this.drafts[id]=answer;this.pending=null;return this.session?.ack.state==="active"||action.type==="submit";}
    catch(e){this.fail(e);return false;}finally{this.busy=false;this.emit();}
  }
  async flush(){
    if(this.busy||this.issue||this.pending)return false;
    const s=this.session;if(!s||s.ack.state!=="active")return false;
    for(const item of s.assessment!.items){const answer=this.drafts[item.ref.id];if(answer&&JSON.stringify(answer)!==JSON.stringify(this.session?.answers?.[item.ref.id])){
      if(!await this.send({type:"save",item:item.ref,answer}))return false;
    }}return true;
  }
  async navigate(index:number){if(!Number.isInteger(index)||index<0||index>=(this.session?.assessment?.items.length??0))return;if(await this.flush()){this.index=index;this.emit();}}
  async expose(){
    const item=this.session?.assessment?.items[this.index];if(!item||item.type==="single-choice"||this.session!.ack.lockedItemIds.includes(item.ref.id)||!await this.flush())return;
    const answer=this.drafts[item.ref.id]??{type:item.type,values:this.session!.views![item.ref.id]!.initial};
    if(answer.type!==item.type)return;
    await this.send({type:"expose",item:item.ref,answer});
  }
  async submit(){if(await this.flush())await this.send({type:"submit"});}
  /** Explicit reconciliation. Conflict discards stale drafts; uncertain request retries byte-identical after reading. */
  async recover(){
    if(this.busy||!this.session)return;
    clearTimeout(this.timer);this.busy=true;this.emit();const c=this.pending,conflict=this.issue==="conflict";
    try {
      const fresh=await this.port.read(this.session.attemptId);this.accept(fresh);
      if(c&&!conflict&&fresh.ack.state==="active") {await this.port.command(c);this.accept(await this.port.read(c.attemptId));}
      this.pending=null;this.issue=null;
    }catch(e){this.fail(e);}finally{this.busy=false;this.emit();}
  }
}
