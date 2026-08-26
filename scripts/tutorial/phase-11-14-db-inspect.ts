import 'dotenv/config';
import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

async function inspect() {
  console.log('Checking tutorial_subtopics for Java...');
  const subtopics = await db.execute(sql`SELECT id, name, slug FROM tutorial_subtopics WHERE slug LIKE '%java%'`);
  console.log(JSON.stringify(subtopics.rows, null, 2));
  
  console.log('\nChecking tutorial_sidebar_trees_v2...');
  const sidebars = await db.execute(sql`SELECT id, brand_id, subtopic_id FROM tutorial_sidebar_trees_v2 LIMIT 5`);
  console.log(JSON.stringify(sidebars.rows, null, 2));
  
  console.log('\nChecking tutorial_sections count...');
  const sections = await db.execute(sql`SELECT COUNT(*) as count FROM tutorial_sections WHERE deleted_at IS NULL`);
  console.log(JSON.stringify(sections.rows, null, 2));
}

inspect();
