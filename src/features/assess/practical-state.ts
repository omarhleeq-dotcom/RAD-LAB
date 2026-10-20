import { AttemptController,type AttemptPort } from "./attempt-controller";
import type { PracticalSession } from "./practical-data";
/** Independent practical controller; shares the reviewed acknowledgement/command lifecycle only. */
export class PracticalRunner extends AttemptController<PracticalSession>{
  constructor(port:AttemptPort<PracticalSession>,changed:()=>void,operation=()=>crypto.randomUUID()){super(port,changed,operation,"full-practical");}
}
