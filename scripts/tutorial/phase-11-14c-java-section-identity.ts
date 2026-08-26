import 'dotenv/config';
import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('\n============================================================');
  console.log('JAVA TUTORIAL SECTION IDENTITY');
  console.log('============================================================\n');

  const result = await db.execute(sql`
    SELECT
      ts.id AS section_id,
      ts.subtopic_id,
      ts.navigation_node_id,
      ts.brand_id,
      ts.brand_visibility,
      ts.status,
      ts.version,
      ts.language,
      ts.published_at,
      ts.deleted_at,
      st.name AS subtopic_name,
      st.slug AS subtopic_slug,
      t.id AS topic_id,
      t.name AS topic_name,
      t.slug AS topic_slug,
      s.id AS subject_id,
      s.name AS subject_name,
      s.slug AS subject_slug,
      d.id AS domain_id,
      d.name AS domain_name,
      d.slug AS domain_slug
    FROM tutorial_sections ts
    JOIN tutorial_subtopics st
      ON st.id = ts.subtopic_id
    JOIN tutorial_topics t
      ON t.id = st.topic_id
    JOIN tutorial_subjects s
      ON s.id = t.subject_id
    JOIN tutorial_domains d
      ON d.id = s.domain_id
    WHERE st.slug = 'whatisjava'
      AND ts.deleted_at IS NULL
    ORDER BY ts.version DESC, ts.created_at DESC
  `);

  console.log(`Found ${result.rows.length} section(s).\n`);

  for (const row of result.rows as any[]) {
    console.log('Section:');
    console.log(`  section_id:         ${row.section_id}`);
    console.log(`  navigation_node_id: ${row.navigation_node_id}`);
    console.log(`  brand_id:           ${row.brand_id}`);
    console.log(`  brand_visibility:   ${row.brand_visibility}`);
    console.log(`  status:             ${row.status}`);
    console.log(`  version:            ${row.version}`);
    console.log(`  language:           ${row.language}`);
    console.log(`  published_at:       ${row.published_at}`);
    console.log('');
    console.log('Hierarchy:');
    console.log(`  Domain:    ${row.domain_name} (${row.domain_slug})`);
    console.log(`  Subject:   ${row.subject_name} (${row.subject_slug})`);
    console.log(`  Topic:     ${row.topic_name} (${row.topic_slug})`);
    console.log(`  Subtopic:  ${row.subtopic_name} (${row.subtopic_slug})`);
    console.log('');
  }

  if (result.rows.length === 0) {
    console.log('STATE: No tutorial_sections records exist for Java subtopic');
    console.log('');
    console.log('This means:');
    console.log('  ✅ Curriculum exists (Domain → Subject → Topic → Subtopic)');
    console.log('  ❌ No sidebar exists');
    console.log('  ❌ No navigation nodes exist');
    console.log('  ❌ No tutorial content exists');
    console.log('');
    console.log('CLASSIFICATION: DATA_PROVISIONING_PROBLEM');
    console.log('Java has curriculum identity but no Tutorial V2 content.');
  } else {
    console.log('STATE: Tutorial section(s) exist for Java');
    console.log('');
    console.log('This requires further investigation:');
    console.log('  - Does navigation_node_id correspond to an actual navigation node?');
    console.log('  - Why does no sidebar exist for this topic?');
    console.log('  - Is there a broken navigation/content relationship?');
  }

  console.log('============================================================\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
