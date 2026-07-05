# VPS Bootstrap Execution Checklist

Status: approved bootstrap sequence. Execute on the VPS only after SSH access is confirmed.

## Hard Scope

This phase builds the VPS foundation only.

Do not:

- clone the repository
- run Docker Compose
- build images
- change Cloudflare
- change DNS
- copy production `.env`
- delete Cloud Run

## Step 1: Verify VPS

```bash
hostnamectl
cat /etc/os-release
free -h
df -h
lscpu
```

Record:

- Ubuntu version
- CPU
- RAM
- disk
- hostname

## Step 2: Update Ubuntu

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt autoremove -y
sudo reboot
```

Reconnect after reboot.

## Step 3: Set Timezone

```bash
sudo timedatectl set-timezone Asia/Kuala_Lumpur
timedatectl
```

## Step 4: Create Deploy User

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

Optional later:

```bash
sudo adduser ops
sudo usermod -aG sudo ops
```

Use `deploy` for deployments and introduce `ops` later for day-to-day administration if needed.

## Step 5: SSH Keys

Copy your SSH public key to the VPS for `deploy`, then verify:

```bash
ssh deploy@72.61.115.49
```

Only consider disabling root SSH after key login and console recovery are confirmed.

## Step 6: Firewall

```bash
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Expected public ports: `22`, `80`, `443`.

## Step 7: Install Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

## Step 8: Install Git

```bash
sudo apt install git -y
git --version
```

## Step 9: Install Docker

Use Docker's official Ubuntu repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
docker --version
docker compose version
sudo usermod -aG docker deploy
```

Log out and back in so Docker group membership takes effect.

## Step 10: Create Directory Layout

```bash
sudo mkdir -p /opt/platform/{apps,backups,compose,docker,env,logs,monitoring,nginx,operations,scripts,ssl}
sudo chown -R deploy:deploy /opt/platform
```

## Step 11: Install System Packages

```bash
sudo apt install -y curl wget jq unzip zip nano vim htop tree net-tools dnsutils ca-certificates gnupg software-properties-common
```

## Step 12: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
systemctl status nginx
```

Nginx package installation is only to verify host ingress and reserve ports. The later application design still uses reviewed Nginx configuration/templates.

## Step 13: Log Rotation

Confirm logrotate is installed:

```bash
logrotate --version
```

If missing:

```bash
sudo apt install logrotate -y
```

Ensure `/opt/platform/logs` exists:

```bash
mkdir -p /opt/platform/logs
```

## Step 14: Verify Ports

```bash
sudo ss -tulpn
```

Expected listeners:

- `22`
- `80`
- `443`

Investigate anything else before continuing.

## Step 15: Create 2 GB Swap

Recommended for an 8 GB RAM VPS:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## Step 16: Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Step 17: Snapshot

Take a Hostinger VPS snapshot before app deployment if the plan includes snapshots.

## Acceptance Criteria

- Ubuntu fully updated.
- VPS rebooted successfully after updates.
- Timezone is `Asia/Kuala_Lumpur`.
- `deploy` user exists and has sudo.
- SSH key login works for `deploy`.
- Docker installed.
- Docker Compose installed.
- Nginx running.
- UFW enabled with only `22`, `80`, `443` public.
- Fail2Ban running.
- `/opt/platform` directory structure exists.
- 2 GB swap enabled.
- Unattended security upgrades enabled.
- Snapshot taken or explicitly skipped.
