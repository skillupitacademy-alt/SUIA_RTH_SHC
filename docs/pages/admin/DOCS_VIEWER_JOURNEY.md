# 📜 Documentation Viewer Journey
**Path**: `docs/pages/admin/DOCS_VIEWER_JOURNEY.md`

This document defines the "QUIZADMIN" Documentation Viewer, a feature to surface the project's living governance and specifications directly within the Admin Console.

---

## 1. Feature Overview

### Purpose
Provide administrators with a "Single Pane of Glass" view of the system's Laws, Logic, UI, and Status as defined in the repository's `.md` files.

### 2. User Interface

#### Layout
- **Header**: "QUIZADMIN - System Governance".
- **Navigation (Tabs)**:
  1. **THE LAW** (Constitution, Manifesto)
  2. **THE LOGIC** (Specs)
  3. **THE UI** (Journeys)
  4. **THE STATUS** (Execution Logs)
  5. **THE RULES** (UX Baseline)
  6. **THE PAST** (Archives)

#### Content Display
- **Interaction**: Clicking a tab shows a list/sub-tabs of files in that category.
- **Viewing**: Clicking a file renders the **Structured Tabular Dashboard**.
- **Formatting**:
  - **Property Detection**: `**Key**: Value` pairs are automatically rendered as horizontal executive rows.
  - **Headers**: Styled as section dividers with pulsatile icons and pink accents.
  - **Lists**: Rendered as high-fidelity cards with multi-column grid support.
  - **Emphasis**: Blockquotes are transformed into "Critical Conflict Protocol" banners.
  - **No raw document look**: Content must be structured as an investigative interface.

---

## 3. Technical Implementation

### Data Source
- **Source of Truth**: The `docs/` directory at the project root.
- **Access Method**: Server-Side (RSC) file system access (`fs/promises`).
- **Mapping**: Adhere strictly to the "Gold Standard" Folder Intent Map defined in `AGENT_CONSTITUTION.md`.

### Data Contract (Internal)
- `getDocumentationStructure()`: Returns the categorized list of files.
- `getMarkdownContent(path)`: Returns raw string content.

### Aesthetic
- **Theme**: "Executive White" / High-Contrast Light Mode.
- **Typography**: Space Grotesk / Inter for executive titling, Mono for logic streams.
- **Layout**: Full-width expansion (100% viewport) for command-center feel.

---

## 4. Verification Checklist
- [ ] All 6 "Cycle of Truth" tabs are visible.
- [ ] Clicking a tab loads the correct files.
- [ ] Markdown tables render correctly (rows/columns visible).
- [ ] No content is truncated or summarized.
- [ ] Images/Links (where relative) are handled or gracefully degraded.
