# Load Test Strategy

Goal
- Validate that the platform can handle extreme concurrency without errors or timeouts.

Tools
- k6 or Locust for HTTP load.
- Custom data seeding scripts.

Scenarios
- Login and refresh flow.
- Start exam and fetch questions.
- Autosave answers at intervals.
- Submit exam and fetch results.

Targets
- Launch p95 <= 300ms under peak load.
- Autosave p95 <= 200ms under peak load.
- Submit p95 <= 800ms under peak load.

Test data
- Preload question bank and blueprints.
- Use synthetic users and sessions.

Minimal scripts (what to generate first)
- login_flow.js: signup/login/refresh cycle.
- exam_flow.js: start exam -> answer -> submit -> result.
- autosave_flow.js: periodic answer saves while session active.

Pass criteria
- Error rate <= 0.5% for critical endpoints.
- No queue backlog over 2 minutes.
- DB CPU and IO within safe thresholds.
