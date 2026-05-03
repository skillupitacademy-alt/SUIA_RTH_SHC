#!/usr/bin/env node
/**
 * DELIVERABLE 2 - PHASE 2: CONSTITUTIONAL SECTION MAPPING
 * Transform Legacy Content into 12 Constitutional Sections
 * 
 * Purpose: Decompose monolithic JSONB content into modular sections/subsections
 * Priority: P0 - CRITICAL
 * Mode: PILOT FIRST, then FULL MIGRATION
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

// Constitutional section types (12 sections - ACTUAL ENUM VALUES)
const CONSTITUTIONAL_SECTIONS = [
  'notes',        // 1. Overview/Notes
  'layman',       // 2. Layman explanation
  'visual',       // 3. Visual/diagrams
  'real_life',    // 4. Real-life examples
  'technical',    // 5. Technical details
  'code',         // 6. Code examples
  'practice',     // 7. Practice exercises
  'assignment',   // 8. Assignments
  'project',      // 9. Projects
  'quiz',         // 10. Quiz/assessment
  'summary',      // 11. Summary
  'interview'     // 12. Interview prep
];

// Subsection taxonomy (24 types)
const SUBSECTION_TYPES = {
  CONCEPTUAL: ['definition', 'concept', 'syntax', 'analogy'],
  ILLUSTRATIVE: ['example', 'visual', 'diagram', 'animation'],
  CAUTIONARY: ['pitfall', 'antipattern', 'gotcha'],
  INTERACTIVE: ['code', 'exercise', 'challenge', 'sandbox'],
  REFERENCE: ['checklist', 'cheatsheet', 'faq', 'glossary'],
  ASSESSMENT: ['interview_question', 'quiz_question'],
  PROJECT: ['project_step', 'project_milestone', 'project_deliverable']
};

/**
 * Decompose legacy content into constitutional sections
 */
