import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { Evidence } from '../contracts/evidence.js';
import type { ValidationError, ValidationWarning } from './validator.js';

/**
 * Critical evidence kinds that must produce errors when missing
 * These represent current implementation state
 */
const CRITICAL_KINDS: Set<Evidence['kind']> = new Set([
  'type-definition',
  'component',
  'service',
]);

/**
 * Validate evidence paths exist and content hashes match
 * 
 * - Missing critical evidence → error
 * - Missing historical evidence → warning
 * - Content hash mismatch → warning (file changed since scan)
 */
export async function validateEvidencePaths(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check each evidence path for existence and content hash
  for (const evidence of snapshot.evidence) {
    const exists = await adapter.fileExists(evidence.path);

    if (!exists) {
      // Distinguish critical vs historical evidence
      if (CRITICAL_KINDS.has(evidence.kind)) {
        errors.push({
          validator: 'V3-evidence-paths',
          code: 'CRITICAL_EVIDENCE_PATH_NOT_FOUND',
          message: `Critical evidence path not found: ${evidence.path}`,
          path: evidence.path,
          details: {
            evidenceId: evidence.evidenceId,
            scannerName: evidence.scannerName,
            kind: evidence.kind,
            claim: evidence.claim,
          },
        });
      } else {
        warnings.push({
          validator: 'V3-evidence-paths',
          code: 'HISTORICAL_EVIDENCE_PATH_NOT_FOUND',
          message: `Historical evidence path not found: ${evidence.path}`,
          path: evidence.path,
          details: {
            evidenceId: evidence.evidenceId,
            scannerName: evidence.scannerName,
            kind: evidence.kind,
            claim: evidence.claim,
          },
        });
      }
    } else {
      // Path exists - verify content hash for files (not directories)
      if (evidence.contentHash !== '') {
        const currentHash = await adapter.getFileHash(evidence.path);
        if (currentHash !== evidence.contentHash) {
          warnings.push({
            validator: 'V3-evidence-paths',
            code: 'EVIDENCE_CONTENT_HASH_MISMATCH',
            message: `Evidence content hash mismatch for ${evidence.path}`,
            path: evidence.path,
            details: {
              evidenceId: evidence.evidenceId,
              scannerName: evidence.scannerName,
              expectedHash: evidence.contentHash,
              actualHash: currentHash,
            },
          });
        }
      }
    }
  }

  return { errors, warnings };
}

