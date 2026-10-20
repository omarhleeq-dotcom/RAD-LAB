import { AttemptController } from "./attempt-controller";
import type { MixedSession, RunnerPort } from "./runner-data";
/** Mixed track keeps its own parser, port and presentation. */
export class MixedRunner extends AttemptController<MixedSession> {
  constructor(port:RunnerPort,changed:()=>void,operation=()=>crypto.randomUUID()){super(port,changed,operation,"mixed");}
}
