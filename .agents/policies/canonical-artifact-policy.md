# Canonical Artifact Policy

**Applies to:** All Project AI agents (repository, architecture, implementation, test, documentation, planning, review, migration, release, orchestration)

## Core Rule

Before creating any new file, document, plan, specification, registry, report, test, configuration, or implementation artifact:

1. Search the repository
2. Search the current discovery snapshot
3. Search the evidence records
4. Identify existing artifacts serving the same purpose
5. Identify which artifact is canonical
6. Prefer updating/extending the canonical artifact
7. Create a new artifact ONLY when:
   a. No suitable canonical artifact exists, OR
   b. Architecture explicitly requires a distinct artifact
8. If creating a new artifact, document why existing cannot be extended
9. Never create duplicate artifacts for agent convenience
10. Never create new Markdown merely for agent working documents

## Examples

### ❌ Wrong
- Agent needs Introduction documentation → creates `I2.md`
- Agent needs plan → creates `M2-plan.md`, `M2-architecture.md`, `M2-roadmap.md`
- Agent needs test → creates `IntroductionBlock-I2.test.ts`

### ✅ Right
- Agent needs Introduction documentation → extends `PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`
- Agent needs M2 plan → extends `.agents/tasks/m1-m2-backlog.md`
- Agent needs test → extends existing `IntroductionBlock.test.ts`

## Canonical Artifacts (Current)

| Artifact | Canonical Path | Purpose |
|----------|---------------|---------|
| M2 Backlog | `.agents/tasks/m1-m2-backlog.md` | M2 requirements & priorities |
| Block Corpus Registry | `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` | Educational block families |
| Artifact Policy | `.agents/policies/canonical-artifact-policy.md` | This document |

## Enforcement

All Project AI workflows MUST reference this policy before creating files.
