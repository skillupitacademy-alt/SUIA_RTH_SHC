#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tokensPath = path.join(root, 'tokens.json');
const parityScript = path.join(root, 'scripts', 'security-tests', 'validate-rbac-parity.js');

console.log('RBAC LIVE VALIDATION');
console.log('====================================');

if (!fs.existsSync(tokensPath)) {
  console.error('tokens.json not found. Run scripts/get-access-token.js first.');
  process.exit(1);
}

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const tokenKeys = Object.keys(tokens).filter((key) => typeof tokens[key] === 'string' && tokens[key].length > 0);

if (tokenKeys.length === 0) {
  console.error('tokens.json does not contain any usable tokens.');
  process.exit(1);
}

console.log(`Tokens loaded: ${tokenKeys.join(', ')}`);

if (!fs.existsSync(parityScript)) {
  console.error(`Missing RBAC parity script: ${path.relative(root, parityScript)}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [parityScript], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
