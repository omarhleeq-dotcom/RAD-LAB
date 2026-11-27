# RAD-105 — تصحيح ساعة S3، 2026-11-05

## 1. الانحرافات والميزانية
Verified: 12 مسارًا أُعلنت قبل التعديل: server-clock.ts جديد، Management/SelfServiceViews/SelfServiceSession، اختبار selfservice-clock جديد، harness التدقيق، frontend-schema، DECISIONS/HANDOFF/project-status وهذا التقرير وفهرس التقارير المولد.
الأصل والموافقات وQA السابقة محفوظة في [تقرير S3](ASSESS_SELF_SERVICE_S3_IMPLEMENTATION_2026-11-05.md)؛ لا إعادة كتابة لتقرير تاريخي أو تغيير تأكيد محمي.
Verified: قبول S2 عند `bb56661ea9f7c330e917f424af549a1b34731957` محفوظ؛ هذا تصحيح UI مأذون، لا قبول S3 أو بدء S4.

## 2. المنجز والمستبعد
Verified: ساعة مشتركة تستند إلى serverTime/now ثم performance.now؛ لا Date.now للقرار الزمني في هذه الشاشات.
Verified: قائمة الطالب تتحول upcoming → open → missed، وactive → expired عند deadline دون refresh؛ ضوابط النافذة المغلقة، بما فيها grant الموجب القديم، تصبح للقراءة فقط.
Verified: تحرير التكليف والجدولة والتحقق قبل النشر تستعمل الساعة نفسها؛ تبقى نافذة Asia/Amman وساعتان/7 أيام وفحوص DB الأصلية مرجع التنفيذ.
Verified: الرد الجديد، حتى بطابع وقت مطابق، يعيد تثبيت الساعة؛ العودة للظهور تعيد الربط والقراءة بآلية الجلسة القائمة. إزالة المكون تنظف المؤقتات والمستمعات.
مستبعد: SQL/auth/scoring/runner وأي كتابة تلقائية أو retry أعمى، وكل S4/live/secrets/Variables/manual deploy/merge/Ready.