function decomposeContent(legacyContent, subtopic, topic) {
  const sections = [];
  
  // Parse JSONB content
  const content = legacyContent.content;
  
  // SECTION 1: LAYMAN (Simple Explanation)
  if (content.layman?.simpleExplanation) {
    sections.push({
      section_type: 'layman',
      title: `${subtopic.name} - Simple Explanation`,
      description: 'Introduction and simple explanation',
      order_index: 1,
      subsections: [
        {
          subsection_type: 'concept',
          title: 'What is it?',
          content_markdown: content.layman.simpleExplanation,
          order_index: 1
        }
      ]
    });
    
    if (content.layman?.analogyOrStory) {
      sections[sections.length - 1].subsections.push({
        subsection_type: 'analogy',
        title: 'Real-World Analogy',
        content_markdown: content.layman.analogyOrStory,
        order_index: 2
      });
    }
  }
  
  // SECTION 2: NOTES
  if (content.notes?.markdown) {
    sections.push({
      section_type: 'notes',
      title: `${subtopic.name} - Notes`,
      description: 'Important notes and concepts',
      order_index: 2,
      subsections: [
        {
          subsection_type: 'concept',
          title: 'Important Notes',
          content_markdown: content.notes.markdown,
          order_index: 1
        }
      ]
    });
  }
  
  // SECTION 3: TECHNICAL
  if (content.technical?.markdown || content.technical?.bullets) {
    const subsections = [];
    
    if (content.technical?.markdown) {
      subsections.push({
        subsection_type: 'definition',
        title: 'Technical Definition',
        content_markdown: content.technical.markdown,
        order_index: 1
      });
    }
    
    if (content.technical?.bullets) {
      const bulletPoints = Array.isArray(content.technical.bullets) 
        ? content.technical.bullets.map(b => `- **${b.term}**: ${b.detail}`).join('\n')
        : '';
      
      if (bulletPoints) {
        subsections.push({
          subsection_type: 'concept',
          title: 'Key Concepts',
          content_markdown: bulletPoints,
          order_index: 2
        });
      }
    }
    
    if (content.technical?.tip) {
      subsections.push({
        subsection_type: 'checklist',
        title: 'Technical Tips',
        content_markdown: `✅ ${content.technical.tip}`,
        order_index: 3
      });
    }
    
    if (subsections.length > 0) {
      sections.push({
        section_type: 'technical',
        title: `${subtopic.name} - Technical Details`,
        description: 'Technical concepts and definitions',
        order_index: 3,
        subsections
      });
    }
  }
  
  // SECTION 4: CODE
  const codeSubsections = [];
  let codeOrder = 1;
  
  if (content.code?.intro) {
    codeSubsections.push({
      subsection_type: 'example',
      title: 'Code Example Introduction',
      content_markdown: content.code.intro,
      order_index: codeOrder++
    });
  }
  
  if (content.code?.code) {
    const stepsMarkdown = Array.isArray(content.code.steps)
      ? content.code.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
      : '';
    
    codeSubsections.push({
      subsection_type: 'code',
      title: 'Working Example',
      content_markdown: `\`\`\`${content.code.language || 'javascript'}\n${content.code.code}\n\`\`\`\n\n**Steps:**\n${stepsMarkdown}`,
      code_language: content.code.language || 'javascript',
      is_executable: true,
      order_index: codeOrder++
    });
  }
  
  if (codeSubsections.length > 0) {
    sections.push({
      section_type: 'code',
      title: `${subtopic.name} - Code Examples`,
      description: 'Practical code examples',
      order_index: 4,
      subsections: codeSubsections
    });
  }
  
  // SECTION 5: REAL_LIFE
  const realLifeSubsections = [];
  let realLifeOrder = 1;
  
  if (content.layman?.example1) {
    realLifeSubsections.push({
      subsection_type: 'example',
      title: `Real-World Example: ${content.layman.example1.company}`,
      content_markdown: content.layman.example1.content,
      order_index: realLifeOrder++
    });
  }
  
  if (content.layman?.example2) {
    realLifeSubsections.push({
      subsection_type: 'example',
      title: `Real-World Example: ${content.layman.example2.company}`,
      content_markdown: content.layman.example2.content,
      order_index: realLifeOrder++
    });
  }
  
  if (content.real_life?.scenario) {
    const bulletsMarkdown = Array.isArray(content.real_life.bullets)
      ? content.real_life.bullets.map(b => `- **${b.label}**: ${b.detail}`).join('\n')
      : '';
    
    realLifeSubsections.push({
      subsection_type: 'visual',
      title: content.real_life.title || 'Real-Life Scenario',
      content_markdown: `${content.real_life.scenario}\n\n${bulletsMarkdown}`,
      order_index: realLifeOrder++
    });
  }
  
  if (content.real_life?.tip) {
    realLifeSubsections.push({
      subsection_type: 'checklist',
      title: 'Practical Tips',
      content_markdown: `💡 ${content.real_life.tip}`,
      order_index: realLifeOrder++
    });
  }
  
  if (realLifeSubsections.length > 0) {
    sections.push({
      section_type: 'real_life',
      title: `${subtopic.name} - Real-Life Examples`,
      description: 'Practical real-world applications',
      order_index: 5,
      subsections: realLifeSubsections
    });
  }
  
  // SECTION 6: VISUAL (placeholder for future diagrams)
  sections.push({
    section_type: 'visual',
    title: `${subtopic.name} - Visual Aids`,
    description: 'Diagrams and visual representations',
    order_index: 6,
    subsections: [
      {
        subsection_type: 'diagram',
        title: 'Visual Representation',
        content_markdown: `**Visual aids for ${subtopic.name}:**\n\n*This section will be populated with diagrams and visual content.*`,
        order_index: 1,
        generated_by_ai: true,
        needs_review: true
      }
    ]
  });
  
  // SECTION 7: PRACTICE
  if (content.code?.code) {
    sections.push({
      section_type: 'practice',
      title: `${subtopic.name} - Practice`,
      description: 'Hands-on exercises',
      order_index: 7,
      subsections: [
        {
          subsection_type: 'exercise',
          title: 'Practice Exercise',
          content_markdown: `**Exercise: Modify the example**\n\nTry modifying the code example to:\n1. Change the implementation\n2. Add error handling\n3. Optimize performance\n\n\`\`\`${content.code.language || 'javascript'}\n// Your code here\n\`\`\``,
          code_language: content.code.language || 'javascript',
          is_interactive: true,
          order_index: 1,
          generated_by_ai: true,
          needs_review: true
        }
      ]
    });
  }
  
  // SECTION 8: ASSIGNMENT (placeholder)
  sections.push({
    section_type: 'assignment',
    title: `${subtopic.name} - Assignment`,
    description: 'Graded assignment',
    order_index: 8,
    subsections: [
      {
        subsection_type: 'exercise',
        title: 'Assignment Task',
        content_markdown: `**Assignment for ${subtopic.name}:**\n\n*This section will be populated with assignment content.*`,
        order_index: 1,
        generated_by_ai: true,
        needs_review: true
      }
    ]
  });
  
  // SECTION 9: PROJECT
  sections.push({
    section_type: 'project',
    title: `${subtopic.name} - Project Application`,
    description: 'Apply concepts in a real project',
    order_index: 9,
    subsections: [
      {
        subsection_type: 'project_step',
        title: 'Project Ideas',
        content_markdown: `**Project ideas using ${subtopic.name}:**\n\n*This section will be populated with AI-generated project suggestions.*`,
        order_index: 1,
        generated_by_ai: true,
        needs_review: true
      }
    ]
  });
  
  // SECTION 10: QUIZ
  sections.push({
    section_type: 'quiz',
    title: `${subtopic.name} - Quiz`,
    description: 'Test your knowledge',
    order_index: 10,
    subsections: [
      {
        subsection_type: 'quiz_question',
        title: 'Knowledge Check',
        content_markdown: `**Quiz for ${subtopic.name}:**\n\n*This section will be populated with quiz questions.*`,
        order_index: 1,
        generated_by_ai: true,
        needs_review: true
      }
    ]
  });
  
  // SECTION 11: SUMMARY
  sections.push({
    section_type: 'summary',
    title: `${subtopic.name} - Summary`,
    description: 'Key takeaways and review',
    order_index: 11,
    subsections: [
      {
        subsection_type: 'checklist',
        title: 'Key Takeaways',
        content_markdown: `**Summary of ${subtopic.name}:**\n\n*This section will be populated with AI-generated summary content.*`,
        order_index: 1,
        generated_by_ai: true,
        needs_review: true
      },
      {
        subsection_type: 'faq',
        title: 'Frequently Asked Questions',
        content_markdown: `**FAQ for ${subtopic.name}:**\n\n*This section will be enhanced with common questions.*`,
        order_index: 2,
        generated_by_ai: true,
        needs_review: true
      }
    ]
  });
  
  // SECTION 12: INTERVIEW
  if (content.ai_tutor?.qa_pairs && Array.isArray(content.ai_tutor.qa_pairs)) {
    const interviewSubsections = content.ai_tutor.qa_pairs.map((qa, i) => ({
      subsection_type: 'interview_question',
      title: qa.question,
      content_markdown: `**Q: ${qa.question}**\n\n**A:** ${qa.answer}`,
      order_index: i + 1
    }));
    
    sections.push({
      section_type: 'interview',
      title: `${subtopic.name} - Interview Preparation`,
      description: 'Common interview questions and answers',
      order_index: 12,
      subsections: interviewSubsections
    });
  } else {
    sections.push({
      section_type: 'interview',
      title: `${subtopic.name} - Interview Preparation`,
      description: 'Common interview questions and answers',
      order_index: 12,
      subsections: [
        {
          subsection_type: 'interview_question',
          title: 'Interview Questions',
          content_markdown: `**Interview questions for ${subtopic.name}:**\n\n*This section will be populated with interview questions.*`,
          order_index: 1,
          generated_by_ai: true,
          needs_review: true
        }
      ]
    });
  }
  
  return sections;
}

