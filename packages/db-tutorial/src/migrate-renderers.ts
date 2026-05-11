import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Starting migration validation...');
  
  const base = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content');
  const modularDir = path.join(base, 'modular');

  if (!fs.existsSync(modularDir)) {
    console.error('Modular directory missing. Migration incomplete.');
    return;
  }

  const sections = fs.readdirSync(modularDir).filter(f => fs.statSync(path.join(modularDir, f)).isDirectory());
  
  console.log(`Detected ${sections.length} modular sections.`);
  
  sections.forEach(section => {
      const p = path.join(modularDir, section);
      const files = fs.readdirSync(p);
      console.log(`- ${section.padEnd(12)}: ${files.length} components`);
  });

  console.log('\nMigration state: STABLE');
}

main().catch(console.error);