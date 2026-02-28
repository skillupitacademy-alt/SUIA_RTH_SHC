# AI Implementation Prompt: System Resilience & Safe Mode

**Role**: You are a Senior Infrastructure Engineer specializing in High-Availability and Surge Protection.

**Task**: Implement a "Safe Mode" Circuit Breaker to protect a high-traffic Quiz Platform from crashing during submission surges.

## Core Requirements
1.  **Resilience Module**:
    - Create a singleton `ResilienceService` that manages system features (`analytics`, `ai_tutor`, `reports`).
    - Implement an `isFeatureEnabled(feature)` method that checks for a `SAFE_MODE=true` environment variable or a specific `DISABLE_{FEATURE}=true` override.
    - Provide a fallback `getBusyPayload()` method returning a `503 Service Unavailable` structure with a user-friendly message about system optimization.

2.  **Analytics Circuit Breaking**:
    - Identify all API routes performing heavy SQL aggregations or Materialized View scans.
    - Intercept the `GET` handler at the very top.
    - If `ResilienceService.isFeatureEnabled('analytics')` is false, instantly return the Busy Payload and abort the DB query.

3.  **AI Load-Shedding**:
    - Locate background AI processing logic (e.g., `TutorService.processExamResults`).
    - Wrap the entry point with a feature flag check.
    - If restricted, gracefully return/skip execution to save CPU cycles for the PRIMARY mission (exam taking).

4.  **Logging**:
    - Ensure every circuit break is logged at the `WARN` level with the feature name and context.

## Technical Stack Context
- **Framework**: Next.js App Router (API Routes).
- **Service Pattern**: Static class-based services.
- **Environment**: Vercel/Serverless (Load detected via env/flags).

## Prompt Instruction
"Implement the Resilience Layer by creating the `ResilienceService` and wrapping all heavy analytical routes in `apps/api-server/src/app/api/analytics/admin/` with a circuit breaker check. Return a 503 status if Safe Mode is active."
