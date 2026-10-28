-- B8 backup: READ ONLY, one SELECT. Configuration only: UUID identities, flags and version labels.
-- No profiles, emails, candidate documents, answers or grades. Save encrypted with the B2 CSVs.
-- Run only when precheck reports trial_scope_present; compare count with 00-counts-before.sql.
select singleton, id, active, owner_id, student_id, outsider_id, assessment_id, version_labels
from assess.trial_scope
order by singleton;
