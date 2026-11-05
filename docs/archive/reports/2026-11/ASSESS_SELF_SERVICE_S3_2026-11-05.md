# RAD-105 — استعادة البيئة وعائق S3، 2026-11-05

## 1. الانحرافات والميزانية
الهدف S3 UI C5 فقط؛ توقف قبل تعديل المنتج بسبب فجوة في عقد القراءة المقبول، لا بسبب البيئة.
الميزانية المعلنة خمسة مسارات: DECISIONS وHANDOFF وproject-status وهذا التقرير وفهرس reports المولّد.
لا تعديل SQL أو منتج أو pins أو اختبارات محمية؛ S4 لم تبدأ.

## 2. المنجز والمستبعد
Verified: قبول مراجعة S2 عند `bb56661ea9f7c330e917f424af549a1b34731957` مسجل في أول تحديث S3؛ مصدر القبول رسالة المالك، لا مراجعة جديدة مني.
Verified: GitHub يؤكد #242 مفتوحة وDraft على main؛ الجلب المحدود للفرعين نجح. الرأس المحلي يطابق S2 وorigin/main سلفه؛ لا عمل لاحق مفقود ولا حاجة لدمج.
Verified: قُرئت AGENTS وHANDOFF والحالة والقالب والتصميم §12 وعقد S2 وP7 وتقارير S1 الأصلية/التصحيحية وS2 والقرارات المنطبقة وخريطة إعادة الاستخدام.
مستبعد: تنفيذ S3 والبنية S4 وكل إجراء حي أو أسرار أو Variables أو نشر يدوي أو merge/Ready.

