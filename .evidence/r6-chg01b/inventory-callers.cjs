const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const rows = [];
for (const file of walk(path.join(root, 'apps/skillup-web/src/app/api')).filter(file => file.endsWith('route.ts'))) {
  const source = path.relative(root, file).replaceAll('\\', '/');
  const held = /\/student\/(attendance|payments)\//.test(source);
  if (held) {
    rows.push({ source, mode: 'OWNER HOLD', identity: 'PeopleDB via deprecated default userId alias', consumer: 'Held business boundary. Endpoint bytes preserved.', change: 'No held source change. Common helper requires a valid signed person UUID and matching active SkillUp projection.' });
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('requireStudentAuth')) continue;
  const mode = text.includes("identity: 'people'") ? 'people' : text.includes("identity: 'learner'") ? 'learner' : 'UNCLASSIFIED';
  rows.push({
    source, mode,
    identity: mode === 'people' ? 'peoplePersonId, live PeopleDB id/externalId/platform mapping' : 'learnerUserId, verified payload.userId',
    consumer: source.includes('/tutorial/') ? 'TutorialDB/API learner ownership' : mode === 'people' ? (source.includes('/placement/') ? 'Existing placement profile person reference' : 'Existing PeopleDB profile/enrollment relationship') : 'Catalogue/faculty authentication only. No account ID passed to catalogue query.',
    change: mode === 'people' ? 'Explicit people mode and peoplePersonId argument' : 'Explicit learner mode and learnerUserId forwarding/auth context',
  });
}
const baseline = require('./BASELINE.json');
const changed = baseline.files.filter(file => fs.existsSync(path.join(root, file.path)) && crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file.path))).digest('hex') !== file.sha256).map(file => ({
  path: file.path, before: file.sha256, after: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file.path))).digest('hex'),
}));
const columns = Object.keys(rows[0]);
const quote = value => '"' + String(value).replaceAll('"', '""') + '"';
fs.writeFileSync(path.join(__dirname, 'CALLER_INVENTORY.csv'), [columns.join(','), ...rows.map(row => columns.map(column => quote(row[column])).join(','))].join('\r\n') + '\r\n');
const additions = ['apps/skillup-web/src/lib/student-auth-callers.test.ts', 'apps/skillup-web/src/lib/student-auth-token-contract.test.ts'].map(file => ({ path: file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') }));
const protectedChanges = changed.filter(file => !file.path.startsWith('apps/skillup-web/src/'));
const heldEndpointChanges = changed.filter(file => /\/student\/(attendance|payments)\/route\.ts$/.test(file.path));
fs.writeFileSync(path.join(__dirname, 'SOURCE_AND_CALLERS.json'), JSON.stringify({
  captured: new Date().toISOString(), ownerReportedCommit: baseline.ownerReportedCommit,
  callers: rows, changed, additions, protectedChanges, heldEndpointChanges,
  identityCounts: Object.fromEntries([...new Set(rows.map(row => row.mode))].map(mode => [mode, rows.filter(row => row.mode === mode).length])),
  scope: 'Recorded baseline file comparison. Source hashes, no Git CLI. Only shared mock fixture shapes were adjusted in existing suites containing incidental HOLD tests.',
}, null, 2));
console.log(JSON.stringify({ callers: rows.length, changed: changed.length, protectedChanges: protectedChanges.length, heldEndpointChanges: heldEndpointChanges.length, unclassified: rows.filter(row => row.mode === 'UNCLASSIFIED').length }));
if (protectedChanges.length || heldEndpointChanges.length || rows.some(row => row.mode === 'UNCLASSIFIED')) process.exitCode = 1;
