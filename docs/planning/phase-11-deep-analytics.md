# Implementation Plan - Phase 11: Deep Analytics (Materialized Views & Trend Prediction)

## 🎯 Objectives
- **Zero-Latency Reporting**: Transition heavy analytical queries from primary tables to Materialized Views.
- **Predictive Intelligence**: Implement "Velocity-Based" learning forecasts to predict when students will reach professional mastery.
- **Absolute Zero Compliance**: Ensure 100% type safety and zero lint warnings during implementation.

## 🛠 Architectural Changes

### 1. Database Layer (Postgres Materialized Views)
We will introduce two primary materialized views to decouple analytics from transactional tables:
- `mv_mastery_matrix`: Pre-aggregated accuracy and attempt counts grouped by (DimensionType, DimensionId).
- `mv_user_daily_snapshots`: Daily accuracy snapshots per user per skill to power trend calculation.

### 2. Analytics Refresh Worker
A background job will handle the periodic refresh of these views to ensure the main application remains responsive.
- **Job Type**: `ANALYTICS_REFRESH`
- **Cadence**: Every 30 minutes (configurable via env).

### 3. Intelligence Layer (TrendsService)
Enhance `TrendsService` with predictive logic:
- **Linear Velocity**: Calculate `(CurrentAccuracy - PreviousAccuracy) / DaysBetweenHits`.
- **Mastery Forecast**: Predict `(TargetAccuracy - CurrentAccuracy) / Velocity` to estimate "Days to Mastery".

## 🚀 Execution Phases

### Phase 1: Database Migration (SQL)
- [ ] Create raw SQL migration for `mv_mastery_matrix`.
- [ ] Create raw SQL migration for `mv_user_daily_snapshots`.
- [ ] Add `refresh_analytics` job type to metadata.

### Phase 2: Orchestration
- [ ] Add `JobType.ANALYTICS_REFRESH` to `@quiz/types`.
- [ ] Implement `JobOrchestrator.handleAnalyticsRefresh` using `sql` raw templates.
- [ ] Add a visual "Refresh Now" button to the Admin Analytics HUD.

### Phase 3: Service Refactoring
- [ ] Update `AdminAnalyticsEngine.getPerformanceAnalytics` to query `mv_mastery_matrix`.
- [ ] Update `TrendsService.getSkillTrends` to query `mv_user_daily_snapshots`.

### Phase 4: Prediction Implementation
- [ ] Implement `PredictionService.calculateForecast(userId, skillId)`.
- [ ] Update UI reports to display "Predicted Mastery: June 15th" style badges.

## 🛡 Manifesto Compliance Guards
- **Type Safety**: All materialized view rows MUST be mapped to Zod schemas.
- **Boundary Validation**: Add guards in `TrendsService` for users with < 3 attempts (preventing wild fluctuations).
- **Performance**: Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid locking the database.

## 📈 Verification Plan
- **Performance Test**: Assert that `getPerformanceAnalytics` returns in < 100ms for simulated 100k rows.
- **Unit Test**: Assert forecast logic with mock data (0% -> 50% in 5 days should predict 90% in 4 more days).
