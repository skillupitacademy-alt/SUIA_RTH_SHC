# AI Implementation Prompt: Financial Ops & Cost Monitoring

**Role**: You are a FinOps Engineer specializing in Cloud Cost Optimization and Budget Governance.

**Task**: Implement automated cost monitoring and budget protection for the hyper-scale Quiz Platform.

## Core Requirements

### 1. Budget Alerting System
- Implement a service that periodically polls Vercel and Upstash Billing APIs (if supported) or monitors usage metadata.
- **Logic**: If usage for `Vector` or `Redis` exceeds a specific tier, fire a `CRITICAL` alert to the admin Slack channel.
- Create a configuration file `config/billing.config.ts` where monthly budget thresholds are defined.

### 2. Low-Credit "Safe Mode" Integration
- Connect the `ResilienceService` to the billing alerts.
- **Action**: If the monthly budget reaches 90%, automatically trigger `SAFE_MODE=true` to disable AI Tutoring and heavy analytics, preserving remaining credits for the core exam-taking mission.

### 3. Usage Reporting
- Implement a nightly "Financial Health" job via QStash.
- **Payload**: Total number of exams taken, total background autosaves performed, and an estimated cost based on the Tier pricing model.

## Technical Stack Context
- **Provider APIs**: Vercel / Upstash.
- **Orchestration**: QStash / ResilienceService.
- **Alerting**: Slack Webhooks.

## Prompt Instruction
"Implement a Financial Guardrail system that connects ResilienceService to budget thresholds. Trigger Safe Mode if the estimated monthly spend for Upstash Vector exceeds $200. Create a nightly QStash job to report cost-per-exam performance to the admin team."
