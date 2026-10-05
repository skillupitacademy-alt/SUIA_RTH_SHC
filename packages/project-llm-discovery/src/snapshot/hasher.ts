import { createHash } from 'node:crypto';
import type { RepositorySnapshot } from '../contracts/snapshot.js';

/**
 * Compute a deterministic SHA-256 hash of a repository snapshot
 * Excludes timestamp and canonicalHash fields for determinism
 * Includes evidenceId in hash (deterministic since phase 4)
 */
export function computeSnapshotHash(
  snapshot: Omit<RepositorySnapshot, 'canonicalHash'>
): string {
  // Create a deep copy and remove all timestamp fields for determinism
  const normalized = removeTimestamps(snapshot);

  // Serialize with stable key sorting
  const json = stableStringify(normalized);
  
  // Compute SHA-256 hash
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Recursively remove all timestamp fields from an object
 * evidenceId is now included in canonical hash (deterministic since phase 4)
 */
function removeTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeTimestamps(item));
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Exclude timestamp and findingId fields (contain timestamps/randomness)
      // evidenceId is now deterministic and included in hash
      if (key === 'timestamp' || key === 'scanTimestamp' || key === 'findingId') {
        continue;
      }
      result[key] = removeTimestamps(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Stringify JSON with stable key ordering (alphabetical)
 * Ensures deterministic serialization regardless of insertion order
 */
function stableStringify(obj: unknown): string {
  if (obj === null) {
    return 'null';
  }
  
  if (obj === undefined) {
    return ''; // Exclude undefined values
  }
  
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => stableStringify(item));
    return `[${items.join(',') }]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs: string[] = [];
    
    for (const key of keys) {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== undefined) {
        pairs.push(`${JSON.stringify(key)}:${stableStringify(value)}`);
      }
    }
    
    return `{${pairs.join(',')}}`;
  }
  
  return '';
}
