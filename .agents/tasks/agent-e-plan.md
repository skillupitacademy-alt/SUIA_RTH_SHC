# Implementation Plan: Agent E (Creation Brief Engine)

## Summary of Existing Code Patterns

### Architecture Context
- **Monorepo**: TypeScript workspace with packages and apps
- **Types Package**: Domain contracts in `packages/types/src/project-llm/`
- **Admin Library**: Business logic in `apps/skillhubcore-admin/src/lib/project-llm/`
- **UI Components**: React Server Components in `apps/skillhubcore-admin/src/app/(admin)/tools/`
- **Fixture Pattern**: Static TypeScript constants with compile-time validation (see `projectLlmBlockCorpus.ts`, `projectLlmRepositoryIntelligence.ts`)
- **Test Framework**: Vitest with `describe()`/`it()` pattern, Node environment, `*.test.ts` suffix
- **Import Aliases**: `@quiz/types` for packages/types, `@/lib` for app-local libraries

### Existing Project LLM Components
1. **Corpus Registry** (`projectLlmBlockCorpus.ts`): 18 families, 133 versions with compile-time invariants
2. **Repository Intelligence** (`projectLlmRepositoryIntelligence.ts`): Combines corpus + runtime + primitives + reference patterns
3. **Reference Patterns** (`projectLlmReferencePatterns.ts`): I1, C1, D1 reference implementations with file paths
4. **Domain Contracts**: `corpus.ts`, `runtime.ts`, `lifecycle.ts`, `request.ts`, `compliance.ts`, `repository-intelligence.ts`
5. **UI Page** (`page.tsx`): Project LLM workbench with 6 agent lanes, corpus stats display

### Code Patterns to Match
- **Compile-time validation**: Use constants like `CORPUS_FAMILIES_TOTAL` and throw errors if mismatches detected
- **TypeScript strict mode**: Readonly properties, const assertions, explicit types
- **Functional/deterministic**: No side effects, pure functions for brief generation
- **Evidence-based**: All data references source files/paths (see `implementationEvidence` arrays)
- **Export barrel pattern**: Re-export from index.ts files
- **Component naming**: PascalCase with descriptive names (e.g., `TutorialPreviewPane`)
- **Test structure**: One describe block per module, multiple it blocks for test cases

---

## Design Decisions

### 1. Creation Brief Structure
**Decision**: Creation Brief is a structured TypeScript object with deterministic sections: corpus validation, reference implementation context, GUI-first instructions, and copyable prompt text.

**Rationale**: The brief must be machine-readable (for validation) and human-copyable (for external AI handoff). Separating metadata from prompt text allows UI to display validation status separately from the copyable payload.

### 2. Reference Implementation Resolution
**Decision**: For I2 pilot, resolve I1 as reference by querying `REFERENCE_PATTERNS` array filtered by familyId='I' and lifecycleStatus='RUNTIME_INTEGRATED'.

**Rationale**: I1 is the verified reference for Introduction family. The brief engine must deterministically find I1 and extract its key files from the reference pattern to guide I2 creation.

### 3. Validation Strategy
**Decision**: Brief generation asserts repository intelligence integrity first (corpus/runtime counts match constants), then validates family/version existence, then checks reference availability.

**Rationale**: Fail-fast validation prevents generating invalid briefs. Repository intelligence must be trustworthy before creating briefs based on it.

### 4. GUI-First Workflow Enforcement
**Decision**: Brief instructions explicitly state: "External AI must produce HTML/CSS/JS prototype first. React candidate creation only after human approval of prototype."

**Rationale**: Phase 1 workflow mandates GUI prototype → human gate → React candidate. The brief must encode this constraint so external AI cannot skip the approval gate.

### 5. No LLM Integration
**Decision**: Agent E generates static text briefs. No API calls to OpenAI/Anthropic/etc.

**Rationale**: Phase 1 is manual handoff workflow. LLM integration is Phase 2+ scope.

---

## TypeScript Interface Definitions to Create

### File: `packages/types/src/project-llm/creation-brief.ts`

