// Read-only proof for the owner's narrow text exception. Never writes expectations.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const arg=n=>process.argv.find(x=>x.startsWith(`--${n}=`))?.slice(n.length+3);
const base=arg('base')??'e85d7ef311c3f5272dee3faabee91cb5eaca16df';
const changes=[];
function permitted(file,path,rule){
 if(file==='chest-pa-case.json'){
  if(rule==='side-marker')return /^rules\.\d+\.feedback\.(overlap\.(en|ar)|overlap(Left|Right|Top|Bottom)\.(en|ar))$/.test(path);
  if(['collimation-clipping','collimation-excess'].includes(rule))return /^rules\.\d+\.(feedback\.(fail|high)\.(en|ar)|excessSides\.(left|right|top|bottom)\.(en|ar))$/.test(path);
 }else if(['side-marker','collimation-clipping','collimation-excess'].includes(rule))return /^.+\.(result\.)?checks\.\d+\.feedback\.(en|ar)$/.test(path);
 return false;
}
function compare(a,b,file,path='',rule=''){
 if(a===b)return;
 const nextRule=b?.ruleId??b?.id??a?.ruleId??a?.id??rule;
 if(b && typeof b==='object'){
  assert.ok(a===undefined || (typeof a==='object' && a!==null && Array.isArray(a)===Array.isArray(b)),`STOP type ${file}:${path}`);
  if(Array.isArray(b))assert.equal(a?.length,b.length,`STOP length ${path}`);
  const keys=new Set([...Object.keys(a??{}),...Object.keys(b)]);assert.ok(a!==undefined||keys.size>0,`STOP empty addition ${path}`);
  for(const k of keys)compare(a?.[k],b[k],file,path?`${path}.${k}`:k,nextRule);
 }else{
  assert.ok((a===undefined||typeof a==='string')&&typeof b==='string'&&permitted(file,path,rule),`STOP unapproved ${file}:${path}`);
  changes.push({file,path,old:a??null,new:b});
 }
}
const tokens=s=>[...s.matchAll(/"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g)].map(m=>m[0]).filter(t=>!t.startsWith('"'));
for(const file of ['chest-pa-case.json','chest-pa-scenarios.json']){
 const path='scripts/qa/characterisation/'+file;
 const old=execFileSync('git',['show',`${base}:${path}`],{encoding:'utf8',maxBuffer:16*1024*1024}),current=readFileSync(path,'utf8');
 compare(JSON.parse(old),JSON.parse(current),file);
 assert.deepEqual(tokens(current),tokens(old),`STOP numeric/boolean/null byte tokens ${file}`);
}
if(arg('before')&&arg('after')){
 const old=JSON.parse(readFileSync(arg('before'))),current=JSON.parse(readFileSync(arg('after')));
 assert.equal(current.version,old.version,'STOP engine version');
 assert.deepEqual(current.comparisons,old.comparisons,'STOP comparison identity');
 assert.deepEqual(current.samples,old.samples,'STOP scores/outcomes/variants/findings/geometry/exposure');
 console.log(`Identical ${current.samples.length} evaluations and ${Object.keys(current.comparisons).length} comparison identities (${current.version}).`);
}
if(arg('out'))writeFileSync(arg('out'),JSON.stringify(changes,null,2));
console.log(`Text-only characterisation proof: ${changes.length} explicitly allowed string leaves; all other structure and non-string tokens identical.`);
