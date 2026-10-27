# RAD-085 — DB day P1 · حزمة المالك · PROPOSAL ONLY

**لا تنفذ الآن.** هذه قائمة مرتبة لـSupabase SQL Editor، لا إذن اتصال أو SQL حي أو دمج. المالك وحده ينفذ بعد إذن مستقل ومراجعة [العقود](RAD-085_SQL_CONTRACTS_2026-10-26.md) و[حزمة التطبيق الأصلية](archive/RAD-085_APPLICATION_PACKET_2026-10-26.md). ترتيبها لا يفتح P2 أو العامل أو امتحانًا حقيقيًا. [D3](RAD-085_D3_SQL_GAP.md) غير منفذ: **لا تعيين مشرف حقيقي قبل دمج إصلاحه**. RAD-082 غير مكتملة؛ لا تعامل النسخ الآلية كأمر منجز.

## 1. Pre-check — قبل أي كتابة

- [ ] اعتماد [نصي Terms EN/AR المقترحين](RAD-085_TERMS_P1_PROPOSAL.md)، واعتماد ملف تهيئة المشاركة أدناه باستثناء مستقل اسمه **RAD085-SQL-SHARING-POLICY-LIVE-P1-20261027**. الاستثناء المحلي القديم لا يمتد للحي. لا تضف ملف SQL الحي قبل هذا الاعتماد.
- [ ] دمج إصلاح D3 ومراجعته؛ تحقق أن نقل الإدارة والمحو يقعان ضمن30يومًا، مع حماية النفس/آخر مالك. حتى ذلك الوقت تبقى الواجهات محجوبة ولا حساب مشرف حقيقي. أي SQL جديد لإصلاح D3 يحتاج حزمة وفروقًا واستثناءه الخاص، ولا يضاف خفية إلى هذه الثلاثة.
- [ ] طابق محدد مشروع SQL Editor مع المشروع المقصود في إعداد NEXT_PUBLIC_SUPABASE_URL؛ metadata SQL لا تثبت أصل الموقع. سمِّ المشغّل ونافذة التغيير، وأوقف تغييرات الحسابات/المجموعات والنقل أثناءها. launch_gate=false ليست حجرًا لكل القراءات. لا عامل/جدولة/هوية جسر LOGIN.
- [ ] **نسخة Docker يدوية محلية حديثة قبل SQL إلزامية** على لابتوب المالك: dump مشفر + globals دون كلمات مرور، تحقق سلامة الأرشيف وتجربة استعادة معزولة، وسجل الوقت/المصدر/المسؤول ونطاق ما لا يشمله dump (Auth/Storage/إعدادات المزود والأسرار). لا ترفع النسخة أو الأسرار للمحادثة/PR. لا تستبدلها بنسخة سابقة أو وعد RAD-082؛ النسخ اليومية الآلية تبقى شرطًا قبل أول امتحان حقيقي.
- [ ] شغّل [جرد ما قبل التغيير](../scripts/assess/rad085-application-inventory.sql) كاملًا في استعلام جديد، واحفظ نتائجه محليًا مشفرة. قارنه بكتالوج متوقع مراجع مستقل للمزوّد، بما فيه المالك/ACL وعضويات الأدوار العابرة وCREATE/TEMP. sentinel/timeout/نقص صلاحية/نسخة PG غير مدعومة/كائن جزئي = STOP.
- [ ] اقرأ version فقط من سجل migrations بعد التأكد من بنيته كما في الحزمة الأصلية. لا تُعد migrations التاريخية. يلزم غياب كائنات RAD-085 الثلاثة قبل أول تثبيت؛ وجود بعضها أو فقد ACK يحتاج مصالحة مستقلة لا إعادة عمياء.
- [ ] قبل التثبيت فقط: فحوص C1/C2 وassess-staging-ready على المخطط الحالي، وباقي فحوص العقد القائمة، وفق نتائجها المتوقعة؛ runtime_or_launch_verified=false مقصودة. افحص closed gate ولا تفتحه. افحص hashes الملفات الثلاثة بالجدول التالي؛ لا تحرير أو normalization داخل المحرر.

