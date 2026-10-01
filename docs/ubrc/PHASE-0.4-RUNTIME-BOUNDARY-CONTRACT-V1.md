# Phase 0.4 — Runtime Boundary Contract V1

**Status:** FROZEN  
**Created:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
**Versioning Governance:** Phase 0.10 V1 - Contract Versioning & Evolution

---

## DEPENDENCIES

**This contract depends on:**
- Phase 0.1 — AI Roles & Responsibility Contract V1
- Phase 0.2 — Human Approval Contract V1
- Phase 0.3 — Repository Modification Contract V1

**This contract must not contradict:**
- Phase 0.1 (responsibility boundaries)
- Phase 0.2 (human approval gates)
- Phase 0.3 (repository modification rules)

**If conflict discovered:**
- STOP immediately
- Request human architecture review
- Do NOT silently amend frozen contracts
- Do NOT proceed with conflicting implementation

---

## 1. PURPOSE

This contract defines the **runtime boundary** within which Tutorial Blocks must operate. It establishes what runtime systems, services, and APIs a block MAY access, MUST access, and MUST NOT access.

**Core Principle:**  
Tutorial Blocks are **passive participants** in the existing UBRC → ILS → LSNB → RSSB architecture. Blocks do NOT implement their own parallel completion tracking, state management, or telemetry systems.

**Scope:**  
All runtime behavior during Tutorial Page execution, from initial render through user interaction to completion certification.

---

## 2. RUNTIME ARCHITECTURE OVERVIEW

### 2.1 Established Architecture (Verified in Audit)

```
Tutorial Page Composer
         │
         ├─ Tutorial Block 1 (e.g., D1)
         ├─ Tutorial Block 2 (e.g., Video)
         ├─ Tutorial Block 3 (e.g., Quiz)
         └─ Tutorial Block N (new block)
                 │
                 │ passive participation via:
                 │ - DOM identity (data-block-id)
                 │ - progressRole metadata
                 │ - React component contract
                 │
                 ▼
         UBRC (Universal Block Runtime Contract)
                 │
                 ▼
         Universal ILS Runtime
                 │
                 ├─ InstructionalBlockCompletionOrchestrator
                 │        │
                 │        ├─ Active time tracking
                 │        ├─ Scroll visibility detection
                 │        └─ Completion formula (80% threshold)
                 │
                 ├─ LSNB (Learning State Notification Bus)
                 │        │
                 │        └─ Real-time state broadcasts
                 │
                 └─ RSSB (Real-time State Synchronization Bus)
                          │
                          ├─ WebSocket connection
                          ├─ Server sync
                          └─ Multi-client coordination
                          
                          ▼
         Backend Services
                 │
                 ├─ LearningProgressService
                 │        └─ recordBlockCompletion()
                 │
                 └─ block_learning_state table
                          └─ persistent storage
```

**Key Insight:**  
The block does NOT call `recordBlockCompletion()` directly. The block does NOT implement its own timer. The block does NOT decide when it's complete. The Universal ILS Runtime orchestrates ALL of this based on the block's metadata and DOM presence.

---

## 3. RUNTIME ACTORS

### 3.1 Tutorial Block (New Implementation)

**Role:**  
Render content, handle user interactions, emit events, comply with UBRC contract.

**Responsibilities:**
- Render UI based on `block` prop
- Handle user input/interactions
- Maintain internal component state (React state)
- Emit interaction events (if needed)
- Render with required DOM attributes

**NOT Responsible For:**
- Tracking own active time
- Deciding own completion
- Writing to backend directly
- Managing learning state persistence
- Synchronizing state across clients

---

### 3.2 UBRC (Universal Block Runtime Contract)

**Role:**  
Interface contract between blocks and runtime.

**Responsibilities:**
- Define `TutorialBlock` interface
- Define block metadata schema (progressRole, expectedTimeSec, etc.)
- Define required DOM attributes (data-block-id, data-block-type)
- Define React component contract (props interface)

**Verified Location:** (from audit)
- Type definitions in TutorialBlockRenderer.tsx
- Metadata in tutorial configuration
- DOM contract enforced by renderer

---

### 3.3 Universal ILS Runtime

**Role:**  
Orchestrate learning state tracking across ALL blocks.

**Responsibilities:**
- Detect block visibility in viewport
- Track active engagement time per block
- Apply completion formula (active time ≥ 80% of expected time)
- Call backend service to record completion
- Coordinate with LSNB/RSSB

**Verified Components:** (from audit)
- `InstructionalBlockCompletionOrchestrator.tsx` — orchestrator
- `instructionalBlockCompletion.ts` — completion logic
- `LearningProgressService.recordBlockCompletion()` — backend write

**Filter:**  
Only tracks blocks with `progressRole='instructional'`. Structural/navigational/decorative blocks are NOT tracked.

---

### 3.4 LSNB (Learning State Notification Bus)

**Role:**  
Real-time notification system for learning state changes.

**Responsibilities:**
- Broadcast block completion events
- Broadcast progress updates
- Enable UI reactivity to state changes

**Block Participation:**  
Passive. Block does NOT publish to LSNB. ILS Runtime publishes on block's behalf.

---

### 3.5 RSSB (Real-time State Synchronization Bus)

**Role:**  
Multi-client synchronization and server persistence.

**Responsibilities:**
- Synchronize learning state across browser tabs
- Synchronize learning state across devices
- Coordinate WebSocket connections
- Persist state to backend

**Block Participation:**  
Passive. Block does NOT interact with RSSB. ILS Runtime coordinates via RSSB automatically.

**Verified Data Contract:** (from audit)
- `ILS_UI_UX/docs/05-RSSB-ILS-Data-Contract.md`
- `block_learning_state` table with all required fields

---

## 4. BLOCK EXECUTION BOUNDARY

### 4.1 React Component Lifecycle

