import type { RepositorySnapshot } from '../contracts/snapshot.js';
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

  return { errors, warnings };
}
