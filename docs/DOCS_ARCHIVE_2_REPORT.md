# DOCS-ARCHIVE-2 — الأرشفة والأدلة المختصرة

الفرع `docs/archive-sessions-and-compact-guides` من main بعد دمج #81 عند `6d9df0495a7ab5aad188ff3ee65843ea9868955c`؛ ثبتت مطابقة شجرة الملفات عبر Git/API. هذه جلسة DOCS، وطلب المالك اعتماد البرومبت مع تصحيحات المراجعة. Draft PR فقط، لا ready/merge/auto-merge أو معاينة مستضافة.

## 1. الانحرافات والميزانية

الخريطة المغلقة المعتمدة:39 تقرير جلسة + ملفا تحليل =41 نقل محتوى. الوجهات sessions/ وanalysis/ كما في خريطة DOCS-ALIGN-1. أربعة مسارات أصلية تبقى ملفات إحالة قصيرة لأن الكود/CI يعتمد عليها. لم تُضف «ملفات خيارات/أثر» غير مسماة؛ تلك الموجودة ضمن التقارير تدخل مرة واحدة فقط. السقف105 مسارات توثيق:82 قديمًا/جديدًا للنقل،21 ملفًا ثابتًا مرشحًا للتحديث (إضافة AGENTS للخريطة السابقة)، وملفان جديدان. العدد الفعلي النهائي في §6؛ الصور غير منقولة. جداول DECISIONS تحافظ على النصوص والخلايا، مع إضافة anchors وتنقل وتصنيف مدعوم، لا تغيير قرار طبي أو اختراع إغلاق شامل. كشف الفحص البصري/البنيوي أيضًا ثلاثة بلوكات جدول بلا ترويسة فعالة: جدولان في DECISIONS أُضيفت لهما ترويسات، وصف waiting_on في status-format أُعيد وصله بجدوله؛ لا تغيير محتوى أو schema، وكلا الملفين ضمن الميزانية.

## 2. النطاق المنجز والمؤجل

أرشفة المحتوى مع تحديث روابطه الداخلية والصور والإحالات النصية/source_ref؛ فهرسا docs والأرشيف؛ اختصار CLAUDE ومواءمة AGENTS؛ توزيع قواعد الوصفة وفجواتها وحذف القالب المكرر؛ فهرس القرارات السارية وفصل المفتوح/الجزئي عن الأسئلة المحسومة والسجل المستبدل. تحديث HANDOFF والحالة لدمج #81. RAD-025 يبقى review لدفعة الأرشفة الحالية، لا done قبل دمجها. فحص الهاتف RAD-054 يبقى review؛ RAD-052/053 وO105 وبقية المراجعات كما هي. المرحلة البرمجية التالية و«محاولاتي» وAssess مؤجلة؛ لا فحوص/صور جديدة ولا إعادة اعتماد تصميم.

## 3. بحسب المهمة

### خريطة النقل الدقيقة

الجدول يصف المحتوى المنقول؛ المصدر القديم غير رابط بعد النقل إلا في ملفات التوافق الأربعة.

