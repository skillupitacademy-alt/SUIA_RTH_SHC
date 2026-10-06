import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';
import type { Evidence } from '../contracts/evidence.js';

/**
 * Validate that all discovered entities have corresponding evidence
 * 
 * Uses exact evidenceId lookup to ensure evidence exists for all entity types:
 * - D1: Applications, Packages, Services
 * - D3: Block Implementations
 * - D4: Block Renderers
 * - D5: Composer Services, APIs, Schemas, UI
 * - Dependencies: Nodes, Edges
 * 
 * Validation Rules:
 * 1. MISSING_EVIDENCE_ID — entity.evidenceId is empty, undefined, or null
 * 2. UNKNOWN_EVIDENCE_ID — entity.evidenceId is set but not found in snapshot.evidence
 * 3. EVIDENCE_PATH_MISMATCH — evidence found but evidence.path !== entity.path
 * 4. EVIDENCE_KIND_MISMATCH — evidence kind is incompatible with entity domain
 */
export async function validateEvidenceCompleteness(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build evidence lookup map by evidenceId
  const evidenceById = new Map<string, Evidence>(
    snapshot.evidence.map(e => [e.evidenceId, e])
  );

  // Helper to validate evidence binding for an entity
  function validateEvidence(
    entityPath: string,
    entityEvidenceId: string | undefined,
    entityName: string,
    domain: string,
    expectedKinds: string[],
    requireExactPathMatch: boolean = false
  ): void {
    // Rule 1: MISSING_EVIDENCE_ID
    if (!entityEvidenceId || entityEvidenceId.trim() === '') {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_EVIDENCE_ID',
        message: `${domain} "${entityName}" has no evidenceId`,
        path: entityPath,
        details: { domain, entity: entityName },
      });
      return;
    }

    // Rule 2: UNKNOWN_EVIDENCE_ID
    const evidence = evidenceById.get(entityEvidenceId);
    if (!evidence) {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'UNKNOWN_EVIDENCE_ID',
        message: `${domain} "${entityName}" references unknown evidenceId: ${entityEvidenceId}`,
        path: entityPath,
        details: { domain, entity: entityName, evidenceId: entityEvidenceId },
      });
      return;
    }

    // Rule 3: EVIDENCE_PATH_MISMATCH
    // For some entities (apps, packages, services), evidence points to a file within the entity directory
    // For others (blocks, renderers), evidence should match the exact path
    if (requireExactPathMatch) {
      if (evidence.path !== entityPath) {
        errors.push({
          validator: 'V8-evidence-completeness',
          code: 'EVIDENCE_PATH_MISMATCH',
          message: `${domain} "${entityName}" path mismatch: entity at "${entityPath}", evidence at "${evidence.path}"`,
          path: entityPath,
          details: {
            domain,
            entity: entityName,
            entityPath,
            evidencePath: evidence.path,
            evidenceId: entityEvidenceId,
          },
        });
      }
    } else {
      // For directory-based entities, check if evidence is related to the entity path
      // Evidence path should either match the entity path or be within its directory
      const normalizedEntityPath = entityPath.replace(/\\/g, '/');
      const normalizedEvidencePath = evidence.path.replace(/\\/g, '/');
      
      const isRelated = 
        normalizedEvidencePath === normalizedEntityPath ||
        normalizedEvidencePath.startsWith(normalizedEntityPath + '/') ||
        normalizedEvidencePath === normalizedEntityPath + '/package.json' ||
        normalizedEvidencePath.startsWith(normalizedEntityPath + '\\') ||
        normalizedEvidencePath === normalizedEntityPath + '\\package.json';
      
      if (!isRelated) {
        errors.push({
          validator: 'V8-evidence-completeness',
          code: 'EVIDENCE_PATH_MISMATCH',
          message: `${domain} "${entityName}" path mismatch: entity at "${entityPath}", evidence at "${evidence.path}"`,
          path: entityPath,
          details: {
            domain,
            entity: entityName,
            entityPath,
            evidencePath: evidence.path,
            evidenceId: entityEvidenceId,
          },
        });
      }
    }

    // Rule 4: EVIDENCE_KIND_MISMATCH
    if (!expectedKinds.includes(evidence.kind)) {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'EVIDENCE_KIND_MISMATCH',
        message: `${domain} "${entityName}" has incompatible evidence kind: expected one of [${expectedKinds.join(', ')}], got "${evidence.kind}"`,
        path: entityPath,
        details: {
          domain,
          entity: entityName,
          expectedKinds,
          actualKind: evidence.kind,
          evidenceId: entityEvidenceId,
        },
      });
    }
  }

  // Helper for dependency entities (skip path matching since they use logical references)
  function validateEvidenceForDependency(
    entityPath: string,
    entityEvidenceId: string | undefined,
    entityName: string,
    domain: string,
    expectedKinds: string[]
  ): void {
    // Rule 1: MISSING_EVIDENCE_ID
    if (!entityEvidenceId || entityEvidenceId.trim() === '') {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'MISSING_EVIDENCE_ID',
        message: `${domain} "${entityName}" has no evidenceId`,
        path: entityPath,
        details: { domain, entity: entityName },
      });
      return;
    }

    // Rule 2: UNKNOWN_EVIDENCE_ID
    const evidence = evidenceById.get(entityEvidenceId);
    if (!evidence) {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'UNKNOWN_EVIDENCE_ID',
        message: `${domain} "${entityName}" references unknown evidenceId: ${entityEvidenceId}`,
        path: entityPath,
        details: { domain, entity: entityName, evidenceId: entityEvidenceId },
      });
      return;
    }

    // Rule 3: EVIDENCE_PATH_MISMATCH - SKIPPED for dependencies
    // Dependencies use logical identifiers (package names, composite keys), not file paths

    // Rule 4: EVIDENCE_KIND_MISMATCH
    if (!expectedKinds.includes(evidence.kind)) {
      errors.push({
        validator: 'V8-evidence-completeness',
        code: 'EVIDENCE_KIND_MISMATCH',
        message: `${domain} "${entityName}" has incompatible evidence kind: expected one of [${expectedKinds.join(', ')}], got "${evidence.kind}"`,
        path: entityPath,
        details: {
          domain,
          entity: entityName,
          expectedKinds,
          actualKind: evidence.kind,
          evidenceId: entityEvidenceId,
        },
      });
    }
  }

  // D1: Structure domain (entities use directory paths, evidence uses package.json paths)
  for (const app of snapshot.structure.applications) {
    validateEvidence(
      app.path,
      app.evidenceId,
      app.name,
      'Application',
      ['package', 'file', 'directory'],
      false // Allow evidence path to be within entity directory
    );
  }

  for (const pkg of snapshot.structure.packages) {
    validateEvidence(
      pkg.path,
      pkg.evidenceId,
      pkg.name,
      'Package',
      ['package', 'file'],
      false // Allow evidence path to be within entity directory
    );
  }

  for (const service of snapshot.structure.services) {
    validateEvidence(
      service.path,
      service.evidenceId,
      service.name,
      'Service',
      ['service', 'file', 'package'], // Services can have package evidence
      false // Allow evidence path to be within entity directory
    );
  }

  // D3: Block implementations (use exact file paths)
  for (const block of snapshot.blocks.implemented) {
    validateEvidence(
      block.path,
      block.evidenceId,
      block.type,
      'Block Implementation',
      ['type-definition', 'file'],
      true // Require exact path match
    );
  }

  // D4: Block renderers (use exact file paths)
  for (const renderer of snapshot.blocks.rendered) {
    validateEvidence(
      renderer.componentPath,
      renderer.evidenceId,
      renderer.blockType,
      'Block Renderer',
      ['ui-component', 'component', 'file'],
      true // Require exact path match
    );
  }

  // D5: Composer domain (use exact file paths)
  for (const composerService of snapshot.composer.services) {
    validateEvidence(
      composerService.path,
      composerService.evidenceId,
      composerService.name,
      'Composer Service',
      ['service', 'file'],
      true // Require exact path match
    );
  }

  for (const api of snapshot.composer.apis) {
    validateEvidence(
      api.handler,
      api.evidenceId,
      `${api.method} ${api.endpoint}`,
      'Composer API',
      ['api-route', 'file'],
      true // Require exact path match
    );
  }

  for (const schema of snapshot.composer.schemas) {
    validateEvidence(
      schema.path,
      schema.evidenceId,
      schema.name,
      'Composer Schema',
      ['schema', 'file'],
      true // Require exact path match
    );
  }

  for (const ui of snapshot.composer.ui) {
    validateEvidence(
      ui.path,
      ui.evidenceId,
      ui.component,
      'Composer UI',
      ['ui-component', 'component', 'file'],
      true // Require exact path match
    );
  }

  // Dependencies domain (special case: nodes use package names, edges use composite keys)
  // For these, we skip path matching since paths are logical references, not file paths
  for (const node of snapshot.dependencies.nodes) {
    validateEvidenceForDependency(
      node.name,
      node.evidenceId,
      node.name,
      'Dependency Node',
      ['package', 'file']
    );
  }

  for (const edge of snapshot.dependencies.edges) {
    validateEvidenceForDependency(
      `${edge.from} -> ${edge.to}`,
      edge.evidenceId,
      `${edge.from} -> ${edge.to}`,
      'Dependency Edge',
      ['import', 'export', 'file', 'package'] // Edges discovered from package.json
    );
  }

  return { errors, warnings };
}

