import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('⚡ Removing empty syntaxBlock.image for subtopic "whatisjavascript"...');
    
    // 1. Fetch current content
    const res = await pool.query(
      `SELECT ts.id, ts.content 
       FROM "tutorial_sections" ts
       JOIN "tutorial_subtopics" sub ON ts.subtopic_id = sub.id
       WHERE sub.slug = 'whatisjavascript' AND ts.section_type = 'notes'`
    );
    
    if (res.rows.length === 0) {
      console.log('❌ Notes section not found for whatisjavascript');
      return;
    }
    
    const row = res.rows[0];
    const content = row.content;
    
    if (content && content.syntaxBlock) {
      console.log('Current syntaxBlock keys:', Object.keys(content.syntaxBlock));
      if (content.syntaxBlock.image) {
        console.log('Found image under syntaxBlock. Deleting it...');
        delete content.syntaxBlock.image;
        
        // Update database
        await pool.query(
          `UPDATE "tutorial_sections" SET "content" = $1 WHERE "id" = $2`,
          [JSON.stringify(content), row.id]
        );
        console.log('✅ Successfully removed syntaxBlock.image and updated DB!');
      } else {
        console.log('ℹ️ syntaxBlock does not have an image key.');
      }
    } else {
      console.log('ℹ️ No syntaxBlock found in content.');
    }
    
  } catch (error) {
    console.error('❌ Error updating DB:', error);
  } finally {
    await pool.end();
  }
}

run();
