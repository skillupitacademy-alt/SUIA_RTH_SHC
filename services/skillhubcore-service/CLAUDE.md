# SkillHubCore Service

Scope:
- `services/skillhubcore-service/`
- `packages/db-people/`
- `apps/skillhubcore-admin/` later

Rules:
- Follow FAANG compliance rules from the window 3 compliance doc.
- Use repository pattern and constructor injection.
- Use Pino for structured logging.
- Validate all route inputs with Zod.
- Use `db.transaction()` for multi-step writes.
- Use soft deletes only.
- Do not touch Window 2 apps.

Runtime:
- Hono on Node.js
- Deploy to GCP Cloud Run in `asia-south1`
- Domain: `api.skillhubcore.in`

Package names:
- `@quiz/skillhubcore-service`
- `@quiz/db-people`
