const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const prior = require('../r5-existing-p1/current-method-inventory.json');
const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const rows = [];
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
for (const app of ['skillhubcore-admin', 'skillup-web', 'realtutorialhub-web']) {
  for (const file of walk(path.join(root, 'apps', app, 'src/app/api')).filter(file => file.endsWith('route.ts'))) {
    const source = path.relative(root, file).replaceAll('\\', '/');
    const held = /attendance|payment|marketing/i.test(source);
    if (held) {
      rows.push(...prior.rows.filter(row => row.source === source).map(row => ({ app, source, method: row.method, scope: 'OWNER HOLD', inventoryEvidence: 'Prior exported-method inventory retained. Held source unread.' })));
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const exportedMethods = new Set();
    for (const statement of ast.statements) {
      const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (exported && ts.isFunctionDeclaration(statement) && statement.name && methods.has(statement.name.text)) exportedMethods.add(statement.name.text);
      if (exported && ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (methods.has(declaration.name.getText(ast))) exportedMethods.add(declaration.name.getText(ast));
        }
      }
      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (methods.has(element.name.text)) exportedMethods.add(element.name.text);
        }
      }
    }
    for (const method of exportedMethods) rows.push({ app, source, method, scope: 'INVENTORIED', sha256: crypto.createHash('sha256').update(text).digest('hex') });
  }
}
const before = new Set(prior.rows.map(row => row.source + ':' + row.method));
const after = new Set(rows.map(row => row.source + ':' + row.method));
const result = {
  baseline: '62f920f4782b8bbb277f88dc27930cd3b86f1b15',
  timestamp: new Date().toISOString(),
  count: rows.length,
  added: [...after].filter(key => !before.has(key)),
  removed: [...before].filter(key => !after.has(key)),
  rows,
};
fs.writeFileSync(path.join(__dirname, 'current-method-inventory.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ count: result.count, added: result.added, removed: result.removed }));
