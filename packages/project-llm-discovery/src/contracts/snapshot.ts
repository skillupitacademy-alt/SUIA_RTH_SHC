import type { Evidence } from './evidence.js';
import type { Finding } from './scanner.js';

export interface ApplicationInfo {
  name: string;
  path: string;
  type: string;
  framework: string;
  entrypoint: string;
  evidenceId: string;
}

export interface PackageInfo {
  name: string;
  path: string;
  version: string;
  dependencies: string[];
  exports: string[];
  evidenceId: string;
}

export interface ServiceInfo {
  name: string;
  path: string;
  type: string;
  port?: number;
  entrypoint: string;
  evidenceId: string;
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
  evidenceId: string;
}

export interface BlockRenderer {
  blockType: string;
  componentPath: string;
  registeredInRenderer: boolean;
  evidenceId: string;
  ubrcStatus?: UBRCStatus;
  ubrcDetails?: {
    hasDataBlockVersion: boolean;
    registryEntry?: boolean;
    versionMatch?: boolean;
  };
}

/**
 * UBRC (Universal Block Registry Contract) Compliance Status
 * 
 * A block is UBRC-compliant when it has a complete verification chain:
 * - Block type exists in BLOCK_REGISTRY
 * - Renderer implementation exists
 * - Renderer includes data-block-version attribute
 * - Version matches across implementation and registry
 */
export type UBRCStatus =
  | 'UBRC_VALID'              // Complete chain present
  | 'UBRC_MISSING'            // Block exists but no registry entry
  | 'UBRC_VERSION_MISMATCH'   // Registry version ≠ implementation version
  | 'UBRC_TYPE_MISMATCH'      // Registry type ≠ expected type
  | 'UBRC_REGISTRY_MISSING'   // No registry file found
  | 'UBRC_RENDERER_MISSING'   // No renderer implementation
  | 'UBRC_ATTRIBUTE_MISSING'; // No data-block-version attribute in renderer

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
  /** UBRC (Universal Block Registry Contract) compliance status */
  ubrcStatus?: UBRCStatus;
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
  evidenceId: string;
}

export interface ComposerAPI {
  endpoint: string;
  method: string;
  handler: string;
  evidenceId: string;
}

export interface ComposerSchema {
  name: string;
  path: string;
  tables: string[];
  evidenceId: string;
}

export interface ComposerUI {
  component: string;
  path: string;
  blocksUsed: string[];
  evidenceId: string;
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: 'package' | 'app' | 'service';
  evidenceId: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: 'dependency' | 'devDependency' | 'peerDependency';
  requestedVersion?: string;
  resolvedVersion?: string;
  evidenceId: string;
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

export interface BrandFacts {
  hardCodedColors: Array<{
    path: string;
    lineNumber: number;
    colorValue: string;
    context: string;
    evidenceId: string;
  }>;
  logoReferences: Array<{
    path: string;
    assetPath: string;
    type: 'logo' | 'icon' | 'image';
    evidenceId: string;
  }>;
  brandUrls: Array<{
    path: string;
    url: string;
    domain: string;
    evidenceId: string;
  }>;
  brandFonts: Array<{
    path: string;
    fontFamily: string;
    evidenceId: string;
  }>;
  tenantIds: Array<{
    path: string;
    tenantId: string;
    evidenceId: string;
  }>;
  brandCopy: Array<{
    path: string;
    text: string;
    category: 'brand-name' | 'slogan' | 'tagline';
    evidenceId: string;
  }>;
}

export interface ThemeFacts {
  themeConfigs: Array<{
    path: string;
    configType: 'tailwind' | 'css-modules' | 'styled-components' | 'theme-file';
    evidenceId: string;
  }>;
  hardCodedValues: Array<{
    path: string;
    lineNumber: number;
    property: string;
    value: string;
    context: string;
    evidenceId: string;
  }>;
  cssVariables: Array<{
    path: string;
    variableName: string;
    value: string;
    scope: 'root' | 'scoped';
    evidenceId: string;
  }>;
  themeTokens: Array<{
    path: string;
    tokenName: string;
    tokenValue: string;
    category: 'color' | 'spacing' | 'typography' | 'shadow' | 'other';
    evidenceId: string;
  }>;
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
  brand?: BrandFacts;
  theme?: ThemeFacts;
  evidence: Evidence[];
  findings: Finding[];
  canonicalHash: string;
}
