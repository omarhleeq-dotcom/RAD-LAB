// Separate one-tick entrypoint. Does not import job-main or accept a general RPC mode.
import { open, constants } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { executeTrialJob } from './trial-isolation.ts';
const stopReport=code=>({contract:'assess-job/1',outcome:'STOP',code,runtimeOrLaunchVerified:false});
async function readJson(path) {
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try {
  const stat=await file.stat();
  if(!stat.isFile()||stat.size<1||stat.size>65536)throw new Error();
  const buffer=Buffer.alloc(65537);let n=0;
  while(n<buffer.length){const {bytesRead}=await file.read(buffer,n,buffer.length-n,n);if(!bytesRead)break;n+=bytesRead;}
  if(!n||n>65536)throw new Error();
  return JSON.parse(buffer.subarray(0,n).toString('utf8'));
 }finally{await file.close();}
}
export async function runTrialProcess({args=process.argv.slice(2),enabled=process.env.ASSESS_TRIAL_ENABLED,read=readJson,make}={}) {
 const stop=new AbortController(),onStop=()=>stop.abort();
 process.on('SIGTERM',onStop);process.on('SIGINT',onStop);
 let report=stopReport('configuration');
 try {
  if(args.length||enabled!=='1')return {report,exitCode:1};
  const scope=await read('/run/config/assess-trial.json');
  if(!scope||typeof scope!=='object'||Array.isArray(scope)||Object.keys(scope).length!==2||
   scope.contract!=='assess-trial-scope/1'||typeof scope.trial!=='string')throw new Error();
  report=await executeTrialJob(scope.trial,()=>read('/run/secrets/assess-worker.json'),stop.signal,make);
 }catch{/* whitelist only */}
 finally{process.off('SIGTERM',onStop);process.off('SIGINT',onStop);if(stop.signal.aborted&&report.code!=='cleanup_failed')report=stopReport('stopped');}
 return {report,exitCode:report.code==='stopped'?130:report.outcome==='COMPLETE'?0:1};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {report,exitCode}=await runTrialProcess();
 process.stdout.write(JSON.stringify(report)+'\n');process.exitCode=exitCode;
}
