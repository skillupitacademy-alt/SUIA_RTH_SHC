import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { subtopicContentRegistry } from '../src/share-branding/subtopicContentRegistry';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

// Section type mapping
const SECTION_TYPES = [
  'notes',
  'layman',
  'visual',
  'real_life',
  'technical',
  'code',
  'practice',
  'assignment',
  'project',
  'quiz',
  'summary',
  'interview'
] as const;

async function createSubtopicsAndMigrate() {
  console.log('🚀 Creating Subtopics and Migrating Content...\n');
  
  try {
    // First, we need to get a valid topic_id and subject_id
    // Let's check what exists
    const topics = await sql`
      SELECT id, slug FROM tutorial_topics LIMIT 1;
    `;
    
    if (topics.length === 0) {
      console.log('❌ No topics found in database. Need to create hierarchy first.');
      console.log('   Please create: Domain → Subject → Topic first');
      return;
    }
    
    const topicId = topics[0].id;
    console.log(`✅ Using topic: ${topics[0].slug} (${topicId})\n`);
    
    const subtopicSlugs = Object.keys(subtopicContentRegistry);
    console.log(`📦 Found ${subtopicSlugs.length} subtopics in static registry:`);
    subtopicSlugs.forEach(slug => console.log(`   - ${slug}`));
    console.log('');
    
    for (const slug of subtopicSlugs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${slug}`);
      console.log('='.repeat(60));
      
      const content = subtopicContentRegistry[slug];
      
      // Step 1: Check if subtopic exists
      let existingSubtopic = await sql`
        SELECT id, slug FROM tutorial_subtopics WHERE slug = ${slug};
      `;
      
      let subtopicId: string;
      
      if (existingSubtopic.length === 0) {
        console.log(`❌ Subtopic "${slug}" does NOT exist`);
        console.log(`📝 Creating subtopic...`);
        
        // Create subtopic
        // Generate a title from slug
        const title = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        const newSubtopic = await sql`
          INSERT INTO tutorial_subtopics (
            external_id,
            topic_id,
            name,
            slug,
            difficulty_levels,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${topicId},
            ${title},
            ${slug},
            '["simple"]'::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id;
        `;
        
        subtopicId = newSubtopic[0].id;
        console.log(`✅ Created subtopic (ID: ${subtopicId})`);
      } else {
        subtopicId = existingSubtopic[0].id;
        console.log(`✅ Subtopic already exists (ID: ${subtopicId})`);
      }
      
      // Step 2: Prepare content for each section type
      const sectionContents = {
        notes: {
          simpleWords: content.simpleWords,
          definitionBlock: content.definitionBlock,
          sections: content.sections,
          componentGrid: content.componentGrid,
          examplePanel: content.examplePanel,
          practiceCard: content.practiceCard,
          warningFaq: content.warningFaq,
          summaryCard: content.summaryCard
        },
        layman: content.laymanExplanation || {},
        visual: content.visualExplanation || {},
        real_life: content.realLifeExamples || {},
        technical: content.technicalDeepDive || {},
        code: content.codeExample || {},
        practice: content.practiceTest || {},
        assignment: content.assignment || {},
        project: content.project || {},
        quiz: content.quiz || {},
        summary: content.summary || {},
        interview: content.interview || {}
      };
      
      // Step 3: Insert or update sections
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const sectionType of SECTION_TYPES) {
        const sectionContent = sectionContents[sectionType];
        
        // Skip if no content available
        if (!sectionContent || Object.keys(sectionContent).length === 0) {
          console.log(`   ⚠️  ${sectionType}: No content available, skipping`);
          skippedCount++;
          continue;
        }
        
        // Check if section already exists
        const existingSection = await sql`
          SELECT id, section_type 
          FROM tutorial_sections 
          WHERE subtopic_id = ${subtopicId} 
          AND section_type = ${sectionType}
          AND difficulty = 'simple';
        `;
        
        if (existingSection.length > 0) {
          // Update existing section
          await sql`
            UPDATE tutorial_sections
            SET 
              content = ${JSON.stringify(sectionContent)}::jsonb,
              status = 'approved',
              updated_at = NOW()
            WHERE id = ${existingSection[0].id};
          `;
          console.log(`   ✅ ${sectionType}: Updated (${Object.keys(sectionContent).length} keys)`);
          updatedCount++;
        } else {
          // Insert new section
          await sql`
            INSERT INTO tutorial_sections (
              subtopic_id,
              section_type,
              difficulty,
              content,
              status,
              generated_by_ai,
              brand_id,
              brand_visibility,
              version
            ) VALUES (
              ${subtopicId},
              ${sectionType},
              'simple',
              ${JSON.stringify(sectionContent)}::jsonb,
              'approved',
              false,
              'shared',
              'shared_visible',
              1
            );
          `;
          console.log(`   ✅ ${sectionType}: Inserted (${Object.keys(sectionContent).length} keys)`);
          insertedCount++;
        }
      }
      
      console.log(`\n📊 Summary for ${slug}:`);
      console.log(`   Inserted: ${insertedCount}`);
      console.log(`   Updated: ${updatedCount}`);
      console.log(`   Skipped: ${skippedCount}`);
    }
    
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Migration Complete!');
    console.log('='.repeat(60));
    
    // Verify migration
    console.log('\n🔍 Verifying migration...\n');
    for (const slug of subtopicSlugs) {
      const sections = await sql`
        SELECT section_type, pg_column_size(content) as size_bytes
        FROM tutorial_sections ts
        JOIN tutorial_subtopics sub ON ts.subtopic_id = sub.id
        WHERE sub.slug = ${slug}
        ORDER BY section_type;
      `;
      
      console.log(`${slug}:`);
      sections.forEach((s: any) => {
        const sizeKB = Math.round(s.size_bytes / 1024);
        console.log(`   ${s.section_type}: ${sizeKB}KB`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
createSubtopicsAndMigrate();
