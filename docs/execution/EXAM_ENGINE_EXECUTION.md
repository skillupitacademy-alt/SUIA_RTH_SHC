# Backend Phase 03: Runtime Engines

## 🎯 Objective
Implement the "Brains" of the platform: The logic that generates exams, evaluates answers, and calculates mastery.

## 📋 Task Breakdown

### 1. Exam Blueprint Generation
- [x] **Logic**: Implement deterministic selection based on `EXAM_BLUEPRINT_GENERATION.md`.
    - [x] Hierarchical selection (Domain/Subject/Topic/Subtopic).
    - [x] Weighted randomness for question selection.
- [x] **Validation**: Ensure 30/30/40 distribution is respected. (Implemented in SelectionEngine).
- [x] **Payload**: Generate a static JSON of question IDs for a session.

### 2. Session Engine
- [x] **State Machine**: Handle `idle` -> `started` -> `submitted` -> `expired`.
- [x] **Timer Logic**: Server-side expiration validation.

### 3. Scoring & Evaluation
- [x] **Answer Evaluation**: Compare `user_answer` vs `correct_answer`.
- [x] **Scoring Engine**: Calculate domain, subject, topic, subtopic, and skill scores.
- [x] **Report Generation**: Create the final performance summary.

## 🚀 Priority Modules (`apps/api-server/src/modules/`)
- [x] `exam-engine/`
- [x] `selection-engine/`
- [x] `scoring-engine/`
- [x] `report-engine/`

## 🧪 Verification Checkpoints
- [x] Success: Blueprint generates exactly the requested number of questions.
- [x] Success: Scoring an exam returns 100% and populates dimension tables.
- [x] Success: Attempting to submit after the timer expires returns a "Session Expired" error.
