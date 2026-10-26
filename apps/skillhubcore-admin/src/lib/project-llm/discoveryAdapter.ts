/**
 * Discovery-to-Intelligence Adapter (Phase 1, Task 1.2)
 *
 * Bridges the live RepositorySnapshot from the TypeScript discovery scanners
 * to the intelligence format consumed by Project LLM UI pages.
 *
 * This replaces the static fixture in projectLlmRepositoryIntelligence.ts
 * with real data fetched from the FastAPI backend (which reads the snapshot
 * produced by `pnpm --filter @quiz/project-llm-discovery scan`).
 *
 * DATA FLOW:
 *   1. TypeScript scanners → output/snapshot.json (file on disk)
 *   2. FastAPI /snapshot endpoint → reads the file
 *   3. Next.js /api/project-llm/snapshot → proxies to FastAPI
 *   4. This adapter → transforms RepositorySnapshot → ProjectLlmRepositoryIntelligence
 *   5. UI pages → consume the intelligence format
 */

import type {
  ProjectLlmRepositoryIntelligence,
  BlockVersionImplementationStatus,
  ProjectLlmRuntimeRegistry,
  ImplementationPrimitive,
} from '@quiz/types';

/**
 * Inline types for discovery scanner output.
 * These mirror @quiz/project-llm-discovery types but are inlined here
 * because the discovery package is a dev-time tool, not a runtime dependency
 * of the admin frontend app.
 */
interface BlockVerification {
  blockType: string;
  version?: string;
  verificationLevel: string;
  ubrcStatus?: string;
}

interface BlockRenderer {
  blockType: string;
  componentPath?: string;
}

interface RepositorySnapshot {
  schemaVersion: string;
  repository: {
    commitSha: string;
    scanTimestamp: string;
  };
  blocks?: {
    verified?: BlockVerification[];
    rendered?: BlockRenderer[];
  };
}

/**
 * UBRCStatus → compliance category mapping
 */
function mapUbrcCompliance(status?: string): 'FULL' | 'PARTIAL' | 'NONE' {
  if (!status) return 'NONE';
  switch (status) {
    case 'UBRC_VALID':
      return 'FULL';
    case 'UBRC_VERSION_MISMATCH':
    case 'UBRC_ATTRIBUTE_MISSING':
      return 'PARTIAL';
    default:
      return 'NONE';
  }
}

/**
 * Map VerificationLevel to lifecycle status
 */
function mapLifecycleStatus(
  level: string
): 'RUNTIME_INTEGRATED' | 'IMPLEMENTED' | 'DESIGNED' {
  switch (level) {
    case 'VERIFIED':
      return 'RUNTIME_INTEGRATED';
    case 'TESTED':
    case 'REGISTERED':
      return 'RUNTIME_INTEGRATED';
    case 'IMPLEMENTED':
    case 'RENDERED':
      return 'IMPLEMENTED';
    default:
      return 'DESIGNED';
  }
}

/**
 * Known versioned block families (from architectural corpus)
 */
const VERSIONED_FAMILIES = new Set([
  'introduction',
  'code',
  'definition',
  'summary',
]);

/**
 * Structural primitives (non-versioned building blocks)
 */
const STRUCTURAL_PRIMITIVES = new Set([
  'heading',
  'paragraph',
  'list',
  'table',
  'image',
  'callout',
  'example',
  'quote',
  'diagram',
  'comparison',
  'two-column',
  'three-column',
  'card-grid',
  'timeline',
]);

/**
 * Transform a RepositorySnapshot into the intelligence format the UI consumes.
 *
 * This is the core adapter function that replaces the static fixture.
 */
