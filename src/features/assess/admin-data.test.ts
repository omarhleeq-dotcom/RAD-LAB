import { createClient } from "@supabase/supabase-js";
import { expect,it } from "vitest";
import { parseAdminPage,readAssessAdmin,writeAssessAdmin } from "./admin-data";
const id="00000000-0000-0000-0000-000000000001";
it("uses only the Assess schema RPC, bounded pages and explicit version/revision inputs",async()=>{
  const requests:{name:string;schema:string|null;args:Record<string,unknown>}[]=[];
  const client=createClient("https://synthetic.supabase.co","public-test-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    const name=String(input).split("/").at(-1)!;
    requests.push({name,schema:new Headers(init?.headers).get("Content-Profile"),args:JSON.parse(String(init?.body))});
    return new Response(JSON.stringify(name==="owner_page_v1"?{version:1,rows:[],next:null}:name==="targets_write_v1"?2:id),{status:200,headers:{"content-type":"application/json"}});
  }}});
  await readAssessAdmin(client,"people",null,"Name",id);
  await writeAssessAdmin(client,{type:"assign",version:id,users:[id],groups:[]});
  await writeAssessAdmin(client,{type:"targets",assignment:id,revision:1,users:[id],add:false});
  expect(requests).toEqual([
    {name:"owner_page_v1",schema:"assess",args:{p_kind:"people",p_context:null,p_search:"Name",p_after:id,p_limit:20}},
    {name:"assign_v1",schema:"assess",args:{p_version:id,p_users:[id],p_groups:[]}},
    {name:"targets_write_v1",schema:"assess",args:{p_assignment:id,p_revision:1,p_users:[id],p_add:false}},
  ]);
});
it("rejects malformed pages, unsupported tracks and inconsistent cursors; sanitises schema/permission/conflict failures",async()=>{
  expect(parseAdminPage({version:1,rows:[{id,name:null,email:"x@example.test",status:"pending"}],next:id},"people").rows).toHaveLength(1);
  for(const raw of [{version:2,rows:[],next:null},{version:1,rows:[],next:id},{version:1,rows:[{id,name:"X",track:"future",version:"1"}],next:null}])
    expect(()=>parseAdminPage(raw,"versions")).toThrow();
  for(const [code,kind] of [["PGRST106","schema"],["42501","denied"],["40001","conflict"],["23505","conflict"],["22023","invalid"]]) {
    const client=createClient("https://synthetic.supabase.co","test-key",{auth:{persistSession:false},global:{fetch:async()=>new Response(JSON.stringify({code,message:"private server text"}),{status:400,headers:{"content-type":"application/json"}})}});
    await expect(readAssessAdmin(client,"groups")).rejects.toMatchObject({kind,message:"Assess administration unavailable"});
  }
});
