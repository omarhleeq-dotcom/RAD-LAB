# RAD-050 — Owner-selected bilingual draft — 2026-10-16 (Asia/Amman)

**APPROVED FOR FINAL TECHNICAL REVIEW — NOT VERIFIED, NOT PUBLISHED, NOT APPLIED.** The owner supplied a revised bilingual draft after review with another person, then approved it with the three explicit amendments below by replying “100%”. The other reviewer is unnamed; this records the owner's report, not independent reviewer evidence or a legal opinion. Source: owner-pasted draft in this conversation plus subsequent answers. No participant records or credentials included.

This seventh documentation file is within the authorised ≤7-file budget: its purpose is to preserve a concrete bilingual text for technical review separately from the historical claim matrix. The other six files remain the review, next prompt, DECISIONS, HANDOFF, project-status and ROADMAP_SESSIONS.

Owner-approved amendments to the pasted draft: (1) remove the external-survey paragraph because no external method was selected and an internal survey is deferred; (2) retain only general non-identifying statistics/summaries for user-experience improvement or **scientific research** (matching AR); (3) prohibit account sharing and republishing training content while allowing sharing one's result screenshot or experience, retaining the prohibition on disruption. The rest, including the encrypted-password wording and pilot-version label, is retained as the owner requested. Line breaks/headings below are formatting, not further substantive amendments.

> **Verification update:** official Supabase documentation now confirms bcrypt hashing and explicitly distinguishes it from encryption. The selected password wording below is contradicted by that documented mechanism; [exact proposed correction and evidence](TERMS_REVIEW_2026-10-16.md) await approval. Brevo/account and live survey settings still await owner confirmation. Selected participant text below is unchanged.

## Latest approved password override — S-PILOT-34

Owner has now approved the simple account-service sentence after the technical explanation, for the next Terms PR. This **supersedes the encrypted-format sentence in the historical blocks below**, without changing published messages or the consent version now.

- Approved AR: «تتولى خدمة الحسابات حفظ كلمة مرورك والتحقق منها، ولا تظهر لصاحب المشروع.»
- Faithful EN rendering for the release: “The account service stores and verifies your password. Your password is not shown to the project owner.”

Use this override with the other approved amendments; do not apply the historical encrypted-format sentence or the unselected technical hash alternative. The owner then moves to erasure/summaries. Brevo screenshot proves Anonymous email tracking = No before change; owner intends Yes, but Save/reload remains unconfirmed.

## Technical review gates — outside the participant text

- **Password assertion remains TOO BROAD; documented mechanism VERIFIED and wording mismatch identified.** Official Supabase FAQ specifies bcrypt one-way hashing, not encryption; no live hash was inspected. The owner has subsequently approved the simple account-service alternative in S-PILOT-34 above. Preserve the old blocks as history; next implementation must use the approved override, not the contradicted term.
- **Email tracking:** owner chooses to disable open/click tracking if supported, then verify. No dashboard setting was inspected/changed. The generic research result pasted by the owner describes possible Brevo features, not this project's setting. This draft's omission of tracking detail does not establish tracking is off. Resolve before publication if tracking remains enabled/unknown; do not infer it from successful reset mail.
- **Survey:** no external tool selected, according to owner. Internal experience-evaluation/suggestions survey is planned but deferred behind important work, no questions or implementation accepted. Confirm the deployed external-link feature is not enabled before removing its disclosure; an enabled code-sending link would contradict that omission. No build setting was read/changed here.
- **Retention/deletion/aggregates:** owner commitment is recorded, not evidence of a working purge, anonymisation, summary exporter or deletion procedure. Account deletion currently cascades attempts/notes; prepare and review non-identifying aggregate summaries separately before deletion. No retention of linked individual rows or raw notes for research was approved. Confirm copy handling, completeness and provider-log limits before promising erasure; local CSV files need manual handling.
- **Backups:** owner reconfirms none exist because local setup has not been completed. Existing setup §8 runbook is future work, including auth coverage and restore rehearsal (O105), expiry and deletion replay. No backup/restore performed or recovery guarantee approved.
- **Usage restriction:** blanket republication text needs a check against the project's independently licensed materials. If clarification is necessary, bring exact wording back to the owner; their “100%” did not approve an unseen licence carve-out. Do not claim this paragraph changes third-party licence terms.
- **Audience/review/scope:** adult radiography students/graduates/practitioners in Jordan is an owner-approved pilot cohort, not an implemented automatic age/country check. Initiative is personal, not coordinated with a university/hospital; no conclusion that institutional approval is universally unnecessary. Owner requests “pilot version” after review; draft label remains in the live files until a technically consistent release. CONSENT_VERSION remains `2026-10-17`; one future coordinated bump, not per-paragraph releases.

