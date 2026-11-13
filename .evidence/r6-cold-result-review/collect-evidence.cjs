const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const baseline = require('./SOURCE_BASELINE.json');
const historical = require('../r6-existing-p1/baseline-source-hashes.json');
const original = require('../r6-existing-p1/authenticated-http-results.json');
const warmed = require('../r6-existing-p1/quiz-positive-http-results.json');
const backendPath = '.evidence/r6-existing-p1/api-local-dev.log';
const lines = fs.readFileSync(path.join(root, backendPath), 'utf8').split(/\r?\n/);
const backendResults = lines.flatMap((text, index) => /GET \/api\/quiz\/result/.test(text) ? [{ line: index + 1, text }] : []);
const scannedReceipts = [
  backendPath,
  '.evidence/r6-existing-p1/authenticated-http-results.json',
  '.evidence/r6-existing-p1/authenticated-after.log',
  '.evidence/r6-existing-p1/authenticated-http.cjs',
  '.evidence/r6-existing-p1/quiz-positive-http-results.json',
  '.evidence/r6-existing-p1/quiz-positive-http.cjs',
  '.evidence/r6-existing-p1/QUALITY_INTERRUPTED_RESULTS.json',
  '.evidence/r6-existing-p1/quality-interruption.txt',
  '.evidence/r6-report-p0/QUALITY_RESULTS.json',
  '.evidence/r6-report-p0/BUILD_RESULT.json',
];
const comparison = baseline.files.map(file => {
  const current = sha256(file.path);
  const old = historical.files.find(previous => previous.path === file.path);
  return { ...file, currentSha256: current, unchangedDuringInvestigation: file.sha256 === current, recordedIncidentBaselineMatch: old ? old.sha256 === current : 'Not captured in the incident baseline manifest' };
});
const result = {
  captured: new Date().toISOString(),
  originalRun: original.runId,
  originalFailure: original.results.filter(row => !row.pass),
  originalFailureCaptureLimits: ['No per-case timestamp', 'No own exam UUID in failure row', 'No response body or content type', 'No response request/correlation ID or server headers', 'No original matching gateway log'],
  backendResultAccessLines: backendResults,
  backendResult500AccessLines: backendResults.filter(row => /\s500\sin/.test(row.text)),
  firstBackendResultCompileLine: lines.findIndex(text => text.includes('Compiling /api/quiz/result')) + 1,
  warmedResultAssertions: warmed.results,
  receiptHashes: scannedReceipts.map(file => ({ path: file, sha256: sha256(file) })),
  sourceComparison: comparison,
};
fs.writeFileSync(path.join(__dirname, 'EVIDENCE_AND_SOURCE_COMPARISON.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ backendResultRequests: backendResults.length, backendRecorded500: result.backendResult500AccessLines.length, protectedFilesChanged: comparison.filter(file => !file.unchangedDuringInvestigation).length }));
if (comparison.some(file => !file.unchangedDuringInvestigation)) process.exitCode = 1;
