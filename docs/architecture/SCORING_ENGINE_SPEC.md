# Scoring Engine Specification

## Overview
The Scoring Engine is responsible for calculating final results, topic mastery, and growth zones once an exam is submitted.

## 1. Flow
1. **User Submission**: User calls `POST /api/quiz/submit`
2. **API Logic**: 
    - `ExamEngine.completeExam()` marks exam as `completed`.
    - `ScoringEngine.calculateExamResults()` performs calculations.
3. **Data Persistence**:
    - Update `exams` table (`totalScore`, `status`, `completedAt`).
    - Insert records into `resultsByDimension` for fine-grained analytics.

## 2. Calculation Logic

### Total Score
- **Formula**: `(Total Correct Answers / Total Questions) * 100`
- **Output**: Integer (0-100)

### Dimension Scoring (Mastery)
- **Dimensions**: `topic`, `subject`, `difficulty`.
- **Topic Mastery**: Accuracy per topic.
- **Difficulty Mastery**: Accuracy per difficulty level (Simple, Intermediate, Expert).

### Growth Zones
- Identified based on topics where:
    - Accuracy < 70%
    - Topic weight is high (from `topics.weight`)

## 3. Data Requirements

### Database Fields
- `exams.total_score`: Integer
- `exams.status`: `completed`
- `results_by_dimension.dimension_type`: Enum ('topic', 'subject', 'difficulty')
- `results_by_dimension.dimension_id`: UUID (or string for difficulty)
- `results_by_dimension.score`: Integer (Accuracy %)

### Enhancements Needed
- The `ScoringEngine` should query the names of Topics/Subjects to provide human-readable feedback if needed, although IDs are used for persistence.
- Time tracking per question should be implemented in `responseMetadata`.

## 4. UI Integration
The frontend `ExamInterface` must call `apiClient.quiz.submitExam(examId)` when "Finish" is clicked.
The `active-report` page must fetch the `resultsByDimension` to replace mock data.
