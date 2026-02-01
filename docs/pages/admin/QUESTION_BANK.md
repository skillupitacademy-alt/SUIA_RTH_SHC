# 🏦 Question Bank Management Journey
**Path**: `docs/pages/admin/QUESTION_BANK.md`

This document defines the high-fidelity orchestration center for hierarchical content creation (Domains, Subjects, Topics, Subtopics).

## 1. Unified Entry Points 🚀
The Question Bank transition from "CRUD Table" to "Surgical Factory" is now complete. Every creation action launches the unified **Hierarchy Factory**.

### Entry standard
- **Add Domain**: Launches full-screen `HierarchyFactoryWizard` with root context.
- **Add Subject**: Launches Factory IDE with pre-populated `domainId`.
- **Add Topic**: Launches Factory IDE with pre-populated `subjectId`.
- **Add Subtopic**: Launches Factory IDE with full hierarchy lineage context.

## 2. Single-Pane Orchestration Center 🧪
The previous dual-terminal layout has been consolidated into a focused, single-pane workspace.

### Workspace Modes
- **AI Prompt Mode (Default)**: Primary workspace for surgical content generation.
- **Manual Manifest Mode**: High-density JSON editor for precise data entry.
- **Import Template**: Modular button providing skeletal JSON structures tailored to the current context.

## 3. Surgical AI Prompting (IQ Assistant) 🧠
The AI assistant is now context-aware and provides level-specific instructions:
- **Domain Generation**: Focused on core subject expansion and high-level mapping.
- **Subject Expansion**: Targets specific topic sets within a domain.
- **Topic Deep-Dive**: Specialized in subtopic partitioning and question harvesting.

## 4. Blueprint Automation flow ⚙️
Successful domain creation now triggers an automated branching path:
- **Branch A**: Launch `BlueprintFactoryWizard` to configure exam parameters (Time, Count, Difficulty).
- **Branch B**: Return to dashboard for post-orchestration governance.

## 5. Technical Stack (Traceability)
- **Engine**: `apps/api-server/src/modules/domain/hierarchy.factory.ts` (Atomic Upsert).
- **Frontend**: `apps/admin-app/src/components/content/HierarchyFactoryWizard.tsx` (IDE).
- **Integration**: Replaced legacy modals in `SubjectTable.tsx`, `TopicTable.tsx`, `SubtopicTable.tsx`.

---
**Standard**: "Executive White" design fidelity. Zero-Log policy. 100% Type Safety.
