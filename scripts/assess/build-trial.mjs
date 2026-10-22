// Local curated package only. No image push/build, deployment, provider or mounts.
import { build } from 'esbuild';
import { mkdtemp, writeFile, readFile, open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const args=process.argv.slice(2);let scope;
try{
 if(args.length){
  if(args.length!==2||args[0]!=='--scope-file')throw new Error();
  const file=await open(args[1],constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
   const stat=await file.stat();if(!stat.isFile()||stat.size<1||stat.size>4096)throw new Error();
   const buffer=Buffer.alloc(4097);let n=0;
   while(n<buffer.length){const {bytesRead}=await file.read(buffer,n,buffer.length-n,n);if(!bytesRead)break;n+=bytesRead;}
   if(!n||n>4096)throw new Error();
   const value=JSON.parse(buffer.subarray(0,n).toString('utf8'));
   if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==2||
    value.contract!=='assess-trial-scope/1'||typeof value.trial!=='string'||!(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.trial)))throw new Error();
   scope=JSON.stringify({contract:value.contract,trial:value.trial})+'\n';
  }finally{await file.close();}
 }
}catch{
 process.stdout.write(JSON.stringify({contract:'assess-trial-build/1',outcome:'STOP',code:'configuration',runtimeOrLaunchVerified:false})+'\n');
 process.exit(1);
}
const output=await mkdtemp(join(tmpdir(),'radlab-assess-trial-'));
const result=await build({entryPoints:['scripts/assess/trial-main.mjs'],outfile:join(output,'trial.mjs'),bundle:true,
 platform:'node',target:'node24',format:'esm',sourcemap:false,metafile:true,logLevel:'silent',
 banner:{js:"import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"},
 define:{'process.env.NODE_PG_FORCE_NATIVE':'false'}});
const inputs=Object.keys(result.metafile.inputs).sort();
if(inputs.some(p=>/node_modules\/(react|react-dom|next|zustand)\//.test(p)||/job-main|trial-tools/.test(p)))throw new Error('Invalid trial graph');
const dockerfile=`FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
WORKDIR /app
COPY --chown=node:node trial.mjs ./
${scope?'COPY --chown=node:node assess-trial.json /run/config/assess-trial.json\n':''}ENV NODE_ENV=production ASSESS_TRIAL_ENABLED=0
USER node
ENTRYPOINT ["node", "/app/trial.mjs"]
`;
await writeFile(join(output,'Dockerfile'),dockerfile);
if(scope)await writeFile(join(output,'assess-trial.json'),scope,{mode:0o400});
const hashes={};
for(const name of ['trial.mjs','Dockerfile',...(scope?['assess-trial.json']:[])])hashes[name]=createHash('sha256').update(await readFile(join(output,name))).digest('hex');
await writeFile(join(output,'manifest.json'),JSON.stringify({contract:'assess-trial-package/1',hashes,inputs,
 scopeBound:Boolean(scope),
 rpc:['trial_maintain_v1','trial_claim_v1','trial_finish_v1','trial_fail_v1','trial_health_v1'],limit:1,
 runtimeOrLaunchVerified:false},null,2)+'\n');
console.log(JSON.stringify({contract:'assess-trial-build/1',output,runtimeOrLaunchVerified:false}));
