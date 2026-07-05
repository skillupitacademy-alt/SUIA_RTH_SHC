# Users And Permissions

Status: planning instructions only.

## Deploy User

Use a non-root deploy user for application operations.

Candidate:

```bash
adduser deploy
usermod -aG docker deploy
```

Do not run routine deployments as `root`.

## Directory Ownership

Target:

```text
/opt/platform
```

Recommended ownership:

```bash
chown -R deploy:deploy /opt/platform
```

Certificate private keys may remain `root:root` with read-only mount access to the Nginx container.

## SSH

Recommended:

- disable password login after SSH keys are configured
- keep root SSH disabled for routine operations
- allow only required administrators

Do not make these changes until console recovery access is confirmed in Hostinger.
