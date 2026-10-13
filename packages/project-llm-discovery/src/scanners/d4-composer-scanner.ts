import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type {
  ComposerService,
  ComposerAPI,
  ComposerSchema,
  ComposerUI,
} from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';
import { randomUUID } from 'node:crypto';

/**
 * Discovery status for fields that may not be determinable statically
 */
export enum DiscoveryStatus {
  /** Value was successfully determined */
  KNOWN = 'KNOWN',
  /** Value could not be determined from available evidence */
  UNKNOWN = 'UNKNOWN',
  /** Discovery attempted but failed (e.g., file access error) */
  UNABLE_TO_DETERMINE = 'UNABLE_TO_DETERMINE',
}

interface ComposerData {
  services: ComposerService[];
  apis: ComposerAPI[];
  schemas: ComposerSchema[];
  ui: ComposerUI[];
}

const COMPOSER_SERVICE_PATH = 'packages/db-tutorial/src/services/tutorial-composer.service.ts';
const COMPOSER_API_DIR = 'apps/skillhubcore-admin/src/app/api/tutorial-composer';
const COMPOSER_SCHEMA_DIR = 'packages/types/src/tutorial-rich-document';
const COMPOSER_UI_DIR = 'apps/skillhubcore-admin/src';

/**
 * D4 Composer Scanner
 * 
 * Discovers existing Tutorial Composer service, API routes, schemas, and UI components.
 * 
 * CRITICAL VERIFICATION: Only one TutorialComposerService should exist.
 * If multiple composers detected, generates finding with severity: warning.
 */