| المسار الأصلي | المحتوى المؤرشف |
|---|---|
| `docs/session-11-generalisation.md` | [docs/archive/sessions/session-11-generalisation.md](archive/sessions/session-11-generalisation.md) |
| `docs/session-12-chest-lateral.md` | [docs/archive/sessions/session-12-chest-lateral.md](archive/sessions/session-12-chest-lateral.md) |
| `docs/session-13-chest-ap.md` | [docs/archive/sessions/session-13-chest-ap.md](archive/sessions/session-13-chest-ap.md) |
| `docs/session-13b-scene-design.md` | [docs/archive/sessions/session-13b-scene-design.md](archive/sessions/session-13b-scene-design.md) |
| `docs/session-14-limbs-generalisation.md` | [docs/archive/sessions/session-14-limbs-generalisation.md](archive/sessions/session-14-limbs-generalisation.md) |
| `docs/session-14.2b-hand.md` | [docs/archive/sessions/session-14.2b-hand.md](archive/sessions/session-14.2b-hand.md) |
| `docs/session-14.3-elbow.md` | [docs/archive/sessions/session-14.3-elbow.md](archive/sessions/session-14.3-elbow.md) |
| `docs/session-14.4-knee-foot.md` | [docs/archive/sessions/session-14.4-knee-foot.md](archive/sessions/session-14.4-knee-foot.md) |
| `docs/session-14.5-ankle.md` | [docs/archive/sessions/session-14.5-ankle.md](archive/sessions/session-14.5-ankle.md) |
| `docs/session-2-positioning.md` | [docs/archive/sessions/session-2-positioning.md](archive/sessions/session-2-positioning.md) |
| `docs/session-3-technique.md` | [docs/archive/sessions/session-3-technique.md](archive/sessions/session-3-technique.md) |
| `docs/session-4-radiograph-renderer.md` | [docs/archive/sessions/session-4-radiograph-renderer.md](archive/sessions/session-4-radiograph-renderer.md) |
| `docs/session-5-baseline-options.md` | [docs/archive/sessions/session-5-baseline-options.md](archive/sessions/session-5-baseline-options.md) |
| `docs/session-5-qa-matrix.md` | [docs/archive/sessions/session-5-qa-matrix.md](archive/sessions/session-5-qa-matrix.md) |
| `docs/session-5-qa.md` | [docs/archive/sessions/session-5-qa.md](archive/sessions/session-5-qa.md) |
| `docs/session-7-demographics-impact.md` | [docs/archive/sessions/session-7-demographics-impact.md](archive/sessions/session-7-demographics-impact.md) |
| `docs/session-7-engine-generalisation.md` | [docs/archive/sessions/session-7-engine-generalisation.md](archive/sessions/session-7-engine-generalisation.md) |
| `docs/session-8-demographics-alignment.md` | [docs/archive/sessions/session-8-demographics-alignment.md](archive/sessions/session-8-demographics-alignment.md) |
| `docs/session-continuity-2026-10-11.md` | [docs/archive/sessions/session-continuity-2026-10-11.md](archive/sessions/session-continuity-2026-10-11.md) |
| `docs/session-continuity-2026-10-15.md` | [docs/archive/sessions/session-continuity-2026-10-15.md](archive/sessions/session-continuity-2026-10-15.md) |
| `docs/session-pelvis-ap-implementation.md` | [docs/archive/sessions/session-pelvis-ap-implementation.md](archive/sessions/session-pelvis-ap-implementation.md) |
| `docs/session-pelvis-ap-reference-2026-10-15.md` | [docs/archive/sessions/session-pelvis-ap-reference-2026-10-15.md](archive/sessions/session-pelvis-ap-reference-2026-10-15.md) |
| `docs/session-rad-041a-accounts-backend-2026-10-15.md` | [docs/archive/sessions/session-rad-041a-accounts-backend-2026-10-15.md](archive/sessions/session-rad-041a-accounts-backend-2026-10-15.md) |
| `docs/session-rad-041b-account-ui-2026-10-15.md` | [docs/archive/sessions/session-rad-041b-account-ui-2026-10-15.md](archive/sessions/session-rad-041b-account-ui-2026-10-15.md) |
| `docs/session-rad-043b-feedback-2026-10-16.md` | [docs/archive/sessions/session-rad-043b-feedback-2026-10-16.md](archive/sessions/session-rad-043b-feedback-2026-10-16.md) |
| `docs/session-rad-045-credits-2026-10-16.md` | [docs/archive/sessions/session-rad-045-credits-2026-10-16.md](archive/sessions/session-rad-045-credits-2026-10-16.md) |
| `docs/session-rad-047a-scalability-audit-2026-10-16.md` | [docs/archive/sessions/session-rad-047a-scalability-audit-2026-10-16.md](archive/sessions/session-rad-047a-scalability-audit-2026-10-16.md) |
| `docs/session-rad-050-terms-implementation-2026-10-16.md` | [docs/archive/sessions/session-rad-050-terms-implementation-2026-10-16.md](archive/sessions/session-rad-050-terms-implementation-2026-10-16.md) |
| `docs/session-rad-052-session-gate-2026-10-16.md` | [docs/archive/sessions/session-rad-052-session-gate-2026-10-16.md](archive/sessions/session-rad-052-session-gate-2026-10-16.md) |
| `docs/session-rad-053-catalogue-2026-10-16.md` | [docs/archive/sessions/session-rad-053-catalogue-2026-10-16.md](archive/sessions/session-rad-053-catalogue-2026-10-16.md) |
| `docs/session-rad-054-appearance-2026-10-16.md` | [docs/archive/sessions/session-rad-054-appearance-2026-10-16.md](archive/sessions/session-rad-054-appearance-2026-10-16.md) |
| `docs/session-rad-054-implementation-2026-10-16.md` | [docs/archive/sessions/session-rad-054-implementation-2026-10-16.md](archive/sessions/session-rad-054-implementation-2026-10-16.md) |
| `docs/session-rad-054-phone-fixes-2026-10-16.md` | [docs/archive/sessions/session-rad-054-phone-fixes-2026-10-16.md](archive/sessions/session-rad-054-phone-fixes-2026-10-16.md) |
| `docs/session-shoulder-grashey-implementation-2026-10-15.md` | [docs/archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md](archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md) |
| `docs/session-shoulder-grashey-reference-2026-10-15.md` | [docs/archive/sessions/session-shoulder-grashey-reference-2026-10-15.md](archive/sessions/session-shoulder-grashey-reference-2026-10-15.md) |
| `docs/session-shoulder-grashey-settlement-2026-10-15.md` | [docs/archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md](archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md) |
| `docs/session-shoulder-y-gates-2026-10-15.md` | [docs/archive/sessions/session-shoulder-y-gates-2026-10-15.md](archive/sessions/session-shoulder-y-gates-2026-10-15.md) |
| `docs/session-shoulder-y-reference-2026-10-15.md` | [docs/archive/sessions/session-shoulder-y-reference-2026-10-15.md](archive/sessions/session-shoulder-y-reference-2026-10-15.md) |
| `docs/session-ui-audit-2026-10-16.md` | [docs/archive/sessions/session-ui-audit-2026-10-16.md](archive/sessions/session-ui-audit-2026-10-16.md) |
| `docs/SESSION_11_NEEDS_SUMMARY.md` | [docs/archive/analysis/SESSION_11_NEEDS_SUMMARY.md](archive/analysis/SESSION_11_NEEDS_SUMMARY.md) |
| `docs/MODALITY_SOURCES_CANDIDATES.md` | [docs/archive/analysis/MODALITY_SOURCES_CANDIDATES.md](archive/analysis/MODALITY_SOURCES_CANDIDATES.md) |

