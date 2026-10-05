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
