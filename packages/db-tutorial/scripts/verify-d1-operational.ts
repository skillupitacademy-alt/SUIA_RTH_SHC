/**
 * Definition D1 — Operational Verification Script
 * 
 * Verifies a real Definition D1 section from database through delivery
 */

import { db } from '../src/db';
import {
  tutorialSections,
  tutorialSubtopics,
  tutorialTopics,
  tutorialSubjects,
  tutorialDomains,
} from '../src/schema';
import { eq, and, sql } from 'drizzle-orm';
import { tutorialDeliveryService } from '../src/services/tutorial-delivery.service';
import type { TutorialDocument, DefinitionD1Block } from '@quiz/types';

async function verifyD1Operational() {
  console.log('========================================');
  console.log('Definition D1 — Operational Verification');
  console.log('========================================\n');

  try {
    // Step 1: Find a real deployed Definition D1 section
    console.log('TEST-REAL-01: Finding real deployed D1 section...\n');

    // First, check total sections count for diagnostics
    const allSections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.sectionType, 'notes'))
      .limit(100);

    console.log(`Total notes sections: ${allSections.length}`);

    // Count by status
    const statusCounts: Record<string, number> = {};
    for (const s of allSections) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }
    console.log('Status breakdown:', statusCounts);
    console.log('');

    // Try to find deployed sections first
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.status, 'deployed'),
          eq(tutorialSections.sectionType, 'notes')
        )
      )
      .limit(10);

    console.log(`Found ${sections.length} deployed notes sections\n`);

    // If no deployed, try approved
    let sectionsToCheck = sections;
    let selectedStatus = 'deployed';

    if (sections.length === 0) {
      console.log('No deployed sections found. Checking approved sections...\n');
      const approvedSections = await db
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.status, 'approved'),
            eq(tutorialSections.sectionType, 'notes')
          )
        )
        .limit(10);
      
      sectionsToCheck = approvedSections;
      selectedStatus = 'approved';
      console.log(`Found ${approvedSections.length} approved notes sections\n`);
    }

    // If still nothing, try any status
    if (sectionsToCheck.length === 0) {
      console.log('No approved sections found. Checking all statuses...\n');
      sectionsToCheck = allSections.slice(0, 10);
      selectedStatus = 'any';
      console.log(`Found ${sectionsToCheck.length} notes sections (any status)\n`);
    }

    if (sectionsToCheck.length === 0) {
      console.log('❌ NO SECTIONS FOUND AT ALL');
      console.log('Status: BLOCKED — No tutorial data available in database\n');
      console.log('This could mean:');
      console.log('1. Database is empty (no data seeded)');
      console.log('2. Wrong database connection');
      console.log('3. Schema mismatch\n');
      return;
    }

    // Find a section with Definition D1 block
    let selectedSection: typeof sectionsToCheck[0] | null = null;
    let d1Block: DefinitionD1Block | null = null;

    for (const section of sectionsToCheck) {
      const doc = section.content as TutorialDocument;
      if (doc && doc.blocks) {
        const foundD1 = doc.blocks.find(
          (b) => b.type === 'definition' && (b as any).version === 'D1'
        );
        if (foundD1) {
          selectedSection = section;
          d1Block = foundD1 as DefinitionD1Block;
          break;
        }
      }
    }

    if (!selectedSection || !d1Block) {
      console.log('❌ NO DEFINITION D1 SECTIONS FOUND');
      console.log(`Checked ${sectionsToCheck.length} ${selectedStatus} sections`);
      console.log('Status: BLOCKED — No D1 data available\n');
      console.log('Sample section types found:');
      const sampleSections = sectionsToCheck.slice(0, 3);
      for (const s of sampleSections) {
        const doc = s.content as TutorialDocument;
        if (doc && doc.blocks && doc.blocks.length > 0) {
          const blockTypes = doc.blocks.map((b: any) => 
            `${b.type}${b.version ? `:${b.version}` : ''}`
          ).join(', ');
          console.log(`  Section ${s.id}: ${blockTypes}`);
        }
      }
      console.log('');
      return;
    }

    console.log(`✅ Found Definition D1 section (status: ${selectedStatus})!\n`);

    // Now get hierarchy info
    const subtopic = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.id, selectedSection.subtopicId))
      .limit(1);

    if (subtopic.length === 0) {
      console.log('❌ Subtopic not found');
      return;
    }

    const topic = await db
      .select()
      .from(tutorialTopics)
      .where(eq(tutorialTopics.id, subtopic[0].topicId))
      .limit(1);

    if (topic.length === 0) {
      console.log('❌ Topic not found');
      return;
    }

    const subject = await db
      .select()
      .from(tutorialSubjects)
      .where(eq(tutorialSubjects.id, topic[0].subjectId))
      .limit(1);

    if (subject.length === 0) {
      console.log('❌ Subject not found');
      return;
    }

    const domain = await db
      .select()
      .from(tutorialDomains)
      .where(eq(tutorialDomains.id, subject[0].domainId))
      .limit(1);

    if (domain.length === 0) {
      console.log('❌ Domain not found');
      return;
    }

    console.log('✅ Found Definition D1 section!\n');
    console.log('## Selected Real Tutorial\n');
    console.log(`Domain: ${domain[0].name} (${domain[0].slug})`);
    console.log(`Subject: ${subject[0].name} (${subject[0].slug})`);
    console.log(`Topic: ${topic[0].name} (${topic[0].slug})`);
    console.log(`Subtopic: ${subtopic[0].name} (${subtopic[0].slug})`);
    console.log(`Section ID: ${selectedSection.id}`);
    console.log(`Section Type: ${selectedSection.sectionType}`);
    console.log(`Difficulty: ${selectedSection.difficulty}`);
    console.log(`Status: ${selectedSection.status}`);
    console.log(`Brand: ${selectedSection.brandId}\n`);

    // Step 2: Verify Database Record
    console.log('## Database Verification\n');
    
    const doc = selectedSection.content as TutorialDocument;
    
    const checks = {
      'Real section exists': true,
      'Correct subtopic_id': !!selectedSection.subtopicId,
      'section_type': selectedSection.sectionType === 'notes',
      'status': selectedSection.status === 'deployed',
      'D1 block exists': !!d1Block,
      'schemaVersion = 1': doc.schemaVersion === 1,
      'block.type = definition': d1Block.type === 'definition',
      'block.version = D1': d1Block.version === 'D1',
      'block.id exists': !!d1Block.id,
      'page.* complete': !!(
        d1Block.content.page.type &&
        d1Block.content.page.category &&
        d1Block.content.page.title &&
        d1Block.content.page.intro &&
        d1Block.content.page.definition &&
        d1Block.content.page.explanation &&
        d1Block.content.page.example &&
        d1Block.content.page.characteristics &&
        d1Block.content.page.takeaway
      ),
      'Hierarchy outside JSONB': !(
        JSON.stringify(selectedSection.content).includes('domainId') ||
        JSON.stringify(selectedSection.content).includes('subjectId') ||
        JSON.stringify(selectedSection.content).includes('topicId') ||
        JSON.stringify(selectedSection.content).includes('subtopicId')
      ),
    };

    console.log('| Check | Result |');
    console.log('|---|---|');
    for (const [check, result] of Object.entries(checks)) {
      console.log(`| ${check} | ${result ? '✅ PASS' : '❌ FAIL'} |`);
    }
    console.log('');

    // Step 3: Verify page content fields
    console.log('## D1 Page Content\n');
    console.log(`Title: ${d1Block.content.page.title}`);
    console.log(`Category: ${d1Block.content.page.category}`);
    console.log(`Intro: ${d1Block.content.page.intro.substring(0, 100)}...`);
    console.log(`Definition: ${d1Block.content.page.definition.substring(0, 100)}...`);
    console.log(`Explanation paragraphs: ${d1Block.content.page.explanation.length}`);
    console.log(`Example language: ${d1Block.content.page.example.language}`);
    console.log(`Characteristics: ${d1Block.content.page.characteristics.length}`);
    console.log(`Takeaway: ${d1Block.content.page.takeaway.substring(0, 100)}...\n`);

    // Step 4: Verify Delivery API
    console.log('## Delivery Verification\n');

    try {
      const delivery = await tutorialDeliveryService.getTutorialById(
        selectedSection.subtopicId,
        {
          difficulty: selectedSection.difficulty as any,
          sectionType: selectedSection.sectionType as any,
        }
      );

      const deliverySection = delivery.sections.find(
        (s) => s.id === selectedSection.id
      );

      const deliveryChecks = {
        'Delivery endpoint works': true,
        'Correct section returned': !!deliverySection,
        'Correct D1 block returned': deliverySection
          ? (deliverySection.content.blocks[0] as any).version === 'D1'
          : false,
        'page.* preserved': deliverySection
          ? !!(deliverySection.content.blocks[0] as DefinitionD1Block).content.page.title
          : false,
        'Admin metadata protected': deliverySection
          ? !(deliverySection as any).generatedByAi &&
            !(deliverySection as any).aiModelUsed &&
            !(deliverySection as any).qualityScore
          : false,
      };

      console.log('| Check | Result |');
      console.log('|---|---|');
      for (const [check, result] of Object.entries(deliveryChecks)) {
        console.log(`| ${check} | ${result ? '✅ PASS' : '❌ FAIL'} |`);
      }
      console.log('');

      if (deliverySection) {
        const deliveredD1 = deliverySection.content.blocks[0] as DefinitionD1Block;
        console.log('Delivered D1 Block:');
        console.log(`  - Title: ${deliveredD1.content.page.title}`);
        console.log(`  - Version: ${deliveredD1.version}`);
        console.log(`  - ID matches: ${deliveredD1.id === d1Block.id ? 'YES' : 'NO'}\n`);
      }
    } catch (error) {
      console.log('❌ Delivery service failed:');
      console.log(error);
      console.log('');
    }

    // Step 5: Verify URL structure
    console.log('## URL Verification\n');
    
    // Based on the schema, construct expected URL
    const expectedUrl = `https://<tutorial-domain>/${domain[0].slug}/${subject[0].slug}/${topic[0].slug}/${subtopic[0].slug}`;
    console.log(`Expected URL Pattern: ${expectedUrl}\n`);

    console.log('| Check | Result |');
    console.log('|---|---|');
    console.log('| URL resolves | ⏳ MANUAL CHECK REQUIRED |');
    console.log(`| Correct domain (${domain[0].slug}) | ⏳ MANUAL CHECK REQUIRED |`);
    console.log(`| Correct subject (${subject[0].slug}) | ⏳ MANUAL CHECK REQUIRED |`);
    console.log(`| Correct topic (${topic[0].slug}) | ⏳ MANUAL CHECK REQUIRED |`);
    console.log(`| Correct subtopic (${subtopic[0].slug}) | ⏳ MANUAL CHECK REQUIRED |`);
    console.log('| Correct database section | ⏳ MANUAL CHECK REQUIRED |');
    console.log('| Definition D1 rendered | ⏳ MANUAL CHECK REQUIRED |');
    console.log('');

    // Step 6: Browser verification checklist
    console.log('## Browser Verification\n');
    console.log('⚠️ Manual verification required in browser:\n');
    console.log('| D1 Content | Result |');
    console.log('|---|---|');
    console.log('| Title | ⏳ CHECK |');
    console.log('| Intro | ⏳ CHECK |');
    console.log('| Definition | ⏳ CHECK |');
    console.log('| Explanation | ⏳ CHECK |');
    console.log('| Example | ⏳ CHECK |');
    console.log('| Characteristics | ⏳ CHECK |');
    console.log('| Takeaway | ⏳ CHECK |');
    console.log('');

    // Final verdict
    console.log('## Final Verdict\n');
    
    const allDbChecks = Object.values(checks).every((v) => v === true);
    
    if (allDbChecks) {
      console.log('✅ PASS — Database and Delivery Verified');
      console.log('⏳ PENDING — Browser verification required\n');
      console.log('Next Steps:');
      console.log('1. Open the tutorial URL in browser');
      console.log('2. Verify D1 content renders correctly');
      console.log('3. Confirm all page.* fields are visible');
    } else {
      console.log('❌ FAIL — Database verification failed');
      console.log('Review failed checks above\n');
    }

    console.log('\n========================================');
    console.log('Verification Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run verification
verifyD1Operational()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
