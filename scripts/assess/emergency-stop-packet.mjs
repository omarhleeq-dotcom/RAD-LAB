// Pure repository transport. No DB, network, environment, credentials or live input.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lineBoundedParts } from './phone-sql-packet.mjs';

const stopPath='supabase/manual/assess-emergency-stop.sql';
const verifyPath='supabase/checks/assess-emergency-stopped.sql';
const monitorPath='supabase/checks/assess-operations-monitor.sql';
const read=p=>readFileSync(p,'utf8');
export const sha256=s=>createHash('sha256').update(s).digest('hex');
export function stopTransport(sql=read(stopPath)) {
 // Each inner DO remains a separate top-level statement with its own timeout.
 // Encoding the whole transaction in one DO would defeat that boundary.
 const encoded=sql.replace(/do (\$[a-z_]+\$)[\s\S]*?\1;/g,body=>{
  const line=`DO $phone$ BEGIN EXECUTE convert_from(decode('${Buffer.from(body,'utf8').toString('base64')}','base64'),'UTF8'); END $phone$;`;
  if(line.length>=15000)throw Error('oversized_phase_requires_reviewed_alternative');
  return line;
 });
 return lineBoundedParts(encoded);
}
export function renderPacket() {
 const section=(title,sql,source)=>`\n## ${title}\n\nالمصدر: ${source}؛ SHA-256: ${sha256(sql)}.\n\n`
  +lineBoundedParts(sql).map((p,i)=>`الجزء${i+1} — ${p.length} حرفًا.\n\n\`\`\`sql\n${p}\n\`\`\`\n`).join('\n');
 return '# RAD-059 — حزمة SQL للهاتف\n\nمولّدة من مصادر Git محليًا؛ لا إذن تشغيل حي. اقرأ [دليل الهاتف](RAD-059_PHONE_RUNBOOK.md). اجمع **كل أجزاء الإجراء المختار** في محرر واحد قبل Run مرة واحدة؛ لا تنفيذ جزء أو COMMIT مبكرًا. أقل من15000حرف لكل جزء بعد الغلاف. لا تضف سطرًا داخل base64. لا function DDL أو ترحيل أو بيانات أشخاص.\n\nالإيقاف ست مراحل، lock2s/statement5s لكل مرحلة. PARTIAL/FAILED يعني الإبقاء على الإغلاق ومراجعة errors؛ صف STOPPED قبل COMMIT لا يغني عن استعلام التحقق المستقل بعدها. انقطاع الشبكة/خطأ COMMIT لا يثبت نجاحًا: افتح استعلامًا جديدًا وتحقق.\n'
 +section('1 الإيقاف — معاملة واحدة',stopTransport().join(''),stopPath)
 +section('2 التحقق بعد الإيقاف — قراءة فقط',read(verifyPath),verifyPath)
 +section('3 المراقبة أثناء النافذة — قراءة فقط',read(monitorPath),monitorPath);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==3||!['--write','--check'].includes(process.argv[2]))throw Error('usage: --write|--check');
 const target='docs/RAD-059_PHONE_PACKET.md',packet=renderPacket();
 if(process.argv[2]==='--write')writeFileSync(target,packet);
 else if(read(target)!==packet)throw Error('emergency_packet_drift');
 console.log('RAD-059 local phone packet '+(process.argv[2]==='--write'?'generated':'matches')+'; no live acceptance.');
}
