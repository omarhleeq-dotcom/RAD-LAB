# تقرير قرار الربط الخارجي — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

طلب المالك حزمة قرار External Binding & Provisioning Readiness لـGoogle Cloud Run Jobs وقاعدة البيانات بعد اعتماد الحاوية وentrypoint المحلية في #96. قُرئت AGENTS وHANDOFF وRAD-056 ودليل runtime وتقرير الحاوية وخطة Google والنقل/entrypoint وACL وhealth القائمة، ثم docs:context وGitHub للرؤوس وفحوصها. استُخدمت مهارة cloud-environment-runtime لسياسة البيئة فقط؛ لا Google identity أو secret bindings متاحة، وحالة إنفاذ HTTP في تقرير البيئة unknown فلا تُعد جاهزية؛ نجح GET المحدد لـGitHub بالفعل.

الميزانية المعروضة قبل التحرير **خمسة ملفات توثيقية** وهي الفعلية: ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md وهذا التقرير وASSESS_RUNTIME_LOCAL.md وHANDOFF.md وproject-status.md. لا وحدة مشتركة أو كود/SQL/UI أو package/lock أو workflow/pins/Variables. لا انحراف نطاق أو worktree/subagents.

كان checkout الابتدائي نظيفًا على main قديمة بالنسبة لـ#96؛ جُلب main ورأس #96 بالـfetch، واستُعيدت الحزمة في checkout نفسه بفرع محلي assess-external-binding. فشل tracking لأن refspec الأصلية تتتبع main فقط؛ اكتمل switch بلا tracking وتحقق رأس #96 وشجرة نظيفة قبل التحرير. لا تغيير ملفات الحزمة المعتمدة أو عمل مستخدم أُسقط.

## 2. المنجز والمستبعد

أُعدت [حزمة القرار](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md): مقترح us-central1 مشروط بمنطقة DB والإقامة، 1CPU/512Mi/300s وtasks1/parallelism1/retries0، تجربة يدوية محدودة وميزانية$5 وتنبيهات وحساب استخدام؛ مصفوفة IAM على Job وسر واحد، mount وإصدار وتدوير وإلغاء؛ شبكة وTLS/CA/login وإجراء قتل جلسات DB القائمة؛ مراقبة ومسؤول وبديل وشروط قبول.

نتيجتان مؤثرتان: shared pooler يتطلب اسم custom-role مركبًا ترفضه الحزمة الحالية، وفحص session_user يحتاج فصل هوية النقل عن login المتوقع؛ فلا جاهزية pooler أو تعديل validator ضمن هذا العمل. assess_worker الحالية أوسع من tick وتملك publication/recover؛ documented least privilege مقيدة بهذا العقد وليست tick-only. تضييقها يحتاج نطاقًا مستقلاً. direct مشروط بإثبات IPv4/v6 وقيود الشبكة، بلا IPv4 add-on/NAT أو فتح CIDR تلقائي.

لم تنشأ موارد أو APIs/فوترة/registry/secret/IAM/Job/alert/schedule، ولم يتغير env أو ASSESS_JOB_ENABLED أو Variables أو launch_gate أو PILOT_SCHEMA_VERIFIED. لا SQL كتابة أو اتصال/قراءة قاعدة أصلية أو إرسال رسالة تشغيلية. المصفوفة والوصفات ليست سياسات مطبقة أو اختبار إلغاء منفذًا.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on reviewer دون completion_evidence؛ حُدث الوصف والمصدر والملخص الخماسي مع revision والوقت. لا إغلاق provider/runtime/O108 أو مهمة أخرى. حُفظ تعارض RAD-024 الموروث؛ لا done لعمل غير مدموج أو دليل حي غير متحقق.

## 4. المشترك وScale وحفظ الحكم

لا كود مشترك تغير. حد1 للـtask/الاتصال/batch ثابت في الحزمة المحلية؛ 10 executions/يوم و100/شهر حدود تجربة إجرائية قابلة للمراجعة لا quota أو قفل عالمي. رفعها يحتاج قياس الذاكرة والمدة وDB/backlog والتداخل والتكلفة ومراقبة قابلة للتصرف؛ لا scan أو queue غير محدودة. health لا تعطي عمر queue/lease أو metadata المتأخرة؛ فجوة مراقبة معلنة قبل تشغيل مستمر.

