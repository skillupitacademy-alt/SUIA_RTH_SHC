import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';
import { normalizePath } from '../utils/path-utils.js';

/**
 * Validate that all discovered entities have corresponding evidence
 * 
 * Uses exact normalized path matching to ensure evidence exists for:
 * - Applications
 * - Packages
 * - Services
 * - Block implementations
 * - Composer services
 */
export async function validateEvidenceCompleteness(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build set of normalized evidence paths
  const evidencePaths = new Set<string>(
    snapshot.evidence.map(e => normalizePath(e.path))
  );

  // Helper to check if any evidence path is within entity path
  function hasEvidenceForPath(entityPath: string): boolean {
    const normalizedEntityPath = normalizePath(entityPath);
    for (const evidencePath of evidencePaths) {
      // Check if evidence is within entity directory or is the entity path itself
      if (evidencePath.startsWith(normalizedEntityPath + '/') || 
          evidencePath.startsWith(normalizedEntityPath + '\\') ||
          evidencePath === normalizedEntityPath) {
        return true;
      }
    }
    return false;
  }

  // Check applications
  for (const app of snapshot.structure.applications) {
    if (!hasEvidenceForPath(app.path)) {
      warnings.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_APPLICATION_EVIDENCE',
        message: `No evidence found for application: ${app.name}`,
        path: app.path,
        details: { application: app.name },
      });
    }
  }

  // Check packages
  for (const pkg of snapshot.structure.packages) {
    if (!hasEvidenceForPath(pkg.path)) {
      warnings.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_PACKAGE_EVIDENCE',
        message: `No evidence found for package: ${pkg.name}`,
        path: pkg.path,
        details: { package: pkg.name },
      });
    }
  }

  // Check services
  for (const service of snapshot.structure.services) {
    if (!hasEvidenceForPath(service.path)) {
      warnings.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_SERVICE_EVIDENCE',
        message: `No evidence found for service: ${service.name}`,
        path: service.path,
        details: { service: service.name },
      });
    }
  }

  // Check block implementations
  for (const block of snapshot.blocks.implemented) {
    if (!hasEvidenceForPath(block.path)) {
      warnings.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_BLOCK_IMPLEMENTATION_EVIDENCE',
        message: `No evidence found for block implementation: ${block.type}`,
        path: block.path,
        details: { blockType: block.type },
      });
    }
  }

  // Check composer services
  for (const composer of snapshot.composer.services) {
    if (!hasEvidenceForPath(composer.path)) {
      warnings.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_COMPOSER_EVIDENCE',
        message: `No evidence found for composer service: ${composer.name}`,
        path: composer.path,
        details: { composerService: composer.name },
      });
    }
  }

  return { errors, warnings };
}

