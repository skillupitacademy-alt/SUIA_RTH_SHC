const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const methods=new Set(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']);
const inventory=[];
function visitFiles(directory,app) {
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const full=path.join(directory,entry.name);
    if(entry.isDirectory()) visitFiles(full,app);
    else if(entry.name==='route.ts') {
      const source=ts.createSourceFile(full,fs.readFileSync(full,'utf8'),ts.ScriptTarget.Latest,true);
      for(const node of source.statements) {
        if(!node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)) continue;
        const names=[];
        if(ts.isFunctionDeclaration(node) && node.name) names.push(node.name.text);
        if(ts.isVariableStatement(node)) for(const declaration of node.declarationList.declarations) {
          if(ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
          else for(const binding of declaration.name.elements) if(ts.isBindingElement(binding) && ts.isIdentifier(binding.name)) names.push(binding.name.text);
        }
        const calls=new Set();
        function collect(child) {
          if(ts.isCallExpression(child)) {
            const name=child.expression.getText(source);
            if(/auth|permission|origin|csrf|signature|entitlement|ownership|access|session/i.test(name)) calls.add(name);
          }
          ts.forEachChild(child,collect);
        }
        collect(node);
        for(const method of names.filter(n=>methods.has(n))) inventory.push({app,path:path.relative(root,full).replace(/\\/g,'/'),method,line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,observedCalls:[...calls],qualification:'NOT inferred from source guard names; method/role/object/runtime coverage still requires mapped evidence'});
      }
    }
  }
}
for(const app of ['skillhubcore-admin','skillup-web','realtutorialhub-web'])visitFiles(path.join(root,'apps',app,'src/app'),app);
fs.writeFileSync(path.join(__dirname,'security-method-inventory.json'),JSON.stringify({boundary:'Mechanical TypeScript AST inventory of locally exported HTTP handlers at reviewed HEAD plus R3 changes. Not a security certification, does not resolve imported/re-exported handler internals or establish runtime coverage.',counts:Object.fromEntries(['skillhubcore-admin','skillup-web','realtutorialhub-web'].map(app=>[app,inventory.filter(r=>r.app===app).length])),inventory},null,2));
console.log(JSON.stringify({methods:inventory.length,files:new Set(inventory.map(r=>r.path)).size}));
