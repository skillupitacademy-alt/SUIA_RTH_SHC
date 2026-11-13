const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = require('./baseline-source-hashes.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const changed = baseline.files.filter(file => fs.existsSync(path.join(root, file.path)) && hash(file.path) !== file.sha256).map(file => ({ path: file.path, before: file.sha256, after: hash(file.path) }));
const explicit = [
  'src/share-branding/middleware/authProxy.ts',
  'src/share-branding/middleware/__tests__/r6-session-cancellation.test.ts',
  'apps/skillhubcore-admin/src/lib/__tests__/r6-action-authorization.test.ts',
  'apps/realtutorialhub-web/src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts',
];
const ledger = 'docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv';
const register = '.evidence/r3-acceptance-20261112/Q01_Q48_REGISTER.md';
const ledgerExpected = '7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e';
const result = {
  baseline: baseline.baseline,
  captured: new Date().toISOString(),
  changedBaselineFiles: changed,
  additionalScopedFiles: explicit.map(file => ({ path: file, sha256: hash(file) })),
  ledgerSha256: hash(ledger),
  ledgerUnchanged: hash(ledger) === ledgerExpected,
  originalRegisterSha256: hash(register),
  heldSourceChanges: changed.filter(file => /attendance|payment|marketing/i.test(file.path)),
  schemaOrHierarchyChanges: changed.filter(file => /(?:hierarchy|db-main.src.schema|db-tutorial.src.schema)/i.test(file.path)),
  limitation: 'Initial source manifest omitted the root shared-source directory. The shared proxy delta is separately listed and compared with the R5 source-safety receipt. Added test paths are explicit. No Git commands used for this manifest.',
};
fs.writeFileSync(path.join(__dirname, 'FINAL_SOURCE_MANIFEST.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ changed: changed.length, ledgerUnchanged: result.ledgerUnchanged, held: result.heldSourceChanges.length, hierarchy: result.schemaOrHierarchyChanges.length }));
