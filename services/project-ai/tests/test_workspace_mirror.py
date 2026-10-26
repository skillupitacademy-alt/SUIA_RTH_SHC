"""Tests for configurable workspace mirroring after placement (PROJECT_AI_WORKSPACE_MIRROR)."""

import time
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.placement.executor import PlacementExecutor, get_workspace_mirror_mode


def _setup(tmp_path: Path):
    repo = tmp_path / "repo"
    worktree = tmp_path / "worktree"
    repo.mkdir()
    src = worktree / "packages" / "ui" / "Block.tsx"
    src.parent.mkdir(parents=True)
    src.write_text("export const X = 1;", encoding="utf-8")
    executor = PlacementExecutor.__new__(PlacementExecutor)
    executor.repository_root = repo
    executor.active_worktree = SimpleNamespace(worktree_path=worktree)
    return executor, src, repo / "packages" / "ui" / "Block.tsx"


def test_default_mode_is_immediate(monkeypatch):
    monkeypatch.delenv("PROJECT_AI_WORKSPACE_MIRROR", raising=False)
    assert get_workspace_mirror_mode() == "immediate"


def test_invalid_mode_falls_back_to_immediate(monkeypatch):
    monkeypatch.setenv("PROJECT_AI_WORKSPACE_MIRROR", "bogus")
    assert get_workspace_mirror_mode() == "immediate"


def test_immediate_copies_synchronously(tmp_path, monkeypatch):
    monkeypatch.setenv("PROJECT_AI_WORKSPACE_MIRROR", "immediate")
    executor, src, dest = _setup(tmp_path)
    result = executor._mirror_to_workspace([str(src)])
    assert result == {"mode": "immediate", "files": 1}
    assert dest.read_text(encoding="utf-8") == "export const X = 1;"


def test_off_never_copies(tmp_path, monkeypatch):
    monkeypatch.setenv("PROJECT_AI_WORKSPACE_MIRROR", "off")
    executor, src, dest = _setup(tmp_path)
    result = executor._mirror_to_workspace([str(src)])
    assert result["mode"] == "off"
    assert not dest.exists()


def test_deferred_copies_after_delay_even_if_worktree_removed(tmp_path, monkeypatch):
    monkeypatch.setenv("PROJECT_AI_WORKSPACE_MIRROR", "deferred")
    monkeypatch.setenv("PROJECT_AI_WORKSPACE_MIRROR_DELAY_SECONDS", "0.2")
    executor, src, dest = _setup(tmp_path)
    result = executor._mirror_to_workspace([str(src)])
    assert result["mode"] == "deferred"
    assert not dest.exists()
    src.unlink()  # simulate worktree cleanup before the timer fires
    deadline = time.time() + 3
    while not dest.exists() and time.time() < deadline:
        time.sleep(0.05)
    assert dest.read_text(encoding="utf-8") == "export const X = 1;"
