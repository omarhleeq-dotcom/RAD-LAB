// Phase 4a: offline differential proof and local synthetic browser checks. No provider operations.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {build,transform} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const BASE_REF='d138bf7d637f4caed0714852982a0bcab6e3f961';
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const before=path=>execFileSync('git',['show',`${BASE_REF}:${path}`],{encoding:'utf8'});
const run=code=>{const sandboxModule={exports:{}};vm.runInNewContext(code,{module:sandboxModule,exports:sandboxModule.exports,require,globalThis,console,setTimeout,clearTimeout});return sandboxModule.exports;};
async function guardProof(){
 const current=run((await transform(readFileSync('src/features/assess/data-guards.ts','utf8'),{loader:'ts',format:'cjs'})).code);
 const corpus=[null,undefined,true,false,0,1,'',[],{},Object.create(null),new Date(),()=>{},'00000000-0000-0000-0000-000000000000'];
 for(let position=0;position<36;position++)for(let code=0;code<128;code++){
  const uuid='ABCDEF01-2345-6789-abcd-0123456789ab';corpus.push(uuid.slice(0,position)+String.fromCharCode(code)+uuid.slice(position+1));
 }
 let checks=0;
 for(const file of ['runner-data.ts','history-data.ts','admin-data.ts','owner-assignments.ts']){
  const source=before(`src/features/assess/${file}`);
  for(const [oldName,newName] of [[file==='runner-data.ts'?'isObject':'object','isObject'],[file==='runner-data.ts'?'isUuid':'uuid','isUuid']]){
   const line=source.split('\n').find(l=>new RegExp(`^(export )?const ${oldName}\\s*=`).test(l));assert.ok(line);
   const old=run((await transform(line.replace(/^export /,'')+`\nmodule.exports=${oldName};`,{loader:'ts',format:'cjs'})).code);
   for(const value of corpus){assert.equal(current[newName](value),old(value),`${file}:${oldName}`);checks++;}
  }
 }
 console.log(`Guards: ${checks} old/new identical booleans (all ASCII substitutions at every UUID position, nonstrings and object shapes).`);
}
async function renderProof(){
 const compiled=[];
 for(const file of ['AssessPanel.tsx','FullPracticalRunner.tsx'])for(const historical of [true,false]){
  const path=`src/features/assess/${file}`,name=file==='AssessPanel.tsx'?'Runner':'FullPracticalRunner';
  const source=(historical?before(path):readFileSync(path,'utf8'))+`\nexport const ProofRunner=${name};`;
  const result=await build({stdin:{contents:source,sourcefile:resolve(path),resolveDir:resolve('src/features/assess'),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/*','react-dom/*'],logLevel:'silent',plugins:[{name:'synthetic-view-state',setup(b){
   b.onResolve({filter:/^(next-intl|.*\/runner-state|.*\/practical-state|@\/features\/pilot\/(SessionGate|client))$/},args=>({path:args.path,namespace:'proof'}));
   b.onLoad({filter:/.*/,namespace:'proof'},args=>({loader:'js',contents:args.path==='next-intl'?`export const useLocale=()=>globalThis.__phase4aLocale;export const useTranslations=(ns)=>((key,args={})=>{let value=globalThis.__phase4aMessages;for(const k of (ns+'.'+key).split('.'))value=value[k];return value.replace(/\\{(\\w+)\\}/g,(_,k)=>String(args[k]));});export const NextIntlClientProvider=({children})=>children;`:
    args.path.endsWith('runner-state')||args.path.endsWith('practical-state')?`export class MixedRunner{constructor(){return globalThis.__phase4aController}}export const PracticalRunner=MixedRunner;`:
    `export const useSessionAccount=()=>({state:{kind:'signedOut'}});export const getPilotClient=()=>null;` }));
  }}]});compiled.push(run(result.outputFiles[0].text).ProofRunner);
 }
 let checks=0;
 const control={kind:'number',min:40,max:150};
 for(const locale of ['en','ar'])for(const track of ['mixed','full-practical'])for(const state of ['loading','error','conflict','saved','dirty','pending','busy','locked','closed']){
  globalThis.__phase4aLocale=locale;globalThis.__phase4aMessages=messages[locale];
  const item={schemaVersion:1,ref:{id:'synthetic',version:'1'},contentLanguage:'en',prompt:'Synthetic question',type:track==='mixed'?'simulator-part':'full-practical',presentation:{controls:['kvp'],sceneElements:[]}};
  const initial={kvp:80,projection:'pa',sidCm:180,rotationDeg:0,'centralRay.x':0,'centralRay.y':0,'collimation.width':1,'collimation.height':1,sideMarker:null,'markerPosition.x':0,'markerPosition.y':0};
  const view={controls:{kvp:control},initial,sceneValues:{},schemaVersion:1,labels:{kvp:'kVp'},increments:{},scene:{id:'chest-pa-frontal',detector:{widthCm:35,heightCm:43},anatomyFrame:{xCm:0,yCm:0,widthCm:35,heightCm:43},markerSizeCm:2}};
  const session={attemptId:'synthetic',ack:{state:state==='closed'?'grading':'active',serverTime:'2026-10-30T00:00:00Z',deadline:'2026-10-30T01:00:00Z',lockedItemIds:state==='locked'?['synthetic']:[]},assessment:{name:'Synthetic test',items:[item]},answers:{},views:{synthetic:view}};
  globalThis.__phase4aController={session:['loading','error'].includes(state)?null:session,index:0,drafts:{},busy:state==='busy',dirty:state==='dirty',pending:state==='pending'?{}:null,issue:['error','conflict'].includes(state)?state:null,unresolved:1};
  const pair=track==='mixed'?compiled.slice(0,2):compiled.slice(2),props={port:{},attempt:'synthetic',leave:()=>{}};
  // Only React-generated useId tokens vary with the extracted component hierarchy; all references stay paired.
  const html=pair.map(Component=>renderToStaticMarkup(React.createElement(Component,props)).replace(/_R_[a-zA-Z0-9]+_/g,'REACT_ID'));
  assert.equal(html[1],html[0],`${locale}/${track}/${state}`);checks++;
 }
 delete globalThis.__phase4aController;delete globalThis.__phase4aLocale;delete globalThis.__phase4aMessages;
 console.log(`Runner refactor: ${checks} EN/AR old/new markup byte comparisons passed (React useId tokens normalized).`);
}
if(process.argv.includes('--refactor-proof')){await guardProof();await renderProof();}
else if(process.argv.includes('--guards-proof'))await guardProof();
else { throw new Error('Specify --refactor-proof or --guards-proof; browser coverage follows in the F4 milestone.'); }
