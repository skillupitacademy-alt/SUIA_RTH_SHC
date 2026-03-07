# Secrets Rotation Strategy

This document outlines the standard operating procedures (SOP) for rotating critical cryptographic keys and credentials in the Quiz Platform without causing system downtime.

## 1. JWT Secret Rotation (`JWT_SECRET`)

The JWT secret is used to sign all user and admin session tokens. Rotating this secret immediately invalidates all active sessions.

**Zero-Downtime Rotation Procedure:**
1. **Preparation**: Update the authentication service to support multiple valid secrets by utilizing a `JWT_SECRETS` JSON array or parsing comma-separated secrets in `process.env.JWT_FALLBACK_SECRETS`.
2. **Current State**: The system uses `Secret A` for signing and verification.
3. **Transition**: 
   - Deploy an update adding the new `Secret B` as the primary signing key, while retaining `Secret A` as a fallback verification key.
   - Wait for the maximum token TTL (e.g., 24 hours) to expire. All active users will naturally receive new tokens signed with `Secret B` as they refresh.
4. **Finalization**: Deploy an update removing `Secret A` completely from the environment variables.

## 2. Database Credential Rotation (`DATABASE_URL`)

Rotating the database credentials requires coordination with the Vercel deployments and the internal Drizzle ORM clients.

**Zero-Downtime Rotation Procedure:**
1. **Provisioning**: Create a new database user/password in the PostgreSQL provider (e.g., Supabase, Neon) with identical privileges. Keep the old user active.
2. **Update Secrets**: Update the `DATABASE_URL` environment variables in Vercel to use the new credentials.
3. **Deployment**: Trigger a rolling production deployment on Vercel. 
4. **Observation**: Monitor the application for 10-15 minutes to verify all new serverless connections are successfully using the new credentials.
5. **Revocation**: Delete the old database user from the PostgreSQL provider.

## 3. Third-Party Service Credentials (Resend, Redis, etc.)

**Procedure:**
1. Generate the new API key in the provider's dashboard.
2. Update the environment variables in Vercel.
3. Trigger a production redeployment.
4. Once the deployment is live, immediately revoke the old API key in the provider's dashboard to prevent unauthorized fallback usage.

## Emergency Compromise Response
If a secret is definitively compromised, **skip the zero-downtime procedures**. Instantly revoke the secret at the provider level, push the new secrets to Vercel, and force a redeployment. This will cause a brief outage and require all users to re-authenticate, but is necessary for immediate containment.
