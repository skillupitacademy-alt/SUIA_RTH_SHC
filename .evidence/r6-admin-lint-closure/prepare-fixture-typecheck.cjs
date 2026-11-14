const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'run-quality.cjs'), 'utf8');
const start = source.indexOf('const jobs=');
const end = source.indexOf('\nlet results=', start);
const jobs = [['fixture-typecheck', ['exec', 'tsc', '--noEmit', '-p', '.evidence/r6-admin-lint-closure/tests.tsconfig.json']]];
fs.writeFileSync(path.join(__dirname, 'run-fixture-typecheck.cjs'), (source.slice(0, start) + 'const jobs=' + JSON.stringify(jobs) + ';' + source.slice(end)).replaceAll('QUALITY_RESULTS.json', 'FIXTURE_TYPECHECK_RESULT.json'));
