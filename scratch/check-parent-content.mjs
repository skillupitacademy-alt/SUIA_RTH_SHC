import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('⚡ Inspecting parent tutorial_sections.content...');
    
    const res = await pool.query(
      `SELECT ts.id, ts.section_type, ts.content 
       FROM "tutorial_sections" ts
       JOIN "tutorial_subtopics" sub ON ts.subtopic_id = sub.id
       WHERE sub.slug = 'whatisjavascript'`
    );
    
    for (const row of res.rows) {
      console.log(`\nSection Type: "${row.section_type}"`);
      console.log('Parent ID:', row.id);
      console.log('Content Column:', JSON.stringify(row.content, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

run();
