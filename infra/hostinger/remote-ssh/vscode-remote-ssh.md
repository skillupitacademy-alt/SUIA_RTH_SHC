# VS Code Remote SSH Setup

Status: workstation workflow guide.

## Install Extensions

Recommended extensions are declared in `.vscode/extensions.json`:

- `openai.chatgpt`
- `ms-vscode-remote.remote-ssh`

Install them from VS Code Extensions.

## Add SSH Config

Copy `infra/hostinger/remote-ssh/ssh-config.template` into:

```text
C:\Users\<you>\.ssh\config
```

Then test:

```powershell
ssh hostinger-quiz-platform
```

## Connect From VS Code

1. Open Command Palette.
2. Run `Remote-SSH: Connect to Host...`.
3. Select `hostinger-quiz-platform`.
4. Open the remote folder only after the VPS bootstrap is complete.

Recommended future remote workspace:

```text
/opt/platform/apps/quiz-platform
```

Do not clone the repo until the bootstrap checklist is complete.
