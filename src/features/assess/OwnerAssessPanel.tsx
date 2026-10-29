"use client";
import { OwnerDirectory } from "@/features/pilot/OwnerDirectory";
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { OwnerContentPanel } from "./OwnerContentPanel";
import { OwnerAssignments } from "./OwnerAssignments";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getPilotClient } from "@/features/pilot/client";
import { AssessAdminError, readAssessAdmin, writeAssessAdmin, type AdminCommand, type AdminKind, type AdminPage, type AdminRow } from "./admin-data";

const button="min-w-0 max-w-full break-words rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:opacity-60";
const input="block w-full rounded-md border border-line bg-panel p-2";

function usePage(kind:AdminKind,context:string|null,search:string,revision:number) {
  const scope=JSON.stringify([kind,context,search,revision]);
  const [position,setPosition]=useState<{scope:string;after:string|null}>({scope,after:null});
  // Reset when the query changes, including a return to a previously visited filter/context.
  if(position.scope!==scope)setPosition({scope,after:null});
  const after=position.scope===scope?position.after:null;
  const key=JSON.stringify([scope,after]);
  const [data,setData]=useState<{key:string;page?:AdminPage;error?:AssessAdminError["kind"]}>({key:""});
  const enabled=!(kind==="members"||kind==="targets")||context!==null;
  useEffect(()=>{
    if(!enabled) return;
    let ignore=false;
    void Promise.resolve(getPilotClient()).then(client=>{
      if(!client) throw new AssessAdminError("error");
      return readAssessAdmin(client,kind,context,search,after);
    }).then(page=>{if(!ignore)setData({key,page});}).catch(error=>{
      if(!ignore)setData({key,error:error instanceof AssessAdminError?error.kind:"error"});
    });
    return ()=>{ignore=true;};
  },[kind,context,search,after,key,enabled]);
  return {page:enabled&&data.key===key?data.page:undefined,error:enabled&&data.key===key?data.error:undefined,
    loading:enabled&&(data.key!==key),first:()=>setPosition({scope,after:null}),next:()=>setPosition({scope,after:data.page?.next??null})};
}
type PageState=ReturnType<typeof usePage>;
function Rows({title,data,children}:{title:string;data:PageState;children:(row:AdminRow)=>React.ReactNode}) {
  const t=useTranslations("assessAdmin");
  return <section className="min-w-0 rounded-lg border border-line p-3" aria-label={title}>
    <h4 className="font-semibold">{title}</h4>
    {data.loading&&<p role="status">{t("loading")}</p>}
    {data.error&&<p role="alert" className="mt-2 text-bad">{t(`errors.${data.error}`)}</p>}
    {data.page?.rows.length===0&&<p className="mt-2 text-sm text-muted">{t("empty")}</p>}
    <ul className="my-3 space-y-2">{data.page?.rows.map(row=><li key={row.id} className="break-words">{children(row)}</li>)}</ul>
    <div className="flex flex-wrap gap-2"><button className={button} onClick={data.first}>{t("first")}</button>
      <button className={button} disabled={!data.page?.next} onClick={data.next}>{t("next")}</button></div>
  </section>;
}
function Person({row}:{row:AdminRow}) {
  const t=useTranslations("assessAdmin");
  return <span className="min-w-0 flex-1 break-words"><span className="font-medium">{row.name||t("unnamed")}</span>
    <span className="block text-sm text-muted" dir="ltr">{row.email}</span><span className="text-sm text-muted">{t(row.status!)}</span></span>;
}
function toggle(list:string[],id:string) {return list.includes(id)?list.filter(x=>x!==id):list.length<100?[...list,id]:list;}