## 3. حالة RAD-105
review/reviewer؛ قبول S3 ما زال معلقًا بمراجعة التصحيح وCI للرأس المدفوع. [التفويض المحلي](../../../DECISIONS.md#assess-self-service-s3-clock-owner-2026-11-05).
Verified: البداية نظيفة عند الرأس المراجع `1a7a7c9cf1d2d62ebe42ce92cb9c1c7a2ecbd967`؛ الجلب المحدود بعد عودة الاتصال أكد تطابق البعيد وmain، وS2 سلف للرأس؛ لا merge/rebase/force-push.

## 4. المشتركات وScale
Verified: hook واحد بـuseSyncExternalStore، snapshot مخزن ومؤقت 250ms؛ قراءة التحقق تستعمل elapsed الحالي مباشرة. لا RPC من ticking أو من hook الرؤية.
Scale: دقة العرض في المقدمة حتى دورة250ms، وقد يؤخر المتصفح الرسم؛ زمن الخادم لقطة لا مزامنة NTP. الرؤية تجدد القراءة، وDB يحسم الإذن/الموعد عند الطلب.
Verified: pin وحيد لـSelfServiceSession: `e56aacbc14b3` → `72b9f9a31499` لتمرير serverTime للقائمة؛ بقية pins ومحولات API بلا تغيير.
Verified: gate المحمي يقبل Candidate نفسه `pilot-v1:ddb4de0e9e50414239f8ebc0046d84608579928bbf7f3543721cb0c1ce960e4b`؛ pin المصدر لا يدخل حساب marker، ولا تغيّر SQL/checks.
Verified: SQL والتفويض والتقييم وrunner والشهود/health وC3 والهاتف بلا فرق عن الرأس المراجع.
Inferred: لا أثر في fingerprints لعدم تغير SQL/checks؛ لا ندّعي إعادة معايرة DB محلية، وCI النهائي يعيد فحصها.

## 5. الطب والتقييم
Verified: لا تغيير طبي أو درجة أو ترتيب سؤال/خيار. حالات العرض لا تستنتج أهلية من failed/held، ولا تحرر حجزًا.
أول امتحان حقيقي يبقى XLSX لدى المالك عبر QuestionImport خارج Git؛ الإثبات الحي للمسارات الثلاثة يبقى P7 خطوة13.

## 6. التحقق — البيئة منفصلة عن المنتج
Verified: runtime running/policy enforced؛ fetch الأول 503 upstream timeout رغم TCP متاح، ثم بعد إعادة إتاحة البيئة HTTP200 وجلب محدود ناجح؛ proxy/CA/TLS/auth/config محفوظة.
Verified: المتصفح المحلي المركب عبر المحول الفعلي EN/AR390/1440: 28 تدقيق axe/overflow و80 تحققًا أولًا، ثم أربعة تدقيقات إغلاق موجهة و36 تحققًا بعد تعطيل grant القديم؛ جميع انتقالات الزمن، skew/jumps، النشر المقصود فقط، وغياب RPC تلقائي. runtime بلا أخطاء.
Verified: فحص بصري لصورتَي AR390 read-only وEN1440 open؛ الصور محلية /tmp. هذا دليل اصطناعي مركب، لا إنتاج/هاتف حقيقي.
Verified: تدقيقات عائلات questions/mixed/full-practical والسجل/الاستعادة السابقة يعاد استخدام دليلها المرتبط بالأصل؛ لا تغيير معني يستدعي تكرارها.
Verified: health:test9/9. محاولة health/source وlint المتزامنة اصطدمت بملفات الطفرات المؤقتة للاختبار؛ نُظفت، ويعاد الفحصان بالتتابع دون تغيير تأكيد/مهلة.
Verified: docs:sync مرتان (الثانية صفر)، docs:check بلا أخطاء مع تحذيرات الحجم القائمة، status:check --require-previous وgit diff --check.
Verified: تشغيل Node22 لـ`CI_TEST_LANE=unit npm run check -- -- --maxWorkers=2`: typecheck/lint نجحا (تحذيران قائمان)، unit2589/2596؛ سبع مهلات في ستة ملفات مخطط/عرض تاريخية غير معدلة، بلا إخفاق قيمة/تأكيد. لا ادعاء green محلي كامل.
Verified: البناء العادي وPages داخل Node22 نجحا، وhealth:source بلا أخطاء أو clones جديدة؛ اختبار health9/9 نُفذ منفصلًا وانتهى تنظيفه.
Verified: رفض SWC native-cache على المضيف فُصل عن المنتج؛ typecheck/build نُفذا داخل الحاوية المحلية مع المكتبات القائمة، دون تغيير proxy/CA/TLS/auth أو إعداد دائم.
Verified: health:sizes ناجح بالسقوف القائمة. التشغيل الموجه المنفرد النهائي72/72 في9 ملفات: اختبارات الساعة8 وS3 UI7 وP2/schema18، و39 اختبارًا في الملفات الستة التي ظهرت فيها المهلات.
الأوامر: `npm run build` و`npm run build:pages` و`npm run health:sizes`؛ Vitest للملفات التسعة بـ`--maxWorkers=1`، والمتصفح `RAD105_CLOCK_ONLY=1 node src/features/assess/selfservice-audit.mjs` ثم `RAD105_AUDIT_LABELS=clock-readonly` للحالة المتأثرة فقط.
Not run محليًا: CI للرأس المدفوع تشغيل خارجي مستقل؛ دليله الدقيق وحالة Deploy في [وصف Draft #242](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242). نجاح الرأس المراجع لا يثبت التصحيح.

## 7. المفتوح والحدود
S3 لا تُقبل قبل CI النهائي ومراجعة التنسيق. لا إذن S4 أو تفعيل حي من عودة الاتصال أو من Deploy المحجوب.
لم يُختصر حكم: هل تغير الحكم؟ لا. هل بقي رابط دليله الأصلي؟ نعم؛ التقرير الأصلي والقرارات محفوظة.

## 8. قائمة المالك والنص التالي
لا قرار منتج جديد مطلوب؛ مراجعة دليل التصحيح وCI، ثم قبول S3 شرط سابق للنص التالي، المحفوظ حرفيًا من تسليم S3:
```text
Mode: implement — S4 of 4, RAD-105, existing Draft PR #242 only.
Prerequisite: S3 is complete, final pushed-head CI passes, and coordination review
accepts S3. Verify current remote state and preserve subsequent legitimate work.
Otherwise STOP. Keep #242 Draft on main; merge origin/main only if needed,
no rebase, force-push, new PR, merge or Ready. Declare exact paths/budget first.
Read AGENTS, HANDOFF, RAD-105 status, TASK_PROMPT, design §12, S1 original and
corrective reports, S2/S3 reports, applicable DECISIONS and the P7 runbook.
Implement S4 only: approved items 1/6/7/10, C6 audits, P7 update and C7 report.
Offline scripts default to dry-run. Daily encrypted DB dump: private bucket,
bounded retention/failure alert, separate least-privilege assess_backup role,
credential only in Secret Manager. Prove complete dump/restore and exact read
grants without write/admin privileges before any later live activation.
Post-stop Scheduler failure notices <=1/hour and say stop may be intentional;
DB size alert at 70% of plan limit via existing alert channels. Investigate source
connection restrictions first; STOP/report options for paid features or any cost
increase. Enable nothing. Preserve S3 UI, S2 notices OFF/consent/targeting/dedup,
C1/C2 lifecycle-v1 health and strict witnesses, C3, protected assertions, applied
migrations, group scope, erasure, phone packets and existing server shuffles.
Complete relevant EN/AR390/1440 browser/axe/family audits; reuse passing evidence
unless relevant changes or unresolved concerns justify rerunning it. Run relevant
tests and repository checks/build; docs:sync twice, docs:check,
status:check --require-previous, git diff --check; verify final pushed-head CI.
Explain legitimate pins/markers; STOP on conflicting authority, unexplained
fingerprints, another unauthorized protected-contract change, live/secret need.
No live SQL/cloud/Vault/Brevo, secrets, Variables, provider/cron activation,
manual deployment, merge or Ready. Expected Deploy blocking authorizes no change.
Arabic S-STD-1 sections 1–8 <=150 lines, Verified/Inferred/Not run with reasons;
accurate status and Draft description. Leave a conditional owner P7 prompt only.
First real exam stays owner-held XLSX via QuestionImport, never Git; live proof
of questions/mixed/full-practical remains mandatory at P7 step 13.
```
