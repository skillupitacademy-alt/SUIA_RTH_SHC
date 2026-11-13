const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = require('./SOURCE_AND_CALLERS.json');
const quality = require('./QUALITY_RESULTS.json');
const report = 'docs/architecture/reviews/SHC/SOL_R6_B_CHG01B_SUIA_IDENTITY_BOUNDARY_REVIEW.md';
const parse = require('dotenv').parse;
const environment = parse(fs.readFileSync(path.join(root, '.env.local')));
const credentials = Object.entries(environment).filter(([key, value]) => /SECRET|TOKEN|PASSWORD|DATABASE_URL/i.test(key) && value.length >= 8);
const leaks = [];
const files = fs.readdirSync(__dirname).filter(file => /\.(log|json|md|csv|exit)$/.test(file) && file !== 'FINAL_VERIFICATION.json');
for (const file of files) {
  const text = fs.readFileSync(path.join(__dirname, file), 'utf8');
  for (const [key, value] of credentials) if (text.includes(value)) leaks.push({ file, configuredKey: key });
}
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const result = {
  captured: new Date().toISOString(),
  ownerReportedCommit: 'bc5a4b1452c6489e18844ac9548923bc69d258c1',
  exactChangedSourceAndTests: source.changed,
  addedSecurityTests: source.additions,
  report: { path: report, sha256: hash(path.join(root, report)) },
  callerCounts: source.identityCounts,
  protectedChanges: source.protectedChanges,
  heldEndpointChanges: source.heldEndpointChanges,
  completedGates: quality.results,
  configuredCredentialLeaks: leaks,
  receipts: files.map(file => ({ file, sha256: hash(path.join(__dirname, file)) })),
  limitations: [
    'Mocked database and HTTP boundaries, plus four real-signature verification tests.',
    'Real tokens missing shadowUserId retain the existing 401 verifier contract.',
    'Remote projection completeness and end-to-end database/browser qualification remain unexecuted.',
    'Source comparison covers recorded baseline files and added tests, without Git CLI or a whole-worktree status claim.',
  ],
};
fs.writeFileSync(path.join(__dirname, 'FINAL_VERIFICATION.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ gates: quality.results.length, passing: quality.results.filter(row => row.exitCode === 0).length, protectedChanges: source.protectedChanges.length, heldEndpointChanges: source.heldEndpointChanges.length, leaks: leaks.length }));
if (quality.results.length !== 3 || quality.results.some(row => row.exitCode !== 0) || source.protectedChanges.length || source.heldEndpointChanges.length || leaks.length) process.exitCode = 1;
