export interface JournalEvent { sequence:number;operation:string;action:string;target:string;at:string;previous:string;mac:string }
export interface Head {sequence:number;mac:string}
export interface Journal {genesis:string;event(previous:Head,input:Omit<JournalEvent,'sequence'|'previous'|'mac'>):JournalEvent;verify(event:JournalEvent):boolean}
export function syntheticJournal(key:Uint8Array):Journal;
export interface RecoveryPorts {
 quarantine():Promise<boolean>;revokeAll():Promise<boolean>;seal():Promise<Head>;
 page(after:number,limit:number):Promise<JournalEvent[]>;apply(event:JournalEvent):Promise<boolean>;verify(event:JournalEvent):Promise<boolean>;
 maintainAndVerify():Promise<boolean>;verifyRevoked():Promise<boolean>;latest():Promise<Head>;
}
export function reconcileSynthetic(options:{contract:string;journal:Journal;ports:RecoveryPorts;pageSize?:number;maxEvents?:number}):Promise<Readonly<{contract:string;status:'synthetic-verified';sequence:number;mac:string}>>;
export function openSyntheticRecoveryEvidence():Promise<Readonly<{
 journal:Journal;prepare(input:Omit<JournalEvent,'sequence'|'previous'|'mac'>):void;
 complete(operation:string,verified:boolean):JournalEvent;head():Head;page(after:number,limit:number):JournalEvent[];close():void;
}>>;
