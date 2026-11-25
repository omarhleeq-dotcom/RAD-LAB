"""RAD-085 W2/W3 credential transport for the grading slot assess_job_b. Owner laptop only.

Usage (after a separate written permission; see docs/ASSESS_GATE_W_PACKAGES.md):
  set -o pipefail
  python3 -I scripts/assess/rotate-grading-credential.py --valid-days N | owner_sql -f -

The password is generated in memory and never printed, prompted, passed in argv/env or
written to a file. Its plaintext goes ONLY to a NEW numeric Secret Manager version via
gcloud stdin; that version is DISABLED immediately (step 4.2 enables it). The database
receives only a locally computed SCRAM-SHA-256 verifier, on stdout, which must be a pipe
into owner_sql. The slot stays NOLOGIN; step 4.3 (assess-grading-worker-login.sql) enables it.
No retry: any failure after a provider call is UNKNOWN and needs a metadata read.
"""
import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
import re
import secrets
import ssl
import string
import subprocess
import sys

PROJECT = "project-bff9124a-ec31-4d57-bc0"
SECRET = "assess-worker-config"
SLOT = "assess_job_b"
# FREE plan direct host. Reachability from the Job is W5 (decision needed), not proven here.
DIRECT_HOST = "db.vlacestfruxooznrcjqc.supabase.co"
ROOT_SHA256 = "807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa"
ITERATIONS = 4096
ALPHABET = string.ascii_letters + string.digits
VERSION = re.compile(
    r"projects/(124842667755|project-bff9124a-ec31-4d57-bc0)/secrets/assess-worker-config/versions/([1-9][0-9]{0,5})"
)
VERIFIER = re.compile(r"SCRAM-SHA-256\$4096:[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/]{43}=:[A-Za-z0-9+/]{43}=")


class Stop(Exception):
    """A fixed, non-sensitive result code; never wrap raw provider exceptions."""


def gcloud(*arguments, data=None):
    command = ["gcloud", "--project=" + PROJECT, "--quiet", "--no-log-http",
               "--verbosity=error", *arguments]
    environment = os.environ.copy()
    environment["CLOUDSDK_CORE_LOG_HTTP"] = "false"
    try:
        result = subprocess.run(command, input=data, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, env=environment, timeout=60)
    except Exception:
        raise Stop("command_failed_or_outcome_uncertain_do_not_retry") from None
    if result.returncode:
        raise Stop("command_failed_or_outcome_uncertain_do_not_retry")
    return result.stdout


def validate_ca(ca):
    try:
        digest = hashlib.sha256(ssl.PEM_cert_to_DER_cert(ca)).hexdigest()
    except Exception:
        raise Stop("invalid_ca") from None
    if digest != ROOT_SHA256:
        raise Stop("ca_mismatch")


def scram_keys(password, salt, iterations):
    salted = hashlib.pbkdf2_hmac("sha256", password, salt, iterations)
    client_key = hmac.new(salted, b"Client Key", hashlib.sha256).digest()
    return client_key, hashlib.sha256(client_key).digest(), hmac.new(salted, b"Server Key", hashlib.sha256).digest()


def scram_verifier(password, salt, iterations=ITERATIONS):
    """RFC 5802/7677 stored form, identical to PostgreSQL's pg_authid encoding."""
    if not re.fullmatch(r"[A-Za-z0-9]{32,128}", password) or len(salt) != 16 or iterations != ITERATIONS:
        raise Stop("verifier_input_invalid")  # ASCII alphanumerics: SASLprep is the identity.
    _, stored_key, server_key = scram_keys(password.encode("ascii"), salt, iterations)
    encode = lambda value: base64.b64encode(value).decode("ascii")
    return "SCRAM-SHA-256$%d:%s$%s:%s" % (iterations, encode(salt), encode(stored_key), encode(server_key))


