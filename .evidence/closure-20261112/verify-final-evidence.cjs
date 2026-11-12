const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const dir = __dirname;
const root = path.resolve(dir, '../..');
const receipt = JSON.parse(fs.readFileSync(path.join(dir, 'final-gates.json')));
const latest = new Map(receipt.map(gate => [gate.name, gate]));
const diagnostics = /Compiled with warnings|Critical dependency:|^\s*<w>|\bWarning:|\b[1-9]\d* warnings?\b|deprecated|Browserslist:/im;
const results = [];
for (const [name, prefix] of [['SHC Admin', 'skillhubcore-admin'], ['SUIA Web', 'skillup-web'], ['RTH Web', 'realtutorialhub-web']]) {
  const build = name === 'SHC Admin' ? 'final-shc-build' : name === 'SUIA Web' ? 'final-suia-build' : 'final-rth-build';
  const gates = [build, `final-${prefix}-typecheck`, `final-${prefix}-lint`];
  for (const gate of gates) {
    assert.equal(latest.get(gate)?.exitCode, 0, `${gate} receipt failed`);
    const log = fs.readFileSync(path.join(dir, `${gate}.log`), 'utf8');
    assert.ok(!diagnostics.test(log), `${gate} still contains diagnostics`);
    if (gate.endsWith('-build')) assert.match(log, /Compiled successfully/);
    if (gate.endsWith('-lint')) assert.match(log, /--max-warnings=0/);
  }
  results.push({ app: name, build: 'PASS', typecheck: 'PASS', lint: 'PASS', errors: 0, warnings: 0 });
}
assert.equal(fs.readFileSync(path.join(dir, 'final-shc-build.exit'), 'utf8').trim(), '0');
assert.equal(fs.readFileSync(path.join(dir, 'final-skillup-web-typecheck.exit'), 'utf8').trim(), '0');
assert.equal(fs.readFileSync(path.join(dir, 'final-skillup-web-lint.exit'), 'utf8').trim(), '0');
const runtime = {};
for (const name of ['progress-remote-results', 'progress-browser-results', 'browser-nontutorial-results', 'security-http-negative']) {
  const report = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`)));
  assert.ok(report.results.every(result => result.pass), `${name} has a failure`);
  if (name.startsWith('progress-')) assert.equal(report.cleanupVerified, true);
  runtime[name] = { passed: report.results.length, cleanupVerified: report.cleanupVerified };
}
const ledger = fs.readFileSync(path.join(root, 'docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv'));
const ledgerHash = crypto.createHash('sha256').update(ledger).digest('hex');
assert.equal(ledgerHash, '7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e');
execFileSync('git', ['diff', '--check'], { cwd: root, stdio: 'pipe' });
const output = { timestamp: new Date().toISOString(), sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), workingTreeChanges: true, results, runtime, ledgerHash, remainingMigrationProvenanceHashes: JSON.parse(fs.readFileSync(path.join(dir, 'migration-reconciliation.json'))).unmatchedHashes, dockerRuntime: 'Owner assigned', marketing: 'HOLD' };
fs.writeFileSync(path.join(dir, 'FINAL_VERIFICATION.json'), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output));
