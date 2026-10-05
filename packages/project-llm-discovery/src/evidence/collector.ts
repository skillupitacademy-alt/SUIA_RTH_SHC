import { createHash } from 'node:crypto';
import type { Evidence } from '../contracts/evidence.js';

export class EvidenceCollector {
  private evidence: Evidence[] = [];

  /**
   * Add a single evidence record to the collection
   */
  add(evidence: Evidence): void {
    this.evidence.push(evidence);
  }

  /**
   * Add multiple evidence records to the collection
   */
  addAll(evidence: Evidence[]): void {
    this.evidence.push(...evidence);
  }

  /**
   * Retrieve all collected evidence records
   */
  getAll(): Evidence[] {
    return [...this.evidence];
  }

  /**
   * Generate a deterministic evidence ID from scanner name, path, and timestamp
   */
  generateEvidenceId(scannerName: string, path: string, timestamp?: string): string {
    const ts = timestamp ?? new Date().toISOString();
    const input = `${scannerName}:${path}:${ts}`;
    return createHash('sha256').update(input).digest('hex');
  }
}
