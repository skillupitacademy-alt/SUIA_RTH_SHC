# Exact R5 changed source paths

Starting HEAD7f8c952a5a19b0e1ca04c4ed307b1a8c7abefc86. All changes are local.

| Path | Reason |
| --- | --- |
| apps/api-server/src/app/api/admin/hierarchy/sync/__tests__/route.test.ts | Provide complete current-brand fixture and preserve missing-brand denial |
| apps/api-server/src/app/api/auth/profile/route.ts | Prevent client-controlled ownership/persistence fields in profile updates and verify both existing aliases |
| apps/api-server/src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts | Existing signed worker bounded request validation and truthful HTTP outcomes, with regression tests |
| apps/api-server/src/app/api/workers/retry-hierarchy-sync/route.ts | Existing signed worker bounded request validation and truthful HTTP outcomes, with regression tests |
| apps/api-server/src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts | Replace removed-column assertions with current mapping, rollback, summary and reconciliation behavior |
| apps/api-server/src/modules/hierarchy/hierarchy-sync.service.ts | Existing-service current-state drift discovery/repair, active/deleted safety, post-commit verification and honest sync outcome |
| apps/realtutorialhub-web/src/app/api/tutorial/progress/__tests__/route.test.ts | Forward the exact device cookie pair and CSRF proof, with regression checks |
| apps/realtutorialhub-web/src/app/api/tutorial/progress/route.ts | Forward the exact device cookie pair and CSRF proof, with regression checks |
| apps/realtutorialhub-web/src/app/api/tutorial/projects/submissions/route.ts | Prevent storage of private learner list responses |
| apps/realtutorialhub-web/src/app/api/tutorial/sessions/__tests__/routes.test.ts | Require private no-store for the existing owner-scoped request list |
| apps/realtutorialhub-web/src/app/api/tutorial/sessions/my-requests/route.ts | Prevent storage of private learner list responses |
| apps/skillup-web/src/app/api/tutorial/progress/route.test.ts | Forward the exact device cookie pair and CSRF proof, with regression checks |
| apps/skillup-web/src/app/api/tutorial/progress/route.ts | Forward the exact device cookie pair and CSRF proof, with regression checks |
| src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts | Permit two exact existing authenticated browser reads through current-session boundary and retain anonymous negatives |
| src/share-branding/middleware/authProxy.ts | Permit two exact existing authenticated browser reads through current-session boundary and retain anonymous negatives |
| apps/api-server/src/app/api/auth/profile/__tests__/ownership.test.ts | Prevent client-controlled ownership/persistence fields in profile updates and verify both existing aliases |
| apps/api-server/src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts | Real PostgreSQL, race, rollback, partial completion, bounded-page and signed HTTP verification |
