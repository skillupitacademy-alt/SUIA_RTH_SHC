import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function checkSubtopicSlugs() {
  console.log('🔍 Checking Subtopic Slugs in Database...\n');
  
  try {
    // Get all subtopics
    const subtopics = await sql`
      SELECT id, slug, created_at
      FROM tutorial_subtopics
      ORDER BY created_at DESC;
    `;
    
    console.log(`✅ Found ${subtopics.length} subtopics in database:\n`);
    
    subtopics.forEach((row: any) => {
      console.log(`   - ${row.slug}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });
    
    // Check which ones have sections
    console.log('\n🔍 Checking which subtopics have sections...\n');
    
    for (const subtopic of subtopics) {
      const sections = await sql`
        SELECT section_type, status
        FROM tutorial_sections
        WHERE subtopic_id = ${subtopic.id}
        ORDER BY section_type;
      `;
      
      console.log(`   ${subtopic.slug}: ${sections.length} sections`);
      if (sections.length > 0) {
        const sectionTypes = sections.map((s: any) => s.section_type).join(', ');
        console.log(`      Types: ${sectionTypes}`);
      }
    }
    
    // Mock data available in subtopicContentRegistry
    console.log('\n\n📦 Mock data available in subtopicContentRegistry.ts:');
    console.log('   - component-architecture');
    console.log('   - whatisjavascript');
    console.log('   - variable');
    
    console.log('\n\n🔍 Matching Analysis:');
    const mockSlugs = ['component-architecture', 'whatisjavascript', 'variable'];
    const dbSlugs = subtopics.map((s: any) => s.slug);
    
    console.log('\n   Mock data that matches DB:');
    mockSlugs.forEach(slug => {
      if (dbSlugs.includes(slug)) {
        console.log(`   ✅ ${slug} - EXISTS in DB`);
      } else {
        console.log(`   ❌ ${slug} - NOT in DB`);
      }
    });
    
    console.log('\n   DB subtopics without mock data:');
    dbSlugs.forEach(slug => {
      if (!mockSlugs.includes(slug)) {
        console.log(`   ⚠️  ${slug} - NO mock data available`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

checkSubtopicSlugs();
