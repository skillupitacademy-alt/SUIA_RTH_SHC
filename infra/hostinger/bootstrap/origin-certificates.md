# Origin Certificate Bootstrap

Status: planning instructions only.

## Source

Generate the certificate in Cloudflare. Do not generate or store real private keys in this repository.

## Target Paths

```text
/opt/platform/nginx/certs/cloudflare-origin.pem
/opt/platform/nginx/certs/cloudflare-origin.key
```

## Permissions

```bash
chown root:root /opt/platform/nginx/certs/cloudflare-origin.pem
chown root:root /opt/platform/nginx/certs/cloudflare-origin.key
chmod 0644 /opt/platform/nginx/certs/cloudflare-origin.pem
chmod 0600 /opt/platform/nginx/certs/cloudflare-origin.key
```

## Coverage

Review `infra/hostinger/nginx/cloudflare-origin-certs.md` before generating the certificate.

## Validation

Before cutover:

- certificate files exist
- private key permissions are restricted
- certificate covers selected hostnames
- Cloudflare SSL mode is Full (Strict)
