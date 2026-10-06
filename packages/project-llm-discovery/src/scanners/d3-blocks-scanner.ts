import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type {
  BlockFamilyDoc,
  BlockImplementation,
  BlockRenderer,
  BlockVerification,
  BlockDiscrepancy,
  VerificationLevel,
  UBRCStatus,
} from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../contracts/errors.js';
import { EvidenceCollector } from '../evidence/collector.js';
import { randomUUID } from 'node:crypto';

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
const TUTORIAL_BLOCK_RENDERER_PATH = 'packages/ui/src/tutorial/TutorialBlockRenderer.tsx';
const BLOCK_REGISTRY_PATH = 'packages/types/src/tutorial-rich-document/registry.ts';

/**
 * D3 Blocks Scanner
 * 
 * Discovers educational block implementation state across 6 verification levels:
 * 
 * 1. DISCOVERED: Base state (block exists in some form)
 * 2. IMPLEMENTED: Type definition exists in content-blocks.ts
 * 3. RENDERED: React component file exists in packages/ui/src/tutorial/blocks/
 * 4. REGISTERED: Runtime dispatch case exists in TutorialBlockRenderer.tsx switch statement
 * 5. TESTED: Test coverage exists for the block
 * 6. VERIFIED: All predicates pass (documented + implemented + rendered + registered + tested)
 * 
 * Evidence-driven verification:
 * - documented: Parsed from PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md (not assumed)
 * - implemented: Type definition found in content-blocks.ts
 * - rendered: Component file exists in blocks/ directory
 * - registered: Runtime dispatch case found in TutorialBlockRenderer.tsx
 * - tested: Test coverage exists (M1 scope: not yet implemented)
 * 
 * M1 scope limitations:
 * - UBRC compliance (data-block-version attribute) is deferred to M2
 * - Test coverage detection is deferred to M2
 * 
 * CRITICAL: Maintains separate states for documented/implemented/rendered/verified.
 * Never collapses states or makes false assumptions.
 */
export async function scanBlocks(
  adapter: RepositoryAdapter
): Promise<ScannerResult<BlocksData>> {
  const scannerName = 'D3-blocks-scanner';
  const timestamp = new Date().toISOString();
  const collector = new EvidenceCollector();
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

      collector.add(
        collector.createEvidence(
          scannerName,
          'documentation',
          BLOCK_CORPUS_DOC_PATH,
          contentHash,
          'Block corpus registry documentation discovered',
          `file:${BLOCK_CORPUS_DOC_PATH}`
        )
      );

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

      const evidence = collector.createEvidence(
        scannerName,
        'type-definition',
        BLOCK_TYPES_PATH,
        contentHash,
        'Block type definitions discovered',
        `file:${BLOCK_TYPES_PATH}`
      );
      collector.add(evidence);

      const implementedBlocks = parseBlockTypeDefinitions(typesContent);
      // Populate evidenceId for each implementation
      for (const impl of implementedBlocks) {
        impl.evidenceId = evidence.evidenceId;
      }
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
          const rendererInfo = parseRendererComponent(tsxFile);
          
          // Use block type as symbol for deterministic ID
          const blockSymbol = rendererInfo?.blockType ?? tsxFile.split('/').pop()?.replace('.tsx', '') ?? '';
          
          const evidence = collector.createEvidence(
            scannerName,
            'component',
            tsxFile,
            contentHash,
            'Block renderer component discovered',
            `file:${tsxFile}`,
            blockSymbol
          );
          collector.add(evidence);

          if (rendererInfo !== null) {
            rendererInfo.evidenceId = evidence.evidenceId;
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

  // Step 3.5: Perform UBRC (Universal Block Registry Contract) verification
  const ubrcResults = await performUBRCVerification(
    implemented,
    rendered,
    adapter,
    collector,
    scannerName
  );
  
  // Update rendered blocks with UBRC status
  for (const renderer of rendered) {
    const ubrcResult = ubrcResults.get(renderer.blockType);
    if (ubrcResult !== undefined) {
      renderer.ubrcStatus = ubrcResult.status;
      renderer.ubrcDetails = {
        hasDataBlockVersion: ubrcResult.hasDataBlockVersion,
        registryEntry: ubrcResult.hasRegistryEntry,
        versionMatch: ubrcResult.versionMatch,
      };
    }
  }
  
  // Add UBRC findings
  const ubrcValid = Array.from(ubrcResults.values()).filter(r => r.status === 'UBRC_VALID').length;
  const ubrcInvalid = ubrcResults.size - ubrcValid;
  
  if (ubrcInvalid > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'ubrc-verification',
      message: `Found ${ubrcInvalid} blocks with UBRC compliance issues (${ubrcValid} valid)`,
    });
    
    // Detail specific issues
    for (const [blockType, result] of ubrcResults.entries()) {
      if (result.status !== 'UBRC_VALID') {
        findings.push({
          findingId: randomUUID(),
          severity: result.status === 'UBRC_MISSING' || result.status === 'UBRC_RENDERER_MISSING' ? 'error' : 'warning',
          category: 'ubrc-verification',
          message: `Block '${blockType}': ${result.status}`,
          recommendation: result.recommendation,
        });
      }
    }
  } else if (ubrcValid > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'info',
      category: 'ubrc-verification',
      message: `All ${ubrcValid} blocks are UBRC-compliant`,
    });
  }

  // Step 4: Cross-reference for VERIFIED blocks
  const verifiedBlocks = await crossReferenceBlocks(implemented, rendered, documented, adapter, ubrcResults);
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
    evidence: collector.getAll(),
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
      evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
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
      evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
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
    evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
  };
}