function Administration() {
  const t=useTranslations("assessAdmin");
  const [revision,setRevision]=useState(0);
  const [people,setPeople]=useState<string[]>([]);
  const [selectedGroups,setSelectedGroups]=useState<string[]>([]);
  const [group,setGroup]=useState<AdminRow|null>(null);
  const [groupName,setGroupName]=useState("");
  const [version,setVersion]=useState<AdminRow|null>(null);
  const [assignment,setAssignment]=useState<AdminRow|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<"saved"|AssessAdminError["kind"]|null>(null);
  const groups=usePage("groups",null,"",revision);
  const members=usePage("members",group?.id??null,"",revision), versions=usePage("versions",null,"",revision);
  const assignments=usePage("assignments",null,"",revision),targets=usePage("targets",assignment?.id??null,"",revision);
  async function write(command:AdminCommand) {
    setBusy(true);setMessage(null);
    try {
      const client=await getPilotClient();if(!client)throw new AssessAdminError("error");
      const result=await writeAssessAdmin(client,command);
      if(command.type==="targets"&&typeof result==="number")setAssignment(current=>current?{...current,revision:result}:null);
      if(command.type==="group") {
        if(command.remove) {setSelectedGroups(current=>current.filter(id=>id!==command.id));setGroup(null);setGroupName("");}
        else {setGroup({id:String(result),name:command.name});setGroupName(command.name??"");}
      }
      if(command.type==="assign") {setPeople([]);setSelectedGroups([]);}
      setRevision(n=>n+1);setMessage("saved");
    } catch(error) {
      const kind=error instanceof AssessAdminError?error.kind:"error";
      setMessage(kind);
      if(kind==="conflict") {setAssignment(null);setRevision(n=>n+1);}
    } finally {setBusy(false);}
  }
  return <div className="mt-4 space-y-5" data-testid="assess-admin">
    <ResultDisclosure title="ⓘ" label={t("title")}><p className="text-sm text-muted">{t("intro")}</p></ResultDisclosure>
    {message&&<p role={message==="saved"?"status":"alert"} className={message==="saved"?"text-ok":"text-bad"}>{message==="saved"?t("saved"):t(`errors.${message}`)}</p>}
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <legend className="sr-only">{t("title")}</legend>
      <div className="flex flex-wrap items-center gap-2"><button className={button} onClick={()=>setRevision(n=>n+1)}>{t("refresh")}</button>
        <span className="text-sm">{t("selected",{people:people.length,groups:selectedGroups.length})}</span>
        <button className={button} onClick={()=>{setPeople([]);setSelectedGroups([]);}}>{t("clear")}</button></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <OwnerDirectory revision={revision} picker selected={people} onSelect={p=>setPeople(current=>toggle(current,p.userId))}/>
        <div className="min-w-0 space-y-3">
          <Rows title={t("groups")} data={groups}>{row=><div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-0 items-center gap-2"><input className="size-5 shrink-0" type="checkbox" checked={selectedGroups.includes(row.id)} disabled={!selectedGroups.includes(row.id)&&selectedGroups.length>=100} onChange={()=>setSelectedGroups(current=>toggle(current,row.id))}/>{row.name}</label>
            <button className={button} onClick={()=>{setGroup(row);setGroupName(row.name??"");}}>{t("editGroup",{name:row.name??""})}</button></div>}</Rows>
          <form className="space-y-2" onSubmit={e=>{e.preventDefault();void write({type:"group",id:group?.id??null,name:groupName});}}>
            <label className="block text-sm">{t("groupName")}<input className={input} required maxLength={100} value={groupName} onChange={e=>setGroupName(e.target.value)}/></label>
            <div className="flex flex-wrap gap-2"><button className={button} type="submit" disabled={!groupName.trim()}>{group?t("rename"):t("createGroup")}</button>
              <button className={button} type="button" onClick={()=>{setGroup(null);setGroupName("");}}>{t("newGroup")}</button>
              {group&&<button className={button} type="button" onClick={()=>{if(window.confirm(t("confirmDelete")))void write({type:"group",id:group.id,name:null,remove:true});}}>{t("deleteGroup")}</button>}</div>
          </form>
        </div>
      </div>
      {group&&<section className="space-y-3" aria-label={t("membership")}><h3 className="font-semibold">{t("groupMembers",{name:group.name??""})}</h3>
        <button className={button} disabled={!people.length} onClick={()=>void write({type:"members",group:group.id,users:people,add:true})}>{t("addMembers")}</button>
        <Rows title={t("members")} data={members}>{row=><div className="flex items-start justify-between gap-2"><Person row={row}/><button className={button} aria-label={t("removePerson",{name:row.name||t("unnamed")})} onClick={()=>void write({type:"members",group:group.id,users:[row.id],add:false})}>{t("remove")}</button></div>}</Rows>
      </section>}
      <section className="space-y-3" aria-label={t("assignment")}><h3 className="text-lg font-semibold">{t("assignment")}</h3>
        <ResultDisclosure title="ⓘ" label={t("assignment")}><p className="text-sm text-muted">{t("assignmentHelp")}</p></ResultDisclosure>
        <Rows title={t("versions")} data={versions}>{row=><label className="flex items-center gap-2"><input type="radio" name="assess-version" className="size-5" checked={version?.id===row.id} onChange={()=>setVersion(row)}/>{row.name} — {row.version} ({t(row.track!)})</label>}</Rows>
        {version&&<p>{t("chosenVersion",{name:version.name??"",version:version.version??""})}</p>}
        <button className={button} disabled={!version||(!people.length&&!selectedGroups.length)} onClick={()=>{if(version&&window.confirm(t("confirmAssign")))void write({type:"assign",version:version.id,users:people,groups:selectedGroups});}}>{t("publishAssignment")}</button>
        <Rows title={t("assignments")} data={assignments}>{row=><button className={button} onClick={()=>setAssignment(row)}>{t("manageTargets",{name:row.name??"",version:row.version??""})}</button>}</Rows>
      </section>
      {assignment&&<section className="space-y-3" aria-label={t("assignmentTargets",{name:assignment.name??""})}><h3 className="font-semibold">{t("assignmentTargets",{name:assignment.name??""})}</h3>
        <button className={button} disabled={!people.length} onClick={()=>void write({type:"targets",assignment:assignment.id,revision:assignment.revision!,users:people,add:true})}>{t("addTargets")}</button>
        <Rows title={t("targets")} data={targets}>{row=><div className="flex items-start justify-between gap-2"><Person row={row}/><button className={button} aria-label={t("removePerson",{name:row.name||t("unnamed")})} onClick={()=>void write({type:"targets",assignment:assignment.id,revision:assignment.revision!,users:[row.id],add:false})}>{t("remove")}</button></div>}</Rows>
      </section>}
    </fieldset>
  </div>;
}

/** Parent mounts this for an approved owner only; SQL still enforces every permission. */
export function OwnerAssessPanel() {
  const t=useTranslations("assessAdmin");
  return <section className="rounded-lg border border-line bg-panel p-4" aria-label={t("title")}>
    <h2 className="text-lg font-semibold">{t("title")}</h2>
    <OwnerAssignments/><Administration/><OwnerContentPanel/>
  </section>;
}
