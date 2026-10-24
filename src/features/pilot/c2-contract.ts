// RAD-069 C2 closed additive inventory, published before editing the guards.
export const C2_MIGRATION = "20261024000200_owner_deletion_surveys.sql";
export const C2_CHECK = "supabase/checks/owner-deletion-surveys-ready.sql";
export const C2_TABLE_COLUMNS = {
  "c2_account_deletions": [
    "user_id",
    "requested_at",
    "restore_status",
    "previous_banned_until"
  ],
  "c2_survey_settings": [
    "singleton",
    "activated_at",
    "gap_days"
  ],
  "c2_survey_versions": [
    "id",
    "survey_type",
    "version",
    "definition"
  ],
  "c2_survey_rounds": [
    "id",
    "version_id",
    "opened_at",
    "closed_at"
  ],
  "c2_survey_responses": [
    "id",
    "user_id",
    "round_id",
    "offered_at",
    "answered_at",
    "state",
    "answers",
    "score"
  ]
} as const;
export const C2_CONSTRAINTS = [
  "c2_account_deletions.c2_account_deletions_pkey",
  "c2_account_deletions.c2_account_deletions_user_id_fkey",
  "c2_account_deletions.c2_account_deletions_restore_status_check",
  "c2_account_deletions.c2_account_deletions_requested_at_check",
  "c2_survey_settings.c2_survey_settings_pkey",
  "c2_survey_settings.c2_survey_settings_singleton_check",
  "c2_survey_settings.c2_survey_settings_gap_days_check",
  "c2_survey_versions.c2_survey_versions_pkey",
  "c2_survey_versions.c2_survey_versions_type_version_key",
  "c2_survey_versions.c2_survey_versions_survey_type_check",
  "c2_survey_versions.c2_survey_versions_version_check",
  "c2_survey_versions.c2_survey_versions_definition_check",
  "c2_survey_rounds.c2_survey_rounds_pkey",
  "c2_survey_rounds.c2_survey_rounds_version_id_fkey",
  "c2_survey_rounds.c2_survey_rounds_dates_check",
  "c2_survey_responses.c2_survey_responses_pkey",
  "c2_survey_responses.c2_survey_responses_user_id_fkey",
  "c2_survey_responses.c2_survey_responses_round_id_fkey",
  "c2_survey_responses.c2_survey_responses_user_round_key",
  "c2_survey_responses.c2_survey_responses_state_check",
  "c2_survey_responses.c2_survey_responses_answers_check",
  "c2_survey_responses.c2_survey_responses_score_check",
  "c2_survey_responses.c2_survey_responses_dates_check",
  "c2_account_deletions.c2_account_deletions_user_id_not_null",
  "c2_account_deletions.c2_account_deletions_requested_at_not_null",
  "c2_account_deletions.c2_account_deletions_restore_status_not_null",
  "c2_account_deletions.c2_account_deletions_previous_banned_until_not_null",
  "c2_survey_settings.c2_survey_settings_singleton_not_null",
  "c2_survey_settings.c2_survey_settings_activated_at_not_null",
  "c2_survey_settings.c2_survey_settings_gap_days_not_null",
  "c2_survey_versions.c2_survey_versions_id_not_null",
  "c2_survey_versions.c2_survey_versions_survey_type_not_null",
  "c2_survey_versions.c2_survey_versions_version_not_null",
  "c2_survey_versions.c2_survey_versions_definition_not_null",
  "c2_survey_rounds.c2_survey_rounds_id_not_null",
  "c2_survey_rounds.c2_survey_rounds_version_id_not_null",
  "c2_survey_rounds.c2_survey_rounds_opened_at_not_null",
  "c2_survey_rounds.c2_survey_rounds_closed_at_not_null",
  "c2_survey_responses.c2_survey_responses_id_not_null",
  "c2_survey_responses.c2_survey_responses_user_id_not_null",
  "c2_survey_responses.c2_survey_responses_round_id_not_null",
  "c2_survey_responses.c2_survey_responses_offered_at_not_null",
  "c2_survey_responses.c2_survey_responses_answered_at_not_null",
  "c2_survey_responses.c2_survey_responses_state_not_null",
  "c2_survey_responses.c2_survey_responses_answers_not_null",
  "c2_survey_responses.c2_survey_responses_score_not_null"
] as const;
export const C2_INDEXES = [
  "c2_account_deletions_pkey",
  "c2_survey_settings_pkey",
  "c2_survey_versions_pkey",
  "c2_survey_rounds_pkey",
  "c2_survey_responses_pkey",
  "c2_survey_versions_type_version_key",
  "c2_survey_responses_user_round_key",
  "c2_account_deletions_expiry_idx",
  "c2_survey_responses_pending_idx",
  "c2_survey_responses_user_offered_idx"
] as const;
export const C2_FUNCTIONS = [
  "owner_account_deletion_v1",
  "owner_account_directory_v1",
  "owner_surveys_v1",
  "participant_survey_v1"
] as const;
