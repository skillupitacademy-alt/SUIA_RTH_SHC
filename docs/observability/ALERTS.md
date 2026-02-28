# Phase 1 Alert Definitions

These alerts are designed for the first rollout stage. They focus on the **Golden Transactions** and critical error rates.

## Critical Alerts (P0)
*Trigger: Immediate notify (e.g., Slack/PagerDuty)*

1. **Global Error Rate High**
   - **Condition**: `sum(rate(quiz_api_failure_count[5m])) / sum(rate(quiz_api_success_count[5m])) > 0.05`
   - **Reason**: More than 5% of all traffic is failing.

2. **Exam Submission Failure**
   - **Condition**: `rate(quiz_api_submit_failure_count[2m]) > 1`
   - **Reason**: Users are unable to finish their exams. Data loss risk.

3. **Login Availability P0**
   - **Condition**: `rate(auth_login_failure_count[5m]) > 5` (where reason != 'credentials_invalid')
   - **Reason**: Major auth outage.

## Performance Alerts (P1)
*Trigger: Notify (Work hours)*

1. **Slow Quiz MCQ Start (p95)**
   - **Condition**: `p95(quiz_api_start_duration_ms) > 1500` for 5 consecutive minutes.
   - **Reason**: User experience degraded during high-intent action.

2. **Admin Dashboard Slow**
   - **Condition**: `p95(dashboard_get_metadata_duration_ms) > 3000`
   - **Reason**: Admin visibility blocked.

## SLO Baseline
| Transaction | Metric | Target |
|-------------|--------|--------|
| Auth Login | Latency | 99.9% < 500ms |
| Quiz Start | Latency | 99.95% < 800ms |
| Quiz Submit | Latency | 99.99% < 1000ms |
| Report View | Latency | 99.9% < 600ms |
| Admin Upload| Success | 95% Success Rate |
