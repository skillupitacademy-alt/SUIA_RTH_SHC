"""
Project AI - FastAPI service for AI-driven development orchestration.

Architecture Rule:
- TypeScript D1-D8 scanners = deterministic repository facts
- Python/FastAPI = AI orchestration control plane

This service READS TypeScript snapshots. It does NOT scan the repository.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, candidate, contract, creation, evidence, governance, health, snapshot, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Validates configuration on startup, cleans up on shutdown.
    """
    # Startup: Validate snapshot path configuration
    workspace_root = os.environ.get(
        'WORKSPACE_ROOT',
        'E:\\onlinewebsites\\quiz-platform'
    )
    snapshot_path = Path(workspace_root) / 'packages' / 'project-llm-discovery' / 'output' / 'snapshot.json'
    
    print(f"Project AI starting...")
    print(f"Workspace root: {workspace_root}")
    print(f"Snapshot path: {snapshot_path}")
    
    if not snapshot_path.exists():
        print(
            f"WARNING: Snapshot file not found at {snapshot_path}. "
            "Run TypeScript discovery scan first: "
            "pnpm --filter @quiz/project-llm-discovery scan"
        )
    else:
        print(f"✓ Snapshot file found")
    
    # Startup: Validate database connectivity
    try:
        from app.persistence import validate_database_connectivity
        await validate_database_connectivity()
        print("✓ Database connectivity validated")
    except Exception as e:
        print(f"ERROR: Database validation failed: {e}")
        raise
    
    # Startup: Validate JWT configuration
    try:
        from app.auth import get_jwt_config
        jwt_config = get_jwt_config()
        print(f"✓ JWT configuration validated (algorithm: {jwt_config['algorithm']}, token expiry: {jwt_config['access_token_expire_minutes']} minutes)")
    except Exception as e:
        print(f"ERROR: JWT configuration validation failed: {e}")
        raise
    
    yield
    
    # Shutdown: Close database connections
    from app.persistence import close_db
    await close_db()
    print("Project AI shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Project AI",
    description=(
        "AI orchestration service for development workflow automation. "
        "Reads TypeScript-generated snapshots to orchestrate AI-driven "
        "code analysis, planning, implementation, and verification."
    ),
    version="0.1.0 (M2.8)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(health.router)
app.include_router(snapshot.router)
app.include_router(evidence.router)
app.include_router(tasks.router)
app.include_router(governance.router)
app.include_router(agents.router)
app.include_router(candidate.router, prefix="/candidates", tags=["candidates"])
app.include_router(creation.router)
app.include_router(contract.router)


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Project AI",
        "version": "0.1.0 (M2.8)",
        "description": "AI orchestration service for development workflows",
        "endpoints": {
            "health": "/health",
            "snapshot": "/snapshot",
            "evidence": "/evidence",
            "tasks": "/tasks",
            "approvals": "/approvals",
            "agents": "/agents",
            "candidates": "/candidates",
            "creation": "/creation",
            "docs": "/docs",
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