## 2. الترحيلات الثلاثة — كل ملف في استعلام مستقل وبالترتيب

| الترتيب | مصدر SQL كامل | SHA-256 |
|---|---|---|
| 1 | [20261026000100_assess_supervisor_scope.sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) | c7b5966ce327e1e2e1f05b93ea20a0f7152cb1728884ded8e93fcc4b0d4e1a9b |
| 2 | [20261026000200_assess_authoring_drafts.sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) | eb9d81e7f3f3953b0355318c9d43624bfdb6f10ae9b3b136ce2d97fc86bcc719 |
| 3 | [20261026000300_assess_assignment_review.sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) | 3c1defa58e03443e6d61bb1610ad2a14d53e851338992e2ef30cc61c87602ce3 |

- [ ] نفّذ1 كاملًا BEGIN…COMMIT، ثم تحقق من COMMIT والجرد الخاص به؛ لا backfill للفترات أو إيصالات Practice أو الموافقات. السياسة تبدأ null/null. لا تنتقل إلى2 عند أي شك.
- [ ] نفّذ2 كاملًا ثم تحقق من COMMIT والجرد. لا تملأ مراجع أو مسودات تشغيلية.
- [ ] نفّذ3 كاملًا ثم تحقق من COMMIT والجرد والدور assess_authoring_bridge وعضوياته ومنحه. الثالث يعيد تعريف content_submit_v1؛ ليس تغييرًا إضافيًا محضًا. لا تمنح دور الجسر لأي API/worker ولا تفعّل نقلًا أو نشرًا. وجود بنية P2 لا يجيز واجهات P2.

الثلاثة معاملات مستقلة. فشل2 يبقي1؛ فشل3 يبقي1+2. لا outer transaction ولا replay للتاريخ، ولا تطبيق الملحق المحلي للمحو كملف رابع تلقائيًا.

## 3. تهيئة سياسة المشاركة الحية — بوابة مستقلة

[فرق المقترح](RAD-085_SHARING_LIVE_P1_PROPOSAL.patch) يجهز ملفًا **غير موجود الآن**: supabase/manual/rad085-sharing-policy-live-p1.sql. لا تضفه أو تنفذه قبل موافقة المالك الصريحة على **RAD085-SQL-SHARING-POLICY-LIVE-P1-20261027** وعلى البايتات المعروضة. النص v2 معتمد أصلًا وفق تعليمات هذه المرحلة؛ المطلوب هنا إذن SQL حي مستقل، لا تعديل النص.

- [ ] بعد الإذن وحده، أضف الملف من patch المطابق، راجع الفرق واحسب SHA-256 للملف المستخرج وسجله في سجل DB day، ثم نفذه كاملًا بعد الثلاثة وبمعاملة مستقلة.
- [ ] الملف يقفل scope_lock وصف السياسة؛ يقبل null/null أو نفس الزوج فقط، ويرفض drift أو singleton مفقودة/زائدة. لا يقبل مشاركة لأي مستخدم، ولا يغير Terms أو CONSENT_VERSION أو grants.

الزوج المتوقع: supervisor-sharing-2026-10-27-v2 / cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb. احتفظ ببصمة النص المحسوبة من UTF-8 JSON.stringify({version,ar,en}) بترتيب المفاتيح ودون newline؛ لا تنسخ نصًا «مكافئًا» إلى التهيئة.

## 4. Readiness — قراءة فقط ونتائج true

بعد الثلاثة والتهيئة، أعد جرد metadata كاملًا وقارنه بالكتالوج المتوقع لكل مرحلة. يجب مراجعة جميع الجداول/الدوال/المشغلات والفهارس والقيود وACL وRLS، لا الاكتفاء بوجود أسماء. الحارس التاريخي assess-staging-ready يرفض كتالوج RAD-085 عمدًا؛ لا تعدله أو تتجاهل false وتدّعي نجاحه. الفحص الجديد [rad085-p1-ready.sql](../supabase/checks/rad085-p1-ready.sql) مجهز للقراءة فقط من PostgreSQL16 الصناعي؛ شغّله كاملًا بعد مراجعة الجرد المستقل. المتوقع ready=true لكل صف (columns/constraints/functions/indexes/relations/schema/triggers). يرصد أيضًا فئة غير متوقعة بصف false؛ لا تعتبر القائمة المختصرة وحدها نجاحًا. بصماته تشمل الملكية والمنح وRLS والأجسام والتعريفات، وأي اختلاف مزوّد أو CRLF يتوقف للمراجعة، ولا تُعدّل القيم كي تمر. ليس توقيعًا مستقلًا أو شهادة مزود.

