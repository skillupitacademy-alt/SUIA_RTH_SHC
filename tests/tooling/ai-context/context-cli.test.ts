import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CLI_PATH = path.join(REPO_ROOT, 'tools/ai-context/context-cli.mjs');

function toPosixRel(absPath: string) {
  return path.relative(REPO_ROOT, absPath).replace(/\\/g, '/');
}

function runCli(args: string[], options: { allowFailure?: boolean } = {}) {
  try {
    const out = execFileSync('node', [CLI_PATH, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout: out, stderr: '' };
  } catch (err: any) {
    if (options.allowFailure) {
      return {
        status: err.status ?? 1,
        stdout: err.stdout ? String(err.stdout) : '',
        stderr: err.stderr ? String(err.stderr) : err.message,
      };
    }
    throw err;
  }
}

describe('VAL01–VAL12 Independent Tooling Validation Suite', () => {
  // VAL01: Fresh-session setup/version/command reproduction without hidden conversation history
  it('VAL01: executes all context-cli subcommands without hidden history and exits 0 on valid inputs', () => {
    const helpRes = runCli(['--help']);
    expect(helpRes.status).toBe(0);
    expect(helpRes.stdout).toContain('Usage: node tools/ai-context/context-cli.mjs <subcommand>');

    const provRes = runCli(['record-graph-provenance', '--packet', 'fnd03']);
    expect(provRes.status).toBe(0);
    expect(provRes.stdout).toContain('[record-graph-provenance] PASS');

    const sqlRes = runCli(['sql-coverage']);
    expect(sqlRes.status).toBe(0);
    expect(sqlRes.stdout).toContain('[sql-coverage] PASS');

    const invRes = runCli(['host-inventory']);
    expect(invRes.status).toBe(0);
    expect(invRes.stdout).toContain('[host-inventory] PASS');
  });

  // VAL02: Existing graph reuse, focused query/truncation and stale/missing graph source fallback
  it('VAL02: reuses graph.json, enforces exploration budget, and runs ripgrep source fallback with accurate provenance', () => {
    const queryRes = runCli(['query-graph', 'canAccessResource isValidTenantPair', '--no-native-cli']);
    expect(queryRes.status).toBe(0);
    expect(queryRes.stdout).toContain('[query-graph] PASS');
    expect(queryRes.stdout).toContain('Multi-hop BFS');
    expect(queryRes.stdout).toContain('Source fallback (ripgrep): 3 file(s)');

    const queryData = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/query-canaccessresource-isvalidtenantpair.json'), 'utf8'));
    expect(queryData.budgetMetrics.withinExplorationBudget).toBe(true);
    expect(queryData.queryModesDistinction.bfsDependencyTraversal).toBeDefined();
    expect(queryData.sourceFallbackResults.matchedCount).toBe(3);
  });

  // VAL03: Actual FND03 service, adapter, helpers/enforcer/guards, real profile callers and dependencies retained
  it('VAL03: retains all 18 RBAC core files and 14 discovered API/route callers with 0 uncovered', () => {
    const packetRes = runCli(['build-packet', '--packet', 'fnd03', '--mode', 'full', '--allow-dirty']);
    expect(packetRes.status).toBe(0);
    expect(packetRes.stdout).toContain('[build-packet] PASS');

    const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.manifest.json'), 'utf8'));
    expect(manifest.completenessStatus).toBe('COMPLETE_VERIFIED');
    expect(manifest.callerCoverage.uncoveredCallersCount).toBe(0);
    expect(manifest.callerCoverage.discoveredFilesCount).toBe(14);
    expect(manifest.selectedFilesCount).toBe(30);

    const paths = manifest.selectedFiles.map((f: any) => f.path);
    expect(paths).toContain('packages/auth/src/rbac/ownership.service.ts');
    expect(paths).toContain('packages/auth/src/rbac/rbac.adapter.ts');
    expect(paths).toContain('packages/auth/src/rbac/rbac.guard.ts');
    expect(paths).toContain('packages/auth/src/rbac/enforcer.ts');
    expect(paths).toContain('apps/api-server/src/app/api/auth/profile/route.ts');
    expect(paths).toContain('apps/api-server/src/modules/auth/brand-db.ts');
  });

  // VAL04: Required missing/unknown/cross-tenant and same-tenant owner/non-owner controls and Sol D1/D3 retained in full
  it('VAL04: preserves complete negative test files and Sol D1/D3 decision texts uncompressed', () => {
    const packetContent = fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.md'), 'utf8');

    // Negative tests preserved with assertions
    expect(packetContent).toContain('sol-fnd03-tenant-boundary.test.ts');
    expect(packetContent).toContain('expect(result.canRead).toBe(false);');

    // Sol D1 and D3 decisions preserved
    expect(packetContent).toContain('## D1. Private profile ownership and explicit tenant provenance');
    expect(packetContent).toContain('## D3. Tenant persistence, progress, exports and admin context');
  });

  // VAL05: Tutorial progress schema/repository boundaries and historical unsafe migration/default evidence retained
  it('VAL05: retains tutorial progress schema/repository and blocked migration safety exceptions', () => {
    const packetContent = fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.md'), 'utf8');

    expect(packetContent).toContain('packages/db-tutorial/src/schema/tutorial-progress.ts');
    expect(packetContent).toContain('packages/db-tutorial/src/repositories/tutorial-progress.repository.ts');
    expect(packetContent).toContain('RAISE EXCEPTION \'FND03 migration blocked pending provenance review\';');
  });

  // VAL06: Full target function bodies/negative tests survive optional compression; parse gaps or oversized packets explicitly fail coverage
  it('VAL06: navigation mode outlines symbols while full mode retains 100% function bodies and fails closed on overflow', () => {
    const navRes = runCli(['build-packet', '--packet', 'fnd03', '--mode', 'navigation', '--allow-dirty']);
    expect(navRes.status).toBe(0);

    const navManifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-navigation-packet.manifest.json'), 'utf8'));
    expect(navManifest.mode).toBe('navigation');
    expect(navManifest.auditSafeForSecuritySignOff).toBe(false);

    // Fail closed on budget overflow in full mode
    const overflowRes = runCli(['build-packet', '--packet', 'fnd03', '--mode', 'full', '--max-bytes', '32768', '--allow-dirty'], { allowFailure: true });
    expect(overflowRes.status).not.toBe(0);
    expect(overflowRes.stderr).toContain('PACKET_INCOMPLETE_FAIL_CLOSED');
    expect(overflowRes.stderr).toContain('BUDGET_OVERFLOW_IN_FULL_SECURITY_MODE');
  });

  // VAL07: Secret canaries, ignored/untracked inputs, out-of-root and symlink paths cannot leak into packets/logs
  it('VAL07: rejects parent traversal, forbidden secret path globs, and redacts synthetic credential canaries', () => {
    // Parent traversal denial
    const traversalRes = runCli(['build-packet', '--packet', 'fnd03', '--extra-file', '../outside.txt', '--allow-dirty'], { allowFailure: true });
    expect(traversalRes.status).not.toBe(0);
    expect(traversalRes.stderr).toContain('PATH_CONFINEMENT_ERROR');

    // Forbidden path glob denial (.npmrc)
    const secretPathRes = runCli(['build-packet', '--packet', 'fnd03', '--extra-file', '.npmrc', '--allow-dirty'], { allowFailure: true });
    expect(secretPathRes.status).not.toBe(0);
    expect(secretPathRes.stderr).toContain('SECRET_SCAN_ABORT');

    // Synthetic canary suite
    const canaryRes = runCli(['verify-canaries']);
    expect(canaryRes.status).toBe(0);
    expect(canaryRes.stdout).toContain('15/15 checks passed');
  });

  // VAL08: Changed HEAD/dirty selected input/stale review references cannot masquerade as a current checkpoint
  it('VAL08: checkpoint validate fails closed on simulated stale HEAD or changed inputs and never auto-executes commands', () => {
    const createRes = runCli(['checkpoint-create', '--packet', 'fnd03', '--allow-dirty']);
    expect(createRes.status).toBe(0);

    const valClean = runCli(['checkpoint-validate', '--file', '.context-packets/fnd03-checkpoint.json', '--allow-dirty']);
    expect(valClean.status).toBe(0);
    expect(valClean.stdout).toContain('[checkpoint-validate] PASS');

    // Stale HEAD rejection
    const staleHeadRes = runCli(['checkpoint-validate', '--file', '.context-packets/fnd03-checkpoint.json', '--allow-dirty', '--simulate-head', '0000000000000000000000000000000000000000'], { allowFailure: true });
    expect(staleHeadRes.status).not.toBe(0);
    expect(staleHeadRes.stdout).toContain('REPO_HEAD_MISMATCH');

    const checkpoint = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-checkpoint.json'), 'utf8'));
    expect(checkpoint.autoExecuteCommands).toBe(false);
  });

  // VAL09: Output budgets preserve complete safe on-disk evidence and real exit/failure/skip outcomes
  it('VAL09: budget overflow in full mode writes multi-part safe chunks while failing closed in terminal output', () => {
    const overflowRes = runCli(['build-packet', '--packet', 'fnd03', '--mode', 'full', '--max-bytes', '49152', '--allow-dirty', '--out-dir', '.context-packets/val09-chunks'], { allowFailure: true });
    expect(overflowRes.status).not.toBe(0);

    const chunk1 = path.join(REPO_ROOT, '.context-packets/val09-chunks/fnd03-full-chunk-part1.md');
    const chunk2 = path.join(REPO_ROOT, '.context-packets/val09-chunks/fnd03-full-chunk-part2.md');
    expect(fs.existsSync(chunk1)).toBe(true);
    expect(fs.existsSync(chunk2)).toBe(true);
  });

  // VAL10: Before/after same-task coverage and counting method are comparable; include discovery/manifest overhead and missing dependencies
  it('VAL10: benchmark preserves identical 30-file security coverage and reports exact bytes and chars div 4', () => {
    const benchRes = runCli(['benchmark', '--packet', 'fnd03']);
    expect(benchRes.status).toBe(0);
    expect(benchRes.stdout).toContain('[benchmark] PASS');

    const report = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-benchmark.json'), 'utf8'));
    expect(report.sameCoverageGuarantee.identicalSecurityFileSet).toBe(true);
    expect(report.sameCoverageGuarantee.requiredSecurityFilesCount).toBe(30);
    expect(report.sameCoverageGuarantee.optimizedPacketFilesCount).toBe(30);
    expect(report.recipes.optimizedFullSecurityWorkflow.packetPayloadOnly.bytes).toBe(214849);
    expect(report.recipes.optimizedFullSecurityWorkflow.endToEndInContextTotal.deltaVsConventionalEndToEndPct).toBeLessThan(0);
  });

  // VAL11: Offline packaging does not import application runtime, contact services, alter security tests or modify target source
  it('VAL11: context-cli runs strictly offline using Node built-ins without loading application runtime or network', () => {
    const cliSource = fs.readFileSync(CLI_PATH, 'utf8');
    expect(cliSource).not.toContain("from '@quiz/");
    expect(cliSource).not.toContain("import '@quiz/");
    expect(cliSource).not.toContain('http://');
    expect(cliSource).not.toContain('https://');
    expect(cliSource).not.toContain('fetch(');
  });

  // VAL12: Ignore rules, exact staging, host-rule compatibility, rollback and full-source fallback work; no mandatory rollout or false FND acceptance
  it('VAL12: .gitignore isolates /.context-packets/, Sonnet DOC01-DOC03 targets match assignment, and status is never CLOSED', () => {
    const gitignore = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8');
    expect(gitignore).toContain('/.context-packets/');

    const hostInv = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/host-inventory.json'), 'utf8'));
    expect(hostInv.approvedSonnetDocumentationTargets.DOC01).toBe('docs/ai-context/operating-guide.md');
    expect(hostInv.approvedSonnetDocumentationTargets.DOC02).toBe('docs/ai-context/fnd-checkpoint-template.md');
    expect(hostInv.approvedSonnetDocumentationTargets.DOC03).toBe('docs/ai-context/task-retrieval-guide.md');

    const checkpoint = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-checkpoint.json'), 'utf8'));
    expect(checkpoint.status).toBe('IN_PROGRESS');
    expect(checkpoint.status).not.toBe('CLOSED');
  });
});

describe('VAL01–VAL12 Supplemental Acceptance Controls', () => {
  const FIXTURES_DIR = path.join(__dirname, 'fixtures');

  // SUPP-01 (Priority A.1): Absent/stale Graphify data triggers source fallback without silent omissions, and fails closed on invalid regex
  it('SUPP-01 (A.1): handles absent/stale graphify data via source fallback and rejects invalid regex', () => {
    const tempConfigPath = path.join(REPO_ROOT, '.context-packets/test-supp01-config.json');
    const rawConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'tools/ai-context/config.json'), 'utf8'));
    const missingGraphConfig = {
      ...rawConfig,
      graphify: { ...rawConfig.graphify, graphPath: 'graphify-out/absent-graph-file.json' },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(missingGraphConfig, null, 2), 'utf8');

    try {
      // 1. Query with missing graphify graph -> should not crash, advisory=true, falls back to ripgrep
      const fallbackRes = runCli([
        'query-graph',
        'canAccessResource isValidTenantPair',
        '--config',
        '.context-packets/test-supp01-config.json',
        '--no-native-cli',
      ]);
      expect(fallbackRes.status).toBe(0);
      expect(fallbackRes.stdout).toContain('Provenance verified: false | Advisory: true');
      expect(fallbackRes.stdout).toContain('Source fallback (ripgrep): 3 file(s)');

      const queryData = JSON.parse(
        fs.readFileSync(path.join(REPO_ROOT, '.context-packets/query-canaccessresource-isvalidtenantpair.json'), 'utf8')
      );
      expect(queryData.provenance.exists).toBe(false);
      expect(queryData.provenance.advisory).toBe(true);
      expect(queryData.truncation.incompletenessReason).toBe('No graph nodes matched; rely on sourceFallbackResults.');
      expect(queryData.sourceFallbackResults.matchedCount).toBe(3);
      expect(queryData.sourceFallbackResults.matchedFiles).toContain('packages/auth/src/rbac/ownership.service.ts');
      expect(queryData.sourceFallbackResults.matchedFiles).toContain(
        'packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts'
      );

      // 2. Explicit fallback failure: invalid regex must fail closed
      const invalidRegexRes = runCli(
        ['query-graph', 'test', '--fallback-pattern', '[invalid-regex', '--no-native-cli'],
        { allowFailure: true }
      );
      expect(invalidRegexRes.status).toBe(1);
      expect(invalidRegexRes.stderr).toContain('CALLER_SEARCH_INVALID_REGEX');
    } finally {
      if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
    }
  });

  // SUPP-02 (Priority A.2): Synthetic external symlinks, untracked forbidden files, and alternate secret globs are rejected without leaking credentials
  it('SUPP-02 (A.2): rejects external symlinks, untracked files and alternate forbidden paths without leaking secret values', () => {
    const symlinkSubdir = path.join(FIXTURES_DIR, 'symlink-confinement-test');
    fs.mkdirSync(symlinkSubdir, { recursive: true });
    const outsideTarget = path.resolve(REPO_ROOT, '..', 'temp-outside-canary.txt');
    fs.writeFileSync(outsideTarget, 'SUPER_SECRET_EXTERNAL_CANARY_VALUE_12345', 'utf8');

    const junctionLink = path.join(symlinkSubdir, 'escape-link');
    try {
      fs.symlinkSync(path.resolve(REPO_ROOT, '..'), junctionLink, 'junction');

      // 1. External symlink target rejection
      const symlinkRes = runCli(
        [
          'build-packet',
          '--packet',
          'fnd03',
          '--extra-file',
          'tests/tooling/ai-context/fixtures/symlink-confinement-test/escape-link/temp-outside-canary.txt',
          '--allow-dirty',
        ],
        { allowFailure: true }
      );
      expect(symlinkRes.status).toBe(1);
      expect(symlinkRes.stderr).toContain('PATH_CONFINEMENT_ERROR: Symlink target escapes repository root');
      expect(symlinkRes.stderr).not.toContain('SUPER_SECRET_EXTERNAL_CANARY_VALUE_12345');
    } finally {
      if (fs.existsSync(junctionLink)) fs.unlinkSync(junctionLink);
      if (fs.existsSync(outsideTarget)) fs.unlinkSync(outsideTarget);
      if (fs.existsSync(symlinkSubdir)) fs.rmdirSync(symlinkSubdir);
    }

    // 2. Alternate forbidden secret path globs
    const alternateSecretPaths = [
      'packages/auth/.env.production',
      'packages/auth/secrets.live.json',
      'packages/auth/id_rsa_synthetic',
      'packages/auth/server.pem',
    ];

    for (const secretRelPath of alternateSecretPaths) {
      const absPath = path.join(REPO_ROOT, secretRelPath);
      fs.writeFileSync(absPath, 'MOCK_SECRET_CREDENTIAL_DATA', 'utf8');
      try {
        const secretRes = runCli(
          ['build-packet', '--packet', 'fnd03', '--extra-file', secretRelPath, '--allow-dirty'],
          { allowFailure: true }
        );
        expect(secretRes.status).toBe(1);
        expect(secretRes.stderr).toContain('SECRET_SCAN_ABORT');
        expect(secretRes.stderr).not.toContain('MOCK_SECRET_CREDENTIAL_DATA');
      } finally {
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      }
    }
  });

  // SUPP-03 (Priority A.3): Mutate selected source, test and Sol-decision inputs in isolated fixtures; prove checkpoint invalidation
  it('SUPP-03 (A.3): invalidates checkpoints against mutated source hashes, Sol decisions, missing sections, and unauthorized status', () => {
    const tempDir = path.join(REPO_ROOT, '.context-packets/test-supp03-checkpoints');
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      runCli(['checkpoint-create', '--packet', 'fnd03', '--allow-dirty', '--out-dir', '.context-packets/test-supp03-checkpoints']);
      const baseCheckpoint = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'fnd03-checkpoint.json'), 'utf8')
      );

      // Mutation 1: Tracked source file hash mismatch
      const mutFile = {
        ...baseCheckpoint,
        fileFingerprints: baseCheckpoint.fileFingerprints.map((f: any, i: number) =>
          i === 0 ? { ...f, sha256: '0'.repeat(64) } : f
        ),
      };
      const mutFilePath = path.join(tempDir, 'mut-file.json');
      fs.writeFileSync(mutFilePath, JSON.stringify(mutFile, null, 2), 'utf8');
      const mutFileRes = runCli(['checkpoint-validate', '--file', toPosixRel(mutFilePath), '--allow-dirty'], { allowFailure: true });
      expect(mutFileRes.status).toBe(1);
      expect(mutFileRes.stdout).toContain('FILE_HASH_MISMATCH');

      // Mutation 2: Sol decision file hash mismatch
      const mutSol = {
        ...baseCheckpoint,
        solDecisionReference: {
          ...baseCheckpoint.solDecisionReference,
          solDecisionSha256: 'f'.repeat(64),
        },
      };
      const mutSolPath = path.join(tempDir, 'mut-sol.json');
      fs.writeFileSync(mutSolPath, JSON.stringify(mutSol, null, 2), 'utf8');
      const mutSolRes = runCli(['checkpoint-validate', '--file', toPosixRel(mutSolPath), '--allow-dirty'], { allowFailure: true });
      expect(mutSolRes.status).toBe(1);
      expect(mutSolRes.stdout).toContain('SOL_DECISION_HASH_MISMATCH');

      // Mutation 3: Sol decision missing verified sections
      const mutSections = {
        ...baseCheckpoint,
        solDecisionReference: {
          ...baseCheckpoint.solDecisionReference,
          verifiedSections: [],
        },
      };
      const mutSectionsPath = path.join(tempDir, 'mut-sections.json');
      fs.writeFileSync(mutSectionsPath, JSON.stringify(mutSections, null, 2), 'utf8');
      const mutSectionsRes = runCli(['checkpoint-validate', '--file', toPosixRel(mutSectionsPath), '--allow-dirty'], { allowFailure: true });
      expect(mutSectionsRes.status).toBe(1);
      expect(mutSectionsRes.stdout).toContain('MISSING_SOL_SECTIONS');

      // Mutation 4: Unauthorized status = "CLOSED"
      const mutClosed = { ...baseCheckpoint, status: 'CLOSED' };
      const mutClosedPath = path.join(tempDir, 'mut-closed.json');
      fs.writeFileSync(mutClosedPath, JSON.stringify(mutClosed, null, 2), 'utf8');
      const mutClosedRes = runCli(['checkpoint-validate', '--file', toPosixRel(mutClosedPath), '--allow-dirty'], { allowFailure: true });
      expect(mutClosedRes.status).toBe(1);
      expect(mutClosedRes.stdout).toContain('UNAUTHORIZED_CLOSURE_STATUS');

      // Mutation 5: Auto-execution flag enabled
      const mutAutoExec = { ...baseCheckpoint, autoExecuteCommands: true };
      const mutAutoExecPath = path.join(tempDir, 'mut-auto-exec.json');
      fs.writeFileSync(mutAutoExecPath, JSON.stringify(mutAutoExec, null, 2), 'utf8');
      const mutAutoExecRes = runCli(['checkpoint-validate', '--file', toPosixRel(mutAutoExecPath), '--allow-dirty'], { allowFailure: true });
      expect(mutAutoExecRes.status).toBe(1);
      expect(mutAutoExecRes.stdout).toContain('INVALID_EXECUTION_FLAG');
    } finally {
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // SUPP-04 (Priority A.4): Verify full security packet file hashes and required negative assertions directly against source
  it('SUPP-04 (A.4): matches 100% of manifest file SHA-256 hashes and negative assertions to source files on disk', () => {
    runCli(['build-packet', '--packet', 'fnd03', '--mode', 'full', '--allow-dirty']);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.manifest.json'), 'utf8')
    );
    const packetContent = fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.md'), 'utf8');

    // 1. Verify every single file's SHA-256 matches actual disk hash
    expect(manifest.selectedFiles.length).toBe(30);
    for (const fileEntry of manifest.selectedFiles) {
      const diskAbsPath = path.join(REPO_ROOT, fileEntry.path);
      expect(fs.existsSync(diskAbsPath)).toBe(true);
      const computedSha = crypto.createHash('sha256').update(fs.readFileSync(diskAbsPath)).digest('hex');
      expect(computedSha).toBe(fileEntry.sha256);
    }

    // 2. Verify exact negative assertion expressions and permission checks from sol-fnd03-tenant-boundary.test.ts exist in packet
    const boundaryTestContent = fs.readFileSync(
      path.join(REPO_ROOT, 'packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts'),
      'utf8'
    );
    const expectedAssertions = [
      'expect(result.canRead).toBe(false);',
      'expect(result.canWrite).toBe(false);',
      'PERMISSIONS.PROFILE_READ',
      'PERMISSIONS.PROFILE_WRITE',
      'expect(OwnershipRBACService.hasPermissionOrOwnership(',
    ];

    for (const assertion of expectedAssertions) {
      expect(boundaryTestContent).toContain(assertion);
      expect(packetContent).toContain(assertion);
    }
  });

  // SUPP-05 (Priority B.5): Force full-packet overflow; reconstruct generated chunks and verify complete byte/file coverage
  it('SUPP-05 (B.5): forces budget overflow, writes safe multi-part chunks, and reconstructs 100% file coverage without omission', () => {
    const chunkDir = path.join(REPO_ROOT, '.context-packets/test-supp05-chunks');
    fs.mkdirSync(chunkDir, { recursive: true });

    try {
      const overflowRes = runCli(
        ['build-packet', '--packet', 'fnd03', '--mode', 'full', '--max-bytes', '32768', '--allow-dirty', '--out-dir', '.context-packets/test-supp05-chunks'],
        { allowFailure: true }
      );
      expect(overflowRes.status).toBe(1);
      expect(overflowRes.stderr).toContain('PACKET_INCOMPLETE_FAIL_CLOSED');
      expect(overflowRes.stderr).toContain('BUDGET_OVERFLOW_IN_FULL_SECURITY_MODE');

      const manifest = JSON.parse(fs.readFileSync(path.join(chunkDir, 'fnd03-packet.manifest.json'), 'utf8'));
      const safeChunks = manifest.budgetStatus.safeChunkFiles;
      expect(safeChunks.length).toBeGreaterThanOrEqual(2);

      // Reconstruct union of files across all safe chunk files
      const reconstructedFiles: string[] = [];
      for (const chunk of safeChunks) {
        const chunkAbs = path.join(REPO_ROOT, chunk.path);
        expect(fs.existsSync(chunkAbs)).toBe(true);
        const chunkContent = fs.readFileSync(chunkAbs, 'utf8');
        expect(chunkContent).toContain(`Bounded Chunk Part ${chunk.part}`);
        for (const filePath of chunk.files) {
          expect(chunkContent).toContain(filePath);
          reconstructedFiles.push(filePath);
        }
      }

      // Prove that 100% of the 30 files are accounted for in the safe chunks
      expect(reconstructedFiles.length).toBe(manifest.selectedFilesCount);
      const manifestFilePaths = manifest.selectedFiles.map((f: any) => f.path);
      expect(reconstructedFiles.sort()).toEqual(manifestFilePaths.sort());

      // Prove that the complete untruncated packet is also written on disk
      const untruncatedAbs = path.join(chunkDir, 'fnd03-packet.md');
      expect(fs.existsSync(untruncatedAbs)).toBe(true);
      const untruncatedContent = fs.readFileSync(untruncatedAbs, 'utf8');
      expect(Buffer.byteLength(untruncatedContent, 'utf8')).toBe(214849);
    } finally {
      if (fs.existsSync(chunkDir)) fs.rmSync(chunkDir, { recursive: true, force: true });
    }
  });

  // SUPP-06 (Priority B.6): Independently calculate conventional and optimized file-path sets
  it('SUPP-06 (B.6): independently proves exact symmetric set equality of conventional and optimized security file paths', () => {
    const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'tools/ai-context/config.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-packet.manifest.json'), 'utf8'));

    const conventionalRequired = (config.packets?.fnd03?.conventionalSameCoverageBaseline?.requiredSecurityFiles || []).map((p: string) => p.replace(/\\/g, '/'));
    const optimizedSelected = manifest.selectedFiles.map((f: any) => f.path.replace(/\\/g, '/'));

    expect(conventionalRequired.length).toBe(30);
    expect(optimizedSelected.length).toBe(30);

    const conventionalSet = new Set(conventionalRequired);
    const optimizedSet = new Set(optimizedSelected);

    // Symmetric difference calculation
    const missingInOptimized = conventionalRequired.filter((p: string) => !optimizedSet.has(p));
    const extraInOptimized = optimizedSelected.filter((p: string) => !conventionalSet.has(p));

    expect(missingInOptimized).toEqual([]);
    expect(extraInOptimized).toEqual([]);
    expect([...conventionalSet].sort()).toEqual([...optimizedSet].sort());
  });

  // SUPP-07 (Priority B.7): Include discovery, packet headers, line formatting, and manifest overhead in reported savings
  it('SUPP-07 (B.7): accounts for discovery, line formatting and manifest overhead, distinguishing heuristic tokens from billed usage', () => {
    const report = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.context-packets/fnd03-benchmark.json'), 'utf8'));

    const rawRequiredBytes = report.recipes.rawRequired30FilesOnly.bytes;
    const conventionalEndToEndBytes = report.recipes.conventionalSameCoverageWorkflow.endToEndTotal.bytes;
    const optimizedPacketBytes = report.recipes.optimizedFullSecurityWorkflow.packetPayloadOnly.bytes;
    const boundedQueryBytes = report.recipes.optimizedFullSecurityWorkflow.discoveryAndManifestOverhead.boundedGraphQueryBytes;
    const optimizedEndToEndBytes = report.recipes.optimizedFullSecurityWorkflow.endToEndInContextTotal.bytes;

    expect(rawRequiredBytes).toBe(181713);
    expect(conventionalEndToEndBytes).toBeGreaterThan(400000);
    expect(optimizedPacketBytes).toBe(214849);
    expect(boundedQueryBytes).toBeGreaterThan(10000);
    expect(optimizedEndToEndBytes).toBeGreaterThan(200000);

    // Line number and markdown framing overhead: (+18.24% vs raw code)
    const lineFormattingOverhead = ((optimizedPacketBytes - rawRequiredBytes) / rawRequiredBytes) * 100;
    expect(lineFormattingOverhead).toBeCloseTo(18.24, 1);

    // End-to-end reduction including discovery and framing vs conventional:
    const endToEndReduction = ((optimizedEndToEndBytes - conventionalEndToEndBytes) / conventionalEndToEndBytes) * 100;
    expect(endToEndReduction).toBeLessThan(-40);

    // Explicitly verify methodology disclaimer
    expect(report.countingMethodology.tokensEstimateCharsDiv4).toContain('NOT a model-billing or API-usage measurement');
    expect(report.countingMethodology.repomixCalibration).toContain('o200k_base');
  });

  // SUPP-08 (Priority C.8): Prove offline operation with actual network-denial boundary and blackhole proxy
  it('SUPP-08 (C.8): proves offline operation under active network-denial preload and blackhole proxy configuration', () => {
    const preloadGuard = path.join(FIXTURES_DIR, 'offline-network-denial-guard.cjs');
    expect(fs.existsSync(preloadGuard)).toBe(true);

    const offlineEnv = {
      ...process.env,
      HTTP_PROXY: 'http://127.0.0.1:9',
      HTTPS_PROXY: 'http://127.0.0.1:9',
      ALL_PROXY: 'http://127.0.0.1:9',
      NO_PROXY: '',
      NODE_TLS_REJECT_UNAUTHORIZED: '1',
    };

    // Run context-cli with preload script that throws on any network/socket attempt
    const out = execFileSync('node', ['-r', preloadGuard, CLI_PATH, 'host-inventory'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: offlineEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(out).toContain('[host-inventory] PASS');

    // Also run query-graph under the network denial boundary
    const queryOut = execFileSync('node', ['-r', preloadGuard, CLI_PATH, 'query-graph', 'canAccessResource', '--no-native-cli'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: offlineEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(queryOut).toContain('[query-graph] PASS');
  });

  // SUPP-09 (Priority C.9): Clean-checkout setup, host-rule noninterference, and full-source rollback recovery
  it('SUPP-09 (C.9): verifies clean-checkout artifact generation, AGENTS.md/CLAUDE.md noninterference, and full-source rollback recovery', () => {
    const cleanDir = path.join(REPO_ROOT, '.context-packets/test-supp09-clean');
    fs.mkdirSync(cleanDir, { recursive: true });

    try {
      // 1. Clean checkout execution into an empty directory
      const buildRes = runCli([
        'build-packet',
        '--packet',
        'fnd03',
        '--mode',
        'full',
        '--allow-dirty',
        '--out-dir',
        '.context-packets/test-supp09-clean',
      ]);
      expect(buildRes.status).toBe(0);
      expect(fs.existsSync(path.join(cleanDir, 'fnd03-packet.md'))).toBe(true);
      expect(fs.existsSync(path.join(cleanDir, 'fnd03-packet.manifest.json'))).toBe(true);

      // 2. Host-rule noninterference check
      const gitStatus = execFileSync('git', ['status', '--porcelain', 'AGENTS.md', 'CLAUDE.md'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      }).trim();
      expect(gitStatus).toBe('');

      // 3. Rollback & recovery: navigation packet flag forces fallback to full packet
      runCli([
        'build-packet',
        '--packet',
        'fnd03',
        '--mode',
        'navigation',
        '--allow-dirty',
        '--out-dir',
        '.context-packets/test-supp09-clean',
      ]);
      const navManifest = JSON.parse(
        fs.readFileSync(path.join(cleanDir, 'fnd03-navigation-packet.manifest.json'), 'utf8')
      );
      expect(navManifest.auditSafeForSecuritySignOff).toBe(false);

      // Full recovery
      runCli([
        'build-packet',
        '--packet',
        'fnd03',
        '--mode',
        'full',
        '--allow-dirty',
        '--out-dir',
        '.context-packets/test-supp09-clean',
      ]);
      const fullManifest = JSON.parse(
        fs.readFileSync(path.join(cleanDir, 'fnd03-packet.manifest.json'), 'utf8')
      );
      expect(fullManifest.auditSafeForSecuritySignOff).toBe(true);
      expect(fullManifest.selectedFilesCount).toBe(30);
    } finally {
      if (fs.existsSync(cleanDir)) fs.rmSync(cleanDir, { recursive: true, force: true });
    }
  });

  // SUPP-10 (Priority C.10): Preserve exact exit codes across valid and adverse CLI commands
  it('SUPP-10 (C.10): preserves exact CLI exit codes (0 for valid, 1 for fail-closed) without ambiguous execution states', () => {
    // Valid subcommands exit 0
    expect(runCli(['--help']).status).toBe(0);
    expect(runCli(['host-inventory']).status).toBe(0);
    expect(runCli(['sql-coverage']).status).toBe(0);
    expect(runCli(['verify-canaries']).status).toBe(0);

    // Adverse failure subcommands exit 1
    expect(runCli(['unknown-subcommand'], { allowFailure: true }).status).toBe(1);
    expect(runCli(['build-packet', '--extra-file', '../escape.txt'], { allowFailure: true }).status).toBe(1);
    expect(runCli(['build-packet', '--extra-file', '.npmrc'], { allowFailure: true }).status).toBe(1);
    expect(runCli(['checkpoint-validate', '--file', 'non-existent.json'], { allowFailure: true }).status).toBe(1);
  });
});

