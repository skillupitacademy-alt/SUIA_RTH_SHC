import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as domainSchema from '../packages/db/src/schema/domain';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: 'packages/db/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema: domainSchema });

const coreSkills = [
  { name: 'System Design', weight: 10, category: 'cognitive', mappingType: 'conceptual' },
  { name: 'API Design', weight: 8, category: 'technical', mappingType: 'technical' },
  { name: 'Problem Solving', weight: 8, category: 'cognitive', mappingType: 'technical' },
  { name: 'Performance Optimization', weight: 7, category: 'technical', mappingType: 'technical' },
  { name: 'Security Awareness', weight: 7, category: 'technical', mappingType: 'technical' },
  { name: 'Code Debugging', weight: 6, category: 'technical', mappingType: 'technical' },
  { name: 'Data Analysis', weight: 6, category: 'technical', mappingType: 'technical' },
  { name: 'Testing & QA', weight: 5, category: 'technical', mappingType: 'technical' },
  { name: 'Version Control', weight: 4, category: 'technical', mappingType: 'technical' },
  { name: 'Agile Methodology', weight: 3, category: 'process', mappingType: 'conceptual' },
];

async function seedWeights() {
  console.log('🚀 Seeding core skill weights (High-Level Categories)...');
  for (const skill of coreSkills) {
    const existing = await db.query.skills.findFirst({
      where: eq(domainSchema.skills.name, skill.name)
    });

    if (existing) {
      await db.update(domainSchema.skills)
        .set({ 
            weight: skill.weight, 
            category: skill.category as 'technical' | 'cognitive' | 'process',
            mappingType: skill.mappingType 
        })
        .where(eq(domainSchema.skills.id, existing.id));
      console.log(`✅ Updated: ${skill.name} (Cat: ${skill.category}, Weight: ${skill.weight})`);
    } else {
      await db.insert(domainSchema.skills).values({
        name: skill.name,
        weight: skill.weight,
        category: skill.category as 'technical' | 'cognitive' | 'process',
        mappingType: skill.mappingType
      });
      console.log(`✨ Created: ${skill.name} (Cat: ${skill.category}, Weight: ${skill.weight})`);
    }
  }
}

seedWeights()
  .then(() => {
    console.log('🏁 Seeding finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
