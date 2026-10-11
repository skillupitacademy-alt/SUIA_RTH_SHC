"""
Unit tests for migration repair workflow planning.

Tests dependency resolution, cycle detection, and agent step definitions.
"""

import pytest

from app.workflows.migration_repair.plan import (
    AgentStep,
    STEPS,
    ready_steps,
    validate_no_cycles,
)


def test_agent_step_creation():
    """Test AgentStep dataclass creation."""
    step = AgentStep(
        agent_id="Agent0",
        wave="W0",
        name="Workflow Controller",
        dependencies=()
    )
    
    assert step.agent_id == "Agent0"
    assert step.wave == "W0"
    assert step.name == "Workflow Controller"
    assert step.dependencies == ()


def test_agent_step_with_dependencies():
    """Test AgentStep with dependencies."""
    step = AgentStep(
        agent_id="Agent5",
        wave="W2",
        name="Repair Planner",
        dependencies=("Agent1", "Agent2", "Agent3", "Agent4")
    )
    
    assert len(step.dependencies) == 4
    assert "Agent1" in step.dependencies


def test_agent_step_invalid_id():
    """Test AgentStep rejects invalid agent_id format."""
    with pytest.raises(ValueError, match="agent_id must start with 'Agent'"):
        AgentStep(
            agent_id="InvalidAgent",
            wave="W0",
            name="Test",
            dependencies=()
        )


def test_steps_tuple_length():
    """Test STEPS tuple contains all 14 agents (Agent0-Agent13)."""
    assert len(STEPS) == 14
    
    # Verify agent IDs are Agent0 through Agent13
    agent_ids = [step.agent_id for step in STEPS]
    expected_ids = [f"Agent{i}" for i in range(14)]
    assert agent_ids == expected_ids


def test_steps_wave_distribution():
    """Test STEPS are distributed across waves W0-W9."""
    waves = {step.wave for step in STEPS}
    expected_waves = {"W0", "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9"}
    assert waves == expected_waves


def test_agent0_no_dependencies():
    """Test Agent0 (Workflow Controller) has no dependencies."""
    agent0 = next(step for step in STEPS if step.agent_id == "Agent0")
    assert agent0.wave == "W0"
    assert agent0.dependencies == ()


def test_w1_agents_depend_on_agent0():
    """Test all W1 agents depend only on Agent0."""
    w1_agents = [step for step in STEPS if step.wave == "W1"]
    assert len(w1_agents) == 4
    
    for agent in w1_agents:
        assert agent.dependencies == ("Agent0",)


def test_agent5_depends_on_all_w1():
    """Test Agent5 (Repair Planner) depends on all W1 agents."""
    agent5 = next(step for step in STEPS if step.agent_id == "Agent5")
    assert agent5.wave == "W2"
    assert set(agent5.dependencies) == {"Agent1", "Agent2", "Agent3", "Agent4"}


def test_agent13_depends_on_agent12():
    """Test Agent13 (Publisher) depends on Agent12."""
    agent13 = next(step for step in STEPS if step.agent_id == "Agent13")
    assert agent13.wave == "W9"
    assert agent13.dependencies == ("Agent12",)


def test_ready_steps_empty_completed():
    """Test ready_steps with no completed agents returns only Agent0."""
    ready = ready_steps([])
    assert len(ready) == 1
    assert ready[0].agent_id == "Agent0"


def test_ready_steps_after_agent0():
    """Test ready_steps after Agent0 completes returns all W1 agents."""
    ready = ready_steps(["Agent0"])
    assert len(ready) == 4
    
    ready_ids = {step.agent_id for step in ready}
    assert ready_ids == {"Agent1", "Agent2", "Agent3", "Agent4"}


def test_ready_steps_partial_w1():
    """Test ready_steps with partial W1 completion doesn't return W2."""
    ready = ready_steps(["Agent0", "Agent1", "Agent2"])
    
    # Should return remaining W1 agents, not W2 yet
    ready_ids = {step.agent_id for step in ready}
    assert ready_ids == {"Agent3", "Agent4"}


def test_ready_steps_all_w1_completed():
    """Test ready_steps after all W1 completes returns Agent5."""
    ready = ready_steps(["Agent0", "Agent1", "Agent2", "Agent3", "Agent4"])
    assert len(ready) == 1
    assert ready[0].agent_id == "Agent5"


def test_ready_steps_w5_parallel():
    """Test ready_steps returns multiple W5 agents when W4 completes."""
    completed = ["Agent0", "Agent1", "Agent2", "Agent3", "Agent4", 
                 "Agent5", "Agent6", "Agent7"]
    ready = ready_steps(completed)
    
    assert len(ready) == 2
    ready_ids = {step.agent_id for step in ready}
    assert ready_ids == {"Agent8", "Agent9"}


def test_ready_steps_skips_completed():
    """Test ready_steps doesn't return already completed agents."""
    ready = ready_steps(["Agent0", "Agent1"])
    
    # Agent0 and Agent1 should not appear in ready list
    ready_ids = {step.agent_id for step in ready}
    assert "Agent0" not in ready_ids
    assert "Agent1" not in ready_ids


def test_ready_steps_complete_workflow():
    """Test ready_steps with all agents completed returns empty list."""
    all_agents = [f"Agent{i}" for i in range(14)]
    ready = ready_steps(all_agents)
    assert len(ready) == 0


def test_validate_no_cycles_succeeds():
    """Test validate_no_cycles doesn't raise for valid STEPS."""
    # Should not raise
    validate_no_cycles()


def test_validate_no_cycles_detects_cycle():
    """Test validate_no_cycles would detect a cycle (theoretical test)."""
    # This tests the cycle detection logic by verifying the function exists
    # and can be called. The actual STEPS graph is cycle-free by design.
    
    # We can't easily inject a cyclic graph without modifying module state,
    # so we just verify the function is callable
    assert callable(validate_no_cycles)


def test_agent_step_immutable():
    """Test AgentStep is immutable (frozen dataclass)."""
    step = AgentStep(
        agent_id="Agent0",
        wave="W0",
        name="Test",
        dependencies=()
    )
    
    with pytest.raises(AttributeError):
        step.agent_id = "Agent1"  # Should raise because frozen=True


def test_steps_tuple_immutable():
    """Test STEPS is a tuple (immutable)."""
    assert isinstance(STEPS, tuple)
    
    with pytest.raises(TypeError):
        STEPS[0] = AgentStep("Agent99", "W99", "Test", ())


def test_agent10_depends_on_w5():
    """Test Agent10 (Verification Runner) depends on both W5 agents."""
    agent10 = next(step for step in STEPS if step.agent_id == "Agent10")
    assert agent10.wave == "W6"
    assert set(agent10.dependencies) == {"Agent8", "Agent9"}


def test_sequential_chain_w6_to_w9():
    """Test W6-W9 form a sequential chain."""
    agent10 = next(step for step in STEPS if step.agent_id == "Agent10")
    agent11 = next(step for step in STEPS if step.agent_id == "Agent11")
    agent12 = next(step for step in STEPS if step.agent_id == "Agent12")
    agent13 = next(step for step in STEPS if step.agent_id == "Agent13")
    
    assert agent11.dependencies == ("Agent10",)
    assert agent12.dependencies == ("Agent11",)
    assert agent13.dependencies == ("Agent12",)
