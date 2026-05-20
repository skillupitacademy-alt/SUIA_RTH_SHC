import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('🔍 Auditing "whatisjavascript" subtopic and sections in Database...');
    
    // 1. Get subtopic
    const subtopicRes = await pool.query(
      `SELECT * FROM "tutorial_subtopics" WHERE "slug" = $1 LIMIT 1`,
      ['whatisjavascript']
    );
    
    if (subtopicRes.rows.length === 0) {
      console.log('❌ Subtopic "whatisjavascript" NOT found in "tutorial_subtopics"!');
      return;
    }
    
    const subtopic = subtopicRes.rows[0];
    console.log('✅ Subtopic found:', {
      id: subtopic.id,
      name: subtopic.name,
      slug: subtopic.slug,
      topicId: subtopic.topic_id
    });
    
    // 2. Get sections
    const sectionsRes = await pool.query(
      `SELECT id, section_type, status, difficulty, brand_id, created_at, updated_at FROM "tutorial_sections" WHERE "subtopic_id" = $1`,
      [subtopic.id]
    );
    
    console.log(`\n📚 Found ${sectionsRes.rows.length} sections in "tutorial_sections":`);
    console.table(sectionsRes.rows);
    
    // 3. For each section, check domain child table
    for (const section of sectionsRes.rows) {
      if (section.section_type === 'layman') {
        const laymanRes = await pool.query(
          `SELECT * FROM "tutorial_section_layman" WHERE "section_id" = $1`,
          [section.id]
        );
        console.log(`\n👨‍🌾 Layman child record found: ${laymanRes.rows.length}`);
        if (laymanRes.rows.length > 0) {
          const l = laymanRes.rows[0];
          console.log({
            id: l.id,
            sectionId: l.section_id,
            simpleOverviewKeys: l.simple_overview ? Object.keys(l.simple_overview) : null,
            everydayAnalogyKeys: l.everyday_analogy ? Object.keys(l.everyday_analogy) : null,
            whyItExistsKeys: l.why_it_exists ? Object.keys(l.why_it_exists) : null,
            simpleRecapKeys: l.simple_recap ? Object.keys(l.simple_recap) : null,
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await pool.end();
  }
}

run();
