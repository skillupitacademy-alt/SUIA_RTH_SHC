# Quiz Platform AI Memory

## Platform Identity
- Monorepo: one Turborepo workspace for the 3-platform EdTech ecosystem.
- Brands: RealTutorialHub and SkillUp IT Academy.
- Platform brain: SkillHubCore for SSO, subscriptions, and cross-brand identity.
- Existing exam engine is complete and must not be broken.

## Current Window Focus
- Window 2: Tutorial Engine.
- Sprint 0 scope: root CLAUDE.md, `packages/auth`, `packages/events`, `packages/db-tutorial`, and tutorial DTO types.
- TutorialSubtopicPage design is locked to Aesthetic Maverick (Version A).
- Do not restore compare mode or reference Logic Legend / Version B in tutorial UI work.
- Glass cards, backdrop blur, and gradient page background are mandatory for tutorial cards.

## Non-Negotiable Architecture
- One monorepo, separate Neon database per service.
- Shared packages live under `packages/*`.
- Services communicate via QStash events or authenticated REST, never direct cross-database SQL.
- Repository pattern for all DB access.
- Constructor injection for services and repositories.
- DTOs at API boundaries, never raw DB rows.
- Structured logging with Pino.
- Zod validation at every public API boundary.
- Cache-control headers on read-only endpoints.
- WCAG 2.1 AA for all UI work.

## Sprint 0 Rules
- Create and use `@quiz/auth`, `@quiz/events`, `@quiz/db-tutorial`, and tutorial DTO types.
- `packages/auth` owns shared JWT and password logic.
- `packages/events` owns QStash event names, Zod payload schemas, and consumer helpers.
- `packages/db-tutorial` owns the tutorial DB client and schema definitions.
- `packages/types` exports `TutorialContentJSON` and related DTO types.

## Quality Gates
- Keep the existing exam engine green.
- Add tests with new shared code.
- Prefer small, reversible changes.
- Do not introduce new console logging.

## File Ownership Notes
- Do not modify `apps/api-server`, `apps/web-app`, or `apps/admin-app` unless required to wire shared packages.
- Do not touch any exam-engine behavior unless explicitly requested.
