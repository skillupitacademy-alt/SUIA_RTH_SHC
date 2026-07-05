# Fail2Ban Policy

Status: implementation template.

## Scope

Enable Fail2Ban for:

- SSH authentication failures.
- Nginx excessive 404/403 probing.
- Nginx bot and bad request spikes.

## Baseline Settings

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 10m
bantime = 1h
```

Nginx jails should be enabled only after confirming Nginx log paths on the VPS.

## Verify

```bash
sudo systemctl status fail2ban --no-pager
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Do not test by intentionally locking out the active production operator.