### مسارات التوافق الباقية

| ملف الإحالة النشط | المرجع الثابت غير المعدل |
|---|---|
| `docs/session-3-technique.md` | `src/features/technique/model.ts` |
| `docs/session-5-qa.md` | `.github/workflows/ci.yml` |
| `docs/session-7-demographics-impact.md` | `src/data/cases/chest-pa-erect.ts` |
| `docs/session-13b-scene-design.md` | `src/features/positioning/LateralFigure.tsx` |

قائمة REVIEW_CHECKLIST_EDUCATOR_PHYSICIST وحزمة REVIEW_PACKAGE والمراجع والمصادر والأصول تبقى نشطة. تعديلات المراجع/القائمة/سجل الأصول هنا إحالات فقط. صور تقارير session-4-renders وsession-5-renders بقيت بمواقعها الأصلية؛ ملفات التوثيق المؤرشفة تحل إليها من موقعها الجديد. التقرير السابق يبقى لقطة بتاريخها، وتُحدّث روابطه فقط؛ هذا التقرير والتسليم هما الوضع الأحدث.

### قاعدة وفجوة إلى موضعها الجديد

#### ملاحظات CLAUDE الأصلية

| الملاحظة الأصلية | الموضع الحي الجديد في CLAUDE | الحفظ / سبب إزالة الصياغة السابقة |
|---|---|---|
| Next 16 | Pilot, hosting and runtime | Middleware/static-host/typegen distinction retained. |
| Image variants | Medical evidence, scoring and rendering | Engine variant and ResultImage roles retained. |
| Collimation is scored under `positioning` (spec table has no separate category). | Medical evidence, scoring and rendering | Positioning category retained. |
| Technique (Session 3) | Medical evidence, scoring and rendering | Protocol/control/tolerance/evidence separation; EI/DI/exposure limits retained. |
| Radiograph renderer (Session 4) | Medical evidence, scoring and rendering | Pure render pipeline, seeded determinism, tuning/provenance and exposure honesty retained. |
| Marker laterality (Session 4) | Medical evidence, scoring and rendering | PA weight0 + critical gates; per-exam conventions; no RTL mirror. The universal unscored wording is narrowed to PA. |
| Patient instructions (Session 4) | Architecture and optional mechanisms | Independent deterministic cooperation; keep-still weight0 retained. |
| Pilot preview (Session 6) | Pilot, hosting and runtime | Banner/noindex/static host, accounts-off and own Supabase origin/public-key exception retained; later pilot decisions linked. |
| Platform design (Session 6, **not implemented**) | Current scope and authority | Obsolete not-implemented snapshot removed; implemented shell and future containers distinguished. |
| Engine generalisation (Session 7) | Architecture and optional mechanisms | Chest-only snapshot replaced by current registries; byte-identity/53-scenario history remains in archived Session7, guard policy retained. |
| Platform shell (Session 9) | Current scope and authority; Pilot, hosting and runtime | Routes/catalogue, one main,404, legacy-route sync retained. |
| Roadmap order (S10-1, owner-approved) | Current scope and authority | S10-1 order superseded by S12-12 + freeze; sourcing rule retained separately. |
| Reference first (S10-2, owner-approved) | Medical evidence, scoring and rendering | Merged Needs, reference-before-generalisation, authoritative full text and access limits retained. |
| Commercial product (S10-3, owner-approved) | Medical evidence, scoring and rendering | Paraphrase/printed pages, licence scope, Radiopaedia ban retained; final marker rules per exam. |
| Source library (Session 10b, S10-4) | Medical evidence, scoring and rendering | Notes not PDFs; advisor verification boundaries/source register and O5 review remain. |
| Governing authority (S10b-25, owner decision 2026-10-06, final, binding) | Medical evidence, scoring and rendering | BONTRAGER priority and provisional clinical review retained. |
| Generalisation (Session 11, S11-1…4) | Architecture and optional mechanisms | Optional marker/control/attenuation/scene mechanisms; no grid/build implied; details recipe§2. |
| Chest Lateral (Session 12, S12-1…11) | Existing exam limits — keep when reusing models | Source vs teaching bands, detector-side marker, cooperation/scene data and baseline limits preserved in records; stale blanket physical-turn assertion replaced by image-sign rule. |
| Chest AP supine (Session 13, S13-1…5) | Existing exam limits — keep when reusing models | Anatomical marker/state/angle/wording, magnitude-only sign, NIH secondary licence/O16 remain. |
| Scene design (Session 13b, S13b-1) | Scene design and bilingual UI | Tokens, colour/contrast, shape/accessibility/RTL limits retained. |
| Exam recipe (S13c-1) | Medical evidence, scoring and rendering | Reference checklist and stop conditions linked, current optional mechanisms replace S11-only snapshot. |
| Generalisation for limbs (S14-0) | Architecture and optional mechanisms | Optional marker/control/attenuation/scene mechanisms; no grid/build implied; details recipe§2. |
| Wrist pilot (S14.1, DECISIONS S14.1-1…6) | Existing exam limits — keep when reusing models | No-code-yet snapshot superseded; reference/source gaps remain in archive, implemented LEFT exams in current guide. |
| Wrist exams (S14.1c, S14.1c-1…8) | Existing exam limits — keep when reusing models | LEFT/fixed-side/manual/coverage constraints; older bump model superseded by S-VIS-1b, guards/audits through recipe§7. |
| Session prompt standard (S-STD-1, 2026-10-07, binding) | Session workflow, QA and delivery | S-STD-1/2/3/4 and short skeleton retained. |
| Hand exams (S14.2b, S14.2-6…11) | Existing exam limits — keep when reusing models | Extension variant/shared 2.5D/render data and image limits retained; source ownership labels stay in register; duplicate next-dev notice consolidated. |
| Elbow exams (S14.3, S14.3-5…12) | Existing exam limits — keep when reusing models | Model/portrait/undrawn-arc and crop limits retained; provenance/QA via register and recipe. |
| Knee and foot exams (S14.4, S14.4-1…18) | Existing exam limits — keep when reusing models | RIGHT, generic models/absolute angle, tube-sign/no-image-effect and coverage limits retained. |
| Ankle exams (S14.5, S14.5-1…13) | Existing exam limits — keep when reusing models | Inferred LEFT, lower-limb mechanisms and image/review limits retained. |
| Pelvis AP (S-PELVIS-1) | Existing exam limits — keep when reusing models | Fixed R/optional bone zones, independent choices, existing warp/no hidden anatomy, lossless asset relationship retained. |
| Shoulder Grashey (S-SHOULDER-3) | Existing exam limits — keep when reusing models | Erect/manual/R,35–45 plateau, one cue, no arm effect/hidden anatomy retained. |

