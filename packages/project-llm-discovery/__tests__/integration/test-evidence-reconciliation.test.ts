/**
 * M2 Phase 4: Evidence Reconciliation
 * 
 * Analyzes the complete evidence graph from M2.2-M2.6 to verify:
 * - Evidence ID uniqueness
 * - Evidence lifecycle consistency
 * - Evidence binding completeness
 * - Orphaned evidence detection
 */

import { describe, it, expect } from 'vitest';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { scanRepositoryStructure } from '../../src/scanners/d1-structure-scanner.js';
import { scanRuntime } from '../../src/scanners/d2-runtime-scanner.js';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';
import { scanComposer } from '../../src/scanners/d4-composer-scanner.js';
import { scanDependencies } from '../../src/scanners/d5-dependencies-scanner.js';
import type { RepositorySnapshot } from '../../src/contracts/snapshot.js';
import type { Evidence } from '../../src/contracts/evidence.js';
import { validateEvidenceCompleteness } from '../../src/validation/v8-evidence-completeness-validator.js';
import { validateEvidencePaths } from '../../src/validation/v3-evidence-paths-validator.js';

describe('M2 Phase 4: Evidence Reconciliation', () => {
  it('should verify evidence ID uniqueness, lifecycle, and binding completeness', { timeout: 60000 }, async () => {
    // Use the workspace root, not the package directory
    const packagePath = process.cwd().replace(/\\/g, '/');
    const workspaceRoot = packagePath.includes('/packages/project-llm-discovery')
      ? packagePath.replace('/packages/project-llm-discovery', '')
      : packagePath;
    
    const adapter = new FilesystemRepositoryAdapter(workspaceRoot);

    console.log('\n=== M2.4 EVIDENCE RECONCILIATION ===\n');
    console.log(`Workspace: ${workspaceRoot}\n`);

    // Run all scanners to build complete snapshot
    console.log('Running scanners...');
    const d1Result = await scanRepositoryStructure(adapter);
    const d2Result = await scanRuntime(adapter);
    const d3Result = await scanBlocks(adapter);
    const d4Result = await scanComposer(adapter);
    const d5Result = await scanDependencies(adapter, d1Result.data);

    // Combine all evidence with deduplication
    const evidenceMap = new Map<string, Evidence>();
    for (const evidence of [
      ...d1Result.evidence,
      ...d2Result.evidence,
      ...d3Result.evidence,
      ...d4Result.evidence,
      ...d5Result.evidence,
    ]) {
      // Keep first occurrence (earliest scanner wins)
      if (!evidenceMap.has(evidence.evidenceId)) {
        evidenceMap.set(evidence.evidenceId, evidence);
      }
    }
    const allEvidence = Array.from(evidenceMap.values());

    // Build snapshot
    const snapshot: RepositorySnapshot = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      repository: {
        path: workspaceRoot,
        name: 'quiz-platform',
      },
      structure: d1Result.data,
      runtime: d2Result.data,
      blocks: d3Result.data,
      composer: d4Result.data,
      dependencies: d5Result.data,
      evidence: allEvidence,
      findings: [
        ...d1Result.findings,
        ...d2Result.findings,
        ...d3Result.findings,
        ...d4Result.findings,
        ...d5Result.findings,
      ],
    };

    console.log(`✓ Scanners complete\n`);

    // === 1. EVIDENCE ID UNIQUENESS ===
    console.log('=== 1. EVIDENCE ID UNIQUENESS ===\n');
    
    const evidenceIds = new Map<string, Evidence[]>();
    for (const ev of allEvidence) {
      const existing = evidenceIds.get(ev.evidenceId) || [];
      existing.push(ev);
      evidenceIds.set(ev.evidenceId, existing);
    }

    const conflicts = Array.from(evidenceIds.entries())
      .filter(([_, evList]) => evList.length > 1);

    console.log(`Total evidence records: ${allEvidence.length}`);
    console.log(`Unique evidence IDs: ${evidenceIds.size}`);
    console.log(`ID conflicts: ${conflicts.length}\n`);

    if (conflicts.length > 0) {
      console.log('⚠️  CONFLICTS DETECTED:\n');
      for (const [id, evList] of conflicts) {
        console.log(`  Evidence ID: ${id}`);
        for (const ev of evList) {
          console.log(`    - ${ev.scannerName}: ${ev.path} (${ev.kind})`);
        }
        console.log();
      }
    } else {
      console.log('✓ No evidence ID conflicts\n');
    }

    // === 2. EVIDENCE LIFECYCLE CONSISTENCY ===
    console.log('=== 2. EVIDENCE LIFECYCLE CONSISTENCY ===\n');

    const lifecycleDistribution = new Map<string, number>();
    for (const ev of allEvidence) {
      lifecycleDistribution.set(
        ev.lifecycle,
        (lifecycleDistribution.get(ev.lifecycle) || 0) + 1
      );
    }

    console.log('Lifecycle distribution:');
    for (const [lifecycle, count] of Array.from(lifecycleDistribution.entries()).sort()) {
      console.log(`  ${lifecycle}: ${count}`);
    }
    console.log();

    const incorrectLifecycle = allEvidence.filter(ev => 
      ev.lifecycle !== 'current' && ev.lifecycle !== 'historical'
    );

    if (incorrectLifecycle.length > 0) {
      console.log(`⚠️  Found ${incorrectLifecycle.length} evidence records with invalid lifecycle:\n`);
      for (const ev of incorrectLifecycle) {
        console.log(`  - ${ev.evidenceId}: "${ev.lifecycle}" (${ev.scannerName})`);
      }
      console.log();
    } else {
      console.log('✓ All evidence has valid lifecycle\n');
    }

    // === 3. EVIDENCE BY PHASE ===
    console.log('=== 3. EVIDENCE BY PHASE ===\n');

    const scannerTotals = new Map<string, number>();
    for (const ev of allEvidence) {
      scannerTotals.set(
        ev.scannerName,
        (scannerTotals.get(ev.scannerName) || 0) + 1
      );
    }

    console.log('Evidence by scanner:');
    for (const [scanner, count] of Array.from(scannerTotals.entries()).sort()) {
      const phase = scanner.startsWith('D1') ? 'M2.2 baseline' :
                    scanner.startsWith('D2') ? 'M2.3 toolchain' :
                    scanner.startsWith('D3') ? 'M2.2 baseline + M2.6 UBRC' :
                    scanner.startsWith('D4') ? 'M2.4 composer' :
                    scanner.startsWith('D5') ? 'M2.5 dependencies' :
                    'other';
      console.log(`  ${scanner}: ${count} (${phase})`);
    }
    console.log();

    // === 4. BROKEN BINDINGS ===
    console.log('=== 4. BROKEN BINDINGS (V8 Validation) ===\n');

    const v8Result = await validateEvidenceCompleteness(snapshot);
    
    console.log(`V8 errors: ${v8Result.errors.length}`);
    console.log(`V8 warnings: ${v8Result.warnings.length}\n`);

    if (v8Result.errors.length > 0) {
      console.log('⚠️  BROKEN BINDINGS DETECTED:\n');
      for (const error of v8Result.errors.slice(0, 10)) {
        console.log(`  [${error.code}] ${error.message}`);
      }
      if (v8Result.errors.length > 10) {
        console.log(`  ... and ${v8Result.errors.length - 10} more\n`);
      }
    } else {
      console.log('✓ No broken bindings\n');
    }

    // === 5. ORPHANED EVIDENCE ===
    console.log('=== 5. ORPHANED EVIDENCE ===\n');

    // Collect all referenced evidence IDs from entities
    const referencedIds = new Set<string>();
    
    // D1: Structure
    snapshot.structure.applications.forEach(app => {
      if (app.evidenceId) referencedIds.add(app.evidenceId);
    });
    snapshot.structure.packages.forEach(pkg => {
      if (pkg.evidenceId) referencedIds.add(pkg.evidenceId);
    });
    snapshot.structure.services.forEach(svc => {
      if (svc.evidenceId) referencedIds.add(svc.evidenceId);
    });

    // D3: Blocks
    snapshot.blocks.implemented.forEach(block => {
      if (block.evidenceId) referencedIds.add(block.evidenceId);
    });
    snapshot.blocks.rendered.forEach(renderer => {
      if (renderer.evidenceId) referencedIds.add(renderer.evidenceId);
    });

    // D4: Composer
    snapshot.composer.services.forEach(svc => {
      if (svc.evidenceId) referencedIds.add(svc.evidenceId);
    });
    snapshot.composer.apis.forEach(api => {
      if (api.evidenceId) referencedIds.add(api.evidenceId);
    });
    snapshot.composer.schemas.forEach(schema => {
      if (schema.evidenceId) referencedIds.add(schema.evidenceId);
    });
    snapshot.composer.ui.forEach(ui => {
      if (ui.evidenceId) referencedIds.add(ui.evidenceId);
    });

    // D5: Dependencies
    snapshot.dependencies.nodes.forEach(node => {
      if (node.evidenceId) referencedIds.add(node.evidenceId);
    });
    snapshot.dependencies.edges.forEach(edge => {
      if (edge.evidenceId) referencedIds.add(edge.evidenceId);
    });

    const orphaned = allEvidence.filter(ev => !referencedIds.has(ev.evidenceId));

    console.log(`Referenced evidence IDs: ${referencedIds.size}`);
    console.log(`Orphaned evidence: ${orphaned.length}\n`);

    if (orphaned.length > 0) {
      console.log('Orphaned evidence (evidence not bound to any entity):\n');
      
      const orphanedByScanner = new Map<string, Evidence[]>();
      for (const ev of orphaned) {
        const list = orphanedByScanner.get(ev.scannerName) || [];
        list.push(ev);
        orphanedByScanner.set(ev.scannerName, list);
      }

      for (const [scanner, evList] of Array.from(orphanedByScanner.entries()).sort()) {
        console.log(`  ${scanner}: ${evList.length}`);
        for (const ev of evList.slice(0, 3)) {
          console.log(`    - ${ev.kind}: ${ev.path}`);
        }
        if (evList.length > 3) {
          console.log(`    ... and ${evList.length - 3} more`);
        }
        console.log();
      }
    } else {
      console.log('✓ No orphaned evidence\n');
    }

    // === 6. V3 EVIDENCE PATHS ===
    console.log('=== 6. EVIDENCE PATH VALIDATION (V3) ===\n');

    const v3Result = await validateEvidencePaths(snapshot, adapter);
    
    console.log(`V3 errors: ${v3Result.errors.length}`);
    console.log(`V3 warnings: ${v3Result.warnings.length}\n`);

    if (v3Result.errors.length > 0) {
      console.log('⚠️  V3 ERRORS (sample):\n');
      for (const error of v3Result.errors.slice(0, 5)) {
        console.log(`  [${error.code}] ${error.message}`);
      }
      if (v3Result.errors.length > 5) {
        console.log(`  ... and ${v3Result.errors.length - 5} more\n`);
      }
    }

    // === SUMMARY ===
    console.log('\n=== RECONCILIATION SUMMARY ===\n');
    console.log(`Total evidence: ${allEvidence.length}`);
    console.log(`Unique IDs: ${evidenceIds.size}`);
    console.log(`ID conflicts: ${conflicts.length}`);
    console.log(`Lifecycle current: ${lifecycleDistribution.get('current') || 0}`);
    console.log(`Lifecycle historical: ${lifecycleDistribution.get('historical') || 0}`);
    console.log(`Broken bindings (V8 errors): ${v8Result.errors.length}`);
    console.log(`Orphaned evidence: ${orphaned.length}`);
    console.log(`V3 errors: ${v3Result.errors.length}`);
    console.log(`V3 warnings: ${v3Result.warnings.length}\n`);

    // Test assertions
    expect(conflicts.length, 'Evidence ID uniqueness').toBe(0);
    expect(v8Result.errors.length, 'Broken bindings (V8)').toBe(0);
    expect(incorrectLifecycle.length, 'Invalid lifecycle values').toBe(0);
  });
});
