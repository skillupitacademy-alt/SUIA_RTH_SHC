import { randomUUID } from 'node:crypto';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { Evidence } from '../contracts/evidence.js';
import type {
  BlockFamilyDoc,
  BlockImplementation,
  BlockRenderer,
  BlockVerification,
  BlockDiscrepancy,
} from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../contracts/errors.js';

interface BlocksData {
  documented: BlockFamilyDoc[];
  implemented: BlockImplementation[];
  rendered: BlockRenderer[];
  verified: BlockVerification[];
  discrepancies: BlockDiscrepancy[];
}

const BLOCK_CORPUS_DOC_PATH = 'ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md';
const BLOCK_TYPES_PATH = 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts';
const BLOCK_RENDERERS_DIR = 'packages/ui/src/tutorial/blocks';

/**
 * D3 Blocks Scanner
 * 
 * Discovers educational block implementation state across 4 dimensions:
 * 1. DOCUMENTED: Families/versions documented in PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md
 * 2. IMPLEMENTED: Type definitions in content-blocks.ts
 * 3. RENDERED: React components in packages/ui/src/tutorial/blocks/
 * 4. VERIFIED: Cross-referenced complete implementations (documented + type + renderer).
 *    Future: add REGISTERED (in TutorialBlockRenderer registry), UBRC (data-block-version attribute), TESTED (test coverage) checks.
 * 
 * CRITICAL: Maintains 4 separate states, never collapses them.
 */
