# Resilience Layer: System Circuit Breaker (Safe Mode)
*Phase 9: High-Load Mission Protection*

## 📜 Architectural Objective
To protect the "Core Mission" (Students taking exams) by providing a mechanism to instantly shed non-critical system load (AI, Analytics, Notifications) during extreme traffic surges (100k+ concurrent requests).

## 🏗️ Technical Implementation

### 1. The Resilience Service
The `ResilienceService` acts as a global feature toggle. It provides a centralized check for feature availability based on system health or manual intervention.
- **Key Methods**:
    - `isFeatureEnabled(feature)`: Returns `boolean` based on environment/Redis flags.
    - `getBusyPayload(feature)`: Standardized JSON response for throttled services.

### 2. Circuit Breaker Patterns
We implemented the **"Circuit Breaker"** pattern across the heavy analytics engine.
- **Normal State (Closed)**: All requests flow through to data processing (Materialized Views/DB).
- **Surge State (Open)**: Requests are intercepted at the API layer; the DB is never hit.
- **Trigger**: Activated by setting `SAFE_MODE=true` or `DISABLE_ANALYTICS=true`.

### 3. Service Wrapping
- **Admin Analytics**: Wraps 7 Materialized View routes to prevent "Red-lining" the database.
- **Tutor Service**: Wraps post-exam AI analysis to prevent background processing from competing for CPU cycles with active exams.

## 🛡️ Resilience Checklist
- [x] Create `ResilienceService` for feature flagging.
- [x] Implement standard `503 Service Busy` response logic.
- [x] Integrate circuit breakers into `apps/api-server/src/app/api/analytics/admin/**/*`.
- [x] Integrate circuit breaker into `TutorService.processExamResults`.
- [x] Define environment variables for manual and automated toggling.

---

## 📈 Operational Impact
Implementing this layer ensures that even if 1,000,000 students hit the platform at exactly 10:00 AM, the system can gracefully "turn off" the beautiful charts and AI assistant to prioritize the **$0.00 downtime** of the actual examination.
