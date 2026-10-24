import {describe,expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createC2Adapter} from './c2-contract';
function mock(data:unknown=null,error:unknown=null) {
 const rpc=vi.fn().mockResolvedValue({data,error});
 return {rpc,adapter:createC2Adapter({rpc} as unknown as Pick<SupabaseClient,'rpc'>)};
}
describe('deferred C2 adapter with synthetic RPC transport',()=>{
 it.each(['PGRST202','42883'])('handles missing RPC %s once, without exposing raw errors or retrying',async code=>{
  const {adapter,rpc}=mock(null,{code,message:'private schema diagnostic'});
  expect(await adapter.pending()).toEqual({kind:'unavailable'});
  expect(await adapter.deletions(null)).toEqual({kind:'unavailable'});
  expect(await adapter.rounds(null)).toEqual({kind:'unavailable'});
  expect(await adapter.directory('','',{cursor:null,boundary:null})).toEqual({kind:'unavailable'});
  expect(rpc).toHaveBeenCalledTimes(4);
 });
 it('sends precisely the offered response id and answers, with no local user or round substitution',async()=>{
  const {adapter,rpc}=mock({answered:true});
  expect(await adapter.submit({id:'pending-response',answers:{rating:4}})).toEqual({kind:'ready',data:true});
  expect(rpc).toHaveBeenCalledExactlyOnceWith('participant_survey_v1',{p_answers:{id:'pending-response',answers:{rating:4}}});
 });
 it.each([
  ['round closed','closed'],['pending survey required','already'],['survey response mismatch','stale'],['invalid text answer','error'],
 ])('maps the known submission state %s safely',async(message,kind)=>{
  const {adapter,rpc}=mock(null,{code:'22023',message});
  expect(await adapter.submit({id:'response',answers:{rating:1}})).toEqual({kind});
  expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('does not treat a permission failure as a missing database update',async()=>{
  const {adapter}=mock(null,{code:'42501',message:'private'});
  expect(await adapter.pending()).toEqual({kind:'error'});
 });
 it('bounds answer reads to the selected round and keeps continuation on the server',async()=>{
  const {adapter,rpc}=mock({rows:[],next:null});
  expect(await adapter.answers('round','cursor',1000)).toEqual({kind:'ready',data:{rows:[],next:null}});
  expect(rpc).toHaveBeenCalledExactlyOnceWith('owner_surveys_v1',{p_action:'answers',p_data:{round_id:'round'},p_after:'cursor',p_limit:100});
 });
 it('bounds finalisation and restores by account id using the same signed-in client',async()=>{
  const {adapter,rpc}=mock({processed:1});
  expect(await adapter.deletion('finalise')).toEqual({kind:'ready',data:1});
  expect(rpc).toHaveBeenLastCalledWith('owner_account_deletion_v1',{p_action:'finalise',p_user:null,p_limit:100});
  expect(await adapter.deletion('restore','fixture-id')).toEqual({kind:'ready',data:1});
  expect(rpc).toHaveBeenLastCalledWith('owner_account_deletion_v1',{p_action:'restore',p_user:'fixture-id',p_limit:20});
 });
 it('opens and closes versioned rounds, leaving the definition on the server',async()=>{
  const {adapter,rpc}=mock({id:'round'});
  expect(await adapter.open('version')).toEqual({kind:'ready',data:true});
  expect(rpc).toHaveBeenLastCalledWith('owner_surveys_v1',{p_action:'open_round',p_data:{version_id:'version'}});
  expect(await adapter.close('round')).toEqual({kind:'ready',data:true});
  expect(rpc).toHaveBeenLastCalledWith('owner_surveys_v1',{p_action:'close_round',p_data:{id:'round'}});
 });
 it('fails safely for broken transport and malformed projections',async()=>{
  const {adapter,rpc}=mock({rows:'bad'});
  expect(await adapter.rounds(null)).toEqual({kind:'error'});
  rpc.mockRejectedValueOnce(new Error('private'));
  expect(await adapter.pending()).toEqual({kind:'error'});
 });
});
