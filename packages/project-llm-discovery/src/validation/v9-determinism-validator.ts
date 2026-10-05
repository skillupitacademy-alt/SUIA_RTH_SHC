import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';
import { buildSnapshot } from '../snapshot/builder.js';

export async function validateDeterminism(
  snapshot: RepositorySnapshot,
  repositoryRoot: string,
  adapter: RepositoryAdapter
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Build snapshot twice
    const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

    // Compare canonical hashes
    if (snapshot.canonicalHash !== snapshot2.canonicalHash) {
      errors.push({
        validator: 'V9-determinism',
        code: 'DETERMINISM_VIOLATION',
        message: 'Snapshot canonical hash is not deterministic. Same repository state produced different hashes.',
        details: {
          firstHash: snapshot.canonicalHash,
          secondHash: snapshot2.canonicalHash,
        },
      });
    }

    // Additional checks: compare key data structures
    if (snapshot.structure.applications.length !== snapshot2.structure.applications.length) {
      warnings.push({
        validator: 'V9-determinism',
        code: 'APPLICATION_COUNT_MISMATCH',
        message: 'Application count differs between snapshot runs',
        details: {
          first: snapshot.structure.applications.length,
          second: snapshot2.structure.applications.length,
        },
      });
    }

    if (snapshot.evidence.length !== snapshot2.evidence.length) {
      warnings.push({
        validator: 'V9-determinism',
        code: 'EVIDENCE_COUNT_MISMATCH',
        message: 'Evidence count differs between snapshot runs',
        details: {
          first: snapshot.evidence.length,
          second: snapshot2.evidence.length,
        },
      });
    }
  } catch (error) {
    errors.push({
      validator: 'V9-determinism',
      code: 'DETERMINISM_CHECK_FAILED',
      message: `Failed to rebuild snapshot for determinism check: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return { errors, warnings };
}
