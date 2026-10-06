import type { Evidence } from './evidence.js';
import type { Finding } from './scanner.js';

export interface ApplicationInfo {
  name: string;
  path: string;
  type: string;
  framework: string;
  entrypoint: string;
}

export interface PackageInfo {
  name: string;
  path: string;
  version: string;
  dependencies: string[];
  exports: string[];
}

export interface ServiceInfo {
  name: string;
  path: string;
  type: string;
  port?: number;
  entrypoint: string;
}

export interface FrameworkInfo {
  name: string;
  version: string;
  packages: string[];
}

export interface WorkspaceInfo {
  manager: string;
  version: string;
  packages: string[];
}

export interface BuildSystemInfo {
  tool: string;
  version: string;
  config: string;
}

export interface BlockFamilyDoc {
  family: string;
  versions: string[];
  documentationPath: string;
}

export interface BlockImplementation {
  type: string;
  version?: string;
  path: string;
  exported: boolean;
}

export interface BlockRenderer {
  blockType: string;
  componentPath: string;
  registeredInRenderer: boolean;
}

/**
 * Verification level progression for block implementations.
 * Each level requires all previous predicates to pass.
 * 
 * - DISCOVERED: Base state (block exists in some form)
 * - IMPLEMENTED: Type definition exists in content-blocks.ts
 * - RENDERED: React component file exists in packages/ui/src/tutorial/blocks/
 * - REGISTERED: Runtime dispatch case exists in TutorialBlockRenderer.tsx switch statement
 * - TESTED: Test coverage exists for the block
 * - VERIFIED: All predicates pass (documented + implemented + rendered + registered + tested)
 * 
 * Note: UBRC compliance (data-block-version attribute validation) is M2 scope.
 */
export type VerificationLevel =
  | "DISCOVERED"
  | "IMPLEMENTED"
  | "RENDERED"
  | "REGISTERED"
  | "TESTED"
  | "VERIFIED";

export interface BlockVerification {
  blockType: string;
  version?: string;
  /** Actually found in PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md */
  documented: boolean;
  implemented: boolean;
  rendered: boolean;
  /** Runtime dispatch case exists in TutorialBlockRenderer.tsx */
  registered: boolean;
  tested: boolean;
  /** Highest verification level achieved based on evidence */
  verificationLevel: VerificationLevel;
}

export interface BlockDiscrepancy {
  blockType: string;
  version?: string;
  issue: string;
  severity: 'warning' | 'error';
  recommendation: string;
}

export interface ComposerService {
  name: string;
  path: string;
  methods: string[];
}

export interface ComposerAPI {
  endpoint: string;
  method: string;
  handler: string;
}

export interface ComposerSchema {
  name: string;
  path: string;
  tables: string[];
}

export interface ComposerUI {
  component: string;
  path: string;
  blocksUsed: string[];
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: 'package' | 'app' | 'service';
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: 'dependency' | 'devDependency' | 'peerDependency';
}

export interface TestSuite {
  name: string;
  path: string;
  testCount: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface RepositorySnapshot {
  schemaVersion: '1.0.0' | '1.1.0';
  repository: {
    owner: string;
    name: string;
    commitSha: string;
    scanTimestamp: string;
  };
  structure: {
    applications: ApplicationInfo[];
    packages: PackageInfo[];
    services: ServiceInfo[];
  };
  runtime: {
    frameworks: FrameworkInfo[];
    workspace: WorkspaceInfo;
    buildSystem: BuildSystemInfo;
  };
  blocks: {
    documented: BlockFamilyDoc[];
    implemented: BlockImplementation[];
    rendered: BlockRenderer[];
    verified: BlockVerification[];
    discrepancies: BlockDiscrepancy[];
  };
  composer: {
    services: ComposerService[];
    apis: ComposerAPI[];
    schemas: ComposerSchema[];
    ui: ComposerUI[];
  };
  dependencies: {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
  };
  tests: {
    unit: TestSuite[];
    integration: TestSuite[];
    e2e: TestSuite[];
  };
  evidence: Evidence[];
  findings: Finding[];
  canonicalHash: string;
}
