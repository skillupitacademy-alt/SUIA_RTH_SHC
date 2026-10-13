"""Tests for task management endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.task_state import TaskState

client = TestClient(app)


def test_create_task():
    """Test POST /tasks/plan creates task with CREATED state."""
    response = client.post(
        "/tasks/plan",
        json={
            "description": "Implement user authentication",
            "context": {"priority": "high"}
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "task_id" in data
    assert data["state"] == TaskState.CREATED
    assert data["description"] == "Implement user authentication"
    assert data["context"]["priority"] == "high"
    assert "created_at" in data
    assert "updated_at" in data


def test_get_task_status():
    """Test GET /tasks/{task_id} returns task status."""
    # Create a task first
    create_response = client.post(
        "/tasks/plan",
        json={"description": "Test task"}
    )
    task_id = create_response.json()["task_id"]
    
    # Get task status
    response = client.get(f"/tasks/{task_id}")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["task_id"] == task_id
    assert data["state"] == TaskState.CREATED
    assert data["description"] == "Test task"


def test_get_task_not_found():
    """Test GET /tasks/{task_id} returns 404 for nonexistent task."""
    response = client.get("/tasks/nonexistent-task-id")
    
    assert response.status_code == 404


def test_approve_task():
    """Test POST /tasks/{task_id}/approve transitions state correctly."""
    # Create a task
    create_response = client.post(
        "/tasks/plan",
        json={"description": "Test task"}
    )
    task_id = create_response.json()["task_id"]
    
    # Manually set task to WAITING_FOR_APPROVAL state
    # (In real workflow, this would happen through workflow engine)
    from app.api.routes.tasks import _tasks
    _tasks[task_id]["state"] = TaskState.WAITING_FOR_APPROVAL
    
    # Approve task
    response = client.post(f"/tasks/{task_id}/approve")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["task_id"] == task_id
    assert data["previous_state"] == TaskState.WAITING_FOR_APPROVAL
    assert data["new_state"] == TaskState.IMPLEMENTING
    assert "approved" in data["message"].lower()


def test_approve_task_wrong_state():
    """Test approve fails when task is not in WAITING_FOR_APPROVAL state."""
    # Create a task in CREATED state
    create_response = client.post(
        "/tasks/plan",
        json={"description": "Test task"}
    )
    task_id = create_response.json()["task_id"]
    
    # Try to approve (should fail because state is CREATED, not WAITING_FOR_APPROVAL)
    response = client.post(f"/tasks/{task_id}/approve")
    
    assert response.status_code == 400
    assert "expected WAITING_FOR_APPROVAL" in response.json()["detail"]


def test_reject_task():
    """Test POST /tasks/{task_id}/reject transitions state correctly."""
    # Create a task
    create_response = client.post(
        "/tasks/plan",
        json={"description": "Test task"}
    )
    task_id = create_response.json()["task_id"]
    
    # Manually set task to WAITING_FOR_APPROVAL state
    from app.api.routes.tasks import _tasks
    _tasks[task_id]["state"] = TaskState.WAITING_FOR_APPROVAL
    
    # Reject task
    response = client.post(f"/tasks/{task_id}/reject")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["task_id"] == task_id
    assert data["previous_state"] == TaskState.WAITING_FOR_APPROVAL
    assert data["new_state"] == TaskState.REJECTED
    assert "rejected" in data["message"].lower()


def test_reject_task_wrong_state():
    """Test reject fails when task is not in WAITING_FOR_APPROVAL state."""
    # Create a task in CREATED state
    create_response = client.post(
        "/tasks/plan",
        json={"description": "Test task"}
    )
    task_id = create_response.json()["task_id"]
    
    # Try to reject (should fail)
    response = client.post(f"/tasks/{task_id}/reject")
    
    assert response.status_code == 400


def test_task_not_found_for_actions():
    """Test approve/reject return 404 for nonexistent tasks."""
    response_approve = client.post("/tasks/nonexistent/approve")
    response_reject = client.post("/tasks/nonexistent/reject")
    
    assert response_approve.status_code == 404
    assert response_reject.status_code == 404
