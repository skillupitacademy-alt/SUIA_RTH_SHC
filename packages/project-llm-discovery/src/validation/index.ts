import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationResult } from './validator.js';
import { validateSchema } from './v1-schema-validator.js';
import { validateReferenceIntegrity } from './v2-reference-integrity-validator.js';
import { validateEvidencePaths } from './v3-evidence-paths-validator.js';
import { validateBlockConsistency } from './v4-block-consistency-validator.js';
import { validateComposer } from './v5-composer-validator.js';
import { validateDependencyGraph } from './v6-dependency-graph-validator.js';
import { validateTestReferences } from './v7-test-references-validator.js';
import { validateEvidenceCompleteness } from './v8-evidence-completeness-validator.js';
import { validateDeterminism } from './v9-determinism-validator.js';

export type { ValidationResult, ValidationError, ValidationWarning } from './validator.js';

/**
 * Validate a repository snapshot using all 9 validators (V1-V9)
 * @param snapshot The snapshot to validate
 * @param adapter Repository adapter for file system checks
 * @param repositoryRoot Root path of the repository (required for V9 determinism check)
 * @returns ValidationResult with valid flag, errors, and warnings
 */
export async function validateSnapshot(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter,
  repositoryRoot?: string
): Promise<ValidationResult> {
  const allErrors = [];
  const allWarnings = [];

  // V1: Schema validation
  const v1 = await validateSchema(snapshot);
  allErrors.push(...v1.errors);
  allWarnings.push(...v1.warnings);

  // V2: Reference integrity
  const v2 = await validateReferenceIntegrity(snapshot);
  allErrors.push(...v2.errors);
  allWarnings.push(...v2.warnings);

  // V3: Evidence paths exist
  const v3 = await validateEvidencePaths(snapshot, adapter);
  allErrors.push(...v3.errors);
  allWarnings.push(...v3.warnings);

  // V4: Block consistency
  const v4 = await validateBlockConsistency(snapshot);
  allErrors.push(...v4.errors);
  allWarnings.push(...v4.warnings);

  // V5: Single composer service
  const v5 = await validateComposer(snapshot);
  allErrors.push(...v5.errors);
  allWarnings.push(...v5.warnings);

  // V6: Dependency graph acyclic
  const v6 = await validateDependencyGraph(snapshot);
  allErrors.push(...v6.errors);
  allWarnings.push(...v6.warnings);

  // V7: Test references exist
  const v7 = await validateTestReferences(snapshot, adapter);
  allErrors.push(...v7.errors);
  allWarnings.push(...v7.warnings);

  // V8: Evidence completeness
  const v8 = await validateEvidenceCompleteness(snapshot);
  allErrors.push(...v8.errors);
  allWarnings.push(...v8.warnings);

  // V9: Determinism (optional - only if repositoryRoot provided)
  if (repositoryRoot !== undefined && repositoryRoot !== '') {
    const v9 = await validateDeterminism(snapshot, repositoryRoot, adapter);
    allErrors.push(...v9.errors);
    allWarnings.push(...v9.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
