/** One in-memory controller per authenticated account. No Practice store, storage, logs or score computation. */
import type { AttemptCommand, ItemAnswer } from "./contracts";
import { RunnerError, type MixedSession, type RunnerPort } from "./runner-data";
export class MixedRunner {
  session:MixedSession|null=null;
  drafts:Record<string,ItemAnswer>=Object.create(null);
  index=0;
  busy=false;
  issue:string|null=null;
  pending:AttemptCommand|null=null;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private stopped=false;
  constructor(private port:RunnerPort,private changed:()=>void,private operation=()=>crypto.randomUUID()){}
  dispose(){this.stopped=true;clearTimeout(this.timer);this.drafts=Object.create(null);this.session=null;this.pending=null;}
  private emit(){if(!this.stopped)this.changed();}
  private accept(s:MixedSession){if(this.stopped)return;this.session=s;this.drafts=structuredClone(s.answers??{});this.index=Math.min(this.index,(s.assessment?.items.length??1)-1);}
  async open(attempt:string) {this.stopped=false;this.busy=true;this.emit();try{this.accept(await this.port.read(attempt));this.issue=null;}catch(e){this.fail(e);}finally{this.busy=false;this.emit();}}
  edit(id:string,answer:ItemAnswer){
    if(this.busy||this.issue||this.pending||this.session?.ack.state!=="active"||this.session.ack.lockedItemIds.includes(id))return;
    this.drafts={...this.drafts,[id]:answer};clearTimeout(this.timer);this.timer=setTimeout(()=>{void this.flush();},600);this.emit();
  }
  get dirty(){return !!this.session&&JSON.stringify(this.drafts)!==JSON.stringify(this.session.answers??{});}
  get unresolved(){return this.session?.assessment?.items.filter(i=>i.type==="simulator-part"?!this.session!.ack.lockedItemIds.includes(i.ref.id):!(this.drafts[i.ref.id]?.type==="single-choice"&&(this.drafts[i.ref.id] as {optionId:string|null}).optionId)).length??0;}
  private fail(e:unknown){this.issue=e instanceof RunnerError?e.code:"network";if(this.issue==="denied"){this.session=null;this.drafts=Object.create(null);this.pending=null;}}
  private async send(action:AttemptCommand["action"]){
    if(!this.session||this.busy||this.issue||this.pending||this.session.ack.state!=="active")return false;
    clearTimeout(this.timer);
    const c:AttemptCommand={schemaVersion:1,attemptId:this.session.attemptId,operationId:this.operation(),expectedRevision:this.session.ack.revision,action:structuredClone(action)};
    this.pending=c;this.busy=true;this.emit();
    try{await this.port.command(c);this.accept(await this.port.read(c.attemptId));this.pending=null;return true;}
    catch(e){this.fail(e);return false;}finally{this.busy=false;this.emit();}
  }
  async flush(){
    if(this.busy||this.issue||this.pending)return false;
    const s=this.session;if(!s||s.ack.state!=="active")return false;
    for(const item of s.assessment!.items){const answer=this.drafts[item.ref.id];if(answer&&JSON.stringify(answer)!==JSON.stringify(this.session?.answers?.[item.ref.id])){
      if(!await this.send({type:"save",item:item.ref,answer}))return false;
    }}return true;
  }
  async navigate(index:number){if(await this.flush()){this.index=index;this.emit();}}
  async expose(){
    const item=this.session?.assessment?.items[this.index];if(!item||item.type!=="simulator-part"||!await this.flush())return;
    const answer=this.drafts[item.ref.id]??{type:"simulator-part",values:this.session!.views![item.ref.id]!.initial};
    if(answer.type!=="simulator-part")return;
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