قواعد Rules/Session continuity/RAD-STATUS السابقة بقيت موزعة في أقسام المعمارية والأدلة وQA والحالة؛ تفاصيل الفحوص العددية لا تُلغى بنقلها إلى المراجع/DECISIONS/REVIEW_PACKAGE وسجل الأصول. النص القديم متاح بتاريخ main الأساسي في Git، وتفاصيل التنفيذ في تقاريره المؤرشفة. تنبيه next dev في موضع واحد. أُزيل طلب إضافة ملاحظة جلسة جديدة إلى CLAUDE من الوصفة منعًا لإعادة نمو السرد؛ التغيير في قاعدة مستمرة فقط يستدعي تعديل الدليل.

#### بنود §10 السابق في الوصفة — بندًا بندًا

| البند السابق | الموضع الجديد / الحكم المدعوم |
|---|---|
| Closed by S14-0: layout/projection/wording registries، label script، order | §2 و§4a؛ S12-12 في DECISIONS/ROADMAP؛ ليست ثغرات مفتوحة |
| What a limb still adds: effect/landmarks/art/second view/registrations/labels | §2 Remaining bespoke needs و§3؛ لا تعميم بلا مرجع merged |
| Closed by S14.1b G1–G6/G9/G10؛ CATEGORIES وsynthetic registry validation | §2 Optional chest fields/effect hook/validation؛ تبقى متاحة لا عمل جديد |
| Generic technique typing + predicted chest test narrowing | §2 Validation/types؛ التنبؤ استبدل بالنتيجة المسجلة: لم يحتج narrowing فعليًا |
| planRotationDeg AP switch / O19 | §6 و§10 navigation؛ ما زال مفتوحًا، لا تغيير كود |
| Credits / SID-position label / O18 | §10 navigation؛ credits منفذة RAD-045، بقية البنود لا تغلق استنتاجًا |
| Arabic AP overlap +15° / O20 | §4a و§10؛ لا ادعاء إصلاح من تنظيف docs |
| First limb order: reference → generalisation → exams | §2 و§8 advisor؛ generalisation فقط عند احتياج غير منفذ، لا إعادة تنفيذ المغلق |
| Open vocabularies and actual former chest requirements | §2؛ vocabulary مفتوح، optionality منفذة S14.1b |
| Category weights cannot silently equal PA | §1 step4 و§2 و§8؛ قرار per-exam/sum100 |
| Single-limb marker convention / O21 | §2 و§6؛ fixed-side منفذ، لا viewer-half |
| Blocked shortlist / O25 and docs continuation | §5؛ توقف مسار الوصول، استكمال docs المستقلة فقط، صورة معتمدة قبل code |
| Prompt lacks reference-merged / category slots | §8/§8a؛ حقول readiness/decisions/scope بدل القالب المكرر |
| Chest-worded reference template / wrist Needs pattern | §2/§8؛ افحص Needs الفعلية من المرجع والحقول الحالية؛ قالب المرجع نفسه غير معدّل في هذه الدفعة |
| fixed-side missing from main table; right-case O29 | §2 و§6؛ side في exam markerRule؛ case-level side فقط عند need جديد |
| Detector axis / markerHint chest wording | §2 Limb display و§4؛ التسميات بحسب الأسرة |
| Limb effect + pixel-step/landmark hook | §2 و§3؛ تجنّب core chest effect حين limbRotation معلن |
| Required anatomy limited by image / O28 | §4 و§5؛ gap صريح لا anatomy مختلقة |
| Family scene-dom guard | §7؛ ملف الأسرة وحدها، لا تغيير hashes السابقة |
| Label script tests named axes only | §4a؛ محاور moving labels لا rotation وحده |
| Actual typing required no narrowing | §2 Validation/types؛ يحل التنبؤ القديم |
| Limb audit differs in mAs/patient wording | §7؛ adaptation مبني على البيانات لا نسخ أعمى |
| Side already in fixed-side / no duplicate field | §6؛ O29 محفوظ |
| Generic limb-warp/layers/copies models | §2 Effect hook؛ model/concept بدل pixel algorithm جديد |
| Tube angle sign and no image effect | §2 و§6؛ feedback/side scene فقط حيث لا أثر صادق |
| Edge artifacts / EXIF / cropping shifts | §5؛ فحص الحواف وتوثيق التحويل/تحديث landmarks |
| Clip scene / soft tissue contrast / short labels | §4/§4a؛ القاعدة الأصلية في سجل knee-foot محفوظة؛ contrast/fit حية |
| Family guard must not render another family's projections | §7؛ منع cross-family string/hash coupling |