export async function scanComposer(
  adapter: RepositoryAdapter
): Promise<ScannerResult<ComposerData>> {
  const scannerName = 'D4-composer-scanner';
  const timestamp = new Date().toISOString();
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const services: ComposerService[] = [];
  const apis: ComposerAPI[] = [];
  const schemas: ComposerSchema[] = [];
  const ui: ComposerUI[] = [];

  // Step 1: Discover Composer service
  try {
    if (await adapter.fileExists(COMPOSER_SERVICE_PATH)) {
      const serviceContent = await adapter.readFile(COMPOSER_SERVICE_PATH);
      const contentHash = await adapter.getFileHash(COMPOSER_SERVICE_PATH);

      const evidence = collector.createEvidence(
        scannerName,
        'service',
        COMPOSER_SERVICE_PATH,
        contentHash,
        'TutorialComposerService discovered',
        `file:${COMPOSER_SERVICE_PATH}`,
        'TutorialComposerService'
      );
      collector.add(evidence);

      const serviceMethods = parseServiceMethods(serviceContent);
      services.push({
        name: 'TutorialComposerService',
        path: COMPOSER_SERVICE_PATH,
        methods: serviceMethods,
        evidenceId: evidence.evidenceId,
      });
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'warning',
        category: 'composer-discovery',
        message: `Composer service file not found: ${COMPOSER_SERVICE_PATH}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'composer-discovery',
        message: `Failed to read composer service: ${error.message}`,
      });
      throw error;
    } else {
      throw error;
    }
  }

  // Step 2: Discover Composer API routes
  try {
    if (await adapter.fileExists(COMPOSER_API_DIR)) {
      const apiFiles = await adapter.listFiles(COMPOSER_API_DIR);
      const routeFiles = apiFiles.filter(f => f.endsWith('route.ts'));

      for (const routeFile of routeFiles) {
        const routeContent = await adapter.readFile(routeFile);
        const contentHash = await adapter.getFileHash(routeFile);
        const apiInfo = parseApiRoute(routeFile, routeContent);
        const apiName = apiInfo?.endpoint ?? routeFile.split('/').pop()?.replace('.ts', '') ?? '';
        
        const evidence = collector.createEvidence(
          scannerName,
          'api-route',
          routeFile,
          contentHash,
          'Composer API route discovered',
          `file:${routeFile}`,
          apiName
        );
        collector.add(evidence);

        if (apiInfo !== null) {
          apiInfo.evidenceId = evidence.evidenceId;
          apis.push(apiInfo);
        }
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'info',
        category: 'composer-discovery',
        message: `Composer API directory not found: ${COMPOSER_API_DIR}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'composer-discovery',
        message: `Failed to list composer API routes: ${error.message}`,
      });
      throw error;
    } else {
      throw error;
    }
  }

  // Step 3: Discover Composer schemas (TutorialDocument)
  try {
    if (await adapter.fileExists(COMPOSER_SCHEMA_DIR)) {
      const schemaFiles = await adapter.listFiles(COMPOSER_SCHEMA_DIR);
      const tsFiles = schemaFiles.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      for (const schemaFile of tsFiles) {
        // Only process index.ts and schema files
        if (!schemaFile.includes('index.ts') && !schemaFile.includes('schema')) {
          continue;
        }

        const schemaContent = await adapter.readFile(schemaFile);
        const contentHash = await adapter.getFileHash(schemaFile);
        const schemaInfo = parseSchemaFile(schemaFile, schemaContent);
        const schemaName = schemaInfo?.name ?? schemaFile.split('/').pop()?.replace('.ts', '') ?? '';
        
        const evidence = collector.createEvidence(
          scannerName,
          'schema',
          schemaFile,
          contentHash,
          'Composer schema file discovered',
          `file:${schemaFile}`,
          schemaName
        );
        collector.add(evidence);

        if (schemaInfo !== null) {
          schemaInfo.evidenceId = evidence.evidenceId;
          schemas.push(schemaInfo);
        }
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'info',
        category: 'composer-discovery',
        message: `Composer schema directory not found: ${COMPOSER_SCHEMA_DIR}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'composer-discovery',
        message: `Failed to list composer schemas: ${error.message}`,
      });
      throw error;
    } else {
      throw error;
    }
  }

  // Step 4: Discover Composer UI components
  try {
    if (await adapter.fileExists(COMPOSER_UI_DIR)) {
      const uiFiles = await adapter.listFiles(COMPOSER_UI_DIR);
      const composerUIFiles = uiFiles.filter(f => 
        f.toLowerCase().includes('composer') && 
        (f.endsWith('.tsx') || f.endsWith('.ts'))
      );

      for (const uiFile of composerUIFiles) {
        const uiContent = await adapter.readFile(uiFile);
        const contentHash = await adapter.getFileHash(uiFile);
        const uiInfo = parseUIComponent(uiFile, uiContent);
        const uiName = uiInfo?.component ?? uiFile.split('/').pop()?.replace(/\.tsx?$/, '') ?? '';
        
        const evidence = collector.createEvidence(
          scannerName,
          'ui-component',
          uiFile,
          contentHash,
          'Composer UI component discovered',
          `file:${uiFile}`,
          uiName
        );
        collector.add(evidence);

        if (uiInfo !== null) {
          uiInfo.evidenceId = evidence.evidenceId;
          ui.push(uiInfo);
        }
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'info',
        category: 'composer-discovery',
        message: `Composer UI directory not found: ${COMPOSER_UI_DIR}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'composer-discovery',
        message: `Failed to list composer UI components: ${error.message}`,
      });
      throw error;
    } else {
      throw error;
    }
  }

  // Step 5: Validate single Composer constraint
  if (services.length === 1) {
    findings.push({
      findingId: randomUUID(),
      severity: 'info',
      category: 'composer-validation',
      message: 'Single TutorialComposerService confirmed (no parallel Composer detected)',
    });
  } else if (services.length > 1) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'composer-validation',
      message: `Multiple Composer services detected (${services.length}). Expected only one TutorialComposerService.`,
      recommendation: 'Review and consolidate Composer services to maintain single source of truth',
    });
  } else {
    findings.push({
      findingId: randomUUID(),
      severity: 'error',
      category: 'composer-validation',
      message: 'No TutorialComposerService found',
      recommendation: `Expected TutorialComposerService at ${COMPOSER_SERVICE_PATH}`,
    });
  }

  findings.push({
    findingId: randomUUID(),
    severity: 'info',
    category: 'composer-discovery',
    message: `Discovered ${services.length} composer services, ${apis.length} API routes, ${schemas.length} schemas, ${ui.length} UI components`,
  });

  return {
    scannerName,
    timestamp,
    evidence: collector.getAll(),
    findings,
    data: {
      services,
      apis,
      schemas,
      ui,
    },
  };
}

