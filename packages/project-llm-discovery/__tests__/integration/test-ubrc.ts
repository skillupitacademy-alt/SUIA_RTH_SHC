/**
 * UBRC verification test
 * Runs D3 scanner and reports UBRC compliance statistics
 */

import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';

async function main(): Promise<void> {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log('🔍 UBRC Verification Test\n');

  const blocksResult = await scanBlocks(adapter);

  console.log('📊 Block Discovery Statistics:');
  console.log(`   Documented families: ${blocksResult.data.documented.length}`);
  console.log(`   Implemented blocks: ${blocksResult.data.implemented.length}`);
  console.log(`   Rendered components: ${blocksResult.data.rendered.length}`);
  console.log(`   Verified blocks: ${blocksResult.data.verified.length}`);
  console.log(`   Discrepancies: ${blocksResult.data.discrepancies.length}\n`);

  // UBRC Status Distribution
  const ubrcStats: Record<string, number> = {
    UBRC_VALID: 0,
    UBRC_MISSING: 0,
    UBRC_VERSION_MISMATCH: 0,
    UBRC_TYPE_MISMATCH: 0,
    UBRC_REGISTRY_MISSING: 0,
    UBRC_RENDERER_MISSING: 0,
    UBRC_ATTRIBUTE_MISSING: 0,
    UNDEFINED: 0,
  };

  for (const verified of blocksResult.data.verified) {
    const status = verified.ubrcStatus ?? 'UNDEFINED';
    ubrcStats[status] = (ubrcStats[status] ?? 0) + 1;
  }

  console.log('📋 UBRC Compliance Status:');
  for (const [status, count] of Object.entries(ubrcStats)) {
    if (count > 0) {
      console.log(`   ${status}: ${count}`);
    }
  }
  console.log();

  // List blocks with non-VALID status
  console.log('⚠️  Non-VALID Blocks:');
  for (const verified of blocksResult.data.verified) {
    if (verified.ubrcStatus && verified.ubrcStatus !== 'UBRC_VALID') {
      console.log(`   - ${verified.blockType} (${verified.version ?? 'unversioned'}): ${verified.ubrcStatus}`);
    }
  }
  console.log();

  // Print UBRC-related findings
  console.log('🔎 UBRC Findings:');
  for (const finding of blocksResult.findings) {
    if (finding.category === 'ubrc-verification') {
      console.log(`   [${finding.severity}] ${finding.message}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
