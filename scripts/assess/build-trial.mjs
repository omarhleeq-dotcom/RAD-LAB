// Local curated package only. No image push/build, deployment, provider or mounts.
import { build } from 'esbuild';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
if(process.argv.length!==2)throw new Error('No arguments accepted');
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
ENV NODE_ENV=production ASSESS_TRIAL_ENABLED=0
USER node
ENTRYPOINT ["node", "/app/trial.mjs"]
`;
await writeFile(join(output,'Dockerfile'),dockerfile);
const hashes={};
for(const name of ['trial.mjs','Dockerfile'])hashes[name]=createHash('sha256').update(await readFile(join(output,name))).digest('hex');
await writeFile(join(output,'manifest.json'),JSON.stringify({contract:'assess-trial-package/1',hashes,inputs,
 rpc:['trial_maintain_v1','trial_claim_v1','trial_finish_v1','trial_fail_v1','trial_health_v1'],limit:1,
 runtimeOrLaunchVerified:false},null,2)+'\n');
console.log(JSON.stringify({contract:'assess-trial-build/1',output,runtimeOrLaunchVerified:false}));
