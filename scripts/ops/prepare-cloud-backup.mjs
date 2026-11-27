// Offline compiler only; no DB/cloud connection, no apply mode or credential input.
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { grantPacket,validateInventory,sha } from './cloud-backup-contract.mjs';
export function prepare(input){const inventory=validateInventory(input);return{inventory,inventorySha256:sha(inventory),sql:grantPacket(inventory)};}
export function main(args=process.argv.slice(2)){
 if(args.length!==4||args[0]!=='--inventory'||args[2]!=='--output')throw Error('arguments');
 const input=JSON.parse(readFileSync(args[1],'utf8'));
 const p=prepare(input.inventory&&Object.keys(input).sort().join()==='capabilities,inventory'?input.inventory:input),out=resolve(args[3]);
 if(out===process.cwd()||out.startsWith(process.cwd()+'/'))throw Error('output outside checkout required');
 mkdirSync(out,{recursive:false,mode:0o700});writeFileSync(join(out,'read.sql'),p.sql);writeFileSync(join(out,'inventory.json'),JSON.stringify(p.inventory,null,2)+'\n');
 return{contract:'rad105-backup-plan/2',dryRun:true,connections:0,inventorySha256:p.inventorySha256,output:out};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{process.stdout.write(JSON.stringify(main())+'\n');}catch{process.stderr.write('STOP backup_plan\n');process.exitCode=1;}}
