"""File-backed operational progress; never used as certification evidence."""

import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from uuid import uuid4


def _path(workflow_id: str, operation: str) -> Path:
    key = hashlib.sha256(f"{workflow_id}:{operation}".encode()).hexdigest()
    directory = Path(tempfile.gettempdir()) / "project-ai-progress"
    directory.mkdir(parents=True, exist_ok=True)
    return directory / f"{key}.json"


def read_progress(workflow_id: str, operation: str) -> dict:
    try:
        return json.loads(_path(workflow_id, operation).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"status": "NOT_STARTED", "tasks": []}


class ExecutionProgress:
    def __init__(self, workflow_id: str, operation: str):
        self.path = _path(workflow_id, operation)
        self.data = {"runId": uuid4().hex, "startedAt": time.time(),
                     "status": "RUNNING", "tasks": []}
        self._write()

    def _write(self):
        self.data["updatedAt"] = time.time()
        temporary = self.path.with_suffix(f".{uuid4().hex}.tmp")
        temporary.write_text(json.dumps(self.data), encoding="utf-8")
        os.replace(temporary, self.path)

    def __call__(self, label: str):
        self._refresh()
        now = time.time()
        if self.data["tasks"]:
            task = self.data["tasks"][-1]
            task.update(status="DONE", finishedAt=now)
        self.data["tasks"].append({"label": label, "status": "RUNNING", "startedAt": now})
        self._write()

    def finish(self, status: str):
        self._refresh()
        if self.data["tasks"]:
            self.data["tasks"][-1].update(
                status="DONE" if status == "PASS" else status, finishedAt=time.time())
        self.data["status"] = status
        self._write()

    def _refresh(self):
        """Accept browser task events only from this same verification run."""
        try:
            current = json.loads(self.path.read_text(encoding="utf-8"))
            if current.get("runId") == self.data["runId"]:
                self.data = current
        except (OSError, ValueError):
            pass
