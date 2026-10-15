#!/usr/bin/env python
"""
External rollback verification script.

Usage:
    python verify_rollback.py <workflow_id> <DATABASE_URL_TUTORIAL>

Exits 0 (SUCCESS) if the workflow_id is ABSENT from project_ai_workflows.
Exits 1 (FAILURE) if the workflow_id is present (rollback did not work).
"""

import asyncio
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def verify_absent(workflow_id: str, db_url: str) -> bool:
    """Return True if workflow_id is absent (rollback succeeded)."""
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Strip sslmode / channel_binding — asyncpg uses connect_args instead
    if "?" in db_url:
        base, qs = db_url.split("?", 1)
        params = [p for p in qs.split("&") if not p.startswith(("sslmode=", "channel_binding="))]
        db_url = f"{base}?{'&'.join(params)}" if params else base

    engine = create_async_engine(db_url, connect_args={"ssl": "require"})
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
                {"id": workflow_id},
            )
            row = result.fetchone()
    finally:
        await engine.dispose()

    return row is None  # True = absent = rollback succeeded


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: verify_rollback.py <workflow_id> <DATABASE_URL>")
        sys.exit(2)

    wf_id, db_url = sys.argv[1], sys.argv[2]
    absent = asyncio.run(verify_absent(wf_id, db_url))

    if absent:
        print(f"SUCCESS: workflow_id '{wf_id}' is ABSENT from database — rollback confirmed.")
        sys.exit(0)
    else:
        print(f"FAILURE: workflow_id '{wf_id}' STILL EXISTS in database — rollback did NOT work.")
        sys.exit(1)