أُبقي anchor القديم لـ§10 كإحالة توافق قصيرة، دون السرد التاريخي المتراكم. قسم §8 يبقى بعنوانه للتوافق ويشير إلى skeleton واحد. لا نص قديم يلزم S11/S12 فقط بعد دمج آليات الأطراف، ولا طلب عام خاطئ لنتيجة wrong-projection حرجة في كل فحص.

### تصنيف DECISIONS وحفظ التعاقب

الفهرس العلوي يحيل إلى قواعد قائمة؛ صفوف D/S تبقى ظاهرة بحسب ترتيبها، عدا S10-1 الذي استُبدل ترتيبه بالكامل بـS12-12. القرارات المعدّلة جزئيًا مثل D3/S10-5/S10b-8 لا تُرمى كاملة في Superseded. صُفّت O-items الأصلية في جدول مفتوح/جزئي، وجدول تاريخي مطوي للمحسوم مع دليل الإغلاق، وحُفظت نسختا O92/O94 القديمتان في Superseded وإحالتهما لآخر وضع. لم يُحذف نص أو مصدر، والمعرّفات المتكررة مميزة بـanchors ثابتة. O54/O68/O87 وO18/O105 تبقى جزئية؛ مراجعة المعلم/الهاتف ليست إغلاقًا آليًا. قراءات الرخص القديمة تُفسَّر بقرار O100، لا طلب فحص ويب جديد يتجاوز قرار المالك. §6 يقارن كل خلية بالسجل الأساسي بعد تطبيع الإحالات/anchors/الحشو الفارغ فقط.

