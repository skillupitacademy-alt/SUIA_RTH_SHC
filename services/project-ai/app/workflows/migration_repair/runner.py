"""
Command runner for migration repair workflow.

Executes approved commands with output capture and SHA-256 hashing.

This module provides command execution utilities. It is imported by verification.py
(one-way dependency; runner does not import verification).
"""

import asyncio
import hashlib
import shlex
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
    "docker-compose",
])


# Shell metacharacters that pose injection risk
SHELL_METACHARACTERS = frozenset([
    "|", "&", ";", "$", "`", "\\", "<", ">", "(", ")", "{", "}", 
    "[", "]", "*", "?", "~", "!", "#", "\n", "\r", "'", '"'
])


def validate_executable(executable: str) -> None:
    """
    Validate that the executable is in the allowed list.
    
    Args:
        executable: The base command/executable to validate
        
    Raises:
        ValueError: If executable is not in ALLOWED_COMMANDS
    """
    if executable not in ALLOWED_COMMANDS:
        raise ValueError(
            f"Executable '{executable}' is not in ALLOWED_COMMANDS. "
            f"Allowed: {', '.join(sorted(ALLOWED_COMMANDS))}"
        )


def validate_argv(argv: list[str]) -> None:
    """
    Validate that command arguments contain no shell metacharacters.
    
    This prevents shell injection by rejecting any argument containing
    characters that have special meaning in shell contexts.
    
    Args:
        argv: List of command arguments to validate
        
    Raises:
        ValueError: If any argument contains shell metacharacters
    """
    for arg in argv:
        for char in SHELL_METACHARACTERS:
            if char in arg:
                raise ValueError(
                    f"Argument '{arg}' contains forbidden shell metacharacter '{char}'. "
                    f"Shell metacharacters are not allowed for security."
                )


def validate_command(command: str) -> None:
    """
    Validate command is in the allowed list and contains no shell metacharacters.
    
    Args:
        command: Command string to validate
        
    Raises:
        ValueError: If command is not in ALLOWED_COMMANDS or contains shell metacharacters
    """
    # Parse command into argv array
    try:
        argv = shlex.split(command)
    except ValueError as e:
        raise ValueError(f"Failed to parse command: {e}")
    
    if not argv:
        raise ValueError("Command string is empty")
    
    # Extract the base command (first element)
    base_command = argv[0]
    
    # Validate executable is allowed
    validate_executable(base_command)
    
    # Validate arguments contain no shell metacharacters
    validate_argv(argv)


async def run_command(
    command: str,
    cwd: Optional[str] = None,
    timeout: int = 300,
    env: Optional[dict[str, str]] = None
) -> CommandResult:
    """
    Execute a command with output capture and hashing.
    
    Uses create_subprocess_exec to prevent shell injection. Arguments are 
    validated for shell metacharacters before execution.
    
    Args:
        command: Command to execute
        cwd: Working directory for command execution
        timeout: Timeout in seconds (default: 300)
        env: Environment variables to set
        
    Returns:
        CommandResult with exit code, stdout, stderr, and SHA-256 hash
        
    Raises:
        ValueError: If command is not in ALLOWED_COMMANDS or contains shell metacharacters
        asyncio.TimeoutError: If command exceeds timeout
    """
    # Validate command is allowed and safe
    validate_command(command)
    
    # Parse command into argv array
    argv = shlex.split(command)
    
    start_time = time.time()
    
    # Create subprocess using exec (no shell) with argument array
    proc = await asyncio.create_subprocess_exec(
        *argv,
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
