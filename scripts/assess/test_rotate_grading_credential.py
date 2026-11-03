"""Synthetic-only tests for the W2/W3 transport. A fake gcloud records calls; no provider access."""
import base64
from datetime import datetime, timezone
import hashlib
import hmac
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("rotate", Path(__file__).with_name("rotate-grading-credential.py"))
rotate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rotate)
uploader_spec = importlib.util.spec_from_file_location("uploader", Path(__file__).with_name("test_upload_worker_secret.py"))
uploader_tests = importlib.util.module_from_spec(uploader_spec)
uploader_spec.loader.exec_module(uploader_tests)
CA = uploader_tests.CA
NAME = "projects/124842667755/secrets/assess-worker-config/versions/%d"
NOW = datetime(2026, 11, 4, 8, 0, 0, tzinfo=timezone.utc)


class Pipe(io.StringIO):
    def __init__(self, tty=False):
        super().__init__()
        self.tty = tty

    def isatty(self):
        return self.tty


class FakeSecretSink:
    """Plays gcloud: versions list/add/disable/describe. Stores added payloads in memory only."""

    def __init__(self, listed=None, add_name=None, final_state="DISABLED", fail_at=None):
        self.listed = [{"name": NAME % 1, "state": "DISABLED"}] if listed is None else listed
        self.add_name = add_name or (NAME % 2).encode()
        self.final_state = final_state
        self.fail_at = fail_at
        self.calls = []
        self.payloads = []

    def __call__(self, command, **kwargs):
        self.calls.append((command, kwargs))
        verb = command[command.index("versions") + 1]
        if verb == self.fail_at:
            return subprocess.CompletedProcess(command, 1, b"", b"raw provider detail")
        if verb == "list":
            return subprocess.CompletedProcess(command, 0, json.dumps(self.listed).encode(), b"")
        if verb == "add":
            self.payloads.append(kwargs["input"])
            return subprocess.CompletedProcess(command, 0, self.add_name + b"\n", b"")
        if verb == "disable":
            return subprocess.CompletedProcess(command, 0, b"", b"")
        if verb == "describe":
            return subprocess.CompletedProcess(command, 0, self.final_state.encode() + b"\n", b"")
        raise AssertionError("unexpected gcloud verb")


class RotateTest(unittest.TestCase):
    def run_main(self, sink, arguments=("--valid-days", "30"), tty=False):
        out, err = Pipe(tty), io.StringIO()
        with patch.object(Path, "read_text", return_value=CA), \
             patch.object(rotate.subprocess, "run", side_effect=sink):
            code = rotate.main(list(arguments), out, err, NOW)
        return code, out.getvalue(), err.getvalue()

    def test_rfc7677_known_answer(self):
        salt = base64.b64decode("W22ZaJ0SNY7soEsUEjb6gQ==")
        client_key, stored_key, server_key = rotate.scram_keys(b"pencil", salt, 4096)
        auth = (b"n=user,r=rOprNGfwEbeRWgbNEkqO,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,"
                b"s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096,c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0")
        signature = hmac.new(stored_key, auth, hashlib.sha256).digest()
        proof = bytes(a ^ b for a, b in zip(client_key, signature))
        self.assertEqual(base64.b64encode(proof), b"dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=")
        self.assertEqual(base64.b64encode(hmac.new(server_key, auth, hashlib.sha256).digest()),
                         b"6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=")

    def test_success_plaintext_only_in_sink_and_new_version_disabled(self):
        sink = FakeSecretSink()
        code, out, err = self.run_main(sink)
        self.assertEqual(code, 0)
        self.assertEqual(len(sink.payloads), 1)
        document = json.loads(sink.payloads[0])
        self.assertEqual(set(document), {"host", "port", "database", "user", "password", "ca"})
        self.assertEqual((document["host"], document["port"], document["database"], document["user"]),
                         (rotate.DIRECT_HOST, 5432, "postgres", "assess_job_b"))
        password = document["password"]
        self.assertRegex(password, r"^[A-Za-z0-9]{48}$")
        self.assertNotIn(password, out)
        self.assertNotIn(password, err)
        for command, kwargs in sink.calls:
            self.assertNotIn(password, repr(command))
            self.assertNotIn(password, repr(kwargs.get("env")))
            self.assertIn("--no-log-http", command)
            self.assertEqual(kwargs["env"]["CLOUDSDK_CORE_LOG_HTTP"], "false")
            self.assertNotIn("latest", command)
        verbs = [c[c.index("versions") + 1] for c, _ in sink.calls]
        self.assertEqual(verbs, ["list", "add", "disable", "describe"])
        self.assertIn("--data-file=-", sink.calls[1][0])
        self.assertIn("2", sink.calls[2][0])
        self.assertNotIn("enable", " ".join(" ".join(c) for c, _ in sink.calls).replace("disable", ""))
        verifier = rotate.VERIFIER.search(out).group(0)
        salt = base64.b64decode(verifier.split("$")[1].split(":")[1])
        self.assertEqual(rotate.scram_verifier(password, salt), verifier)
        self.assertIn("alter role assess_job_b nologin password '", out)
        self.assertIn("valid until '2026-12-04T08:00:00Z'", out)
        self.assertNotIn(" login password", out.replace("nologin password", ""))
        self.assertIn("version 2 added and DISABLED", err)

    def test_tty_stdout_and_bad_arguments_stop_before_any_provider_call(self):
        for arguments, tty in [(("--valid-days", "30"), True), (("--valid-days", "91"), False),
                               (("--valid-days", "0"), False), ((), False), (("--valid-days", "30", "x"), False)]:
            sink = FakeSecretSink()
            code, out, err = self.run_main(sink, arguments, tty)
            self.assertEqual(code, 1)
            self.assertEqual(out, "")
            self.assertEqual(sink.calls, [])

    def test_enabled_or_unknown_versions_stop_before_generation(self):
        for listed in ([{"name": NAME % 1, "state": "ENABLED"}], [{"name": "other", "state": "DISABLED"}], {"x": 1}):
            sink = FakeSecretSink(listed=listed)
            code, out, err = self.run_main(sink)
            self.assertEqual(code, 1)
            self.assertEqual(out, "")
            self.assertEqual(sink.payloads, [])

    def test_no_sql_when_upload_or_disable_is_uncertain(self):
        cases = [FakeSecretSink(fail_at="add"), FakeSecretSink(add_name=(NAME % 1).encode()),
                 FakeSecretSink(fail_at="disable"), FakeSecretSink(final_state="ENABLED"),
                 FakeSecretSink(fail_at="describe")]
        for sink in cases:
            code, out, err = self.run_main(sink)
            self.assertEqual(code, 1)
            self.assertEqual(out, "", "no verifier may reach the database after an uncertain secret step")
            self.assertNotIn("raw provider detail", err)
            for payload in sink.payloads:
                self.assertNotIn(json.loads(payload)["password"], err)

    def test_activation_sql_refuses_malformed_material(self):
        with self.assertRaises(rotate.Stop):
            rotate.activation_sql("md5abc' ; drop role postgres; --", "2026-12-04T08:00:00Z")
        with self.assertRaises(rotate.Stop):
            rotate.activation_sql(rotate.scram_verifier("A" * 48, b"0" * 16), "now'")
        with self.assertRaises(rotate.Stop):
            rotate.scram_verifier("short", b"0" * 16)


if __name__ == "__main__":
    unittest.main()
