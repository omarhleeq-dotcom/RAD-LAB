// Offline image context only. Reuse the locked Node graph and an installed age
// executable from the reviewed toolchain; pin its exact bytes/version in the manifest.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync,readFileSync,writeFileSync,copyFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
if(process.argv.length!==2)throw Error('configuration');
const age=(process.env.PATH??'').split(':').filter(p=>p.startsWith('/')).map(p=>join(p,'age')).find(p=>existsSync(p));
if(!age)throw Error('required age tool');
const bytes=readFileSync(age);
if(bytes.subarray(0,4).toString('hex')!=='7f454c46'||bytes[4]!==2||bytes.readUInt16LE(18)!==62)throw Error('required Linux x64 age binary');
const ageVersion=execFileSync(age,['--version'],{encoding:'utf8'}).trim();
if(!/^v?1\.[0-9]+\.[0-9]+$/.test(ageVersion))throw Error('age version');
const output=mkdtempSync(join(tmpdir(),'rad105-backup-build-'));
await build({entryPoints:['scripts/ops/cloud-backup.mjs'],outfile:join(output,'backup.cjs'),bundle:true,platform:'node',target:'node24',format:'cjs',logLevel:'silent',
 define:{'process.env.NODE_PG_FORCE_NATIVE':'false'}});
copyFileSync(age,join(output,'age'));copyFileSync('scripts/ops/cloud-backup.Dockerfile',join(output,'Dockerfile'));
writeFileSync(join(output,'backup-main.cjs'),`require('./backup.cjs').main().then(x=>process.stdout.write(JSON.stringify(x)+'\\n')).catch(()=>{process.stdout.write('{"contract":"rad105-encrypted-backup/1","outcome":"STOP"}\\n');process.exitCode=1;});\n`);
const files={};for(const f of ['backup.cjs','backup-main.cjs','age','Dockerfile'])files[f]=createHash('sha256').update(readFileSync(join(output,f))).digest('hex');
const manifest={contract:'rad105-backup-build/1',files,ageVersion,defaultDryRun:true,secretMount:'/run/secrets/assess-backup.json',privateKeyIncluded:false,
 requiredScratch:{path:'/work',medium:'memory',uid:999,mode:'0700'},runtimeOrLaunchVerified:false};
writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
process.stdout.write(JSON.stringify({output,manifestSha256:createHash('sha256').update(readFileSync(join(output,'manifest.json'))).digest('hex')})+'\n');
