
import { db, tutorialSections } from '../packages/db-tutorial/src';
import { eq, and } from 'drizzle-orm';

async function analyzeDuplication() {
  console.log('--- Database Duplication Analysis ---');
  
  try {
    // 1. Get all sections
    const allSections = await db.select().from(tutorialSections);
    console.log(`Total Sections found: ${allSections.length}`);

    // 2. Group by subtopic and type
    const groups: Record<string, string[]> = {};
    allSections.forEach(s => {
      const key = `${s.subtopicId}_${s.sectionType}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s.brandId);
    });

    // 3. Find duplicates
    let duplicates = 0;
    let shared = 0;
    
    Object.entries(groups).forEach(([key, brands]) => {
      if (brands.includes('shared')) {
        shared++;
      }
      if (brands.length > 1) {
        console.log(`[DUPLICATE] Subtopic_Type: ${key} | Brands: ${brands.join(', ')}`);
        duplicates++;
      }
    });

    console.log('------------------------------------');
    console.log(`Summary:`);
    console.log(`- Unique Subtopic/Types: ${Object.keys(groups).length}`);
    console.log(`- Rows using 'shared': ${shared}`);
    console.log(`- Cases with Brand Overrides (Multi-row): ${duplicates}`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    process.exit(0);
  }
}

analyzeDuplication();
