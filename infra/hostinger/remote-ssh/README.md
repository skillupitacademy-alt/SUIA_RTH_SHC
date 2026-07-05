# VS Code Remote SSH Workflow

Status: recommended implementation workflow for VPS bootstrap and later deployment.

This workflow keeps credentials on your Windows 11 machine and lets Codex operate inside VS Code after you connect to the Hostinger VPS through Remote SSH.

## Target Architecture

```text
Windows 11
VS Code
Remote SSH
Hostinger VPS
Git checkout
Docker Compose
```

Codex does not need the root password. It uses your approved VS Code terminal session and SSH key authentication.

## What This Enables

- Run VPS bootstrap commands with your approval.
- Edit files directly on the VPS when appropriate.
- Run validation scripts from the VPS.
- Avoid storing root passwords in prompts, scripts, or repository files.

## What This Does Not Do

- It does not change DNS.
- It does not modify Cloudflare.
- It does not delete GCP resources.
- It does not deploy applications until a later approved phase.

## Documents

- `ssh-key-setup.md`
- `ssh-config.template`
- `vscode-remote-ssh.md`
- `codex-remote-operating-rules.md`
- `bootstrap-via-remote-ssh.md`

## Passphrase-Protected Key Helper

If the Hostinger SSH key is passphrase-protected, load it into Windows `ssh-agent` from an interactive PowerShell terminal:

```powershell
.\infra\hostinger\remote-ssh\load-hostinger-key.ps1
```

Enter the passphrase only at the `ssh-add` prompt. Do not place the passphrase in scripts, command arguments, repository files, or chat messages.
