"""Health check endpoint."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.api.schemas.models import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns current service status, version, and timestamp.
    """
    return HealthResponse(
        status="ok",
        version="m2.8",
        timestamp=datetime.now(timezone.utc)
    )
