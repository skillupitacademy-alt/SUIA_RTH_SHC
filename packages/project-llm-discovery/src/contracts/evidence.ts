/**
 * Evidence lifecycle classification
 * - 'current': Evidence reflecting present state at snapshot time (strict validation)
 * - 'historical': Evidence retained for audit/lineage (lenient validation)
 */
export type EvidenceLifecycle = 'current' | 'historical';

/**
 * Evidence record representing a discovered fact about the repository
 * 
 * Evidence provides forensic-grade traceability for all discovery claims.
 * Each evidence record is tied to a specific file/directory and scanner that discovered it.
 * 
 * ## Evidence ID (deterministic)
 * Format: `evidence-<first16hex>`
 * Generated as: SHA-256(kind + normalizedPath + symbol + contentHash).slice(0, 16)
 * 
 * Same inputs always produce the same evidenceId, enabling:
 * - Stable references across scans
 * - Differential analysis of evidence changes
 * - Inclusion in canonical hash integrity guarantee
 * 
 * ## Evidence Kinds
 * - `file`: Generic file discovered
 * - `directory`: Directory structure discovered
 * - `package`: package.json file (npm/pnpm package)
 * - `import`: Import statement or dependency reference
 * - `export`: Export statement or public API
 * - `test`: Test file or test suite
 * - `ui-component`: React/UI component file
 * - `api-route`: API endpoint or route handler
 * - `service`: Backend service class or module
 * - `schema`: Data schema or type definition file
 * - `documentation`: Documentation file (markdown, comments)
 * - `component`: Generic component (blocks, renderers)
 * - `config`: Configuration file (vitest, turbo, playwright)
 * - `test-directory`: Directory containing tests
 * - `test-file`: Individual test file
 * - `type-definition`: TypeScript type/interface definition
 * 
 * ## Critical vs Historical Evidence
 * - **Critical kinds** (missing = validation error):
 *   - `type-definition`: Source type definitions that define current state
 *   - `component`: Renderer registrations and implementations
 *   - `service`: Active service implementations
 * - **Historical kinds** (missing = validation warning):
 *   - All other kinds (discovery artifacts, directories, imports, docs)
 * 
 * ## Locator Format
 * Machine-readable reference to the evidence source:
 * - `file:<path>` — File path
 * - `directory:<path>` — Directory path
 * 
 * ## Content Hash
 * SHA-256 hash of file content
 * - For files: Hash of actual file content
 * - For directories: Empty string ''
 * - Used for mutation detection and differential analysis
 */
export interface Evidence {
  evidenceId: string;
  scannerName: string;
  timestamp: string;
  path: string;
  kind:
    | 'file'
    | 'directory'
    | 'package'
    | 'import'
    | 'export'
    | 'test'
    | 'ui-component'
    | 'api-route'
    | 'service'
    | 'schema'
    | 'documentation'
    | 'component'
    | 'config'
    | 'test-directory'
    | 'test-file'
    | 'type-definition';
  symbol?: string; // explicit identity component used in deterministic ID
  claim: string;
  locator: string;
  contentHash: string;
  lifecycle: EvidenceLifecycle;
  metadata?: Record<string, unknown>;
}
