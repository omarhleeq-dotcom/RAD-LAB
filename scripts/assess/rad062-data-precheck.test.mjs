import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLocalDatabase } from './local-database.mjs';
import { dataPrecheck, conditions } from './rad062-data-precheck.mjs';
test('pre-M01 precheck uses only existing schema, reports the complete batch before STOP and leaves no objects', async () => {
  const db = await openLocalDatabase('pglite');
  const client = { query: async sql => { if(sql.startsWith('begin read only') || sql==='rollback') { await db.exec(sql); return { rows:[] }; } return { rows:await db.query(sql) }; } };
  let reported;
  try {
    const initial = await dataPrecheck(client, rows => { reported=rows; });
    assert.equal(initial.data_precheck_failures,0);
    assert.equal(reported.length,conditions().length);
    assert.ok(reported.every(r=>Number(r.count)===0 && /\.sql:[1-9][0-9]*$/.test(r.source)));
    await db.exec(`insert into auth.users(id) values('00000000-0000-0000-0000-000000000001');
      update public.profiles set display_name='bad' where user_id='00000000-0000-0000-0000-000000000001';`);
    const accepted=await dataPrecheck(client, rows => { reported=rows; });
    assert.equal(Number(accepted.accepted_invalid_name_profiles),1);
    assert.equal(accepted.data_precheck_failures,0);
    assert.equal(Number(reported.find(r=>r.condition==='accepted_invalid_name_profiles').count),1);
    assert.equal(reported.length,conditions().length);
    assert.equal((await db.query("select to_regprocedure('public.rad062_valid_full_name(text)') is null absent"))[0].absent,true);
  } finally { await db.close(); }
});

test('multiple violations report every count together before the single STOP', async () => {
  const counts=Object.fromEntries(conditions().map(([key])=>[key,'0']));
  counts.invalid_name_profiles='2'; counts.drafts_above_64kib='3'; counts.sessions_invalid_lifecycle='4';
  let reported;
  const db={ query:async sql=>({ rows:sql.startsWith('with usage')?[counts]:[] }) };
  await assert.rejects(dataPrecheck(db,rows=>{ reported=rows; }),{ message:'data_precheck' });
  assert.equal(reported.length,conditions().length);
  assert.deepEqual(reported.filter(r=>Number(r.count)>0).map(r=>r.count),['2','3','4']);
});


test('D-NAMES: nonzero legacy names pass; each other nonzero precheck condition still stops after the complete report', async () => {
  const base=Object.fromEntries(conditions().map(([key])=>[key,'0']));
  base.invalid_name_profiles='10';
  let reported;
  const client=counts=>({ query:async sql=>({ rows:sql.startsWith('with usage')?[counts]:[] }) });
  const accepted=await dataPrecheck(client(base),rows=>{reported=rows;});
  assert.equal(accepted.accepted_invalid_name_profiles,'10');
  assert.equal(accepted.data_precheck_failures,0);
  assert.equal(reported.find(r=>r.condition==='accepted_invalid_name_profiles').count,'10');
  for(const [key] of conditions().filter(([key])=>key!=='invalid_name_profiles')) {
    await assert.rejects(dataPrecheck(client({...base,[key]:'1'}),rows=>{reported=rows;}),{message:'data_precheck'});
    assert.equal(reported.length,conditions().length);
    assert.equal(reported.find(r=>r.condition===key).count,'1');
  }
  await assert.rejects(dataPrecheck(client({...base,invalid_name_profiles:'invalid'}),()=>{}),{message:'data_precheck'});
});
