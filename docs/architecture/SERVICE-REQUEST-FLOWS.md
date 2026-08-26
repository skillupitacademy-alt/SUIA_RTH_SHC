# Service → Request → Database Flow

**Phase 0A.2.2-B**

Generated: 2026-08-26T12:53:38.116Z

## api-server

Routes detected: 59

### POST /api/admin/auth/heartbeat

- **File**: `apps\api-server\src\app\api\admin\auth\heartbeat\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/blueprints

- **File**: `apps\api-server\src\app\api\admin\blueprints\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/domains

- **File**: `apps\api-server\src\app\api\admin\domains\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/admin/metrics/tutor

- **File**: `apps\api-server\src\app\api\admin\metrics\tutor\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/admin/questions/bulk

- **File**: `apps\api-server\src\app\api\admin\questions\bulk\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, PATCH, DELETE /api/admin/questions/[id]

- **File**: `apps\api-server\src\app\api\admin\questions\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/skills

- **File**: `apps\api-server\src\app\api\admin\skills\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/subjects

- **File**: `apps\api-server\src\app\api\admin\subjects\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/subtopics

- **File**: `apps\api-server\src\app\api\admin\subtopics\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/admin/topics

- **File**: `apps\api-server\src\app\api\admin\topics\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, PATCH /api/admin/tutor/help/list

- **File**: `apps\api-server\src\app\api\admin\tutor\help\list\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, PATCH, DELETE /api/admin/users/[id]

- **File**: `apps\api-server\src\app\api\admin\users\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/discrimination

- **File**: `apps\api-server\src\app\api\analytics\admin\discrimination\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/item-difficulty

- **File**: `apps\api-server\src\app\api\analytics\admin\item-difficulty\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/mastery-trend

- **File**: `apps\api-server\src\app\api\analytics\admin\mastery-trend\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/planned-vs-actual-difficulty

- **File**: `apps\api-server\src\app\api\analytics\admin\planned-vs-actual-difficulty\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/pool-sufficiency

- **File**: `apps\api-server\src\app\api\analytics\admin\pool-sufficiency\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/score-histogram

- **File**: `apps\api-server\src\app\api\analytics\admin\score-histogram\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/admin/topic-skill-heatmap

- **File**: `apps\api-server\src\app\api\analytics\admin\topic-skill-heatmap\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/user/difficulty-accuracy

- **File**: `apps\api-server\src\app\api\analytics\user\difficulty-accuracy\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/user/mastery-trend

- **File**: `apps\api-server\src\app\api\analytics\user\mastery-trend\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/user/score-history

- **File**: `apps\api-server\src\app\api\analytics\user\score-history\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/user/topic-performance

- **File**: `apps\api-server\src\app\api\analytics\user\topic-performance\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/analytics/user/weakness-tree

- **File**: `apps\api-server\src\app\api\analytics\user\weakness-tree\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/auth/debug/profile-integrity

- **File**: `apps\api-server\src\app\api\auth\debug\profile-integrity\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, PATCH, POST /api/auth/profile

- **File**: `apps\api-server\src\app\api\auth\profile\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/cron/cleanup-reports

- **File**: `apps\api-server\src\app\api\cron\cleanup-reports\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/cron/pdf-health

- **File**: `apps\api-server\src\app\api\cron\pdf-health\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/debug/sweep-stuck-reports

- **File**: `apps\api-server\src\app\api\debug\sweep-stuck-reports\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/export/download

- **File**: `apps\api-server\src\app\api\export\download\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/export/status/[jobId]

- **File**: `apps\api-server\src\app\api\export\status\[jobId]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/export/urls

- **File**: `apps\api-server\src\app\api\export\urls\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/export/workflow

- **File**: `apps\api-server\src\app\api\export\workflow\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/factory/save

- **File**: `apps\api-server\src\app\api\factory\save\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/generate-report

- **File**: `apps\api-server\src\app\api\generate-report\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH /api/notifications/mark-read

- **File**: `apps\api-server\src\app\api\notifications\mark-read\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/notifications

- **File**: `apps\api-server\src\app\api\notifications\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/notifications/unread-count

- **File**: `apps\api-server\src\app\api\notifications\unread-count\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/queue-report

- **File**: `apps\api-server\src\app\api\queue-report\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/quiz/active

- **File**: `apps\api-server\src\app\api\quiz\active\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/quiz/result

- **File**: `apps\api-server\src\app\api\quiz\result\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/recommendations/explain

- **File**: `apps\api-server\src\app\api\recommendations\explain\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/recommendations/history

- **File**: `apps\api-server\src\app\api\recommendations\history\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/recommendations

- **File**: `apps\api-server\src\app\api\recommendations\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/report-status

- **File**: `apps\api-server\src\app\api\report-status\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/reports/download

- **File**: `apps\api-server\src\app\api\reports\download\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/reports

