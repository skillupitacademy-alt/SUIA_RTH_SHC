const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = require('./baseline.json');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const allowed = new Set([
  'apps/api-server/src/modules/exam-engine/exam.observer.ts',
  'apps/api-server/src/modules/exam-engine/__tests__/exam.observer.tail.test.ts',
  '.evidence/r6-existing-p1/ENGINEERING_AND_EXCEPTIONS.md',
  '.evidence/r6-existing-p1/OWNER_DECISIONS_AND_HOLDS.md',
]);
const comparison = baseline.files.map(file => ({ ...file, currentSha256: sha256(file.path), unchanged: sha256(file.path) === file.sha256 }));
const unexpectedChanges = comparison.filter(file => !file.unchanged && !allowed.has(file.path));
const additions = [
  'apps/api-server/src/app/api/generate-report/__tests__/report-auth.test.ts',
  'docs/architecture/reviews/SHC/SOL_R6_A_REPORT_GENERATION_P0_REVIEW.md',
].map(file => ({ path: file, sha256: sha256(file) }));
const result = {
  timestamp: new Date().toISOString(), ownerReportedCommit: baseline.ownerReportedCommit,
  provenance: 'Current local file hashes. No Git CLI used and no local HEAD claim.',
  comparison, additions, unexpectedChanges,
  r6ProtectedFilesUnchanged: comparison.filter(file => !allowed.has(file.path)).every(file => file.unchanged),
  boundary: 'Comparison covers the 22 recorded baseline files and explicitly listed additions. It is not a whole-worktree Git status. Graph output and generated build files are outside this source comparison.',
};
fs.writeFileSync(path.join(__dirname, 'FINAL_SOURCE_AND_SCOPE.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ recorded: comparison.length, changed: comparison.filter(file => !file.unchanged).map(file => file.path), unexpected: unexpectedChanges.length, protectedUnchanged: result.r6ProtectedFilesUnchanged }));
if (unexpectedChanges.length) process.exitCode = 1;
