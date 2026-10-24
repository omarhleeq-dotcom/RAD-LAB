// RAD-069 C2 closed additive inventory, published before editing the guards.
export const C2_MIGRATION = "20261024000200_owner_deletion_surveys.sql";
export const C2_CHECK = "supabase/checks/owner-deletion-surveys-ready.sql";
export const C2_TABLE_COLUMNS = {
  "c2_account_deletions": [
    "user_id",
    "requested_at",
    "restore_status",
    "previous_banned_until"
  ],
  "c2_survey_settings": [
    "singleton",
    "activated_at",
    "gap_days"
  ],
  "c2_survey_versions": [
    "id",
    "survey_type",
    "version",
    "definition"
  ],
  "c2_survey_rounds": [
    "id",
    "version_id",
    "opened_at",
    "closed_at"
  ],
  "c2_survey_responses": [
    "id",
    "user_id",
    "round_id",
    "offered_at",
    "answered_at",
    "state",
    "answers",
    "score"
  ]
} as const;
export const C2_CONSTRAINTS = [
  "c2_account_deletions.c2_account_deletions_pkey",
  "c2_account_deletions.c2_account_deletions_user_id_fkey",
  "c2_account_deletions.c2_account_deletions_restore_status_check",
  "c2_account_deletions.c2_account_deletions_requested_at_check",
  "c2_survey_settings.c2_survey_settings_pkey",
  "c2_survey_settings.c2_survey_settings_singleton_check",
  "c2_survey_settings.c2_survey_settings_gap_days_check",
  "c2_survey_versions.c2_survey_versions_pkey",
  "c2_survey_versions.c2_survey_versions_type_version_key",
  "c2_survey_versions.c2_survey_versions_survey_type_check",
  "c2_survey_versions.c2_survey_versions_version_check",
  "c2_survey_versions.c2_survey_versions_definition_check",
  "c2_survey_rounds.c2_survey_rounds_pkey",
  "c2_survey_rounds.c2_survey_rounds_version_id_fkey",
  "c2_survey_rounds.c2_survey_rounds_dates_check",
  "c2_survey_responses.c2_survey_responses_pkey",
  "c2_survey_responses.c2_survey_responses_user_id_fkey",
  "c2_survey_responses.c2_survey_responses_round_id_fkey",
  "c2_survey_responses.c2_survey_responses_user_round_key",
  "c2_survey_responses.c2_survey_responses_state_check",
  "c2_survey_responses.c2_survey_responses_answers_check",
  "c2_survey_responses.c2_survey_responses_score_check",
  "c2_survey_responses.c2_survey_responses_dates_check",
  "c2_account_deletions.c2_account_deletions_user_id_not_null",
  "c2_account_deletions.c2_account_deletions_requested_at_not_null",
  "c2_account_deletions.c2_account_deletions_restore_status_not_null",
  "c2_account_deletions.c2_account_deletions_previous_banned_until_not_null",
  "c2_survey_settings.c2_survey_settings_singleton_not_null",
  "c2_survey_settings.c2_survey_settings_activated_at_not_null",
  "c2_survey_settings.c2_survey_settings_gap_days_not_null",
  "c2_survey_versions.c2_survey_versions_id_not_null",
  "c2_survey_versions.c2_survey_versions_survey_type_not_null",
  "c2_survey_versions.c2_survey_versions_version_not_null",
  "c2_survey_versions.c2_survey_versions_definition_not_null",
  "c2_survey_rounds.c2_survey_rounds_id_not_null",
  "c2_survey_rounds.c2_survey_rounds_version_id_not_null",
  "c2_survey_rounds.c2_survey_rounds_opened_at_not_null",
  "c2_survey_rounds.c2_survey_rounds_closed_at_not_null",
  "c2_survey_responses.c2_survey_responses_id_not_null",
  "c2_survey_responses.c2_survey_responses_user_id_not_null",
  "c2_survey_responses.c2_survey_responses_round_id_not_null",
  "c2_survey_responses.c2_survey_responses_offered_at_not_null",
  "c2_survey_responses.c2_survey_responses_answered_at_not_null",
  "c2_survey_responses.c2_survey_responses_state_not_null",
  "c2_survey_responses.c2_survey_responses_answers_not_null",
  "c2_survey_responses.c2_survey_responses_score_not_null"
] as const;
export const C2_INDEXES = [
  "c2_account_deletions_pkey",
  "c2_survey_settings_pkey",
  "c2_survey_versions_pkey",
  "c2_survey_rounds_pkey",
  "c2_survey_responses_pkey",
  "c2_survey_versions_type_version_key",
  "c2_survey_responses_user_round_key",
  "c2_account_deletions_expiry_idx",
  "c2_survey_responses_pending_idx",
  "c2_survey_responses_user_offered_idx"
] as const;
export const C2_FUNCTIONS = [
  "owner_account_deletion_v1",
  "owner_account_directory_v1",
  "owner_surveys_v1",
  "participant_survey_v1"
] as const;