```typescript
/**
 * Project LLM Creation Brief
 * 
 * Agent E contract surface for creation brief generation and validation.
 */

import { ProjectLlmLifecycleStatus } from './lifecycle';
import { ReferenceImplementationPattern } from './repository-intelligence';

export interface CreationBriefRequest {
  /** Target block family ID, e.g. "I" */
  targetFamilyId: string;
  /** Target version ID, e.g. "I2" */
  targetVersionId: string;
  /** Optional user-provided context or requirements */
  additionalContext?: string;
}

export interface CreationBriefValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CreationBrief {
  /** Unique identifier for this brief */
  id: string;
  /** Request that generated this brief */
  request: CreationBriefRequest;
  /** Timestamp of brief generation (ISO 8601) */
  generatedAt: string;
  /** Validation result from repository intelligence checks */
  validation: CreationBriefValidationResult;
  /** Reference implementation pattern resolved (if any) */
  referencePattern?: ReferenceImplementationPattern;
  /** Structured metadata sections */
  metadata: CreationBriefMetadata;
  /** Copyable external AI prompt text */
  promptText: string;
}

export interface CreationBriefMetadata {
  /** Target family name, e.g. "Introduction" */
  targetFamilyName: string;
  /** Lifecycle status of target family */
  targetLifecycleStatus: ProjectLlmLifecycleStatus;
  /** Total documented versions in target family */
  documentedVersionsCount: number;
  /** Reference version ID (e.g., "I1" for I2 pilot) */
  referenceVersionId?: string;
  /** UBRC compliance requirements */
  ubrcRequirements: string[];
  /** ILS/LSNB/RSSB safety requirements */
  runtimeSafetyRequirements: string[];
  /** Implementation primitives available */
  availablePrimitives: string[];
}

export interface CreationBriefGenerationError extends Error {
  code: 'FAMILY_NOT_FOUND' | 'VERSION_NOT_FOUND' | 'REFERENCE_NOT_FOUND' | 'REPOSITORY_INTEGRITY_ERROR';
  details?: Record<string, unknown>;
}
```

---

## Engine Function Signatures and Contracts

### File: `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.ts`

```typescript
/**
 * Project LLM Creation Brief Engine
 * 
 * Agent E: Deterministic creation brief generator that converts
 * block creation requests + repository intelligence into structured
 * external AI handoff briefs.
 */

import {
  CreationBrief,
  CreationBriefRequest,
  CreationBriefValidationResult,
  CreationBriefGenerationError,
  ReferenceImplementationPattern,
} from '@quiz/types';
import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from './projectLlmRepositoryIntelligence';

/**
 * Generate a creation brief from a request.
 * 
 * @throws {CreationBriefGenerationError} if family/version not found or repository integrity fails
 */
export function generateCreationBrief(request: CreationBriefRequest): CreationBrief;

/**
 * Validate repository intelligence integrity before brief generation.
 * 
 * Checks:
 * - Corpus family count matches CORPUS_FAMILIES_TOTAL (18)
 * - Corpus version count matches CORPUS_VERSIONS_TOTAL (133)
 * - Runtime verified count matches RUNTIME_VERIFIED_COUNT (3)
 * 
 * @returns validation result with errors/warnings
 */
export function validateRepositoryIntegrity(): CreationBriefValidationResult;

/**
 * Validate that target family and version exist in corpus.
 * 
 * @param familyId - Target family ID (e.g., "I")
 * @param versionId - Target version ID (e.g., "I2")
 * @returns validation result
 */
export function validateTargetFamilyVersion(
  familyId: string,
  versionId: string
): CreationBriefValidationResult;

/**
 * Resolve reference implementation pattern for a target family.
 * 
 * For Introduction family ("I"), returns I1 reference pattern.
 * Returns undefined if no verified reference exists.
 * 
 * @param familyId - Target family ID
 * @returns reference pattern or undefined
 */
export function resolveReferencePattern(
  familyId: string
): ReferenceImplementationPattern | undefined;

/**
 * Generate copyable external AI prompt text from brief metadata.
 * 
 * Includes:
 * - Corpus context (18 families, 133 versions)
 * - Target family/version details
 * - Reference implementation file paths (if available)
 * - UBRC identity requirements (3/3 attributes)
 * - GUI-first workflow mandate (HTML/CSS/JS → approval → React)
 * - Implementation primitives (15 available)
 * - Brand-independent design rules
 * 
 * @param brief - Creation brief with metadata
 * @returns formatted prompt text
 */
export function generatePromptText(brief: Omit<CreationBrief, 'promptText'>): string;
```

