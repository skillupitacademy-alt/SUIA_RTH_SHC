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
  claim: string;
  locator: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
}
