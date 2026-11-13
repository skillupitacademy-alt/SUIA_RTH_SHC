const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const apps = ['skillhubcore-admin', 'skillup-web', 'realtutorialhub-web'];
const methods = new Set(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']);
const rows = [];
const traces = [];
const prior = require('../r4-acceptance-20261112/anonymous-method-matrix-results.json').results;
const held = value => /(?:attendance|payment|marketing)/i.test(value);
function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(directory,entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const relative = file => path.relative(root,file).replaceAll('\\','/');
function facts(file) {
  const text = fs.readFileSync(file,'utf8');
  const ast = ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
  const imports = []; const calls = new Set(); const strings = new Set();
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node)) calls.add(node.expression.getText(ast));
    if (ts.isStringLiteral(node) && /^(?:\/?api\/|TUTORIAL_|PROFILE_|USER_|QUESTION_|ACADEMIC_)/.test(node.text)) strings.add(node.text);
    ts.forEachChild(node,visit);
  }
  visit(ast);
  return {source:relative(file),sha256:crypto.createHash('sha256').update(text).digest('hex'),imports,calls:[...calls],contracts:[...strings],text,ast};
}
for (const app of apps) {
  const sourceRoot = path.join(root,'apps',app,'src');
  const allFiles = walk(sourceRoot).filter(file=>/\.(tsx?|jsx?)$/.test(file)&&!file.includes('__tests__')&&!/\.test\./.test(file)&&!held(relative(file)));
  const callerFiles = allFiles.filter(file=>!file.endsWith('route.ts')).map(file=>({path:relative(file),text:fs.readFileSync(file,'utf8')}));
  const routes = walk(path.join(sourceRoot,'app/api')).filter(file=>file.endsWith('route.ts'));
  for (const file of routes) {
    const source = relative(file);
    const route = '/api' + relative(file).split('/src/app/api')[1].replace(/\/route\.ts$/,'');
    const hold = held(route);
    // HOLD paths are inventoried by filename only. No module source is read.
    const item = hold ? null : facts(file);
    let exports = [];
    if (hold) exports = prior.filter(row=>row.sourcePath===source).map(row=>row.method);
    else for (const statement of item.ast.statements) {
      const exported = statement.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword);
      if (exported && ts.isFunctionDeclaration(statement) && statement.name && methods.has(statement.name.text)) exports.push(statement.name.text);
      if (exported && ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (methods.has(declaration.name.getText(item.ast))) exports.push(declaration.name.getText(item.ast));
      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) for (const element of statement.exportClause.elements) if (methods.has(element.name.text)) exports.push(element.name.text);
    }
    if (!hold) traces.push({source:item.source,sha256:item.sha256,imports:item.imports,calls:item.calls,contracts:item.contracts});
    for (const method of [...new Set(exports)]) {
      const old = prior.find(row=>row.sourcePath===source&&row.method===method);
      const publicAuth = /\/auth\/(?:login|logout|signup|refresh|forgot-password|reset-password|verify-email)$/.test(route);
      const publicRead = /^\/api\/(?:healthz?$|programs(?:\/|$)|certificates\/verify\/)/.test(route);
      const retired = /\/tutorial\/content\//.test(route) || route === '/api/content-manager/add-section';
      const worker = route.startsWith('/api/workers/');
      const upstream = item?.contracts.filter(value=>/^(?:\/?api\/)/.test(value)) ?? [];
      const permissions = item ? [...item.text.matchAll(/PERMISSIONS\.([A-Z_]+)/g)].map(match=>match[1]) : [];
      const policyCalls = item?.calls.filter(value=>/auth|require|permission|ownership|origin|signature|session|brand/i.test(value)) ?? [];
      const callerPattern = route.replace(/\[[^\]]+\]/g,'');
      const callers = hold ? [] : callerFiles.filter(file=>file.text.includes(route)|| (route.includes('[')&&file.text.includes(callerPattern.replace(/\/$/,'')))).map(file=>file.path);
      rows.push({app,source,method,route,scope:hold?'OWNER HOLD':'ACTIVE',classification:hold?'HOLD':retired?'RETIRED':worker?'SIGNED WORKER':publicAuth?'PUBLIC AUTH':publicRead?'PUBLIC READ':'PRIVATE',
        frontend_caller:callers.join(' | ')||'PENDING exact caller trace',bff:source,gateway:upstream.length?'services/api-gateway/src/index.ts or configured direct backend transport':'Local handler — inspect trace',
        upstream:upstream.join(' | ')||'PENDING/local repository',authority:policyCalls.join(' | ')||'PENDING delegated helper',role_permission:permissions.join(' | ')||'PENDING delegated/current-role contract',
        tenant_brand:app==='skillhubcore-admin'?'SHC principal; authorized shared content scopes':'Signed current '+(app==='skillup-web'?'skillup':'realtutorialhub')+' session',
        membership_ownership:'PENDING per-resource evidence',csrf_origin:worker?'Signature authority':['GET','HEAD','OPTIONS'].includes(method)?'Read-only method':'Common proxy origin + handler policy — verify resource case',
        cache_policy:'PENDING private-response evidence',prior_anonymous:old?`R4 ${old.actual??old.disposition}; evidence tied to prior source`: 'No prior receipt',
        positive_evidence:'PENDING',negative_evidence:'PENDING',status:retired?'N/A':'PENDING',gap:hold?'OWNER HOLD — no R5 execution':retired?'Retired source retained; no learning content operation':'Authenticated role/tenant/object cases require mapped evidence'});
    }
  }
}
const output = path.join(__dirname,'current-method-inventory.json');
fs.writeFileSync(output,JSON.stringify({head:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),counts:Object.fromEntries(apps.map(app=>[app,rows.filter(row=>row.app===app).length])),rows,traces},null,2));
const columns=Object.keys(rows[0]);
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
fs.writeFileSync(path.join(__dirname,'AUTHENTICATED_AUTHORIZATION_MATRIX.csv'),[columns.join(','),...rows.map(row=>columns.map(column=>quote(row[column])).join(','))].join('\r\n')+'\r\n');
console.log(JSON.stringify({methods:rows.length,held:rows.filter(row=>row.scope==='OWNER HOLD').length,counts:Object.fromEntries(apps.map(app=>[app,rows.filter(row=>row.app===app).length]))}));
