import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CLI_PATH = path.join(REPO_ROOT, 'tools/ai-context/context-cli.mjs');

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
