import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateReferenceIntegrity(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build sets for quick lookup
  const implementedTypes = new Set(
    snapshot.blocks.implemented.map((impl) => impl.type)
  );
  const renderedTypes = new Set(
    snapshot.blocks.rendered.map((renderer) => renderer.blockType)
  );
  const serviceNames = new Set(
    snapshot.composer.services.map((service) => service.name)
  );

  // V2.1: Check that verified blocks exist in both implemented AND rendered
  for (const verified of snapshot.blocks.verified) {
    if (verified.implemented !== true) {
      errors.push({
        validator: 'V2-reference-integrity',
        code: 'VERIFIED_NOT_IMPLEMENTED',
        message: `Block ${verified.blockType} marked as verified but not implemented`,
        details: { blockType: verified.blockType, verified },
      });
    }

    if (verified.rendered !== true) {
      errors.push({
        validator: 'V2-reference-integrity',
        code: 'VERIFIED_NOT_RENDERED',
        message: `Block ${verified.blockType} marked as verified but not rendered`,
        details: { blockType: verified.blockType, verified },
      });
    }

    if (!implementedTypes.has(verified.blockType)) {
      errors.push({
        validator: 'V2-reference-integrity',
        code: 'VERIFIED_MISSING_IMPLEMENTATION',
        message: `Block ${verified.blockType} is verified but no implementation found`,
        details: { blockType: verified.blockType },
      });
    }

    if (!renderedTypes.has(verified.blockType)) {
      errors.push({
        validator: 'V2-reference-integrity',
        code: 'VERIFIED_MISSING_RENDERER',
        message: `Block ${verified.blockType} is verified but no renderer found`,
        details: { blockType: verified.blockType },
      });
    }
  }

  // V2.2: Check that composer APIs reference existing services
  for (const api of snapshot.composer.apis) {
    // Extract service reference from handler path if present
    const handlerPath = api.handler;
    let referencesValidService = false;

    for (const service of snapshot.composer.services) {
      if (handlerPath.includes(service.name) || handlerPath.includes(service.path)) {
        referencesValidService = true;
        break;
      }
    }

    if (serviceNames.size > 0 && !referencesValidService) {
      warnings.push({
        validator: 'V2-reference-integrity',
        code: 'API_NO_SERVICE_REFERENCE',
        message: `API ${api.endpoint} handler does not reference any known service`,
        details: { api, availableServices: Array.from(serviceNames) },
      });
    }
  }

  // V2.3: Check for 'unknown' versions in workspace and build system (M2.3)
  if (snapshot.runtime?.workspace?.version === 'unknown') {
    warnings.push({
      validator: 'V2-reference-integrity',
      code: 'UNKNOWN_WORKSPACE_VERSION',
      message: `Workspace manager version is 'unknown' - toolchain detection may have failed`,
      details: { workspace: snapshot.runtime.workspace },
    });
  }

  if (snapshot.runtime?.buildSystem?.version === 'unknown') {
    warnings.push({
      validator: 'V2-reference-integrity',
      code: 'UNKNOWN_BUILD_SYSTEM_VERSION',
      message: `Build system version is 'unknown' - toolchain detection may have failed`,
      details: { buildSystem: snapshot.runtime.buildSystem },
    });
  }

  return { errors, warnings };
}