The following Arabic and English blocks are the owner-selected text, **not a declaration that these gates have passed**. Their paragraph grouping differs from the existing `terms.*` key counts; the next code session must inspect the Terms page's section counts rather than leaving omitted paragraphs rendered or text unreachable.

## الشروط والخصوصية

إصدار المرحلة التجريبية. إذا تغيّر معنى هذه الشروط، سنطلب موافقتك عليها مجددًا.

RAD-LAB مساحة تدريب تعليمية لطلبة التصوير الإشعاعي والخريجين والممارسين. التجربة الحالية مخصّصة للمشاركين البالغين داخل الأردن، وهدفها تحسين تجربة التدريب.

### ما الذي نحفظه؟

- تنشئ حسابك باستخدام بريدك الإلكتروني وكلمة مرور تختارها بنفسك. وتُحفظ كلمة مرورك بصيغة مشفّرة لا يمكن لصاحب المشروع الاطلاع عليها.
- نحفظ تفاصيل محاولات التدريب ونتائجها وأوقاتها، وبعض بيانات استخدام الموقع والمعلومات التقنية، لمساعدتنا على تحسين تجربة التدريب.
- نحفظ أيضًا إصدار الشروط الذي وافقت عليه ووقت الموافقة.
- إذا اخترت إرسال ملاحظة، نحفظ نصها مع المحاولة المرتبطة بها. يمكن أن تصل الملاحظة إلى 1000 حرف. يرجى عدم كتابة اسمك أو معلومات التواصل أو أي بيانات عن أشخاص حقيقيين فيها.

### كيف نستخدم البيانات؟

- نستخدم البيانات لتشغيل الحسابات، والاستجابة لطلبات المشاركين، وفهم تجربة التدريب وتحسينها. لا نبيع بياناتك ولا نستخدمها للإعلانات.
- درجات التدريب لمساعدتك على التعلّم فقط، ولا تدخل في درجات الامتحانات أو أي تقييم أكاديمي.
- نستخدم بريدك الإلكتروني لإرسال رسائل تخص حسابك، مثل تأكيد البريد وإعادة تعيين كلمة المرور.

### من يستطيع الاطلاع عليها؟

- يستطيع صاحب المشروع الاطلاع على بيانات التجربة، وتنزيل المحاولات والملاحظات في ملفات منفصلة لتحليلها. يتضمن ملف الملاحظات النص كما كتبه المشارك.
- يرتبط حسابك برمز مشاركة يستطيع صاحب المشروع مطابقته ببريدك الإلكتروني عند الحاجة. ويسمح الموقع لكل مشارك بالاطلاع على بياناته هو.

### كيف نتعامل معها؟

- نستعين بمزوّدي خدمات لتشغيل الموقع، ونقيّد الوصول إلى البيانات بحسب الحساب وصلاحياته.

### كم نحتفظ بها؟