**PERMITTED:**
- ✅ Standard React lifecycle hooks (useEffect, useState, useCallback, useMemo, useRef)
- ✅ Component-local state management (useState, useReducer)
- ✅ Side effects within component scope (useEffect for animations, event listeners, etc.)
- ✅ React Context consumption (for theme, auth, etc. — see Section 10)
- ✅ Custom hooks for component logic encapsulation

**CONSTRAINTS:**
- Must be functional components (no class components without justification)
- Must use TypeScript with strict mode
- Must handle cleanup in useEffect return functions
- Must avoid memory leaks (event listeners, timers, subscriptions)

**PROHIBITED:**
- ❌ Direct DOM manipulation outside React (except for specific accessibility/focus needs)
- ❌ Global state mutations outside React state management
- ❌ Lifecycle methods that bypass React's reconciliation

---

### 4.2 Component Props Contract

**REQUIRED PROP:**
```typescript
interface TutorialBlockProps {
  block: TutorialBlock; // from UBRC contract
}
```

**UBRC TutorialBlock Interface (Minimum):**
```typescript
interface TutorialBlock {
  id: string;              // Unique block ID
  type: string;            // Block type ID (e.g., 'interactive-quiz')
  content: unknown;        // Block-specific content (type varies)
  metadata?: {
    progressRole?: 'instructional' | 'structural' | 'navigational' | 'decorative';
    expectedTimeSec?: number;
    [key: string]: unknown;
  };
}
```

**Block Implementation MUST:**
- Accept `block` prop
- Extract `block.id` and render with `data-block-id={block.id}`
- Extract `block.type` and render with `data-block-type={block.type}`
- Parse `block.content` according to block-specific schema
- NOT mutate `block` prop (immutability)

**Block Implementation MAY:**
- Define additional props for configuration (e.g., `onInteraction?: () => void`)
- Accept optional styling props (e.g., `className`, `style`)
- Accept optional accessibility props (e.g., `aria-label`)

---

## 5. WHAT A BLOCK MAY ACCESS

### 5.1 React Ecosystem

**PERMITTED:**
- ✅ React (v18+ hooks, concurrent features)
- ✅ React Router (for navigation if needed — see Section 15)
- ✅ React Context (theme, auth, feature flags — see Section 10)
- ✅ Standard React patterns (render props, compound components, etc.)

---

### 5.2 Shared UI Components

**PERMITTED:**
- ✅ Import from shared UI library (e.g., `@repo/ui-components`)
- ✅ Use design system components (buttons, inputs, cards, etc.)
- ✅ Use icon libraries specified in project
- ✅ Use animation libraries approved in project (e.g., Framer Motion)

**CONSTRAINT:**
- Must NOT bundle duplicate UI libraries
- Must use existing design system rather than importing new component libraries

---

### 5.3 Utility Libraries

**PERMITTED:**
- ✅ Lodash/utility functions already in dependencies
- ✅ Date formatting (date-fns, dayjs, etc. — if already in project)
- ✅ Validation libraries (zod, yup — if already in project)
- ✅ Math/calculation utilities

**CONSTRAINT:**
- Must use existing dependencies when available
- New dependencies require Gate 2 approval (Phase 0.3)

---

### 5.4 Browser APIs

**PERMITTED:**
- ✅ localStorage/sessionStorage (for ephemeral UI state, NOT learning state)
- ✅ Intersection Observer (for visibility detection within block)
- ✅ Resize Observer (for responsive behavior)
- ✅ Clipboard API (for copy-to-clipboard features)
- ✅ Canvas/SVG APIs (for visualizations)
- ✅ Audio/Video APIs (for media playback)
- ✅ Geolocation (with user permission, if justified)
- ✅ Web Workers (for heavy computation, if justified)

**CONSTRAINT:**
- Must handle API unavailability (progressive enhancement)
- Must clean up resources on unmount
- Must respect user permissions (e.g., clipboard, geolocation)

---

## 6. WHAT A BLOCK MUST NOT ACCESS

### 6.1 Direct Backend Access — PROHIBITED

**PROHIBITED:**
- ❌ Direct database queries from block component
- ❌ Direct API calls to learning progress endpoints
- ❌ Direct manipulation of `block_learning_state` table
- ❌ Direct WebSocket connections to RSSB

**RATIONALE:**
- Backend access is orchestrated by Universal ILS Runtime
- Direct access bypasses UBRC → ILS → LSNB → RSSB architecture
- Direct access breaks multi-client synchronization
- Direct access violates separation of concerns

**EXCEPTION PROCESS:**
- If block requires backend data (e.g., quiz questions from API):
  - Data should be fetched by Tutorial Page Composer BEFORE block render
  - Data should be passed via `block.content` prop
  - OR: Block may use approved API client with rate limiting/caching
- If exception needed: STOP → Gate 2 → Human evaluates architecture

---

### 6.2 Learning State Management — PROHIBITED

**PROHIBITED:**
- ❌ Implementing own completion tracking logic
- ❌ Implementing own active time timer
- ❌ Calling `LearningProgressService.recordBlockCompletion()` directly
- ❌ Writing to `block_learning_state` via any means
- ❌ Managing own "completed" state that persists

**RATIONALE:**
- Completion tracking is Universal ILS Runtime's responsibility
- Blocks with `progressRole='instructional'` are tracked automatically
- Manual completion calls risk double-counting or inconsistent state

**CORRECT PATTERN:**
- Block renders content
- Block handles user interaction (e.g., quiz submission)
- Block updates internal UI state (e.g., "answer submitted")
- Universal ILS Runtime detects block engagement via scroll/time
- Universal ILS Runtime records completion when threshold met

**EXCEPTION PROCESS:**
- If block needs explicit completion trigger (e.g., quiz pass/fail):
  - STOP → Gate 2 → Human evaluates completion criteria
  - May define custom completion event that ILS Runtime listens for
  - May adjust `progressRole` or `expectedTimeSec` metadata
  - Must NOT bypass ILS Runtime orchestration

---

### 6.3 LSNB/RSSB Direct Access — PROHIBITED