// DEFERRED: never import from a client root until the coordinated DB day.
// Uses the signed-in publishable client only. No service key or background worker.
import type { SupabaseClient } from '@supabase/supabase-js';
import {parseAnswer,parseDeletion,parseDirectory,parsePage,parsePending,parseRound,parseVersion,type C2Adapter,type Outcome} from './c2-ui';
type RpcError = {code?:string;message?:string};
export function missingC2(error:RpcError):boolean {
 return ['PGRST202','42883'].includes(error.code??'') || (error.code==='PGRST200'&&/schema cache|function/i.test(error.message??''));
}
export function createC2Adapter(client:Pick<SupabaseClient,'rpc'>):C2Adapter {
 async function call<T>(name:string,args:Record<string,unknown>,parse:(v:unknown)=>T):Promise<Outcome<T>> {
  try {const {data,error}=await client.rpc(name,args);if(error)return {kind:missingC2(error)?'unavailable':'error'};return {kind:'ready',data:parse(data)};}
  catch{return {kind:'error'};}
 }
 const deletion='owner_account_deletion_v1',directory='owner_account_directory_v1',surveys='owner_surveys_v1',participant='participant_survey_v1';
 const truth=(v:unknown):true=>{if(!v||typeof v!=='object'||typeof (v as {id?:unknown}).id!=='string')throw new Error('Invalid result');return true;};
 return {
  directory:(search,status,p)=>call(directory,{p_search:search,p_status:status,p_cursor:p.cursor,p_boundary:p.boundary,p_limit:20},parseDirectory),
  deletions:after=>call(deletion,{p_action:'list',p_after:after,p_limit:20},v=>parsePage(v,20,parseDeletion)),
  deletion:(action,user)=>call(deletion,{p_action:action,p_user:user??null,p_limit:action==='finalise'?100:20},v=>{const n=(v as {processed?:unknown})?.processed;if(!Number.isSafeInteger(n)||Number(n)<0||Number(n)>100)throw new Error('Invalid result');return Number(n);}),
  versions:after=>call(surveys,{p_action:'versions',p_after:after,p_limit:20},v=>parsePage(v,20,parseVersion)),
  rounds:after=>call(surveys,{p_action:'rounds',p_after:after,p_limit:20},v=>parsePage(v,20,parseRound)),
  answers:(round,after,limit=20)=>call(surveys,{p_action:'answers',p_data:{round_id:round},p_after:after,p_limit:Math.min(100,Math.max(1,limit))},v=>parsePage(v,Math.min(100,Math.max(1,limit)),parseAnswer)),
  open:version=>call(surveys,{p_action:'open_round',p_data:{version_id:version}},truth),
  close:round=>call(surveys,{p_action:'close_round',p_data:{id:round}},truth),
  setGap:days=>call(surveys,{p_action:'set_gap',p_data:{days}},v=>{if((v as {gap_days?:unknown})?.gap_days!==days)throw new Error('Invalid result');return true;}),
  pending:()=>call(participant,{p_answers:null},parsePending),
  submit:async value=>{
   try {
    const {data,error}=await client.rpc(participant,{p_answers:{id:value.id,answers:value.answers}});
    if(!error)return data?.answered===true?{kind:'ready',data:true}:{kind:'error'};
    if(missingC2(error))return {kind:'unavailable'};
    if(error.code==='22023') {
     if(error.message==='round closed')return {kind:'closed'};
     // SQL deliberately does not distinguish an answered from a cancelled response.
     // The UI explains both outcomes; never infer identity or query owner data here.
     if(error.message==='pending survey required')return {kind:'already'};
     if(error.message==='survey response mismatch')return {kind:'stale'};
    }
    return {kind:'error'};
   } catch{return {kind:'error'};}
  },
 };
}