المقطع التالي probe تكميلي للمالك، لا شهادة كتالوج أو مزود. يُشغّل في SQL Editor بعد نجاح مراجعة الجرد؛ **كل أعمدته يجب أن تكون true**:

```sql
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with tables(name) as (values
 ('scope_lock'),('supervisor_appointments'),('membership_periods'),
 ('group_join_codes'),('group_join_requests'),('join_request_throttles'),
 ('sharing_policy'),('sharing_consents'),('practice_recordings'),
 ('authoring_references'),('authoring_drafts'),('authoring_revisions'),
 ('authoring_publication_links'),('assignment_reviews'),('assignment_review_targets'),
 ('assignment_scopes'),('authoring_reviewed_packages')),
funcs(signature) as (values
 ('assess.appointment_v1(uuid,boolean)'),
 ('assess.sharing_consent_v1(text,text,boolean)'),
 ('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'),
 ('assess.join_request_v1(text)'),('assess.join_decide_v1(uuid,integer,text)'),
 ('assess.group_leave_v1(uuid)'),('assess.scope_page_v1(text,uuid,uuid,integer)'))
select
 (select count(*)=17 and bool_and(c.oid is not null and c.relrowsecurity)
  from tables t left join pg_namespace n on n.nspname='assess'
  left join pg_class c on c.relnamespace=n.oid and c.relname=t.name) tables_and_rls,
 (select count(*)=7 and bool_and(p.oid is not null and p.prosecdef
   and p.proconfig @> array['search_path=""']
   and has_function_privilege('authenticated',p.oid,'execute')
   and not has_function_privilege('anon',p.oid,'execute')
   and not has_function_privilege('assess_worker',p.oid,'execute'))
  from funcs f left join pg_proc p on p.oid=to_regprocedure(f.signature)) p1_rpc_acl,
 not exists(select 1 from tables t cross join (values('anon'),('authenticated'),('assess_worker')) r(role)
  where has_table_privilege(r.role,'assess.'||t.name,'select,insert,update,delete,truncate,references,trigger')) no_direct_tables,
 (select count(*)=1 from assess.scope_lock where singleton) scope_singleton,
 (select count(*)=1 from assess.sharing_policy where singleton
  and required_version='supervisor-sharing-2026-10-27-v2'
  and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb') sharing_policy_ready,
 (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_still_closed,
 exists(select 1 from pg_roles where rolname='assess_authoring_bridge'
  and not rolcanlogin and not rolinherit and not rolsuper and not rolbypassrls
  and not rolcreaterole and not rolcreatedb) bridge_still_private;
rollback;
```

- [ ] على staging معزول مطابق فقط: زوج مشرفين وطالب مشترك وowner وanon؛ اختبر §4 قواعد1–9 مباشرة عبر RPCs، ورفض الحساب غير المعتمد/الموقوف وowner APIs للمشرف وقراءة الجداول. لا تنشئ موافقة أو attempt أو عضوية في حساب حقيقي لاستخراج شاهد.
- [ ] اختبر فقد ACK دون retry، وسياسة مجهولة/قديمة، رفض الرمز السابق بعد تدويره، pending بلا عضوية، مغادرة/سحب/انتهاء/سحب تعيين، إعادة انضمام بنافذة جديدة، recorded_at الخادمي، عد/صفحات بعد النطاق، ثبات targets. رفض أي مسار يجب أن يكون رفضًا حقيقيًا؛ UI وحدها لا تثبته.
- [ ] ثبّت exposed schema assess وgrants/definer/search_path لدى المزود دون توسيع صلاحيات؛ أثبت Auth/TLS والجلسات الفعلية وفحص الخدمة المحدود قبل attestation. لا worker أو نشر امتحان أو launch_gate من هذه الخطوات.

