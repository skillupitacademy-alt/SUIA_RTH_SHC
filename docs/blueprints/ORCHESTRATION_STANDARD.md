# Blueprinting Orchestration Standard 🏗️

This document defines the authoritative standard for synchronizing educational hierarchies with exam delivery via Surgical Static Blueprinting.

## Core Principle
> **Blueprints lock questions, not ideas.**

Structural entities (Domains, Subjects, Topics) describe knowledge. Questions encode that knowledge. Blueprints freeze the delivery of that knowledge for deterministic testing.

---

## The Deterministic Timeline
To ensure reliability and zero "Seed Drift," the orchestration must follow this strict sequence:

### 1. The Creation Loop
| Step | Phase | Responsibility | Outcome |
| :--- | :--- | :--- | :--- |
| 1 | **Domain Factory** | Hierarchy Creation | Domain, Subjects, Topics, Subtopics are registered. |
| 2 | **Content Harvesting** | Question Generation | Questions are born and assigned unique IDs. |
| 3 | **ID Extraction** | Metadata Capture | The Factory captures the IDs of all newly created questions. |

### 2. The Orchestration Lock
| Step | Phase | Responsibility | Outcome |
| :--- | :--- | :--- | :--- |
| 4 | **Surgical Selection** | Intent & Curation | Admin chooses which specific IDs define the "Certification." |
| 5 | **Blueprint Commit** | Persistence | `exam_blueprints` table is populated with fixed `question_ids`. |
| 6 | **Deterministic Delivery** | Fulfillment | Students receive the exact questions curated in Step 4. |

---

## Engineering Rules

### 1. Atomic Knowledge Sync
A blueprint should ideally be created **immediately** following a successful Factory Emission. This ensures that the context of "what was just created" is used to define "what will be tested."

### 2. The Existence Rule
`exam_blueprints` entries should prioritize the `question_ids` array. 
- **Static Mode**: `question_ids` MUST NOT be empty. Used for Certifications and High-Stakes exams.
- **Dynamic Mode**: `question_ids` is empty. Used for practice pools and adaptive learning.

### 3. Anti-Drift Policy
Once a Static Blueprint is committed, it is **frozen**. If new questions are added to the library later, they do not affect existing Static Blueprints. A new version of the blueprint must be created to include the new content.

---

## Why This Matters (The "Master-Level" Approach)
By moving the selection logic from "Delivery Time" (Runtime) to "Design Time" (Orchestration):
1. **Zero Error Rate**: Every student on a specific certification takes the exact same quality of test.
2. **Reliable Metrics**: Difficulty distribution is guaranteed because it's calculated during the lock.
3. **Traceability**: If a question is found to be incorrect, we know exactly which Blueprints are impacted.
