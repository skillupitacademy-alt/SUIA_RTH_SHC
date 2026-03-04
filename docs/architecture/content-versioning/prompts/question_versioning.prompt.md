# AI Implementation Prompt: Content Versioning & Question Bank Management

**Role**: You are a Senior Backend Engineer specializing in content management systems, version control patterns, and bulk data operations for educational platforms.

**Task**: Implement a complete question versioning system that tracks every edit, links exam results to specific question versions, and supports bulk import/export.

## Core Requirements
1.  **Database Schema**:
    - Create a `question_versions` table in `packages/db/src/schema/` with: `id`, `question_id` (FK to questions), `version_number`, `content` (JSONB snapshot), `change_summary`, `changed_by` (FK to users), `changed_at`, `is_current` (boolean).
    - Add `question_version_id` (FK to question_versions) to the `exam_questions` table.
    - Add indexes on `(question_id)` and `(question_id, is_current)`.
    - Generate and run Drizzle migrations.

2.  **QuestionVersionService**:
    - Create `apps/api-server/src/modules/question/question-version.service.ts`.
    - `createVersion(questionId, changedBy, changeSummary)`: Snapshots current question, increments version number, marks new as current.
    - `getHistory(questionId)`: Returns all versions ordered by version_number desc.
    - `getExamVersion(examQuestionId)`: Returns the specific question version linked to an exam question.
    - `rollback(questionId, targetVersion)`: Restores question data from a specific version.

3.  **AdminEngine Integration**:
    - Before every `questions` table update: call `QuestionVersionService.createVersion()` to snapshot the current state.
    - During exam creation in `SelectionEngine` or `ExamEngine`: set `question_version_id` on each `exam_questions` row to the current version.

4.  **Bulk Import/Export**:
    - Create POST `api/admin/questions/import` route: accepts CSV file, validates rows, creates questions + initial versions, returns error report.
    - Create GET `api/admin/questions/export` route: returns CSV of all questions (or filtered subset) with metadata.
    - Provide a downloadable CSV template at GET `api/admin/questions/template`.

5.  **Admin UI**:
    - Add "Version History" tab to the question editor page in admin-app.
    - Show timeline of versions with author, timestamp, change summary.
    - Add diff view comparing two versions.
    - Add "Rollback" button per version.
    - Create "Import Questions" page with file upload, preview, and progress tracking.

## Technical Stack Context
- **Database**: Neon Postgres via Drizzle ORM.
- **Framework**: Next.js App Router (API routes).
- **Admin App**: `apps/admin-app` with React + Tailwind.
- **Existing Question Schema**: `questions` table in `packages/db`.

## Prompt Instruction
"Create the question_versions table via Drizzle migration, build QuestionVersionService with version creation and rollback, integrate automatic versioning into AdminEngine's question update flow, add question_version_id linkage in exam creation, build CSV import/export API routes, and create the Version History UI tab and Import page in admin-app."
