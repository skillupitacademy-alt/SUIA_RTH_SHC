-- Owner-approved empty-table alignment, 12 November 2026.
-- Execute only through the guarded companion runner in .evidence/continuation-20261112/.
-- This patch is outside the unresolved historical Drizzle migration sequence.
-- The runner locks, verifies the exact prior schema and zero rows, and supplies the transaction.
ALTER TABLE public.tutorial_progress
  ADD COLUMN tenant_id text NOT NULL;
ALTER TABLE public.tutorial_progress
  ADD CONSTRAINT tutorial_progress_tenant_allowed
  CHECK (tenant_id IN ('skillup', 'realtutorialhub', 'skillhubcore'));
CREATE INDEX idx_tutorial_progress_tenant
  ON public.tutorial_progress (tenant_id);
CREATE UNIQUE INDEX uq_tutorial_progress_tenant_user_subtopic
  ON public.tutorial_progress (tenant_id, user_id, subtopic_id);
DROP INDEX public.uq_tutorial_progress_user_subtopic;
