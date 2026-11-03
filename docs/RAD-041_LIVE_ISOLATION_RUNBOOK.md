# RAD-041 — فحوص العزل الحية بحسابين تجريبيين

دليل لتشغيل المالك لاحقًا لجدول [§9](PILOT_SUPABASE_SETUP.md#9-فحوص-يدوية-على-المشروع-الحي-قبل-أول-مشارك) وفق القرار D5 (2026-11-03): حسابان تجريبيان، لا بيانات حقيقية. **لم يُشغَّل أي فحص حي عند كتابة هذا الدليل.** الأداة: `scripts/ops/rad041-live-isolation.mjs`؛ تستخدم العنوان العام والمفتاح العام (`sb_publishable_…`) فقط، ولا تغيّر حالة أي حساب، وتطبع لكل فحص سطرًا واحدًا PASS أو FAIL أو UNKNOWN ثم المجموع، دون بريد أو كلمة مرور أو رمز دخول أو معرّف أو محتوى صف. انقطاع الشبكة أو انتهاء المهلة = UNKNOWN، لا PASS أبدًا.

## 0. متى تشغّله

شغّله **فقط بعد** دمج طلب ترقية RAD-059/RAD-085 وتحديث الـVariable وفق [دليل النافذة](RAD-085_FIXES_LAPTOP_RUNBOOK.md). قبل ذلك: STOP، لا تشغّل شيئًا.

## 1. الحسابان (مرة واحدة)

- **A**: حساب جديد تمامًا تنشئه من صفحة إنشاء الحساب في الموقع ببريد تملكه، ثم تؤكد بريده. يجب أن يبقى «بانتظار الموافقة» قبل المرحلة الأولى. صفحة المالك لا تعيد حسابًا إلى الانتظار، لذا يلزم حساب A جديد لكل تشغيل كامل.
- **B**: حساب تجريبي ثانٍ (جديد أو قديم) حالته «بانتظار الموافقة» أو «موافق عليه»، وليس موقوفًا وليس حساب المالك.
- لا تستخدم حساب المالك ولا حساب أي مشارك حقيقي. سجّل خروج A وB من الموقع في كل المتصفحات أثناء الفحوص (نبضة المتصفح تفسد فحص 3).

## 2. التحضير على اللابتوب (WSL Ubuntu)

```bash
cd ~/RAD-LAB && git switch main && git pull --ff-only
```

توقع سطرًا ينتهي بـ`Already up to date` أو قائمة ملفات. STOP عند أي خطأ.

```bash
mkdir -p ~/.rad041 && chmod 700 ~/.rad041 && (umask 077; nano ~/.rad041/accounts.json) && chmod 600 ~/.rad041/accounts.json
```

اكتب في المحرر هذا الشكل فقط ببيانات الحسابين التجريبيين، ثم احفظ (Ctrl+O، Enter، Ctrl+X):

```json
{"A":{"email":"…","password":"…"},"B":{"email":"…","password":"…"}}
```

ثم ضع القيمتين **العامتين** من GitHub (Settings → Secrets and variables → Actions → Variables). لا تضع أبدًا `sb_secret_…` أو مفتاح service role؛ الأداة ترفضهما.

```bash
export NEXT_PUBLIC_SUPABASE_URL='https://<مرجع-المشروع>.supabase.co'
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_…'
export RAD041_ACCOUNTS_FILE=~/.rad041/accounts.json
```

## 3. المراحل الثلاث بالترتيب

في كل مرحلة: اضبط الحالات أولًا من صفحة المالك (`/ar/owner`: «موافقة» أو «إيقاف»)، ثم شغّل الأمر نفسه واكتب اسم المرحلة عند السؤال:

```bash
cd ~/RAD-LAB && node --dns-result-order=ipv4first scripts/ops/rad041-live-isolation.mjs
```

| المرحلة | اضبط قبلها | تكتب | الفحوص | ما تكتبه الأداة |
|---|---|---|---|---|
| 1 | A بانتظار الموافقة | `pending` | 1، 2 | لا شيء متوقع |
| 2 | وافق على A؛ B بانتظار الموافقة أو موافق | `approved` | 1، 3، 4، 5 (A يقرأ صفوف B) | نبضة `heartbeat` واحدة لـA |
| 3 | أوقف A؛ B كما هو | `suspended` | 1، 6، 5 (B يقرأ صفوف A) | لا شيء متوقع |

الناتج المتوقع لكل مرحلة (مثال المرحلة 2):

```text
RAD-041 live isolation - phase approved
1 anon request to profiles is denied: PASS
3 approved account inserts exactly one own heartbeat: PASS
4 event with the other account's user_id is denied: PASS
5 other account's profile/events/attempts return zero rows: PASS
7 restore: NOT RUN - see RAD-086 evidence
TOTAL 4 checks: PASS 4 FAIL 0 UNKNOWN 0
```

الفحص 7 (الاستعادة) لا يُنفَّذ هنا؛ دليله [شواهد RAD-086](RAD-086_REPORT_2026-10-31.md#owner-evidence-2026-10-31).

## 4. قواعد التوقف

- **FAIL في أي سطر:** STOP فورًا. لا تنتقل للمرحلة التالية، ولا تدعُ أي مشارك، ولا تحذف شيئًا. قد يكون صف تجريبي كُتب؛ انسخ الأسطر المطبوعة كما هي إلى الجلسة التالية.
- **`STOP:` في أول سطر:** إعداد ناقص (متغير، ملف غير 600، ملف غير صالح). أصلح المذكور فقط وأعد.
- **UNKNOWN بسبب `state: …`:** الحالة في صفحة المالك لا تطابق المرحلة؛ اضبطها وأعد المرحلة نفسها.
- **UNKNOWN بسبب `network/timeout` أو `HTTP …`:** أعد المرحلة نفسها مرة واحدة فقط؛ إن تكرر: STOP وانسخ الأسطر.
- **`not a synthetic participant` أو `same account`:** STOP؛ ملف الحسابات يشير إلى حساب خاطئ.
- لا تعِد المرحلة 2 أكثر من مرة إلا لسبب أعلاه؛ كل تشغيل لها يكتب نبضة واحدة.

## 5. بعد الانتهاء

```bash
rm ~/.rad041/accounts.json && unset RAD041_ACCOUNTS_FILE
```

اترك A موقوفًا، ولا تحذف أي حساب دون قرار. أرسل أسطر المراحل الثلاث (لا تحتوي أسرارًا) إلى الجلسة التالية لتسجيل إغلاق RAD-041؛ هذا الدليل لا يغيّر الحالة.
