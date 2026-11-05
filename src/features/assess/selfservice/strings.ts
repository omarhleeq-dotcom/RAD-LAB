/** RAD-105 P2: EN/AR strings for the dormant self-service screens (passed as props; no change to the shared message files until P7). */
export type SelfServiceStrings = Record<'title' | 'opens' | 'closes' | 'latestStart' | 'schedule' | 'saving' | 'saved' | 'timezone' | 'invalid' | 'order' | 'cap' | 'past' | 'failed'
 | 'statusTitle' | 'notStarted' | 'inProgress' | 'submitted' | 'graded' | 'missed'
 | 'empty' | 'upcoming' | 'open' | 'start' | 'resume' | 'submittedBody' | 'gradedBody' | 'historyLink' | 'missedBody' | 'cancelledBody' | 'unavailableBody', string>;
export const selfServiceStrings: Record<'en' | 'ar', SelfServiceStrings> = {
 en: {
  title: 'Schedule this exam', opens: 'Opens', closes: 'Closes', latestStart: 'Latest start for a full-length attempt', schedule: 'Save schedule', saving: 'Saving…', saved: 'Schedule saved.',
  timezone: 'Times are in Amman time.', invalid: 'Enter both times.', order: 'Closing must be after opening.', cap: 'An exam window can be at most 7 days.', past: 'The window cannot start in the past.',
  failed: 'The schedule was not saved. Reload and try again.', statusTitle: 'Live status', notStarted: 'Not started', inProgress: 'In progress', submitted: 'Submitted', graded: 'Graded', missed: 'Missed',
  empty: 'No exams are scheduled for you.', upcoming: 'Opens {time}', open: 'Open until {time}', start: 'Start', resume: 'Resume', submittedBody: 'Submitted. Your result will appear in your assessment history.',
  gradedBody: 'Your result is in your assessment history.', historyLink: 'Assessment history / سجل التقييم', missedBody: 'This exam ended and you did not start it.', cancelledBody: 'This exam was cancelled.', unavailableBody: 'This exam is not scheduled yet.',
 },
 ar: {
  title: 'جدولة هذا الامتحان', opens: 'يفتح', closes: 'يُغلق', latestStart: 'آخر وقت للبدء بمحاولة كاملة المدة', schedule: 'حفظ الجدول', saving: 'جارٍ الحفظ…', saved: 'حُفظ الجدول.',
  timezone: 'الأوقات بتوقيت عمّان.', invalid: 'أدخل الوقتين.', order: 'يجب أن يكون الإغلاق بعد الفتح.', cap: 'أقصى مدة لنافذة الامتحان 7 أيام.', past: 'لا يمكن أن تبدأ النافذة في الماضي.',
  failed: 'لم يُحفظ الجدول. أعد تحميل الصفحة وحاول مجددًا.', statusTitle: 'الحالة المباشرة', notStarted: 'لم يبدأ', inProgress: 'قيد التنفيذ', submitted: 'سُلِّم', graded: 'صُحِّح', missed: 'فات',
  empty: 'لا توجد امتحانات مجدولة لك.', upcoming: 'يفتح {time}', open: 'مفتوح حتى {time}', start: 'ابدأ', resume: 'تابع', submittedBody: 'تم التسليم. ستظهر نتيجتك في سجل التقييم.',
  gradedBody: 'نتيجتك في سجل التقييم.', historyLink: 'سجل التقييم / Assessment history', missedBody: 'انتهى هذا الامتحان ولم تبدأه.', cancelledBody: 'أُلغي هذا الامتحان.', unavailableBody: 'لم يُجدول هذا الامتحان بعد.',
 },
};