def payload(password, ca):
    validate_ca(ca)
    document = {"host": DIRECT_HOST, "port": 5432, "database": "postgres", "user": SLOT,
                "password": password, "ca": ca}
    data = json.dumps(document, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    if len(data) > 65536:
        raise Stop("payload_too_large")
    return data


def activation_sql(verifier, valid_until):
    if not VERIFIER.fullmatch(verifier) or not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", valid_until):
        raise Stop("activation_sql_invalid")
    return f"""begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-grading-worker/1',0));
do $guard$
begin
 if current_user<>'postgres'
   or (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled)
   or not exists(select 1 from pg_catalog.pg_roles r where r.rolname='{SLOT}' and not r.rolcanlogin
     and pg_catalog.shobj_description(r.oid,'pg_authid')='radlab-assess-grading-slot/1 database='||pg_catalog.current_database())
   or (select count(*) from pg_catalog.pg_auth_members m where m.member='{SLOT}'::regrole)<>1
   or not exists(select 1 from pg_catalog.pg_auth_members m where m.member='{SLOT}'::regrole
     and m.roleid='assess_grading_worker'::regrole and m.set_option and not m.inherit_option and not m.admin_option)
   or exists(select 1 from pg_catalog.pg_stat_activity where usename='{SLOT}') then
  raise exception 'W2 transport precondition failed: STOP, no change' using errcode='55000';
 end if;
end
$guard$;
alter role {SLOT} nologin password '{verifier}' valid until '{valid_until}';
select 'assess-grading-credential/1' as contract,
 exists(select 1 from pg_catalog.pg_roles where rolname='{SLOT}' and not rolcanlogin
  and rolvaliduntil>now()+interval '1 hour' and rolvaliduntil<=now()+interval '90 days') as credential_window,
 exists(select 1 from pg_catalog.pg_roles where rolname='{SLOT}' and rolcanlogin) as slot_login;
commit;
"""


def parse(arguments):
    if len(arguments) != 2 or arguments[0] != "--valid-days" or not re.fullmatch(r"[1-9][0-9]?", arguments[1]):
        raise Stop("usage_valid_days_1_to_90")
    days = int(arguments[1])
    if days > 90:
        raise Stop("usage_valid_days_1_to_90")
    return days


def main(arguments=None, stdout=None, stderr=None, now=None):
    stdout = stdout or sys.stdout
    stderr = stderr or sys.stderr
    try:
        days = parse(sys.argv[1:] if arguments is None else arguments)
        if stdout.isatty():
            raise Stop("stdout_must_be_piped_to_owner_sql")
        ca = (Path.home() / "assess-ca" / "prod-ca-2021.crt").read_text(encoding="ascii")
        validate_ca(ca)
        listed = json.loads(gcloud("secrets", "versions", "list", SECRET, "--limit=100",
                                   "--format=json(name,state)"))
        if not isinstance(listed, list) or len(listed) >= 100:
            raise Stop("version_metadata_unexpected")
        highest = 0
        for item in listed:
            match = VERSION.fullmatch(str(item.get("name", ""))) if isinstance(item, dict) else None
            if not match:
                raise Stop("version_metadata_unexpected")
            if item.get("state") not in ("DISABLED", "DESTROYED"):
                raise Stop("enabled_version_present_disable_it_first")
            highest = max(highest, int(match.group(2)))
        password = "".join(secrets.choice(ALPHABET) for _ in range(48))
        verifier = scram_verifier(password, secrets.token_bytes(16))
        valid_until = ((now or datetime.now(timezone.utc)) + timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
        sql = activation_sql(verifier, valid_until)
        data = payload(password, ca)
        password = None
        name = gcloud("secrets", "versions", "add", SECRET, "--data-file=-",
                      "--format=value(name)", data=data).decode("ascii").strip()
        data = None
        match = VERSION.fullmatch(name)
        if not match or int(match.group(2)) <= highest:
            raise Stop("upload_metadata_unexpected_disable_new_version_do_not_retry")
        number = match.group(2)
        gcloud("secrets", "versions", "disable", number, "--secret=" + SECRET, "--format=value(name)")
        state = gcloud("secrets", "versions", "describe", number, "--secret=" + SECRET,
                       "--format=value(state)").decode("ascii").strip()
        if state != "DISABLED":
            raise Stop("new_version_not_disabled_disable_it_now_no_sql_sent")
        stdout.write(sql)
        stdout.flush()
        stderr.write("PASS: secret version %s added and DISABLED; verifier SQL piped; valid until %s\n" % (number, valid_until))
        stderr.write("Record version %s. LOGIN stays off until step 4.3.\n" % number)
        return 0
    except Stop as error:
        stderr.write("STOP: " + str(error) + "\n")
    except (Exception, KeyboardInterrupt):
        stderr.write("STOP: local_input_or_command_failure_do_not_retry\n")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