/**
 * Check runtime registration in TutorialBlockRenderer.tsx
 * 
 * Parses the switch statement to find actual dispatch cases like:
 *   case 'introduction':
 *   case 'code':
 *   case 'heading':
 * 
 * Returns Set of registered block types that have runtime dispatch handlers.
 * 
 * This is stronger evidence than component file existence - it proves the
 * block can actually be rendered at runtime via the dispatcher.
 */
async function checkRuntimeRegistration(
  adapter: RepositoryAdapter
): Promise<Set<string>> {
  const registered = new Set<string>();

  try {
    if (!(await adapter.fileExists(TUTORIAL_BLOCK_RENDERER_PATH))) {
      return registered;
    }

    const content = await adapter.readFile(TUTORIAL_BLOCK_RENDERER_PATH);

    // Match case statements in the switch block:
    // case 'heading':
    // case 'paragraph':
    // case 'code': {
    const caseRegex = /case\s+['"]([^'"]+)['"]\s*:/g;
    let match;

    while ((match = caseRegex.exec(content)) !== null) {
      const blockType = match[1];
      if (blockType !== undefined && blockType !== 'default') {
        registered.add(blockType);
      }
    }
  } catch (error) {
    // If file doesn't exist or can't be read, return empty set
    // Don't throw - this is discovery, not validation
  }

  return registered;
}

/**
 * Derive verification level from evidence predicates
 * 
 * Each level requires all previous predicates to pass:
 * - DISCOVERED: Base state (always true if we're examining it)
 * - IMPLEMENTED: implemented = true
 * - RENDERED: implemented + rendered = true
 * - REGISTERED: implemented + rendered + registered = true
 * - TESTED: implemented + rendered + registered + tested = true
 * - VERIFIED: documented + implemented + rendered + registered + tested = true
 * 
 * Note: documented is only required for VERIFIED (the highest level).
 * This allows tracking implementation progress for blocks not yet documented.
 */
function deriveVerificationLevel(evidence: {
  documented: boolean;
  implemented: boolean;
  rendered: boolean;
  registered: boolean;
  tested: boolean;
}): VerificationLevel {
  // Check levels from highest to lowest
  if (
    evidence.documented &&
    evidence.implemented &&
    evidence.rendered &&
    evidence.registered &&
    evidence.tested
  ) {
    return 'VERIFIED';
  }

  if (
    evidence.implemented &&
    evidence.rendered &&
    evidence.registered &&
    evidence.tested
  ) {
    return 'TESTED';
  }

  if (evidence.implemented && evidence.rendered && evidence.registered) {
    return 'REGISTERED';
  }

  if (evidence.implemented && evidence.rendered) {
    return 'RENDERED';
  }

  if (evidence.implemented) {
    return 'IMPLEMENTED';
  }

  return 'DISCOVERED';
}

/**
 * Perform UBRC (Universal Block Registry Contract) verification
 * 
 * UBRC compliance chain:
 * 1. Block type exists in BLOCK_REGISTRY
 * 2. Renderer implementation exists
 * 3. Renderer includes data-block-version attribute (for versioned blocks)
 * 4. Version matches across implementation and registry
 * 
 * Returns Map of blockType -> verification result
 */
