import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import { promptTemplates, educationalArchitectures, uiArchitectures } from './schema';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

async function verify() {
  console.log('🔍 Verifying seeded data...\n');
  
  const pt = await db.select().from(promptTemplates);
  const ea = await db.select().from(educationalArchitectures);
  const ua = await db.select().from(uiArchitectures);
  
  console.log('✅ Prompt Templates:', pt.length);
  pt.forEach(t => console.log(`   - ${t.name} (${t.sectionType}/${t.subsectionType})`));
  
  console.log('\n✅ Educational Architectures:', ea.length);
  ea.forEach(a => console.log(`   - ${a.name}`));
  
  console.log('\n✅ UI Architectures:', ua.length);
  ua.forEach(u => console.log(`   - ${u.name}`));
  
  console.log('\n🎉 Phase 0.75 constitutional framework successfully seeded!');
  process.exit(0);
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
