"""
Command runner for migration repair workflow.

Executes approved commands with output capture and SHA-256 hashing.

This module provides command execution utilities. It is imported by verification.py
(one-way dependency; runner does not import verification).
"""

import asyncio
import hashlib
import time
from datetime import datetime
from typing import Optional

from .models import CommandResult


# Allowed commands extracted from package.json scripts
# This is a subset of commands approved for migration repair workflow
ALLOWED_COMMANDS = frozenset([
    "pnpm",
    "turbo",
    "pytest",
    "node",
    "tsx",
    "drizzle-kit",
    "git",
    "npm",
    "npx",
])


def validate_command(command: str) -> None:
    """
    Validate command is in the allowed list.
    
    Args:
        command: Command string to validate
        
    Raises:
        ValueError: If command is not in ALLOWED_COMMANDS
    """
    # Extract the base command (first word)
    base_command = command.strip().split()[0] if command.strip() else ""
    
    if base_command not in ALLOWED_COMMANDS:
        raise ValueError(
            f"Command '{base_command}' is not in ALLOWED_COMMANDS. "
            f"Allowed: {', '.join(sorted(ALLOWED_COMMANDS))}"
        )


async def run_command(
    command: str,
    cwd: Optional[str] = None,
    timeout: int = 300,
    env: Optional[dict[str, str]] = None
) -> CommandResult:
    """
    Execute a command with output capture and hashing.
    
    Args:
        command: Command to execute
        cwd: Working directory for command execution
        timeout: Timeout in seconds (default: 300)
        env: Environment variables to set
        
    Returns:
        CommandResult with exit code, stdout, stderr, and SHA-256 hash
        
    Raises:
        ValueError: If command is not in ALLOWED_COMMANDS
        asyncio.TimeoutError: If command exceeds timeout
    """
    # Validate command is allowed
    validate_command(command)
    
    start_time = time.time()
    
    # Create subprocess
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
        env=env
    )
    
    # Wait for completion with timeout
    try:
        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        raise asyncio.TimeoutError(f"Command '{command}' exceeded timeout of {timeout}s")
    
    end_time = time.time()
    duration_ms = int((end_time - start_time) * 1000)
    
    # Decode output
    stdout = stdout_bytes.decode("utf-8", errors="replace")
    stderr = stderr_bytes.decode("utf-8", errors="replace")
    
    # Compute SHA-256 hash of concatenated output
    combined_output = stdout + stderr
    sha256 = hashlib.sha256(combined_output.encode("utf-8")).hexdigest()
    
    return CommandResult(
        command=command,
        exit_code=proc.returncode or 0,
        stdout=stdout,
        stderr=stderr,
        sha256=sha256,
        timestamp=datetime.now(),
        duration_ms=duration_ms
    )