- يعلن صاحب المشروع انتهاء التجربة عبر الموقع أو البريد الإلكتروني بعد اكتمال المشاركات ومراجعتها.
- نحذف البيانات المرتبطة بالمشاركين خلال ستة أشهر من إعلان انتهاء التجربة، وقد نحتفظ بإحصاءات وملخّصات عامة لا تحدّد هوياتهم، لتحسين تجربة الاستخدام أو لأغراض البحث العلمي.

### الاطلاع على بياناتك أو حذفها

- يمكنك طلب الاطلاع على بياناتك أو حذفها بمراسلة: radlab.pilot@gmail.com
- إذا طلبت الحذف، نحذف حسابك والبيانات المرتبطة بك من قاعدة بيانات التجربة ومن ملفات التصدير التي تحت إدارتنا، دون انتظار انتهاء التجربة. وقد نحتاج إلى التحقق من أن الحساب يخصّك.
- يمكنك التوقف عن المشاركة متى شئت. التوقف وحده لا يحذف البيانات المحفوظة؛ يمكنك طلب حذفها عبر البريد.

### بيانات المرضى وضوابط الاستخدام

- لا تُدخل بيانات أو صور مرضى حقيقيين. RAD-LAB محاكٍ تعليمي تجريبي وليس للاستخدام السريري أو لاتخاذ قرارات طبية.
- حسابك للاستخدام الشخصي، ولا يُسمح بمشاركته مع الآخرين أو إعادة نشر المحتوى التدريبي. يمكنك مشاركة لقطة شاشة لنتيجتك أو الحديث عن تجربتك. ولا يُسمح بمحاولة تعطيل عمل الموقع.

### الموافقة

بتأشيرك على «أوافق»، تؤكد أنك قرأت هذه الصفحة وتوافق على المشاركة وفق ما توضّحه.

---

## Terms and Privacy

Pilot version. If the meaning of these terms changes, we will ask you to agree again.

RAD-LAB is an educational practice space for radiography students, graduates and practitioners. The current pilot is for adult participants in Jordan and aims to improve the practice experience.

### What do we keep?

- You create your account using your email address and a password you choose. Your password is stored in an encrypted format and cannot be viewed by the project owner.
- We keep details of your practice attempts, their results and times, and some website usage and technical information to help us improve the practice experience.
- We also record the version of the terms you accepted and when you accepted it.
- If you choose to submit a note, we keep its text with the linked attempt. A note can contain up to 1,000 characters. Please do not include your name, contact details or information about real people.

### How do we use the data?

- We use the data to operate accounts, respond to participant requests, and understand and improve the practice experience. We do not sell your data or use it for advertising.
- Practice scores help you learn. They do not count towards examination grades or any academic assessment.
- We use your email address to send account-related messages, such as email confirmation and password reset messages.

### Who can access it?

- The project owner can access pilot data and download attempts and notes in separate files for analysis. The notes file includes the text as submitted by the participant.
- Your account is linked to a participant code that the project owner can match to your email when needed. The website allows each participant to access their own data.

### How do we handle it?

- We use service providers to operate the website and restrict data access according to each account and its permissions.

### How long do we keep it?

- The project owner announces the end of the pilot via the website or email after participation and review are complete.
- We delete participant-linked data within six months of that announcement. We may retain general statistics and summaries that do not identify participants, to improve the user experience or for scientific research.

### Accessing or deleting your data

- You can request access to or deletion of your data by emailing: radlab.pilot@gmail.com
- If you request deletion, we delete your account and associated data from the pilot database and export files under our control, without waiting for the pilot to end. We may need to verify that the account belongs to you.
- You can stop participating whenever you wish. Stopping alone does not delete saved data; you can request deletion by email.

### Patient data and usage rules

- Never enter real patient data or images. RAD-LAB is an experimental educational simulator and is not for clinical use or medical decision-making.
- Your account is for personal use and must not be shared with others. Training content must not be republished. You may share a screenshot of your result or talk about your experience. You must not attempt to disrupt the operation of the website.

### Agreement

By ticking “I agree”, you confirm that you have read this page and agree to participate as described.
