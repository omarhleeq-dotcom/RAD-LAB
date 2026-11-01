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
    await assert.rejects(dataPrecheck(client, rows => { reported=rows; }),{ message:'data_precheck' });
    assert.equal(Number(reported.find(r=>r.condition==='invalid_name_profiles').count),1);
    assert.equal(reported.length,conditions().length);
    assert.equal((await db.query("select to_regprocedure('public.rad062_valid_full_name(text)') is null absent"))[0].absent,true);
  } finally { await db.close(); }
});
