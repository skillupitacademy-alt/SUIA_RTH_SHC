import type { RepositorySnapshot, UBRCStatus } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateBlockConsistency(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // V4.1: Assert all 4 state arrays are present (not collapsed)
  if (!Array.isArray(snapshot.blocks.documented)) {
    errors.push({
      validator: 'V4-block-consistency',
      code: 'MISSING_DOCUMENTED_STATE',
      message: 'blocks.documented array is missing or invalid',
    });
  }

  if (!Array.isArray(snapshot.blocks.implemented)) {
    errors.push({
      validator: 'V4-block-consistency',
      code: 'MISSING_IMPLEMENTED_STATE',
      message: 'blocks.implemented array is missing or invalid',
    });
  }

  if (!Array.isArray(snapshot.blocks.rendered)) {
    errors.push({
      validator: 'V4-block-consistency',
      code: 'MISSING_RENDERED_STATE',
      message: 'blocks.rendered array is missing or invalid',
    });
  }

  if (!Array.isArray(snapshot.blocks.verified)) {
    errors.push({
      validator: 'V4-block-consistency',
      code: 'MISSING_VERIFIED_STATE',
      message: 'blocks.verified array is missing or invalid',
    });
  }

  // V4.2: Assert verified ⊆ (implemented ∩ rendered)
  // Build sets for intersection check
  const implementedTypes = new Set(
    Array.isArray(snapshot.blocks.implemented)
      ? snapshot.blocks.implemented.map((impl) => impl.type)
      : []
  );
  const renderedTypes = new Set(
    Array.isArray(snapshot.blocks.rendered)
      ? snapshot.blocks.rendered.map((renderer) => renderer.blockType)
      : []
  );

  if (!Array.isArray(snapshot.blocks.verified)) {
    return { errors, warnings };
  }

  for (const verified of snapshot.blocks.verified) {
    const inImplemented = implementedTypes.has(verified.blockType);
    const inRendered = renderedTypes.has(verified.blockType);

    if (!inImplemented || !inRendered) {
      errors.push({
        validator: 'V4-block-consistency',
        code: 'VERIFIED_SUBSET_VIOLATION',
        message: `Block ${verified.blockType} is verified but not in both implemented and rendered`,
        details: {
          blockType: verified.blockType,
          inImplemented,
          inRendered,
        },
      });
    }
  }

  // V4.3: UBRC compliance validation (M2.6)
  const ubrcStats = {
    valid: 0,
    missing: 0,
    rendererMissing: 0,
    attributeMissing: 0,
    versionMismatch: 0,
    typeMismatch: 0,
    registryMissing: 0,
  };

  for (const verified of snapshot.blocks.verified) {
    const ubrcStatus = verified.ubrcStatus;
    
    if (ubrcStatus === undefined) {
      continue; // No UBRC data - skip
    }
    
    switch (ubrcStatus) {
      case 'UBRC_VALID':
        ubrcStats.valid++;
        break;
      case 'UBRC_MISSING':
        ubrcStats.missing++;
        errors.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_MISSING',
          message: `Block '${verified.blockType}' has no registry entry`,
          details: { blockType: verified.blockType },
        });
        break;
      case 'UBRC_RENDERER_MISSING':
        ubrcStats.rendererMissing++;
        errors.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_RENDERER_MISSING',
          message: `Block '${verified.blockType}' has no renderer implementation`,
          details: { blockType: verified.blockType },
        });
        break;
      case 'UBRC_ATTRIBUTE_MISSING':
        ubrcStats.attributeMissing++;
        warnings.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_ATTRIBUTE_MISSING',
          message: `Block '${verified.blockType}' renderer missing data-block-version attribute`,
          details: { blockType: verified.blockType, version: verified.version },
        });
        break;
      case 'UBRC_VERSION_MISMATCH':
        ubrcStats.versionMismatch++;
        warnings.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_VERSION_MISMATCH',
          message: `Block '${verified.blockType}' has version mismatch between implementation and renderer`,
          details: { blockType: verified.blockType, version: verified.version },
        });
        break;
      case 'UBRC_TYPE_MISMATCH':
        ubrcStats.typeMismatch++;
        warnings.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_TYPE_MISMATCH',
          message: `Block '${verified.blockType}' has type mismatch`,
          details: { blockType: verified.blockType },
        });
        break;
      case 'UBRC_REGISTRY_MISSING':
        ubrcStats.registryMissing++;
        errors.push({
          validator: 'V4-block-consistency',
          code: 'UBRC_REGISTRY_MISSING',
          message: 'Block registry file not found',
        });
        break;
    }
  }

  // Add summary finding if there are UBRC issues
  const totalIssues = ubrcStats.missing + ubrcStats.rendererMissing + 
                      ubrcStats.attributeMissing + ubrcStats.versionMismatch + 
                      ubrcStats.typeMismatch + ubrcStats.registryMissing;
  
  if (totalIssues > 0) {
    warnings.push({
      validator: 'V4-block-consistency',
      code: 'UBRC_SUMMARY',
      message: `UBRC compliance: ${ubrcStats.valid} valid, ${totalIssues} issues (${ubrcStats.missing} missing registry, ${ubrcStats.rendererMissing} missing renderer, ${ubrcStats.attributeMissing} missing attribute, ${ubrcStats.versionMismatch} version mismatch)`,
    });
  }

  return { errors, warnings };
}
