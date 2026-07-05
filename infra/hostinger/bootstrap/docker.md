# Docker Installation Plan

Status: planning instructions only.

## Docker Engine

Use Docker's official Ubuntu repository for Ubuntu 24.04.

Candidate flow:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Verification

```bash
docker --version
docker compose version
docker info
systemctl status docker
```

## Operational Rule

No app container should publish host ports. `infra/hostinger/scripts/verify.sh` is designed to check this later.
