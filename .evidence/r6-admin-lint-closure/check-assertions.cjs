const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const files = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'BASELINE.json'), 'utf8')).sourceHashes).filter(file => file.endsWith('.test.ts'));
function assertions(source) {
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const ast = ts.createSourceFile('test.js', output, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const expressions = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'expect') expressions.push(node.parent.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return expressions;
}
const results = files.map(file => {
  const before = assertions(execFileSync('git', ['show', 'HEAD:' + file], { cwd: root, encoding: 'utf8' }));
  const after = assertions(fs.readFileSync(path.join(root, file), 'utf8'));
  return { file, beforeCount: before.length, afterCount: after.length, assertionsIdentical: JSON.stringify(before) === JSON.stringify(after) };
});
fs.writeFileSync(path.join(__dirname, 'ASSERTION_PRESERVATION.json'), JSON.stringify(results, null, 2));
if (results.some(row => !row.assertionsIdentical)) process.exitCode = 1;
console.log(results);
