# Backend Phase 02: Domain & Content Services

## 🎯 Objective
Build the CRUD (Create, Read, Update, Delete) layer for the educational hierarchy to allow for content management and discovery.

## 📋 Task Breakdown

### 1. Hierarchy Discovery (Public API)
- [x] **Domain Service**: Fetch active domains.
- [x] **Subject Service**: Fetch subjects.
- [x] **Topic Service**: Fetch topics.
- [x] **Standalone Fetching**: Separate endpoints for subjects/topics.

### 2. Content Management (Admin API)
- [x] **Question Service**:
    - [x] Bulk import questions from JSON.
    - [x] Manual CRUD for individual questions (Update/Delete/Subtopic).
    - [x] Validation of the 13-question topic rule (30/30/40 split).
- [x] **Topic Management**: Create/Update/Delete topics, subjects, and subtopics.

### 3. Metadata & Skills
- [x] **Skill Service**: Manage the skills database.
- [x] **Mapping Logic**: Link topics to skills via `topic_skills` junction.

## 🚀 Priority Modules (`apps/api-server/src/modules/`)
- [x] `domain/`
- [x] `subject/` (Integrated in domain)
- [x] `topic/` (Integrated in domain)
- [x] `question/`

## 🧪 Verification Checkpoints
- [x] Success: `GET /api/topics` returns the list of topics filterable by subject.
- [x] Success: Adding a question correctly assigns the `topicId` and `difficulty`.
- [x] Success: Deleting a Topic safely handles associated Questions.
