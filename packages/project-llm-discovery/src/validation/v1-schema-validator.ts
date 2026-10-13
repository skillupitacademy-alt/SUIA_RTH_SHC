import { z } from 'zod';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

// Define strict schemas for all snapshot entities

const ApplicationInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  framework: z.string(),
  entrypoint: z.string(),
  evidenceId: z.string().min(1),
});

const PackageInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  version: z.string(),
  dependencies: z.array(z.string()),
  exports: z.array(z.string()),
  evidenceId: z.string().min(1),
});

const ServiceInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  port: z.number().optional(),
  entrypoint: z.string(),
  evidenceId: z.string().min(1),
});

const FrameworkInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  packages: z.array(z.string()),
});

const WorkspaceInfoSchema = z.object({
  manager: z.string(),
  version: z.string(),
  packages: z.array(z.string()),
});

const BuildSystemInfoSchema = z.object({
  tool: z.string(),
  version: z.string(),
  config: z.string(),
});

const BlockFamilyDocSchema = z.object({
  family: z.string(),
  versions: z.array(z.string()),
  documentationPath: z.string(),
});

const BlockImplementationSchema = z.object({
  type: z.string(),
  version: z.string().optional(),
  path: z.string(),
  exported: z.boolean(),
  evidenceId: z.string().min(1),
});

const BlockRendererSchema = z.object({
  blockType: z.string(),
  componentPath: z.string(),
  registeredInRenderer: z.boolean(),
  evidenceId: z.string().min(1),
});

const BlockVerificationSchema = z.object({
  blockType: z.string(),
  version: z.string().optional(),
  documented: z.boolean(),
  implemented: z.boolean(),
  rendered: z.boolean(),
  tested: z.boolean(),
});

const BlockDiscrepancySchema = z.object({
  blockType: z.string(),
  version: z.string().optional(),
  issue: z.string(),
  severity: z.enum(['warning', 'error']),
  recommendation: z.string(),
});

const ComposerServiceSchema = z.object({
  name: z.string(),
  path: z.string(),
  methods: z.array(z.string()),
  evidenceId: z.string().min(1),
});

const ComposerAPISchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  handler: z.string(),
  evidenceId: z.string().min(1),
});

const ComposerSchemaObjSchema = z.object({
  name: z.string(),
  path: z.string(),
  tables: z.array(z.string()),
  evidenceId: z.string().min(1),
});

const ComposerUISchema = z.object({
  component: z.string(),
  path: z.string(),
  blocksUsed: z.array(z.string()),
  evidenceId: z.string().min(1),
});

const DependencyNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(['package', 'app', 'service']),
  evidenceId: z.string().min(1),
});

const DependencyEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['dependency', 'devDependency', 'peerDependency']),
  requestedVersion: z.string().optional(),
  resolvedVersion: z.string().optional(),
  evidenceId: z.string().min(1),
});

const TestSuiteSchema = z.object({
  name: z.string(),
  path: z.string(),
  testCount: z.number(),
  coverage: z.object({
    statements: z.number(),
    branches: z.number(),
    functions: z.number(),
    lines: z.number(),
  }).optional(),
});

const FindingSchema = z.object({
  findingId: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  category: z.string(),
  message: z.string(),
  recommendation: z.string().optional(),
});

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
    'dependency-declaration',
    'dependency-resolution',
    'ubrc-verification',
  ]),
  claim: z.string(),
  locator: z.string(),
  contentHash: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const SnapshotSchema = z.object({
  schemaVersion: z.literal('1.1.0'),
  repository: z.object({
    owner: z.string(),
    name: z.string(),
    commitSha: z.string(),
    scanTimestamp: z.string(),
  }),
  structure: z.object({
    applications: z.array(ApplicationInfoSchema),
    packages: z.array(PackageInfoSchema),
    services: z.array(ServiceInfoSchema),
  }),
  runtime: z.object({
    frameworks: z.array(FrameworkInfoSchema),
    workspace: WorkspaceInfoSchema,
    buildSystem: BuildSystemInfoSchema,
  }),
  blocks: z.object({
    documented: z.array(BlockFamilyDocSchema),
    implemented: z.array(BlockImplementationSchema),
    rendered: z.array(BlockRendererSchema),
    verified: z.array(BlockVerificationSchema),
    discrepancies: z.array(BlockDiscrepancySchema),
  }),
  composer: z.object({
    services: z.array(ComposerServiceSchema),
    apis: z.array(ComposerAPISchema),
    schemas: z.array(ComposerSchemaObjSchema),
    ui: z.array(ComposerUISchema),
  }),
  dependencies: z.object({
    nodes: z.array(DependencyNodeSchema),
    edges: z.array(DependencyEdgeSchema),
  }),
  tests: z.object({
    unit: z.array(TestSuiteSchema),
    integration: z.array(TestSuiteSchema),
    e2e: z.array(TestSuiteSchema),
  }),
  evidence: z.array(EvidenceSchema),
  findings: z.array(FindingSchema),
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
  if (snapshot.schemaVersion !== '1.1.0') {
    errors.push({
      validator: 'V1-schema',
      code: 'INVALID_SCHEMA_VERSION',
      message: `Expected schema version 1.1.0, got ${snapshot.schemaVersion}`,
      details: { expected: '1.1.0', actual: snapshot.schemaVersion },
    });
  }

  return { errors, warnings };
}
