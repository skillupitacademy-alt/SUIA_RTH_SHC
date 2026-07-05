# SSH Key Setup

Status: local workstation setup guide.

Do not use the root password for routine Codex-assisted work. Use SSH keys.

## Generate A Key On Windows

From PowerShell on your Windows machine:

```powershell
ssh-keygen -t ed25519 -C "deploy@hostinger-quiz-platform" -f "$env:USERPROFILE\.ssh\hostinger_quiz_platform_ed25519"
```

This creates:

```text
C:\Users\<you>\.ssh\hostinger_quiz_platform_ed25519
C:\Users\<you>\.ssh\hostinger_quiz_platform_ed25519.pub
```

Keep the private key private. Only copy the `.pub` file to the VPS.

## Add Public Key To VPS

Use Hostinger browser console or a temporary root SSH session to add the public key:

```bash
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Paste the contents of:

```powershell
Get-Content "$env:USERPROFILE\.ssh\hostinger_quiz_platform_ed25519.pub"
```

## Verify

```powershell
ssh -i "$env:USERPROFILE\.ssh\hostinger_quiz_platform_ed25519" deploy@72.61.115.49
```

Only after this works should root SSH password access be disabled.
