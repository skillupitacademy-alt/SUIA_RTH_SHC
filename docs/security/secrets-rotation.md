# Secrets Rotation Policy & Procedure (Task 45)

This document outlines the standard operating procedure (SOP) for rotating sensitive secrets within the Quiz Platform to maintain a high security posture.

## 1. Secrets Inventory

The following categories of secrets require periodic rotation:

| Category | Key/Secret Name | Rotation Frequency |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL`, `DATABASE_URL_REPLICA` | Every 90 days or on personnel change |
| **Authentication** | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_JWT_SECRET` | Every 180 days |
| **Third-Party** | `SENTRY_DSN`, `CLERK_SECRET_KEY`, `RESEND_API_KEY` | Yearly or on suspected leak |
| **Infrastructure** | `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_REST_TOKEN` | Yearly |

## 2. Rotation Procedures

### 2.1 Database Credentials (Neon)
1. Log in to the Neon Console.
2. Select the relevant project and branch.
3. Generate a new password for the database role.
4. Update the `DATABASE_URL` in the Vercel Project Settings for all affected apps (`api-server`, `web-app`, `admin-app`).
5. Trigger a redeploy of all apps to pick up the new secret.

### 2.2 JWT Secrets
> [!WARNING]
> Rotating JWT secrets will immediately invalidate all active user sessions, forcing all users to log in again.

1. Generate a new 32+ character random string (e.g., using `openssl rand -base64 32`).
2. Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in Vercel environment variables.
3. Redeploy the `api-server`.

### 2.3 Third-Party API Keys (Resend, Sentry)
1. Generate a new API key in the provider's dashboard.
2. Update the corresponding variable in Vercel.
3. Verify the new key works by checking logs for successful operations.
4. Revoke the old API key in the provider's dashboard.

## 3. Incident Response (Suspected Leak)
If a secret is suspected to be compromised:
1. **Immediately** rotate the compromised secret following the procedures above.
2. Review audit logs (`idempotency_keys`, `login_attempts`) for any suspicious activity during the window of compromise.
3. Document the incident and the remediation steps taken.
