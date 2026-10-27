// Local/CI dependency setup only. No database connection or provider configuration.
import {execFileSync} from 'node:child_process';
import {existsSync,symlinkSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
if(process.platform!=='linux'||process.arch!=='x64')throw Error('RAD085 requires Linux x64 PostgreSQL test binaries');
const prefix='/tmp/radlab-ops-postgres';
mkdirSync(prefix,{recursive:true});
for(const file of ['package.json','package-lock.json'])copyFileSync(new URL('./postgres-test/'+file,import.meta.url),join(prefix,file));
execFileSync('npm',['ci','--prefix',prefix,'--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
const root='/tmp/radlab-ops-postgres/node_modules/@embedded-postgres/linux-x64/native/lib';
for(const [alias,target] of [['libicuuc.so.60','libicuuc.so.60.2'],['libicudata.so.60','libicudata.so.60.2'],['libicui18n.so.60','libicui18n.so.60.2'],['libpq.so.5','libpq.so.5.18']]) {
 if(!existsSync(join(root,target)))throw Error('PostgreSQL library missing');
 if(!existsSync(join(root,alias)))symlinkSync(target,join(root,alias));
}
