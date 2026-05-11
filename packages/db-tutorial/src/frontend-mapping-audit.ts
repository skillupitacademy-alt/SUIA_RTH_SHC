import fs from 'fs';
import path from 'path';

async function main() {
  console.log('========================================================');
  console.log('   FRONTEND MAPPING & SCHEMA PARITY AUDIT   ');
  console.log('========================================================');

  const webAppDir = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content');
  const typesFile = path.resolve(__dirname, '../../../packages/types/src/tutorial-content.schema.ts');

  if (!fs.existsSync(typesFile)) {
    console.error('Missing types file:', typesFile);
    return;
  }

  const typesContent = fs.readFileSync(typesFile, 'utf8');
  const sections = ['notes', 'layman', 'real_life', 'technical', 'visual', 'code', 'quiz', 'practice', 'assignment', 'project'];

  console.log('\nChecking Component Registrations in BlockRenderer.tsx...');
  const rendererFile = path.join(webAppDir, 'BlockRenderer.tsx');
  const rendererContent = fs.readFileSync(rendererFile, 'utf8');

  sections.forEach(section => {
    const isRegistered = rendererContent.includes(`case '${section}':`);
    console.log(`- ${section.padEnd(12)}: ${isRegistered ? '✅ Registered' : '❌ MISSING'}`);
  });

  console.log('\nAudit complete.');
}

main().catch(console.error);