async function performUBRCVerification(
  implemented: BlockImplementation[],
  rendered: BlockRenderer[],
  adapter: RepositoryAdapter,
  collector: EvidenceCollector,
  scannerName: string
): Promise<Map<string, {
  status: UBRCStatus;
  hasDataBlockVersion: boolean;
  hasRegistryEntry: boolean;
  versionMatch: boolean;
  recommendation?: string;
}>> {
  const results = new Map<string, {
    status: UBRCStatus;
    hasDataBlockVersion: boolean;
    hasRegistryEntry: boolean;
    versionMatch: boolean;
    recommendation?: string;
  }>();
  
  // Load BLOCK_REGISTRY from registry.ts
  let registryTypes: Set<string> = new Set();
  try {
    if (await adapter.fileExists(BLOCK_REGISTRY_PATH)) {
      const registryContent = await adapter.readFile(BLOCK_REGISTRY_PATH);
      const contentHash = await adapter.getFileHash(BLOCK_REGISTRY_PATH);
      
      collector.add(
        collector.createEvidence(
          scannerName,
          'ubrc-verification',
          BLOCK_REGISTRY_PATH,
          contentHash,
          'BLOCK_REGISTRY loaded for UBRC verification',
          `file:${BLOCK_REGISTRY_PATH}`
        )
      );
      
      // Parse registry types from: heading: { type: 'heading', ...
      const typeRegex = /(\w+):\s*\{\s*type:\s*['"](\w+)['"]/g;
      let match;
      while ((match = typeRegex.exec(registryContent)) !== null) {
        const blockType = match[2];
        if (blockType !== undefined) {
          registryTypes.add(blockType);
        }
      }
    }
  } catch (error) {
    // Registry not found - will mark all blocks as UBRC_REGISTRY_MISSING
  }
  
  // Build map of block types to their renderer files
  const rendererMap = new Map<string, BlockRenderer>();
  for (const renderer of rendered) {
    rendererMap.set(renderer.blockType, renderer);
  }
  
  // Build map of implemented versions
  const implementedMap = new Map<string, BlockImplementation[]>();
  for (const impl of implemented) {
    const existing = implementedMap.get(impl.type) ?? [];
    existing.push(impl);
    implementedMap.set(impl.type, existing);
  }
  
  // Verify each implemented block
  for (const impl of implemented) {
    const blockType = impl.type;
    const version = impl.version;
    
    // Check 1: Registry entry exists
    const hasRegistryEntry = registryTypes.size === 0 ? false : registryTypes.has(blockType);
    
    // Check 2: Renderer exists
    const renderer = rendererMap.get(blockType);
    if (renderer === undefined) {
      results.set(blockType, {
        status: 'UBRC_RENDERER_MISSING',
        hasDataBlockVersion: false,
        hasRegistryEntry,
        versionMatch: false,
        recommendation: `Create renderer component for '${blockType}' in ${BLOCK_RENDERERS_DIR}`,
      });
      continue;
    }
    
    // Check 3: data-block-version attribute (for versioned blocks)
    let hasDataBlockVersion = false;
    let versionMatch = true;
    
    try {
      const rendererContent = await adapter.readFile(renderer.componentPath);
      
      // Look for data-block-version attribute in JSX (both static and dynamic)
      // Pattern 1: data-block-version="C1" (static)
      // Pattern 2: data-block-version={block.version} (dynamic)
      // Pattern 3: data-block-version={...} (expression)
      const dataVersionRegex = /data-block-version\s*=\s*(?:["'][^"']*["']|\{[^}]+\})/;
      hasDataBlockVersion = dataVersionRegex.test(rendererContent);
      
      // If versioned block, verify version matches
      if (version !== undefined) {
        if (!hasDataBlockVersion) {
          results.set(blockType, {
            status: 'UBRC_ATTRIBUTE_MISSING',
            hasDataBlockVersion: false,
            hasRegistryEntry,
            versionMatch: false,
            recommendation: `Add data-block-version="${version}" attribute to renderer ${renderer.componentPath}`,
          });
          continue;
        }
        
        // Check if the specific version is in the renderer (static or dynamic)
        // Static: data-block-version="C1"
        const staticVersionPattern = new RegExp(`data-block-version\\s*=\\s*["']${version}["']`);
        // Dynamic: data-block-version={block.version} (acceptable for versioned blocks)
        const dynamicVersionPattern = /data-block-version\s*=\s*\{[^}]*version[^}]*\}/;
        
        versionMatch = staticVersionPattern.test(rendererContent) || dynamicVersionPattern.test(rendererContent);
        
        if (!versionMatch) {
          results.set(blockType, {
            status: 'UBRC_VERSION_MISMATCH',
            hasDataBlockVersion: true,
            hasRegistryEntry,
            versionMatch: false,
            recommendation: `Update data-block-version in ${renderer.componentPath} to match implementation version ${version} (use static="${version}" or dynamic={block.version})`,
          });
          continue;
        }
      }
    } catch (error) {
      // Can't read renderer file
      results.set(blockType, {
        status: 'UBRC_RENDERER_MISSING',
        hasDataBlockVersion: false,
        hasRegistryEntry,
        versionMatch: false,
        recommendation: `Renderer file ${renderer.componentPath} cannot be read`,
      });
      continue;
    }
    
    // Check 4: Registry entry (if registry was loaded)
    if (registryTypes.size > 0 && !hasRegistryEntry) {
      results.set(blockType, {
        status: 'UBRC_MISSING',
        hasDataBlockVersion,
        hasRegistryEntry: false,
        versionMatch,
        recommendation: `Add '${blockType}' entry to BLOCK_REGISTRY in ${BLOCK_REGISTRY_PATH}`,
      });
      continue;
    }
    
    // All checks passed
    results.set(blockType, {
      status: 'UBRC_VALID',
      hasDataBlockVersion: version !== undefined ? hasDataBlockVersion : true, // Unversioned blocks don't need attribute
      hasRegistryEntry,
      versionMatch,
    });
  }
  
  return results;
}

