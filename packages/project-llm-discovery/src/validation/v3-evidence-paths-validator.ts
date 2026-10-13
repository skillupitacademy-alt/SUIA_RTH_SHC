import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { Evidence } from '../contracts/evidence.js';
import type { ValidationError, ValidationWarning } from './validator.js';

/**
 * Validate evidence paths exist and content hashes match using lifecycle-based severity
 * 
 * M2.1 Lifecycle-based validation rules:
 * - Missing path + lifecycle === 'current' → ERROR (CURRENT_EVIDENCE_PATH_NOT_FOUND)
 * - Missing path + lifecycle !== 'current' → WARNING (HISTORICAL_EVIDENCE_PATH_NOT_FOUND)
 * - Hash mismatch + lifecycle === 'current' → ERROR (CURRENT_EVIDENCE_CONTENT_HASH_MISMATCH)
 * - Hash mismatch + lifecycle !== 'current' → WARNING (HISTORICAL_EVIDENCE_CONTENT_HASH_MISMATCH)
 * - Directories (contentHash === '' or kind === 'directory') skip hash checks
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
    const isCurrent = evidence.lifecycle === 'current';

    if (!exists) {
      // Path missing - severity based on lifecycle
      if (isCurrent) {
        errors.push({
          validator: 'V3-evidence-paths',
          code: 'CURRENT_EVIDENCE_PATH_NOT_FOUND',
          message: `Current evidence path not found: ${evidence.path}`,
          path: evidence.path,
          details: {
            evidenceId: evidence.evidenceId,
            scannerName: evidence.scannerName,
            kind: evidence.kind,
            lifecycle: evidence.lifecycle,
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
            lifecycle: evidence.lifecycle,
            claim: evidence.claim,
          },
        });
      }
    } else {
      // Path exists - verify content hash for files (not directories)
      // Skip hash verification for directories (contentHash is empty string by contract)
      // and for any evidence kind that is explicitly a directory
      if (evidence.contentHash !== '' && evidence.kind !== 'directory') {
        const currentHash = await adapter.getFileHash(evidence.path);
        if (currentHash !== evidence.contentHash) {
          // Hash mismatch - severity based on lifecycle
          if (isCurrent) {
            errors.push({
              validator: 'V3-evidence-paths',
              code: 'CURRENT_EVIDENCE_CONTENT_HASH_MISMATCH',
              message: `Current evidence content hash mismatch for ${evidence.path}`,
              path: evidence.path,
              details: {
                evidenceId: evidence.evidenceId,
                scannerName: evidence.scannerName,
                lifecycle: evidence.lifecycle,
                expectedHash: evidence.contentHash,
                actualHash: currentHash,
              },
            });
          } else {
            warnings.push({
              validator: 'V3-evidence-paths',
              code: 'HISTORICAL_EVIDENCE_CONTENT_HASH_MISMATCH',
              message: `Historical evidence content hash mismatch for ${evidence.path}`,
              path: evidence.path,
              details: {
                evidenceId: evidence.evidenceId,
                scannerName: evidence.scannerName,
                lifecycle: evidence.lifecycle,
                expectedHash: evidence.contentHash,
                actualHash: currentHash,
              },
            });
          }
        }
      }
    }
  }

  return { errors, warnings };
}

