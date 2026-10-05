import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { RepositorySnapshot } from '../contracts/snapshot.js';
import { EvidenceCollector } from '../evidence/collector.js';
import { normalizeEvidence } from '../evidence/normalizer.js';
import { computeSnapshotHash } from './hasher.js';
import {
  scanRepositoryStructure,
  scanRuntime,
  scanBlocks,
  scanComposer,
  scanDependencies,
  scanTests,
} from '../scanners/index.js';

/**
 * Build a complete repository snapshot by running all D1-D6 scanners
 * and computing a canonical hash for determinism
 */
export async function buildSnapshot(
  repositoryRoot: string,
  adapter: RepositoryAdapter
): Promise<RepositorySnapshot> {
  const collector = new EvidenceCollector();
  const allFindings = [];

  // D1: Scan repository structure
  const structureResult = await scanRepositoryStructure(adapter);
  collector.addAll(structureResult.evidence);
  allFindings.push(...structureResult.findings);

  // D2: Scan runtime architecture
  const runtimeResult = await scanRuntime(adapter);
  collector.addAll(runtimeResult.evidence);
  allFindings.push(...runtimeResult.findings);

  // D3: Scan block corpus
  const blocksResult = await scanBlocks(adapter);
  collector.addAll(blocksResult.evidence);
  allFindings.push(...blocksResult.findings);

  // D4: Scan composer
  const composerResult = await scanComposer(adapter);
  collector.addAll(composerResult.evidence);
  allFindings.push(...composerResult.findings);

  // D5: Scan dependencies
  const dependenciesResult = await scanDependencies(adapter, structureResult.data);
  collector.addAll(dependenciesResult.evidence);
  allFindings.push(...dependenciesResult.findings);

  // D6: Scan tests
  const testsResult = await scanTests(adapter);
  collector.addAll(testsResult.evidence);
  allFindings.push(...testsResult.findings);

  // Normalize evidence
  const normalizedEvidence = normalizeEvidence(collector.getAll());

  // Get repository metadata
  const commitSha = await adapter.getGitCommit();
  const gitRoot = await adapter.getGitRoot();
  const scanTimestamp = new Date().toISOString();

  // Extract owner and name from repository root
  // Assumes format like e:\onlinewebsites\quiz-platform or /path/to/repo
  const pathSegments = repositoryRoot.replace(/\\/g, '/').split('/');
  const repoName = pathSegments[pathSegments.length - 1] ?? 'unknown';
  const owner = pathSegments[pathSegments.length - 2] ?? 'unknown';

  // Construct snapshot without canonical hash
  const snapshotWithoutHash: Omit<RepositorySnapshot, 'canonicalHash'> = {
    schemaVersion: '1.0.0',
    repository: {
      owner,
      name: repoName,
      commitSha,
      scanTimestamp,
    },
    structure: structureResult.data,
    runtime: runtimeResult.data,
    blocks: blocksResult.data,
    composer: composerResult.data,
    dependencies: dependenciesResult.data,
    tests: testsResult.data,
    evidence: normalizedEvidence,
    findings: allFindings,
  };

  // Compute canonical hash (excludes timestamp for determinism)
  const canonicalHash = computeSnapshotHash(snapshotWithoutHash);

  // Return complete snapshot
  return {
    ...snapshotWithoutHash,
    canonicalHash,
  };
}
