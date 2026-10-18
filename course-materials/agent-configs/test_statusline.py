"""Run the real status line against synthetic Claude Code stdin payloads.

Run with: python3 -m unittest discover -s course-materials/agent-configs -p 'test_*.py'
Set STATUSLINE_SCRIPT to check another copy of the script.
"""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest


SCRIPT = Path(os.environ.get("STATUSLINE_SCRIPT", Path(__file__).parent / "claude/statusline.sh")).resolve()
ANSI = re.compile(r"\x1b\[[0-9;]*m")


class StatuslineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cwd = Path(self.temp.name)
        self.payload = {
            "model": {"id": "claude-sonnet-example", "display_name": "Sonnet"},
            "workspace": {"current_dir": str(self.cwd)},
            "context_window": {"used_percentage": 25},
            "cost": {"total_cost_usd": 0.012},
            "rate_limits": {
                "five_hour": {"used_percentage": 12},
                "seven_day": {"used_percentage": 34},
            },
        }

    def render(self, payload=None, *, raw=None, env=None):
        result = subprocess.run(
            [shutil.which("bash"), str(SCRIPT)],
            input=raw if raw is not None else json.dumps(payload or self.payload),
            text=True, capture_output=True, cwd=self.cwd,
            env={**os.environ, **(env or {})}, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        plain = ANSI.sub("", result.stdout)
        self.assertEqual(len(plain.splitlines()), 2, plain)
        return result.stdout, plain

    def test_cache_fraction_is_rounded_to_percent(self):
        self.payload["prompt_cache"] = {"hit_ratio": 0.876}
        _, plain = self.render()
        self.assertIn("Cache: 88%", plain)
        self.assertIn("Sonnet", plain)
        self.assertIn("5h:12%", plain)
        self.assertIn("7d:34%", plain)

    def test_zero_and_full_cache_are_valid_values(self):
        for ratio, percent in [(0, 0), (1, 100)]:
            with self.subTest(ratio=ratio):
                self.payload["prompt_cache"] = {"hit_ratio": ratio}
                _, plain = self.render()
                self.assertIn(f"Cache: {percent}%", plain)

    def test_cache_colors_reward_high_hit_rates(self):
        for ratio, rgb in [(0.9, "158;206;106"), (0.6, "255;158;100"), (0.1, "247;118;142")]:
            with self.subTest(ratio=ratio):
                self.payload["prompt_cache"] = {"hit_ratio": ratio}
                colored, _ = self.render()
                self.assertIn(f"\x1b[38;2;{rgb}mCache:", colored)

    def test_missing_and_null_cache_are_hidden(self):
        for cache in [None, {}, {"hit_ratio": None}]:
            with self.subTest(cache=cache):
                self.payload["prompt_cache"] = cache
                _, plain = self.render()
                self.assertNotIn("Cache:", plain)
                self.assertIn("5h:12%", plain)

    def test_empty_optional_fields_do_not_shift_cache_or_path(self):
        self.payload["model"]["display_name"] = ""
        self.payload["effort"] = {"level": ""}
        self.payload["workspace"]["current_dir"] = "/tmp/course-project"
        self.payload["prompt_cache"] = {"hit_ratio": 0.88}
        _, plain = self.render()
        self.assertIn("tmp/course-project", plain)
        self.assertIn("Cache: 88%", plain)
        self.assertIn("5h:12%", plain)
        self.assertIn("7d:34%", plain)

    def test_windows_path_is_not_interpreted_as_terminal_escapes(self):
        self.payload["workspace"]["current_dir"] = r"C:\Users\Example\courses\next-app"
        self.payload["prompt_cache"] = {"hit_ratio": 0.5}
        _, plain = self.render()
        self.assertIn("courses/next-app", plain)
        self.assertIn("Cache: 50%", plain)

    def test_bad_json_keeps_statusline_visible(self):
        _, plain = self.render(raw="not JSON")
        self.assertTrue(plain.strip())
        self.assertNotIn("Cache:", plain)

    def test_linux_backslash_path_keeps_display_and_repository(self):
        repo = self.cwd / r"test\name" / "project"
        repo.mkdir(parents=True)
        subprocess.run(["git", "init", "-q", "-b", "payload-branch", str(repo)], check=True)
        subprocess.run([
            "git", "-C", str(repo), "-c", "core.hooksPath=/dev/null",
            "-c", "user.name=Example", "-c", "user.email=example@example.invalid",
            "commit", "-q", "--allow-empty", "-m", "Synthetic test repository",
        ], check=True)
        self.payload["workspace"]["current_dir"] = str(repo)
        _, plain = self.render()
        self.assertIn(r"test\name/project", plain)
        self.assertIn("git:payload-branch", plain)

    def test_missing_jq_explains_the_missing_metrics(self):
        commands = self.cwd / "commands"
        commands.mkdir()
        for command in ["cat", "grep", "head", "sed"]:
            (commands / command).symlink_to(shutil.which(command))
        _, plain = self.render(env={"PATH": str(commands)})
        self.assertIn("jq not found", plain)
        self.assertNotIn("Cache:", plain)


if __name__ == "__main__":
    unittest.main()
