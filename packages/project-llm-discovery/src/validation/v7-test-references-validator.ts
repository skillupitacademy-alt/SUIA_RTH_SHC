import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateTestReferences(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check all test suite paths
  const allTestSuites = [
    ...snapshot.tests.unit,
    ...snapshot.tests.integration,
    ...snapshot.tests.e2e,
  ];

  for (const testSuite of allTestSuites) {
    const exists = await adapter.fileExists(testSuite.path);

    if (!exists) {
      warnings.push({
        validator: 'V7-test-references',
        code: 'TEST_FILE_NOT_FOUND',
        message: `Test suite file not found: ${testSuite.path}`,
        path: testSuite.path,
        details: {
          name: testSuite.name,
          testCount: testSuite.testCount,
        },
      });
    }
  }

  return { errors, warnings };
}
