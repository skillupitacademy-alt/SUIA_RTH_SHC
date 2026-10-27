'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Code,
  Copy,
  Check,
  Download,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Upload,
  FileCode,
  Sparkles,
  Layers,
  ShieldCheck,
  BookOpen,
  Layout,
  Palette,
  Workflow,
  TestTube,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';
import { projectLlmClient } from '@/lib/project-llm/api/projectLlmClient';

type TabKey = 'summary' | 'ils' | 'lsnb' | 'rssb' | 'composer' | 'testing' | 'brand' | 'evidence';

export default function ExternalAiHandoffPage() {
  const router = useRouter();
  const { state } = useProjectLlm();
  const searchParams = useSearchParams();
  const urlWorkflowId = searchParams.get('workflowId') || state.workflowId;
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'html' | 'schema'>('preview');
  const [workflowId, setWorkflowId] = useState(urlWorkflowId || '');
  const [isNavigating, setIsNavigating] = useState(false);
  const [engineeringContract, setEngineeringContract] = useState<Record<string, unknown> | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Auto-load contract when workflowId is available from URL
  useEffect(() => {
    if (urlWorkflowId) {
      setWorkflowId(urlWorkflowId);
      loadContractById(urlWorkflowId);
    }
  }, [urlWorkflowId]);

  const loadContractById = async (id: string) => {
    setContractLoading(true);
    setContractError(null);
    setEngineeringContract(null);
    try {
      const payload = await projectLlmClient.getEngineeringContract(id);
      if (!payload || typeof payload !== 'object' || typeof payload.contract_hash !== 'string' || !payload.contract_hash) {
        throw new Error('Backend response is missing contract_hash; it cannot be treated as a canonical engineering contract.');
      }
      setEngineeringContract(payload);
    } catch (error) {
      setContractError(error instanceof Error ? error.message : 'Unable to retrieve the engineering contract.');
    } finally {
      setContractLoading(false);
    }
  };

  const loadEngineeringContract = async () => {
    const id = workflowId.trim();
    if (!id) {
      setContractError('Enter the persisted workflow ID to retrieve its canonical contract.');
      return;
    }
    await loadContractById(id);
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'summary', label: 'Summary', icon: Sparkles },
    { key: 'ils', label: 'ILS', icon: BookOpen },
    { key: 'lsnb', label: 'LSNB', icon: Layout },
    { key: 'rssb', label: 'RSSB', icon: Palette },
    { key: 'composer', label: 'Composer', icon: Workflow },
    { key: 'testing', label: 'Testing', icon: TestTube },
    { key: 'brand', label: 'Brand & Theme', icon: Layers },
    { key: 'evidence', label: 'Evidence', icon: ShieldCheck },
  ];

  const targetFamily = String((engineeringContract as any)?.target?.family || (engineeringContract as any)?.target_family || state.familyName || 'Block');
  const targetVersion = String((engineeringContract as any)?.target?.version || (engineeringContract as any)?.target_version || state.targetVersion || 'V1').toUpperCase();
  const familyLower = targetFamily.toLowerCase();
  const versionUpper = targetVersion.toUpperCase();
  const versionLower = targetVersion.toLowerCase();
  const componentName = `${targetFamily}${versionUpper}Block`;

  const handleCopyPrompt = () => {
    if (!engineeringContract) {
      setContractError('Load the backend-generated engineering contract before copying an implementation prompt.');
      return;
    }

    const prompt = `================================================================================
PROJECT LLM — AUTONOMOUS EXTERNAL AI IMPLEMENTATION PROMPT
================================================================================
AUTHORITATIVE TARGET IDENTITY:
- Target Family: ${targetFamily}
- Target Version: ${versionUpper}
- Block Type ID: '${familyLower}'
- React Component Name: ${componentName}
- Workflow ID: ${workflowId.trim()}
- Contract Hash: ${String(engineeringContract.contract_hash)}

--------------------------------------------------------------------------------
CANONICAL TUTORIAL DESIGN SYSTEM & LOOK & FEEL SPECIFICATIONS
(MUST MATCH INTRODUCTION, DEFINITION, CODE, AND SUMMARY BLOCKS)
--------------------------------------------------------------------------------
All tutorial blocks in the platform belong to a unified tutorial page. Your component MUST adhere to these exact styling and typography standards:

1. Container & Section Shell:
   - Outermost element MUST be an <article> element matching canonical tutorial blocks:
     className="w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors \${className}"
     style={{ color: secondary }}
     data-block-id={runtimeContext?.blockId ?? block.id}
     data-block-type="${familyLower}"
     data-block-version="${versionUpper}"

2. Typography Scale & Font Hierarchy:
   - Eyebrow / Category Badge:
     Class: "text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3"
     Style: { color: primary, backgroundColor: withAlpha(primary, '14') }
     Icon: Relevant Lucide React icon (h-4 w-4)
   - Block Title:
     Class: "text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight"
     Style: { color: secondary }
   - Brand Accent Indicator:
     Class: "mb-4 mt-3 h-1 w-12 rounded-full"
     Style: { backgroundColor: primary }
   - Intro / Subtitle / Lead Paragraph:
     Class: "text-base sm:text-lg font-medium leading-[1.7] max-w-3xl mb-6"
     Style: { color: \`\${secondary}dd\` }
   - Item / Card Body Text:
     Class: "text-sm sm:text-base font-medium leading-relaxed"
     Style: { color: secondary }
   - Monospace / Code Elements:
     Class: "font-mono text-xs sm:text-sm"

3. Cards, Panels, & Elevated Containers:
   - Elevated Card Standard:
     Class: "rounded-2xl border p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md"
     Style: { backgroundColor: withAlpha(primary, '08'), borderColor: withAlpha(primary, '25') }
   - NO LEFT-SIDE BORDER ALLOWED:
     Asymmetrical left borders ('border-l-*' or 'borderLeftColor') are STRICTLY PROHIBITED for callouts, takeaways, quotes, and tips.
     Always use symmetric, elevated rounded card containers ('rounded-2xl border ... shadow-sm').
   - Icon Badges:
     Class: "flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl"
     Style: { backgroundColor: withAlpha(primary, '18'), color: primary }
   - Icons:
     MUST import from 'lucide-react' (e.g. Target, BookOpen, Check, Layers, Lightbulb, Code2, Sparkles).
     NEVER use raw unicode symbols (✓, ★, •) or emojis (📌, 🎯).
     Always add aria-hidden="true" to decorative icons.

4. Dual-Brand 4-Color Token Architecture:
   - MUST consume 'theme ?? DEFAULT_THEME'.
   - Each brand defines 4 harmonized tokens:
     * SkillUp IT Academy (SUIA):
       - Primary (Brand Base): Navy (#0B1B3D)
       - Secondary (Text / Shell): Magenta Pink (#F54A8D)
       - Accent 1 (Interactive / Info): Sky Cyan (#0284C7)
       - Accent 2 (Success / Highlight): Emerald Green (#10B981)
     * Real Tutorial Hub (RTH):
       - Primary (Brand Base): Rose (#E11D48)
       - Secondary (Text / Shell): Slate Navy (#1E293B)
       - Accent 1 (Interactive / Info): Indigo Blue (#6366F1)
       - Accent 2 (Success / Highlight): Amber Warm (#F59E0B)
   - ZERO hardcoded hex color codes (#e11d48, #0b1b3d, etc.).
   - ZERO hardcoded brand strings ('SkillUpITAcademy', 'RealTutorialHub', 'SUIA', 'RTH').
   - Both light and dark modes are supported automatically via Tailwind tokens (bg-white dark:bg-slate-900).

--------------------------------------------------------------------------------
MANDATORY PACKAGE DELIVERABLE: SINGLE ZIP ARCHIVE
--------------------------------------------------------------------------------
You must package your output as a single .zip archive containing the six required implementation files below at the root of the ZIP (do NOT wrap them in a subfolder). preview.html is optional and is not placed.

1. ${componentName}.tsx (Primary React UI Block Component)
   - Canonical monorepo imports:
     import React from 'react';
     import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';
     import { withAlpha, DEFAULT_THEME } from '../theme-utils';
   - Mandatory UBRC Runtime Wrapping:
     The outermost element MUST be an <article> element containing:
       <article
         data-block-id={runtimeContext?.blockId ?? block.id}
         data-block-type="${familyLower}"
         data-block-version="${versionUpper}"
         className={\`w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors \${className}\`}
         style={{ color: secondary }}
       >
         ...
       </article>
   - Dual Named and Default Exports:
     export function ${componentName}({ block, className, theme, runtimeContext }: BlockComponentProps) { ... }
     export { ${componentName} as default };

2. ${componentName}.test.tsx (Unit Test Suite)
   - Standard Vitest / React Testing Library tests.
   - Must verify:
     a) Renders with UBRC data attributes (data-block-id, data-block-type="${familyLower}", data-block-version="${versionUpper}").
     b) Dual-brand theme independence (proves themeA and themeB apply dynamically with zero hardcoded brand hexes).
     c) WCAG 2.1 AA accessibility (list roles, aria-hidden icons).
     d) Responsive container rendering (passes through custom className).
     e) Zero console errors or warnings.

3. ${familyLower}-${versionLower}.schema.json (JSON Schema Contract)
   - Valid JSON schema representing the block's content payload.
   - Must include "$schema": "http://json-schema.org/draft-07/schema#", "title": "${targetFamily} ${versionUpper} Block Schema".

4. ${familyLower}-${versionLower}.schema.ts (TypeScript Type Contract)
   - Export interfaces representing the block payload and content structure.

5. block.integration.json (Portable Integration Metadata)
   - This is the ONLY integration artifact. Do not provide registry, renderer, Composer, or shared type files.
   - It MUST be valid JSON with this exact shape:
     {
       "family": "${targetFamily}",
       "version": "${versionUpper}",
       "typeId": "${familyLower}",
       "componentFile": "${componentName}.tsx",
       "componentExport": "${componentName}",
       "testFile": "${componentName}.test.tsx",
       "jsonSchemaFile": "${familyLower}-${versionLower}.schema.json",
       "typeSchemaFile": "${familyLower}-${versionLower}.schema.ts",
       "registryVersionId": "${versionLower}",
       "label": "${versionUpper} - ${targetFamily}",
       "description": "Short user-facing description",
       "defaultPayload": {
         "title": "Replace this example with a complete payload that validates against your schema"
       }
     }
   - Replace the illustrated defaultPayload with a non-empty, complete payload that satisfies your supplied schema.

6. README.md (Implementation Documentation)
   - Brief summary of cognitive domain, design patterns, and acceptance criteria.

7. preview.html (Optional review-only prototype)
   - This file is optional and is never placed into the application.
   - If included, it must include <article data-block-id="preview-1" data-block-type="${familyLower}" data-block-version="${versionUpper}">.

--------------------------------------------------------------------------------
SHARED-INTEGRATION BOUNDARY (NON-NEGOTIABLE)
--------------------------------------------------------------------------------
You are creating a portable candidate package, not modifying this repository.

- Do NOT include registry.ts, TutorialBlockRenderer.tsx, tutorial-composer.service.ts, shared type-union files, navigation files, progress/status files, or API clients.
- Do NOT replace, remove, or redefine existing versions in the '${familyLower}' family.
   - Project LLM alone merges this version into the generated block registry and renderer catalogs, preserves existing families and versions, and runs all placement and isolated Composer verification.
- Your package must work without repository access: use only the imports, contract fields, and file names specified in this prompt.

--------------------------------------------------------------------------------
IMMUTABLE BACKEND CONTRACT SPECIFICATION:
--------------------------------------------------------------------------------
${JSON.stringify(engineeringContract, null, 2)}
`;

    void navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }).catch(() => setContractError('Clipboard access failed. Copy the loaded contract JSON directly instead.'));
  };

  const handleCopyBrief = () => {
    if (!engineeringContract) {
      setContractError('Load the backend-generated engineering contract before copying a compliance brief.');
      return;
    }
    const brief = `PROJECT LLM CANONICAL COMPLIANCE BRIEF & ENGINEERING CONTRACT
Workflow ID: ${workflowId.trim()}
Contract SHA-256: ${String(engineeringContract.contract_hash)}
Target Block: ${targetFamily} (${versionUpper})
Block Type: '${familyLower}'

================================================================================
VERIFICATION GATES & COMPLIANCE ARCHITECTURE
================================================================================
1. UBRC Runtime Gate: <article data-block-id="..." data-block-type="${familyLower}" data-block-version="${versionUpper}">
2. Brand Independence Gate: Consumes theme prop / DEFAULT_THEME; zero brand strings
3. Universal Block Architecture (UBA) Look & Feel Gate: Outer shell w-full px-[5%] py-8 sm:py-10, canonical typography hierarchy (hero clamp 34px-52px or standard 2xl-4xl title, text-base/lg intro, Lucide icons with aria-hidden='true'). Candidates should compose @quiz/ui primitives (BlockShell, BlockHeader, CardSurface, StepBadge, SyntaxPill, CalloutBanner, TerminalWindow)
4. Strict Typing Gate: zero 'any' types in props or block interfaces
5. Repository Integration Gate: ${componentName}.tsx placed in packages/ui/src/tutorial/blocks/
6. Composer Registry Gate: Project LLM adds ${versionUpper} to the generated block catalog and renderer dispatch without removing other families or versions
7. Portable Package Gate: block.integration.json names the component, test, both schemas, and a complete schema-valid defaultPayload
8. Automated Tests Gate: Passing unit test suite in ${componentName}.test.tsx

IMMUTABLE CONTRACT JSON:
${JSON.stringify(engineeringContract, null, 2)}

The persisted backend contract is authoritative. Do not invent requirements or claim a gate passed without attached verification evidence.`;

    void navigator.clipboard.writeText(brief).then(() => {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    }).catch(() => setContractError('Clipboard access failed. Copy the loaded contract JSON directly instead.'));
  };

  const handleDownloadMarkdown = () => {
    if (!engineeringContract) {
      setContractError('Load the backend-generated engineering contract before downloading the handoff.');
      return;
    }
    const md = `# Canonical External AI Handoff Contract

- **Workflow ID:** ${workflowId.trim()}
- **Contract SHA-256:** ${String(engineeringContract.contract_hash)}
- **Family:** ${targetFamily}
- **Version:** ${versionUpper}
- **Component:** ${componentName}

## Universal Block Architecture (UBA) & Look and Feel Standards

1. **UBA Primitives Library:**
   Candidates should import and compose universal primitives from \`@quiz/ui\` (\`BlockShell\`, \`BlockHeader\`, \`CardSurface\`, \`StepBadge\`, \`SyntaxPill\`, \`CalloutBanner\`, \`TerminalWindow\`) to ensure design consistency and avoid redundant HTML recreation.
2. **Outer Shell:** Standardized via \`BlockShell\` with \`w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors\` and UBRC data attributes (\`data-block-id\`, \`data-block-type\`, \`data-block-version\`).
3. **Typography Scale (via \`BlockHeader\`):**
   - Eyebrow: \`text-xs font-bold uppercase tracking-wider\`
   - Title: \`text-[clamp(34px,4vw,52px)] font-extrabold leading-[1.1] tracking-[-1.1px]\` (\`titleScale="hero"\`) or \`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight\` (\`titleScale="standard"\`)
   - Accent Bar: \`h-1 w-12 rounded-full\` in \`theme.primary\`
   - Intro: \`text-base sm:text-lg font-medium leading-[1.7]\`
   - Content: \`text-sm sm:text-base font-medium leading-relaxed\`
4. **Elevated Containers & Ban on Left-Side Borders:**
   - **NO LEFT-SIDE BORDER (\`border-l-*\`)**: Left-side accent borders are strictly prohibited for takeaways, callouts, and tips.
   - All callout and takeaway cards must use symmetric, elevated rounded cards: \`rounded-2xl border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all\`.
5. **Icons:** Exclusively \`lucide-react\` components with \`aria-hidden="true"\`. Zero raw emojis or unicode glyphs.
6. **Dual-Brand 4-Color Tokens:**
   - SUIA: Primary \`#0B1B3D\` (Navy), Secondary \`#F54A8D\` (Magenta Pink), Accent 1 \`#0284C7\` (Sky Cyan), Accent 2 \`#10B981\` (Emerald Green).
   - RTH: Primary \`#E11D48\` (Rose), Secondary \`#1E293B\` (Slate Navy), Accent 1 \`#6366F1\` (Indigo Blue), Accent 2 \`#F59E0B\` (Amber Warm).
   - Consume dynamically via \`theme.primary\`, \`theme.secondary\`, \`theme.accent1\`, \`theme.accent2\`, and \`withAlpha\`.

## Mandatory File Deliverables in ZIP

1. \`${componentName}.tsx\` — Primary React UI block component
2. \`${componentName}.test.tsx\` — Vitest unit test suite
3. \`${familyLower}-${versionLower}.schema.json\` — JSON Schema contract
4. \`${familyLower}-${versionLower}.schema.ts\` — TypeScript schema types
5. \`block.integration.json\` — Portable metadata naming the component, test, schemas, and complete default payload
6. \`README.md\` — Documentation
7. \`preview.html\` — Optional review-only prototype with UBRC attributes

## Shared Integration Boundary

- Do **not** include \`registry.ts\`, \`TutorialBlockRenderer.tsx\`, Composer files, shared type unions, navigation/status files, or API clients.
- Project LLM owns the controlled registry, renderer, and type-union patches. It preserves existing family versions and verifies the candidate in an isolated Composer worktree.
- \`block.integration.json\` must include \`componentFile\`, \`componentExport\`, \`testFile\`, \`jsonSchemaFile\`, \`typeSchemaFile\`, and a non-empty \`defaultPayload\` that satisfies the supplied schema.

## Immutable Backend Contract

\`\`\`json
${JSON.stringify(engineeringContract, null, 2)}
\`\`\`

## Implementation Rules

- Treat the persisted backend contract as the sole source of requirements.
- Preserve workflow ID, target family/version, snapshot hash, and evidence bindings.
- Do not claim PASS without real, persisted verification evidence.
- Report missing requirements or unavailable integrations as BLOCKED.
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canonical_contract_${workflowId.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <Code size={12} />
                Step 4 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              External AI Implementation Handoff
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Export instructions and specifications for External AI models to implement{' '}
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span>. Deliver one portable TypeScript candidate package; a visual prototype is optional.
            </p>
          </div>

          <ProjectLlmStepper currentStep={4} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* Canonical backend contract: generic client-side briefs are not authoritative. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Canonical Engineering Contract</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter an existing persisted workflow ID to retrieve its immutable contract from Project AI. The returned workflow ID and contract hash are checked before the contract can be used in the external-AI prompt.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            aria-label="Persisted workflow ID"
            value={workflowId}
            onChange={(event) => { setWorkflowId(event.target.value); setEngineeringContract(null); setContractError(null); }}
            placeholder="Persisted workflow ID"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="button"
            onClick={loadEngineeringContract}
            disabled={contractLoading || !workflowId.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {contractLoading ? 'Loading contract…' : 'Load backend contract'}
          </button>
        </div>
        {contractError && <p role="alert" className="text-sm text-rose-700">{contractError}</p>}
        {engineeringContract && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Contract retrieved and identity-bound. Workflow: <strong>{String(engineeringContract.workflow_id)}</strong>
              <div className="mt-1 break-all font-mono text-xs">SHA-256: {String(engineeringContract.contract_hash)}</div>
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(engineeringContract, null, 2)}</pre>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Copy prompt from canonical contract
            </button>
          </div>
        )}
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compliance Brief for External AI (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#e11d48]">
                  <FileCode size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-outfit">
                    Compliance Brief for External AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive specification package ready for prompt generation
                  </p>
                </div>
              </div>
            </div>

            {/* Specification Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b border-slate-200/70 bg-slate-100/50 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isSelected
                        ? 'bg-white text-pink-700 shadow-sm border border-pink-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon size={13} className={isSelected ? 'text-pink-600' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-5 sm:p-6 min-h-[380px] bg-slate-50/20">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-pink-200/80 bg-pink-50/50 p-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-700 block mb-1">
                      Target Block Assignment
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-outfit">
                      {state.familyName} Block — Version {state.targetVersion}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {state.purpose}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                      Required Compliance Deliverables (8 Standards)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { title: 'ILS Pedagogy Sequence', desc: 'Hook → Motivation → Roadmap' },
                        { title: 'LSNB Schema Contract', desc: 'Metadata, unique UID & step anchor' },
                        { title: 'RSSB Responsive UI', desc: 'Clean tokens, 0 style bleed' },
                        { title: 'Tutorial Composer Registry', desc: 'Live preview & inspector controls' },
                        { title: 'Runtime Robustness', desc: 'Error boundaries & SSR safety' },
                        { title: 'Test Coverage Suite', desc: 'Unit, integration & visual tests' },
                        { title: 'Brand Independence', desc: '100% white-label token design' },
                        { title: 'Evidence Graph Manifest', desc: 'Verification hash & audit logs' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ils' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Instructional Learning Structure (ILS) Specifics
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2 font-mono">
                    <p className="text-slate-900 font-bold">1. Learning Objective Mapping</p>
                    <p className="text-slate-600 pl-4">Must state cognitive domain, Bloom level, and verifiable outcome.</p>
                    <p className="text-slate-900 font-bold">2. Sequential Content Flow</p>
                    <p className="text-slate-600 pl-4">Lead with compelling hook, connect real-world impact, outline 3-5 subtopic milestones.</p>
                    <p className="text-slate-900 font-bold">3. Learner Engagement Interactivity</p>
                    <p className="text-slate-600 pl-4">Interactive checklist / collapsible roadmap nodes for progressive disclosure.</p>
                  </div>
                </div>
              )}

              {activeTab === 'rssb' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    RSSB — Canonical Tutorial Look &amp; Feel &amp; Typography Standards
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-3 font-mono">
                    <div>
                      <p className="text-slate-900 font-bold">1. Section Shell &amp; Outer Container</p>
                      <p className="text-slate-600 pl-4">
                        <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors</code>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">2. Typography Hierarchy (Outfit / Inter / Sans)</p>
                      <ul className="text-slate-600 pl-4 space-y-1">
                        <li>• Eyebrow: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">text-xs font-bold uppercase tracking-wider</code> + Lucide icon</li>
                        <li>• Title: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight</code></li>
                        <li>• Accent Bar: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">mb-4 mt-3 h-1 w-12 rounded-full (theme.primary)</code></li>
                        <li>• Subtitle/Intro: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">text-base sm:text-lg font-medium leading-[1.7]</code></li>
                        <li>• Card Text: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">text-sm sm:text-base font-medium leading-relaxed</code></li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">3. Iconography &amp; Accessibility</p>
                      <p className="text-slate-600 pl-4">Exclusively lucide-react icons. Zero unicode glyphs or emojis. aria-hidden=&quot;true&quot; required.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'brand' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Brand &amp; Theme Token Adherence (SUIA &amp; RTH Dual Theming)
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-3 font-mono">
                    <div>
                      <p className="text-slate-900 font-bold">1. Zero Hardcoded Brand Strings</p>
                      <p className="text-slate-600 pl-4">No &apos;SkillUpITAcademy&apos;, &apos;RealTutorialHub&apos;, &apos;SUIA&apos;, or &apos;RTH&apos; literals.</p>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">2. Dynamic Token Derivation</p>
                      <p className="text-slate-600 pl-4">Only consume <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">theme.primary</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">theme.secondary</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">withAlpha(primary, alpha)</code>.</p>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">3. Dark Mode Compliance</p>
                      <p className="text-slate-600 pl-4">Tailwind dark tokens (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">dark:bg-slate-900</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">dark:text-slate-100</code>).</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'summary' && activeTab !== 'ils' && activeTab !== 'rssb' && activeTab !== 'brand' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {tabs.find((t) => t.key === activeTab)?.label} Specification Contract
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono space-y-2 leading-relaxed">
                    <p className="text-emerald-700 font-bold">{`// Automated Enforcement Rule`}</p>
                    <p>Enforced by Project AI placement engine during candidate inspection.</p>
                    <p>Refer to system compliance guidelines for mandatory schema definition.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-xl transition-all shadow-sm shadow-pink-500/20 active:scale-95"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={14} />
                    Copied Prompt!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Prompt for External AI
                  </>
                )}
              </button>

              <button
                onClick={handleCopyBrief}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                {copiedBrief ? (
                  <>
                    <Check size={14} />
                    Copied Brief!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Full Compliance Brief
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Download size={14} />
                Download as Markdown
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Portable package and controlled integration (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* External AI package requirements */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-xs">
                  P1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">
                    Portable Candidate Package
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    External AI delivers files; Project LLM integrates them
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Required
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Checklist */}
              <div className="space-y-2">
                {[
                  '1. Create the React / TypeScript block component',
                  '2. Create a Vitest unit test for the component',
                  '3. Create JSON and TypeScript schemas',
                  '4. Create block.integration.json with a schema-valid default payload',
                  '5. Include README documentation',
                  '6. Include preview.html only when visual review helps',
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>

              {/* Prototype Preview Mockup Box */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-200">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-mono text-slate-400 ml-2">prototype_preview.html</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        previewTab === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setPreviewTab('schema')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        previewTab === 'schema' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Schema
                    </button>
                  </div>
                </div>

                <div className="p-4 text-xs font-mono bg-slate-950/60 max-h-36 overflow-y-auto">
                  {previewTab === 'preview' ? (
                    <div className="space-y-2 text-slate-300">
                      <div className="border border-pink-500/30 bg-pink-950/20 p-2.5 rounded text-[11px]">
                        <span className="text-pink-400 font-bold block mb-1">
                          [Introduction {state.targetVersion} Mockup Container]
                        </span>
                        <p className="text-slate-300 text-[10px]">
                          Topic: Mastering Advanced Educational Workflows
                        </p>
                        <div className="mt-2 flex gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-pink-900/60 text-pink-200 text-[9px]">
                            3 Milestones
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[9px]">
                            100% WCAG
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-[11px] leading-relaxed">
                      {`{\n  "version": "${state.targetVersion}",\n  "type": "introduction",\n  "headline": "Course Overview",\n  "milestones": 3\n}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Prototype Dropzone (Optional) */}
              <div className="border-2 border-dashed border-slate-200 hover:border-pink-300 rounded-xl p-4 text-center bg-slate-50/60 transition-colors cursor-pointer group">
                <Upload size={22} className="mx-auto text-slate-400 group-hover:text-pink-600 mb-1.5 transition-colors" />
                <p className="text-xs font-bold text-slate-700">
                  Upload Prototype Files (Optional)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Drag & drop .zip or .html files from External AI
                </p>
              </div>
            </div>
          </div>

          {/* Project LLM controlled integration */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-purple-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800 font-mono font-bold text-xs">
                  P2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">
                    Project LLM Controlled Integration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Qualification, placement, Composer verification, and certification
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Project LLM
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Expected Deliverable Package (.ZIP)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { file: `${componentName}.tsx`, desc: 'Primary UI component' },
                  { file: `${componentName}.test.tsx`, desc: 'Vitest unit tests' },
                  { file: `${familyLower}-${versionLower}.schema.json`, desc: 'JSON schema contract' },
                  { file: `${familyLower}-${versionLower}.schema.ts`, desc: 'TypeScript schema types' },
                  { file: 'block.integration.json', desc: 'Portable integration metadata' },
                  { file: 'preview.html', desc: 'Optional UBRC prototype' },
                  { file: 'README.md', desc: 'Documentation' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <span className="font-mono text-slate-800 font-bold truncate text-[11px]">
                      {item.file}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Pass Gate Status & Next Step */}
      <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-amber-50/60 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 font-outfit">
                  Handoff Compliance Gate
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  engineeringContract
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {engineeringContract ? '✓ GATE PASSED' : 'CONTRACT REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                {engineeringContract
                  ? `Immutable contract verified (${String(engineeringContract.contract_hash).slice(0, 12)}...). Target block ${targetFamily} (${versionUpper}) is ready for implementation.`
                  : 'Load or verify the backend engineering contract above to unlock transition to Candidate Upload.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold">
              Target: {targetFamily} {versionUpper}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href={`/tools/project-llm/compliance-brief${urlWorkflowId ? `?workflowId=${urlWorkflowId}` : ''}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Compliance Brief
        </Link>

        <button
          type="button"
          disabled={isNavigating || !engineeringContract}
          onClick={async () => {
            setIsNavigating(true);
            if (urlWorkflowId) {
              await projectLlmClient.ensureCandidateRequested(urlWorkflowId);
            }
            router.push(`/tools/project-llm/candidate-upload${urlWorkflowId ? `?workflowId=${urlWorkflowId}` : ''}`);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95 disabled:opacity-50"
        >
          {isNavigating ? 'Transitioning...' : 'Continue to Upload & Validate'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
