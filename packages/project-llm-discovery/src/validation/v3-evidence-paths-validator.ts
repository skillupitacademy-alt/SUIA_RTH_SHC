import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateEvidencePaths(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check each evidence path for existence
  for (const evidence of snapshot.evidence) {
    const exists = await adapter.fileExists(evidence.path);

    if (!exists) {
      warnings.push({
        validator: 'V3-evidence-paths',
        code: 'EVIDENCE_PATH_NOT_FOUND',
        message: `Evidence path not found: ${evidence.path}`,
        path: evidence.path,
        details: {
          evidenceId: evidence.evidenceId,
          scannerName: evidence.scannerName,
          claim: evidence.claim,
        },
      });
    }
  }

  return { errors, warnings };
}