## 4. المشترك وScale check

لا تغيير كود أو اعتماد أو schema. فهرس وخريطة old→new ومسارات توافق تسمح بتوسيع الأرشيف دون كسر مراجع الكود، والقواعد تحيل إلى registries بدل قائمة قيود ثابتة. أسماء وأرقام الفحوص في الدليل لقطة مؤرخة مرتبطة بالكود؛ ليست سقفًا. ملفات الإحالة لا تُنتج نسختين مستقلتين للمحتوى.

## 5. الطب والدرجات

| المجال | الأثر |
|---|---|
| البيانات والقيم الطبية والدرجات والـmarkerRule | لا تعديل؛ PA weight0 مع critical gates محفوظ، الأوزان/القواعد per-exam |
| الصور والمشاهد وrendering/characterisation/goldens/hashes | لا تعديل أو إعادة توليد؛ صور تقارير QA باقية |
| قواعد المصادر/الرخص/الأمان | حفظ BONTRAGER والـprovisional/التجاري وSupabase exception؛ لا اعتماد طبي أو لغوي أو تحقق رخص جديد |
| القرارات المؤجلة والتحقق الحي | لا إغلاق فحص الهاتف أو O105 أو استئناف مرحلة برمجية |

## 6. QA ودليل عدم التراجع

نجحت الفحوص المحلية النهائية:

