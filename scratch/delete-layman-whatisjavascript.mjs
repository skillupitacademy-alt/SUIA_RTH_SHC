import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('⚡ Querying layman section ID for whatisjavascript...');
    const res = await pool.query(
      `SELECT ts.id 
       FROM "tutorial_sections" ts
       JOIN "tutorial_subtopics" sub ON ts.subtopic_id = sub.id
       WHERE sub.slug = 'whatisjavascript' AND ts.section_type = 'layman'`
    );
    
    if (res.rows.length === 0) {
      console.log('❌ Layman section record not found for whatisjavascript.');
      return;
    }
    
    const sectionId = res.rows[0].id;
    console.log(`🗑️ Deleting layman section ID: ${sectionId}...`);
    
    await pool.query(`DELETE FROM "tutorial_sections" WHERE id = $1`, [sectionId]);
    console.log('✅ Layman section successfully deleted!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

run();