## 3. حالة RAD-105
blocked/owner بسبب حد S3 UI-only، مع بقاء S2 مقبولة. لا إعادة طلب موافقة المنتج؛ المطلوب إذن ضيق لتوسعة عقد قاعدة القراءة فقط.
التفصيل والسلطة: [قرار قبول S2 وتوقف S3](../../../DECISIONS.md#assess-self-service-s3-review-2026-11-05).

## 4. المشتركات وScale
Verified: إعادة الاستخدام المتاحة AuthoringEntry/QuestionImport، AssessConsent، pilot client، P1SupervisorScope، EmergencySession، HistoryPanel وشاشات selfservice الخاملة.
Verified: `assignment_status_v1` يعيد userId/state والعدادات/النوافذ فقط؛ لا sessionId أو was_active أو أهلية بديلة.
Verified: `stop_active_attempts` يحتوي دليل الحالة عند الإيقاف، لكن ترحيل S2 يسحب كل صلاحيات الجدول من أدوار المتصفح ويفعّل RLS.
Verified: البحث عن stop_active_attempts/was_active/granted_at في SQL وكل كود المنتج وجد الالتقاط والمنح وResume/start والفحص، دون RPC قراءة للأهلية.
Verified: `new_attempt_v1(p_assignment,p_session)` يتحقق من الدليل تحت الأقفال؛ استدعاؤه ليس قراءة أهلية، وRPC الحالة لا يوفّر معرّف المحاولة المطلوب.
Inferred: لا يمكن بناء منتقي المحاولات المأذون من الحالة العامة أو audit؛ التخمين أو إدخال UUID يدويًا لا يحقق الواجهة المطلوبة.
المقترح للمراجعة فقط: RPC مرقمة تقرأ own-assignment بصفحات ≤100؛ تعيد studentId/sessionId وeligible/reason وserverTime، دون محتوى أو درجة.
الأهلية تطابق المنح: ACTIVE مثبت، held_at مطابق، grading-failed، غير منتهية، غير ممنوحة وحد الثلاث محفوظ؛ التاريخ المجهول وغير النشط غير مؤهلين.
القراءة لا تستدعي own_assignment_v1 الحالية لأنها تدخل نطاق كتابة؛ تعيد تطبيق حدود التفويض للقراءة، والمنح يعيد التحقق تحت الأقفال دون الثقة بلقطة UI.
لا منح جدول مباشرة. اختبارات الرفض: غير المالك للتكليف، سحب التعيين، التاريخ المجهول، non-active، انتهاء المحاولة، المنحة السابقة وحد الثلاث، والصفحات.
تنفيذ المقترح يحتاج ترحيلًا إضافيًا وخليفة fingerprint ومعايرة مستقلة وطفرات؛ لم تُكتب ملفات مرشحة ولم يُغيّر العقد المقبول.
Verified: candidate يبقى `pilot-v1:c147c107631b68898e4715c8e3a104bfe6bf9b082950665539c61c8021f4ced1`؛ لا boundary-pin أو marker جديد.

## 5. الطب والتقييم
Verified: لا نص طبي أو scoring أو خلط خيارات تغير. أول امتحان يبقى XLSX لدى المالك عبر QuestionImport، لا Git.
Not run: الإثبات الحي questions/mixed/full-practical؛ يبقى مطلوبًا في P7 خطوة 13 ضمن نافذة مستقلة.

## 6. التحقق — استعادة البيئة منفصلة عن S3
Verified: قُرئت cloud-environment-runtime ومرجعية networking وملف network-policy؛ VPN غير مهيأة، وgithub.com مسموح عبر البروكسي المدار.
Verified: environment_status يعرض desired/observed=running وobservations_current=true وpolicy=enforced؛ connected لا يثبت وصول أمر shell منفرد.
Verified: المتغيرات الأربع HTTP(S)_PROXY تشير إلى proxy:8080؛ لا Git proxy override في فحص مفاتيح proxy. طُبعت host/port فقط دون اعتماد أو headers.
Verified: DNS يحل proxy إلى 172.31.24.237. فحص TCP الافتراضي لـ8080/8088 أعاد EPERM؛ مع إذن network للأمر وصل TCP إلى 8080.
Verified: fetch محدود لـmain وclaude/rad105-promotion نجح بالإذن نفسه دون تعديل الشبكة أو Git config أو CA أو TLS أو المصادقة. العطل كان قيد شبكة الأمر، لا دليل تعطل خدمة البروكسي.
Verified: فشل switch --track بسبب remote refspec المحدود بـmain؛ اكتمل اختيار فرع PR الموجود بـ--no-track، وبعده شجرة نظيفة مطابقة للرأس المقبول.
Not run: اختبارات S3 وcheck/build وDB/browser/axe/family؛ لا منتج معدل ولا واجهة مركبة بسبب STOP. لا ادعاء نجاح لها.
Verified: docs:sync مرتين (الثانية 0)، docs:check بلا أخطاء مع 21 تحذير حجم قائم، status:check --require-previous وgit diff --check. docs:check الأول أوقفه EPERM؛ نجح بإذن شبكة الأمر.
Verified: مقارنة src/scripts/supabase بالرأس المقبول بلا فرق؛ خمسة مسارات وثائق فقط. فحوص الرأس المدفوع تُسجل بعد اكتمالها في وصف Draft.

## 7. المفتوح
العائق محدد في عقد القراءة، لا في قبول S2 ولا في الاتصال. رفعه: إذن ضيق للمقترح في §4 مع المعايرة والحفاظ على الأوراكل المحمي؛ ثم استئناف S3 كاملة في #242.
لا يستلزم إصلاح البيئة تغيير إعداد منصة أو أسرار؛ استُخدم إذن شبكة الأمر المتاح. لا fetch متكرر بعد النجاح ولا التفاف على البروكسي.
هل تغير حكم مختصر؟ لا؛ لم يُختصر حكم قائم. هل بقي رابط الدليل الأصلي؟ نعم؛ تقارير S1/S2 والقرارات محفوظة.

## 8. قائمة المالك والنص التالي
قرار واحد مطلوب: السماح بعقد القراءة المحدود في §4 ضمن تصحيح تابع لـS2 قبل UI؛ لا إذن حي أو تغيير assertions قديمة أو إعادة اعتماد S2.
S3 لم تُنفذ؛ النص التالي مشروط بإكمالها ونجاح الرأس المدفوع وقبول مراجعتها، ولا يُستخدم الآن:
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
