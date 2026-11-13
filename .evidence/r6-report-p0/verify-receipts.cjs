const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const parse = require('dotenv').parse;
const configuration = Object.assign({}, ...['.env.local', 'apps/api-server/.env.local'].map(file => parse(fs.readFileSync(path.join(root, file)))));
const credentials = Object.entries(configuration).filter(([name, value]) => /SECRET|TOKEN|PASSWORD|DATABASE_URL/i.test(name) && value.length >= 8);
const findings = [];
const receipts = fs.readdirSync(__dirname).filter(file => /\.(?:json|log|md|txt|exit)$/.test(file) && file !== 'RECEIPT_VERIFICATION.json');
for (const file of receipts) {
  const text = fs.readFileSync(path.join(__dirname, file), 'utf8');
  for (const [name, value] of credentials) {
    if (text.includes(value)) findings.push({ file, configuredCredentialName: name });
  }
}
const result = {
  captured: new Date().toISOString(), configuredCredentialFindings: findings,
  limitation: 'Exact configured-secret substring checks only. Synthetic test tokens and invalid credential-bearing URL fixtures are intentional mock inputs.',
  receipts: receipts.map(file => ({ file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex') })),
};
fs.writeFileSync(path.join(__dirname, 'RECEIPT_VERIFICATION.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ receipts: result.receipts.length, configuredCredentialFindings: findings.length }));
if (findings.length) process.exitCode = 1;
