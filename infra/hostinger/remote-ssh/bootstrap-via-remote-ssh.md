# Bootstrap Via VS Code Remote SSH

Status: execution workflow once Remote SSH works.

## Prerequisite

This command must work from Windows PowerShell:

```powershell
ssh hostinger-quiz-platform
```

## Execution Flow

1. Connect using VS Code Remote SSH.
2. Open a remote terminal.
3. Execute `infra/hostinger/bootstrap/execution-checklist.md` manually step by step.
4. Do not clone the repository during bootstrap unless explicitly approved later.
5. Record outputs locally in a bootstrap log.

## Bootstrap Log Template

```text
Date:
Operator:
VPS IP:
SSH user:

Step:
Command:
Result:
Notes:
Next action:
```

## First Remote Commands

After connecting:

```bash
hostnamectl
cat /etc/os-release
free -h
df -h
lscpu
```

Then continue with the execution checklist.
