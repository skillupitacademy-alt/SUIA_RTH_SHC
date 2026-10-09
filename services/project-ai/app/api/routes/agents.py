"""Agent registry endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException, Depends

from app.auth.dependencies import get_current_user
from app.orchestration.agent_registry import Agent, AgentRegistry, AgentType

router = APIRouter(prefix="/agents", tags=["agents"])

# Singleton agent registry
_registry = AgentRegistry()


@router.get("", response_model=List[Agent])
async def list_agents(user: dict = Depends(get_current_user)):
    """
    List all registered agents.
    
    Returns:
        List of all 15 specialized agents with their capabilities
    """
    return _registry.list_agents()


@router.get("/{agent_type}", response_model=Agent)
async def get_agent(agent_type: str, user: dict = Depends(get_current_user)):
    """
    Get agent definition by type.
    
    Args:
        agent_type: Agent type identifier (e.g., 'gate_controller', 'toolchain')
        
    Returns:
        Agent definition with capabilities and status
        
    Raises:
        404: If agent_type is not registered
    """
    try:
        agent_type_enum = AgentType(agent_type)
        return _registry.get_agent(agent_type_enum)
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown agent type: {agent_type}. Valid types: {[t.value for t in AgentType]}"
        )
