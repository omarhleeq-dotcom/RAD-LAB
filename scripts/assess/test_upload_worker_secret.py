"""Synthetic-only secret uploader tests. Never call gcloud or access a provider."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("uploader", Path(__file__).with_name("upload-worker-secret.py"))
uploader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(uploader)

CA = '-----BEGIN CERTIFICATE-----\nMIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL\nBQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l\ndyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh\nc2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow\nazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD\nYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug\nUm9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW\nQyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q\nDmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2\nGtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi\ncvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4\nO4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt\nNaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX\nuXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt\naUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU\ntVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b\nVW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6\njB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx\nCea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2\nCMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P\no/bKiIz+Fq8=\n-----END CERTIFICATE-----\n'

PASSWORD = "synthetic-only-credential-" + "X" * 40
VERSION = b"projects/124842667755/secrets/assess-worker-config/versions/1\n"


class UploaderTest(unittest.TestCase):
    def run_main(self, responses, prompts=None, arguments=None):
        output = io.StringIO()
        with patch.object(Path, "read_text", return_value=CA), \
             patch.object(uploader.subprocess, "run", side_effect=responses) as run, \
             patch.object(uploader.getpass, "getpass", side_effect=prompts or [PASSWORD, PASSWORD]) as prompt, \
             contextlib.redirect_stdout(output):
            code = uploader.main([] if arguments is None else arguments)
        return code, output.getvalue(), run, prompt

    @staticmethod
    def response(stdout=b"[]", stderr=b"", code=0):
        return subprocess.CompletedProcess([], code, stdout, stderr)

    def test_payload_matches_runtime_shape_and_escapes_without_admin_fallback(self):
        password = PASSWORD + '\"\\'
        data = uploader.payload(password, CA)
        document = json.loads(data)
        self.assertEqual(set(document), {"host", "port", "database", "user", "password", "ca", "sessionPoolerProjectRef"})
        self.assertEqual(document["password"], password)
        self.assertEqual(document["user"], "assess_job_a")
        self.assertEqual(document["port"], 5432)
        self.assertLessEqual(len(data), 65536)
        self.assertEqual(document["ca"], CA)

    def test_bad_ca_and_invalid_passwords_stop(self):
        for ca in ["", "not a certificate", CA.replace("MIID", "MIIC", 1)]:
            with self.assertRaises(uploader.Stop):
                uploader.payload(PASSWORD, ca)
        for password in ["short", "X" * 129, "X" * 40 + "\n", "X" * 40 + "é"]:
            with self.assertRaises(uploader.Stop):
                uploader.payload(password, CA)

    def test_only_stdin_contains_payload_and_logs_are_disabled(self):
        code, output, run, _ = self.run_main([self.response(), self.response(VERSION)])
        self.assertEqual(code, 0)
        self.assertIn("PASS: projects/124842667755/", output)
        self.assertNotIn(PASSWORD, output)
        calls = run.call_args_list
        self.assertEqual(len(calls), 2)
        self.assertIn("--limit=1", calls[0].args[0])
        self.assertIsNone(calls[0].kwargs["input"])
        upload = calls[1]
        self.assertIn("--data-file=-", upload.args[0])
        self.assertIn("--project=" + uploader.PROJECT, upload.args[0])
        self.assertIn("--no-log-http", upload.args[0])
        self.assertNotIn(PASSWORD, repr(upload.args))
        self.assertEqual(upload.kwargs["env"]["CLOUDSDK_CORE_LOG_HTTP"], "false")
        self.assertNotIn(PASSWORD, repr(upload.kwargs["env"]))
        self.assertEqual(json.loads(upload.kwargs["input"])["password"], PASSWORD)
        self.assertEqual(upload.kwargs["stderr"], subprocess.PIPE)

    def test_existing_version_stops_before_prompt_or_write(self):
        code, output, run, prompt = self.run_main([self.response(b'[{"name":"already-present"}]')])
        self.assertEqual(code, 1)
        self.assertIn("existing_versions", output)
        prompt.assert_not_called()
        self.assertEqual(run.call_count, 1)

    def test_confirmation_mismatch_does_not_write(self):
        code, output, run, _ = self.run_main([self.response()], [PASSWORD, PASSWORD + "other"])
        self.assertEqual(code, 1)
        self.assertIn("confirmation_mismatch", output)
        self.assertEqual(run.call_count, 1)
        self.assertNotIn(PASSWORD, output)

    def test_raw_provider_failures_and_timeouts_never_print_credentials(self):
        failures = [self.response(PASSWORD.encode(), PASSWORD.encode(), 1),
                    subprocess.TimeoutExpired([PASSWORD], 60, output=PASSWORD.encode())]
        for failure in failures:
            code, output, run, _ = self.run_main([self.response(), failure])
            self.assertEqual(code, 1)
            self.assertNotIn(PASSWORD, output)
            self.assertIn("uncertain_do_not_retry", output)
            self.assertEqual(run.call_count, 2)

    def test_echo_fallback_and_arguments_are_rejected(self):
        def fallback_warning(*_args):
            uploader.warnings.warn(PASSWORD, uploader.getpass.GetPassWarning)
            self.fail("echo fallback must stop before input")
        code, output, run, _ = self.run_main([self.response()], fallback_warning)
        self.assertEqual(code, 1)
        self.assertNotIn(PASSWORD, output)
        self.assertEqual(run.call_count, 1)
        code, output, run, prompt = self.run_main([], arguments=[PASSWORD])
        self.assertEqual(code, 1)
        self.assertNotIn(PASSWORD, output)
        run.assert_not_called()
        prompt.assert_not_called()

    def test_unexpected_upload_result_requires_reconciliation_not_retry(self):
        for result in [b"projects/124842667755/secrets/assess-worker-config/versions/2", PASSWORD.encode()]:
            code, output, run, _ = self.run_main([self.response(), self.response(result)])
            self.assertEqual(code, 1)
            self.assertNotIn(PASSWORD, output)
            self.assertIn("metadata_unexpected_do_not_retry", output)
            self.assertEqual(run.call_count, 2)


if __name__ == "__main__":
    unittest.main()
