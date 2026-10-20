import {ASSESS_RETENTION_CONSENT_VERSION} from "./retention-consent";
import {expect,it,vi} from "vitest";
import {assessConsent,historyPage,parseHistoryPage} from "./history-data";
import type {SupabaseClient} from "@supabase/supabase-js";
const row={name:"Synthetic label",track:"mixed",submittedAt:"2026-08-31T23:59:59.000Z",grade:{visibility:"hidden"}};
it("accepts only the four-field result whitelist and fails closed on leaked or malformed grades",()=>{
 expect(parseHistoryPage({rows:[row,{...row,track:"full-practical",grade:{visibility:"shown",earned:"1.25",maximum:"10.00"}}],next:null}).rows).toHaveLength(2);
 for(const r of [{...row,answers:{}},{...row,attempt:1},{...row,grade:{visibility:"hidden",earned:"10.00"}},{...row,grade:{visibility:"shown",earned:"11.00",maximum:"10.00"}},{...row,grade:{visibility:"shown",earned:"1.00",maximum:"10.00",criteria:[]}},{...row,submittedAt:"2026-02-30T00:00:00.000Z"},{...row,track:"unknown"}])expect(()=>parseHistoryPage({rows:[r],next:null})).toThrow();
 for(const raw of [null,{rows:Array(101).fill(row),next:null},{rows:[],next:"not-a-cursor"},{rows:[],next:null,score:100}])expect(()=>parseHistoryPage(raw)).toThrow();
});
it("uses bounded Assess RPCs, explicit consent version, sanitized failures and no implicit acceptance",async()=>{
 const abortSignal=vi.fn().mockResolvedValue({data:{rows:[row],next:null},error:null}),rpc=vi.fn(()=>({abortSignal})),schema=vi.fn(()=>({rpc})),c={schema} as unknown as SupabaseClient;
 expect((await historyPage(c)).rows).toEqual([row]);expect(schema).toHaveBeenCalledWith("assess");expect(rpc).toHaveBeenLastCalledWith("history_page_v1",{p_after:null,p_limit:20});
 abortSignal.mockResolvedValue({data:{accepted:false},error:null});expect(await assessConsent(c)).toBe(false);expect(rpc).toHaveBeenLastCalledWith("consent_v2",{p_version:null});
 abortSignal.mockResolvedValue({data:{accepted:true},error:null});expect(await assessConsent(c,true)).toBe(true);expect(rpc).toHaveBeenLastCalledWith("consent_v2",{p_version:ASSESS_RETENTION_CONSENT_VERSION});
 abortSignal.mockResolvedValue({data:null,error:{message:"private details"}});await expect(historyPage(c)).rejects.toThrow("Assess history unavailable");
 await expect(historyPage(c,"bad")).rejects.toThrow();
});