**PROHIBITED:**
- ❌ Publishing events to LSNB directly
- ❌ Subscribing to LSNB events directly (without approved pattern)
- ❌ Opening WebSocket connections to RSSB
- ❌ Implementing own real-time sync logic

**RATIONALE:**
- LSNB/RSSB are orchestrated by Universal ILS Runtime
- Direct access breaks coordination guarantees
- Direct access risks event duplication or missed events

**PERMITTED PATTERN (Read-Only):**
- Block MAY subscribe to LSNB events for UI reactivity (e.g., show confetti when block completed)
- Subscription must use approved hook/utility (e.g., `useLearningStateListener()`)
- Subscription must be read-only (no publishing)

**EXCEPTION PROCESS:**
- If block needs to emit domain events (e.g., "quiz answered"):
  - Define event schema
  - STOP → Gate 2 → Human evaluates event necessity
  - If approved: emit via approved event bus (may be separate from LSNB)

---

### 6.4 Global State Mutations — PROHIBITED

**PROHIBITED:**
- ❌ Mutating global variables (window.*, global.*)
- ❌ Writing to shared state outside React Context
- ❌ Polluting global namespace
- ❌ Storing sensitive data in global scope

**RATIONALE:**
- Global mutations break component isolation
- Global state is difficult to test and debug
- Global state risks conflicts between blocks

**PERMITTED:**
- React Context consumption (read-only or via approved actions)
- State management via approved libraries (e.g., Zustand, Jotai — if in project)

---

### 6.5 Security-Sensitive Operations — PROHIBITED

**PROHIBITED:**
- ❌ Direct authentication/authorization logic in block
- ❌ Storing secrets/tokens in block code
- ❌ Bypassing authentication checks
- ❌ Executing user-provided code (eval, Function constructor, etc.)
- ❌ Rendering unsanitized HTML (XSS risk)
- ❌ Making cross-origin requests without CORS validation

**RATIONALE:**
- Security is platform-level concern
- Blocks operate within authenticated session established by platform
- Blocks must trust platform authentication, not re-implement it

**PERMITTED:**
- Access current user context via approved React Context (read-only)
- Render content appropriate to user role (if role provided via context)
- Use platform's sanitization utilities for user-generated content

---

## 7. UBRC BOUNDARY

### 7.1 UBRC Contract Compliance

**REQUIRED:**
- ✅ Component accepts `block: TutorialBlock` prop
- ✅ Component renders with `data-block-id={block.id}`
- ✅ Component renders with `data-block-type={block.type}`
- ✅ Component parses `block.content` according to its schema
- ✅ Component respects `block.metadata` (if applicable)

**VERIFICATION:**
- Project LLM must verify UBRC compliance in Phase 11 (UBRC Integration)
- Must include unit test: "renders with required data attributes"
- Must include integration test: "TutorialBlockRenderer can render this block"

---

### 7.2 Metadata Contract

**REQUIRED METADATA:**
```typescript
{
  progressRole: 'instructional' | 'structural' | 'navigational' | 'decorative',
  expectedTimeSec: number, // realistic engagement time
}
```

**progressRole Semantics:**
- `'instructional'` — Block teaches/assesses/practices a concept → completion tracked
- `'structural'` — Block organizes content (e.g., tabs, accordions) → NOT tracked
- `'navigational'` — Block provides navigation (e.g., TOC, breadcrumbs) → NOT tracked
- `'decorative'` — Block provides visual enhancement (e.g., divider, illustration) → NOT tracked

**expectedTimeSec Guidelines:**
- Should represent realistic engagement time for average learner
- Used by ILS Runtime in completion formula: `active time ≥ 0.8 × expected time`
- Audit existing blocks for calibration (see Phase 7 — Repository Audit)

**VERIFICATION:**
- Must define metadata at Gate 2 (Architecture Review)
- Metadata becomes permanent contract (cannot change without migration)

---

## 8. ILS BOUNDARY

### 8.1 ILS Participation Model

**Automatic Participation (progressRole='instructional'):**
- Block renders with DOM identity
- ILS Runtime detects block in Tutorial Page
- ILS Runtime tracks scroll visibility via Intersection Observer
- ILS Runtime accumulates active time when block visible
- ILS Runtime applies completion formula
- ILS Runtime calls backend service when threshold met

**No Code Required in Block:**
- Block does NOT call any ILS API
- Block does NOT track its own time
- Block does NOT declare itself complete

**Verification Required:**
- Phase 12 (ILS Integration) must verify:
  - Block renders with correct DOM attributes
  - Block appears in ILS Runtime's tracked blocks
  - Active time accumulates when block scrolled into view
  - Completion recorded when threshold met

---

### 8.2 ILS Completion Formula

**Current Formula (Verified in Audit):**
```
completion = (activeTimeSec >= expectedTimeSec × 0.80)
```

**Block Influence:**
- Block defines `expectedTimeSec` in metadata
- Block does NOT define completion threshold (0.80 is platform constant)
- Block does NOT override completion logic

**Exception Process:**
- If block requires different completion criteria (e.g., explicit quiz pass):
  - STOP → Gate 2 → Human evaluates
  - May define custom completion event
  - May adjust formula (requires ILS Runtime modification → prohibited zone)
  - May use alternative completion signal (if supported by ILS)

---

## 9. LSNB BOUNDARY

### 9.1 LSNB Participation Model

**Automatic Participation:**
- When ILS Runtime records completion, event published to LSNB
- LSNB broadcasts event to all subscribers
- Tutorial Page UI reacts (e.g., progress bar updates, confetti, etc.)

**Block Read-Only Participation:**
- Block MAY subscribe to LSNB events for UI reactivity
- Block must use approved hook (e.g., `useLearningStateListener()`)
- Block must handle event cleanup on unmount

**Block MUST NOT:**
- Publish events to LSNB directly
- Bypass LSNB event schema
- Emit completion events manually

---

### 9.2 LSNB Event Schema