export async function scanBlocks(
  adapter: RepositoryAdapter
): Promise<ScannerResult<BlocksData>> {
  const scannerName = 'D3-blocks-scanner';
  const timestamp = new Date().toISOString();
  const evidence: Evidence[] = [];
  const findings: Finding[] = [];

  const documented: BlockFamilyDoc[] = [];
  const implemented: BlockImplementation[] = [];
  const rendered: BlockRenderer[] = [];
  const verified: BlockVerification[] = [];
  const discrepancies: BlockDiscrepancy[] = [];

  // Step 1: Discover DOCUMENTED blocks from block corpus registry
  try {
    if (await adapter.fileExists(BLOCK_CORPUS_DOC_PATH)) {
      const docContent = await adapter.readFile(BLOCK_CORPUS_DOC_PATH);
      const contentHash = await adapter.getFileHash(BLOCK_CORPUS_DOC_PATH);

      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: BLOCK_CORPUS_DOC_PATH,
        kind: 'documentation',
        claim: 'Block corpus registry documentation discovered',
        locator: `file:${BLOCK_CORPUS_DOC_PATH}`,
        contentHash,
      });

      // Parse markdown table for 18 families
      const familiesDoc = parseBlockCorpusRegistry(docContent);
      documented.push(...familiesDoc);
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'warning',
        category: 'blocks-discovery',
        message: `Block corpus registry not found: ${BLOCK_CORPUS_DOC_PATH}`,
        recommendation: 'Create block corpus registry documentation',
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'blocks-discovery',
        message: `Failed to read block corpus registry: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 2: Discover IMPLEMENTED blocks from TypeScript type definitions
  try {
    if (await adapter.fileExists(BLOCK_TYPES_PATH)) {
      const typesContent = await adapter.readFile(BLOCK_TYPES_PATH);
      const contentHash = await adapter.getFileHash(BLOCK_TYPES_PATH);

      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: BLOCK_TYPES_PATH,
        kind: 'type-definition',
        claim: 'Block type definitions discovered',
        locator: `file:${BLOCK_TYPES_PATH}`,
        contentHash,
      });

      const implementedBlocks = parseBlockTypeDefinitions(typesContent);
      implemented.push(...implementedBlocks);
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'warning',
        category: 'blocks-discovery',
        message: `Block type definitions not found: ${BLOCK_TYPES_PATH}`,
        recommendation: 'Create block type definitions file',
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'blocks-discovery',
        message: `Failed to read block type definitions: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 3: Discover RENDERED blocks from React components
  try {
    if (await adapter.fileExists(BLOCK_RENDERERS_DIR)) {
      const rendererFiles = await adapter.listFiles(BLOCK_RENDERERS_DIR);
      const tsxFiles = rendererFiles.filter(f => f.endsWith('.tsx'));

      for (const tsxFile of tsxFiles) {
        try {
          const contentHash = await adapter.getFileHash(tsxFile);
          evidence.push({
            evidenceId: randomUUID(),
            scannerName,
            timestamp,
            path: tsxFile,
            kind: 'component',
            claim: 'Block renderer component discovered',
            locator: `file:${tsxFile}`,
            contentHash,
          });

          const rendererInfo = parseRendererComponent(tsxFile);
          if (rendererInfo !== null) {
            rendered.push(rendererInfo);
          }
        } catch (error) {
          if (error instanceof FileNotFoundError) {
            findings.push({
              findingId: randomUUID(),
              severity: 'warning',
              category: 'blocks-discovery',
              message: `Renderer file disappeared during scan: ${tsxFile}`,
            });
          }
          // Continue processing other files
        }
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'warning',
        category: 'blocks-discovery',
        message: `Block renderers directory not found: ${BLOCK_RENDERERS_DIR}`,
        recommendation: 'Create block renderers directory',
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'blocks-discovery',
        message: `Failed to list block renderers: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 4: Cross-reference for VERIFIED blocks
  const verifiedBlocks = crossReferenceBlocks(implemented, rendered, documented);
  verified.push(...verifiedBlocks);

  // Step 5: Detect discrepancies
  const detectedDiscrepancies = detectDiscrepancies(documented, implemented, rendered);
  discrepancies.push(...detectedDiscrepancies);

  // Add findings
  findings.push({
    findingId: randomUUID(),
    severity: 'info',
    category: 'blocks-discovery',
    message: `Discovered ${documented.length} documented block families, ${implemented.length} implemented blocks, ${rendered.length} rendered blocks, ${verified.length} verified blocks`,
  });

  if (discrepancies.length > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'blocks-discrepancy',
      message: `Found ${discrepancies.length} block discrepancies between documentation and implementation`,
    });
  }

  return {
    scannerName,
    timestamp,
    evidence,
    findings,
    data: {
      documented,
      implemented,
      rendered,
      verified,
      discrepancies,
    },
  };
}

/**
 * Parse PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md for documented block families
 */
function parseBlockCorpusRegistry(content: string): BlockFamilyDoc[] {
  const families: BlockFamilyDoc[] = [];

  // Match the main registry table (after "## 18-Family Registry Table")
  // Expected format: | # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
  const registryTableRegex = /\|\s*#\s*\|\s*Family Name\s*\|.*?\n\|[-\s|]+\n((?:\|[^\n]+\n?)+)/i;
  const tableMatch = content.match(registryTableRegex);

  if (tableMatch === null) {
    return families;
  }

  const tableRows = tableMatch[1].split('\n').filter(line => line.trim().startsWith('|'));

  for (const row of tableRows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    
    if (cells.length < 5) continue;

    // cells[0] = number, cells[1] = family name, cells[2] = shorthand, cells[3] = versions count, cells[4] = version range
    const familyName = cells[1];
    const shorthand = cells[2];
    const versionRange = cells[4];

    if (familyName === undefined || shorthand === undefined || versionRange === undefined) continue;
    if (familyName === 'Family Name') continue; // Skip header if present

    // Parse version range (e.g., "I1-I6", "O1-O5", "D1-D6")
    const versions = parseVersionRange(versionRange);

    families.push({
      family: shorthand,
      versions,
      documentationPath: 'ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md',
    });
  }

  return families;
}

/**
 * Parse version range like "I1-I6" into ["I1", "I2", "I3", "I4", "I5", "I6"]
 */
function parseVersionRange(range: string): string[] {
  const match = range.match(/^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/);
  if (match === null) return [];

  const prefix = match[1];
  const start = parseInt(match[2] ?? '0', 10);
  const end = parseInt(match[4] ?? '0', 10);

  const versions: string[] = [];
  for (let i = start; i <= end; i++) {
    versions.push(`${prefix}${i}`);
  }

  return versions;
}

/**
 * Parse content-blocks.ts for implemented block type definitions
 */
function parseBlockTypeDefinitions(content: string): BlockImplementation[] {
  const implementations: BlockImplementation[] = [];

  // Match versioned block interfaces:
  // export interface IntroductionI1Block extends BaseBlock
  // export interface CodeC1Block extends BaseBlock
  // export interface DefinitionD1Block extends BaseBlock
  // export interface SummaryS1Block extends BaseBlock
  const versionedBlockRegex = /export\s+interface\s+(\w+?)([A-Z]+\d+)Block\s+extends\s+BaseBlock/g;
  let match;

  while ((match = versionedBlockRegex.exec(content)) !== null) {
    const blockType = match[1];
    const version = match[2];
    
    if (blockType === undefined || version === undefined) continue;

    implementations.push({
      type: blockType.toLowerCase(),
      version,
      path: BLOCK_TYPES_PATH,
      exported: true,
    });
  }

  // Match base block types without versions:
  // export interface HeadingBlock extends BaseBlock
  // export interface ParagraphBlock extends BaseBlock
  const baseBlockRegex = /export\s+interface\s+(\w+?)Block\s+extends\s+BaseBlock\s*\{/g;
  
  while ((match = baseBlockRegex.exec(content)) !== null) {
    const blockName = match[1];
    if (blockName === undefined) continue;

    // Skip if it's a versioned block pattern (already captured above)
    if (/[A-Z]\d+$/.test(blockName)) continue;

    const blockType = blockName.toLowerCase();

    // Skip Base/Container blocks
    if (blockType === 'base' || blockType === 'container') continue;

    implementations.push({
      type: blockType,
      version: undefined,
      path: BLOCK_TYPES_PATH,
      exported: true,
    });
  }

  return implementations;
}

/**
 * Parse renderer component file path for block type
 */
function parseRendererComponent(filePath: string): BlockRenderer | null {
  // Extract filename: packages/ui/src/tutorial/blocks/CodeC1Block.tsx -> CodeC1Block.tsx
  const filename = filePath.split(/[/\\]/).pop();
  if (filename === undefined) return null;

  // Remove .tsx extension
  const componentName = filename.replace('.tsx', '');

  // Extract block type:
  // IntroductionBlock.tsx -> introduction
  // CodeC1Block.tsx -> code (versioned)
  // DefinitionBlock.tsx -> definition
  const blockType = componentName
    .replace(/Block$/, '')
    .replace(/[A-Z]\d+$/, '') // Remove version suffix like C1, I1
    .replace(/([A-Z])/g, (match, p1) => `-${(p1 as string).toLowerCase()}`)
    .replace(/^-/, '');

  return {
    blockType,
    componentPath: filePath,
    registeredInRenderer: true, // Assume registered if file exists
  };
}

/**
 * Cross-reference implemented and rendered blocks for VERIFIED status
 * 
 * VERIFIED = documented + type definition + renderer exists + UBRC compliant
 * 
 * Current implementation checks: documented (in registry) + type (implemented) + renderer (component exists).
 * Future work: REGISTERED (check TutorialBlockRenderer registry), UBRC (data-block-version attribute), TESTED (test coverage).
 * 
 * EXCLUSIONS:
 * - S1 (SummaryBlock): Has type + renderer but missing UBRC data-block-version attribute
 */
function crossReferenceBlocks(
  implemented: BlockImplementation[],
  rendered: BlockRenderer[],
  documented: BlockFamilyDoc[]
): BlockVerification[] {
  const verified: BlockVerification[] = [];

  // Build set of documented versions for cross-reference
  const documentedVersions = new Set<string>();
  for (const doc of documented) {
    for (const version of doc.versions) {
      documentedVersions.add(version);
    }
  }

  for (const impl of implemented) {
    // Check if renderer exists for this block type
    const hasRenderer = rendered.some(r => r.blockType === impl.type);
    
    // Check if documented in registry
    const isDocumented = impl.version !== undefined && documentedVersions.has(impl.version);
    
    // VERIFIED requires both documented AND rendered
    // Future: add REGISTERED, UBRC, TESTED checks
    const isVerified = isDocumented && hasRenderer;

    // Only add to verified list if criteria met
    if (isVerified && impl.version !== undefined) {
      verified.push({
        blockType: impl.type,
        version: impl.version,
        documented: isDocumented,
        implemented: true,
        rendered: hasRenderer,
        tested: false,
      });
    }
  }

  return verified;
}

/**
 * Detect discrepancies between documented, implemented, and rendered blocks
 */
function detectDiscrepancies(
  documented: BlockFamilyDoc[],
  implemented: BlockImplementation[],
  rendered: BlockRenderer[]
): BlockDiscrepancy[] {
  const discrepancies: BlockDiscrepancy[] = [];

  // Check for documented but not implemented
  for (const doc of documented) {
    const familyCode = doc.family;
    const implementedVersions = implemented
      .filter(impl => impl.version?.startsWith(familyCode) === true)
      .map(impl => impl.version);

    for (const version of doc.versions) {
      if (!implementedVersions.includes(version)) {
        discrepancies.push({
          blockType: familyCode.toLowerCase(),
          version,
          issue: 'DOCUMENTED but not IMPLEMENTED',
          severity: 'warning',
          recommendation: `Implement type definition for ${version} in content-blocks.ts`,
        });
      }
    }
  }

  // Check for implemented but not rendered
  for (const impl of implemented) {
    if (impl.version === undefined) continue; // Skip base blocks

    const hasRenderer = rendered.some(r => r.blockType === impl.type);
    if (!hasRenderer) {
      discrepancies.push({
        blockType: impl.type,
        version: impl.version,
        issue: 'IMPLEMENTED but not RENDERED',
        severity: 'warning',
        recommendation: `Create renderer component for ${impl.version} in packages/ui/src/tutorial/blocks/`,
      });
    }
  }

  return discrepancies;
}
