"""Focused tests for Project LLM's generic candidate qualification runner."""

import asyncio
import json
import subprocess
from pathlib import Path

from app.models.candidate import CandidateFile
from app.verification import candidate_tester


def _candidate_file(filename: str, content: str) -> CandidateFile:
    return CandidateFile(
        filename=filename,
        content=content,
        contentType="text/plain",
        hash="a" * 64,
    )


def test_qualification_rejects_packages_without_a_test_file(tmp_path, monkeypatch):
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: tmp_path)
    (tmp_path / "packages" / "ui").mkdir(parents=True)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "candidate-1",
        [_candidate_file("ExampleBlock.tsx", "export function ExampleBlock() { return null; }")],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "missing required unit test suite" in result["detail"]


def test_qualification_runs_only_in_disposable_worktree(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    sandbox = tmp_path / "sandbox"
    removed = []

    def create_worktree(_: Path) -> Path:
        (sandbox / "packages" / "ui" / "src" / "tutorial" / "blocks" / "__tests__").mkdir(parents=True)
        return sandbox

    def remove_worktree(_: Path, worktree_path: Path, _linked=None) -> None:
        removed.append(worktree_path)

    def fake_run(command, **kwargs):
        assert kwargs["cwd"] == str(sandbox)
        assert "vitest" in command
        return subprocess.CompletedProcess(
            command,
            0,
            stdout=json.dumps({
                "success": True,
                "numTotalTests": 1,
                "numPassedTests": 1,
                "numFailedTests": 0,
            }),
            stderr="",
        )

    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)
    monkeypatch.setattr(candidate_tester, "_create_isolated_worktree", create_worktree)
    monkeypatch.setattr(candidate_tester, "_remove_isolated_worktree", remove_worktree)
    monkeypatch.setattr(candidate_tester.subprocess, "run", fake_run)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file("ExampleBlock.tsx", "export function ExampleBlock() { return null; }"),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is True
    assert result["total_tests"] == 1
    assert result["runner_metadata"]["qualification_inputs"]
    assert result["runner_metadata"]["sandbox_tests"] == [
        "src/tutorial/blocks/__tests__/__cand_aabbccdd_ExampleBlock.test.tsx"
    ]
    assert removed == [sandbox]
    assert not list((workspace / "packages" / "ui").rglob("__cand_*"))


def test_qualification_rejects_tests_that_do_not_import_submitted_component(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    sandbox = tmp_path / "sandbox"

    def create_worktree(_: Path) -> Path:
        (sandbox / "packages" / "ui" / "src" / "tutorial" / "blocks" / "__tests__").mkdir(parents=True)
        return sandbox

    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)
    monkeypatch.setattr(candidate_tester, "_create_isolated_worktree", create_worktree)
    monkeypatch.setattr(candidate_tester, "_remove_isolated_worktree", lambda *_: None)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file("ExampleBlock.tsx", "export function ExampleBlock() { return null; }"),
            _candidate_file("ExampleBlock.test.tsx", "test('renders', () => {});"),
        ],
    ))

    assert result["passed"] is False
    assert "must import a submitted block component" in result["detail"]
    assert result["runner_metadata"]["qualification_inputs"]
