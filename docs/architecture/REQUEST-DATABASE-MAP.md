# Request → Database Static Analysis

**Phase 0A.2.2-B**

Generated: 2026-08-26T12:53:38.053Z

## Summary

- Requests/routes analyzed: 85
- Multi-database requests: 0

## Request Matrix

| Service | Route | File | DB Count | Pattern | Confidence |
|---|---|---|---:|---|---|
| api-server | /api/admin/auth/heartbeat | apps\api-server\src\app\api\admin\auth\heartbeat\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/blueprints | apps\api-server\src\app\api\admin\blueprints\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/domains | apps\api-server\src\app\api\admin\domains\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/metrics/tutor | apps\api-server\src\app\api\admin\metrics\tutor\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/questions/bulk | apps\api-server\src\app\api\admin\questions\bulk\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/questions/[id] | apps\api-server\src\app\api\admin\questions\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/skills | apps\api-server\src\app\api\admin\skills\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/subjects | apps\api-server\src\app\api\admin\subjects\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/subtopics | apps\api-server\src\app\api\admin\subtopics\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/topics | apps\api-server\src\app\api\admin\topics\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/tutor/help/list | apps\api-server\src\app\api\admin\tutor\help\list\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/admin/users/[id] | apps\api-server\src\app\api\admin\users\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/discrimination | apps\api-server\src\app\api\analytics\admin\discrimination\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/item-difficulty | apps\api-server\src\app\api\analytics\admin\item-difficulty\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/mastery-trend | apps\api-server\src\app\api\analytics\admin\mastery-trend\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/planned-vs-actual-difficulty | apps\api-server\src\app\api\analytics\admin\planned-vs-actual-difficulty\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/pool-sufficiency | apps\api-server\src\app\api\analytics\admin\pool-sufficiency\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/score-histogram | apps\api-server\src\app\api\analytics\admin\score-histogram\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/admin/topic-skill-heatmap | apps\api-server\src\app\api\analytics\admin\topic-skill-heatmap\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/user/difficulty-accuracy | apps\api-server\src\app\api\analytics\user\difficulty-accuracy\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/user/mastery-trend | apps\api-server\src\app\api\analytics\user\mastery-trend\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/user/score-history | apps\api-server\src\app\api\analytics\user\score-history\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/user/topic-performance | apps\api-server\src\app\api\analytics\user\topic-performance\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/analytics/user/weakness-tree | apps\api-server\src\app\api\analytics\user\weakness-tree\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/auth/debug/profile-integrity | apps\api-server\src\app\api\auth\debug\profile-integrity\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/auth/profile | apps\api-server\src\app\api\auth\profile\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/cron/cleanup-reports | apps\api-server\src\app\api\cron\cleanup-reports\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/cron/pdf-health | apps\api-server\src\app\api\cron\pdf-health\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/debug/sweep-stuck-reports | apps\api-server\src\app\api\debug\sweep-stuck-reports\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/export/download | apps\api-server\src\app\api\export\download\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/export/status/[jobId] | apps\api-server\src\app\api\export\status\[jobId]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/export/urls | apps\api-server\src\app\api\export\urls\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/export/workflow | apps\api-server\src\app\api\export\workflow\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/factory/save | apps\api-server\src\app\api\factory\save\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/generate-report | apps\api-server\src\app\api\generate-report\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/notifications/mark-read | apps\api-server\src\app\api\notifications\mark-read\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/notifications | apps\api-server\src\app\api\notifications\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/notifications/unread-count | apps\api-server\src\app\api\notifications\unread-count\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/queue-report | apps\api-server\src\app\api\queue-report\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/quiz/active | apps\api-server\src\app\api\quiz\active\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/quiz/result | apps\api-server\src\app\api\quiz\result\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/recommendations/explain | apps\api-server\src\app\api\recommendations\explain\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/recommendations/history | apps\api-server\src\app\api\recommendations\history\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/recommendations | apps\api-server\src\app\api\recommendations\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/report-status | apps\api-server\src\app\api\report-status\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/reports/download | apps\api-server\src\app\api\reports\download\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/reports | apps\api-server\src\app\api\reports\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/search | apps\api-server\src\app\api\search\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/student-insight-pdf | apps\api-server\src\app\api\student-insight-pdf\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutor/help/request | apps\api-server\src\app\api\tutor\help\request\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutor/notes/download | apps\api-server\src\app\api\tutor\notes\download\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutor/notes/view | apps\api-server\src\app\api\tutor\notes\view\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/interactions/code | apps\api-server\src\app\api\tutorial\interactions\code\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/interactions/completion | apps\api-server\src\app\api\tutorial\interactions\completion\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/interactions/practice | apps\api-server\src\app\api\tutorial\interactions\practice\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/interactions/quiz | apps\api-server\src\app\api\tutorial\interactions\quiz\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/interactions/visual | apps\api-server\src\app\api\tutorial\interactions\visual\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/tutorial/progress | apps\api-server\src\app\api\tutorial\progress\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| api-server | /api/workflows/pdf-report | apps\api-server\src\app\api\workflows\pdf-report\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| realtutorialhub-web | /api/ai-tutor/query | apps\realtutorialhub-web\src\app\api\ai-tutor\query\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| realtutorialhub-web | /api/certificates/verify/[verificationCode] | apps\realtutorialhub-web\src\app\api\certificates\verify\[verificationCode]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| realtutorialhub-web | /api/workers/award-project-badge | apps\realtutorialhub-web\src\app\api\workers\award-project-badge\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| realtutorialhub-web | /api/workers/issue-certificate | apps\realtutorialhub-web\src\app\api\workers\issue-certificate\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| realtutorialhub-web | /api/workers/review-project | apps\realtutorialhub-web\src\app\api\workers\review-project\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/domains/batch-delete | apps\skillhubcore-admin\src\app\api\admin\domains\batch-delete\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/domains | apps\skillhubcore-admin\src\app\api\admin\domains\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/domains/[id] | apps\skillhubcore-admin\src\app\api\admin\domains\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/skills/batch-delete | apps\skillhubcore-admin\src\app\api\admin\skills\batch-delete\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/skills | apps\skillhubcore-admin\src\app\api\admin\skills\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/skills/[id] | apps\skillhubcore-admin\src\app\api\admin\skills\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subjects/batch-delete | apps\skillhubcore-admin\src\app\api\admin\subjects\batch-delete\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subjects | apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subjects/[id] | apps\skillhubcore-admin\src\app\api\admin\subjects\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subtopics/batch-delete | apps\skillhubcore-admin\src\app\api\admin\subtopics\batch-delete\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subtopics | apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/subtopics/[id] | apps\skillhubcore-admin\src\app\api\admin\subtopics\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/topics/batch-delete | apps\skillhubcore-admin\src\app\api\admin\topics\batch-delete\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/topics | apps\skillhubcore-admin\src\app\api\admin\topics\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/admin/topics/[id] | apps\skillhubcore-admin\src\app\api\admin\topics\[id]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-composer/sections | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-composer/sections/[sectionId]/blocks | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\blocks\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-composer/sections/[sectionId]/publish | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\publish\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-composer/sections/[sectionId] | apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-left-sidebar/hierarchy | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\hierarchy\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |
| skillhubcore-admin | /api/tutorial-left-sidebar/navigation-nodes | apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\navigation-nodes\route.ts | 1 | SINGLE_DATABASE | STATIC_EXECUTION_ANALYSIS |

## Interpretation Rules

- `SINGLE_DATABASE` means one database operation domain was statically identified.
- `PARALLEL` means Promise.all-style parallel structure was detected.
- `POSSIBLY_SEQUENTIAL` means multiple operations appear ordered by source awaits.
- `DEPENDENT_SEQUENTIAL` means a static dependency signal was detected.
- `UNKNOWN` means the source structure is insufficient to classify.

⚠️ **Static execution classification does NOT prove runtime behavior.**

It does NOT establish:

- actual latency
- connection count
- connection-pool behavior
- database response time
- production request frequency
- performance bottlenecks

**Runtime tracing is required for those conclusions.**