- **File**: `apps\api-server\src\app\api\reports\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/search

- **File**: `apps\api-server\src\app\api\search\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/student-insight-pdf

- **File**: `apps\api-server\src\app\api\student-insight-pdf\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/tutor/help/request

- **File**: `apps\api-server\src\app\api\tutor\help\request\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/tutor/notes/download

- **File**: `apps\api-server\src\app\api\tutor\notes\download\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/tutor/notes/view

- **File**: `apps\api-server\src\app\api\tutor\notes\view\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial/interactions/code

- **File**: `apps\api-server\src\app\api\tutorial\interactions\code\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial/interactions/completion

- **File**: `apps\api-server\src\app\api\tutorial\interactions\completion\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial/interactions/practice

- **File**: `apps\api-server\src\app\api\tutorial\interactions\practice\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial/interactions/quiz

- **File**: `apps\api-server\src\app\api\tutorial\interactions\quiz\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial/interactions/visual

- **File**: `apps\api-server\src\app\api\tutorial\interactions\visual\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST /api/tutorial/progress

- **File**: `apps\api-server\src\app\api\tutorial\progress\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/workflows/pdf-report

- **File**: `apps\api-server\src\app\api\workflows\pdf-report\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

## realtutorialhub-web

Routes detected: 5

### POST /api/ai-tutor/query

- **File**: `apps\realtutorialhub-web\src\app\api\ai-tutor\query\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/certificates/verify/[verificationCode]

- **File**: `apps\realtutorialhub-web\src\app\api\certificates\verify\[verificationCode]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/workers/award-project-badge

- **File**: `apps\realtutorialhub-web\src\app\api\workers\award-project-badge\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/workers/issue-certificate

- **File**: `apps\realtutorialhub-web\src\app\api\workers\issue-certificate\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/workers/review-project

- **File**: `apps\realtutorialhub-web\src\app\api\workers\review-project\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

## skillhubcore-admin

Routes detected: 21

### POST /api/admin/domains/batch-delete

- **File**: `apps\skillhubcore-admin\src\app\api\admin\domains\batch-delete\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST, PUT, DELETE /api/admin/domains

- **File**: `apps\skillhubcore-admin\src\app\api\admin\domains\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH, DELETE /api/admin/domains/[id]

- **File**: `apps\skillhubcore-admin\src\app\api\admin\domains\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/admin/skills/batch-delete

- **File**: `apps\skillhubcore-admin\src\app\api\admin\skills\batch-delete\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST, PUT, DELETE /api/admin/skills

- **File**: `apps\skillhubcore-admin\src\app\api\admin\skills\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH, DELETE /api/admin/skills/[id]

- **File**: `apps\skillhubcore-admin\src\app\api\admin\skills\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/admin/subjects/batch-delete

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subjects\batch-delete\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST, PUT, DELETE /api/admin/subjects

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subjects\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH, DELETE /api/admin/subjects/[id]

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subjects\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/admin/subtopics/batch-delete

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subtopics\batch-delete\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST, PUT, DELETE /api/admin/subtopics

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subtopics\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH, DELETE /api/admin/subtopics/[id]

- **File**: `apps\skillhubcore-admin\src\app\api\admin\subtopics\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/admin/topics/batch-delete

- **File**: `apps\skillhubcore-admin\src\app\api\admin\topics\batch-delete\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, POST, PUT, DELETE /api/admin/topics

- **File**: `apps\skillhubcore-admin\src\app\api\admin\topics\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### PATCH, DELETE /api/admin/topics/[id]

- **File**: `apps\skillhubcore-admin\src\app\api\admin\topics\[id]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST, GET /api/tutorial-composer/sections

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/tutorial-composer/sections/[sectionId]/blocks

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\blocks\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### POST /api/tutorial-composer/sections/[sectionId]/publish

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\publish\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET, PATCH, DELETE /api/tutorial-composer/sections/[sectionId]

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-composer\sections\[sectionId]\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/tutorial-left-sidebar/hierarchy

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\hierarchy\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

### GET /api/tutorial-left-sidebar/navigation-nodes

- **File**: `apps\skillhubcore-admin\src\app\api\tutorial-left-sidebar\navigation-nodes\route.ts`
- **Databases**: 1 (quiz_platform_prod)
- **Pattern**: `SINGLE_DATABASE`
- **Confidence**: `STATIC_EXECUTION_ANALYSIS`

---

## Important Limitations

This analysis provides **static source-code structure** evidence only.

It cannot determine:

- Whether a route is actually invoked in production
- Actual database query latency
- Connection pool utilization
- Request frequency or load patterns
- Runtime execution order

**Database consolidation decision remains 🔒 BLOCKED until runtime evidence is collected.**
