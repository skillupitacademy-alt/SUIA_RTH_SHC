-- BLOCKED: provenance-aware migration and rollout require Sol disposition.
-- No historical row may be assigned a tenant by default.
DO $$ BEGIN RAISE EXCEPTION 'FND03 migration blocked pending provenance review'; END $$;
