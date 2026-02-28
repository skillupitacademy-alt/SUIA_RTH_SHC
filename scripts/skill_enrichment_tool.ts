import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as domainSchema from '../packages/db/src/schema/domain';
import * as questionSchema from '../packages/db/src/schema/question';
import { eq, sql, and } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: 'packages/db/.env' });

const schema = { ...domainSchema, ...questionSchema };
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

interface SkillMapping {
  topicName: string;
  questionKeyword: string;
  skillName: string;
  mappingType: 'conceptual' | 'technical' | 'practical';
}

async function runEnrichment(mappings: SkillMapping[], mode: 'dry-run' | 'commit') {
  scriptLogger.info(`\n🚀 SKILL ENRICHMENT TOOL - MODE: ${mode.toUpperCase()}\n`);
  
  const report: any[] = [];

  for (const mapping of mappings) {
    // 1. Find Topic
    const topic = await db.query.topics.findFirst({
      where: eq(domainSchema.topics.name, mapping.topicName)
    });

    if (!topic) {
      report.push({ mapping, status: 'ERROR', message: `Topic "${mapping.topicName}" not found.` });
      continue;
    }

    // 2. Find matching questions
    const targetQuestions = await db.query.questions.findMany({
      where: and(
        eq(questionSchema.questions.topicId, topic.id),
        sql`${questionSchema.questions.questionText} ILIKE ${'%' + mapping.questionKeyword + '%'}`
      )
    });

    if (targetQuestions.length === 0) {
      report.push({ mapping, status: 'SKIPPED', message: `No questions found matching "${mapping.questionKeyword}" in topic "${mapping.topicName}".` });
      continue;
    }

    const questionPreviews = targetQuestions.map(q => ({
      id: q.id,
      textPreview: q.questionText.substring(0, 80) + '...'
    }));

    if (mode === 'commit') {
      // Resolve Skill (Strictly no creation)
      let skill = await db.query.skills.findFirst({
        where: eq(domainSchema.skills.name, mapping.skillName)
      });

      if (!skill) {
        report.push({ mapping, status: 'ERROR', message: `SKILL "${mapping.skillName}" DOES NOT EXIST. Skipping update.` });
        continue;
      }

      // Link Questions
      let linkedCount = 0;
      for (const q of targetQuestions) {
        const existing = await db.query.questionSkills.findFirst({
          where: and(
            eq(questionSchema.questionSkills.questionId, q.id),
            eq(questionSchema.questionSkills.skillId, skill.id)
          )
        });

        if (!existing) {
          await db.insert(questionSchema.questionSkills).values({
            questionId: q.id,
            skillId: skill.id
          });
          linkedCount++;
        }
      }
      report.push({ mapping, status: 'SUCCESS', count: linkedCount, questions: questionPreviews });
    } else {
      // Resolve Skill (Dry Run Validation)
      const skill = await db.query.skills.findFirst({
        where: eq(domainSchema.skills.name, mapping.skillName)
      });
      
      const validationStatus = skill ? 'PENDING' : 'ERROR: Skill Missing';
      report.push({ mapping, status: validationStatus, count: targetQuestions.length, questions: questionPreviews });
    }
  }

  return report;
}

// Example usage when executed directly
if (require.main === module) {
  const mode = process.argv.includes('--commit') ? 'commit' : 'dry-run';
  
  // NOTE: These mappings now strictly use your predefined 10 skills
  const sampleMappings: SkillMapping[] = [
    {
      topicName: 'React Hooks',
      questionKeyword: 'hook',
      skillName: 'Code Debugging',
      mappingType: 'technical'
    },
    {
      topicName: 'React Hooks',
      questionKeyword: 'Context',
      skillName: 'Problem Solving',
      mappingType: 'conceptual'
    },
    {
      topicName: 'Express Middleware',
      questionKeyword: 'middleware',
      skillName: 'API Design',
      mappingType: 'technical'
    },
    {
        topicName: 'SQL Joins',
        questionKeyword: 'JOIN',
        skillName: 'Data Analysis',
        mappingType: 'practical'
    }
  ];

  runEnrichment(sampleMappings, mode)
    .then(report => {
        scriptLogger.info("\n--- ENRICHMENT REPORT ---\n");
        scriptLogger.info(JSON.stringify(report, null, 2));
        process.exit(0);
    })
    .catch(err => {
        scriptLogger.error(err);
        process.exit(1);
    });
}

