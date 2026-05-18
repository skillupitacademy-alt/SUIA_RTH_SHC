import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

import { validateTutorialSection } from '@quiz/validation';

async function run() {
  try {
    console.log('⚡ Querying tutorial sections for whatisjavascript...');
    
    const subtopicRes = await pool.query(
      `SELECT * FROM "tutorial_subtopics" WHERE "slug" = $1 LIMIT 1`,
      ['whatisjavascript']
    );
    
    if (subtopicRes.rows.length === 0) {
      console.log('❌ Subtopic not found');
      return;
    }
    
    const subtopicId = subtopicRes.rows[0].id;
    
    const sectionsRes = await pool.query(
      `SELECT * FROM "tutorial_sections" WHERE "subtopic_id" = $1 AND "difficulty" = 'simple' AND "status" IN ('approved', 'deployed')`,
      [subtopicId]
    );
    
    console.log(`✅ Found ${sectionsRes.rows.length} published sections.`);
    
    for (const section of sectionsRes.rows) {
      console.log(`\nSection Type: "${section.section_type}"`);
      
      // Load child layman data
      if (section.section_type === 'layman') {
        const laymanRes = await pool.query(
          `SELECT * FROM "tutorial_section_layman" WHERE "section_id" = $1`,
          [section.id]
        );
        if (laymanRes.rows.length > 0) {
          const l = laymanRes.rows[0];
          
          // Re-normalize and map fields in the same way the BFF does
          const content = {
            simpleOverview: l.simple_overview,
            everydayAnalogy: l.everyday_analogy,
            whyItExists: l.why_it_exists,
            simpleUseCases: l.simple_use_cases,
            beginnerBreakdown: l.beginner_breakdown,
            mentalModel: l.mental_model,
            commonConfusions: l.common_confusions,
            simpleRecap: l.simple_recap,
            heroVisualSvg: l.hero_visual_svg,
            analogySvg: l.analogy_svg,
            mentalModelSvg: l.mental_model_svg,
          };
          
          console.log('Validating layman section schema...');
          const validation = validateTutorialSection('layman', content);
          console.log('Schema Validation Success:', validation.success);
          if (!validation.success) {
            console.log('❌ Schema Validation Errors:', validation.issues);
          } else {
            console.log('✅ Layman Content is 100% valid!');
            console.log('Headline:', validation.data.simpleOverview.headline);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

run();
