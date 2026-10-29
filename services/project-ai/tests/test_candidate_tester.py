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


def test_qualification_rejects_components_with_prohibited_left_borders(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="border-l-4 border-blue-500">Callout</div>; }'
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "asymmetrical left-side borders" in result["detail"]


def test_qualification_rejects_unguarded_hover_transforms(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="hover:-translate-y-2">Card</div>; }'
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "motion safety standards" in result["detail"]


def test_qualification_rejects_motion_safe_hover_transforms_without_motion_reduce(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="motion-safe:hover:-translate-y-2">Card</div>; }'
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "motion safety standards" in result["detail"]


def test_qualification_rejects_cursor_pointer_without_keyboard_semantics(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="cursor-pointer">Card</div>; }'
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "keyboard semantics" in result["detail"]


def test_qualification_rejects_alpha_only_candidate_surface_borders(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                "export function ExampleBlock() { return <div style={{ borderColor: withAlpha(primary, '35') }} />; }",
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["accessibility_preflight"]["status"] == "FAIL"
    assert "alpha-only inline borderColor" in result["detail"]


def test_qualification_rejects_solid_inline_surface_borders(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="rounded-xl border forced-colors:border-[ButtonText]" style={{ borderColor: primary }}>Card</div>; }'
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert result["status"] == "FAIL"
    assert "inline borderColor is not allowed" in result["detail"]


def test_qualification_rejects_rounded_bordered_surface_without_forced_colors(tmp_path, monkeypatch):
    workspace = tmp_path / "workspace"
    (workspace / "packages" / "ui").mkdir(parents=True)
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: workspace)

    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "aabbccdd-eeff-0011-2233-445566778899",
        [
            _candidate_file(
                "ExampleBlock.tsx",
                'export function ExampleBlock() { return <div className="rounded-xl border border-slate-500" />; }',
            ),
            _candidate_file(
                "ExampleBlock.test.tsx",
                "import { ExampleBlock } from '../ExampleBlock'; test('renders', () => { ExampleBlock(); });",
            ),
        ],
    ))

    assert result["passed"] is False
    assert "missing a forced-colors border or outline" in result["detail"]


