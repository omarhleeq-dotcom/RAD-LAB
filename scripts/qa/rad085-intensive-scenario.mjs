// Local-only RAD-085 write measurement. Requires a completed build and isolated
// tools: npm install --prefix /tmp/rad085-browser playwright@1.58.2 axe-core
// node scripts/qa/rad085-intensive-scenario.mjs --tools /tmp/rad085-browser --out /tmp/rad085-intensive
// Default = one actual 60-minute student session. --smoke is a separate 3-cycle
// harness check; its output MUST NOT be used to propose owner limits.
// Input timings model fast physical actions, not idle time: pointer 1600px/s,
// button-down 60ms, typing 10 characters/s. No think time, sleeps, retry pause,
// API latency, score/store injection, or accelerated clock. All controls use the
// shared workspace driver and accessible role/name selectors.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import http from 'node:http';
import {performance} from 'node:perf_hooks';
import {startPractice,driver} from './workspace.mjs';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const argv=process.argv.slice(2),smoke=argv.includes('--smoke');
function option(name,fallback){const i=argv.indexOf(name);return i<0?fallback:argv[i+1];}
const out=resolve(option('--out','/tmp/rad085-intensive')),toolsDir=resolve(option('--tools','/tmp/rad085-browser'));
if(!out.startsWith('/tmp/')||!toolsDir.startsWith('/tmp/'))throw Error('Use isolated /tmp paths');
mkdirSync(out,{recursive:true});
const require=createRequire(join(repo,'package.json')),toolRequire=createRequire(join(toolsDir,'package.json'));
const {chromium}=toolRequire('playwright'),esbuild=require('esbuild');
const entry=`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import {SimulationWorkspace} from '${repo}/src/features/simulation/SimulationWorkspace';
import {SessionProvider} from '${repo}/src/features/pilot/SessionGate';
import {recordActivity} from '${repo}/src/features/pilot/activity';
import messages from '${repo}/messages/en.json';
const user={id:'00000000-0000-0000-0000-000000000003',email:'synthetic@example.invalid'};
const profile={status:'approved',role:'participant',participant_code:'SYNTHETIC',consent_version:'2026-10-27',display_name:'SYNTHETIC Student Name'};
window.measurement={counts:{events:0,attempts:0,feedback:0},eventTypes:{},writes:[]};
window.syntheticClient={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 from(table){const q={select(){return q},eq(){return q},limit(){return q},maybeSingle:async()=>({data:profile,error:null,status:200}),
 insert:async(row)=>{const m=window.measurement;m.counts[table]++;if(table==='events')m.eventTypes[row.type]=(m.eventTypes[row.type]||0)+1;
 m.writes.push({table,type:row.type??null,attemptNo:row.attempt_no??null,at:Date.now()});return {error:null};}};return q;},rpc:async()=>({data:null,error:null})};
localStorage.setItem('rad085-synthetic-session','synthetic');
createRoot(document.getElementById('root')).render(<NextIntlClientProvider locale="en" messages={messages} timeZone="UTC"><SessionProvider><SimulationWorkspace caseId="chest-pa-erect"/></SessionProvider></NextIntlClientProvider>);
`;
await esbuild.build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},outfile:join(out,'app.js'),bundle:true,format:'iife',jsx:'automatic',nodePaths:[join(repo,'node_modules')],tsconfig:join(repo,'tsconfig.json'),define:{'process.env': '{}','process.env.NODE_ENV':'"production"'},plugins:[{name:'local-synthetic-transport',setup(build){
 build.onLoad({filter:/src\/features\/pilot\/client\.ts$/},()=>({contents:'export async function getPilotClient(){return window.syntheticClient;}',loader:'ts'}));
 build.onLoad({filter:/src\/features\/pilot\/config\.ts$/},()=>({contents:"export const PILOT={url:'http://127.0.0.1:3198',key:'SYNTHETIC'};export const sessionStorageKey=()=> 'rad085-synthetic-session';",loader:'ts'}));
}}]});
const chunks=join(repo,'.next/static/chunks');
writeFileSync(join(out,'app.css'),readdirSync(chunks).filter(f=>f.endsWith('.css')).map(f=>readFileSync(join(chunks,f),'utf8')).join('\n'));
writeFileSync(join(out,'index.html'),'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>RAD085 intensive local UI measurement</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
const server=http.createServer((req,res)=>{try{
 const f=req.url==='/'?'index.html':req.url.slice(1);
 if(['app.js','app.css','index.html'].includes(f)){res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(readFileSync(join(out,f)));return;}
 // Only built local public assets are served; this server never proxies a URL.
 if(!f.includes('..')&&/^[-a-zA-Z0-9_./]+$/.test(f)){try{res.end(readFileSync(join(repo,'public',f)));return;}catch{ /* absent optional image */ }}
 res.writeHead(204);res.end();
 }catch{res.writeHead(500);res.end();}}).listen(3198,'127.0.0.1');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
let completed=0,finished=false;const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'en'});
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
 // Deny every non-local request; no real project, provider, account or SQL.
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3198'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:3198/');const messages=JSON.parse(readFileSync(join(repo,'messages/en.json'),'utf8'));
 await startPractice(page,messages);const controls=driver(page,messages);
 let pointer={x:720,y:500};
 async function click(locator){
  await controls.reveal(locator);await locator.scrollIntoViewIfNeeded();
  const box=await locator.boundingBox();if(!box)throw Error('Visible control has no bounds');
  const next={x:box.x+box.width/2,y:box.y+box.height/2};const distance=Math.hypot(next.x-pointer.x,next.y-pointer.y),frames=Math.max(1,Math.ceil(distance/1600*60));
  // Physical cursor travel at one step per real browser frame, with no idle dwell.
  for(let n=1;n<=frames;n++){
   await page.mouse.move(pointer.x+(next.x-pointer.x)*n/frames,pointer.y+(next.y-pointer.y)*n/frames);
   await page.evaluate(()=>new Promise(requestAnimationFrame));
  }
  pointer=next;await page.mouse.click(next.x,next.y,{delay:60});
 }
 const expose=page.getByRole('button',{name:messages.console.expose,exact:true});
 const retry=page.getByRole('button',{name:messages.result.retry,exact:true});
 const noteToggle=page.getByRole('button',{name:messages.result.addNote,exact:true});
 const note=page.getByRole('textbox',{name:messages.feedback.label,exact:true});
 const send=page.getByRole('button',{name:messages.feedback.send,exact:true});
 const epochStart=Date.now(),startedAt=new Date(epochStart).toISOString(),started=performance.now(),deadline=started+3600000;
 let nextProgress=started+60000;
 while(smoke?completed<3:performance.now()<deadline){
  await click(expose);await noteToggle.waitFor({state:'visible'});await click(noteToggle);await click(note);
  await note.pressSequentially('OK',{delay:100});await click(send);
  await page.getByText(messages.feedback.sent,{exact:true}).waitFor();
  completed++;await click(retry);await expose.waitFor({state:'visible'});
  if(errors.length)throw Error(JSON.stringify(errors));
  if(performance.now()>=nextProgress){
   const measured=await page.evaluate(()=>window.measurement);const line={elapsedSeconds:(performance.now()-started)/1000,completed,...measured.counts};
   console.log(JSON.stringify(line));writeFileSync(join(out,'progress.json'),JSON.stringify(line,null,2));nextProgress+=60000;
  }
 }
 const stoppedAt=new Date().toISOString(),elapsedSeconds=(performance.now()-started)/1000;
 const measured=await page.evaluate(()=>window.measurement);
 const windowWrites=smoke?measured.writes:measured.writes.filter(w=>w.at>=epochStart&&w.at<epochStart+3600000);
 const counts=Object.fromEntries(['events','attempts','feedback'].map(table=>[table,windowWrites.filter(w=>w.table===table).length]));
 const eventTypes=Object.fromEntries([...new Set(windowWrites.filter(w=>w.table==='events').map(w=>w.type))].map(type=>[type,windowWrites.filter(w=>w.type===type).length]));
 const result={mode:smoke?'SMOKE - not a limit measurement':'60-minute real-time UI',startedAt,stoppedAt,elapsedSeconds,windowSeconds:smoke?elapsedSeconds:3600,completedIncludingBoundaryCycle:completed,completedWithinWindow:counts.feedback,counts,eventTypes,errors,input:{pointerPixelsPerSecond:1600,buttonDownMs:60,typingCharactersPerSecond:10,feedback:'OK',idleWaits:0},proposed:smoke?null:Object.fromEntries(Object.entries(counts).map(([k,n])=>[k,{perHour:5*n,perDay:20*n}]))};
 if(measured.counts.attempts!==completed||measured.counts.feedback!==completed)throw Error('Every completed UI attempt must have exactly one saved note');
 writeFileSync(join(out,'results.json'),JSON.stringify(result,null,2));writeFileSync(join(out,'writes.json'),JSON.stringify(measured.writes));
 await page.screenshot({path:join(out,'final.jpg'),type:'jpeg',quality:80,fullPage:true});
 console.log(JSON.stringify(result));finished=true;
}finally{await browser.close();server.close();if(!finished)console.error('Incomplete scenario: no measured owner limits may be inferred.');}
