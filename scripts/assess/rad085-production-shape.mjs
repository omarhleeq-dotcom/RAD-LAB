// Test input only: exact production deviations, never normalize observed catalogues.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const productionSchema = readFileSync('supabase/fixtures/production-schema-2026-11-01/schema.sql','utf8');
assert.equal(createHash('sha256').update(productionSchema).digest('hex'),'4fc018a257d80b18916bae6ade40c625449a11cbf5fe52e2f47110db6f1e58b1');
export function productionShapeSql() {
 const functions=['owner_list_participants','rls_auto_enable'].map(name=>{
  const matches=[...productionSchema.matchAll(new RegExp(`^CREATE FUNCTION public\\.${name}\\(\\)[\\s\\S]*?^ALTER FUNCTION public\\.${name}\\(\\) OWNER TO postgres;`,'gm'))];
  assert.equal(matches.length,1);
  return matches[0][0].replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION');
 });
 const grants=['events','attempts','feedback','c2_account_deletions'].map(name=>{
  const matches=[...productionSchema.matchAll(new RegExp(`^GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public\\.${name} TO service_role;$`,'gm'))];
  assert.equal(matches.length,1); return matches[0][0];
 });
 return [...functions,...grants].join('\n');
}
// Schema-only application projection for embedded PG; provider extensions/event
// triggers are covered separately by the full pinned RAD-086 catalogue rehearsal.
export function productionApplicationSql() {
 const blocks=productionSchema.split(/(?=^--\n-- Name: )/m).slice(1);
 return "set check_function_bodies=false;set search_path='';\ncreate schema auth;create schema assess;\n"+blocks.filter(block=>{
  const header=block.split('\n')[1];
  return /; Schema: (auth|assess|public);/.test(header);
 }).map(block=>block.replace(/^\\(?:un)?restrict .*$/gm,'')).join('\n');
}
