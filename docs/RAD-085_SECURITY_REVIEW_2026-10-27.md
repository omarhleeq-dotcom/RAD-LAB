# RAD-085 — مراجعة أمنية مستقلة · 2026-10-27

**الحكم: يجب تأجيل DB day.** توجد نتيجة **high** في التفويض بعد نهاية المجموعة؛ إثباتها التنفيذي **unproven** بسبب فشل بيئة التنفيذ. هذه مراجعة مصدر مستقلة، وليست شهادة اجتياز أمني أو تحققًا من قاعدة حية. نجاح اختبارات الكاتب أو CI الخاص به لم يُستخدم لإثبات السلامة.

## 1. الانحرافات والميزانية

الهدف الوحيد: مراجعة الملفات الثمانية المطلوبة وكتابة هذه الوثيقة. الميزانية والتغيير: **ملف واحد**، `docs/RAD-085_SECURITY_REVIEW_2026-10-27.md`؛ **صفر** تغييرات في الكود أو SQL أو الاختبارات أو الحالة أو HANDOFF، وصفر وحدات مشتركة. طلب المستخدم بعدم تغيير الحالة وHANDOFF يتقدم على تعليمات تحديثهما العامة في [AGENTS](../AGENTS.md). لا worktree أو وكلاء فرعيون أو SQL/Supabase حي أو أسرار أو معاينات أو subscribe/poll.

فشلت البيئة قبل الوصول إلى مساحة العمل: `snapshot_materialization_failed / gateway_unavailable`، مع رسالة `failed to query executor configuration capabilities`. استُخدم موصل GitHub المعتمد لقراءة المصدر وإنشاء Draft PR فقط. أوامر البداية وQA رُفضت قبل تشغيل shell؛ لا ادعاء بنجاحها أو بمعرفة حالة checkout المحلي. لم تُنشأ أو تُشغّل اختبارات PostgreSQL، ولم يُلتزم أي اختبار مؤقت.

