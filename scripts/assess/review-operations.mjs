// Offline file input only. Never collects credentials, logs, Google/DB metadata or sends alerts.
import { open,constants } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { inspectOperations } from './operations-review.mjs';
async function read(path){
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const stat=await file.stat();if(!stat.isFile()||stat.size<1||stat.size>65536)throw new Error();
  const buffer=Buffer.alloc(65537);let n=0;
  while(n<buffer.length){const {bytesRead}=await file.read(buffer,n,buffer.length-n,n);if(!bytesRead)break;n+=bytesRead;}
  if(!n||n>65536)throw new Error();return JSON.parse(buffer.subarray(0,n).toString('utf8'));
 }finally{await file.close();}
}
export async function main(args){
 try{
  if(args.length!==2||args[0]!=='--evidence')throw new Error();
  const input=await read(args[1]);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==3||!Object.hasOwn(input,'current')||!Object.hasOwn(input,'previous')||!Object.hasOwn(input,'policy'))throw new Error();
  return inspectOperations(input.current,{previous:input.previous,policy:input.policy});
 }catch{return inspectOperations(null);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await main(process.argv.slice(2));process.stdout.write(JSON.stringify(report)+'\n');process.exitCode=report.outcome==='CLEAR'?0:1;
}
