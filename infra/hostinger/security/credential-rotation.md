# Credential Rotation Checklist

Status: required before final production sign-off.

Rotate any credential that was pasted into chat, stored in shell history, or used during manual migration.

## Rotate Immediately

- Cloudflare API token used for DNS, Origin CA, and Worker deploys.
- Root SSH password.
- Any temporary SSH private key passphrase shared during setup.
- Grafana admin password before monitoring is started.

## Rotate After Validation

- Deployment user SSH keys.
- Cloudflare Origin Certificate if the private key was copied outside the VPS.
- Any environment variables that were copied through temporary files or manual shell commands.

## Rules

- Do not commit secrets to the repository.
- Store replacement secrets in the provider vault or local password manager.
- Prefer narrow-scope Cloudflare tokens:
  - Zone DNS edit for cutover scripts.
  - Workers deploy for Worker releases.
  - Origin CA only when generating certificates.
- Delete temporary local certificate/key material after confirming the VPS copy and backup are valid.

## Evidence To Record

| Credential | Rotated By | Date | Notes |
| --- | --- | --- | --- |
| Cloudflare API token |  |  |  |
| Root SSH password |  |  |  |
| Deploy SSH key |  |  |  |
| Grafana admin password |  |  |  |
