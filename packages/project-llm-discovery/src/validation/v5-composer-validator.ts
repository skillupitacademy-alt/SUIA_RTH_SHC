import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateComposer(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const serviceCount = snapshot.composer.services.length;

  // V5: Assert exactly 1 composer service
  if (serviceCount === 0) {
    errors.push({
      validator: 'V5-composer',
      code: 'NO_COMPOSER_SERVICE',
      message: 'No composer service found. Expected exactly 1 composer service.',
      details: { serviceCount: 0 },
    });
  } else if (serviceCount > 1) {
    errors.push({
      validator: 'V5-composer',
      code: 'MULTIPLE_COMPOSER_SERVICES',
      message: `Multiple composer services detected. Expected exactly 1, found ${serviceCount}.`,
      details: {
        serviceCount,
        services: snapshot.composer.services.map((s) => ({ name: s.name, path: s.path })),
      },
    });
  }

  return { errors, warnings };
}