### Implementation Details

#### `generateCreationBrief`
1. Validate repository integrity (corpus/runtime counts)
2. Validate target family/version exist in corpus
3. Resolve reference pattern (I1 for I family)
4. Extract metadata (family name, lifecycle status, UBRC requirements, primitives)
5. Generate prompt text with all context
6. Return complete CreationBrief object

#### `validateRepositoryIntegrity`
- Check `corpus.status.families === 18`
- Check `corpus.status.documentedVersions === 133`
- Check `runtime.status.verifiedImplementations === 3`
- Return errors array if mismatches found

#### `validateTargetFamilyVersion`
- Find family in `corpus.families` by `familyId`
- Check if `versionId` exists in `family.documentedVersions`
- Return errors if family or version not found

#### `resolveReferencePattern`
- Filter `PROJECT_LLM_REPOSITORY_INTELLIGENCE.referencePatterns` by `familyId`
- Return first pattern with `lifecycleStatus === 'RUNTIME_INTEGRATED'`
- For I family, will return I1 pattern with keyFiles array

#### `generatePromptText`
Template structure:
```
# Educational Block Creation Brief

## Target Block
- Family: {familyName} ({familyId})
- Version: {versionId}
- Lifecycle Status: {lifecycleStatus}

## Corpus Context
- Total Families: 18
- Total Documented Versions: 133
- Verified Runtime Implementations: 3 (I1, C1, D1)

## Reference Implementation: {referenceVersionId}
{referencePattern.description}

Key Files:
{referencePattern.keyFiles.map(file => `- ${file}`).join('\n')}

## UBRC Identity Requirements
- data-block-family="{familyId}"
- data-block-version="{versionId}"
- data-block-id="{unique-id}"

## GUI-First Workflow (MANDATORY)
1. Create HTML/CSS/JS prototype in standalone files
2. Submit prototype for human approval
3. Only after approval, create React/TypeScript candidate

## Implementation Primitives Available
{primitives.list.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Runtime Safety Requirements
- ILS Participation: Passive (no ILS-breaking changes)
- LSNB Navigation: Consumer-safe (no navigation breaks)
- RSSB Runtime: Compatible (no runtime conflicts)

## Brand-Independent Design
- Use semantic HTML and CSS variables for theming
- No hardcoded brand colors or logos
- Theme-aware component structure

{additionalContext ? `## Additional Context\n${additionalContext}` : ''}
```

---

## Test Cases

### File: `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateCreationBrief,
  validateRepositoryIntegrity,
  validateTargetFamilyVersion,
  resolveReferencePattern,
  generatePromptText,
} from './projectLlmCreationBrief';
import { CreationBriefRequest } from '@quiz/types';

