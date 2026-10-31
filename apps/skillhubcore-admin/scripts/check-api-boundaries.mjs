import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = path.join(appRoot, 'src/app/api');
const methods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const errors = [];
let checked = 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

// A regression tripwire, not a substitute for runtime authorization tests.
// Public exceptions are method-specific, so a new health mutation cannot inherit one.
for (const file of walk(apiRoot).filter(file => file.endsWith('/route.ts') || file.endsWith('\\route.ts'))) {
  const relative = path.relative(apiRoot, file).replaceAll('\\', '/');
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  for (const statement of source.statements) {
    const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (methods.has(declaration.name.getText(source))) errors.push(`${relative}: use an explicitly guarded function export`);
      }
    }
    if (!ts.isFunctionDeclaration(statement) || !statement.name || !methods.has(statement.name.text)) continue;
    const method = statement.name.text;
    checked++;
    if (relative === 'health/route.ts' && method === 'GET') continue;
    const publicAuth = ['auth/login/route.ts', 'auth/logout/route.ts'].includes(relative) && method === 'POST';
    const requiredGuard = publicAuth ? 'requireAdminMutationOrigin' : 'requireAdminRequest';
    const first = statement.body?.statements[0];
    const second = statement.body?.statements[1];
    const declaration = first && ts.isVariableStatement(first) ? first.declarationList.declarations[0] : undefined;
    let initializer = declaration?.initializer;
    if (initializer && ts.isAwaitExpression(initializer)) initializer = initializer.expression;
    const guarded = initializer && ts.isCallExpression(initializer) && initializer.expression.getText(source) === requiredGuard;
    const guardName = declaration?.name.getText(source);
    const returnsDenial = second && ts.isIfStatement(second) && second.expression.getText(source) === guardName &&
      ts.isReturnStatement(second.thenStatement) && second.thenStatement.expression?.getText(source) === guardName;
    if (!guarded || !returnsDenial) errors.push(`${relative} ${method}: must reject via ${requiredGuard} before handler work`);
  }
  if (text.includes('x-tutorial-dev-bypass') || text.includes('TUTORIAL_COMPOSER_DEV_AUTH_BYPASS')) {
    errors.push(`${relative}: development authentication bypass must not return`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${checked} SHC API handlers: explicit auth/origin guards; only GET /api/health is public.`);
}