لم يتغير الحكم المعتمد في DECISIONS أو S-ASSESS-15 أو تأجيل النسخة الشاملة؛ روابط الأدلة الأصلية محفوظة في الدليل والتسليم والحزمة. اختُصر المتبقي الحالي بالتسليم بدل نسخ سجل الجلسة؛ التفاصيل والحدود بقيت بروابطها. اقتراح region/budget/IAM ليس قرار مالك منفذًا.

## 5. الطب والدرجات والخصوصية

لا تغيير Practice أو طب/مصادر/ترخيص/معايير/Marker أو درجات/صور/توقعات/hashes أو نص موافقة/قبول نيابة عن أحد. لا أسرار أو بيانات مستخدمين جُلبت أو طُبعت؛ سجلات المراقبة المقترحة مجمعة ومنقحة. لا قبول تجريبي حي أو مراجعة طبية مستنتجة.

## 6. QA والأدلة وحدودها

تحقق GitHub بتاريخ2026-10-21 عمّان: أحدث main هو `ff68413042e6e8414ad70884efcfa71cac7443a7`، و[CI39464823281](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823281) و[Deploy39464823264](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823264) completed/success مع head_sha مطابق. [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة، رأسها `46b5afdecf2bbbe72f1e041ebc883fba8c505283`، و[CI39510382204](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39510382204) و[Deploy39510382205](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39510382205) completed/success للرأس نفسه. docs:context تحقق من PR/base عبر gh؛ لا نقل نجاح لرأس التوثيق التالي ولا polling أو إعادة workflow أو preview. Pages ليست runtime أو هاتفًا جديدًا.

روجعت عبر الويب مصادر Google/Supabase/PostgreSQL الرسمية المربوطة بجوار أحكام الحزمة: pricing/memory/IAM/secrets/budgets/spend caps والاتصال والأدوار وإنهاء الجلسات. تعذر فتح صفحة task-timeout عبر أداة الويب؛ لم يُستعمل بديل لتجاوز العائق، واستُند لعقد الحاوية المرتبط والمقروء في الدليل السابق لفجوة الإنهاء؛ 300s توصية هندسية وليست قيمة افتراضية من تلك الصفحة. لا سعر مضمون أو قدرة IAM/شبكة فعلية مثبتة من صفحة توثيق.

نجحت فحوص هذه الدفعة: docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مقابلها مع require-previous، وgit diff --check. بقي تعارض RAD-024 الموروث ظاهرًا دون إغلاق أو تغيير. لا إعادة check/build أو Docker/rehearsal/EN/AR/axe أو أدوات SQL/الحسابين، لأن التغيير توثيقي بلا سلوك جديد؛ الأدلة المحلية السابقة محفوظة بحدودها.

## 7. المفتوح

project/Billing والمشغّل/البديل وmetadata منطقة DB وقيود الشبكة غير محددة؛ لا provisioning ready قبل حسمها وإثبات TLS/ACL والإلغاء والتنبيه بإذن مستقل. JWT والجدولة والتشغيل والنسخ/restore/export والنشر وO108 بوابات مستقلة؛ النسخة الشاملة مؤجلة باختيار المالك دون سؤال جديد. restore تحتاج حجر القراءات وإعادة آثار الإغلاق/التعطيل/الموافقة والحذف وACL؛ purge وgate وحدهما لا يكفيان. runtimeOrLaunchVerified=false وgate مغلقة.

## 8. قائمة المالك وبرومت الجلسة التالية

راجع القسم6 من حزمة القرار لاعتماد/تعديل التوصيات وتحديد مسؤول وبديل ومسار الشبكة؛ أي تجهيز/نشر/تشغيل يحتاج إذنًا مستقلًا بعد النتيجة القابلة للمراجعة. لا إعادة سؤال اختيار Google أو النسخة أو إعادة الشواهد الناجحة بلا تغير.

ابدأ AGENTS وHANDOFF وRAD-056 وحزمة القرار وهذا التقرير، ثم docs:context وGitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout نفسه بلا worktree/subagents؛ اعرض ميزانية ومعايير قبول قبل التحرير. لا موارد حية أو SQL كتابة على الأصلية أو Variables/pins أو gate أو ready/merge/auto-merge من التسليم.