/**
 * Map difficulty to educational architecture
 */
function mapEducationalArchitecture(difficulty) {
  const mapping = {
    'simple': 'beginner_friendly',
    'mixed': 'progressive',
    'intermediate': 'progressive',
    'expert': 'advanced'
  };
  return mapping[difficulty] || 'progressive';
}

/**
 * Migrate single content item (PILOT or FULL)
 */
async function migrateContentItem(contentItem, subtopic, topic, mode = 'PILOT') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${mode} MIGRATION: ${topic.name} > ${subtopic.name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const result = {
    contentId: contentItem.id,
    subtopicId: subtopic.id,
    topicName: topic.name,
    subtopicName: subtopic.name,
    difficulty: contentItem.difficulty,
    sectionsCreated: 0,
    subsectionsCreated: 0,
    sections: [],
    errors: []
  };
  
  try {
    // Decompose content
    console.log('📊 Step 1: Decomposing content...');
    const sections = decomposeContent(contentItem, subtopic, topic);
    console.log(`   Generated ${sections.length} constitutional sections\n`);
    
    // Create sections and subsections
    console.log('📊 Step 2: Creating modular records...');
    
    for (const sectionData of sections) {
      try {
        // Create tutorial_section
        const sectionContent = {
          title: sectionData.title,
          description: sectionData.description,
          metadata: {
            originalLegacyContent: true,
            migrationTimestamp: new Date().toISOString()
          }
        };
        
        const sectionResult = await sql`
          INSERT INTO tutorial_sections (
            subtopic_id,
            section_type,
            difficulty,
            order_index,
            content,
            version,
            language,
            status,
            brand_id,
            brand_visibility,
            generated_by_ai,
            created_at,
            updated_at
          ) VALUES (
            ${subtopic.id},
            ${sectionData.section_type}::section_type,
            ${contentItem.difficulty}::tutorial_difficulty,
            ${sectionData.order_index},
            ${JSON.stringify(sectionContent)}::jsonb,
            1,
            'en',
            'deployed'::section_status,
            'shared'::brand,
            'shared_visible'::brand_visibility,
            false,
            NOW(),
            NOW()
          )
          RETURNING id;
        `;
        
        const sectionId = sectionResult[0].id;
        result.sectionsCreated++;
        
        console.log(`   ✅ Section ${sectionData.order_index}: ${sectionData.section_type}`);
        
        // Create subsections
        for (const subsectionData of sectionData.subsections) {
          const subsectionContent = {
            markdown: subsectionData.content_markdown,
            codeLanguage: subsectionData.code_language,
            isExecutable: subsectionData.is_executable,
            isInteractive: subsectionData.is_interactive,
            metadata: {
              subsectionType: subsectionData.subsection_type,
              generatedByAi: subsectionData.generated_by_ai || false,
              needsReview: subsectionData.needs_review || false
            }
          };
          
          // Generate slug from title
          const slug = subsectionData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          await sql`
            INSERT INTO tutorial_subsections (
              section_id,
              subsection_type,
              title,
              slug,
              content,
              order_index,
              brand_id,
              brand_visibility,
              generated_by_ai,
              created_at,
              updated_at
            ) VALUES (
              ${sectionId},
              ${subsectionData.subsection_type}::subsection_type,
              ${subsectionData.title},
              ${slug},
              ${JSON.stringify(subsectionContent)}::jsonb,
              ${subsectionData.order_index},
              'shared'::brand,
              'shared_visible'::brand_visibility,
              ${subsectionData.generated_by_ai || false},
              NOW(),
              NOW()
            );
          `;
          
          result.subsectionsCreated++;
        }
        
        console.log(`      └─ ${sectionData.subsections.length} subsections created`);
        
        result.sections.push({
          sectionType: sectionData.section_type,
          sectionId,
          subsectionCount: sectionData.subsections.length
        });
        
      } catch (error) {
        console.log(`   ❌ Error creating section ${sectionData.section_type}: ${error.message}`);
        result.errors.push({
          section: sectionData.section_type,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ Migration complete:`);
    console.log(`   Sections: ${result.sectionsCreated}/${sections.length}`);
    console.log(`   Subsections: ${result.subsectionsCreated}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    result.status = result.errors.length === 0 ? 'SUCCESS' : 'PARTIAL';
    
  } catch (error) {
    console.log(`\n❌ Migration failed: ${error.message}`);
    result.status = 'FAILED';
    result.error = error.message;
  }
  
  return result;
}

/**
 * Main execution
 */
async function executePhase2(mode = 'PILOT') {
  console.log('🚀 DELIVERABLE 2 - PHASE 2: CONSTITUTIONAL SECTION MAPPING');
  console.log(`Mode: ${mode}`);
  console.log('==========================================\n');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    deliverable: 'DELIVERABLE_2',
    phase: 'PHASE_2_CONSTITUTIONAL_MAPPING',
    mode,
    status: 'IN_PROGRESS',
    migrations: [],
    summary: {}
  };
  
  try {
    // Get content items with relationships
    let contentItems;
    if (mode === 'PILOT') {
      contentItems = await sql`
        SELECT 
          c.id,
          c.subtopic_id,
          c.difficulty,
          c.content,
          c.content_type,
          c.is_published,
          c.generated_by_ai,
          s.id as subtopic_db_id,
          s.name as subtopic_name,
          s.slug as subtopic_slug,
          t.id as topic_id,
          t.name as topic_name,
          t.slug as topic_slug
        FROM tutorial_content c
        JOIN tutorial_subtopics s ON c.subtopic_id = s.id
        JOIN tutorial_topics t ON s.topic_id = t.id
        WHERE c.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
        ORDER BY c.created_at
        LIMIT 1;
      `;
    } else {
      contentItems = await sql`
        SELECT 
          c.id,
          c.subtopic_id,
          c.difficulty,
          c.content,
          c.content_type,
          c.is_published,
          c.generated_by_ai,
          s.id as subtopic_db_id,
          s.name as subtopic_name,
          s.slug as subtopic_slug,
          t.id as topic_id,
          t.name as topic_name,
          t.slug as topic_slug
        FROM tutorial_content c
        JOIN tutorial_subtopics s ON c.subtopic_id = s.id
        JOIN tutorial_topics t ON s.topic_id = t.id
        WHERE c.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
        ORDER BY c.created_at;
      `;
    }
    
    console.log(`Found ${contentItems.length} content item(s) to migrate\n`);
    
    if (contentItems.length === 0) {
      console.log('⚠️  No content items found');
      report.status = 'NO_CONTENT';
      return report;
    }
    
    // Migrate each content item
    for (const item of contentItems) {
      const subtopic = {
        id: item.subtopic_db_id,
        name: item.subtopic_name,
        slug: item.subtopic_slug
      };
      
      const topic = {
        id: item.topic_id,
        name: item.topic_name,
        slug: item.topic_slug
      };
      
      const migrationResult = await migrateContentItem(item, subtopic, topic, mode);
      report.migrations.push(migrationResult);
    }
    
    // Summary
    const totalSections = report.migrations.reduce((sum, m) => sum + m.sectionsCreated, 0);
    const totalSubsections = report.migrations.reduce((sum, m) => sum + m.subsectionsCreated, 0);
    const totalErrors = report.migrations.reduce((sum, m) => sum + m.errors.length, 0);
    const successfulMigrations = report.migrations.filter(m => m.status === 'SUCCESS').length;
    
    report.summary = {
      contentItemsMigrated: report.migrations.length,
      successfulMigrations,
      totalSections,
      totalSubsections,
      totalErrors,
      successRate: Math.round((successfulMigrations / report.migrations.length) * 100)
    };
    
    report.status = totalErrors === 0 ? 'SUCCESS' : 'PARTIAL';
    
    console.log('\n==========================================');
    console.log('📊 PHASE 2 SUMMARY');
    console.log('==========================================\n');
    console.log(`Content Items Migrated: ${report.migrations.length}`);
    console.log(`Successful Migrations: ${successfulMigrations}/${report.migrations.length}`);
    console.log(`Total Sections Created: ${totalSections}`);
    console.log(`Total Subsections Created: ${totalSubsections}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`\nStatus: ${report.status}`);
    
    // Save report
    const reportPath = `scripts/transformation/reports/constitutional-mapping-${mode.toLowerCase()}-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Phase 2 failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    
    const reportPath = `scripts/transformation/reports/constitutional-mapping-${mode.toLowerCase()}-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    throw error;
  }
}

// Execute based on command line argument
const mode = process.argv[2]?.toUpperCase() || 'PILOT';

if (!['PILOT', 'FULL'].includes(mode)) {
  console.error('❌ Invalid mode. Use: PILOT or FULL');
  process.exit(1);
}

executePhase2(mode)
  .then((report) => {
    if (report.status === 'SUCCESS') {
      console.log(`\n✅ Phase 2 ${mode} migration complete`);
      process.exit(0);
    } else {
      console.log(`\n⚠️  Phase 2 ${mode} migration completed with issues`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`\n❌ Phase 2 ${mode} migration failed:`, error);
    process.exit(1);
  });
