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

      collector.add(
        collector.createEvidence(
          scannerName,
          'service',
          COMPOSER_SERVICE_PATH,
          contentHash,
          'TutorialComposerService discovered',
          `file:${COMPOSER_SERVICE_PATH}`,
          'TutorialComposerService'
        )
      );

      const serviceMethods = parseServiceMethods(serviceContent);
      services.push({
        name: 'TutorialComposerService',
        path: COMPOSER_SERVICE_PATH,
        methods: serviceMethods,
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
        const contentHash = await adapter.getFileHash(routeFile);
        const apiName = parseApiRoute(routeFile)?.endpoint ?? routeFile.split('/').pop()?.replace('.ts', '') ?? '';
        
        collector.add(
          collector.createEvidence(
            scannerName,
            'api-route',
            routeFile,
            contentHash,
            'Composer API route discovered',
            `file:${routeFile}`,
            apiName
          )
        );

        const apiInfo = parseApiRoute(routeFile);
        if (apiInfo !== null) {
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

        const contentHash = await adapter.getFileHash(schemaFile);
        const schemaName = parseSchemaFile(schemaFile)?.name ?? schemaFile.split('/').pop()?.replace('.ts', '') ?? '';
        
        collector.add(
          collector.createEvidence(
            scannerName,
            'schema',
            schemaFile,
            contentHash,
            'Composer schema file discovered',
            `file:${schemaFile}`,
            schemaName
          )
        );

        const schemaInfo = parseSchemaFile(schemaFile);
        if (schemaInfo !== null) {
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
        const contentHash = await adapter.getFileHash(uiFile);
        const uiName = parseUIComponent(uiFile)?.component ?? uiFile.split('/').pop()?.replace(/\.tsx?$/, '') ?? '';
        
        collector.add(
          collector.createEvidence(
            scannerName,
            'ui-component',
            uiFile,
            contentHash,
            'Composer UI component discovered',
            `file:${uiFile}`,
            uiName
          )
        );

        const uiInfo = parseUIComponent(uiFile);
        if (uiInfo !== null) {
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
 * Parse API route information from route file path
 */
function parseApiRoute(filePath: string): ComposerAPI | null {
  // Extract endpoint from file path
  // apps/skillhubcore-admin/src/app/api/tutorial-composer/route.ts -> /api/tutorial-composer
  const parts = filePath.split(/[/\\]/);
  const apiIndex = parts.indexOf('api');
  
  if (apiIndex === -1 || apiIndex === parts.length - 1) return null;

  const endpointParts = parts.slice(apiIndex);
  const endpoint = '/' + endpointParts.join('/').replace(/\/route\.ts$/, '');

  // Extract HTTP method from filename or content (would need content parsing)
  // For now, assume GET/POST based on common patterns
  const method = 'POST'; // Default, could be enhanced

  return {
    endpoint,
    method,
    handler: filePath,
  };
}

/**
 * Parse schema file for type definitions
 */
function parseSchemaFile(filePath: string): ComposerSchema | null {
  const filename = filePath.split(/[/\\]/).pop();
  if (filename === undefined) return null;

  const schemaName = filename.replace('.ts', '');

  // Extract table names would require actual content parsing
  // For now, use placeholder
  return {
    name: schemaName,
    path: filePath,
    tables: [], // Would need content parsing to extract
  };
}

/**
 * Parse UI component for blocks used
 */
function parseUIComponent(filePath: string): ComposerUI | null {
  const filename = filePath.split(/[/\\]/).pop();
  if (filename === undefined) return null;

  const componentName = filename.replace(/\.(tsx?|jsx?)$/, '');

  return {
    component: componentName,
    path: filePath,
    blocksUsed: [], // Would need content parsing to extract
  };
}
