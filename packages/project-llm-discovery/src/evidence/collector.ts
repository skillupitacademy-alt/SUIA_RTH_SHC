import type { Evidence } from '../contracts/evidence.js';
import { generateDeterministicEvidenceId } from '../utils/path-utils.js';

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
   * Create a complete evidence record with deterministic ID
   * 
   * @param scannerName - Name of the scanner creating the evidence
   * @param kind - Evidence kind (e.g., 'type-definition', 'component', 'directory')
   * @param path - File or directory path
   * @param contentHash - SHA-256 hash of file content (empty string for directories)
   * @param claim - Human-readable description of what this evidence proves
   * @param locator - Machine-readable locator (e.g., 'file:path', 'directory:path')
   * @param symbol - Optional disambiguator for multiple evidence at same path+kind
   * @param metadata - Optional additional metadata
   * @returns Complete evidence record with deterministic evidenceId
   */
  createEvidence(
    scannerName: string,
    kind: Evidence['kind'],
    path: string,
    contentHash: string,
    claim: string,
    locator: string,
    symbol?: string,
    metadata?: Record<string, unknown>
  ): Evidence {
    const evidenceId = generateDeterministicEvidenceId(kind, path, contentHash, symbol);
    const timestamp = new Date().toISOString();

    return {
      evidenceId,
      scannerName,
      timestamp,
      path,
      kind,
      claim,
      locator,
      contentHash,
      lifecycle: 'current', // M2.1: Default to current lifecycle
      ...(metadata && { metadata }),
    };
  }
}