- `npm run status:check -- --base origin/main --require-previous`: انتقال مقابل main بعد #81 ناجح؛ تنبيه تعارض RAD-024 الموروث باقٍ، لا إغلاق استنتاجي.
- 117 ملف Markdown، و685 إحالة محلية (مسارات/عناوين/صور)، و125 مسار source_ref نصيًا؛ صفر مسار أو عنوان مكسور، صفر سور غير مغلق، وصفر صف جدول مختل. فُحصت الجذور وdocs والأرشيف بما فيها الملفات الجديدة.
- 41 محتوى منقول مطابق للنص الأصلي بعد تحويل الإحالات فقط؛ الملفات الأربعة الباقية تقود إلى وجهاتها، والصور/الكود/CI لم تتغير. الأصل محفوظ في main الأساسي ونسخة تدقيق مؤقتة خارج المستودع.
- 403 صفوف قرارات و443 ظهورًا لمعرّفاتها محفوظة خليةً بخلية، بمقارنة multiset بعد إزالة anchors الجديدة/الحشو الفارغ وتطبيع النقل؛ ترتيب D/S محفوظ عدا S10-1 الذي صار في التاريخ بإحالته للبديل. لا حذف مصدر أو معرّف.31 ملاحظة CLAUDE و27 بندًا سابقًا في§10 لها خريطة حفظ أعلاه.
- جميع56 معرّفًا RAD-001…056 وnext_id=RAD-057 محفوظة؛ revision78. التغيير الدلالي للمهمة RAD-025 فقط؛ بقية التغييرات إحالات نقل، وخمسة أوصاف إحالة لمواضع CLAUDE الجديدة (RAD-001/004/006/009/023). حالة الهاتف والتأجيل وبقية المهام لا تتغير.
- 105 مسارات توثيق ضمن سقف105:41 وجهة مؤرشفة،37 مسارًا قديمًا يُحذف بعد النقل،4 ملفات إحالة قديمة،21 ملفًا ثابتًا، وملفان جديدان.68 ملفًا ناتجًا و37 مسارًا أصليًا مزالًا؛ العرض في Git قد يجمعها كإعادات تسمية.546 ملفًا متتبعًا غير Markdown دون أي diff، بما فيها الصور والاختبارات/fixtures/hashes والـscripts/CI/الاعتمادات.
- `git diff --check origin/main` ناجح. CLAUDE انخفض من25197 إلى16712 بايت (نحو34%)، والوصفة من38713 إلى34650 بايت (نحو10%؛ حفظ متعمد لقواعد السلامة والأدلة). تنبيه next dev مرة واحدة، والتسليم دون80 سطرًا.

هذه QA توثيقية؛ لم نشغّل check/build/browser للتطبيق لأن أي كود أو اختبار لم يتغير، ولم نفتح معاينة مستضافة أو نتحقق طبيًا/لغويًا/من تراخيص أو نشر حي جديد. أدوات الفحص المؤقتة خارج المستودع؛ الملخص `/tmp/archive2-qa-result.json` في بيئة الجلسة، لا متطلب تشغيل دائم. فحوص CI التلقائية منفصلة وليست مدّعاة هنا.

## 7. المفتوح

مراجعة ودمج دفعة الأرشفة يدويًا فقط بعد التقرير. RAD-025 review إلى ذلك الحين؛ لا تمثيل العمل كمدمج. الهاتف/RAD-052/053/054 والمراجعات الطبية/العربية وRAD-024/O105 كما في الحالة؛ لا إصلاحات جانبية. تحديث CLAUDE لا يغير السياسات المؤجلة أو يحسم التعارضات السريرية.

## 8. قائمة المالك والمتابعة

راجع docs/README → الحالة والتسليم → الأرشيف، وافتح نموذجًا من كل أسرة تقارير ومن صورتها التاريخية. تحقق من تمييز المفتوح عن المغلق والجزئي في DECISIONS، وأن الروابط القديمة الأربعة تقود للمحتوى المؤرشف. مراجعة الوثائق هذه مستقلة عن فحص التطبيق على الهاتف؛ لا بدء تلقائي للبرمجة.

```text
SESSION التالية: تبدأ فقط بطلب المالك وبعد التحقق من دمج Draft DOCS-ARCHIVE-2.
اقرأ CLAUDE.md وHANDOFF وproject-status وDOCS_ARCHIVE_2_REPORT، وثبت main/HEAD والشجرة.
حافظ على ملفات الإحالة الأربعة، ومراجعات الهاتف/الطب والبنود الجزئية، وتجميد الفحوص والصور وتأجيل البرمجة.
لا تعِد تنفيذ برومبتات الأرشيف أو اعتماد التصميم؛ اختر هدفًا وميزانية صريحين من طلب المالك.
```
