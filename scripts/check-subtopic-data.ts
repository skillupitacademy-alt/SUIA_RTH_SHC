/**
 * Check if component-architecture subtopic exists in database
 * Usage: npx tsx scripts/check-subtopic-data.ts
 */

import 'dotenv/config';
import { db } from '@quiz/db-tutorial';
import { tutorialSubtopics, tutorialSections } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

async function checkSubtopicData() {
  try {
    console.log('🔍 Checking database for component-architecture subtopic...\n');

    // Check if subtopic exists
    const subtopic = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, 'component-architecture'))
      .limit(1);

    if (subtopic.length === 0) {
      console.log('❌ Subtopic "component-architecture" NOT FOUND in database');
      console.log('\n📋 Available subtopics:');
      
      const allSubtopics = await db
        .select({
          id: tutorialSubtopics.id,
          slug: tutorialSubtopics.slug,
          name: tutorialSubtopics.name,
        })
        .from(tutorialSubtopics)
        .limit(20);
      
      if (allSubtopics.length === 0) {
        console.log('   No subtopics found in database');
      } else {
        allSubtopics.forEach((st, index) => {
          console.log(`   ${index + 1}. ${st.slug} (${st.name})`);
        });
      }
      
      process.exit(1);
    }

    console.log('✅ Subtopic found:');
    console.log(`   ID: ${subtopic[0].id}`);
    console.log(`   Name: ${subtopic[0].name}`);
    console.log(`   Slug: ${subtopic[0].slug}`);
    console.log(`   External ID: ${subtopic[0].externalId}`);

    // Check sections for this subtopic
    console.log('\n🔍 Checking sections for this subtopic...\n');

    const sections = await db
      .select({
        id: tutorialSections.id,
        sectionType: tutorialSections.sectionType,
        difficulty: tutorialSections.difficulty,
        status: tutorialSections.status,
        version: tutorialSections.version,
        generatedByAi: tutorialSections.generatedByAi,
      })
      .from(tutorialSections)
      .where(eq(tutorialSections.subtopicId, subtopic[0].id));

    if (sections.length === 0) {
      console.log('❌ No sections found for this subtopic');
      console.log('\n💡 You need to seed section data for component-architecture');
      process.exit(1);
    }

    console.log(`✅ Found ${sections.length} sections:\n`);
    
    const sectionsByDifficulty: Record<string, any[]> = {};
    sections.forEach(section => {
      if (!sectionsByDifficulty[section.difficulty]) {
        sectionsByDifficulty[section.difficulty] = [];
      }
      sectionsByDifficulty[section.difficulty].push(section);
    });

    Object.entries(sectionsByDifficulty).forEach(([difficulty, secs]) => {
      console.log(`   ${difficulty.toUpperCase()}:`);
      secs.forEach(section => {
        const statusIcon = section.status === 'approved' ? '✅' : section.status === 'draft' ? '📝' : '⏳';
        const aiIcon = section.generatedByAi ? '🤖' : '👤';
        console.log(`      ${statusIcon} ${aiIcon} ${section.sectionType} (v${section.version})`);
      });
      console.log('');
    });

    // Check approved sections specifically
    const approvedSections = sections.filter(s => s.status === 'approved');
    console.log(`\n📊 Summary:`);
    console.log(`   Total sections: ${sections.length}`);
    console.log(`   Approved sections: ${approvedSections.length}`);
    console.log(`   Draft sections: ${sections.filter(s => s.status === 'draft').length}`);
    console.log(`   AI-generated: ${sections.filter(s => s.generatedByAi).length}`);

    if (approvedSections.length === 0) {
      console.log('\n⚠️  WARNING: No approved sections found!');
      console.log('   The API will return 404 because it only fetches approved sections.');
      console.log('   You need to approve sections or change the API query.');
    }

    console.log('\n✅ Database check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkSubtopicData();
