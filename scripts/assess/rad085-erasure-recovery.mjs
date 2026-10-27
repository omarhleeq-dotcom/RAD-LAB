// Synthetic protocol only. No provider, production store, URL, server or gate opener.
import { createHmac, timingSafeEqual } from 'node:crypto';
const CONTRACT = 'rad085-synthetic-reconciliation/1';
const ACTIONS = new Set(['account-delete','sharing-withdraw','appointment-revoke','group-end','member-leave','account-stop','assignment-close']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fail = () => { throw Error('reconciliation_closed'); };
const exact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join() === [...keys].sort().join();
const genesis = '0'.repeat(64);
const same = (a,b) => typeof a==='string' && typeof b==='string' && a.length===64 && b.length===64 && timingSafeEqual(Buffer.from(a),Buffer.from(b));
function body(e) { return JSON.stringify([CONTRACT,e.sequence,e.operation,e.action,e.target,e.at,e.previous]); }
function valid(e) {
 return exact(e,['sequence','operation','action','target','at','previous','mac']) &&
  Number.isSafeInteger(e.sequence) && e.sequence>0 && UUID.test(e.operation) && UUID.test(e.target) &&
  ACTIONS.has(e.action) &&
  typeof e.at==='string' && Number.isFinite(Date.parse(e.at)) && new Date(e.at).toISOString()===e.at &&
  /^[0-9a-f]{64}$/.test(e.previous) && /^[0-9a-f]{64}$/.test(e.mac);
}
/** Requires a key and current authenticated head kept OUTSIDE the restored snapshot.
 * The caller must not install a production adapter before the separate policy/operator approval.
 * Signing is not completeness: completeness requires the independent, frozen latest head.
 */
export function syntheticJournal(key) {
 if (!(key instanceof Uint8Array) || key.byteLength<32) fail();
 const mac = e => createHmac('sha256',key).update(body(e)).digest('hex');
 return Object.freeze({
  genesis,
  event(previous, input) {
   if(!exact(previous,['sequence','mac']) || !Number.isSafeInteger(previous.sequence) || previous.sequence<0 || !/^[0-9a-f]{64}$/.test(previous.mac)) fail();
   const e={...input,sequence:previous.sequence+1,previous:previous.mac,mac:''};
   e.mac=mac(e); if(!valid(e)) fail(); return Object.freeze(e);
  },
  verify(e) { return valid(e) && same(e.mac,mac(e)); }
 });
}
/** Two passes: verify a bounded paged journal, then replay idempotent restrictive effects.
 * Every run starts closed and revokes old capabilities, including a resumed run.
 * Failure yields no ready certificate; it never opens access itself.
 * ports.seal must exclude new writes until the operator consumes/discards the certificate.
 */
export async function reconcileSynthetic({contract, journal, ports, pageSize=50, maxEvents=10000}) {
 if(contract!==CONTRACT || !Number.isInteger(pageSize) || pageSize<1 || pageSize>100 || !Number.isSafeInteger(maxEvents) || maxEvents<1) fail();
 if(await ports.quarantine()!==true || await ports.revokeAll()!==true) fail();
 const head=await ports.seal();
 if(!exact(head,['sequence','mac']) || !Number.isSafeInteger(head.sequence) || head.sequence<0 || head.sequence>maxEvents || !/^[0-9a-f]{64}$/.test(head.mac)) fail();
 if(head.sequence===0 && head.mac!==genesis) fail();
 async function walk(apply) {
  let sequence=0, previous=genesis;
  while(sequence<head.sequence) {
   const rows=await ports.page(sequence,Math.min(pageSize,head.sequence-sequence));
   if(!Array.isArray(rows) || rows.length===0 || rows.length>Math.min(pageSize,head.sequence-sequence)) fail();
   for(const e of rows) {
    if(!journal.verify(e) || e.sequence!==sequence+1 || !same(e.previous,previous)) fail();
    if(apply) { if(await ports.apply(e)!==true || await ports.verify(e)!==true) fail(); }
    previous=e.mac; sequence=e.sequence;
   }
  }
  if(sequence!==head.sequence || !same(previous,head.mac)) fail();
 }
 await walk(false);
 await walk(true);
 // Existing maintain_v1 must drain/verify original deadlines; no newly invented TTL.
 if(await ports.maintainAndVerify()!==true || await ports.verifyRevoked()!==true) fail();
 const current=await ports.latest();
 if(!exact(current,['sequence','mac']) || current.sequence!==head.sequence || !same(current.mac,head.mac)) fail();
 return Object.freeze({contract:CONTRACT,status:'synthetic-verified',sequence:head.sequence,mac:head.mac});
}

/** Disposable durable journal outside both source/restored databases. Synthetic-only:
 * no supplied path, credentials or production reopen. fsync + restrictive file modes;
 * unresolved intents or an unacknowledged tail prevent seal, never silently truncate.
 */
export async function openSyntheticRecoveryEvidence() {
 const fs=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {randomBytes}=await import('node:crypto');
 const dir=fs.mkdtempSync(join(tmpdir(),'rad085-erasure-evidence-'));fs.chmodSync(dir,0o700);
 const key=randomBytes(32), journal=syntheticJournal(key);let closed=false;
 const syncDir=()=>{const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
 function write(name,value) {
  const path=join(dir,name),temp=path+'.tmp';const fd=fs.openSync(temp,'w',0o600);
  try{fs.writeFileSync(fd,JSON.stringify(value));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.renameSync(temp,path);syncDir();
 }
 const read=name=>JSON.parse(fs.readFileSync(join(dir,name),'utf8'));
 const check=()=>{if(closed)fail();};
 const name=n=>`event-${String(n).padStart(12,'0')}.json`;
 function rawHead(){check();const h=read('head.json');if(!exact(h,['sequence','mac']) || !Number.isSafeInteger(h.sequence)||h.sequence<0||!/^[0-9a-f]{64}$/.test(h.mac))fail();return h;}
 try {
  write('head.json',{sequence:0,mac:journal.genesis});
  return Object.freeze({journal,
   prepare(input) {
    check();const h=rawHead();if(h.sequence>=10000||fs.readdirSync(dir).filter(f=>f.startsWith('pending-')).length>=100)fail();const event=journal.event(h,input);const file=`pending-${event.operation}.json`;
    if(fs.existsSync(join(dir,file))){if(JSON.stringify(read(file))!==JSON.stringify(input))fail();return;}
    // A restrictive intent is durable BEFORE its database mutation. It is not completed evidence.
    write(file,input);
   },
   complete(operation, verified) {
    check();if(verified!==true||!UUID.test(operation))fail();const file=`pending-${operation}.json`;
    const input=read(file),h=rawHead();if(input.operation!==operation)fail();
    const e=journal.event(h,input);if(fs.existsSync(join(dir,name(e.sequence))))fail();
    write(name(e.sequence),e);write('head.json',{sequence:e.sequence,mac:e.mac});
    fs.unlinkSync(join(dir,file));syncDir();return e;
   },
   head() {
    const h=rawHead();
    // These names are control metadata only. Payload reading remains bounded by page().
    for(const f of fs.readdirSync(dir))if(f.startsWith('pending-')||f.endsWith('.tmp')||(/^event-\d+\.json$/.test(f)&&Number(f.slice(6,-5))>h.sequence))fail();
    return h;
   },
   page(after,limit) {
    check();if(!Number.isSafeInteger(after)||after<0||!Number.isInteger(limit)||limit<1||limit>100)fail();
    const h=rawHead(),rows=[];for(let n=after+1;n<=Math.min(h.sequence,after+limit);n++)rows.push(read(name(n)));return rows;
   },
   close(){if(closed)return;closed=true;key.fill(0);fs.rmSync(dir,{recursive:true,force:true});}
  });
 }catch(e){key.fill(0);fs.rmSync(dir,{recursive:true,force:true});throw e;}
}