**Standard Completion Event (Example):**
```typescript
{
  type: 'block.completed',
  blockId: string,
  tutorialId: string,
  userId: string,
  timestamp: string,
  metadata: {
    activeTimeSec: number,
    expectedTimeSec: number,
    completionRatio: number,
  }
}
```

**Block Consumption:**
- If block needs to react to own completion (e.g., show badge):
  ```typescript
  useLearningStateListener('block.completed', (event) => {
    if (event.blockId === block.id) {
      // Update UI to show completion badge
    }
  });
  ```

**Verification:**
- Phase 13 (LSNB Integration) must verify LSNB events fire correctly

---

## 10. RSSB BOUNDARY

### 10.1 RSSB Participation Model

**Automatic Participation:**
- ILS Runtime coordinates with RSSB automatically
- Learning state synchronized across tabs/devices via RSSB
- Block does NOT interact with RSSB directly

**Data Flow:**
```
Block interaction
      ↓
ILS Runtime detects completion
      ↓
ILS Runtime → Backend Service (recordBlockCompletion)
      ↓
Backend → block_learning_state table
      ↓
Backend → RSSB (WebSocket broadcast)
      ↓
RSSB → All connected clients
      ↓
LSNB receives update
      ↓
Tutorial Page UI updates
```

**Block Responsibility:**
- None. RSSB is completely transparent to block.

**Verification:**
- Phase 14 (RSSB Integration) must verify:
  - Completion in Tab A reflects in Tab B
  - Completion in Browser A reflects in Browser B (same user)
  - No duplicate completion records

---

### 10.2 RSSB Data Contract

**Backend Storage (Verified in Audit):**
```sql
block_learning_state (
  id,
  user_id,
  tutorial_id,
  block_id,
  visit_count,
  revision_count,
  active_time_sec,
  expected_time_sec,
  completed_at,
  first_visited_at,
  last_visited_at,
  metadata
)
```

**Block Does NOT:**
- Read from this table directly
- Write to this table directly
- Know this table exists

**Platform Responsibility:**
- Expose learning state via approved API/Context (if block needs read access)
- Maintain RSSB WebSocket connections
- Handle reconnection, conflict resolution, etc.

---

## 11. COMPLETION BOUNDARY

### 11.1 Completion Authority

**Authority Hierarchy:**
1. Universal ILS Runtime — decides completion
2. Backend Service (recordBlockCompletion) — persists completion
3. RSSB — synchronizes completion
4. LSNB — broadcasts completion
5. Block — reacts to completion (UI only)

**Block Does NOT Decide Completion.**

---

### 11.2 Completion Triggers

**Standard Trigger (progressRole='instructional'):**
- Active time ≥ 80% of expected time
- Automatically detected by ILS Runtime

**Custom Trigger (Requires Gate 2 Approval):**
- Explicit event (e.g., quiz submission with passing score)
- Must be defined at Gate 2
- Must be implemented in coordination with ILS Runtime (may require runtime modification)

**Example Custom Trigger:**
- Block emits domain event: `quizPassed`
- ILS Runtime listens for `quizPassed`
- ILS Runtime records completion when event fires (instead of time-based)
- This requires ILS Runtime extension → Gate 2 approval

---

### 11.3 Completion Idempotency

**Platform Guarantee:**
- Completion can be recorded multiple times without duplication
- `recordBlockCompletion()` is idempotent
- First completion sets `completed_at` timestamp
- Subsequent calls update `last_visited_at` but don't create new records

**Block Responsibility:**
- None. Idempotency is platform concern.

---

## 12. STATE MANAGEMENT BOUNDARY

### 12.1 Component-Local State (PERMITTED)

**USE CASE:**
- UI state that doesn't need persistence (e.g., form input, dropdown open/closed, animation state)

**PATTERN:**
```typescript
const [answerInput, setAnswerInput] = useState('');
const [isSubmitted, setIsSubmitted] = useState(false);
const [showFeedback, setShowFeedback] = useState(false);
```

**PERMITTED:**
- useState, useReducer, useRef for component state
- State resets on unmount (ephemeral)
- State does NOT persist to backend

---

### 12.2 Ephemeral UI State (PERMITTED with Constraint)

**USE CASE:**
- UI preferences that survive page refresh (e.g., "collapsed" state of optional content)

**PATTERN:**
```typescript
const [isCollapsed, setIsCollapsed] = useLocalStorage('block-123-collapsed', false);
```

**PERMITTED:**
- localStorage/sessionStorage for UI preferences
- Must use block-specific keys (namespaced by block ID)
- Must NOT store learning state (e.g., "completed", "time spent")

**PROHIBITED:**
- Storing learning progress in localStorage
- Using localStorage as completion tracking mechanism

---

### 12.3 Persistent Learning State (PROHIBITED)

**PROHIBITED IN BLOCK:**
- ❌ Storing "completed" flag in localStorage
- ❌ Storing "time spent" in localStorage
- ❌ Storing "progress" in localStorage
- ❌ Implementing own backend API for learning state

**CORRECT PATTERN:**
- Learning state is stored in `block_learning_state` table by ILS Runtime
- Block can READ learning state via approved Context/API
- Block cannot WRITE learning state directly

**Exception:**
- If block needs to store domain-specific state (e.g., quiz attempt history):
  - STOP → Gate 2 → Human evaluates necessity
  - May define custom table/API for domain state (separate from learning state)
  - Must coordinate with backend architecture

---

## 13. NETWORK / API BOUNDARY

### 13.1 API Access Patterns

**PERMITTED:**
- ✅ Fetching block content from approved API (if content not in `block.content`)
- ✅ Submitting user responses to approved API (e.g., quiz answer validation)
- ✅ Using approved API client library (with rate limiting, caching, auth)

**REQUIRED:**
- Must use platform's API client (with authentication headers)
- Must handle loading states (skeleton, spinner, etc.)
- Must handle error states (retry, error message, etc.)
- Must handle network offline (graceful degradation)

