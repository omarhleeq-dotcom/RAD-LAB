# RAD-085 — فجوة SQL في D3 · PROPOSAL ONLY

[D3](DECISIONS.md#rad085-owner-tidy-2026-10-27) قرار نافذ: نقل **مسؤولية الإدارة** للمالك ومحو الهوية ضمن نافذة Terms ذات30يومًا. [المصفوفة](RAD-085_ERASURE_MATRIX_2026-10-26.md) تصف الحجب الحالي. **لا يجوز تعيين أي مشرف حقيقي حيًا قبل دمج إصلاح D3** ومراجعته واختبار نافذة الحذف. لا SQL تنفيذي جديد أو استثناء مسمى ممنوح في هذه الدفعة.

## SQL الناقص تحديدًا

| المطلوب في migration جديدة ومراجعة مستقلة | سبب الحاجة والكائنات الفعلية |
|---|---|
| فصل manager عن منشئ المحتوى، مع FK إلى مالك approved بديل وحماية النفس/آخر مالك | groups.owner_id وsupervisor_id؛ versions.owner_id؛ assignments.owner_id. النسخ/الإسنادات المثبتة ليست ملكية تأليف تُعاد نسبتها. المالك يمكنه الإدارة دون تعيين نفسه supervisor participant أو توسيع public.is_owner() |
| primitive خاصة لنقل الإدارة ومحو الهوية، ومعاينة وجرد محدود بإصدارات وإعادة فحص ذرية | تأخذ scope_lock ثم profiles ثم versions/assignments بترتيب ثابت؛ تعيد فحص requested_at وrevision وclosed_at والحقوق والتبعيات بعد الانتظار. fail/ACK مجهول لا يعيد النقل تلقائيًا. ACL default-deny، SECURITY DEFINER وsearch_path فارغ؛ لا grant للمشرف/anon/worker ولا كتابة مباشرة من المتصفح |
| مسار انتقال مراجع للمجموعة دون تعطيل guard_managed_group_v1 أو قيودها | الحارس يمنع تغيير owner_id وsupervisor_id وstarts_at. السحب يبطل صلاحية المشرف/الرمز ويغلق نطاقه؛ memberships وmembership_periods والطلبات وtargets ونتائج الآخرين تبقى دون إعادة نافذة أو إسناد جديد ضمني. يجب تحديد إدارة المجموعة المؤرشفة بعد المحو دون إبقاء FK إلى هوية محذوفة |
| فصل إدارة الإسناد النهائي عن provenance بدل تغيير owner_id للمغلق | assignment_terminal_v1 تمنع تعديل ملكية الإسناد المغلق؛ assignment_scopes.supervisor_id وreview_id/group_id، assignment_reviews.writer_id وauthoring_drafts.writer_id، authoring_revisions وauthoring_publication_links تربط المحتوى. تحتاج FKs/CASCADE مراجعة حتى لا يمحو حذف الكاتب محتوى أو نتائج لازمة للغير أو يكسر مراجعة confirmed. تبقى closed_at وsnapshot/source_digest وtargets ودرجات الطلاب ثابتة |
| إزالة/تقليل مراجع الهوية غير اللازمة على كل التبعيات | supervisor_appointments.appointed_by؛ group_join_requests.decided_by؛ versions/assignments owner links؛ assignment_scopes.supervisor_id؛ drafts/reviews writer links. لا تبديلها عميانيًا بمعرف المالك ولا حساب وهمي دائم. تُراجع حقول publications/authoring_reviewed_packages/content_submissions/practical_presentations الحرة وأسماء المؤلف/المراجع في المستندات المثبتة؛ الحقوق تحدد أقل إسناد لازم لا نسخة من كل الهوية |
| ربط primitive بخط C2 للمحو والمصالحة، مع ترحيل الحارس المحلي | owner_account_deletion_v1 وsupabase/manual/rad085-account-erasure-local.sql يحجبان الحالات المشتركة الآن؛ وجود الملحق المحلي لا يثبت تثبيته حيًا. يلزم مسار preview→transfer→erase→receipt تحت معاملة وحدود واضحة، واستعادة/إعادة تطبيق idempotent وفق سجل محلي مشفر خارج snapshot. لا فك trigger/FK أو DROP CASCADE كاختصار |
| إنفاذ الموعد والرسائل التشغيلية دون تمديد requested_at | طلب التعطيل يوقف الوصول فورًا. C2 finalise لا يسمح قبل انقضاء30يومًا؛ D3 يوجب الإكمال ضمن النافذة. يجب تحديد وإثبات تنفيذ النقل قبل الحد ثم finalise عند الحد في عملية مخططة، أو إعداد فرق مسمى مستقل لأي تعديل لازم للعقد؛ لا تعديل المهلة أو تأجيل مفتوح من تلقاء المنفذ. فشل النقل يصعّد للمالك قبل الموعد ولا يعيد الساعة |
| readiness/ACL وكشف جرد FK شامل للنسخة الجديدة | توقعات SQL والحراس والبصمات الحالية محمية. تُجهز فروق file:line وold/new قبل طلب استثناء منفصل، ثم migration جديدة لا تحرير migrations الحالية. الجرد عند التنفيذ يجب أن يشمل أي FK جديد منذ هذه القائمة، وإلا يتوقف |

staff_events كيان مخطط في الخطة وليس جدولًا منشأ في المصادر الثلاثة الحالية؛ لا نختلق له أعمدة أو ترحيلًا ضمن إصلاح الجرد الحالي. فحص النص الحر لا يثبت حق حذف الإسناد أو الترخيص؛ الحالات غير المحسومة تحتاج قرارًا محددًا قبل إدخال محتوى حقيقي، دون إلغاء مهلة Terms.

## الشواهد المطلوبة قبل رفع المانع

طالب فقط؛ مشرف لم ينشر؛ مجموعة مشتركة؛ منشور/إسناد مفتوح؛ إسناد مغلق؛ confirmed review؛ حقوق تفرض الإسناد؛ آخر مالك/النفس؛ طالب باقٍ بنتائجه؛ موافقة/عضوية مسحوبة؛ سباق نقل/إغلاق/حذف؛ rollback كامل؛ ACK مجهول؛ تكرار آمن؛ استعادة snapshot ثم replay. لكل حالة: محو الهوية غير اللازمة، بقاء نتائج الآخرين وموعدها الأصلي، عدم إعادة التصحيح أو فتح closed_at، وعدم منح المشرف صلاحيات حسابات أو surveys. يثبت اختبار الساعة الحد30يومًا دون تغيير expectation تاريخي أو تمديد مهلة خفي.
