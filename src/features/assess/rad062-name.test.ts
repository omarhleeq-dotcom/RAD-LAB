// @vitest-environment jsdom
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { Rad062NameGate } from './Rad062NameGate';
import manifest from '../../../scripts/pages/frontend-schema.json';
import { validFullName } from '../pilot/full-name';

it('real bundled consumer stays dormant with a tampered browser manifest: zero adapter loads or RPCs', async () => {
 const feature=manifest.guardedFeatures.rad062;
 const tamper=`import m from './scripts/pages/frontend-schema.json';
 for(const file of Object.keys(m.deferredMigrations)){m.requiredMigrations.push(file);delete m.deferredMigrations[file];}
 export const tampered=m.requiredMigrations.includes('20261030000100_rad062_full_name.sql');
 export async function getEntry(){return (await import('./src/features/assess/Rad062Entry')).Rad062Entry;}`;
 const calls: string[]=[];
 const bundle=execFileSync(process.execPath,['--input-type=module','-e',`import {build} from 'esbuild';
 const r=await build({stdin:{contents:${JSON.stringify(tamper)},resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','react/jsx-runtime'],plugins:[{name:'probe',setup(b){b.onLoad({filter:/Rad062NameGate\\.tsx$/},()=>({contents:"globalThis.__rad062probe.push('adapter'); export function Rad062NameGate(){globalThis.__rad062probe.push('name_entry_v1');return null;}",loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);`],{encoding:'utf8'});
 const globals=globalThis as typeof globalThis & {__rad062probe?:string[];IS_REACT_ACT_ENVIRONMENT?:boolean};
 globals.__rad062probe=calls;globals.IS_REACT_ACT_ENVIRONMENT=true;
 const result={exports:{}};
 const React=await import('react'),runtime=await import('react/jsx-runtime');
 new Function('module','exports','require',bundle)(result,result.exports,(name:string)=>name==='react'?React:runtime);
 const api=result.exports as {tampered:boolean;getEntry:()=>Promise<typeof import('./Rad062Entry').Rad062Entry>};
 expect(api.tampered).toBe(true);
 const Entry=await api.getEntry();
 const container=document.createElement('div'),root=createRoot(container);
 try{await act(async()=>{root.render(createElement(Entry,null,'Assess remains available'));});expect(container.textContent).toBe('Assess remains available');expect(calls).toEqual([]);}
 finally{await act(async()=>root.unmount());delete globals.__rad062probe;delete globals.IS_REACT_ACT_ENVIRONMENT;}
 expect(readFileSync(feature.guard.path,'utf8')).toContain('export const RAD062_AVAILABLE: boolean = false;');
 expect(readFileSync('src/features/supervisor/p1-availability.ts','utf8')).toContain('export const P1_AVAILABLE: boolean = true;');
});

it('pins dormant boundaries and preserves required/check bytes and production marker',()=>{
 const base=JSON.parse(execFileSync('git',['show','origin/main:scripts/pages/frontend-schema.json'],{encoding:'utf8'}));
 expect(manifest.requiredMigrations).toEqual(base.requiredMigrations);expect(manifest.checks).toEqual(base.checks);
 const hash=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
 for(const file of [...base.requiredMigrations.map((f:string)=>'supabase/migrations/'+f),...base.checks])expect(hash(readFileSync(file))).toBe(hash(execFileSync('git',['show','origin/main:'+file])));
 const marker=execFileSync(process.execPath,['scripts/pages/pilot-schema-gate.mjs','--print-marker'],{encoding:'utf8',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://vlacestfruxooznrcjqc.supabase.co'}}).trim();
 expect(marker).toBe('pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be');
});

it('keeps the current client name semantics including code points and letter-containing words',()=>{
 for(const name of ['أحمد محمد علي','李 王 张','A1 B2 C3','𐐀 𐐁 𐐂','A B '+'𐐀'.repeat(96)])expect(validFullName(name)).toBe(true);
 for(const name of ['Two Words','','1 2 3','A B '+'𐐀'.repeat(97)])expect(validFullName(name)).toBe(false);
});

const entryProbe=vi.hoisted(()=>({entry:vi.fn(),save:vi.fn()}));
vi.mock('next-intl',()=>({useLocale:()=> 'ar'}));
vi.mock('../pilot/SessionGate',()=>({useSessionAccount:()=>({state:{kind:'signedIn',userId:'fixture',displayName:null},saveName:entryProbe.save})}));
vi.mock('../pilot/client',()=>({getPilotClient:async()=>({schema:()=>({rpc:entryProbe.entry})})}));

it('asks only inside Assess, saves a valid legacy name and waits for server confirmation',async()=>{
 entryProbe.entry.mockReset().mockResolvedValueOnce({data:false,error:null}).mockResolvedValueOnce({data:true,error:null});
 entryProbe.save.mockReset().mockResolvedValue(true);
 const globals=globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?:boolean};globals.IS_REACT_ACT_ENVIRONMENT=true;
 const host=document.createElement('div'),root=createRoot(host);
 try{
  await act(async()=>root.render(createElement(Rad062NameGate,null,'Assess content')));
  expect(host.textContent).toContain('الاسم الكامل');expect(host.textContent).not.toContain('Assess content');
  const input=host.querySelector('input')!,save=host.querySelector('button')!;
  expect(input.value).toBe('');expect(save.disabled).toBe(true);
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'أحمد محمد علي');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(save.disabled).toBe(false);
  await act(async()=>{host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  expect(entryProbe.save).toHaveBeenCalledWith('أحمد محمد علي');expect(entryProbe.entry).toHaveBeenCalledTimes(2);expect(host.textContent).toBe('Assess content');
 }finally{await act(async()=>root.unmount());delete globals.IS_REACT_ACT_ENVIRONMENT;}
});

it('runs the current-schema and explicit-M01 witnesses on isolated PostgreSQL',()=>{
 const output=execFileSync(process.execPath,['--test','scripts/assess/rad062-name.test.mjs'],{encoding:'utf8',timeout:25000});
 expect(output).toContain('PASS current-only + explicit M01');
},30000);

it('bounds only historical fixture discovery; the real schema gate still sees M01',()=>{
 const migration='20261030000100_rad062_full_name.sql';
 expect(readdirSync('supabase/migrations')).not.toContain(migration);
 const raw=execFileSync(process.execPath,['--input-type=module','-e',"import{readdirSync}from'node:fs';process.stdout.write(JSON.stringify(readdirSync('supabase/migrations')));"],{encoding:'utf8'});
 expect(JSON.parse(raw)).toContain(migration);
});


it('worker manifest pins only applied migrations and the source classification',()=>{
 const built=JSON.parse(execFileSync(process.execPath,['scripts/assess/build-worker.mjs'],{encoding:'utf8'}));
 try{
  const worker=JSON.parse(readFileSync(built.output+'/manifest.json','utf8'));
  expect(Object.keys(worker.migrations)).toEqual([...manifest.requiredMigrations].sort());
  for(const file of Object.keys(manifest.deferredMigrations))expect(worker.migrations).not.toHaveProperty(file);
  const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
  for(const file of Object.keys(worker.migrations))expect(worker.migrations[file]).toBe(hash('supabase/migrations/'+file));
  expect(worker.sources['scripts/pages/frontend-schema.json']).toBe(hash('scripts/pages/frontend-schema.json'));
 }finally{rmSync(built.output,{recursive:true,force:true});}
});