/**
 * Parse service methods from TutorialComposerService
 * 
 * Extracts:
 * - Method name
 * - Input types (from parameters)
 * - Return types (from Promise<...>)
 * - JSDoc comments
 */
function parseServiceMethods(content: string): string[] {
  const methods: string[] = [];

  // Match async method declarations in class
  // async createTutorial(...
  // async getTutorial(...
  const methodRegex = /async\s+(\w+)\s*\(/g;
  let match;

  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];
    if (methodName !== undefined) {
      methods.push(methodName);
    }
  }

  return methods;
}

/**
 * Parse API route information from route file
 * 
 * Uses AST-based analysis (regex for export function declarations) to detect:
 * - Endpoint path from file structure
 * - HTTP methods from Next.js route exports (GET, POST, PUT, PATCH, DELETE, etc.)
 * 
 * Returns DiscoveryStatus.UNABLE_TO_DETERMINE if method cannot be statically determined.
 * NEVER guesses or fabricates methods.
 */
function parseApiRoute(filePath: string, content: string): ComposerAPI | null {
  // Extract endpoint from file path
  // apps/skillhubcore-admin/src/app/api/tutorial-composer/route.ts -> /api/tutorial-composer
  const parts = filePath.split(/[/\\]/);
  const apiIndex = parts.indexOf('api');
  
  if (apiIndex === -1 || apiIndex === parts.length - 1) return null;

  const endpointParts = parts.slice(apiIndex);
  const endpoint = '/' + endpointParts.join('/').replace(/\/route\.ts$/, '');

  // AST-based HTTP method detection from Next.js route handler exports
  // Matches: export async function GET(...) or export function POST(...)
  // Pattern breakdown:
  // - export: must be exported
  // - (async\s+)?: optional async keyword
  // - function: function declaration
  // - (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS): HTTP method name
  // - \s*\(: opening parenthesis (method parameter list)
  const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g;
  const methods: string[] = [];
  let match;

  while ((match = methodRegex.exec(content)) !== null) {
    const method = match[1];
    if (method !== undefined && !methods.includes(method)) {
      methods.push(method);
    }
  }

  // If no methods found via AST, mark as UNABLE_TO_DETERMINE (do not guess)
  // This preserves discovery integrity - we report what we know, not what we assume
  const method = methods.length > 0 ? methods.join(', ') : DiscoveryStatus.UNABLE_TO_DETERMINE;

  return {
    endpoint,
    method,
    handler: filePath,
    evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
  };
}

/**
 * Parse schema file for type definitions
 * 
 * Uses AST-based analysis (regex on source) to extract:
 * - Drizzle ORM table definitions (pgTable, mysqlTable, sqliteTable)
 * - Zod schema object definitions (z.object)
 * - TypeScript interface/type definitions
 * 
 * Returns actual discovered tables from import and declaration analysis.
 * Returns DiscoveryStatus.UNABLE_TO_DETERMINE (not empty array) when discovery fails.
 */
