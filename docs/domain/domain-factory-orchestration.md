# Domain Factory & Manual Blueprint Orchestration

## Overview
The Domain Factory is a high-performance administrative portal designed for both manual and bulk creation of educational domains within the quiz platform. It adheres to the **"Enterprise Model"**, where every domain must have an associated **Assessment Blueprint** before it is considered ready for student consumption.

## Core Features

### 1. Unified Domain Factory (`HierarchyFactoryWizard`)
A full-screen terminal-style workspace that replaces the legacy hierarchy wizard.
- **Manual Registry**: Single-click registration for new domains.
- **Bulk Factory**: JSON-based ingestion for complex hierarchies (Subjects > Topics > Subtopics > Questions).
- **Surgical AI Prompt**: Generates a context-aware prompt for LLMs that explicitly excludes existing domains to prevent duplicate data insertion.
- **Execution Timeline**: Real-time progress monitoring through stages: `Data Validation` > `Database Lookup` > `Registry Transaction` > `Hierarchy Sealing`.

### 2. Manual Blueprint Designer (`BlueprintFactoryWizard`)
Blueprinting is an explicit administrative action, ensuring total control over exam parameters.
- **Trigger**: Prompted immediately after successful domain creation or accessible via the Governance Board.
- **Static Orchestration (Golden Path)**: Automatically locks the blueprint to specific `question_ids` generated during the Factory run, achieving 1:1 parity between creation and delivery.
- **Dual-Protocol Control**: Allows switching between "Static Certification" (Fixed content) and "Dynamic Practice" (Randomized pool).
- **Customization**:
  - **Identity**: Custom name and operational description.
  - **Payload**: Configurable question count and time limits.
  - **Difficulty Toning**: Granular percentage distribution (Simple, Intermediate, Expert) with active calibration enforcement (must total 100%).
  - **Calibration Summary**: Real-time breakdown of difficulty distribution provided by the Factory Emission Engine.

### 3. Governance Integration (`ContentReadinessBoard`)
The Governance Dashboard acts as the central auditor for domain health.
- **Readiness Audit**: Visual indicators for domains missing blueprints or having insufficient question pools.
- **Actionable State**: Integrated "Configure" and "Edit" actions directly on domain rows for instant blueprint lifecycle management.

## Technical Architecture

### Backend (API Server)
- **`AdminEngine`**: Contains Section 10 (Blueprint Management) for CRUD operations.
- **`HierarchyFactory`**: Handles atomic, transactional upserts of hierarchical data.
- **Next.js Route Handlers**: Implemented with async `params` handling to comply with Next.js 15+ standards (e.g., `api/admin/blueprints/[id]/route.ts`).

### Package Integration
- **`@quiz/db`**: Extended to include `exam_blueprints` with JSONB difficulty distributions.
- **`@quiz/api-client`**: Updated with full `AdminClient` support for the Blueprint lifecycle.

## Implementation History
- **Feb 2026**: Transitioned from "Automated Background Blueprinting" to "Manual Admin Orchestration" to provide higher customization fidelity for Enterprise customers.
- **Batch 37**: Monorepo-wide build stabilization and type-safety hardening completed across Web, Admin, and API layers.
