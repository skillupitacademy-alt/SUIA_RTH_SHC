# Email Delivery Documentation

## Overview
The Quiz Platform uses an abstracted email delivery system to handle transactional emails. It supports multiple providers, determined by environment configuration.

## Providers

### 1. Mock Provider
- **Env**: `EMAIL_PROVIDER=mock`
- **Behavior**: Instead of sending a real email, current reset links and tokens are logged directly to the server console.
- **Use Case**: Development, local testing, and CI.

### 2. Resend Provider
- **Env**: `EMAIL_PROVIDER=resend`
- **Behavior**: Uses the official Resend SDK to dispatch real emails.
- **Use Case**: Production, staging, and live user testing.

## Environment Configuration
The following variables in `.env.local` control email behavior:

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | `mock` or `resend` | `resend` |
| `RESEND_API_KEY` | Your Resend API Secret | `re_123...` |
| `EMAIL_FROM` | The sender address | `QuizPlatform <noreply@yourdomain.com>` |
| `APP_BASE_URL` | Base URL for reset links | `http://localhost:3001` or `https://app.com` |

## Security & Reliability
- **Neutrality**: Failures in the email delivery layer should NOT reveal account existence to the frontend.
- **Idempotency**: Retries should be handled gracefully by the provider implementation or an external queue (future goal).
- **Redaction**: Personal identifiers should be redacted from server-side failure logs.
- **Expirations**: All emailed links are time-bound (default 30 minutes) and single-use.

## Governance
Modified by: Antigravity
Last Updated: 2026-01-25
Status: STABILIZED
