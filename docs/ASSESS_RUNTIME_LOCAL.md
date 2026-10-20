# ربط Assess المحلي — Node24

هذه حزمة مكتبة خاصة قابلة للمراجعة، بلا executable عامل أو HTTP endpoint أو timer أو binding حي. [التقرير](ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md) يفصل الفحوص عن الأدلة الحية؛ [السياسة](ASSESS_RETENTION_POLICY.md) و[S-ASSESS-15](DECISIONS.md#assess-retention-owner-2026-10-20) حاكمتان.

## المسار المختار وحدوده

المستخدم يبقى browser → Supabase Auth/Data API → RPC المفوضة، عبر adapters الموجودة في runner-data وpractical-data وhistory-data وadmin-data وcontent-data. يتحقق المزود من توقيع JWT وصلاحيته ومصدره/جمهوره وفق إعداد Auth الفعلي، ثم يحدد auth.uid داخل SQL؛ لا هوية من body أو decoded claims بلا تحقق. لا service/admin key باسم المستخدم، ولا نقل جلسة المستخدم إلى اتصال العامل. لا adapter مستخدم جديد أو قبول v2 نيابة عن أحد. محاكاة auth.uid في QA ليست تحقق JWT. تدقيق توقيع/انتهاء/مصدر/جمهور وإلغاء جلسات المزوّد الحي يبقى بوابة مستقلة، ولا يغلقها نجاح الاختبار أو إفادة اختبارات المالك أو زوج القراءة المحدود.

الخادم الخاص Node24 لأنه البيئة المقترحة في خطة التجهيز والمتوافقة مع Buffer والمصحح وbigint والـregistries القائمة. لا توافق Deno/Edge أو استضافة العامل على Pages مستنتجة. لا اختيار مزود أو region/tier أو تكلفة أو موارد جديدة. اختيار الاستضافة وآلية سر التشغيل وقناة المراقبة قرارات ربط خارجي لاحقة؛ لا تمنع بناء المكتبة محليًا.

## البناء المحلي فقط

```sh
npm ci
node scripts/assess/build-runtime.mjs
```

الأمر يبني `assess-runtime.cjs` وpackage.json داخل مجلد مؤقت جديد `radlab-assess-build-*` ويطبع مساره وruntimeOrLaunchVerified=false. يستعمل esbuild مع target=node24 ويضم pg والمصحح والبيانات اللازمة، دون node-loader المرجعي أو source maps. يثبت البناء سائق pg JavaScript، ويرفض React/Next/Zustand في الرسم. ملف المكتبة يُستورد بلا credential أو اتصال؛ لا main أو scheduler أو process signal handler. هذه حزمة بناء محلية وليست release artifact منشورًا أو نظام أرشفة/نسخ. لا bundle أو private keys أو ملفات مؤقتة في Git.

## منفذ العامل

[server-runtime](../src/features/assess/server-runtime.ts) يصدّر createWorkerBinding وrunAssessJobs وinstallMixedContent وpublicationService القائمات. ينشئ pool كسولًا، ولا يبدأ العمل عند الاستيراد أو الإنشاء. لا يقرأ وجهة/كلمة مرور من environment ولا يقبل connectionString أو URL؛ كل حقول الوجهة والاعتماد وCA صريحة. لا تمرير كائن config أو pool أو الأخطاء إلى logs/المتصفح. الاستيراد مضاف إلى قائمة منع المتصفح في frontend-schema دون تغيير pins أو متطلبات SQL أو إثبات المخطط.

كل call: تحقق اسم RPC وأسماء/أنواع المعاملات → اتصال محدود → BEGIN → فحص login/current_user وNOINHERIT وغياب superuser/BYPASSRLS/CREATEDB/CREATEROLE/REPLICATION، وعضوية assess_worker وحدها دون ADMIN OPTION → SET LOCAL ROLE assess_worker → search_path فارغ ومهل statement60s/lock5s → SELECT ثابت مؤهل باسم schema ومعاملات منفصلة → COMMIT قبل إعادة الرد. فحص الدور حماية إضافية؛ **ليس مراجعة شاملة لكل المنح أو وراثة assess_worker**. خطأ/إقرار COMMIT ضائع يؤدي إلى rollback بأفضل جهد وإتلاف الاتصال، دون replay. SQL مصدر الحقيقة؛ rollback لاحق لا يلغي COMMIT سبق نجاحه.

القائمة تسع دوال فقط: maintain_v1 وclaim_v1 وfinish_v1 وfail_v1 وhealth_v1 وrecover_v1 وcontent_read_v1 وcontent_install_v1 وinstall_publication_v1. لا consent أو user impersonation أو start أو gate أو SQL إداري. recover وinstall لا يستدعيان تلقائيًا؛ يلزمهما إجراء مأذون مستقل. قيم uuid والأرقام والنصوص الرقمية وJSON محدودة، JSON≤2MB؛ الحد محلي وليس ضمان إجمالي الذاكرة لحجم الرد. المصحح والخدمات وmaintain/lease/recovery والحذف الذري لم تتغير، ولا عامل أو purge ثانٍ.

## TLS وACL والأسرار والإلغاء — قبل أي ربط حي

CA صريحة وrejectUnauthorized=true وفحص اسم المضيف الافتراضي في pg/Node، بلا تعطيل verification أو fallback إلى اتصال غير مشفر. عنوان DNS وميناء وقاعدة/login خاصون؛ socket غير مقبول لهذا الربط. لا اعتبار قبول CA الاصطناعية في mock شهادة TLS. يلزم على المزود إثبات السلسلة واسم المضيف ورفض شهادة/مضيف خاطئين، وتوافق الاتصال المباشر/الـpooler مع login وSET LOCAL؛ الربط قد يرفض أسماء pooler المركبة عمدًا حتى مراجعتها.

صلاحية login مخصصة محدودة: CONNECT للقاعدة المقصودة وعضوية assess_worker فقط، بلا ملكية كائنات/منح جداول أو public CREATE أو أدوار إدارية. مراجعة ACL تشمل المنح المباشرة وPUBLIC والعضويات العابرة وصلاحيات assess_worker وsecurity definer/RLS، مع رفض مستخدم/anon لدوال العامل. فحص login في الكود لا يغلق هذه البوابة. أسرار login خارج Git/build/browser، تُحقن من مدير أسرار يختار لاحقًا، ولا تُرسل للمحادثة. لا نسخ JWT أو مفاتيح service/admin إلى العامل.

إلغاء الصلاحية يحتاج منع اتصالات login الجديدة وإلغاء العضوية/الصلاحية وإغلاق الاتصالات القائمة وإبطال/تدوير السر بحسب المنصة؛ NOLOGIN وحدها لا تنهي اتصالًا أو معاملة قائمة. عند incident لا يكتفى بإيقاف scheduler. هذا تصميم مطلوب لإجراء إلغاء مراجع، لا أوامر SQL أو تجربة إلغاء حية منفذة. يراجع المسؤول أيضًا إعدادات logs لدى DB/host/proxy: لا statements/parameters/claims/أجوبة/إعدادات/علامات/هويات أو connection config. المحوّل لا يسجل events أو أخطاء خام؛ يحولها إلى invalid/limit/denied/conflict/unavailable فقط، دون cause/detail.

## الإيقاف والفشل وScale

التسلسل المطلوب من المضيف مستقبلًا: أوقف قبول ticks/عمليات install أو recover جديدة، أرسل AbortSignal إلى runAssessJobs، انتظر tick الجاري حتى تسوية claim وfinish/fail ثم health، ثم await binding.close. close يمنع calls جديدة وينتظر الاتصالات/المعاملات الجارية قبل pool.end، وتكراره يعيد الوعد نفسه. استدعاء close قبل تسوية tick قد يمنع finish/fail لاحقًا؛ ليس بديلًا عن Signal/انتظار tick. لا SIGKILL أو توقف مضيف موثوق من finally؛ تبقى lease/نوافذ C مرجع الاسترداد.

فقد finish ack بعد COMMIT لا يثبت غياب النتيجة؛ قد يعده runAssessJobs فشل تنفيذ غير مؤكد ويحاول fail تحت token الحالي، دون نتيجة ثانية أو صفر. لا retry داخل النقل، ولا تجاوز retry_at أو استرداد تلقائي بعد حدود C. الإغلاق النهائي وتعطيل Assess يمنعان البدء فقط؛ المحول لا يضيف حارسًا يمنع تسوية المحاولة أو النتيجة المستحقة. v1 لا تستبدل v2.

السقف pool=2 افتراضيًا وقابل للضبط1..4، ورفض فوري limit فوق الاتصالات الفعالة بدل queue غير محدودة. runAssessJobs تبقى1..100 لكل مرحلة؛ مجموع الصفوف عبر maintenance ليس حدًا إجماليًا100. تعيين الحجم والتداخل ومهلة إيقاف المضيف ومراقبة lease/purge وقياس سعة المزود يحتاج أدلة حمل مستقلة؛ لا QPS أو زمن توقف مضمون من fixture. مهلة اتصال10s وstatement60s/lock5s لا تثبت زمن إقرار الشبكة عند انقطاعها؛ إنهاء المضيف القسري يبقى نافذة عدم يقين تحتاج lease/recovery، لا إعلان rollback أو إعادة محاولة عمياء. تسع RPCs عقد إصدار صريح، وزيادتها تحتاج مراجعة أمنية واختبارات، لا تمرير أسماء حرة.

## حدود الاستعادة والبوابات

[اختيار المالك](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) يؤجل النسخة الشاملة إلى نهاية العمل؛ لا إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة. لقطة قديمة قد تعيد إسنادًا مغلقًا أو حسابًا معطلًا أو موافقة/metadata حذفت. purge النتائج وlaunch_gate وحدهما لا يحجران history/consent وبقية القراءات: يلزم حجر الشبكة/API/الهويات ثم إعادة الآثار الأحدث والحذف وACL قبل رفعه. لا backup/export/restore system في الحزمة.

الأصلية وlaunch_gate لم تُلمسا. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، والهوية الحية وربط runtime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. بناء المكتبة واختبار SQL اصطناعي لا يثبتان قبولًا حيًا أو جاهزية مزود.
