from app.verification import execution_progress as progress
import json


def test_progress_advances_only_on_backend_event(tmp_path, monkeypatch):
    monkeypatch.setattr(progress, "_path", lambda *_: tmp_path / "progress.json")
    run = progress.ExecutionProgress("workflow", "composer")
    run("Install dependencies")
    state = progress.read_progress("workflow", "composer")
    assert state["tasks"][0]["status"] == "RUNNING"
    run("Build application")
    state = progress.read_progress("workflow", "composer")
    assert state["tasks"][0]["status"] == "DONE"
    assert state["tasks"][1]["status"] == "RUNNING"
    run.finish("FAIL")
    state = progress.read_progress("workflow", "composer")
    assert state["status"] == "FAIL"
    assert state["tasks"][1]["status"] == "FAIL"


def test_missing_progress_is_not_success(tmp_path, monkeypatch):
    monkeypatch.setattr(progress, "_path", lambda *_: tmp_path / "missing.json")
    assert progress.read_progress("workflow", "learner")["status"] == "NOT_STARTED"


def test_browser_tasks_are_preserved_when_python_finishes(tmp_path, monkeypatch):
    monkeypatch.setattr(progress, "_path", lambda *_: tmp_path / "progress.json")
    run = progress.ExecutionProgress("workflow", "composer")
    run("Browser verification")
    state = progress.read_progress("workflow", "composer")
    state["tasks"][-1].update(status="DONE", finishedAt=10)
    state["tasks"].append({"label": "Check 375px", "status": "RUNNING", "startedAt": 10})
    run.path.write_text(json.dumps(state), encoding="utf-8")
    run.finish("PASS")
    updated = progress.read_progress("workflow", "composer")
    assert updated["tasks"][-1]["label"] == "Check 375px"
    assert updated["tasks"][-1]["status"] == "DONE"


def test_qualification_failure_is_reported_under_workflow(tmp_path, monkeypatch):
    import asyncio
    from app.verification import candidate_tester

    monkeypatch.setattr(progress, "_path", lambda *_: tmp_path / "qualification.json")
    monkeypatch.setattr(candidate_tester, "find_workspace_root", lambda: tmp_path)
    result = asyncio.run(candidate_tester.run_candidate_qualification_tests(
        "candidate", [], workflow_id="workflow",
    ))
    assert not result["passed"]
    state = progress.read_progress("workflow", "qualification")
    assert state["status"] == "FAIL"
    assert state["tasks"][0]["status"] == "FAIL"