## 5. manifest وTerms والعلامة — بعد اجتياز كل البوابات فقط

مقترح تغيير مستقبلي، **لا تغيير مطبق الآن**:

1. انقل الأسماء الثلاثة أعلاه من deferredMigrations إلى نهاية requiredMigrations بالترتيب، واحذف إدخالاتها المؤجلة فقط. guardedFeatures.supervisorP1 هو نفس الحارس؛ يصبح P1_AVAILABLE=true دون flag ثانٍ. تبقى serverModules الخاصة بمنع تسريب backend قائمة.
2. بعد مراجعة البايتات والمزوّد، استبدل supabase/checks/assess-staging-ready.sql في checks بـsupabase/checks/rad085-p1-ready.sql؛ أبقِ فحوص الحسابات وC1/C2 والاحتفاظ وبقية القائمة. هذا يحتاج فرقًا/استثناءً جديدًا للـpins والتوقعات التاريخية قبل التحرير؛ لا تخفِ اختلافًا أو تغيّر اختبارات قديمة كي تمر. لا تغيّر بصمات boundaries الحالية أو ملفات migrations.
3. بعد اعتماد المالك للنصين، انشر تحديث Terms في messages EN/AR وارفع CONSENT_VERSION يوم DB day فقط؛ قبول ذاتي متجدد، لا كتابة consent نيابة عن الطالب. لا تجعل مجرد اعتماد المستند قبول مستخدم.
4. احسب القيمة الجديدة بالأداة القائمة، محليًا ودون اتصال: `NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker`. لا تلصق placeholder كقيمة فعلية. الخوارزمية SHA-256: أصل المشروع ثم LF، ثم لكل required migration مرتبة اسميًا اسم الملف وNUL وبايتاته وNUL، ثم بايتات checks بترتيب manifest؛ الناتج pilot-v1:hex. الـpins لا تثبت تطبيقًا حيًا.
5. تحقق أن القيمة القديمة تُرفض للمتطلبات الجديدة، وأن الجديدة تقبل بعد مراجعة دليل SQL/الخدمة. يطابق المالك URL العام ثم يضبط Repository variable **PILOT_SCHEMA_VERIFIED** إلى القيمة المحسوبة بعد اعتماد هذه الأدلة؛ لا قيمة جديدة أو إعداد GitHub يُطبق الآن. القيمة الحالية للنسخة المؤجلة تبقى pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10.
6. راجع Draft PR ودليل CI والهاتف EN/AR390/1440 والثيمتين. هذه الحزمة لا تمنح إذن ready أو merge أو auto-merge؛ أي نشر/دمج لاحق يحتاج أمر المالك المنفصل. لا افتتاح امتحان: RAD-059 وRAD-082 وRAD-063 وباقي شروط التشغيل باقية.

## 6. Stop / rollback

أي false/خطأ/timeout/drift/نقص backup أو D3/ACK مجهول = توقف عند المرحلة، احفظ رقمها ونتيجة منقحة محليًا، ولا تغير marker/manifest/Terms أو تفتح المجموعة. لا retry أعمى ولا تحديث hash لتجاوز الفشل. كل ملف يرجع معاملته عند خطأ قبل COMMIT فقط؛ بعد COMMIT لا تعد ذلك rollback لبقية الملفات.

بعد نتيجة مجهولة افحص من جلسة SQL Editor جديدة بالجرد للقراءة فقط. لا DROP CASCADE أو down migration على بيانات حقيقية. يختار المالك إصلاحًا أماميًا مراجعًا أو استعادة النسخة إلى وجهة معزولة ثم تحقق ومصالحة وتبديل مخطط؛ لا overwrite تلقائيًا. بعد restore يبقى الوصول محجورًا حتى إعادة تطبيق الحذف والسحب/الإغلاق والقرارات الأحدث وإبطال الجلسات/القدرات. سجل المصالحة مشفر محليًا بجوار نسخ Docker، ولا سحابة. إذا ظهرت كتابات بعد النسخة فتُحل مصالحتها قبل أي تحويل؛ لا فقد بيانات مفترض ولا RPO/RTO مخترع.
