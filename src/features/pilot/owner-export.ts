// UI export orchestration only. CSV serialization and the versioned read contract stay unchanged.
import { csvFileName, exportOwnerPart, type Cursor, type OwnerFilters, type OwnerPage } from "./owner-data";
export const EXPORT_PAGE_SIZE = 1000;
export type ExportStream = "attempts" | "notes";
export type ExportState = {
  stream: ExportStream | null; filters: OwnerFilters | null; boundary: string | null; cursor: Cursor | null;
  read: number; total: number; written: number; skipped: number; files: number; parts: number;
  busy: boolean; failed: boolean; complete: boolean; multipart: boolean;
};
const EMPTY: ExportState = { stream:null,filters:null,boundary:null,cursor:null,read:0,total:0,written:0,skipped:0,files:0,parts:0,busy:false,failed:false,complete:false,multipart:false };
type Dependencies = {
  read: (stream:ExportStream,filters:OwnerFilters,cursor:Cursor|null,boundary:string|null,signal:AbortSignal)=>Promise<OwnerPage>;
  save: (name:string,csv:string)=>void;
  now?: ()=>Date;
};
/** One request and one file per click; a new start aborts and invalidates the previous request. */
export function createOwnerExport({read,save,now=()=>new Date()}:Dependencies) {
  let state=EMPTY,generation=0,active:AbortController|null=null;
  const listeners=new Set<()=>void>();
  const publish=(next:ExportState)=>{state=next;for(const listener of listeners)listener();};
  async function part(token:number,previous:ExportState) {
    if(token!==generation||!previous.stream||!previous.filters)return;
    const controller=new AbortController();active=controller;
    try {
      const page=await read(previous.stream,previous.filters,previous.cursor,previous.boundary,controller.signal);
      if(token!==generation)return;
      const csv=exportOwnerPart(previous.stream,page),count=previous.read+page.rows.length,files=previous.files+1;
      // v1 emits a cursor for an exact-full final page too. Its total avoids a needless empty file.
      const more=page.next!==null&&count<page.total,multipart=previous.multipart||more||files>1;
      const name=csvFileName(previous.stream,now());
      save(multipart?name.replace(".csv",`-part-${files}.csv`):name,csv.csv);
      if(token!==generation)return;
      publish({...previous,boundary:page.boundary,cursor:more?page.next:null,read:count,total:page.total,
        written:previous.written+csv.written,skipped:previous.skipped+csv.skipped,files,
        parts:more?Math.max(files+1,Math.ceil(page.total/EXPORT_PAGE_SIZE)):files,
        busy:false,failed:false,complete:!more,multipart});
    } catch {
      if(token===generation)publish({...previous,busy:false,failed:true});
    } finally {if(token===generation)active=null;}
  }
  return {
    getSnapshot:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    start:(stream:ExportStream,filters:OwnerFilters)=>{
      const token=++generation;active?.abort();
      const next={...EMPTY,stream,filters:{...filters},busy:true};publish(next);return part(token,next);
    },
    next:()=>{
      if(state.busy||!state.stream||!state.cursor||state.complete)return Promise.resolve();
      const previous=state,token=generation;publish({...previous,busy:true,failed:false});return part(token,previous);
    },
    dispose:()=>{generation++;active?.abort();active=null;listeners.clear();},
    report:()=>({version:1,stream:state.stream,partsSaved:state.files,boundary:state.boundary,
      filters:{participant:state.filters?.participantCode??"",exam:state.filters?.exam??"",from:state.filters?.from??"",to:state.filters?.to??""},
      utc:now().toISOString(),written:state.written,skipped:state.skipped,
      complete:state.complete&&!state.failed&&state.skipped===0,error:state.failed,
      status:"Rows read within boundary during export; not a point-in-time snapshot"}),
  };
}
