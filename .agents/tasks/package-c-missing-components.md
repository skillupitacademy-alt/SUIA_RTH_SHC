# Package C: Missing Components

The following components mentioned in the original instructions were not found in the codebase:

1. **WorkflowPanel.tsx** - Does not exist
2. **AgentConfig.tsx** - Does not exist  
3. **WorkflowHistory.tsx** - Does not exist

## Actual Components Implemented

Instead, Package C wires the following existing pages that contain hardcoded data:

1. **candidate-upload/page.tsx** - Candidate file upload and validation gates
2. **workflow-details/page.tsx** - Timeline, agents, evidence graph, logs
3. **integration-certification/page.tsx** - Certification status, runtime health, browser verification

These pages exist and show mock data that needs to be replaced with real API calls to the FastAPI backend via the `/api/project-llm/*` adapter.

## Future Work

If WorkflowPanel, AgentConfig, and WorkflowHistory components are created in the future, they should follow the same integration pattern established in Package C:

- Import `projectLlmClient` from `@/lib/project-llm/api/projectLlmClient`
- Use `useSearchParams()` to get workflow ID from URL
- Add loading/error states with proper UI feedback
- Call appropriate client methods with structured error handling
- Never show PASS/success status unless backend explicitly returns it