/**
 * Cross-reference implemented and rendered blocks for verification status
 * 
 * Evidence-driven verification:
 * - documented: Parsed from PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md (not assumed)
 * - implemented: Type definition found in content-blocks.ts
 * - rendered: Component file exists in blocks/ directory
 * - registered: Runtime dispatch case found in TutorialBlockRenderer.tsx
 * - tested: Test coverage exists (M1 scope: always false, deferred to M2)
 * 
 * Verification levels (DISCOVERED → IMPLEMENTED → RENDERED → REGISTERED → TESTED → VERIFIED)
 * are derived from evidence predicates via deriveVerificationLevel().
 * 
 * M1 scope limitations:
 * - UBRC compliance check is deferred to M2
 * - Test coverage detection is deferred to M2 (tested always false)
 */
async function crossReferenceBlocks(
  implemented: BlockImplementation[],
  rendered: BlockRenderer[],
  documented: BlockFamilyDoc[],
  adapter: RepositoryAdapter,
  ubrcResults: Map<string, {
    status: UBRCStatus;
    hasDataBlockVersion: boolean;
    hasRegistryEntry: boolean;
    versionMatch: boolean;
    recommendation?: string;
  }>
): Promise<BlockVerification[]> {
  const verified: BlockVerification[] = [];

  // Build set of documented versions for cross-reference
  const documentedVersions = new Set<string>();
  for (const doc of documented) {
    for (const version of doc.versions) {
      documentedVersions.add(version);
    }
  }

  // Get runtime registered block types from TutorialBlockRenderer.tsx
  const registeredTypes = await checkRuntimeRegistration(adapter);

  for (const impl of implemented) {
    // Gather evidence
    const hasRenderer = rendered.some(r => r.blockType === impl.type);
    const isRegistered = registeredTypes.has(impl.type);
    const isDocumented = impl.version !== undefined && documentedVersions.has(impl.version);
    const isTested = false; // M1 scope: test coverage detection deferred to M2

    const evidence = {
      documented: isDocumented,
      implemented: true,
      rendered: hasRenderer,
      registered: isRegistered,
      tested: isTested,
    };

    const level = deriveVerificationLevel(evidence);

    // Get UBRC status for this block
    const ubrcResult = ubrcResults.get(impl.type);
    const ubrcStatus = ubrcResult?.status;

    // Add all implemented blocks to verified list with their actual verification level
    // This allows tracking partial implementation states
    verified.push({
      blockType: impl.type,
      version: impl.version,
      documented: isDocumented,
      implemented: true,
      rendered: hasRenderer,
      registered: isRegistered,
      tested: isTested,
      verificationLevel: level,
      ubrcStatus,
    });
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
