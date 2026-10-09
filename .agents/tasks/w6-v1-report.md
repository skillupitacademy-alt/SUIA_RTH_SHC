# API Contract Verification Report

**Script**: verify-api-contract.py  
**Timestamp**: 2026-10-09T15:42:56.518682  
**Status**: FAIL

## Summary

- **Endpoints Found**: 320
- **Auth Coverage**: 47/320 (14.7%)
- **Issues**: 20

## Discovered Endpoints

| Method | Path | Framework | Auth | File |
|--------|------|-----------|------|------|
| POST | /register | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /login | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /admin/login | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /refresh | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /callback/validate | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /logout | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| GET | /me | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| GET | /sessions | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| DELETE | /sessions/:id | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| DELETE | /sessions | hono | ✓ | services\skillhubcore-service\src\modules\auth\auth.routes.ts |
| POST | /user-registered | hono | ✗ | services\skillhubcore-service\src\modules\events\skillhubcore-events.routes.ts |
| POST | /payment-received | hono | ✗ | services\skillhubcore-service\src\modules\events\skillhubcore-events.routes.ts |
| GET | /domains | hono | ✓ | services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts |
| GET | /subjects | hono | ✓ | services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts |
| GET | /topics | hono | ✓ | services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts |
| GET | /subtopics | hono | ✓ | services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts |
| POST | /subtopics | hono | ✓ | services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts |
| GET | /content/:brandId | hono | ✗ | services\skillhubcore-service\src\modules\marketing\marketing.routes.ts |
| GET | /control-plane/:brandId | hono | ✗ | services\skillhubcore-service\src\modules\marketing\marketing.routes.ts |
| GET | /bootstrap/:brandId | hono | ✗ | services\skillhubcore-service\src\modules\marketing\marketing.routes.ts |
| GET | /courses | hono | ✗ | services\skillhubcore-service\src\modules\marketing\marketing.routes.ts |
| GET | /courses/:slug | hono | ✗ | services\skillhubcore-service\src\modules\marketing\marketing.routes.ts |
| GET | /:userId/platforms | hono | ✓ | services\skillhubcore-service\src\modules\auth\sso\sso.routes.ts |
| POST | /:userId/platforms | hono | ✓ | services\skillhubcore-service\src\modules\auth\sso\sso.routes.ts |
| GET | /api/batches | nextjs | ✓ | apps\skillup-web\src\app\api\batches\route.ts |
| GET | /api/faculty | nextjs | ✗ | apps\skillup-web\src\app\api\faculty\route.ts |
| GET | /api/healthz | nextjs | ✗ | apps\skillup-web\src\app\api\healthz\route.ts |
| POST | /api/onboarding | nextjs | ✗ | apps\skillup-web\src\app\api\onboarding\route.ts |
| GET | /api/profile | nextjs | ✗ | apps\skillup-web\src\app\api\profile\route.ts |
| PATCH | /api/profile | nextjs | ✗ | apps\skillup-web\src\app\api\profile\route.ts |
| GET | /api/programs | nextjs | ✗ | apps\skillup-web\src\app\api\programs\route.ts |
| GET | /api/tutorial/sections/[subtopicId] | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\sections\[subtopicId]\route.ts |
| GET | /api/tutorial/interactions/[type] | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\interactions\[type]\route.ts |
| POST | /api/tutorial/interactions/[type] | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\interactions\[type]\route.ts |
| POST | /api/tutorial/ils/active-time | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\active-time\route.ts |
| POST | /api/tutorial/ils/block-active-time | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\block-active-time\route.ts |
| POST | /api/tutorial/ils/block-completion | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\block-completion\route.ts |
| POST | /api/tutorial/ils/block-visit | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\block-visit\route.ts |
| POST | /api/tutorial/ils/complete-node | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\complete-node\route.ts |
| POST | /api/tutorial/ils/visit | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\visit\route.ts |
| GET | /api/tutorial/ils/subtopic/[subtopicId]/progress | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\subtopic\[subtopicId]\progress\route.ts |
| GET | /api/tutorial/ils/navigation/[nodeId] | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\ils\navigation\[nodeId]\route.ts |
| GET | /api/tutorial/content/[subtopicId] | nextjs | ✓ | apps\skillup-web\src\app\api\tutorial\content\[subtopicId]\route.ts |
| GET | /api/student/attendance | nextjs | ✓ | apps\skillup-web\src\app\api\student\attendance\route.ts |
| GET | /api/student/dashboard | nextjs | ✓ | apps\skillup-web\src\app\api\student\dashboard\route.ts |
| GET | /api/student/my-batch | nextjs | ✓ | apps\skillup-web\src\app\api\student\my-batch\route.ts |
| GET | /api/student/payments | nextjs | ✓ | apps\skillup-web\src\app\api\student\payments\route.ts |
| GET | /api/student/placement | nextjs | ✓ | apps\skillup-web\src\app\api\student\placement\route.ts |
| GET | /api/quiz/active | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\active\route.ts |
| POST | /api/quiz/answer | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\answer\route.ts |
| POST | /api/quiz/count | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\count\route.ts |
| GET | /api/quiz/result | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\result\route.ts |
| POST | /api/quiz/start | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\start\route.ts |
| GET | /api/quiz/state | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\state\route.ts |
| POST | /api/quiz/submit | nextjs | ✗ | apps\skillup-web\src\app\api\quiz\submit\route.ts |
| GET | /api/programs/[slug] | nextjs | ✗ | apps\skillup-web\src\app\api\programs\[slug]\route.ts |
| POST | /api/onboarding/session | nextjs | ✗ | apps\skillup-web\src\app\api\onboarding\session\route.ts |
| POST | /api/content-manager/add-section | nextjs | ✗ | apps\skillup-web\src\app\api\content-manager\add-section\route.ts |
| POST | /api/auth/forgot-password | nextjs | ✗ | apps\skillup-web\src\app\api\auth\forgot-password\route.ts |
| POST | /api/auth/login | nextjs | ✗ | apps\skillup-web\src\app\api\auth\login\route.ts |
| POST | /api/auth/logout | nextjs | ✗ | apps\skillup-web\src\app\api\auth\logout\route.ts |
| POST | /api/auth/placement-handoff | nextjs | ✗ | apps\skillup-web\src\app\api\auth\placement-handoff\route.ts |
| POST | /api/auth/refresh | nextjs | ✗ | apps\skillup-web\src\app\api\auth\refresh\route.ts |
| GET | /api/auth/reset-password | nextjs | ✗ | apps\skillup-web\src\app\api\auth\reset-password\route.ts |
| POST | /api/auth/reset-password | nextjs | ✗ | apps\skillup-web\src\app\api\auth\reset-password\route.ts |
| GET | /api/auth/sessions | nextjs | ✗ | apps\skillup-web\src\app\api\auth\sessions\route.ts |
| DELETE | /api/auth/sessions | nextjs | ✗ | apps\skillup-web\src\app\api\auth\sessions\route.ts |
| POST | /api/auth/signup | nextjs | ✗ | apps\skillup-web\src\app\api\auth\signup\route.ts |
| POST | /api/auth/verify-email | nextjs | ✗ | apps\skillup-web\src\app\api\auth\verify-email\route.ts |
| DELETE | /api/auth/sessions/[sessionId] | nextjs | ✗ | apps\skillup-web\src\app\api\auth\sessions\[sessionId]\route.ts |
| GET | /api/healthz | nextjs | ✗ | apps\skillup-admin\src\app\api\healthz\route.ts |
| GET | /api/admin/batches | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\batches\route.ts |
| POST | /api/admin/batches | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\batches\route.ts |
| GET | /api/admin/payments | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\payments\route.ts |
| POST | /api/admin/payments | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\payments\route.ts |
| GET | /api/admin/students | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\students\route.ts |
| POST | /api/admin/students | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\students\route.ts |
| GET | /api/admin/students/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\students\[id]\route.ts |
| PATCH | /api/admin/students/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\students\[id]\route.ts |
| POST | /api/admin/students/[id]/enroll | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\students\[id]\enroll\route.ts |
| POST | /api/admin/placement/jobs | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\placement\jobs\route.ts |
| GET | /api/admin/placement/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\placement\[id]\route.ts |
| POST | /api/admin/placement/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\placement\[id]\route.ts |
| GET | /api/admin/payments/export | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\payments\export\route.ts |
| GET | /api/admin/payments/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\payments\[id]\route.ts |
| PATCH | /api/admin/payments/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\payments\[id]\route.ts |
| GET | /api/admin/crm/enquiries | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\crm\enquiries\route.ts |
| POST | /api/admin/crm/enquiries | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\crm\enquiries\route.ts |
| PATCH | /api/admin/crm/enquiries/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\crm\enquiries\[id]\route.ts |
| PATCH | /api/admin/batches/[id] | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\batches\[id]\route.ts |
| GET | /api/admin/audit-log/export | nextjs | ✗ | apps\skillup-admin\src\app\api\admin\audit-log\export\route.ts |
| GET | /api/health | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\health\route.ts |
| GET | /api/tutorial-left-sidebar | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\route.ts |
| POST | /api/tutorial-left-sidebar | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\route.ts |
| GET | /api/tutorial-left-sidebar/hierarchy | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\hierarchy\route.ts |
| GET | /api/tutorial-left-sidebar/navigation-nodes | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\navigation-nodes\route.ts |
| POST | /api/tutorial-composer/analysis | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\analysis\route.ts |
| POST | /api/tutorial-composer/block-suggestions | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\block-suggestions\route.ts |
| POST | /api/tutorial-composer/import | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\import\route.ts |
| POST | /api/tutorial-composer/presentation-ideas | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\presentation-ideas\route.ts |
| GET | /api/tutorial-composer/sections | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\route.ts |
| POST | /api/tutorial-composer/sections | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\route.ts |
| GET | /api/tutorial-composer/sections/[sectionId] | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\route.ts |
| DELETE | /api/tutorial-composer/sections/[sectionId] | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\route.ts |
| PATCH | /api/tutorial-composer/sections/[sectionId] | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\route.ts |
| POST | /api/tutorial-composer/sections/[sectionId]/blocks | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\blocks\route.ts |
| POST | /api/tutorial-composer/sections/[sectionId]/publish | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\publish\route.ts |
| POST | /api/tutorial-composer/sections/[sectionId]/suggestions/apply | nextjs | ✓ | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\suggestions\apply\route.ts |
| GET | /api/marketing/control-plane/[brandId] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\marketing\control-plane\[brandId]\route.ts |
| GET | /api/marketing/collector/observability | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\marketing\collector\observability\route.ts |
| GET | /api/marketing/bootstrap/[brandId] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\marketing\bootstrap\[brandId]\route.ts |
| POST | /api/logs/client | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\logs\client\route.ts |
| POST | /api/factory/check-duplicates | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\factory\check-duplicates\route.ts |
| POST | /api/factory/save | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\factory\save\route.ts |
| POST | /api/auth/login | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\auth\login\route.ts |
| POST | /api/auth/logout | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\auth\logout\route.ts |
| GET | /api/auth/me | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\auth\me\route.ts |
| GET | /api/admin/blueprints | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\blueprints\route.ts |
| POST | /api/admin/blueprints | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\blueprints\route.ts |
| GET | /api/admin/domains | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\route.ts |
| POST | /api/admin/domains | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\route.ts |
| PUT | /api/admin/domains | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\route.ts |
| DELETE | /api/admin/domains | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\route.ts |
| GET | /api/admin/questions | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\route.ts |
| POST | /api/admin/questions | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\route.ts |
| GET | /api/admin/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\route.ts |
| POST | /api/admin/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\route.ts |
| PUT | /api/admin/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\route.ts |
| DELETE | /api/admin/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\route.ts |
| GET | /api/admin/subjects | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts |
| POST | /api/admin/subjects | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts |
| PUT | /api/admin/subjects | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts |
| DELETE | /api/admin/subjects | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts |
| GET | /api/admin/subtopics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts |
| POST | /api/admin/subtopics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts |
| PUT | /api/admin/subtopics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts |
| DELETE | /api/admin/subtopics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts |
| GET | /api/admin/topics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\route.ts |
| POST | /api/admin/topics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\route.ts |
| PUT | /api/admin/topics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\route.ts |
| DELETE | /api/admin/topics | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\route.ts |
| POST | /api/admin/topics/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\batch-delete\route.ts |
| DELETE | /api/admin/topics/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\[id]\route.ts |
| PATCH | /api/admin/topics/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\[id]\route.ts |
| GET | /api/admin/topics/[id]/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\[id]\skills\route.ts |
| POST | /api/admin/topics/[id]/skills | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\topics\[id]\skills\route.ts |
| POST | /api/admin/subtopics/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\batch-delete\route.ts |
| DELETE | /api/admin/subtopics/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\[id]\route.ts |
| PATCH | /api/admin/subtopics/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subtopics\[id]\route.ts |
| POST | /api/admin/subjects/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\batch-delete\route.ts |
| DELETE | /api/admin/subjects/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\[id]\route.ts |
| PATCH | /api/admin/subjects/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\subjects\[id]\route.ts |
| POST | /api/admin/skills/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\batch-delete\route.ts |
| DELETE | /api/admin/skills/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\[id]\route.ts |
| PATCH | /api/admin/skills/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\skills\[id]\route.ts |
| POST | /api/admin/questions/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\batch-delete\route.ts |
| POST | /api/admin/questions/bulk | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\bulk\route.ts |
| GET | /api/admin/questions/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\[id]\route.ts |
| DELETE | /api/admin/questions/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\[id]\route.ts |
| PATCH | /api/admin/questions/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\questions\[id]\route.ts |
| POST | /api/admin/domains/batch-delete | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\batch-delete\route.ts |
| DELETE | /api/admin/domains/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\[id]\route.ts |
| PATCH | /api/admin/domains/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\domains\[id]\route.ts |
| GET | /api/admin/blueprints/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\blueprints\[id]\route.ts |
| DELETE | /api/admin/blueprints/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\blueprints\[id]\route.ts |
| PATCH | /api/admin/blueprints/[id] | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\blueprints\[id]\route.ts |
| GET | /api/admin/auth/me | nextjs | ✗ | apps\skillhubcore-admin\src\app\api\admin\auth\me\route.ts |
| GET | /api/healthz | nextjs | ✗ | apps\skillhub-placement\src\app\api\healthz\route.ts |
| POST | /api/auth/handoff | nextjs | ✗ | apps\skillhub-placement\src\app\api\auth\handoff\route.ts |
| GET | /api/healthz | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\healthz\route.ts |
| POST | /api/onboarding | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\onboarding\route.ts |
| GET | /api/test-deployment | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\test-deployment\route.ts |
| POST | /api/workers/award-project-badge | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\award-project-badge\route.ts |
| POST | /api/workers/handle-exam-completed | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\handle-exam-completed\route.ts |
| POST | /api/workers/index-content-vector | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\index-content-vector\route.ts |
| POST | /api/workers/issue-certificate | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\issue-certificate\route.ts |
| POST | /api/workers/notify-session-accepted | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\notify-session-accepted\route.ts |
| POST | /api/workers/notify-session-requested | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\notify-session-requested\route.ts |
| POST | /api/workers/notify-session-scheduled | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\notify-session-scheduled\route.ts |
| POST | /api/workers/refresh-weak-areas-view | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\refresh-weak-areas-view\route.ts |
| POST | /api/workers/review-project | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\review-project\route.ts |
| POST | /api/workers/send-remediation-notification | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\send-remediation-notification\route.ts |
| POST | /api/workers/sync-hierarchy | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\workers\sync-hierarchy\route.ts |
| GET | /api/tutorial/remediation | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\remediation\route.ts |
| GET | /api/tutorial/sessions/my-requests | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\sessions\my-requests\route.ts |
| DELETE | /api/tutorial/sessions/[requestId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\sessions\[requestId]\route.ts |
| GET | /api/tutorial/sections/[subtopicId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\sections\[subtopicId]\route.ts |
| GET | /api/tutorial/remediation/[examResultId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\remediation\[examResultId]\route.ts |
| GET | /api/tutorial/projects/[projectId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\projects\[projectId]\route.ts |
| POST | /api/tutorial/progress/mark-complete | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\progress\mark-complete\route.ts |
| GET | /api/tutorial/interactions/[type] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\interactions\[type]\route.ts |
| POST | /api/tutorial/interactions/[type] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\interactions\[type]\route.ts |
| POST | /api/tutorial/ils/active-time | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\active-time\route.ts |
| POST | /api/tutorial/ils/block-active-time | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\block-active-time\route.ts |
| POST | /api/tutorial/ils/block-completion | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\block-completion\route.ts |
| POST | /api/tutorial/ils/block-visit | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\block-visit\route.ts |
| POST | /api/tutorial/ils/complete-node | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\complete-node\route.ts |
| POST | /api/tutorial/ils/visit | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\visit\route.ts |
| GET | /api/tutorial/ils/subtopic/[subtopicId]/progress | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\subtopic\[subtopicId]\progress\route.ts |
| GET | /api/tutorial/ils/navigation/[nodeId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\ils\navigation\[nodeId]\route.ts |
| GET | /api/tutorial/content/[subtopicId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\content\[subtopicId]\route.ts |
| POST | /api/tutorial/assignments/[subtopicId]/complete | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\assignments\[subtopicId]\complete\route.ts |
| POST | /api/tutorial/assignments/[subtopicId]/start | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\tutorial\assignments\[subtopicId]\start\route.ts |
| GET | /api/quiz/active | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\active\route.ts |
| POST | /api/quiz/answer | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\answer\route.ts |
| POST | /api/quiz/count | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\count\route.ts |
| GET | /api/quiz/result | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\result\route.ts |
| POST | /api/quiz/start | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\start\route.ts |
| GET | /api/quiz/state | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\state\route.ts |
| POST | /api/quiz/submit | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\quiz\submit\route.ts |
| POST | /api/onboarding/session | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\onboarding\session\route.ts |
| POST | /api/content-manager/add-section | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\content-manager\add-section\route.ts |
| GET | /api/certificates/verify/[verificationCode] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\certificates\verify\[verificationCode]\route.ts |
| POST | /api/auth/forgot-password | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\forgot-password\route.ts |
| POST | /api/auth/login | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\login\route.ts |
| POST | /api/auth/logout | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\logout\route.ts |
| POST | /api/auth/placement-handoff | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\placement-handoff\route.ts |
| POST | /api/auth/refresh | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\refresh\route.ts |
| GET | /api/auth/reset-password | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\reset-password\route.ts |
| POST | /api/auth/reset-password | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\reset-password\route.ts |
| GET | /api/auth/sessions | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\sessions\route.ts |
| DELETE | /api/auth/sessions | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\sessions\route.ts |
| POST | /api/auth/signup | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\signup\route.ts |
| POST | /api/auth/verify-email | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\verify-email\route.ts |
| DELETE | /api/auth/sessions/[sessionId] | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\auth\sessions\[sessionId]\route.ts |
| POST | /api/ai-tutor/query | nextjs | ✗ | apps\realtutorialhub-web\src\app\api\ai-tutor\query\route.ts |
| POST | /api/telemetry | nextjs | ✗ | apps\realtutorialhub-quiz\src\app\api\telemetry\route.ts |
| GET | /api/bff/exam-config | nextjs | ✗ | apps\realtutorialhub-quiz\src\app\api\bff\exam-config\route.ts |
| GET | /api/bff/quiz-hierarchy | nextjs | ✗ | apps\realtutorialhub-quiz\src\app\api\bff\quiz-hierarchy\route.ts |
| POST | /api/telemetry | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\telemetry\route.ts |
| POST | /api/tutorial/content | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\route.ts |
| GET | /api/tutorial/sessions/requests | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\sessions\requests\route.ts |
| PATCH | /api/tutorial/sessions/requests/[id]/accept | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\sessions\requests\[id]\accept\route.ts |
| PATCH | /api/tutorial/sessions/requests/[id]/complete | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\sessions\requests\[id]\complete\route.ts |
| PATCH | /api/tutorial/sessions/requests/[id]/schedule | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\sessions\requests\[id]\schedule\route.ts |
| POST | /api/tutorial/projects/submissions/[id]/approve | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\projects\submissions\[id]\approve\route.ts |
| POST | /api/tutorial/projects/submissions/[id]/request-revision | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\projects\submissions\[id]\request-revision\route.ts |
| GET | /api/tutorial/hierarchy/domains | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\hierarchy\domains\route.ts |
| GET | /api/tutorial/hierarchy/subjects | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\hierarchy\subjects\route.ts |
| GET | /api/tutorial/hierarchy/subtopics | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\hierarchy\subtopics\route.ts |
| GET | /api/tutorial/hierarchy/topics | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\hierarchy\topics\route.ts |
| GET | /api/tutorial/content/audit | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\audit\route.ts |
| GET | /api/tutorial/content/versions | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\versions\route.ts |
| GET | /api/tutorial/content/[id] | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\[id]\route.ts |
| PATCH | /api/tutorial/content/[id] | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\[id]\route.ts |
| POST | /api/tutorial/content/[id]/publish | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\[id]\publish\route.ts |
| POST | /api/tutorial/content/[id]/restore | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\content\[id]\restore\route.ts |
| POST | /api/tutorial/assignments/draft | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\assignments\draft\route.ts |
| GET | /api/tutorial/assignments/help-requests | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\assignments\help-requests\route.ts |
| POST | /api/tutorial/assignments/publish | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\assignments\publish\route.ts |
| PATCH | /api/tutorial/assignments/help-requests/[id] | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\tutorial\assignments\help-requests\[id]\route.ts |
| GET | /api/bff/dashboard-summary | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\bff\dashboard-summary\route.ts |
| GET | /api/admin/docs | nextjs | ✗ | apps\realtutorialhub-admin\src\app\api\admin\docs\route.ts |
| GET | /api/assignments | nextjs | ✗ | apps\faculty-app\src\app\api\assignments\route.ts |
| GET | /api/healthz | nextjs | ✗ | apps\faculty-app\src\app\api\healthz\route.ts |
| GET | /api/help-requests | nextjs | ✗ | apps\faculty-app\src\app\api\help-requests\route.ts |
| GET | /api/review-queue | nextjs | ✗ | apps\faculty-app\src\app\api\review-queue\route.ts |
| GET | /api/faculty/attendance | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\attendance\route.ts |
| POST | /api/faculty/attendance | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\attendance\route.ts |
| GET | /api/faculty/batches | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\batches\route.ts |
| GET | /api/faculty/help-requests | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\help-requests\route.ts |
| GET | /api/faculty/project-reviews | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\project-reviews\route.ts |
| GET | /api/faculty/session-requests | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\session-requests\route.ts |
| GET | /api/faculty/sessions | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\sessions\route.ts |
| POST | /api/faculty/sessions | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\sessions\route.ts |
| PATCH | /api/faculty/sessions/[id] | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\sessions\[id]\route.ts |
| PATCH | /api/faculty/session-requests/[id] | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\session-requests\[id]\route.ts |
| POST | /api/faculty/session-requests/[id]/accept | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\session-requests\[id]\accept\route.ts |
| POST | /api/faculty/project-reviews/[id]/approve | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\project-reviews\[id]\approve\route.ts |
| POST | /api/faculty/project-reviews/[id]/request-revision | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\project-reviews\[id]\request-revision\route.ts |
| PATCH | /api/faculty/help-requests/[id] | nextjs | ✗ | apps\faculty-app\src\app\api\faculty\help-requests\[id]\route.ts |
| GET | /api/attendance | nextjs | ✗ | apps\api-server\src\app\api\attendance\route.ts |
| POST | /api/attendance | nextjs | ✗ | apps\api-server\src\app\api\attendance\route.ts |
| POST | /api/workers/certificate-issued | nextjs | ✗ | apps\api-server\src\app\api\workers\certificate-issued\route.ts |
| POST | /api/workers/payment-overdue | nextjs | ✗ | apps\api-server\src\app\api\workers\payment-overdue\route.ts |
| POST | /api/workers/session-reminder | nextjs | ✗ | apps\api-server\src\app\api\workers\session-reminder\route.ts |
| GET | /api/tutorial/progress | nextjs | ✗ | apps\api-server\src\app\api\tutorial\progress\route.ts |
| POST | /api/tutorial/progress | nextjs | ✗ | apps\api-server\src\app\api\tutorial\progress\route.ts |
| GET | /api/tutorial/interactions/code | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\code\route.ts |
| POST | /api/tutorial/interactions/code | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\code\route.ts |
| GET | /api/tutorial/interactions/completion | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\completion\route.ts |
| POST | /api/tutorial/interactions/completion | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\completion\route.ts |
| GET | /api/tutorial/interactions/practice | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\practice\route.ts |
| POST | /api/tutorial/interactions/practice | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\practice\route.ts |
| GET | /api/tutorial/interactions/quiz | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\quiz\route.ts |
| POST | /api/tutorial/interactions/quiz | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\quiz\route.ts |
| GET | /api/tutorial/interactions/visual | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\visual\route.ts |
| POST | /api/tutorial/interactions/visual | nextjs | ✗ | apps\api-server\src\app\api\tutorial\interactions\visual\route.ts |
| POST | /api/tutorial/ils/active-time | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\active-time\route.ts |
| POST | /api/tutorial/ils/block-active-time | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\block-active-time\route.ts |
| POST | /api/tutorial/ils/block-completion | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\block-completion\route.ts |
| POST | /api/tutorial/ils/block-visit | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\block-visit\route.ts |
| POST | /api/tutorial/ils/complete-node | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\complete-node\route.ts |
| POST | /api/tutorial/ils/visit | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\visit\route.ts |
| GET | /api/tutorial/ils/subtopic/[subtopicId]/progress | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\subtopic\[subtopicId]\progress\route.ts |
| GET | /api/tutorial/ils/navigation/[nodeId] | nextjs | ✗ | apps\api-server\src\app\api\tutorial\ils\navigation\[nodeId]\route.ts |
| GET | /api/tutorial/faculty/assignments | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\assignments\route.ts |
| GET | /api/tutorial/faculty/help-requests | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\help-requests\route.ts |
| GET | /api/tutorial/faculty/live-sessions | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\live-sessions\route.ts |
| GET | /api/tutorial/faculty/project-reviews | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\project-reviews\route.ts |
| GET | /api/tutorial/faculty/review-queue | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\review-queue\route.ts |
| POST | /api/tutorial/faculty/project-reviews/[id]/approve | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\project-reviews\[id]\approve\route.ts |
| POST | /api/tutorial/faculty/project-reviews/[id]/request-revision | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\project-reviews\[id]\request-revision\route.ts |
| PATCH | /api/tutorial/faculty/live-sessions/[id] | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\live-sessions\[id]\route.ts |
| POST | /api/tutorial/faculty/live-sessions/[id]/accept | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\live-sessions\[id]\accept\route.ts |
| PATCH | /api/tutorial/faculty/help-requests/[id] | nextjs | ✗ | apps\api-server\src\app\api\tutorial\faculty\help-requests\[id]\route.ts |
| GET | /api/tutorial/content/[subtopicId] | nextjs | ✗ | apps\api-server\src\app\api\tutorial\content\[subtopicId]\route.ts |
| GET | /api/features/ai-labs | nextjs | ✗ | apps\api-server\src\app\api\features\ai-labs\route.ts |
| POST | /api/features/ai-labs | nextjs | ✗ | apps\api-server\src\app\api\features\ai-labs\route.ts |
| GET | /api/faculty/sessions | nextjs | ✗ | apps\api-server\src\app\api\faculty\sessions\route.ts |
| POST | /api/faculty/sessions | nextjs | ✗ | apps\api-server\src\app\api\faculty\sessions\route.ts |
| PATCH | /api/faculty/sessions/[id] | nextjs | ✗ | apps\api-server\src\app\api\faculty\sessions\[id]\route.ts |
| GET | /api/export/download | nextjs | ✗ | apps\api-server\src\app\api\export\download\route.ts |
| POST | /api/export/trigger | nextjs | ✗ | apps\api-server\src\app\api\export\trigger\route.ts |
| POST | /api/export/workflow | nextjs | ✗ | apps\api-server\src\app\api\export\workflow\route.ts |
| GET | /api/export/status/[jobId] | nextjs | ✗ | apps\api-server\src\app\api\export\status\[jobId]\route.ts |
| GET | /api/certificates/verify/[code] | nextjs | ✗ | apps\api-server\src\app\api\certificates\verify\[code]\route.ts |
| POST | /api/auth/logout-all | nextjs | ✗ | apps\api-server\src\app\api\auth\logout-all\route.ts |
| GET | /api/admin/users | nextjs | ✗ | apps\api-server\src\app\api\admin\users\route.ts |
| POST | /api/admin/users | nextjs | ✗ | apps\api-server\src\app\api\admin\users\route.ts |

## Issues Found

- Missing authentication: POST /user-registered
- Missing authentication: POST /payment-received
- Missing authentication: GET /content/:brandId
- Missing authentication: GET /control-plane/:brandId
- Missing authentication: GET /bootstrap/:brandId
- Missing authentication: GET /courses
- Missing authentication: GET /courses/:slug
- Missing authentication: GET /api/faculty
- Missing authentication: POST /api/onboarding
- Missing authentication: GET /api/profile
- Not in spec: POST /register
- Not in spec: POST /login
- Not in spec: POST /admin/login
- Not in spec: POST /refresh
- Not in spec: POST /callback/validate
- Not in spec: POST /logout
- Not in spec: GET /me
- Not in spec: GET /sessions
- Not in spec: DELETE /sessions/:id
- Not in spec: DELETE /sessions

## Recommendations

- Add authentication middleware to unprotected endpoints

---
*Generated by verify-api-contract.py*
