import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function checkSectionsDetail() {
  console.log('🔍 Checking Tutorial Sections Detail...\n');
  
  try {
    // Get sample sections with subtopic info
    const sections = await sql`
      SELECT 
        ts.id,
        ts.section_type,
        ts.difficulty,
        ts.status,
        ts.generated_by_ai,
        ts.brand_id,
        sub.slug as subtopic_slug,
        jsonb_typeof(ts.content) as content_type,
        pg_column_size(ts.content) as content_size_bytes
      FROM tutorial_sections ts
      LEFT JOIN tutorial_subtopics sub ON ts.subtopic_id = sub.id
      ORDER BY sub.slug, ts.section_type
      LIMIT 30;
    `;
    
    console.log('📋 Sample Sections in Database:\n');
    sections.forEach((row: any) => {
      console.log(`   ${row.subtopic_slug || 'unknown'} | ${row.section_type} | ${row.difficulty}`);
      console.log(`      Status: ${row.status} | AI: ${row.generated_by_ai} | Brand: ${row.brand_id}`);
      console.log(`      Content: ${row.content_type} (${Math.round(row.content_size_bytes / 1024)}KB)`);
      console.log('');
    });
    
    // Check if there's actual content
    console.log('\n🔍 Checking content structure for visual section...');
    const visualSection = await sql`
      SELECT 
        ts.section_type,
        sub.slug as subtopic_slug,
        ts.content
      FROM tutorial_sections ts
      LEFT JOIN tutorial_subtopics sub ON ts.subtopic_id = sub.id
      WHERE ts.section_type = 'visual'
      LIMIT 1;
    `;
    
    if (visualSection.length > 0) {
      console.log(`\n   Found visual section for: ${visualSection[0].subtopic_slug}`);
      console.log(`   Content keys: ${Object.keys(visualSection[0].content || {}).join(', ')}`);
      
      if (visualSection[0].content?.visualExplanation) {
        console.log(`   ✅ Has visualExplanation data`);
        console.log(`   Sub-components: ${Object.keys(visualSection[0].content.visualExplanation).join(', ')}`);
      } else {
        console.log(`   ❌ No visualExplanation data found`);
      }
    }
    
    // Check practice section
    console.log('\n🔍 Checking content structure for practice section...');
    const practiceSection = await sql`
      SELECT 
        ts.section_type,
        sub.slug as subtopic_slug,
        ts.content
      FROM tutorial_sections ts
      LEFT JOIN tutorial_subtopics sub ON ts.subtopic_id = sub.id
      WHERE ts.section_type = 'practice'
      LIMIT 1;
    `;
    
    if (practiceSection.length > 0) {
      console.log(`\n   Found practice section for: ${practiceSection[0].subtopic_slug}`);
      console.log(`   Content keys: ${Object.keys(practiceSection[0].content || {}).join(', ')}`);
      
      if (practiceSection[0].content?.practiceTest) {
        console.log(`   ✅ Has practiceTest data`);
        console.log(`   Sub-components: ${Object.keys(practiceSection[0].content.practiceTest).join(', ')}`);
      } else {
        console.log(`   ❌ No practiceTest data found`);
      }
    }
    
    // Check subsections table
    console.log('\n\n🔍 Checking tutorial_subsections table...');
    const subsectionsCount = await sql`
      SELECT COUNT(*) as count FROM tutorial_subsections;
    `;
    console.log(`   Total subsections: ${subsectionsCount[0].count}`);
    
    if (subsectionsCount[0].count > 0) {
      const subsectionTypes = await sql`
        SELECT subsection_type, COUNT(*) as count 
        FROM tutorial_subsections 
        GROUP BY subsection_type 
        ORDER BY count DESC
        LIMIT 10;
      `;
      
      console.log('\n   Top subsection types:');
      subsectionTypes.forEach((row: any) => {
        console.log(`   - ${row.subsection_type}: ${row.count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

checkSectionsDetail();
