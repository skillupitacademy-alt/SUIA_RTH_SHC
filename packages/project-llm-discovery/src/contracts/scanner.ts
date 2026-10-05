import type { Evidence } from './evidence.js';

export interface Finding {
  findingId: string;
  severity: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  path?: string;
  recommendation?: string;
}

export interface ScannerResult<T = unknown> {
  scannerName: string;
  timestamp: string;
  evidence: Evidence[];
  findings: Finding[];
  data: T;
}
