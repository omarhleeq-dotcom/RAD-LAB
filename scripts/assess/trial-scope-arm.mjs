// Offline generator only. Writes one SQL file for the owner to review; no remote connection, no secrets.
import { constants } from 'node:fs';
import { open, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
// Placeholders are not UUIDs: an unedited file fails with 22P02 and rolls back.
export const placeholders={owner:'<OWNER_UUID>',student:'<STUDENT_A_UUID>',outsider:'<OUTSIDER_B_UUID>'};
const lit=v=>"'"+v+"'::uuid";
const begin=`begin isolation level read committed;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='15s';
set local row_security=off;`;
// Dormant arming only: active=false, so no worker, gate or LOGIN effect. Activation is a separate approval.
export function buildScopeArmSql({controller,assessment,owner=placeholders.owner,student=placeholders.student,outsider=placeholders.outsider}){
 if(!uuid.test(controller)||!uuid.test(assessment)||controller.toLowerCase()===assessment.toLowerCase())throw new Error('invalid');
 for(const [v,p] of [[owner,placeholders.owner],[student,placeholders.student],[outsider,placeholders.outsider]])if(v!==p&&!uuid.test(v))throw new Error('invalid');
 const row=`id=${lit(controller)} and owner_id=${lit(owner)} and student_id=${lit(student)} and outsider_id=${lit(outsider)}
   and assessment_id=${lit(assessment)} and version_labels=array['visible','hidden'] and not active`;
 const check=`do $scope$ begin
 if current_user<>'postgres' or session_user<>'postgres' or current_setting('transaction_isolation')<>'read committed' then
   raise exception 'trial scope administrator unavailable' using errcode='55000'; end if;
 if (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled) then
   raise exception 'trial gate must be closed' using errcode='55000'; end if;
 if to_regclass('assess.trial_scope') is null then raise exception 'trial protection missing' using errcode='55000'; end if;`;
 const result=`select jsonb_build_object('contract','assess-trial-scope-arm/1','outcome','PASS','active',false,'scopeRows',1,'runtimeOrLaunchVerified',false) as result;`;
 return `${begin}
${check}
 if exists(select 1 from assess.trial_scope) then raise exception 'trial scope already present' using errcode='55000'; end if;
end $scope$;
insert into assess.trial_scope(id,owner_id,student_id,outsider_id,assessment_id,version_labels,active)
 values(${lit(controller)},${lit(owner)},${lit(student)},${lit(outsider)},${lit(assessment)},array['visible','hidden'],false);
do $scope$ begin
 if (select count(*) from assess.trial_scope)<>1 or not exists(select 1 from assess.trial_scope where singleton and ${row}) then
   raise exception 'trial scope postcondition' using errcode='55000'; end if;
end $scope$;
commit;
${begin}
set transaction read only;
${check}
 if (select count(*) from assess.trial_scope)<>1 or not exists(select 1 from assess.trial_scope where singleton and ${row}) then
   raise exception 'trial scope postcondition' using errcode='55000'; end if;
end $scope$;
${result}
rollback;
`;
}
async function readScope(path){
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const stat=await file.stat();if(!stat.isFile()||stat.size<1||stat.size>4096)throw new Error();
  const value=JSON.parse((await file.readFile('utf8')));
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==2||value.contract!=='assess-trial-scope/1'||!uuid.test(value.trial))throw new Error();
  return value.trial;
 }finally{await file.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--scope-file'||args[2]!=='--assessment')throw new Error();
  const sql=buildScopeArmSql({controller:await readScope(args[1]),assessment:args[3]});
  const output=await mkdtemp(join(tmpdir(),'radlab-trial-scope-'));
  await writeFile(join(output,'scope-arm.sql'),sql,{mode:0o600});
  console.log(JSON.stringify({contract:'assess-trial-scope-arm-build/1',output,sha256:createHash('sha256').update(sql).digest('hex'),placeholders:Object.values(placeholders),runtimeOrLaunchVerified:false}));
 }catch{
  console.log(JSON.stringify({contract:'assess-trial-scope-arm-build/1',outcome:'STOP',code:'configuration',runtimeOrLaunchVerified:false}));
  process.exitCode=1;
 }
}
