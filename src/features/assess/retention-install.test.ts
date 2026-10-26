import {historicalRad085Input} from "./server-rad085-contracts";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFileSync,readdirSync} from "node:fs";
import {expect,it} from "vitest";
const read=(p:string)=>readFileSync(`supabase/${p}`,"utf8");
const manual=read("manual/assess-original-retention-install.sql"),pre=read("checks/assess-retention-preinstall.sql"),post=read("checks/assess-retention-postinstall.sql"),source=read("migrations/20261020001100_assess_retention.sql");
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const query=(s:string)=>s.slice(s.indexOf("with catalogue as ("),s.lastIndexOf(";\nrollback;"));
it("contains only exact retention DDL inside one guarded transaction, finite reviewed sources and a post-COMMIT proof",()=>{
 const interior=source.slice(source.indexOf("\nbegin;\n")+8,source.lastIndexOf("commit;"));
 expect(manual.split(`-- SOURCE RETENTION BEGIN SHA256 ${hash(source)}\n`)[1]?.split("-- SOURCE RETENTION END")[0]).toBe(interior);
 const writer=(s:string)=>query(s).replace("read_only and tables_present","tables_present");
 expect(manual).toContain(writer(pre));expect(manual).toContain(writer(post));expect(manual).toContain(query(post));
 expect(manual).toMatch(/commit;\n-- This final row[\s\S]*begin read only;/);
 expect(manual.replace(interior,"")).not.toMatch(/create role|create schema|insert into (auth|public|assess)\.|update assess\.launch_gate|PILOT_SCHEMA_VERIFIED|select assess\.[a-z_]+\(/i);
 expect(manual).toContain("WITHOUT a current backup");expect(manual).toContain("in access exclusive mode;");
 const defs=new Map<string,string>();
 for(const f of historicalRad085Input(readdirSync("supabase/migrations")).filter(f=>f.endsWith(".sql")&&f>="20261020000600").sort())for(const d of read(`migrations/${f}`).matchAll(/create(?: or replace)? function assess\.([a-z_0-9]+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$;/gi))defs.set(d[1]!,d[2]!);
 expect(defs.size).toBe(36);
 // Independent lexical review before accepting LF and uniform CRLF hashes. No normalisation.
 for(const [name,body] of defs){
  for(const token of body.match(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/g)??[])if(token.startsWith("'"))expect(token).not.toMatch(/[\r\n]/);else expect(token.startsWith("$")).toBe(false);
  expect(post).toContain(`('${name}','${hash(body)}','${hash(body.replaceAll("\n","\r\n"))}')`);
 }
 const executable=post.replace(/--[^\n]*|'(?:''|[^'])*'/g,"");
 expect(executable).not.toMatch(/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|call|do)\b/i);
 expect(executable).not.toMatch(/\b(from|join)\s+(public|auth)\./i);
 expect(post).toContain("begin read only;");expect(post.trim().endsWith("rollback;")).toBe(true);
});
it.each(["lf","crlf"])("rehearses original upgrade, drift, replay and atomic rollback on disposable PGlite (%s)",lineEndings=>{
 const c=spawnSync(process.execPath,["scripts/assess/retention-install-rehearsal.mjs","--synthetic-disposable","--backend=pglite",`--line-endings=${lineEndings}`],{encoding:"utf8",timeout:30000,maxBuffer:100000});
 expect(c.status,c.stdout+c.stderr).toBe(0);const r=JSON.parse(c.stdout);
 expect(r).toMatchObject({outcome:"PASS",code:"complete",lineEndings,cleanup:true,backupVerified:false,restoreVerified:false,providerBackupsVerified:false,runtimeOrLaunchVerified:false});
 expect(r.checks).toEqual(expect.arrayContaining(["ddl-exception-entire-upgrade-rollback","postcondition-entire-upgrade-rollback","no-implicit-v2","replay-rejected","practice-write-still-authorized"]));
 expect(c.stdout).not.toMatch(/@example|00000000-|accepted_at|correctOptionId/);
},40000);
it("rejects remote selectors and missing disposable acknowledgement",()=>{
 for(const args of [["--backend=pglite"],["--synthetic-disposable","--backend=https://private.invalid","--line-endings=lf"]]){
  const c=spawnSync(process.execPath,["scripts/assess/retention-install-rehearsal.mjs",...args],{encoding:"utf8",timeout:10000});
  expect(c.status).toBe(1);expect(JSON.parse(c.stdout)).toMatchObject({code:"configuration",checks:[],cleanup:true});expect(c.stdout).not.toContain("private.invalid");
 }
});
