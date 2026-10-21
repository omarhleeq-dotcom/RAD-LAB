import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {expect,it} from "vitest";

it("rehearses the exact login scripts and catalogue drift on a new disposable database",()=>{
 const child=spawnSync(process.execPath,["scripts/assess/worker-login-rehearsal.mjs","--synthetic-disposable","--backend=pglite"],{encoding:"utf8",timeout:30000});
 expect(child.status,child.stdout+child.stderr).toBe(0);
 const report=JSON.parse(child.stdout);
 expect(report).toMatchObject({outcome:"PASS",code:"complete",cleanup:true,providerVerified:false,runtimeOrLaunchVerified:false});
 expect(report.checks).toEqual(expect.arrayContaining(["disabled-passwordless-expired-staging","public-temp-surface-reported","catalogue-detects-direct-column-grants-extra-role-inherit-admin","unmanaged-admin-target-refused","gate-and-practice-untouched"]));
 expect(child.stdout).not.toMatch(/synthetic-only-not-a-credential|example\.test|BEGIN CERTIFICATE/);
},40000);

it("rejects remote selectors, extra arguments and missing disposable acknowledgement before setup",()=>{
 for(const args of [[],["--backend=pglite"],["--synthetic-disposable","--backend=https://private.invalid"],["--synthetic-disposable","--backend=pglite","--url=private.invalid"]]){
  const child=spawnSync(process.execPath,["scripts/assess/worker-login-rehearsal.mjs",...args],{encoding:"utf8",timeout:10000});
  expect(child.status).toBe(1);expect(JSON.parse(child.stdout)).toMatchObject({code:"configuration",checks:[],cleanup:true});
  expect(child.stdout).not.toContain("private.invalid");
 }
});

it("keeps inspection read-only and separates committed containment from session termination",()=>{
 const read=(path:string)=>readFileSync(`supabase/${path}`,"utf8");
 const inspect=read("checks/assess-worker-login-ready.sql");
 const executable=inspect.replace(/--[^\n]*|'(?:''|[^'])*'/g,"");
 expect(executable).not.toMatch(/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|call|do)\b/i);
 expect(executable).not.toMatch(/\b(from|join)\s+(auth|public)\./i);
 expect(inspect).toContain("begin read only;");expect(inspect.trim().endsWith("rollback;")).toBe(true);
 const revoke=read("manual/assess-worker-login-revoke.sql");
 expect(revoke.indexOf("commit;")).toBeLessThan(revoke.indexOf("pg_terminate_backend"));
 expect(revoke).toContain("where usename=target and pid<>pg_backend_pid()");
 expect(revoke).not.toMatch(/\b(application_name|query|datname)\s*=/);
 expect(read("manual/assess-worker-login-provision.sql")).toContain("nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole noreplication");
});
