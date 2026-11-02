import {EmergencyError,type EmergencyPort,type Phase,type Receipt} from './contracts';
export type StopState={operation:string|null;receipt:Receipt|null;busy:boolean;issue:'denied'|'rejected'|'unknown'|null};
const initial=():StopState=>({operation:null,receipt:null,busy:false,issue:null});
/** Finite six-request containment sequence. No service resume, storage or polling. */
export class StopController {
 state=initial();private generation=0;
 constructor(private port:EmergencyPort,private changed:()=>void,private uuid=()=>crypto.randomUUID()){}
 clear(notify=true){this.generation++;this.state=initial();if(notify)this.changed();}
 async start(){if(this.state.busy)return;this.state={...initial(),operation:this.uuid()};await this.continue();}
 async continue(){
  if(this.state.busy||!this.state.operation||this.state.receipt?.nextPhase===7)return;
  const operation=this.state.operation;
  const generation=this.generation,current=()=>generation===this.generation;
  this.state={...this.state,busy:true,issue:null};this.changed();
  try{
   const existing=await this.port.receipt(operation);
   if(!current())return;
   let receipt=existing??await this.port.start(operation);
   if(!current())return;
   this.state={...this.state,operation:receipt.operation,receipt};this.changed();
   while(receipt.nextPhase<=6){
    const previous=receipt;
    receipt=await this.port.phase(previous.operation,previous.nextPhase as Phase);
    if(receipt.operation!==previous.operation||receipt.nextPhase!==previous.nextPhase+1)throw new EmergencyError('unknown');
    if(!current())return;
    this.state={...this.state,receipt};this.changed();
   }
  }catch(error){
   if(!current())return;
   const issue=error instanceof EmergencyError?error.kind:'unknown';
   this.state=issue==='denied'?{...initial(),issue}:{...this.state,issue};this.changed();
  }finally{if(current()){this.state={...this.state,busy:false};this.changed();}}
 }
}
