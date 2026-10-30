// Pure additive transport. No database, credentials, URL or environment input.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stopTransport, sha256 } from './emergency-stop-packet.mjs';
import { lineBoundedParts } from './phone-sql-packet.mjs';
const stopPath='supabase/manual/assess-emergency-stop-v2.sql';
const verifyPath='supabase/checks/assess-emergency-stopped-v2.sql';
const target='docs/RAD-062_P05_PHONE_PACKET.md';
const read=p=>readFileSync(p,'utf8');
export const stopV2Transport=()=>stopTransport(read(stopPath));
export function renderV2Packet() {
 const section=(title,sql,path)=>`\n## ${title}\n\nالمصدر: ${path}؛ SHA-256: ${sha256(read(path))}.\n\n`
  +lineBoundedParts(sql).map((p,i)=>`الجزء${i+1} — ${p.length} حرفًا.\n\n\`\`\`sql\n${p}\n\`\`\`\n`).join('\n');
 return '# RAD-062 P5 — طوارئ RAD-059 v2 للهاتف\n\nهذه حزمة إضافية خاملة؛ **لا تستخدم قبل اكتمال يوم القاعدة وترقية P10**. المخطط الحالي يستعمل [حزمة v1](RAD-059_PHONE_PACKET.md) دون تغيير. لا إذن SQL حي هنا. بعد الترقية: افتح Supabase SQL Editor من الهاتف، اجمع كل أجزاء الإجراء المختار بالترتيب في استعلام واحد ثم Run مرة واحدة؛ لا تشغّل جزءًا منفردًا ولا COMMIT مبكرًا. كل جزء أقل من15000حرف بعد wrapper وعلى حدود الأسطر؛ لا تكسر base64. لا حاجة للابتوب أو CLI أو تثبيت دالة وقت الطوارئ؛ freeze_v2 مثبتة ضمن M05 في يوم القاعدة.\n\nالإيقاف ست مراحل مستقلة بمهلة lock2s/statement5s لكل مرحلة، وSELECT نتيجة واحدة. يجمد active/grading/grading-failed/awaiting-manual مع حفظ وقت التسليم وdeadline وstartedAt؛ retryAt=التسليم+7أيام بلا تمديد. لا تعديل للأجوبة أو الدرجات المؤقتة أو النتائج النهائية. PARTIAL/FAILED يعني مراجعة errors والإبقاء على الإغلاق؛ أعد الإيقاف بعد إزالة سبب التعذر ثم التحقق. التكرار لا يرفع revision ولا يغير وقت hold مجددًا.\n\nبعد COMMIT افتح استعلامًا جديدًا ونفّذ التحقق المستقل (SELECT واحدة للقراءة فقط). انقطاع ACK أو الشبكة لا يثبت نجاحًا؛ تحقق مستقلاً. STOPPED ليس إثبات إيقاف السحابة أو cache أو السر أو قبول التشغيل: أبق السر DISABLED وأوقف العامل وفق [دليل RAD-059](RAD-059_PHONE_RUNBOOK.md)، ولا تعِد فتح gate أو الاستئناف أو الاسترداد من هذه الحزمة. فشل dry-run الهاتف حاجب لترقية الكتابي.\n'
 +section('1 الإيقاف — معاملة واحدة',stopV2Transport().join(''),stopPath)
 +section('2 تحقق مستقل بعد COMMIT — قراءة فقط',read(verifyPath),verifyPath);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==3||!['--write','--check'].includes(process.argv[2]))throw Error('usage: --write|--check');
 const packet=renderV2Packet();
 if(process.argv[2]==='--write')writeFileSync(target,packet);
 else if(read(target)!==packet)throw Error('emergency_v2_packet_drift');
 console.log('RAD-062 P5 local v2 packet '+(process.argv[2]==='--write'?'generated':'matches')+'; no live acceptance.');
}
