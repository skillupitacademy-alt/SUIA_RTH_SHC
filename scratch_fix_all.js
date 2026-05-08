const fs = require('fs');
let lines = fs.readFileSync('src/share-branding/subtopicContentRegistry.ts', 'utf-8').split('\n');

// Validate total lines
if (lines.length !== 5335) {
  console.error('ERROR: Expected 5335 lines, got', lines.length, '- aborting to prevent corruption');
  process.exit(1);
}

// All block ranges are [start, end] in 1-indexed line numbers (inclusive).
// The leading comma separator line (the "  ," line before each duplicate) is at start-1.
// We remove from that comma line to the end of the block.
// Perform splices BOTTOM TO TOP so indices don't shift.

// visual #2: lines 4377-4634 (including the "  ," separator at 4377)
lines.splice(4376, 4634 - 4376); // removes lines 4377..4634

// visual #1: lines 4119-4376 (including the "  ," separator at 4119)
lines.splice(4118, 4376 - 4118); // removes lines 4119..4376

// assignment #3: lines 3632-3660 (including the "  ," separator at 3632)
lines.splice(3631, 3660 - 3631); // removes lines 3632..3660

// assignment #2: lines 3617-3631 (including the "  ," separator at 3617)
lines.splice(3616, 3631 - 3616); // removes lines 3617..3631

// technicalDeepDive #2: lines 3468-3591 (including the "  ," separator at 3468)
lines.splice(3467, 3591 - 3467); // removes lines 3468..3591

// realLifeExamples #2: lines 3051-3210 (including the "  ," separator at 3051)
lines.splice(3050, 3210 - 3050); // removes lines 3051..3210

// Also fix codeExample at line 1316 (after splices above haven't touched this range yet)
// codeExample is at original line 1316. We need to wrap it in basicCodeExample.
// First find it again (indices may have shifted slightly due to earlier operations)
const idx = lines.findIndex((l, i) => i >= 1314 && i <= 1320 && l.trim() === 'codeExample: {');
if (idx === -1) {
  console.error('Could not find codeExample block to fix');
  process.exit(1);
}

// Find the old-style fields and replace with basicCodeExample wrapper
// Old block: codeExample: { title: ..., description: ..., examples: [...], code: `...`, output: ..., tip: ... }
// Find the end of the codeExample block
let depth = 0;
let started = false;
let blockEnd = -1;
for (let i = idx; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') { depth++; started = true; }
    if (ch === '}') { depth--; }
  }
  if (started && depth === 0) { blockEnd = i; break; }
}

if (blockEnd === -1) {
  console.error('Could not find end of codeExample block');
  process.exit(1);
}

// Extract the code content lines (between backticks)
const codeLines = [];
let inCode = false;
for (let i = idx + 1; i < blockEnd; i++) {
  const trimmed = lines[i].trimEnd();
  if (!inCode && trimmed.trim().startsWith('code: `')) {
    inCode = true;
    codeLines.push(trimmed.replace(/^\s*code: `/, ''));
    continue;
  }
  if (inCode) {
    if (trimmed.includes('`,')) {
      codeLines.push(trimmed.replace(/`,.*$/, ''));
      inCode = false;
    } else {
      codeLines.push(trimmed);
    }
    continue;
  }
}

const codeContent = codeLines.join('\n');
const indent = '    ';

const newBlock = [
  `${indent}codeExample: {`,
  `${indent}  basicCodeExample: {`,
  `${indent}    title: 'Code Example',`,
  `${indent}    description: 'See how Component Architecture works in real code. Try it, run it, and observe the output.',`,
  `${indent}    language: 'jsx',`,
  `${indent}    code: \`${codeContent}\`,`,
  `${indent}    explanation: 'Change name = "Your Name" on line 16 to see the component update in real-time.'`,
  `${indent}  }`,
  `${indent}},`,
];

lines.splice(idx, blockEnd - idx + 1, ...newBlock);

// Make codeExample nested properties optional in SubtopicContentPattern interface
// Find the interface codeExample block
const ifaceIdx = lines.findIndex((l, i) => i < 400 && l.trim() === 'codeExample?: {');
if (ifaceIdx !== -1) {
  for (let i = ifaceIdx + 1; i < ifaceIdx + 80 && i < lines.length; i++) {
    // Make top-level properties within codeExample optional
    lines[i] = lines[i].replace(/^(\s+)(problemContext|basicCodeExample|lineByLineExplanation|outputDemonstration|bestPracticeVersion|commonMistakes|realWorldImplementation|codeSummary)(: \{)/, '$1$2?$3');
  }
}

fs.writeFileSync('src/share-branding/subtopicContentRegistry.ts', lines.join('\n'));
console.log('Done. Final line count:', lines.length);
