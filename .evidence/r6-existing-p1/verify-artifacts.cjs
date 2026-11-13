const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const parse = require('dotenv').parse;
const environment = Object.assign({}, ...['.env.local', 'apps/api-server/.env.local'].map(file => parse(fs.readFileSync(path.join(root, file)))));
const secrets = Object.entries(environment).filter(([key, value]) => /SECRET|TOKEN|DATABASE_URL|PASSWORD/i.test(key) && typeof value === 'string' && value.length >= 8);
const redactions = [];
for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(?:log|json|md|csv|exit)$/.test(entry.name) || entry.name === 'ARTIFACT_VERIFICATION.json') continue;
  const file = path.join(__dirname, entry.name);
  let text = fs.readFileSync(file, 'utf8');
  for (const [key, value] of secrets) {
    if (text.includes(value)) {
      text = text.replaceAll(value, '[REDACTED CONFIGURED CREDENTIAL]');
      redactions.push({ file: entry.name, configuredKey: key });
    }
  }
  fs.writeFileSync(file, text);
}
const runtime = ['authenticated-http', 'quiz-positive-http', 'quiz-answer-http', 'shc-populated-http', 'shc-backend-http'].map(name => {
  const result = JSON.parse(fs.readFileSync(path.join(__dirname, name + '-results.json'), 'utf8'));
  return { name, total: result.results.length, passed: result.results.filter(row => row.pass).length, failed: result.results.filter(row => !row.pass).map(row => row.name), cleanupVerified: result.cleanupVerified };
});
const files = fs.readdirSync(__dirname).filter(file => /\.(?:log|json|md|csv|exit)$/.test(file) && file !== 'ARTIFACT_VERIFICATION.json').map(file => ({ file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex') }));
const result = { captured: new Date().toISOString(), redactions, runtime, files, boundary: 'Configured secret substring check for preserved R6 evidence. Synthetic marker strings are fixtures. This check does not certify arbitrary unrecognized secret formats.' };
fs.writeFileSync(path.join(__dirname, 'ARTIFACT_VERIFICATION.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ redactions: redactions.length, cleanupVerified: runtime.every(row => row.cleanupVerified), receipts: files.length }));
if (runtime.some(row => !row.cleanupVerified)) process.exitCode = 1;
