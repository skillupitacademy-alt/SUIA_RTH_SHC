import { z } from 'zod';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

const EvidenceSchema = z.object({
  evidenceId: z.string(),
  scannerName: z.string(),
  timestamp: z.string(),
  path: z.string(),
  kind: z.enum([
    'file',
    'directory',
    'package',
    'import',
    'export',
    'test',
    'ui-component',
    'api-route',
    'service',
    'schema',
    'documentation',
    'component',
    'config',
    'test-directory',
    'test-file',
    'type-definition',
  ]),
  claim: z.string(),
  locator: z.string(),
  contentHash: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const SnapshotSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  repository: z.object({
    owner: z.string(),
    name: z.string(),
    commitSha: z.string(),
    scanTimestamp: z.string(),
  }),
  structure: z.object({
    applications: z.array(z.any()),
    packages: z.array(z.any()),
    services: z.array(z.any()),
  }),
  runtime: z.object({
    frameworks: z.array(z.any()),
    workspace: z.any(),
    buildSystem: z.any(),
  }),
  blocks: z.object({
    documented: z.array(z.any()),
    implemented: z.array(z.any()),
    rendered: z.array(z.any()),
    verified: z.array(z.any()),
    discrepancies: z.array(z.any()),
  }),
  composer: z.object({
    services: z.array(z.any()),
    apis: z.array(z.any()),
    schemas: z.array(z.any()),
    ui: z.array(z.any()),
  }),
  dependencies: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
  tests: z.object({
    unit: z.array(z.any()),
    integration: z.array(z.any()),
    e2e: z.array(z.any()),
  }),
  evidence: z.array(EvidenceSchema),
  findings: z.array(z.any()),
  canonicalHash: z.string(),
});

export async function validateSchema(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    SnapshotSchema.parse(snapshot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.errors) {
        errors.push({
          validator: 'V1-schema',
          code: 'SCHEMA_VALIDATION_FAILED',
          message: `Schema validation failed: ${issue.message}`,
          path: issue.path.join('.'),
          details: { issue },
        });
      }
    } else {
      errors.push({
        validator: 'V1-schema',
        code: 'UNKNOWN_ERROR',
        message: 'Unknown schema validation error',
      });
    }
  }

  // Additional schema version check
  if (snapshot.schemaVersion !== '1.0.0') {
    errors.push({
      validator: 'V1-schema',
      code: 'INVALID_SCHEMA_VERSION',
      message: `Expected schema version 1.0.0, got ${snapshot.schemaVersion}`,
      details: { expected: '1.0.0', actual: snapshot.schemaVersion },
    });
  }

  return { errors, warnings };
}