تحقق GitHub المباشر من [PR #140](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/140): `merged=true`، الهدف `main`، وقت الدمج **2026-10-27 17:40:20 UTC**. قراءة مرجع `main` المستقلة طابقت التزام الدمج **42ee07d3615d41fed34056c49bbf49ce2b3d8d5c**؛ هذا هو أساس المراجعة، لا رأس PR سابق. الدمج لا يثبت تطبيق SQL أو نشره.

قُرئت [HANDOFF](HANDOFF.md)، و[الخطة §4، القواعد 1–11](RAD-085_PLAN_2026-10-25.md)، و[عقود SQL](RAD-085_SQL_CONTRACTS_2026-10-26.md)، و[مصفوفة المحو](RAD-085_ERASURE_MATRIX_2026-10-26.md)، و[تقرير D3](RAD-085_D3_REPORT_2026-10-27.md)، و[حزمة DB day](RAD-085_DB_DAY_P1.md)، و[O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27). التقارير سياق لتحديد العقد فقط؛ النتائج أدناه مستمدة من قراءة التنفيذ.

## 2. المنجز والمستبعد

قُرئت الملفات المطلوبة كاملة:

| الرمز | المصدر |
|---|---|
| M1 | [20261026000100_assess_supervisor_scope.sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) |
| M2 | [20261026000200_assess_authoring_drafts.sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) |
| M3 | [20261026000300_assess_assignment_review.sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) |
| M4 | [20261027000100_assess_management_erasure.sql](../supabase/migrations/20261027000100_assess_management_erasure.sql) |
| I | [rad085-sharing-policy-live-p1.sql](../supabase/manual/rad085-sharing-policy-live-p1.sql) |
| R | [rad085-d3-ready.sql](../supabase/checks/rad085-d3-ready.sql) |
| L | [p1-live.ts](../src/features/supervisor/p1-live.ts) |
| G | [pilot-schema-gate.mjs](../scripts/pages/pilot-schema-gate.mjs) |

قُرئت أيضًا تعريفات الهوية والموافقة وB/C/D/E والاحتفاظ وC2 التاريخية ذات الصلة، وmanifest وحارس P1 ومستهلكه وجرد التطبيق. المقارنة مع «C2 المطبق» هي مع مصدر C2 التاريخي في `main`؛ مطابقة جسم الدالة الفعلي لدى المزوّد **غير متحققة** لالتزام منع الاتصال الحي.

لم يُنفذ إصلاح أو تعديل صلاحية أو قبول مشاركة/Terms. لم يُستدل من أي اختبار سابق على نجاح التزامن أو rollback أو الاستعادة أو الحقوق.

## 3. حسب المهمة: النتائج والتحقق من العقد

### SEC-01 — high — سلطة المشرف تبقى بعد انتهاء المجموعة

**الموضع:** `supabase/migrations/20261027000100_assess_management_erasure.sql:667`، خصوصًا 672–681؛ الأصل نفسه في `supabase/migrations/20261026000300_assess_assignment_review.sql:168`. مسار إيصال إضافي: الملف الثالث، السطور 133–139.

**مسار الهجوم:** مشرف معيّن يملك إسنادًا مفتوحًا ويحفظ معرفه وrevision. ينهي مجموعته عبر `supervisor_group_v1('end', ...)`، أو ينتظر `ends_at`. القراءة المعتادة تُرفض عبر `supervised_group_v1`، لكن استدعاء `assignment_close_v2(assignmentId, savedRevision)` يفحص ملكية الإسناد والتعيين وارتباط المجموعة فقط؛ لا يفحص `ended_at` أو `ends_at`. إنهاء المجموعة لا يسحب التعيين ولا يمحو `supervisor_id`، فيمر الشرط ويكتب `closed_at`. الإغلاق نهائي ويمنع بدء محاولات جديدة للطلاب رغم انتهاء نطاق الإشراف. كذلك يعيد replay لتأكيد إسناد مؤكد معرف الإسناد بعد نهاية المجموعة، لأنه يعود قبل تفويض المجموعة.

**الإثبات: unproven.** لم يُنفذ PostgreSQL. القراءة المباشرة تُظهر غياب فحص الوقت/النهاية في 677–681؛ وجوده في M1:85–92 لا يحمي دالة لا تستدعيه. شاهد مستقل مطلوب على SQL الأصلي: بعد `end` يجب أن ترفض قراءة المجموعة والإغلاق وreplay المفوض وفق العقد، وأن يبقى `closed_at` بلا تغيير عند رفض الإغلاق. لا يُعد نجاح اختبارات الكاتب إثباتًا لهذا المسار.

**الإصلاح المقترح:** إعادة تفويض مجموعة المشرف وتوقيتها بعد الأقفال وقبل أي تغيير أو إيصال؛ الحفاظ على مسار المالك/مدير D3 المصرح له منفصلًا. تحديد سياسة replay بعد النهاية صراحةً بدل تجاوز حارس المجموعة. فحص فرع `closed_at is not null` أيضًا قبل إرجاع نجاح لمشرف فقد نطاقه. لا تنفيذ للإصلاح في هذا PR.

### SEC-02 — medium — طلب الانضمام يكشف علاقة الطالب بعد المغادرة أو سحب المشاركة

**الموضع:** `supabase/migrations/20261027000100_assess_management_erasure.sql:648`، خصوصًا 650–651؛ التعريف السابق `supabase/migrations/20261026000100_assess_supervisor_scope.sql:299`.

**مسار الهجوم:** طالب يقبل المشاركة ويُقبل في المجموعة، ثم ينفذ `group_leave_v1` أو `sharing_consent_v1(..., false)`. يختفي من `visible_members_v1`، لكن المشرف يطلب `scope_page_v1('requests', groupId)` فيحصل على `user_id/state/revision` للطلب المقبول القديم. الاستعلام يقيد المجموعة فقط؛ لا يقيد المشاركة الحالية أو المغادرة أو النافذة. بعد المغادرة يبقى سجل الطلب `approved`. النتيجة كشف استمرار ربط هوية الطالب بالمجموعة بعد توقف النطاق، خلاف قاعدة §4/6. لا أدعي تسرب العلامات أو الأجوبة من هذا الفرع.

**الإثبات: unproven.** لا اختبار DB منفذ. المسار المطلوب إثباته: طلب مقبول، ثم مغادرة وسحب على حدة؛ `members.total=0` مع بقاء الطالب في `requests.rows`. يجب اختبار إعادة الانضمام وإعادة التعيين أيضًا لتمييز الطلب القديم عن طلب جديد مفوض.

**الإصلاح المقترح:** وضع عقد خاص لرؤية طلبات الانضمام: طلب pending يحتاج مشاركة حالية وحسابًا متاحًا، والطلبات التاريخية لا تكشف هوية طالب خرج من النطاق. تطبيق المرشح داخل SQL قبل paging؛ لا ضم pending إلى العضويات، ولا الاكتفاء بإخفائه في الواجهة. فصل بيانات التدقيق الخاصة بالمالك عن DTO المشرف.

### SEC-03 — medium — إعادة تعريف C2 تربط إدارة حذف الحساب بتعطيل Assess

**الموضع:** `supabase/migrations/20261027000100_assess_management_erasure.sql:562` مع `supabase/migrations/20261026000100_assess_supervisor_scope.sql:78`. للمقارنة: `supabase/migrations/20261024000200_owner_deletion_surveys.sql:69`.

**مسار الفشل:** مالك approved يعطل Assess لنفسه بالمسار القائم `assess.disable_account_v1(ownerId)`؛ ذلك المسار لا يعلق حساب المنصة. C2 التاريخي ما زال يسمح له بإدارة deactivation/restore/finalise لأنه يفحص `is_owner()`. بعد M4 تصبح هذه العمليات الثلاث مستدعية لـ`scope_enter_v1` الذي يرفض أي صف `account_stops` للمستدعي. تتعطل بذلك استعادة طالب داخل مهلة30 يومًا أو معالجة المحو اليومي لدى مالك صالح للمنصة؛ `list` قد يبقى ناجحًا. هذا تغير سلوكي إضافي إلى استبدال primitive المحو، وله أثر على مهلة O5 إن كان هو المشغل المتاح.

**الإثبات: unproven.** لا تشغيل مقارن على PostgreSQL. شاهد مطلوب على قاعدتين صناعيتين قبل/بعد: المالك نفسه approved وموقوف في Assess، وطلب حذف لطالب؛ مقارنة `restore` و`deactivate` ودفعة `finalise`، مع ثبات حظر النفس/آخر مالك.

**الإصلاح المقترح:** فصل قفل التسلسل عن شرط أهلية استخدام Assess في إدارة حذف حساب المنصة، مع استمرار فحص مالك approved حديث وحماية النفس/آخر مالك. إن كان سحب صلاحية الحذف عند تعطيل Assess قرارًا مقصودًا فيلزم عقد صريح وتغطية تشغيلية؛ لا يصح وصفه بثبات C2 تلقائيًا.

### SEC-04 — medium — حارس deferred يعتمد على ثبات كائن JSON وقت التشغيل دون إثباته

**الموضع:** `scripts/pages/pilot-schema-gate.mjs:90` و97–112 و198–201؛ الاعتماد التنفيذي `src/features/supervisor/p1-availability.ts:1` و11–14، والاستدعاء `src/features/supervisor/p1-live.ts:20`.

**مسار الهجوم المرشح:** وحدة عميل جديدة غير مثبتة في manifest تستورد كائن `frontend-schema.json` نفسه وتغير مصفوفتَي required/deferred في الذاكرة **قبل تقييم وحدة الحارس**؛ يمكن وضع استيرادها قبل استيراد P1 في وحدة عميل غير مثبتة. بايتات الحارس والمستهلك والناقل تبقى كما هي. عندئذ قد يحسب `P1_AVAILABLE=true`، بينما قارئ البوابة المنفصل يرى ملف JSON الأصلي ويستبعد الاستيراد المحروس باعتباره dormant. الوحدة التي تعدل JSON لا تحتاج استدعاء شبكة أو RPC كي تُصنف boundary. هذا مسار لتفعيل الناقل قبل ترقية manifest/attestation المراجعة؛ لا يثبت وحده تجاوز ACL قاعدة البيانات.

**الإثبات: unproven للمسار الكامل.** تجربة JavaScript في scratchpad، باستخدام أسماء الترحيلات الأربعة من المصدر وقاعدة `p1Available`، أعطت:

```text
migrationCount=4
before=false
afterSharedManifestMutation=true
```

هذه تثبت قابلية تغيير مدخل الحساب في JavaScript فقط؛ **ليست** تشغيلًا للبوابة أو bundler أو المتصفح. لم يُثبت ترتيب تقييم Next/webpack أو قبول `frontendRequirements` للنسخة الهجومية. لا تُعامل النتيجة كثغرة مستغلة مؤكدة، ولا يُعامل pin بايتات الحارس وحده إثباتًا لنفيها.

**الإصلاح المقترح:** اختبار خصومي مستقل على نسخة مؤقتة من المصدر يضيف تعديل JSON قبل استيراد P1، ثم يشغل البوابة والبناء ويتحقق من صفر RPCs مؤجلة. اشتقاق availability من قيمة بناء ثابتة ومراجعة لا يستطيع عميل تغيير مدخلها قبل التقييم، وربط استثناء dependency traversal بهذه القيمة. لا تعديل pins أو توقعات لإخفاء فشل. الاستيراد المباشر العادي للناقل يظل مرفوضًا في تحليل المصدر الحالي لأنه يضيف boundaries مؤجلة إلى graph.

### SEC-05 — low — جاهزية الكتالوج لا تغطي الامتيازات الفعلية وحالة التهيئة

**الموضع:** `supabase/checks/rad085-d3-ready.sql:6`–30.

**مسار الفشل:** بعد التطابق البنيوي، تغيير عضوية دور مثل منح `assess_authoring_bridge` إلى دور API لا يغير `proacl/relacl` للكائنات المفحوصة، ولا يقرأ الفحص `pg_auth_members` أو خصائص الأدوار. قد تبقى كل نتائج `ready` صحيحة رغم تغير الصلاحيات الموروثة. كذلك initializer يغير صف سياسة المشاركة فقط؛ الكتالوج لا يميز السياسة null/null عن الزوج المعتمد. هذه فجوة في شهادة هذا الفحص وحده، وليست دليلاً على أن المصدر يمنح تلك العضوية.

**الإثبات: unproven.** لم يُشغّل شاهد `GRANT` على قاعدة مؤقتة أو مقارنة قبل/بعد initializer. الاستعلام لا يتضمن كتالوج عضوية الأدوار ولا صف سياسة المشاركة. [جرد التطبيق](../scripts/assess/rad085-application-inventory.sql) وفحوص التفويض الإضافية في الحزمة يخففان الخطر إذا نُفذا وراجعهما مستقل؛ لا يجوز استبدالهما بنتيجة R.

**الإصلاح المقترح:** جعل readiness يختبر effective EXECUTE/table privileges وعضوية/خصائص الأدوار وsingleton والسياسة المعتمدة، أو تسمية حدوده بوضوح وإلزام شاهد منفصل لا يقبل النجاح عند غيابه. أي تعديل لفحص مثبت يحتاج المراجعة والاستثناء المناسب؛ لا إعادة توليد digest لتمرير drift.

### جرد كل SECURITY DEFINER والـACL

مسح مستقل لنصوص GitHub أعطى **45 تعريفًا، كلها SECURITY DEFINER مع `search_path=''`**: M1=14، M2=3، M3=13، M4=15؛ **41 اسمًا متميزًا** بعد أربع إعادات تعريف داخل المجموعة. هذا عدّ مصدر، لا استعلام كتالوج أو اختبار صلاحيات.

| التعريفات، مع سطر البداية | الهوية وحد EXECUTE في المصدر |
|---|---|
| M1:64 `record_practice_v1`؛ 130 `guard_managed_group_v1` | trigger فقط، NEW/OLD للسجل المستهدف؛ لا API EXECUTE. الحارس يعاد تعريفه في M4:380. |
| M1:73 `scope_enter_v1`؛ 85 `supervised_group_v1`؛ 260 `visible_members_v1` | auth.uid؛ مسارات داخلية بلا API EXECUTE. |
| M1:81 `sharing_allowed_v1` | p_user هدف فحص داخلي، ليس هوية مستدعٍ؛ بلا API EXECUTE. |
| M1:94 `appointment_v1`؛ 114 `sharing_consent_v1`؛ 173 `supervisor_group_v1`؛ 203 `join_request_v1`؛ 228 `join_decide_v1`؛ 252 `group_leave_v1`؛ 270 `scope_page_v1` | auth.uid مباشرة أو عبر scope؛ revoke في 328–332 ثم grant authenticated في 333–335. appointment p_user هدف إداري لا انتحال ذات. |
| M1:146 `membership_period_v1` | trigger؛ auth.uid للمشرف، ومسار CASCADE يميز غياب profile؛ بلا API EXECUTE. |
| M2:30 `validate_draft_v1` | تحقق شكلي داخلي، لا يحتاج هوية مستقلة؛ بلا API EXECUTE. |
| M2:90 `draft_save_v1`؛ 110 `draft_page_v1` | auth.uid الكاتب وscope؛ revoke في 131–132 ثم authenticated في 133. |
| M3:37 `linked_version_v1`؛ 53 `review_current_v1` | الأول helper لنسخة مثبتة، والثاني يثبت auth.uid؛ كلاهما خاص. |
| M3:76 `assignment_prepare_v1`؛ 113 `assignment_targets_v1`؛ 128 `assignment_confirm_v1`؛ 168 `assignment_close_v2`؛ 184 `assignment_page_v2`؛ 197 `supervisor_results_v1` | auth.uid أو helper يثبته؛ revoke في 221–223 وgrant authenticated في 224–226. استثناءات النطاق في SEC-01. |
| M3:240 `authoring_bridge_read_v1`؛ 299 `authoring_bridge_bind_v1`؛ 318 `authoring_bridge_candidate_v1`؛ 329 `authoring_bridge_install_v1` | auth.uid عبر read/candidate؛ revoke في 342–343، ومنح الجسر فقط في 345–347. |
| M3:266 `content_submit_v1` | إعادة تعريف E؛ الفرع العادي owner من auth.uid، وفرع الجسر يفحص الدور والحزمة والكاتب. يحتفظ بـACL التاريخي ويضيف الجسر في 347. |
| M4:56 `d3_fk_inventory_v1`؛ 293 `d3_shared_group_v1`؛ 305 `d3_needs_transfer_v1`؛ 320 `d3_inventory_v1` | helpers خاصة؛ p_user هدف إداري بعد تفويض الغلاف، وليس هوية ذاتية من العميل. |
| M4:375 `d3_erasing_v1` | is_owner/auth.uid مع erasing_xid ومدير مطابق؛ خاص. |
| M4:380 `guard_managed_group_v1`؛ 401 `assignment_terminal_v1` | triggers؛ الاستثناء الضيق يستعمل capability خاصة داخل المعاملة، لا GUC يختاره العميل. ACL السابق الخاص محفوظ. |
| M4:414 `transfer_management_d3_v1`؛ 462 `erase_account_d3_v1` | auth.uid مالك وهدف مختلف، قفل/إعادة فحص؛ الخاصتان بلا API EXECUTE، بما فيهما replay_at. |
| M4:511 `account_management_v1` | auth.uid مالك؛ revoke في 697–700 ثم authenticated فقط في 701. |
| M4:542 `close_assignment_v1`؛ 554 `owner_account_deletion_v1` | إعادة تعريف بوابات owner التاريخية، ACL التاريخي محفوظ؛ توسع الإدارة وتغير C2 موضحان أدناه. |
| M4:619 `scope_page_v1`؛ 667 `assignment_close_v2`؛ 683 `assignment_page_v2` | إعادة تعريف مسارات authenticated السابقة؛ تحفظ auth.uid وACL السابق، مع النتائج أعلاه. |

الأجسام البديلة في M4 لا تعيد كتابة revoke/grant للدوال التاريخية؛ `CREATE OR REPLACE` يحفظ ACL القائم. راجعت revoke/grant الأصلي لـC2 في ترحيل 20261024000200:264–265، ولـclose/terminal في ترحيل الاحتفاظ:188–189، ولـcontent_submit في D:107–109. لا توجد في المصدر المراجع منحة execute إلى anon/PUBLIC لهذه الدوال؛ ACL الفعلي لدى المزوّد يبقى غير مثبت.

الجداول الجديدة **23**: M1=9، M2=3، M3=5، M4=6. كلها تفعّل RLS وتلغي grants المباشرة من PUBLIC/anon/authenticated/assess_worker؛ لا سياسة RLS تسمح بقراءة مباشرة للمالك. M4 وجدول الحزمة يلغيان الجسر صراحةً أيضًا، ولا منحة سابقة له على الجداول الأخرى. مالك كائنات SQL يظل حد الثقة المقصود للدوال، ولا يُسوّى مع مستخدم تطبيق دوره owner. لا إثبات runtime لـdefault ACL أو العضويات الموروثة، انظر SEC-05.

### مراجعة قواعد §4 (1–11)

| القاعدة | نتيجة قراءة التنفيذ وحد الدليل |
|---|---|
| 1 | جرد SD/RLS أعلاه؛ لا actorId كهوية SQL. التحقق الفعلي من الكتالوج/EXECUTE متعذر. |
| 2 | scope_enter يفحص approved/account_stops؛ supervisor يحتاج تعيينًا ومجموعة تخص auth.uid. لا توسيع is_owner أو قراءة surveys في المصادر الجديدة. SEC-01 ثغرة في نهاية سلطة الإسناد. |
| 3 | الرمز عشوائي من UUIDين ويحفظ SHA-256؛ ينشئ طلبًا فقط. قبول الطلب وحده ينشئ العضوية؛ pending لا يمر visible_members. لا p_user في sharing_consent ولا كتابة Terms لطالب من هذه RPCs. |
| 4 | trigger العضوية يكتب الفترة في المعاملة نفسها، والمغادرة تغلقها وتحذف الإسقاط؛ إعادة القبول تولد period جديدة. القيود تمنع فترتين نشطتين. لم أختبر CASCADE/rollback. |
| 5 | visible_from=max(joined_at,starts_at,appointed_at,accepted_at). قراءات الأعضاء/Practice والنتائج تستخدمه؛ مسار requests لا يستخدم مرشح المشاركة/المغادرة، SEC-02. |
| 6 | سحب التعيين/المشاركة أو العضوية يخرج الطالب من relation المرئية؛ النهاية تفحص ساعة الخادم. SEC-01/02 تمنعان اعتماد الحكم على كل الأسطح. لا إثبات مستقل لسباقات الانتظار أو انتهاء المجموعة أثناء الاستعلام. |
| 7 | Practice عبر إيصال recorded_at من trigger خادمي؛ لا backfill، ولا استعمال finished_at حدًا أمنيًا. الاستعلام يعيد DTO محدودًا، لا result/settings الخام. |
| 8 | supervisor_results يربط assignment_scopes بالمجموعة والمشرف وreview target period، وstarted_at داخل النافذة وexpires_at غير منتهٍ. visible materialized قبل count وpaging؛ hidden لا يعيد أرقام الدرجة. لم أنفذ شاهد مجموعتين أو حدود صفحات. |
| 9 | leave/withdraw/end لا تسحب targets المثبتة تلقائيًا. SEC-01 يسمح بإغلاق لاحق خارج النطاق، فيؤثر على بدء الطالب رغم هذا الفصل. |
| 10 | legacy group/members writes تواجه triggers في المجموعة المدارة؛ UPDATE لفترة قائمة مرفوض. لا حذف history لتسهيل end في المسار الجديد. أثر CASCADE والأقفال يحتاج شاهدًا جديدًا. |
| 11 | تغييرات ليست إضافية محضة: أعمدة/FKs/triggers وأجسام دوال بديلة وnullable provenance وإدارة مستقلة. التاريخ لم يتغير في هذه المراجعة؛ ثبات ملف migration قديم لا يعني ثبات السلوك الفعال. |

**تخمين الرمز والحدود:** M1:191–194 يولد64 خانة hex من UUIDين؛ لا تخفيض ظاهر إلى رمز قصير. M1:209–214 يعد المحاولات غير الصحيحة أيضًا، ويعيد unavailable عند10 في ساعة، وقفل UPDATE للنطاق يسلسل العدادات. الردود الخاطئة عامة؛ الصحيح يكشف فقط pending/member لحائز القدرة. الحد لكل حساب، لا IP، ويعتمد على اعتماد الحساب؛ لا إثبات مستقل للإنتروبيا أو التوازي أو محاولات rollback عبر ناقل SQL مختلف. ناقل PostgREST المتوقع يستدعي RPC بمعاملة قصيرة؛ لا دليل هنا أنه يتيح للعميل ROLLBACK بعد قراءة الرد.

**الموافقات:** sharing_consent يكتب auth.uid فقط؛ p_user في appointment/management هدف مفوض لا يسمح بقبول مشاركة. I لا ينشئ صف consent. R وL لا يكتبان Terms. سياسة Terms التاريخية تسمح بتحديث أعمدة موافقة الذات وفق RLS؛ لم تضف هذه المصادر طريق قبول نيابة عن طالب. توافق النسخة المنشورة وCONSENT_VERSION يوم DB day يحتاج تحققًا منفصلًا.

### D3، إعادة التعريف، والأدوار

| الموضوع | المقارنة المستقلة في المصدر |
|---|---|
| C2 eligibility | مهلة30، restore قبلها، finalise للمستحق فقط، حد100، last-owner/self، وحظر Auth وحذف refresh sessions باقية نصيًا. أضيف scope_enter وإعادة فحص المالك بعد انتظار profiles، واستُبدل DELETE Auth باستدعاء erase_account_d3. SEC-03 تغير شرط الأهلية الإداري. |
| rollback والدفعات | لا COMMIT داخل الدوال؛ فشل فرد في batch يعيد الاستدعاء كله. الذرية لا تثبت تقدم المحو قبل37؛ فرد محجوب قد يوقف الدفعة. لم أختبر failure injection أو lost ACK أو rollback. |
| early finalise/replay | API C2 لا يختار target مبكرًا؛ erase/replay خاصتان بلا execute لأدوار API/worker/bridge. primitive الخاص لا يفرض مهلة C2 مستقلة، وtransfer يقبل replay_at؛ سلامتهما تعتمد على عدم كشف grants وعلى المشغل الموثوق ودليل restore الخارجي. ليسا API اختصار للمهلة. |
| بيانات الطلاب الآخرين | د3 يصفّر provenance للكيانات اللازمة بدل DELETE assignment/version المشترك؛ يمحو Auth الهدف وتوابعه، ويفك الخاص غير المسند. لا DELETE مباشر لنتيجة شخص آخر في الجسم. لا إثبات مستقل لصحة كل FK/CASCADE أو الإغلاق المؤكد بعد المحو. |
| نسبة التأليف | manager tables منفصلة؛ nullable owner/writer/supervisor لا تُستبدل بمعرف المالك. digests/publication/closed_at محفوظة في مسار minimisation؛ لا ادعاء أن ذلك يثبت حقوق المحتوى الحر. |
| حقوق النقل | الجرد يوقف FK غير مراجع، ويلزم content_digest وreviewed_by مالكًا آخر عن الهدف عند وجود محتوى. erasure_rights خاص، ولا RPC لملئه. صحة قرار الترخيص وأقل attribution عمل بشري مستقل؛ لا تثبتها JSON أو هاش. |
| الاستعادة خلال30 | C2 restore يعيد ban/status ويمحو الطلب؛ لا يعكس ما فعله transfer مسبقًا من revoke/ended_at/manager rows. هذه نتيجة سلوكية يجب أن تُعرض للمالك في اختبار الإلغاء، ولا يجوز وعد استعادة المجموعة أو التعيين تلقائيًا. ليست نتيجة اختُبرت هنا. |
| guard_managed_group | أضيف استثناء لتصفير owner/supervisor فقط أثناء capability D3، مع تطابق بقية الصف ووجود مدير مطابق؛ بقية منع تغيير provenance القديم باقٍ. |
| scope_page | أضيف appointed من تعيين الذات وحالة participant approved، بما فيه صفر مجموعات؛ لا directory جديد. فرع requests القديم بقي بلا مرشح المغادرة/المشاركة. |
| assignment_close/page | توسعا إلى مالك محدد في assignment_managers، دون إعادة نسبة authorship. قراءة المشرف ما زالت تمر supervised_group؛ الإغلاق لا يمره، SEC-01. |
| close/terminal | close_assignment القديم توسع إلى المدير المحدد ويأخذ scope؛ assignment_terminal يسمح فقط بتصفير owner أثناء capability erasing_xid مع بقاء بقية الصف. ليس تفويضًا عامًا لفتح إسناد مغلق. |
| content_submit | بالمقارنة مع E، بقي الفرع العادي owner-only وأضيف فرع role=assess_authoring_bridge يطابق الحزمة والكاتب وrevision ويعيد فحص expiry بعد advisory lock. لا يكفي مجرد السماح له بـEXECUTE لانتحال owner. |
| worker/bridge | إنشاء الجسر NOLOGIN/NOINHERIT بلا عضوية، وخمس منح محددة؛ لا direct tables أو private erasure أو installers العامة. assess_worker لا تُضاف له منح في هذه الدفعات؛ قدراته التاريخية الموثوقة على النشر/التصحيح لم تُختزل بواسطة إنشاء الجسر. |
| مخرجات التثبيت | wrapper الجسر يقيد المرشح والحزمة، لكنه يستقبل p_specs/p_views من المضيف الموثوق؛ ربط هذه المشتقات بالمراجعة يعتمد على validators الخادمية. لا أدعي أن SQL يثبت وحده حياد render geometry أو سلامة مفاتيح التصحيح. |
| التزامن | ترتيب scope→profiles→versions/assignments ظاهر، وREAD COMMITTED مطلوب؛ shared readers/exclusive writers يحمي المسارات التي تلتزم القفل. توجد إعادة فحص بعد انتظار في transfer/erase وبعض bridge paths. هذا لا يثبت كل سباقات legacy/status/maintenance أو snapshot/lock ordering على PostgreSQL فعلي. |

لم يظهر في قراءة المصدر طريق من authenticated عادي أو assess_worker إلى primitive المحو أو قبول موافقة لغير الذات أو تغيير manager tables. هذا **عدم العثور في المصدر**، لا شهادة عدم وجود تصعيد عملي. يلزم جرد grants والعضوية المتعدية وCREATE/TEMP وهوية LOGIN لدى المزوّد محليًا على النسخة المستعادة، ثم في نافذة التحقق المأذونة.

## 4. التغييرات المشتركة وScale

لا تغيير مشترك في هذا PR. سقوف المصدر: paging افتراضي20/أقصى100، C2 دفعات100، group targets≤1000، وD3 inventory/documents≤1000 مع STOP، وقفل scope عالمي يسلسل الكتابة عبر المجموعات. حدود drafts/revisions والمحتوى ليست دليل سعة أو مقاومة DoS. عدّ Practice/النتائج قد يقرأ تاريخًا أكبر من صفحة العرض؛ الأداء تحت حمل3 شعب/120طالبًا وانتظار الأقفال غير مقاسين هنا. رفع السقوف أو فصل الأقفال يحتاج نطاقًا واختبارات مستقلة.

I يأخذ scope lock وقفل السياسة ويرفض drift أو singleton ناقص/زائد؛ لا يغير منحًا أو قبولًا. تعليقه التاريخي يقول ثلاثة ترحيلات، بينما الحزمة الحاكمة تشترط الأربعة؛ لا يُقرأ التعليق إذنًا بتشغيله بعد ثلاثة. R بصمة كتالوج مصدر، لا فحص هوية المزوّد أو اكتمال النشر.

## 5. الطب والدرجات

لا تعديل طبي أو scoring أو مشاهد أو بيانات امتحانات. قراءة المصدر لا تثبت مراجعة طبية أو ترخيصًا أو دقة المحاكي. لم أُنشئ درجات أو هويات قبول أو محتوى حقيقيًا؛ نتائج JS المحدودة في SEC-04 تخص guard فقط.

## 6. QA وحدود الإثبات

| الفحص | النتيجة في هذه الجلسة |
|---|---|
| docs:context | محاولة تشغيل رُفضت قبل shell: No usable execution environment is available. حالة checkout غير معروفة. |
| status:summary -- --id RAD-085 | الرفض نفسه؛ قُرئ JSON المصدر مباشرةً: RAD-085=review. وصف Draft #140 فيه تاريخي؛ تحقق الدمج المباشر أعلاه مستقل عنه. |
| docs:check -- --base origin/main | **غير منفذ**؛ رفضت خدمة التنفيذ الأمر قبل بدء الفاحص. لا نتيجة نجاح أو تحذيرات يمكن الإبلاغ عنها. |
| git diff --check | **غير منفذ** للسبب نفسه؛ المقارنة الشبكية وحصر الملف لا يحلان محله. |
| status:check | غير منفذ؛ الحالة لم تتغير امتثالًا لطلب المستخدم. |
| جرد SD/RLS من المصدر | عدّ مستقل في scratchpad: 14/14، 3/3، 13/13، 15/15 تعريفًا definer/empty search_path؛23 جدولًا جديدًا. ليس اختبار grants/RLS حيًا. |
| تجربة JSON في SEC-04 | JS فقط: false ثم true بعد mutation؛ المسار الكامل unproven. |
| PostgreSQL attacks/concurrency/rollback/restore | **لم تُشغّل**؛ البيئة فشلت. لا استخدام لاختبارات الكاتب كبديل. |
| build/browser/live/provider/phone | لم تُشغّل؛ لا معاينة أو اتصال حي. مراجعة مستند فقط لا تحتاج app build لقبول بنيتها، لكن SEC-04 يحتاج شاهدًا مستقلًا لاحقًا. |

كل نتيجة أمنية أعلاه موسومة **unproven** حيث يغيب الإثبات التنفيذي؛ لا يعني ذلك أن المسار آمن. فحص الوثائق، حتى بعد نجاحه، لن يحسم التفويض أو الحقوق.

## 7. المفتوح

**DB day ينتظر SEC-01 واكتمال التحقق المستقل.** لا اعتماد لترقية requiredMigrations أو تغيير marker/Terms/CONSENT_VERSION أو تعيين مشرف حقيقي من هذه الوثيقة.

المتبقي: إثبات/إصلاح SEC-01 وSEC-02، حسم شرط C2 في SEC-03، اختبار gate في SEC-04، وقراءة effective privileges/تهيئة السياسة في SEC-05. يلزم اختبار مستقل للحدود الزمنية والمجموعتين وpending والـcount/paging، last-owner/self، محو الطالب دون زملائه، shared/closed content، rollback، تسلسل الأقفال، والإلغاء/restore بإيصال خارجي صحيح. نسخة المالك المستعادة والحقوق والمزوّد والهاتف وRAD-059/RAD-082 باقية خارج الإثبات.

## 8. قائمة المالك وبرومبت الاستئناف

- إبقاء Draft فقط وعدم تشغيل DB day؛ لا ready/merge/auto-merge من هذه المراجعة.
- توفير بيئة تنفيذ قابلة للاستخدام، ثم تشغيل docs:context وstatus:summary وdocs:check وgit diff --check فعليًا على رأس وثيقة المراجعة.
- في scratchpad محلي معزول فقط، إعادة بناء المصدر المراجع واختبار كل مسار أعلاه دون الاعتماد على assertions الكاتب. حفظ النص الأصلي والمخرجات والـSQLSTATE، وعدم التزام الاختبارات دون طلب.
- بعد اعتماد نطاق إصلاح منفصل، إعادة مراجعة التغييرات واختبار حالات النجاح والرفض وrollback؛ أي hashes تاريخية تحتاج الاستثناء المسمى. لا تعديل pins لمجرد إنجاح الفحص.
- قبل نافذة حية مستقلة، استكمال حزمة DB day وحقوق المحتوى والجرد الفعلي والاستعادة اليومية وتغطية O5؛ المستخدم يقبل لنفسه فقط.

برومبت الاستئناف: «اقرأ AGENTS وهذه المراجعة وO1–O5؛ تحقق من رأس main ودمج #140 وحالة Draft PR المراجعة. شغّل أوامر السياق والحالة وQA المتعذرة. اختبر SEC-01 إلى SEC-05 مستقلًا في scratchpad PostgreSQL/نسخة source مؤقتة، بلا live SQL أو أسرار أو worktree أو subagents أو تعديل code/SQL/tests/status/HANDOFF قبل نطاق إصلاح صريح. DB day متوقف لحين حسم النتيجة high».

**سؤالا AGENTS:** هل تغيّر الحكم؟ **لا**؛ لم يُعدل قرار أو عقد أو مهلة. هذه مراجعة تكشف مواضع لا يثبت فيها التنفيذ الالتزام بالعقد، وتوصي بالتوقف دون منح إذن تشغيل. هل بقي رابط الدليل الأصلي؟ **نعم**؛ [الخطة](RAD-085_PLAN_2026-10-25.md)، [O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27)، [عقود SQL](RAD-085_SQL_CONTRACTS_2026-10-26.md)، [المصفوفة](RAD-085_ERASURE_MATRIX_2026-10-26.md)، [تقرير D3](RAD-085_D3_REPORT_2026-10-27.md)، [حزمة DB day](RAD-085_DB_DAY_P1.md) و[PR #140](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/140) محفوظة بلا إعادة كتابة.
