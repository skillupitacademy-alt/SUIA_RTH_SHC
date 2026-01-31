# Enterprise Exam Hierarchy & Analytical Matrix

This document provides a highly detailed breakdown of every table involved in the system's core lifecycle: **Content Seeding**, **Exam Execution**, and **Multi-Dimensional Analysis**.

---

## 1. Knowledge Base Hierarchy (Pre-Exam)
These tables define the "What" and "Where" of the assessment.

### `domains`
*   **Purpose**: The highest level of categorization in the system.
*   **Importance**: Acts as the global container for all curricula. Reports start here (e.g., "Software Engineering" Domain).
*   **Key Columns**: `name` (unique identifier), `category` (broad industry grouping).

### `subjects`
*   **Purpose**: Links specific educational sub-fields to a Domain.
*   **Importance**: Provides structured grouping for subjects like "Frontend Development" or "Database Management".
*   **Key Columns**: `domain_id` (foreign key), `order` (for UI sorting).

### `topics`
*   **Purpose**: Detailed knowledge areas within a Subject.
*   **Importance**: **CRITICAL**. This is the level where questions are selected. It also stores the `weight` for the *entire topic*, affecting the Subject-level proficiency roll-up.
*   **Key Columns**: `complexity_level` (used for blueprint balance), `weight` (topic importance).

### `subtopics`
*   **Purpose**: Deep-dive components of a Topic.
*   **Importance**: Used for granular filtering in the Question Bank (e.g., "React Hooks" under the "React" Topic).
*   **Key Columns**: `depth_level` (identifies how niche the concept is).

---

## 2. Skill Mapping Registry
These tables define the "Nature" and "Impact" of the questions.

### `skills`
*   **Purpose**: The central registry of 2,000+ granular abilities.
*   **Importance**: **FOUNDATIONAL**. Every analytical report is driven by the weights and categories stored here.
*   **Key Columns**: 
    - `category`: Groups skills into **Technical**, **Cognitive**, or **Process**.
    - `mapping_type`: Defines nature (**Conceptual**, **Practical**, **Technical**).
    - `weight`: (1-10) Defines the scoring impact of any question linked to this skill.

### `topic_skills`
*   **Purpose**: A join table linking Topics to their relevant Skills.
*   - **Importance**: Ensures that when an admin selects a Topic, only relevant Skills are suggested for tagging questions.

---

## 3. Assessment Content (CRUD)
The actual repository of challenges.

### `questions`
*   **Purpose**: Stores the actual assessment text, options, and logic.
*   **Importance**: The core unit of the exam.
*   **Key Columns**: 
    - `difficulty`: (Simple/Intermediate/Expert) Enforces blueprint constraints.
    - `type`: (MCQ/Code MCQ).
    - `options`: JSONB blob of answers.
    - `mapping_type`: (Upcoming) Question-level override for nature-of-assessment reporting.

### `question_skills`
*   **Purpose**: Many-to-Many link between Questions and Skills.
*   **Importance**: **THE LINK**. This table connects a single question (e.g., "Write a SQL Join") to multiple competencies (e.g., "SQL", "Data Analysis"). Without this, categorical reporting is impossible.

---

## 4. Exam Blueprinting & Execution
The "Start Exam" logic and student progression.

### `exam_blueprints`
*   **Purpose**: The "Recipe" for a specific recruitment or cert test.
*   **Importance**: Defines the strict rules for question selection (e.g., "I want 5 Frontend topics, 40% Expert difficulty").
*   **Key Columns**: `difficulty_distribution` (JSON), `total_questions`, `time_limit`.

### `exam_questions`
*   **Purpose**: Tracks which questions were randomly picked for a specific `exam_id`.
*   **Importance**: Stores the user's specific performance on that instance.
*   **Key Columns**: `user_answer`, `is_correct` (The primary flag for scoring), `response_metadata` (time taken per question).

---

## 5. Intelligence Hub (Post-Exam Analysis)
The tables that power the Radar Charts and Proficiency Reports.

### `results_by_dimension`
*   **Purpose**: The final "Flattened" analytical table.
*   **Importance**: **THE ONLY SOURCE OF REPORTS**. After an exam finishes, the Scoring Engine calculates weights and aggregates them into this table. 
*   **Key Columns**:
    - `dimension_type`: Identifies the slice (domain, subject, topic, skill, category, mapping\_type).
    - `score`: The weighted proficiency percentage.
    - `accuracy`: Pure raw hit-rate (correct/total).
    - `dimension_id`: Links back to the original entity (e.g., Domain ID).

### Logic Summary:
1.  **Hierarchy** (`domains` -> `topics`) builds the **Report Structure**.
2.  **Mapping** (`skills` -> `question_skills`) builds the **Report Content**.
3.  **Execution** (`exam_questions`) builds the **Report Data**.
4.  **Analysis** (`results_by_dimension`) builds the **Report Visualization**.
