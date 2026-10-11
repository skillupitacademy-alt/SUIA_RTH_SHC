"""
Unit tests for command runner security.

Verifies command injection prevention and argument validation.
"""

import pytest

from app.workflows.migration_repair.runner import (
    validate_executable,
    validate_argv,
    validate_command,
    ALLOWED_COMMANDS,
    SHELL_METACHARACTERS,
)


def test_rejects_pipe_metacharacter():
    """Test validate_argv rejects pipe character."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '\\|'"):
        validate_argv(["ls", "|", "grep", "test"])


def test_rejects_ampersand():
    """Test validate_argv rejects ampersand character."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '&'"):
        validate_argv(["command", "&&", "malicious"])


def test_rejects_semicolon():
    """Test validate_argv rejects semicolon character."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter ';'"):
        validate_argv(["command", ";", "rm -rf /"])


def test_rejects_dollar_sign():
    """Test validate_argv rejects dollar sign (variable expansion)."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '\\$'"):
        validate_argv(["echo", "$HOME"])


def test_rejects_backtick():
    """Test validate_argv rejects backtick (command substitution)."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '`'"):
        validate_argv(["echo", "`whoami`"])


def test_rejects_redirect_operators():
    """Test validate_argv rejects redirect operators."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '<'"):
        validate_argv(["cat", "<", "file.txt"])
    
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '>'"):
        validate_argv(["echo", "test", ">", "file.txt"])


def test_accepts_safe_command():
    """Test validate_argv accepts safe arguments without metacharacters."""
    # Should not raise
    validate_argv(["pytest", "tests/", "-v", "--maxfail=1"])
    validate_argv(["git", "status"])
    validate_argv(["pnpm", "install"])


def test_validates_executable_in_allowlist():
    """Test validate_executable accepts executables in ALLOWED_COMMANDS."""
    # Should not raise for allowed commands
    for cmd in ALLOWED_COMMANDS:
        validate_executable(cmd)


def test_rejects_executable_not_in_allowlist():
    """Test validate_executable rejects executables not in ALLOWED_COMMANDS."""
    with pytest.raises(ValueError, match="Executable 'curl' is not in ALLOWED_COMMANDS"):
        validate_executable("curl")
    
    with pytest.raises(ValueError, match="Executable 'rm' is not in ALLOWED_COMMANDS"):
        validate_executable("rm")
    
    with pytest.raises(ValueError, match="Executable 'bash' is not in ALLOWED_COMMANDS"):
        validate_executable("bash")


def test_validate_command_rejects_shell_injection():
    """Test validate_command rejects command with shell injection attempt."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_command("pytest tests/ && rm -rf /")
    
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_command("git status; malicious_command")


def test_validate_command_accepts_safe_command():
    """Test validate_command accepts safe commands."""
    # Should not raise
    validate_command("pytest tests/ -v")
    validate_command("git status")
    validate_command("pnpm install")


def test_validate_command_rejects_disallowed_executable():
    """Test validate_command rejects commands with disallowed executables."""
    with pytest.raises(ValueError, match="is not in ALLOWED_COMMANDS"):
        validate_command("curl https://example.com")
    
    with pytest.raises(ValueError, match="is not in ALLOWED_COMMANDS"):
        validate_command("rm -rf /tmp/test")


def test_validate_command_handles_empty_command():
    """Test validate_command rejects empty command string."""
    with pytest.raises(ValueError, match="Command string is empty"):
        validate_command("")


def test_rejects_backslash():
    """Test validate_argv rejects backslash character."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '\\\\'"):
        validate_argv(["echo", "test\\escape"])


def test_rejects_parentheses():
    """Test validate_argv rejects parentheses (subshell)."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_argv(["echo", "(subshell)"])


def test_rejects_braces():
    """Test validate_argv rejects braces (brace expansion)."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_argv(["echo", "{a,b,c}"])


def test_rejects_wildcards():
    """Test validate_argv rejects wildcard characters."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '\\*'"):
        validate_argv(["rm", "*.tmp"])
    
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter '\\?'"):
        validate_argv(["ls", "file?.txt"])


def test_rejects_newlines():
    """Test validate_argv rejects newline characters."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_argv(["echo", "line1\nline2"])


def test_rejects_quotes():
    """Test validate_argv rejects quote characters."""
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_argv(["echo", "'quoted'"])
    
    with pytest.raises(ValueError, match="contains forbidden shell metacharacter"):
        validate_argv(["echo", '"quoted"'])


def test_shell_metacharacters_set_complete():
    """Test SHELL_METACHARACTERS contains all expected dangerous characters."""
    expected = {
        "|", "&", ";", "$", "`", "\\", "<", ">", "(", ")", "{", "}", 
        "[", "]", "*", "?", "~", "!", "#", "\n", "\r", "'", '"'
    }
    assert SHELL_METACHARACTERS == expected


def test_allowed_commands_set():
    """Test ALLOWED_COMMANDS contains expected commands."""
    expected = {
        "pnpm", "turbo", "pytest", "node", "tsx", 
        "drizzle-kit", "git", "npm", "npx"
    }
    assert ALLOWED_COMMANDS == expected
