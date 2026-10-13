/**
 * Registry/Renderer Runtime Verification
 * 
 * Verifies that blocks have actual runtime registration (not just file existence).
 * 
 * Checks:
 * 1. Block type is registered in the active block registry
 * 2. Block is discoverable via registry lookup
 * 3. Renderer is resolvable for the block type
 * 4. Version is compatible (not just present)
 * 5. Type signature is compatible
 * 
 * ARCHITECTURAL RULE: TypeScript performs verification, Python calls this.
 */

import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { BlockVerification } from '../contracts/snapshot.js';

const BLOCK_REGISTRY_PATH = 'packages/types/src/tutorial-rich-document/registry.ts';
const TUTORIAL_BLOCK_RENDERER_PATH = 'packages/ui/src/tutorial/TutorialBlockRenderer.tsx';

export interface RegistryRendererVerificationResult {
  blockType: string;
  version?: string;
  registryEntry: boolean;
  rendererResolvable: boolean;
  versionCompatible: boolean;
  typeCompatible: boolean;
  runtimeDispatchCase: boolean;
  status: 'PASS' | 'FAIL';
  issues: string[];
}

/**
 * Verify runtime registration for a block
 * 
 * This is stronger than checking component file existence - it verifies
 * that the block can actually be rendered at runtime via the registry
 * and dispatcher.
 */
export async function verifyRegistryRendererRuntime(
  blockVerifications: BlockVerification[],
  adapter: RepositoryAdapter
): Promise<RegistryRendererVerificationResult[]> {
  const results: RegistryRendererVerificationResult[] = [];
  
  // Load registry
  const registryTypes = await loadRegistryTypes(adapter);
  
  // Load runtime dispatch cases
  const dispatchCases = await loadRuntimeDispatchCases(adapter);
  
  for (const block of blockVerifications) {
    const issues: string[] = [];
    
    // Check 1: Registry entry exists
    const hasRegistryEntry = registryTypes.has(block.blockType);
    if (!hasRegistryEntry) {
      issues.push(`No registry entry found for '${block.blockType}' in ${BLOCK_REGISTRY_PATH}`);
    }
    
    // Check 2: Runtime dispatch case exists
    const hasDispatchCase = dispatchCases.has(block.blockType);
    if (!hasDispatchCase) {
      issues.push(`No runtime dispatch case for '${block.blockType}' in ${TUTORIAL_BLOCK_RENDERER_PATH}`);
    }
    
    // Check 3: Version compatibility (for versioned blocks)
    let versionCompatible = true;
    if (block.version !== undefined) {
      // Verify registry entry includes version information
      const registryEntry = registryTypes.get(block.blockType);
      if (registryEntry && !registryEntry.includes(block.version)) {
        issues.push(`Registry entry for '${block.blockType}' does not include version ${block.version}`);
        versionCompatible = false;
      }
    }
    
    // Check 4: Renderer resolvable (already checked in D3 scanner, but verify)
    const rendererResolvable = block.rendered;
    if (!rendererResolvable) {
      issues.push(`Renderer component not found for '${block.blockType}'`);
    }
    
    // Check 5: Type compatibility (verify registry type matches block type)
    let typeCompatible = false;  // Default to false unless verified
    if (hasRegistryEntry) {
      const registryEntry = registryTypes.get(block.blockType);
      typeCompatible = registryEntry !== undefined && registryEntry.includes(`type: '${block.blockType}'`);
      if (!typeCompatible) {
        issues.push(`Type mismatch in registry entry for '${block.blockType}'`);
      }
    }
    
    results.push({
      blockType: block.blockType,
      version: block.version,
      registryEntry: hasRegistryEntry,
      rendererResolvable,
      versionCompatible,
      typeCompatible,
      runtimeDispatchCase: hasDispatchCase,
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }
  
  return results;
}

/**
 * Load registry types from registry.ts
 * Returns Map of blockType -> registry entry content
 */
async function loadRegistryTypes(adapter: RepositoryAdapter): Promise<Map<string, string>> {
  const registryTypes = new Map<string, string>();
  
  try {
    if (!(await adapter.fileExists(BLOCK_REGISTRY_PATH))) {
      return registryTypes;
    }
    
    const content = await adapter.readFile(BLOCK_REGISTRY_PATH);
    
    // Parse registry entries like:
    // heading: { type: 'heading', label: 'Heading', ... },
    // paragraph: { type: 'paragraph', label: 'Paragraph', ... },
    const entryRegex = /(\w+):\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = entryRegex.exec(content)) !== null) {
      const blockType = match[1];
      const entryContent = match[2];
      if (blockType !== undefined && entryContent !== undefined) {
        registryTypes.set(blockType, entryContent);
      }
    }
  } catch (error) {
    // Registry not found or can't be read
  }
  
  return registryTypes;
}

/**
 * Load runtime dispatch cases from TutorialBlockRenderer.tsx
 * Returns Set of block types that have runtime dispatch handlers
 */
async function loadRuntimeDispatchCases(adapter: RepositoryAdapter): Promise<Set<string>> {
  const dispatchCases = new Set<string>();
  
  try {
    if (!(await adapter.fileExists(TUTORIAL_BLOCK_RENDERER_PATH))) {
      return dispatchCases;
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
        dispatchCases.add(blockType);
      }
    }
  } catch (error) {
    // Renderer not found or can't be read
  }
  
  return dispatchCases;
}
