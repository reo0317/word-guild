"""設定拒否の回帰検査。検査コマンド自体は実行しない。"""

import copy
import json
import unittest

from run_v4_checks import ROOT, validate_checks


class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.checks = json.loads((ROOT / "ATELIER_CHECKS.json").read_text(encoding="utf-8"))[
            "checks"
        ]

    def test_current_and_boundaries(self):
        self.assertEqual(len(validate_checks(self.checks)), 8)
        for timeout in (1, 300):
            checks = copy.deepcopy(self.checks)
            checks[-1]["timeout"] = timeout
            validate_checks(checks)

    def test_invalid_timeouts(self):
        for timeout in (0, -1, True, False, 300.0, "300", None, 301, 600):
            with self.subTest(timeout=timeout):
                checks = copy.deepcopy(self.checks)
                checks[-1]["timeout"] = timeout
                with self.assertRaises(ValueError):
                    validate_checks(checks)

    def test_invalid_commands_and_arguments(self):
        for argv in (
            [],
            ["python"],
            ["python", ""],
            ["python", 12],
            ["cmd", "/c", "echo"],
            ["npm", "install"],
            ["npm", "run"],
            ["python", "-c", "pass"],
            ["python", "../outside.py"],
            ["python", str(ROOT / "quality/run_v4_checks.py")],
            ["python", "quality/missing.py"],
            ["node", "--test", "quality/run_v4_checks.py"],
            ["python", "quality/run_v4_checks.py", "\x00"],
        ):
            with self.subTest(argv=argv):
                checks = copy.deepcopy(self.checks)
                checks[0]["argv"] = argv
                with self.assertRaises(ValueError):
                    validate_checks(checks)

    def test_invalid_registration_structure(self):
        for checks in (None, {}, [], self.checks + [self.checks[0]], [None], [{}]):
            with self.subTest(checks=checks):
                with self.assertRaises(ValueError):
                    validate_checks(checks)
        checks = copy.deepcopy(self.checks)
        checks[0]["name"] = " "
        with self.assertRaises(ValueError):
            validate_checks(checks)

    def test_allowed_npm_commands(self):
        for argv in (["npm", "test"], ["npm", "run", "build"]):
            checks = copy.deepcopy(self.checks)
            checks[0]["argv"] = argv
            validate_checks(checks)


if __name__ == "__main__":
    unittest.main()
