import {expect,it} from 'vitest';
import {databaseSizeMonitor} from './database-size';
it('plan and measurement are explicit; missing, malformed and oversized values are UNKNOWN, never zero',()=>{
 for(const limit of [undefined,null,'','0','-1','1e3','500 MB','9007199254740992',500000000]){
  const m=databaseSizeMonitor(limit);m.observe('0');expect(m.enabled).toBe(false);expect(m.report()).toEqual({state:'UNKNOWN',reason:'plan_limit_unknown'});
 }
 const m=databaseSizeMonitor('500000000');expect(m.report()).toEqual({state:'UNKNOWN',reason:'sample_missing'});
 for(const bytes of [null,undefined,'-1','01','1e3','9007199254740992',10]){m.observe(bytes);expect(m.report()).toEqual({state:'UNKNOWN',reason:'sample_invalid'});}
});
it('threshold-1/exact/+1, zero and safe large sizes use the unchanged exact 70% arithmetic',()=>{
 const m=databaseSizeMonitor('500000000');
 for(const [bytes,alert] of [[349999999,false],[350000000,true],[350000001,true],[0,false]] as const){m.observe(String(bytes));expect(m.report()).toEqual({state:'MEASURED',databaseBytes:bytes,planLimitBytes:500000000,databaseSizeAlert70:alert});}
 const large=databaseSizeMonitor(String(Number.MAX_SAFE_INTEGER));large.observe(String(Number.MAX_SAFE_INTEGER));expect(large.report()).toMatchObject({state:'MEASURED',databaseSizeAlert70:true});
});
