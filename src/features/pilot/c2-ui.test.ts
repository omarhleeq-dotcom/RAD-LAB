import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseAnswer,parseDefinition,parseDirectory,parsePage,parsePending,safely,surveyCsv} from './c2-ui';
const answer={id:'response',participant_code:'P-fixture',round_id:'round',survey_type:'General',version:1,answered_at:'2026-10-24T12:00:00Z',answers:{rating:5,liked:'=HYPERLINK("bad")',improve:'عربي, "نص"\nسطر',bug:'@SUM(1)'},score:null};
describe('C2 bounded UI contracts',()=>{
 it('exports only code and round projection, quoting and guarding every free text cell',()=>{
  const parsed=parseAnswer({...answer,email:'private@example.test',name:'Private',user_id:'private'});
  expect(parsed).toEqual(answer);
  const csv=surveyCsv([parsed]);
  expect(csv.startsWith('\ufeffparticipant_code,')).toBe(true);
  expect(csv).toContain(`"'=HYPERLINK(""bad"")"`);
  expect(csv).toContain('"عربي, ""نص""\nسطر"');
  expect(csv).toContain("'@SUM(1)");
  expect(csv).not.toMatch(/private|email|name|user_id/);
 });
 it('rejects oversized or malformed server pages rather than rendering partial results',()=>{
  expect(()=>parsePage({rows:Array(21).fill(answer),next:null},20,parseAnswer)).toThrow();
  expect(()=>parseAnswer({...answer,score:Infinity})).toThrow();
  expect(()=>parseAnswer({...answer,answers:{liked:'a'.repeat(1001)}})).toThrow();
  expect(()=>parsePage({rows:[],next:'loop'},20,parseAnswer)).toThrow();
 });
 it('parses the actual C2 directory without guessing email confirmation absent from this RPC',()=>{
  const row={user_id:'fixture',participant_code:'P-fixture',role:'participant',status:'approved',email:'private@example.test',name:'Private'};
  const page=parseDirectory({version:1,boundary:'2026-10-24T00:00:00Z',rows:[row],counts:{pending:0,approved:1,suspended:0},next:{id:'fixture',rank:1}});
  expect(page.rows).toEqual([{id:'fixture',code:'P-fixture',role:'participant',status:'approved'}]);
  expect(page.next).toEqual({cursor:{id:'fixture',rank:1},boundary:'2026-10-24T00:00:00Z'});
  expect(()=>parseDirectory({version:1,rows:[row],counts:{}})).toThrow();
 });
 it('accepts versioned definitions and keeps the original English SUS data',()=>{
  const sql=readFileSync('supabase/migrations/20261024000200_owner_deletion_surveys.sql','utf8');
  const match=sql.match(/\('SUS',1,'(.*?)'\),/s)!;
  const definition=JSON.parse(match[1]!);
  expect(parseDefinition(definition)).toEqual(definition);
  expect(()=>parseDefinition({...definition,locale:'ar'})).toThrow();
  expect(()=>parseDefinition({...definition,questions:definition.questions.slice(1)})).toThrow();
  expect(parseDefinition({locale:'en',scoring:'none',questions:[{id:'future_question',kind:'text',label:'Future question',optional:false}]}).questions).toHaveLength(1);
 });
 it('trusts server eligibility and preserves the offered response id',()=>{
  expect(parsePending({pending:null})).toBeNull();
  const definition={locale:'en',scoring:'none',questions:[{id:'rating',kind:'rating',label:'Overall rating',optional:false}]};
  expect(parsePending({pending:{id:'offered-id',round_id:'round',survey_type:'General',version:2,definition}})?.id).toBe('offered-id');
  expect(()=>parsePending({pending:{round_id:'round'}})).toThrow();
 });
 it('converts a rejected injected adapter to a safe state without leaking its message',async()=>{
  expect(await safely(()=>Promise.reject(new Error('private error')))).toEqual({kind:'error'});
 });
});
