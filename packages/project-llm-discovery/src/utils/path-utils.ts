import { createHash } from 'node:crypto';

/**
 * Normalize a file path for cross-platform consistency
 * - Converts backslashes to forward slashes
 * - Lowercases drive letters (E:\ → e:/)
 * - Trims leading and trailing slashes
 * 
 * @param path - The file path to normalize
 * @returns The normalized path
 * 
 * @example
 * normalizePath('E:\\apps\\admin') → 'e:/apps/admin'
 * normalizePath('apps/admin/') → 'apps/admin'
 */
export function normalizePath(path: string): string {
  // Convert backslashes to forward slashes
  let normalized = path.replace(/\\/g, '/');
  
  // Lowercase drive letters (e.g., E:/ → e:/)
  normalized = normalized.replace(/^([A-Z]):/, (_, letter) => `${letter.toLowerCase()}:`);
  
  // Trim leading and trailing slashes
  normalized = normalized.replace(/^\/+|\/+$/g, '');
  
  return normalized;
}

/**
 * Generate a deterministic evidence ID from evidence components
 * 
 * Uses SHA-256(kind + normalizedPath + symbol + contentHash) to create
 * a collision-resistant, deterministic identifier for evidence records.
 * 
 * The ID is deterministic: same inputs always produce the same ID.
 * This enables:
 * - Stable evidence references across scans
 * - Differential analysis of evidence changes
 * - Inclusion of evidenceId in canonical hash integrity guarantee
 * 
 * @param kind - The evidence kind (e.g., 'type-definition', 'component')
 * @param path - The file or directory path
 * @param contentHash - SHA-256 hash of file content (empty string for directories)
 * @param symbol - Optional disambiguator (e.g., method name, block type) when multiple evidence records exist for same path+kind
 * @returns Evidence ID in format: evidence-<first16hex>
 * 
 * @example
 * generateDeterministicEvidenceId('package', 'apps/admin/package.json', 'abc123')
 * → 'evidence-a1b2c3d4e5f67890'
 */
export function generateDeterministicEvidenceId(
  kind: string,
  path: string,
  contentHash: string,
  symbol?: string
): string {
  // Normalize the path for cross-platform consistency
  const normalizedPath = normalizePath(path);
  
  // Construct canonical JSON for hashing
  const canonicalInput = JSON.stringify({
    kind,
    path: normalizedPath,
    symbol: symbol ?? null,
    contentHash,
  });
  
  // Compute SHA-256 hash
  const hash = createHash('sha256').update(canonicalInput).digest('hex');
  
  // Return evidence ID with first 16 hex characters
  return `evidence-${hash.slice(0, 16)}`;
}
