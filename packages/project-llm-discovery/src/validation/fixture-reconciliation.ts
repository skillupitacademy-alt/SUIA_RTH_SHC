import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';

export interface ReconciliationResult {
  claim: string;
  status: 'MATCH' | 'DISCREPANCY' | 'UNKNOWN';
  legacyValue?: unknown;
  snapshotValue?: unknown;
  notes?: string;
}

/**
 * Reconcile the new snapshot with the legacy fixture
 * (projectLlmRepositoryIntelligence.ts)
 * 
 * This comparison is informational only. The new snapshot is the source of truth.
 */
export async function reconcileWithLegacyFixture(
  snapshot: RepositorySnapshot,
  adapter: RepositoryAdapter
): Promise<ReconciliationResult[]> {
  const results: ReconciliationResult[] = [];

  try {
    // Read the legacy fixture file
    const fixturePath = 'apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts';
    const fixtureContent = await adapter.readFile(fixturePath);

    if (fixtureContent === '') {
      results.push({
        claim: 'Legacy fixture file read',
        status: 'UNKNOWN',
        notes: 'Could not read legacy fixture file',
      });
      return results;
    }

    // Extract VERIFIED_IMPLEMENTATIONS (I1, C1, D1)
    const verifiedMatch = fixtureContent.match(/const VERIFIED_IMPLEMENTATIONS[^=]*=\s*\[([^\]]+)\]/s);
    const legacyVerified = extractVersionIds(verifiedMatch !== null ? verifiedMatch[1] : '');

    // Extract INCOMPLETE_IMPLEMENTATIONS (S1)
    const incompleteMatch = fixtureContent.match(/const INCOMPLETE_IMPLEMENTATIONS[^=]*=\s*\[([^\]]+)\]/s);
    const legacyIncomplete = extractVersionIds(incompleteMatch !== null ? incompleteMatch[1] : '');

    // Extract PLANNED_FAMILY_IDS (14 families)
    const plannedMatch = fixtureContent.match(/const PLANNED_FAMILY_IDS\s*=\s*\[([^\]]+)\]/);
    const legacyPlanned = plannedMatch !== null 
      ? plannedMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter((s) => s !== '')
      : [];

    // Compare verified implementations
    const snapshotVerified = new Set(
      snapshot.blocks.verified.map((v) => v.blockType)
    );

    for (const versionId of legacyVerified) {
      const inSnapshot = snapshotVerified.has(versionId);
      results.push({
        claim: `Verified implementation: ${versionId}`,
        status: inSnapshot ? 'MATCH' : 'DISCREPANCY',
        legacyValue: 'RUNTIME_INTEGRATED',
        snapshotValue: inSnapshot ? 'verified' : 'not verified',
        notes: inSnapshot
          ? `${versionId} is verified in both legacy and snapshot`
          : `${versionId} was verified in legacy but not found in snapshot verified list`,
      });
    }

    // Compare incomplete implementations
    const snapshotImplemented = new Set(
      snapshot.blocks.implemented.map((i) => i.type)
    );

    for (const versionId of legacyIncomplete) {
      const inImplemented = snapshotImplemented.has(versionId);
      const inVerified = snapshotVerified.has(versionId);
      
      let status: 'MATCH' | 'DISCREPANCY' = 'MATCH';
      let notes = '';

      if (inVerified) {
        status = 'DISCREPANCY';
        notes = `${versionId} was incomplete in legacy but is now verified in snapshot`;
      } else if (inImplemented) {
        status = 'MATCH';
        notes = `${versionId} is implemented but not verified (matches legacy incomplete status)`;
      } else {
        status = 'DISCREPANCY';
        notes = `${versionId} was incomplete in legacy but not found in snapshot`;
      }

      results.push({
        claim: `Incomplete implementation: ${versionId}`,
        status,
        legacyValue: 'IMPLEMENTED',
        snapshotValue: inVerified ? 'verified' : (inImplemented ? 'implemented' : 'not found'),
        notes,
      });
    }

    // Compare planned families
    const snapshotDocumented = new Set(
      snapshot.blocks.documented.map((d) => d.family)
    );

    for (const familyId of legacyPlanned) {
      const inDocumented = snapshotDocumented.has(familyId);
      const inImplemented = Array.from(snapshotImplemented).some((type) => type.startsWith(familyId));

      let status: 'MATCH' | 'DISCREPANCY' = 'MATCH';
      let notes = '';

      if (inImplemented) {
        status = 'DISCREPANCY';
        notes = `${familyId} was planned in legacy but now has implementation in snapshot`;
      } else if (inDocumented) {
        status = 'MATCH';
        notes = `${familyId} is documented but not implemented (matches legacy planned status)`;
      } else {
        status = 'DISCREPANCY';
        notes = `${familyId} was planned in legacy but not found in snapshot documentation`;
      }

      results.push({
        claim: `Planned family: ${familyId}`,
        status,
        legacyValue: 'PLANNED',
        snapshotValue: inImplemented ? 'implemented' : (inDocumented ? 'documented' : 'not found'),
        notes,
      });
    }

    // Count summary
    const matchCount = results.filter((r) => r.status === 'MATCH').length;
    const discrepancyCount = results.filter((r) => r.status === 'DISCREPANCY').length;

    results.push({
      claim: 'Reconciliation summary',
      status: discrepancyCount === 0 ? 'MATCH' : 'DISCREPANCY',
      legacyValue: { verified: legacyVerified.length, incomplete: legacyIncomplete.length, planned: legacyPlanned.length },
      snapshotValue: { 
        verified: snapshot.blocks.verified.length, 
        implemented: snapshot.blocks.implemented.length, 
        documented: snapshot.blocks.documented.length,
      },
      notes: `${matchCount} matches, ${discrepancyCount} discrepancies. New snapshot is source of truth.`,
    });

  } catch (error) {
    results.push({
      claim: 'Fixture reconciliation',
      status: 'UNKNOWN',
      notes: `Failed to reconcile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

function extractVersionIds(arrayContent: string): string[] {
  const versionIds: string[] = [];
  const regex = /versionId:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = regex.exec(arrayContent)) !== null) {
    if (match[1] !== undefined) {
      versionIds.push(match[1]);
    }
  }

  return versionIds;
}
