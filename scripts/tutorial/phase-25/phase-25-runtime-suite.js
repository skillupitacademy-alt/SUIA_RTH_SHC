'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const TESTS = [
  {
    name: 'Runtime Contract',
    file: 'phase-25-runtime-contract-test.js',
  },
  {
    name: 'Runtime Routes',
    file: 'phase-25-route-test.js',
  },
  {
    name: 'Progress API',
    file: 'phase-25-progress-test.js',
  },
];

const root = path.resolve(__dirname);

console.log('');
console.log(
  '============================================================'
);
console.log(
  'PHASE 2.5 FINAL RUNTIME SUITE'
);
console.log(
  '============================================================'
);

const results = [];

for (const test of TESTS) {
  console.log('');
  console.log(
    `>>> Running ${test.name}`
  );

  const result = spawnSync(
    process.execPath,
    [path.join(root, test.file)],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );

  const passed =
    result.status === 0;

  results.push({
    ...test,
    passed,
    exitCode: result.status,
  });
}

console.log('');
console.log(
  '============================================================'
);
console.log(
  'FINAL RESULT'
);
console.log(
  '============================================================'
);

for (const result of results) {
  console.log(
    `${result.passed ? 'PASS' : 'FAIL'}  ${result.name}` +
    ` (exit=${result.exitCode})`
  );
}

const failures =
  results.filter(
    result => !result.passed
  );

console.log('');

if (failures.length > 0) {
  console.error(
    `RUNTIME SUITE FAILED: ${failures.length} test group(s)`
  );

  process.exitCode = 1;
} else {
  console.log(
    'RUNTIME SUITE PASSED.'
  );
}
