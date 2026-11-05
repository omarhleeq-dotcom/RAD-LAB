#!/usr/bin/env bash
# STAGED (RAD-105 P4). Idempotent Cloud Scheduler wiring for the grading Job. DRY-RUN by default: it prints the exact
# commands and runs nothing. It is executed only inside the P7 owner window (docs/ASSESS_P7_LAPTOP_RUNBOOK.md) with
# APPLY=1 and the owner's written window permission. It never creates secrets, never touches the database, and
# never grants a project-level role. Sources: Google "Execute jobs on a schedule" page (OAuth, :run URL, API name).
set -euo pipefail
set +x
: "${RAD_PROJECT:?set RAD_PROJECT}" "${RAD_REGION:?set RAD_REGION}" "${RAD_JOB:=assess-worker}"
SA_ID=assess-scheduler
SA="${SA_ID}@${RAD_PROJECT}.iam.gserviceaccount.com"
URI="https://run.googleapis.com/v2/projects/${RAD_PROJECT}/locations/${RAD_REGION}/jobs/${RAD_JOB}:run"
CRON='*/5 * * * *'
TICK=assess-worker-tick
if [[ "${APPLY:-0}" == 1 ]]; then
  [[ "${RAD_WINDOW_PERMISSION:-}" == "I-HAVE-THE-WRITTEN-WINDOW-PERMISSION" ]] || { echo "STOP: owner window permission missing" >&2; exit 2; }
fi
say() { echo "$*"; }
step() { # step <describe-cmd> <create-cmd> ; both are single gcloud command strings
  if [[ "${APPLY:-0}" == 1 ]]; then
    if eval "$1" >/dev/null 2>&1; then say "EXISTS: $2"; else say "CREATE: $2"; eval "$2"; fi
  else say "DRY ensure: $2"; fi
}
if [[ "${APPLY:-0}" == 1 ]]; then gcloud services enable cloudscheduler.googleapis.com --project="$RAD_PROJECT"; else say "DRY: gcloud services enable cloudscheduler.googleapis.com --project=$RAD_PROJECT"; fi
step "gcloud iam service-accounts describe $SA --project=$RAD_PROJECT" \
     "gcloud iam service-accounts create $SA_ID --project=$RAD_PROJECT --display-name='RAD-LAB grading scheduler (run this one Job only)'"
# Resource-level binding on the single Job (never a project-level role).
if [[ "${APPLY:-0}" == 1 ]]; then
  gcloud run jobs add-iam-policy-binding "$RAD_JOB" --region="$RAD_REGION" --project="$RAD_PROJECT" --member="serviceAccount:$SA" --role=roles/run.invoker
else say "DRY: gcloud run jobs add-iam-policy-binding $RAD_JOB --region=$RAD_REGION --project=$RAD_PROJECT --member=serviceAccount:$SA --role=roles/run.invoker"; fi
step "gcloud scheduler jobs describe $TICK --location=$RAD_REGION --project=$RAD_PROJECT" \
     "gcloud scheduler jobs create http $TICK --location=$RAD_REGION --project=$RAD_PROJECT --schedule='$CRON' --time-zone=Etc/UTC --uri=$URI --http-method=POST --oauth-service-account-email=$SA --attempt-deadline=60s --max-retry-attempts=0"
say "VERIFY (read-only): gcloud scheduler jobs describe $TICK --location=$RAD_REGION --project=$RAD_PROJECT --format='value(state,schedule,httpTarget.uri)'"
