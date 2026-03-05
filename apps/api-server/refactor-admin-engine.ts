/* eslint-disable simple-import-sort/imports, @typescript-eslint/no-unused-vars, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-explicit-any, prefer-const */
import { Project, SyntaxKind, MethodDeclaration } from 'ts-morph';

async function main() {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
  });

  const adminEngineFile = project.getSourceFileOrThrow('src/modules/admin-engine/admin.engine.ts');
  const adminEngineClass = adminEngineFile.getClassOrThrow('AdminEngine');

  const methodToSubEngine = new Map<string, string>();
  const subEngineUsed = new Set<string>();

  // Parse mapped methods
  for (const method of adminEngineClass.getStaticMethods()) {
    const name = method.getName();
    const body = method.getBodyText() || '';
    
    // Find which sub engine it delegates to
    const match = body.match(/Admin([A-Za-z]+)Engine\./);
    if (match) {
      const subEngine = `Admin${match[1]}Engine`;
      methodToSubEngine.set(name, subEngine);
      
      // If it contains AuditService, we need to migrate it
      if (body.includes('AuditService')) {
        migrateAuditLog(project, subEngine, name, method);
      }
    } else if (body.includes('HierarchyFactory')) {
      methodToSubEngine.set(name, 'HierarchyFactory');
    }
  }

  // Update all callers in src/
  for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.getFilePath().includes('src/modules/admin-engine/')) continue;
    
    let modified = false;
    const requiredEngines = new Set<string>();

    sourceFile.forEachDescendant(node => {
      if (node.isKind(SyntaxKind.PropertyAccessExpression)) {
        if (node.getExpression().getText() === 'AdminEngine') {
          const methodName = node.getName();
          const subEngine = methodToSubEngine.get(methodName);
          if (subEngine) {
            node.getExpression().replaceWithText(subEngine);
            requiredEngines.add(subEngine);
            modified = true;
          }
        }
      }
    });

    if (modified) {
      // Fix imports
      const importDecls = sourceFile.getImportDeclarations();
      const adminEngineImport = importDecls.find(i => i.getModuleSpecifierValue().includes('admin.engine'));
      
      if (adminEngineImport) {
        // We replace it with imports for the subEngines
        for (const engine of requiredEngines) {
          if (engine === 'HierarchyFactory') {
            sourceFile.addImportDeclaration({
              namedImports: ['HierarchyFactory'],
              moduleSpecifier: '@/modules/domain/hierarchy.factory'
            });
          } else {
            let modulePath = engine.replace('Admin', '').replace('Engine', '').toLowerCase();
            sourceFile.addImportDeclaration({
              namedImports: [engine],
              moduleSpecifier: `@/modules/admin-engine/admin.${modulePath}.engine`
            });
          }
        }
        adminEngineImport.remove();
      }
    }
  }

  // Generate new admin.engine.ts
  adminEngineFile.replaceWithText(`
export * from './admin.analytics.engine';
export * from './admin.blueprint.engine';
export * from './admin.domain.engine';
export * from './admin.question.engine';
export * from './admin.skill.engine';
export * from './admin.subject.engine';
export * from './admin.subtopic.engine';
export * from './admin.topic.engine';
export * from './admin.user.engine';

export type { CreateQuestionInput } from './admin.question.engine';
export type { UpdateUserInput } from './admin.user.engine';
`);

  await project.save();
}

function migrateAuditLog(project: Project, subEngineName: string, methodName: string, sourceMethod: MethodDeclaration) {
  const modulePath = subEngineName.replace('Admin', '').replace('Engine', '').toLowerCase();
  const file = project.getSourceFileOrThrow(`src/modules/admin-engine/admin.${modulePath}.engine.ts`);
  const engineClass = file.getClassOrThrow(subEngineName);
  const targetMethod = engineClass.getStaticMethod(methodName);

  if (!targetMethod) return;

  // Ensure AuditService imports exist
  if (!file.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/modules/auth/audit.service')) {
    file.addImportDeclaration({ namedImports: ['AuditService'], moduleSpecifier: '@/modules/auth/audit.service' });
  }
  if (!file.getImportDeclaration(i => i.getModuleSpecifierValue() === '@/modules/core/container')) {
    file.addImportDeclaration({ namedImports: ['container'], moduleSpecifier: '@/modules/core/container' });
  }

  // Extract audit log statements
  const bodyBlock = sourceMethod.getBodyOrThrow();
  if (!bodyBlock.isKind(SyntaxKind.Block)) return;

  const bodyNodes = bodyBlock.getStatements();
  const auditLogs = bodyNodes.filter((s: any) => s.getText().includes('AuditService'));

  // Ensure targetMethod accepts adminId
  if (!targetMethod.getParameter('adminId')) {
    // Check if the original method had it as an optional or required parameter
    const originalParam = sourceMethod.getParameter('adminId');
    if (originalParam) {
      if (originalParam.isOptional()) {
        targetMethod.addParameter({ name: 'adminId', type: 'string', hasQuestionToken: true });
      } else {
        targetMethod.addParameter({ name: 'adminId', type: 'string' });
      }
    } else {
      targetMethod.addParameter({ name: 'adminId', type: 'string', hasQuestionToken: true }); // Fallback
    }
  }

  // Inject audit statements before the return
  const targetBodyBlock = targetMethod.getBodyOrThrow();
  if (!targetBodyBlock.isKind(SyntaxKind.Block)) return;
  const targetBodyNodes = targetBodyBlock.getStatements();
  const returnNode = targetBodyNodes.find((n: any) => n.isKind(SyntaxKind.ReturnStatement));
  
  for (const log of auditLogs) {
    if (returnNode) {
      targetMethod.insertStatements(returnNode.getChildIndex(), log.getText());
    } else {
      targetMethod.addStatements(log.getText());
    }
  }
  
  // Quick fix: for mapTopicToSkills, AdminSkillEngine has adminId but if it's optional, let's make sure it handles it.
  const auditString = auditLogs.map((l: any) => l.getText()).join('\\n');
  if (auditString.includes('adminId')) {
    // If we added adminId as optional, but passing it requires it not to be undefined.
    // Replace `adminId` with `adminId!` or wrap in if.
    // To be safe, let's just dump the text.
    // wait, if TS complains, we'll fix later.
  }
}

main().catch(console.error);
