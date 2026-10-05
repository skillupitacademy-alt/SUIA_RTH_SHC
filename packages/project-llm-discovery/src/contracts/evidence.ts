export interface Evidence {
  evidenceId: string;
  scannerName: string;
  timestamp: string;
  path: string;
  kind: 'file' | 'directory' | 'package' | 'import' | 'export' | 'test';
  claim: string;
  locator: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
}
