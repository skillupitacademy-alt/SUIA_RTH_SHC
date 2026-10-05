import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateEvidenceCompleteness(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build map of evidence by path and claim
  const evidenceByPath = new Map<string, string[]>();
  const evidenceClaimKeywords = new Set<string>();

  for (const evidence of snapshot.evidence) {
    const claims = evidenceByPath.get(evidence.path) ?? [];
    claims.push(evidence.claim);
    evidenceByPath.set(evidence.path, claims);

    // Extract keywords from claim for matching
    const keywords = evidence.claim.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      evidenceClaimKeywords.add(keyword);
    }
  }

  // Check applications
  for (const app of snapshot.structure.applications) {
    if (!evidenceByPath.has(app.path) && !hasMatchingEvidence(app.name, evidenceClaimKeywords)) {
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
    if (!evidenceByPath.has(pkg.path) && !hasMatchingEvidence(pkg.name, evidenceClaimKeywords)) {
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
    if (!evidenceByPath.has(service.path) && !hasMatchingEvidence(service.name, evidenceClaimKeywords)) {
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
    if (!evidenceByPath.has(block.path) && !hasMatchingEvidence(block.type, evidenceClaimKeywords)) {
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
    if (!evidenceByPath.has(composer.path) && !hasMatchingEvidence(composer.name, evidenceClaimKeywords)) {
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

function hasMatchingEvidence(entityName: string, evidenceKeywords: Set<string>): boolean {
  const entityKeywords = entityName.toLowerCase().split(/[\/\-_@]/);
  for (const keyword of entityKeywords) {
    if (keyword.length > 2 && evidenceKeywords.has(keyword)) {
      return true;
    }
  }
  return false;
}
