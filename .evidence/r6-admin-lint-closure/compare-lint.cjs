const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ESLint } = require('eslint');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sourcePaths = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'BASELINE.json'), 'utf8')).sourceHashes);
async function main() {
  const eslint = new ESLint({ cwd: path.join(root, 'apps/skillup-admin') });
  const results = [];
  for (const file of sourcePaths) {
    const before = execFileSync('git', ['show', 'HEAD:' + file], { cwd: root, encoding: 'utf8' });
    const after = fs.readFileSync(path.join(root, file), 'utf8');
    const options = { filePath: path.join(root, file) };
    const [baseline] = await eslint.lintText(before, options);
    const [current] = await eslint.lintText(after, options);
    results.push({ file, before: { errors: baseline.errorCount, warnings: baseline.warningCount, messages: baseline.messages }, after: { errors: current.errorCount, warnings: current.warningCount, messages: current.messages } });
    if (current.errorCount || current.warningCount) throw new Error('Unresolved lint diagnostics');
    if (file.endsWith('/lib/student-invitation.ts')) {
      const emit = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true } }).outputText;
      const tokens = text => {
        const scanner = ts.createScanner(ts.ScriptTarget.ES2022, true, ts.LanguageVariant.Standard, text.replaceAll('(peopleDb)', 'peopleDb'));
        const output = [];
        while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) output.push([scanner.getToken(), scanner.getTokenText()]);
        return JSON.stringify(output);
      };
      const identicalRuntimeTokens = tokens(emit(before)) === tokens(emit(after));
      fs.writeFileSync(path.join(__dirname, 'PRODUCTION_EMIT_COMPARISON.json'), JSON.stringify({ file, identicalRuntimeTokens, normalization: 'Ignore comments/whitespace and redundant parentheses around the existing peopleDb namespace reference' }, null, 2));
      if (!identicalRuntimeTokens) throw new Error('Runtime tokens changed');
    }
  }
  fs.writeFileSync(path.join(__dirname, 'BEFORE_AFTER_LINT.json'), JSON.stringify(results, null, 2));
  console.log('Baseline warnings ' + results.reduce((sum, row) => sum + row.before.warnings, 0) + ', current warnings 0, current errors 0');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