describe('projectLlmCreationBrief', () => {
  describe('validateRepositoryIntegrity', () => {
    it('passes when corpus and runtime counts match constants', () => {
      const result = validateRepositoryIntegrity();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateTargetFamilyVersion', () => {
    it('passes when family and version exist in corpus', () => {
      const result = validateTargetFamilyVersion('I', 'I2');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when family does not exist', () => {
      const result = validateTargetFamilyVersion('ZZZ', 'ZZZ1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Family "ZZZ" not found in corpus');
    });

    it('fails when version does not exist in family', () => {
      const result = validateTargetFamilyVersion('I', 'I99');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Version "I99" not found in family "I"');
    });
  });

  describe('resolveReferencePattern', () => {
    it('returns I1 reference pattern for Introduction family', () => {
      const pattern = resolveReferencePattern('I');
      expect(pattern).toBeDefined();
      expect(pattern?.versionId).toBe('I1');
      expect(pattern?.familyId).toBe('I');
      expect(pattern?.lifecycleStatus).toBe('RUNTIME_INTEGRATED');
      expect(pattern?.ubrcCompliance).toBe('FULL');
    });

    it('returns C1 reference pattern for Code family', () => {
      const pattern = resolveReferencePattern('C');
      expect(pattern).toBeDefined();
      expect(pattern?.versionId).toBe('C1');
    });

    it('returns D1 reference pattern for Definition family', () => {
      const pattern = resolveReferencePattern('D');
      expect(pattern).toBeDefined();
      expect(pattern?.versionId).toBe('D1');
    });

    it('returns undefined for families without verified references', () => {
      const pattern = resolveReferencePattern('O');
      expect(pattern).toBeUndefined();
    });
  });

  describe('generateCreationBrief', () => {
    it('generates valid brief for I2 pilot request', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
      };

      const brief = generateCreationBrief(request);

      expect(brief.id).toBeDefined();
      expect(brief.request).toEqual(request);
      expect(brief.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
      expect(brief.validation.isValid).toBe(true);
      expect(brief.referencePattern?.versionId).toBe('I1');
      expect(brief.metadata.targetFamilyName).toBe('Introduction');
      expect(brief.metadata.referenceVersionId).toBe('I1');
      expect(brief.promptText).toContain('Educational Block Creation Brief');
      expect(brief.promptText).toContain('Family: Introduction (I)');
      expect(brief.promptText).toContain('Version: I2');
      expect(brief.promptText).toContain('Reference Implementation: I1');
    });

    it('includes reference implementation key files in prompt', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('packages/ui/src/tutorial/blocks/IntroductionBlock.tsx');
      expect(brief.promptText).toContain('packages/ui/src/tutorial/TutorialBlockRenderer.tsx');
    });

    it('includes UBRC requirements in prompt', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('data-block-family');
      expect(brief.promptText).toContain('data-block-version');
      expect(brief.promptText).toContain('data-block-id');
    });

    it('includes GUI-first workflow mandate in prompt', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('GUI-First Workflow');
      expect(brief.promptText).toContain('HTML/CSS/JS prototype');
      expect(brief.promptText).toContain('human approval');
      expect(brief.promptText).toContain('React/TypeScript candidate');
    });

    it('includes implementation primitives in prompt', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('heading');
      expect(brief.promptText).toContain('paragraph');
      expect(brief.promptText).toContain('list');
    });

    it('includes additional context when provided', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        additionalContext: 'Focus on accessibility and semantic HTML.',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('Additional Context');
      expect(brief.promptText).toContain('Focus on accessibility');
    });

    it('throws when target family not found', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'ZZZ',
        targetVersionId: 'ZZZ1',
      };

      expect(() => generateCreationBrief(request)).toThrow('Family "ZZZ" not found');
    });

    it('throws when target version not found', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'I',
        targetVersionId: 'I99',
      };

      expect(() => generateCreationBrief(request)).toThrow('Version "I99" not found');
    });

    it('generates brief for O1 without reference pattern', () => {
      const request: CreationBriefRequest = {
        targetFamilyId: 'O',
        targetVersionId: 'O1',
      };

      const brief = generateCreationBrief(request);

      expect(brief.validation.isValid).toBe(true);
      expect(brief.referencePattern).toBeUndefined();
      expect(brief.metadata.targetFamilyName).toBe('Objective');
      expect(brief.promptText).toContain('Objective');
      expect(brief.promptText).not.toContain('Reference Implementation:');
    });
  });

  describe('generatePromptText', () => {
    it('formats prompt text with all required sections', () => {
      const briefPartial: Omit<CreationBrief, 'promptText'> = {
        id: 'brief-test-1',
        request: { targetFamilyId: 'I', targetVersionId: 'I2' },
        generatedAt: '2025-01-01T00:00:00Z',
        validation: { isValid: true, errors: [], warnings: [] },
        referencePattern: {
          versionId: 'I1',
          familyId: 'I',
          familyName: 'Introduction',
          lifecycleStatus: 'RUNTIME_INTEGRATED',
          ubrcCompliance: 'FULL',
          keyFiles: ['packages/ui/src/tutorial/blocks/IntroductionBlock.tsx'],
          description: 'I1 reference',
        },
        metadata: {
          targetFamilyName: 'Introduction',
          targetLifecycleStatus: 'DOCUMENTED',
          documentedVersionsCount: 6,
          referenceVersionId: 'I1',
          ubrcRequirements: ['data-block-family', 'data-block-version', 'data-block-id'],
          runtimeSafetyRequirements: ['ILS passive', 'LSNB safe', 'RSSB compatible'],
          availablePrimitives: ['heading', 'paragraph'],
        },
      };

      const promptText = generatePromptText(briefPartial);

      expect(promptText).toContain('# Educational Block Creation Brief');
      expect(promptText).toContain('Family: Introduction (I)');
      expect(promptText).toContain('Version: I2');
      expect(promptText).toContain('Reference Implementation: I1');
      expect(promptText).toContain('Key Files:');
      expect(promptText).toContain('UBRC Identity Requirements');
      expect(promptText).toContain('GUI-First Workflow');
      expect(promptText).toContain('Implementation Primitives Available');
    });
  });
});
```

### Test Verification
**Command**: `pnpm --filter @quiz/skillhubcore-admin test projectLlmCreationBrief.test.ts`

**Expected outcome**: All tests pass, coverage includes all exported functions.

---

## UI Component Structure

### File: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/components/CreationBriefPanel.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { FileText, Copy, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { CreationBrief, CreationBriefRequest } from '@quiz/types';
import { generateCreationBrief } from '@/lib/project-llm';

export function CreationBriefPanel() {
  const [familyId, setFamilyId] = useState('I');
  const [versionId, setVersionId] = useState('I2');
  const [additionalContext, setAdditionalContext] = useState('');
  const [brief, setBrief] = useState<CreationBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    try {
      setError(null);
      const request: CreationBriefRequest = {
        targetFamilyId: familyId.trim().toUpperCase(),
        targetVersionId: versionId.trim().toUpperCase(),
        additionalContext: additionalContext.trim() || undefined,
      };
      const generatedBrief = generateCreationBrief(request);
      setBrief(generatedBrief);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBrief(null);
    }
  };

  const handleCopy = async () => {
    if (brief?.promptText) {
      await navigator.clipboard.writeText(brief.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-outfit tracking-tight">
            Creation Brief Generator
          </h3>
          <p className="text-xs font-medium text-slate-500">
            Phase 1: I2 Pilot — External AI Handoff Brief
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Family ID
              </label>
              <input
                type="text"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                placeholder="I"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Version ID
              </label>
              <input
                type="text"
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                placeholder="I2"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
              Additional Context (Optional)
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Focus on accessibility, semantic HTML..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Generate Creation Brief
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Generation Error</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Brief Display */}
      {brief && (
        <div className="space-y-4">
          {/* Validation Status */}
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${
            brief.validation.isValid
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-orange-200 bg-orange-50'
          }`}>
            {brief.validation.isValid ? (
              <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-orange-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${
                brief.validation.isValid ? 'text-emerald-900' : 'text-orange-900'
              }`}>
                {brief.validation.isValid ? 'Validation Passed' : 'Validation Warnings'}
              </h4>
              {brief.validation.warnings.length > 0 && (
                <ul className="text-xs text-orange-700 mt-1 space-y-1">
                  {brief.validation.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Metadata Summary */}
          <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 font-outfit mb-3">Brief Metadata</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Target Family
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {brief.metadata.targetFamilyName} ({brief.request.targetFamilyId})
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Target Version
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {brief.request.targetVersionId}
                </p>
              </div>
              {brief.metadata.referenceVersionId && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Reference
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {brief.metadata.referenceVersionId}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Generated At
                </p>
                <p className="mt-1 text-xs font-mono text-slate-700">
                  {new Date(brief.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Copyable Prompt */}
          <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 font-outfit">
                External AI Prompt (Copyable)
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto border border-slate-200">
              {brief.promptText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Component Features
- **Input form**: Family ID, Version ID, Additional Context
- **Generate button**: Calls `generateCreationBrief` with form values
- **Error display**: Shows generation errors (family not found, etc.)
- **Validation status**: Green checkmark if valid, orange warning if warnings
- **Metadata summary**: Displays target family, version, reference, timestamp
- **Copyable prompt**: Pre-formatted prompt text with copy button
- **Styling**: Matches existing page.tsx patterns (gradient buttons, rounded-xl cards, shadow-xl)

---

## Page Integration Steps

### File: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`

#### Step 1: Import CreationBriefPanel
Add import at top of file:
```typescript
import { CreationBriefPanel } from './components/CreationBriefPanel';
```

#### Step 2: Fix Hard-Coded Corpus Numbers in agentLanes
**Current (line ~89-91)**:
```typescript
items: ['18 families, 133 versions', '3 verified, 1 incomplete, 14 planned', 'Reference patterns: I1, C1, D1'],
```

**Replace with**:
```typescript
items: [
  `${corpus.status.families} families, ${corpus.status.documentedVersions} versions`,
  `${runtime.status.verifiedImplementations} verified, ${runtime.status.incompleteImplementations} incomplete, ${runtime.status.plannedFamilies} planned`,
  'Reference patterns: I1, C1, D1'
],
```

#### Step 3: Add CreationBriefPanel to UI
Insert new section after "Workflow Execution Lanes" grid and before "Bottom Row: Phase 1 Pilot" section (around line ~300):

```typescript
      {/* Creation Brief Engine Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-outfit">Agent E: Creation Brief Engine</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Generate deterministic external AI handoff briefs for I2 pilot workflow.
            </p>
          </div>
          <FileText className="text-pink-500" size={24} />
        </div>
        <CreationBriefPanel />
      </div>
```

**Files modified**: 
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`

**Verify**: Run dev server (`pnpm dev`), navigate to `/tools/project-llm`, confirm CreationBriefPanel renders with form.

---

## Import/Export Paths to Use

### Types Package
**File**: `packages/types/src/project-llm/index.ts`

**Add export**:
```typescript
export * from './creation-brief';
```

### Admin Library
**File**: `apps/skillhubcore-admin/src/lib/project-llm/index.ts`

**Add export**:
```typescript
export * from './projectLlmCreationBrief';
```

### Component Directory Structure
```
apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/
├── page.tsx (existing, modify)
└── components/
    └── CreationBriefPanel.tsx (new)
```

---

## Implementation Checklist

- [ ] 1. Create `packages/types/src/project-llm/creation-brief.ts` with TypeScript interfaces
      Files: `packages/types/src/project-llm/creation-brief.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

- [ ] 2. Update `packages/types/src/project-llm/index.ts` to export creation-brief
      Files: `packages/types/src/project-llm/index.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

- [ ] 3. Create `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.ts` with engine functions
      Files: `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.ts`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

- [ ] 4. Update `apps/skillhubcore-admin/src/lib/project-llm/index.ts` to export projectLlmCreationBrief
      Files: `apps/skillhubcore-admin/src/lib/project-llm/index.ts`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

- [ ] 5. Create `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.test.ts` with unit tests
      Files: `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.test.ts`
      Verify: `pnpm --filter @quiz/skillhubcore-admin test projectLlmCreationBrief.test.ts` — all tests pass

- [ ] 6. Create components directory `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/components/`
      Files: Create directory
      Verify: Directory exists

- [ ] 7. Create `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/components/CreationBriefPanel.tsx`
      Files: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/components/CreationBriefPanel.tsx`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

- [ ] 8. Modify `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx` to fix hard-coded corpus numbers
      Files: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

- [ ] 9. Modify `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx` to add CreationBriefPanel
      Files: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`
      Verify: Start dev server `pnpm --filter @quiz/skillhubcore-admin dev`, navigate to `/tools/project-llm`, confirm UI renders

- [ ] 10. Run full type check for both packages
       Verify: `pnpm --filter @quiz/types type-check && pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

- [ ] 11. Run full test suite
       Verify: `pnpm --filter @quiz/skillhubcore-admin test` — all tests pass

- [ ] 12. Manual UI verification: Generate I2 brief, copy prompt, verify all sections present
       Verify: Navigate to `/tools/project-llm`, enter "I" and "I2", click Generate, verify brief displays, click Copy, paste and confirm prompt includes UBRC, GUI-first, primitives, reference files