**PROHIBITED:**
- ❌ Making unauthenticated API calls
- ❌ Calling external third-party APIs without approval
- ❌ Bypassing platform's API layer
- ❌ Implementing own fetch wrapper that bypasses auth

---

### 13.2 Rate Limiting & Caching

**REQUIRED:**
- Must respect API rate limits (use platform's rate-limited client)
- Must cache responses when appropriate (use platform's caching layer)
- Must deduplicate requests (e.g., using React Query, SWR, or platform equivalent)

**PROHIBITED:**
- ❌ Polling APIs without exponential backoff
- ❌ Making redundant requests on every render
- ❌ Fetching same data multiple times without caching

---

### 13.3 External APIs

**GATE-CONTROLLED:**
- If block needs external API (e.g., code execution sandbox, AI service):
  - STOP → Gate 2 → Human evaluates necessity, security, cost
  - Must document API contract
  - Must handle API unavailability
  - Must secure API keys (backend proxy, not client-side)

---

## 14. DATABASE BOUNDARY

### 14.1 Database Access — PROHIBITED

**PROHIBITED IN BLOCK:**
- ❌ Direct SQL queries
- ❌ Direct ORM usage (Drizzle, Prisma, etc.)
- ❌ Direct database connections
- ❌ Reading from `block_learning_state` table

**RATIONALE:**
- Database access is backend concern
- Blocks run in browser (no direct DB access possible)
- Learning state is managed by ILS Runtime + Backend Service

**CORRECT PATTERN:**
- Block fetches data via API
- API backed by appropriate service layer
- Service layer queries database

---

## 15. AUTHENTICATION / AUTHORIZATION BOUNDARY

### 15.1 Authentication — READ-ONLY

**PERMITTED:**
- ✅ Access current user context via React Context (read-only)
- ✅ Render content appropriate to user role
- ✅ Show/hide features based on user permissions (if provided via context)

**Example:**
```typescript
const { user } = useAuth(); // Approved context hook
if (user.role === 'admin') {
  return <AdminView />;
}
return <StudentView />;
```

**PROHIBITED:**
- ❌ Implementing own authentication logic
- ❌ Storing authentication tokens in block
- ❌ Making authentication decisions (e.g., "is user allowed to see this?")
- ❌ Bypassing platform authentication

**RATIONALE:**
- Tutorial Page is already authenticated (user session exists)
- Block operates within authenticated context
- Block trusts platform's authentication

---

### 15.2 Authorization — PLATFORM-CONTROLLED

**PLATFORM RESPONSIBILITY:**
- Determine if user has access to tutorial
- Determine if user has access to specific block (if content gated)
- Provide user role/permissions via Context

**BLOCK RESPONSIBILITY:**
- Render content appropriate to user permissions
- Show appropriate error message if content unavailable

**PROHIBITED:**
- ❌ Making authorization API calls from block
- ❌ Implementing own permission checks
- ❌ Showing unauthorized content then hiding it (flash of content)

---

## 16. NAVIGATION BOUNDARY

### 16.1 Internal Navigation (PERMITTED)

**USE CASE:**
- Block needs to link to another tutorial or resource

**PATTERN:**
```typescript
import { Link } from 'react-router-dom';
<Link to="/tutorials/advanced-react">Next Tutorial</Link>
```

**PERMITTED:**
- React Router Link component
- Programmatic navigation via `useNavigate()` (with user action)

**PROHIBITED:**
- ❌ Direct `window.location` manipulation (except for external links)
- ❌ Navigation without user action (e.g., auto-redirect on render)
- ❌ Breaking browser back button behavior

---

### 16.2 External Navigation (PERMITTED with Constraint)

**USE CASE:**
- Block links to external documentation, MDN, etc.

**PATTERN:**
```typescript
<a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer">
  Read more on MDN
</a>
```

**REQUIRED:**
- Must use `target="_blank"` for external links
- Must include `rel="noopener noreferrer"` for security
- Should indicate external link in UI (icon, text, etc.)

---

### 16.3 Tutorial Flow Control — PROHIBITED

**PROHIBITED:**
- ❌ Forcing user to next block/section programmatically
- ❌ Implementing own "Next" / "Previous" buttons (unless approved pattern exists)
- ❌ Changing tutorial structure/order dynamically

**RATIONALE:**
- Tutorial flow is controlled by Tutorial Page Composer
- Navigation UI is platform concern
- Blocks should not hijack tutorial flow

**EXCEPTION:**
- If block is specifically a navigation block (progressRole='navigational'):
  - May provide tutorial-wide navigation (e.g., table of contents)
  - Must coordinate with Tutorial Page Composer
  - STOP → Gate 2 → Human evaluates navigation pattern

---

## 17. TELEMETRY BOUNDARY

### 17.1 Analytics Events (PERMITTED with Approved API)

**USE CASE:**
- Track user interactions for product analytics (e.g., "quiz attempted", "hint revealed")

**PATTERN:**
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'; // Approved hook
const { trackEvent } = useAnalytics();

const handleQuizSubmit = () => {
  trackEvent('quiz_submitted', { blockId: block.id, questionCount: 5 });
};
```

**PERMITTED:**
- Tracking user interactions via approved analytics API
- Emitting domain events (e.g., "code_executed", "quiz_passed")

**REQUIRED:**
- Must use platform's analytics API (ensures proper user consent, privacy compliance)
- Must NOT send PII without user consent
- Must include block ID in events (for attribution)

**PROHIBITED:**
- ❌ Implementing own analytics (e.g., direct Google Analytics, Mixpanel, etc.)
- ❌ Sending data to external services without platform approval
- ❌ Tracking user behavior without consent

---

### 17.2 Error Tracking (PERMITTED with Approved API)

**USE CASE:**
- Report block errors to error tracking service (e.g., Sentry)

**PATTERN:**
```typescript
import { useErrorReporter } from '@/hooks/useErrorReporter';
const { reportError } = useErrorReporter();

try {
  // Block logic
} catch (error) {
  reportError(error, { blockId: block.id, blockType: block.type });
}
```

**PERMITTED:**
- Reporting errors via platform's error tracking API
- Including block context in error reports

**PROHIBITED:**
- ❌ Implementing own error tracking
- ❌ Sending errors to external service directly

---

### 17.3 Performance Monitoring (PERMITTED)

**USE CASE:**
- Monitor block performance (e.g., render time, interaction latency)

**PATTERN:**
```typescript
useEffect(() => {
  const start = performance.now();
  // Block logic
  const end = performance.now();
  reportPerformance('block_render_time', end - start, { blockId: block.id });
}, []);
```

**PERMITTED:**
- Using browser Performance API
- Reporting metrics via approved API

**PROHIBITED:**
- ❌ Blocking rendering to collect performance data
- ❌ Over-instrumenting (every mouse move, etc.)

---

## 18. DOM IDENTITY REQUIREMENTS

### 18.1 Required DOM Attributes

**MUST RENDER:**
```tsx
<div 
  data-block-id={block.id}
  data-block-type={block.type}
  className="tutorial-block"
>
  {/* Block content */}
</div>
```

**RATIONALE:**
- ILS Runtime uses `data-block-id` to identify blocks
- Completion tracking relies on Intersection Observer targeting `[data-block-id]`
- Missing attributes = block NOT tracked = completion never recorded

**VERIFICATION:**
- Phase 11 (UBRC Integration) must verify DOM attributes present
- Must include test: "renders with data-block-id attribute"

---

### 18.2 DOM Structure Constraints

**PERMITTED:**
- Any DOM structure within root element
- Semantic HTML (headings, lists, etc.)
- ARIA attributes for accessibility

**PROHIBITED:**
- ❌ Rendering multiple root elements without wrapper
- ❌ Rendering without root element (fragment at top level breaks tracking)

**CORRECT:**
```tsx
<div data-block-id={block.id} data-block-type={block.type}>
  <h2>Quiz</h2>
  <form>...</form>
</div>
```

**INCORRECT:**
```tsx
<>
  <h2>Quiz</h2>
  <form>...</form>
</> 
// ❌ No data-block-id attribute → NOT tracked
```

---

## 19. REACT / RUNTIME REQUIREMENTS

### 19.1 React Version

**REQUIRED:**
- Must be compatible with project's React version (verify in Phase 7 — Repository Audit)
- Must use functional components (not class components without justification)
- Must follow React 18+ patterns (concurrent features, suspense, etc.)

---

### 19.2 TypeScript

**REQUIRED:**
- All block code must be TypeScript
- Must pass `tsc --noEmit` (no type errors)
- Must use strict mode (`"strict": true` in tsconfig.json)
- Must define props interface
- Must avoid `any` (use `unknown` if type truly unknown)

---

### 19.3 Dependencies

**CONSTRAINT:**
- New dependencies require Gate 2 approval (Phase 0.3)
- Must use existing dependencies when possible
- Must document why new dependency needed

---

## 20. SSR / HYDRATION BOUNDARY

### 20.1 Server-Side Rendering Compatibility

**IF PROJECT USES SSR (verify in Phase 7 — Repository Audit):**

**REQUIRED:**
- Block must render on server without errors
- Block must hydrate on client without mismatches
- Block must handle `window` / `document` unavailability

**PATTERN:**
```typescript
useEffect(() => {
  // Client-only code (window, document, localStorage, etc.)
  if (typeof window !== 'undefined') {
    // Safe to access window
  }
}, []);
```

**PROHIBITED:**
- ❌ Accessing `window` / `document` during render (outside useEffect)
- ❌ Using browser APIs without typeof check (in SSR context)

---

### 20.2 Hydration Mismatches

**REQUIRED:**
- Server HTML must match initial client render
- No conditional rendering based on client-only state in initial render

**COMMON PITFALLS:**
- Rendering current time (server time ≠ client time)
- Rendering random content (server random ≠ client random)
- Rendering based on localStorage (not available on server)

**CORRECT PATTERN:**
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) {
  return <div>Loading...</div>; // Same on server and initial client render
}
return <div>{localStorage.getItem('key')}</div>; // Only after hydration
```

---

## 21. BRAND / THEME BOUNDARY

### 21.1 Theme Compliance

**REQUIRED:**
- Block must use platform's design tokens (colors, spacing, typography, etc.)
- Block must respond to theme changes (light/dark mode if supported)
- Block must not hard-code colors, spacing, etc.

**PATTERN:**
```typescript
import { useTheme } from '@/contexts/ThemeContext';
const theme = useTheme();

<div style={{ color: theme.colors.text, padding: theme.spacing.md }}>
  Content
</div>
```

**OR (CSS variables):**
```css
.block {
  color: var(--color-text);
  padding: var(--spacing-md);
}
```

---

### 21.2 Brand Consistency

**REQUIRED:**
- Use platform's component library (buttons, inputs, etc.)
- Follow platform's visual patterns
- No custom UI that violates brand guidelines

**GATE-CONTROLLED:**
- If block requires custom styling beyond design system:
  - STOP → Gate 2 → Human evaluates
  - May approve exception if justified (e.g., data visualization)
  - May require design review

---

## 22. SECURITY BOUNDARY

### 22.1 XSS Prevention

**REQUIRED:**
- Never use `dangerouslySetInnerHTML` without sanitization
- Use approved sanitization library (e.g., DOMPurify)
- Escape user-generated content
- Validate all inputs

**PROHIBITED:**
- ❌ Rendering raw HTML from `block.content` without sanitization
- ❌ Executing user-provided code (eval, Function, etc.)
- ❌ Constructing HTML strings manually

---

### 22.2 Data Validation

**REQUIRED:**
- Validate `block.content` structure (use Zod, Yup, or TypeScript guards)
- Handle malformed content gracefully (error boundary)
- Never trust external data

**PATTERN:**
```typescript
import { z } from 'zod';
const QuizContentSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
});

const content = QuizContentSchema.parse(block.content); // Throws if invalid
```

---

### 22.3 Sensitive Data

**PROHIBITED:**
- ❌ Storing secrets in block code
- ❌ Logging sensitive user data
- ❌ Exposing authentication tokens
- ❌ Transmitting PII without encryption

---

## 23. ARCHITECTURE STOP CONDITIONS

### 23.1 Automatic STOP Triggers

**Project LLM must STOP immediately if:**
1. Block requires direct database access
2. Block requires modification to ILS Runtime core services
3. Block requires new completion tracking logic
4. Block requires direct RSSB/LSNB publishing
5. Block requires new backend table/migration
6. Block requires external API without approval
7. Block requires global state mutations
8. Block requires authentication/authorization logic
9. Block violates any PROHIBITED zone (Phase 0.3)

**When STOP triggered:**
- Document violation in phase log
- Prepare Gate 2 evidence package
- Request human architecture decision
- Do NOT proceed, attempt workaround, or silently adjust

---

### 23.2 Manual STOP (Project LLM Discretion)

**Project LLM should STOP if:**
- Block architecture unclear or ambiguous
- Multiple implementation approaches with unclear tradeoffs
- Block pattern not seen in existing blocks (D1, C1, etc.)
- Risk of breaking existing tutorial functionality
- Uncertainty about UBRC/ILS/LSNB/RSSB compliance

**When uncertain: STOP and request human guidance.**

---

## 24. HUMAN APPROVAL RELATIONSHIP

### 24.1 Gate 2 — Architecture Review

**This contract's requirements feed into Gate 2 Evidence Package:**

**Evidence Required:**
- ✅ Block respects all runtime boundaries (Sections 4-22)
- ✅ No prohibited operations attempted (Section 6)
- ✅ UBRC contract compliance verified (Section 7)
- ✅ ILS participation model verified (Section 8)
- ✅ DOM identity requirements met (Section 18)
- ✅ No STOP conditions triggered (Section 23)

**Human Decision:**
- Review runtime boundary compliance
- Approve/reject architecture
- Approve exceptions (if requested)
- Require redesign (if boundaries violated)

---

## 25. RUNTIME VERIFICATION REQUIREMENTS

### 25.1 Phase 11 — UBRC Integration

**MUST VERIFY:**
- Block renders with `data-block-id` attribute
- Block renders with `data-block-type` attribute
- Block accepts `block` prop
- Block parses `block.content` correctly
- TutorialBlockRenderer can render block

---

### 25.2 Phase 12 — ILS Integration

**MUST VERIFY:**
- Block appears in ILS Runtime's tracked blocks list
- Active time accumulates when block scrolled into view
- Completion recorded when threshold met (80% of expectedTimeSec)
- `recordBlockCompletion()` called with correct parameters
- `block_learning_state` table updated correctly

---

### 25.3 Phase 13 — LSNB Integration

**MUST VERIFY:**
- Completion event published to LSNB
- Event schema correct
- Event received by subscribers
- Tutorial Page UI reacts to event

---

### 25.4 Phase 14 — RSSB Integration

**MUST VERIFY:**
- Completion synced across browser tabs
- Completion synced across devices (same user)
- No duplicate completion records
- WebSocket events fire correctly

---

## 26. ENFORCEMENT RULES

### 26.1 Project LLM Obligations

**MUST:**
- Verify block compliance with ALL sections of this contract
- STOP when prohibited operations detected
- Document runtime boundary compliance in phase log
- Include runtime boundary tests in test suite

**MUST NOT:**
- Implement prohibited operations (Section 6)
- Bypass runtime boundaries
- Assume "probably fine" without verification
- Skip verification phases (11-14)

---

### 26.2 External AI Obligations

**MUST:**
- Design block within runtime boundaries
- Document runtime dependencies
- Explain why specific APIs/services needed

**MUST NOT:**
- Implement direct backend access
- Implement own completion tracking
- Ignore runtime boundaries in design

**NOTE:**
External AI does NOT have access to this contract during initial design. Project LLM must verify compliance after handoff.

---

## 27. EXAMPLES

### 27.1 CORRECT: Interactive Quiz Block

```typescript
import { useState } from 'react';
import { Button } from '@repo/ui-components';

interface QuizBlockProps {
  block: TutorialBlock;
}

export const InteractiveQuiz = ({ block }: QuizBlockProps) => {
  const content = parseQuizContent(block.content); // Validate content
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    // ILS Runtime will track completion automatically via time spent
    // No need to call recordBlockCompletion()
  };

  return (
    <div 
      data-block-id={block.id} 
      data-block-type={block.type}
      className="tutorial-block quiz-block"
    >
      <h3>{content.question}</h3>
      {content.options.map((option, idx) => (
        <label key={idx}>
          <input
            type="radio"
            value={idx}
            checked={selectedAnswer === idx}
            onChange={() => setSelectedAnswer(idx)}
            disabled={submitted}
          />
          {option}
        </label>
      ))}
      <Button onClick={handleSubmit} disabled={submitted || selectedAnswer === null}>
        Submit Answer
      </Button>
      {submitted && (
        <div className={selectedAnswer === content.correctAnswer ? 'correct' : 'incorrect'}>
          {selectedAnswer === content.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
        </div>
      )}
    </div>
  );
};
```

**WHY CORRECT:**
- ✅ Accepts `block` prop
- ✅ Renders with `data-block-id` and `data-block-type`
- ✅ Uses component-local state (useState)
- ✅ Does NOT call completion APIs
- ✅ ILS Runtime handles completion automatically
- ✅ Uses platform UI components (Button)

---

### 27.2 INCORRECT: Quiz with Manual Completion

```typescript
// ❌ INCORRECT - DO NOT IMPLEMENT
import { useState } from 'react';
import { recordBlockCompletion } from '@/services/learningProgress'; // ❌ Direct import

export const IncorrectQuiz = ({ block }: QuizBlockProps) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitted(true);
    // ❌ PROHIBITED: Direct completion call
    await recordBlockCompletion(block.id);
  };

  // ❌ Missing data-block-id attribute
  return (
    <div className="quiz-block">
      {/* content */}
    </div>
  );
};
```

**WHY INCORRECT:**
- ❌ Calls `recordBlockCompletion()` directly (Section 6.2 prohibition)
- ❌ Missing `data-block-id` attribute (Section 18 requirement)
- ❌ Bypasses ILS Runtime orchestration
- ❌ Risks duplicate completion records

---

### 27.3 INCORRECT: Quiz with Own Timer

```typescript
// ❌ INCORRECT - DO NOT IMPLEMENT
import { useState, useEffect } from 'react';
import { updateBlockProgress } from '@/api/progress'; // ❌

export const IncorrectTimedQuiz = ({ block }: QuizBlockProps) => {
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    // ❌ PROHIBITED: Own timer
    const interval = setInterval(() => {
      setTimeSpent(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // ❌ PROHIBITED: Manual progress tracking
    if (timeSpent >= 60) {
      updateBlockProgress(block.id, { completed: true });
    }
  }, [timeSpent]);

  return <div>{/* content */}</div>;
};
```

**WHY INCORRECT:**
- ❌ Implements own timer (Section 6.2 prohibition)
- ❌ Tracks own completion (Section 6.2 prohibition)
- ❌ Bypasses ILS Runtime time tracking
- ❌ Duplicate tracking logic

---

## 28. CROSS-CONTRACT DEPENDENCIES

### 28.1 Phase 0.1 — AI Roles & Responsibility

**Dependency:**
- Phase 0.1 defines Project LLM as repository integration actor
- Phase 0.4 (this contract) defines WHAT Project LLM must verify about runtime
- Project LLM must enforce runtime boundaries during integration (Phase 11-14)

**Consistency Check:**
- ✅ No contradiction: Phase 0.1 says Project LLM integrates; Phase 0.4 says HOW

---

### 28.2 Phase 0.2 — Human Approval

**Dependency:**
- Phase 0.2 defines Gate 2 (Architecture Review)
- Phase 0.4 feeds evidence into Gate 2 (runtime boundary compliance)
- Human approves/rejects based on runtime boundary compliance

**Consistency Check:**
- ✅ No contradiction: Phase 0.2 says human approves architecture; Phase 0.4 defines architecture requirements

---

### 28.3 Phase 0.3 — Repository Modification

**Dependency:**
- Phase 0.3 defines what files can be modified
- Phase 0.4 defines what runtime systems block can interact with
- Both constrain block implementation

**Example:**
- Phase 0.3 says: "Cannot modify LearningProgressService"
- Phase 0.4 says: "Cannot call recordBlockCompletion() directly"
- Combined: Block cannot modify OR call completion service

**Consistency Check:**
- ✅ No contradiction: Both prohibit direct completion tracking

---

## 29. VERSIONING

**Current Version:** V1  
**Frozen Date:** 2026-09-30

**Amendment Procedure:**
- If runtime boundary must change (e.g., new ILS feature):
  - Create PHASE-0.4-RUNTIME-BOUNDARY-CONTRACT-V2.md
  - Document what changed and why
  - Freeze V2
  - Update Phase 0.2 (Human Approval) to reference V2
  - V1 remains as historical record

**Backward Compatibility:**
- Blocks created under V1 continue to operate under V1 rules
- New blocks use latest version (V2, V3, etc.)
- Major breaking changes require migration guide

---

## 30. FROZEN STATUS

**This contract is now FROZEN and defines the runtime boundary for ALL Tutorial Blocks integrated via the AI Tutorial Block Creation Lifecycle.**

**Next Contract:** Phase 0.5 — Handoff Protocol Contract

---

## APPENDIX A: QUICK REFERENCE — RUNTIME BOUNDARY CHECKLIST

**Block MUST:**
- ✅ Accept `block: TutorialBlock` prop
- ✅ Render with `data-block-id={block.id}`
- ✅ Render with `data-block-type={block.type}`
- ✅ Use component-local state (useState, useReducer)
- ✅ Use platform UI components
- ✅ Handle loading/error states
- ✅ Clean up resources on unmount

**Block MUST NOT:**
- ❌ Call `recordBlockCompletion()` directly
- ❌ Implement own completion timer
- ❌ Access database directly
- ❌ Publish to LSNB/RSSB directly
- ❌ Store learning state in localStorage
- ❌ Bypass authentication
- ❌ Mutate global state
- ❌ Render without DOM identity attributes

**Block MAY:**
- ✅ Fetch content from approved API
- ✅ Track user interactions via analytics API
- ✅ Subscribe to LSNB events (read-only)
- ✅ Use localStorage for UI preferences (not learning state)
- ✅ Access theme/auth context (read-only)

---

## APPENDIX B: VERIFICATION CHECKLIST

**Phase 11 — UBRC Integration:**
- [ ] Block renders with `data-block-id`
- [ ] Block renders with `data-block-type`
- [ ] Block accepts `block` prop
- [ ] TutorialBlockRenderer can render block

**Phase 12 — ILS Integration:**
- [ ] Block tracked by ILS Runtime
- [ ] Active time accumulates correctly
- [ ] Completion recorded at 80% threshold
- [ ] Backend receives completion call

**Phase 13 — LSNB Integration:**
- [ ] Completion event published to LSNB
- [ ] Event schema correct
- [ ] Tutorial Page UI reacts

**Phase 14 — RSSB Integration:**
- [ ] Completion synced across tabs
- [ ] Completion synced across devices
- [ ] No duplicate records

---

**Document Metadata:**
- Version: V1
- Frozen Date: 2026-09-30
- Lifecycle Phase: 0.4 (Governance)
- Authority: Human Architecture Authority
- Replaces: None (initial version)
- Referenced By: Phase 0.2 (Human Approval), Phase 11-14 (Integration Phases)