export function transformSnapshotToIntelligence(
  snapshot: RepositorySnapshot
): ProjectLlmRepositoryIntelligence {
  const verified = snapshot.blocks?.verified ?? [];
  const rendered = snapshot.blocks?.rendered ?? [];

  // Separate versioned blocks from structural primitives
  const versionedBlocks = verified.filter(
    (v: BlockVerification) => v.version && VERSIONED_FAMILIES.has(v.blockType)
  );
  const primitiveBlocks = verified.filter(
    (v: BlockVerification) => STRUCTURAL_PRIMITIVES.has(v.blockType) && !v.version
  );

  // Build verified implementations (blocks with REGISTERED+ level)
  const verifiedImplementations: BlockVersionImplementationStatus[] =
    versionedBlocks
      .filter(
        (v: BlockVerification) =>
          v.verificationLevel === 'REGISTERED' ||
          v.verificationLevel === 'TESTED' ||
          v.verificationLevel === 'VERIFIED'
      )
      .map((v: BlockVerification) => {
        // Find matching renderer for evidence
        const renderer = rendered.find(
          (r: BlockRenderer) => r.blockType === v.blockType
        );

        return {
          versionId: v.version!,
          familyId: v.version!.charAt(0), // I1 → I, C1 → C, D1 → D
          lifecycleStatus: mapLifecycleStatus(v.verificationLevel),
          ubrcCompliance: mapUbrcCompliance(v.ubrcStatus),
          versionRoutingPresent: true, // all REGISTERED blocks have version routing
          implementationEvidence: [
            renderer?.componentPath
              ? `Component: ${renderer.componentPath}`
              : `Block type: ${v.blockType}`,
            `Verification level: ${v.verificationLevel}`,
            `UBRC status: ${v.ubrcStatus || 'unknown'}`,
          ],
          notes: `Discovered via live repository scan at ${snapshot.repository.scanTimestamp}`,
        };
      });

  // Build incomplete implementations (blocks that exist but aren't fully verified)
  const incompleteImplementations: BlockVersionImplementationStatus[] =
    versionedBlocks
      .filter(
        (v: BlockVerification) =>
          v.verificationLevel === 'IMPLEMENTED' ||
          v.verificationLevel === 'RENDERED'
      )
      .map((v: BlockVerification) => ({
        versionId: v.version!,
        familyId: v.version!.charAt(0),
        lifecycleStatus: 'IMPLEMENTED' as const,
        ubrcCompliance: mapUbrcCompliance(v.ubrcStatus),
        versionRoutingPresent: false,
        implementationEvidence: [
          `Verification level: ${v.verificationLevel}`,
          `UBRC status: ${v.ubrcStatus || 'unknown'}`,
        ],
        notes: `Incomplete — needs version routing or UBRC attributes`,
      }));

  // Build implementation primitives from structural blocks
  const primitives: ImplementationPrimitive[] = primitiveBlocks.map((p: BlockVerification) => ({
    name: p.blockType,
    description: `${p.blockType} block (${p.verificationLevel})`,
  }));

  // Planned families (from spec, minus discovered)
  const discoveredFamilyIds = new Set(
    versionedBlocks.map((v: BlockVerification) => v.version!.charAt(0))
  );
  const ALL_PLANNED_FAMILY_IDS = [
    'O', 'V', 'CP', 'E', 'M', 'MT', 'BP', 'Q', 'EX', 'T', 'INT', 'QZ', 'IV', 'P',
  ];
  const plannedFamilyIds = ALL_PLANNED_FAMILY_IDS.filter(
    (id: string) => !discoveredFamilyIds.has(id)
  );

  // Runtime counts are derived from the discovery snapshot.
  const runtime = {
    status: {
      verifiedImplementations: verifiedImplementations.length,
      incompleteImplementations: incompleteImplementations.length,
      plannedFamilies: plannedFamilyIds.length,
    },
    verifiedImplementations,
    incompleteImplementations,
    plannedFamilyIds,
  } satisfies ProjectLlmRuntimeRegistry;

  return {
    corpus: {
      status: {
        families: 18 as const,
        documentedVersions: 133 as const,
      },
      families: [],
      documentationSources: [
        `Live repository scan: ${snapshot.repository.commitSha}`,
      ],
    },
    runtime,
    primitives: {
      count: 15 as const,
      list: primitives,
      description: 'Implementation building blocks, NOT educational families' as const,
    },
    referencePatterns: [],
    sourceDocuments: [
      `Live repository scan: ${snapshot.repository.commitSha}`,
      `Scan timestamp: ${snapshot.repository.scanTimestamp}`,
      `Schema version: ${snapshot.schemaVersion}`,
    ],
  };
}

/**
 * Fetch the live repository snapshot from the backend and transform it.
 *
 * Called by UI pages instead of importing the static fixture.
 */
export async function fetchLiveIntelligence(): Promise<ProjectLlmRepositoryIntelligence> {
  const response = await fetch('/api/project-llm/snapshot', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch live snapshot: ${response.status} ${response.statusText}`
    );
  }

  const snapshot: RepositorySnapshot = await response.json();
  return transformSnapshotToIntelligence(snapshot);
}
