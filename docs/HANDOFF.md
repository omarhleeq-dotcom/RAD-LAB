# التسليم الحالي — الدفعة 4 من RAD-061 في Draft PR #102 تنتظر مراجعة المالك، وزر الإغلاق RAD-060 مؤجل إلى RAD-062

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل `docs:context`، ثم `status:summary -- --id RAD-060` و`-- --id RAD-061`. [project-status](project-status.md) هو مصدر الحالة الوحيد. استمر في الـcheckout نفسه، بلا worktree أو subagents، وبلا ready أو merge أو auto-merge.

## المنجز والمتبقي
- دُمج #96، وأُغلقت التجربة الهندسية لـAssess بحسب [التقرير النهائي](ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md) و[قرار الإغلاق](DECISIONS.md#assess-trial-closeout-owner-2026-10-22). نطاق التجربة يبقى فعّالًا، والبوابة والإسنادات وLOGIN مغلقة. لا تُكرَّر التجربة ولا شواهدها.
- تدقيق RAD-061 وخطة الدفعات في [تقرير التدقيق](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md). الدفعات 1 و2 و3 و5 و6 وحد الوقت مدموجة (#100 و#101)؛ التفاصيل في [تقرير الدفعة 1](RAD-061_BATCH1_REPORT_2026-10-22.md) و[تقرير الدفعات 2 و3 و5 و6](RAD-061_BATCHES_2_3_5_6_REPORT_2026-10-22.md).
- **الدفعة 4** في Draft PR #102، commit لكل جزء، والتفاصيل والإثباتات وبصمات الحدود في [تقريرها](RAD-061_BATCH4_REPORT_2026-10-22.md):
  - CLN-030: `OwnerPanel.tsx` يستخدم `useSessionAccount()`، مع اختبار ثابت يمنع `useAccount` خارج `SessionGate`.
  - CLN-037: نصوص واجهة Assess وARIA ثنائية اللغة، مع `lang`/`dir` داخل منطقة الامتحان الإنجليزية، وعنوان ثنائي لصفحة `assess`، و«Settings» في `PracticalControls.tsx` بطلب المالك. `CONTROL_LABELS` و`choices.*` لم تُمس.
  - تعليقا `pipeline.ts` (~:164 و~:241) صُحّحا، تعليقات فقط.
- **RAD-060 (زر الإغلاق) مؤجل بقرار المالك:** `owner_page_v1('assignments')` لا يعيد `closed_at`. الزر وإضافة `closed_at` ينتقلان إلى أول خطوة في RAD-062 ضمن دورة الـmigration نفسها ([القرار](RAD-061_BATCH4_REPORT_2026-10-22.md#rad-060-decision)). [إجراء console](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-close-console-procedure) يبقى المسار المعتمد.
- **بعد الدفعة 4:** CLN-042 دفعة أمان صغيرة. CLN-010 ما زال قرارًا مفتوحًا للمالك.

## الخطوة التالية والتوقف
- **الخطوة التالية:** مراجعة المالك لـDraft PR #102. بعد الدمج: جرد RAD-064 (قراءة فقط).
- **في أول migration من RAD-062:** يدخل `closed_at` في قائمة التكليفات وزر الإغلاق (RAD-060)، مع فحص SQL وتغيّر `requiredMarker` وتحقق حي جديد قبل النشر، ثم فحص المالك من الهاتف.
- **عند تنفيذ أي دفعة:** لا تغيير لتوقعات الاختبارات أو الـgoldens أو بصمات المشاهد، ولا إعادة توليدها.
- **الملفات المثبّتة ببصمة** في `scripts/pages/frontend-schema.json`: تعديلها دون تحديث البصمة يُسقط CI، والتحديث يكون بقبول المالك الصريح.
- **قبل RAD-062:** يتحقق المالك من حصص Supabase في لوحة Usage. أول خطوة في RAD-062 تصميم الاحتفاظ والأدوار.

<a id="المتابعة"></a>
## القرارات والبوابات الثابتة
- **ترتيب المراحل** بحسب [قرار المالك](DECISIONS.md#assess-authoring-owner-2026-10-22)، معدّلًا بـ[قرار ترتيب التنظيف](DECISIONS.md#cleanup-sequencing-owner-2026-10-22).
- **برمجة Assess** مؤجلة حتى استئناف المالك الصريح. والفحوص والصور الجديدة مجمّدة.
- **محسوم ولا يُعاد طلب اعتماده:** [تصميم Assess](DECISIONS.md#assess-owner-2026-10-19) و[الاحتفاظ](DECISIONS.md#assess-retention-owner-2026-10-20) و[النسخة الشاملة المؤجلة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20).
- **المحتوى الامتحاني بالإنجليزية** و`CONTROL_LABELS` جزء من عقد عرض السؤال ([S-ASSESS-7](DECISIONS.md#decision-s-assess-7))؛ واجهة المنصة ثنائية اللغة.
- **RAD-019:** يجوز إرسال حزمة المراجعة الآن، ومعها CLN-018 وCLN-027 وCLN-034 ([البنود](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#rad-019-review-items)).
- **توحيد الأطراف العليا** (CLN-016/017/025/028) جلسة واحدة عند أول محفّز في البند 7 من القرار. RAD-021 بعدها.
- **ممنوعات مستمرة:** لا أسرار ولا بيانات دخول ولا UUID في المحادثة، ولا فتح أو مشاركة hosted preview من المساعد.
