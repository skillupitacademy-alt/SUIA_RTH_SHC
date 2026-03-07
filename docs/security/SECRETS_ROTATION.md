# Secrets Rotation Strategy (Task 45)

> **Owner**: Security Operations | **Criticality**: HIGH | **Status**: ACTIVE

## 1. Overview
This document outlines the mandatory strategy for rotating secrets in the Quiz Platform to minimize the impact of credential leakage and ensure long-term security.

## 2. Secrets Inventory
| Category | Examples | Rotation Interval |
|---|---|---|
| **Database** | `DATABASE_URL`, `DATABASE_URL_REPLICA` | 90 Days |
| **Auth** | `JWT_SECRET`, `REFRESH_TOKEN_SECRET` | 180 Days |
| **Cloud** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | 90 Days |
| **Internal API** | `API_SECRET_KEY`, `RESEND_API_KEY` | 90 Days |

## 3. Rotation Procedures

### 3.1 DB Secrets (Neon/Postgres)
1. **Provision New Credential**: Create a new user or password in the Neon Console.
2. **Update App Configuration**: Add the new credential as a primary/fallback connection string in Vercel/Platform environment variables.
3. **Deploy**: Trigger a redeploy to ensure all instances use the new credential.
4. **Monitor**: Check DB pool metrics to ensure no active sessions remain on the old user.
5. **Revoke Old Credential**: Delete the old user/password from Neon after 24 hours of successful operation.

### 3.2 JWT Secrets
1. **Hybrid Period**: Maintain the old `JWT_SECRET` in a fallback variable if the system supports multiple keys.
2. **Key Swap**: Update `JWT_SECRET` in environment variables.
3. **Forced Logout (Optional)**: If the system does not support rolling keys, rotating this will invalidate all active sessions. Coordinate with Maintenance Windows.

### 3.3 AWS Keys
1. **Create New IAM Access Key**: Do NOT delete the old one yet.
2. **Update Environment Variables**: Replace `AWS_SECRET_ACCESS_KEY` in Vercel.
3. **Deploy & Verify**: Test S3 uploads/PDF generation.
4. **Deactivate Old Key**: Disable the old key in AWS IAM.
5. **Delete Old Key**: Remove after 48 hours of zero usage.

## 4. Emergency Rotation
In the event of a suspected leak:
1. Revoke the secret immediately at the source (Cloud Console/DB).
2. Update environment variables.
3. Execute `Close All Sessions` (Clear Redis cache).
4. Perform Audit Log review to identify potential malicious activity.
