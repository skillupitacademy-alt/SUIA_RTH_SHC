"""
Command runner for migration repair workflow.

Executes approved commands with output capture and SHA-256 hashing.

This module provides command execution utilities. It is imported by verification.py
(one-way dependency; runner does not import verification).
"""

import asyncio
import hashlib
import json
import shlex
import time
from datetime import datetime
from pathlib import Path
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
    env: Optional[dict[str, str]] = None,
    log_to_commands_jsonl: bool = True
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
        log_to_commands_jsonl: Whether to log to commands.jsonl (default: True)
        
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
    
    result = CommandResult(
        command=command,
        exit_code=proc.returncode or 0,
        stdout=stdout,
        stderr=stderr,
        sha256=sha256,
        timestamp=datetime.now(),
        duration_ms=duration_ms
    )
    
    # Log command to commands.jsonl if enabled
    if log_to_commands_jsonl:
        _log_command_to_jsonl(argv, result.exit_code, duration_ms, cwd)
    
    return result


def _log_command_to_jsonl(argv: list[str], exit_code: int, duration_ms: int, cwd: Optional[str]) -> None:
    """
    Log command execution to commands.jsonl in run directory.
    
    Args:
        argv: Command arguments array
        exit_code: Command exit code
        duration_ms: Execution duration in milliseconds
        cwd: Working directory where command was executed
    """
    try:
        # Find run directory from .agents/evidence/runs/
        # Walk up from current file to find .agents directory
        current_path = Path(__file__).resolve()
        evidence_root = None
        
        for parent in current_path.parents:
            agents_dir = parent / ".agents"
            if agents_dir.exists():
                evidence_root = agents_dir / "evidence"
                break
        
        if not evidence_root or not evidence_root.exists():
            # Cannot find evidence directory, skip logging
            return
        
        # Find the latest run directory
        runs_dir = evidence_root / "runs"
        if not runs_dir.exists():
            return
        
        # Get all run directories sorted by modification time (most recent first)
        run_dirs = sorted(runs_dir.glob("migration-repair-*"), key=lambda p: p.stat().st_mtime, reverse=True)
        
        if not run_dirs:
            return
        
        # Use the most recent run directory
        latest_run = run_dirs[0]
        commands_log = latest_run / "commands.jsonl"
        
        # Create command log entry
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "command": argv,
            "exit_code": exit_code,
            "duration_ms": duration_ms,
            "cwd": cwd
        }
        
        # Append to commands.jsonl
        with open(commands_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    except Exception:
        # Silently fail if logging fails - don't break command execution
        pass
