export type {
  RepositoryAdapter,
  Evidence,
  Finding,
  ScannerResult,
  ApplicationInfo,
  PackageInfo,
  ServiceInfo,
  FrameworkInfo,
  WorkspaceInfo,
  BuildSystemInfo,
  BlockFamilyDoc,
  BlockImplementation,
  BlockRenderer,
  BlockVerification,
  BlockDiscrepancy,
  ComposerService,
  ComposerAPI,
  ComposerSchema,
  ComposerUI,
  DependencyNode,
  DependencyEdge,
  TestSuite,
  RepositorySnapshot,
} from './contracts/index.js';

export { FilesystemRepositoryAdapter } from './adapters/index.js';
export {
  scanRepositoryStructure,
  scanRuntime,
  scanBlocks,
  scanComposer,
  scanDependencies,
  scanTests,
} from './scanners/index.js';
export { buildSnapshot, computeSnapshotHash } from './snapshot/index.js';
export { EvidenceCollector, normalizeEvidence } from './evidence/index.js';
export {
  validateSnapshot,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './validation/index.js';
export {
  reconcileWithLegacyFixture,
  type ReconciliationResult,
} from './validation/fixture-reconciliation.js';
