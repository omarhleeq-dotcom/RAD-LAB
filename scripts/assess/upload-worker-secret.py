"""First-version Cloud Shell uploader; no DB access, activation, secret file or CLI password."""
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import ssl
import subprocess
import sys
import warnings

PROJECT = "project-bff9124a-ec31-4d57-bc0"
SECRET = "assess-worker-config"
ROOT_SHA256 = "807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa"
VERSION_ONE = re.compile(
    r"projects/(124842667755|project-bff9124a-ec31-4d57-bc0)/secrets/assess-worker-config/versions/1"
)


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


def payload(password, ca):
    validate_ca(ca)
    if not 32 <= len(password) <= 128 or any(not 33 <= ord(c) <= 126 for c in password):
        raise Stop("worker_password_requires_32_to_128_visible_ascii_characters")
    document = {"host": "aws-1-eu-central-1.pooler.supabase.com", "port": 5432,
                "database": "postgres", "user": "assess_job_a", "password": password,
                "ca": ca, "sessionPoolerProjectRef": "vlacestfruxooznrcjqc"}
    data = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(data) > 65536:
        raise Stop("payload_too_large")
    return data


def main(arguments=None):
    try:
        if (sys.argv[1:] if arguments is None else arguments):
            raise Stop("no_arguments_allowed")
        ca = (Path.home() / "assess-ca" / "prod-ca-2021.crt").read_text(encoding="ascii")
        validate_ca(ca)
        versions = json.loads(gcloud("secrets", "versions", "list", SECRET,
                                     "--limit=1", "--format=json(name)"))
        if versions != []:
            raise Stop("existing_versions_do_not_upload_again")
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            password = getpass.getpass("Worker password (assess_job_a), NOT postgres: ")
            if password != getpass.getpass("Repeat worker password: "):
                raise Stop("password_confirmation_mismatch")
        data = payload(password, ca)
        name = gcloud("secrets", "versions", "add", SECRET, "--data-file=-",
                      "--format=value(name)", data=data).decode("ascii").strip()
        if not VERSION_ONE.fullmatch(name):
            raise Stop("upload_metadata_unexpected_do_not_retry")
        print("PASS: " + name)
        print("No DB activation, Job update or execution performed.")
        return 0
    except Stop as error:
        print("STOP: " + str(error))
    except (Exception, KeyboardInterrupt):
        print("STOP: local_input_or_command_failure_do_not_retry")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