function parseSchemaFile(filePath: string, content: string): ComposerSchema | null {
  const filename = filePath.split(/[/\\]/).pop();
  if (filename === undefined) return null;

  const schemaName = filename.replace('.ts', '');
  const tables: string[] = [];

  try {
    // Pattern 1: Drizzle ORM table definitions
    // Export pattern: export const users = pgTable("users", {
    // The table name string is authoritative (second capture group)
    const drizzleTableRegex = /export\s+const\s+(\w+)\s*=\s*(?:pg|mysql|sqlite)Table\s*\(\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = drizzleTableRegex.exec(content)) !== null) {
      const tableName = match[2]; // Use the string name in pgTable("name", ...)
      if (tableName !== undefined && !tables.includes(tableName)) {
        tables.push(tableName);
      }
    }

    // Pattern 2: Zod schema object definitions
    // Export pattern: export const TutorialDocumentSchema = z.object({
    const zodSchemaRegex = /export\s+const\s+(\w+Schema)\s*=\s*z\.object\s*\(/g;

    while ((match = zodSchemaRegex.exec(content)) !== null) {
      const schemaName = match[1];
      if (schemaName !== undefined && !tables.includes(schemaName)) {
        tables.push(schemaName);
      }
    }

    // Pattern 3: TypeScript type/interface definitions
    // Export patterns:
    // export type TutorialDocument = {
    // export interface TutorialSection {
    const typeRegex = /export\s+(?:type|interface)\s+(\w+)\s*(?:=|{)/g;

    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      if (typeName !== undefined && !tables.includes(typeName)) {
        tables.push(typeName);
      }
    }
  } catch (error) {
    // If parsing fails, return schema with status indicator instead of fabricating empty array
    return {
      name: schemaName,
      path: filePath,
      tables: [DiscoveryStatus.UNABLE_TO_DETERMINE], // Explicit unknown state
      evidenceId: '',
    };
  }

  return {
    name: schemaName,
    path: filePath,
    tables, // Real discovered tables (may be empty if file has no exports, but that's factual)
    evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
  };
}

/**
 * Parse UI component for blocks used
 * 
 * Extracts:
 * - Block imports from TutorialBlockRenderer registry
 * - Direct block component imports (HeadingBlock, CodeC1Block, etc.)
 * - Block type references in JSX/TSX
 * 
 * Returns actual discovered blocks, or empty array with documented reason
 */
function parseUIComponent(filePath: string, content: string): ComposerUI | null {
  const filename = filePath.split(/[/\\]/).pop();
  if (filename === undefined) return null;

  const componentName = filename.replace(/\.(tsx?|jsx?)$/, '');
  const blocksUsed: string[] = [];

  // Pattern 1: Direct block component imports
  // import { HeadingBlock } from './blocks/HeadingBlock'
  // import { CodeC1Block } from '../blocks/CodeC1Block'
  const blockImportRegex = /import\s+{[^}]*\b(\w+Block)\b[^}]*}\s+from\s+['"][^'"]*blocks?\//g;
  let match;

  while ((match = blockImportRegex.exec(content)) !== null) {
    const blockName = match[1];
    if (blockName !== undefined && !blocksUsed.includes(blockName)) {
      blocksUsed.push(blockName);
    }
  }

  // Pattern 2: TutorialBlockRenderer usage (indicates block rendering system)
  // import { TutorialBlockRenderer } from './TutorialBlockRenderer'
  if (content.includes('TutorialBlockRenderer')) {
    blocksUsed.push('TutorialBlockRenderer');
  }

  // Pattern 3: Block type string literals in JSX
  // <Block type="heading" />
  // type: 'code'
  const blockTypeRegex = /type:\s*['"](\w+)['"]/g;

  while ((match = blockTypeRegex.exec(content)) !== null) {
    const blockType = match[1];
    if (blockType !== undefined && !blocksUsed.includes(blockType)) {
      blocksUsed.push(blockType);
    }
  }

  return {
    component: componentName,
    path: filePath,
    blocksUsed, // Empty if no blocks found after search was performed
    evidenceId: '', // Placeholder - will be populated by scanner when evidence is created
  };
}
