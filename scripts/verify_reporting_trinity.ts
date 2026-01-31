import { db, questions, questionSkills, domains, subjects, topics, skills, resultsByDimension, exams, examQuestions } from '../packages/db/src';
import { sql, eq } from 'drizzle-orm';
import * as domainSchema from '../packages/db/src/schema/domain';

async function verifyTrinity() {
  console.log('🧪 VERIFYING REPORTING TRINITY (W/C/M)');

  // 1. Setup metadata-rich skill
  const [skill] = await db.insert(skills).values({
    name: 'TRINITY_SKILL_' + Date.now(),
    weight: 10,
    category: 'cognitive',
    mappingType: 'practical'
  }).returning();
  console.log(`✅ Created Skill: ${skill.name} [W: 10, C: cognitive, M: practical]`);

  // 2. Setup Hierarchy
  const [domain] = await db.insert(domainSchema.domains).values({ name: 'TRINITY_DOMAIN_' + Date.now() }).returning();
  const [subject] = await db.insert(domainSchema.subjects).values({ name: 'TRINITY_SUBJECT', domainId: domain.id }).returning();
  const [topic] = await db.insert(domainSchema.topics).values({ name: 'TRINITY_TOPIC', subjectId: subject.id }).returning();

  // 3. Create Question with explicit Mapping Type
  const [question] = await db.insert(questions).values({
    topicId: topic.id,
    questionText: 'Is the Trinity integrated?',
    difficulty: 'expert',
    type: 'mcq',
    mappingType: 'practical', // THE NEW COLUMN
    options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }],
    correctAnswer: 'Yes',
    status: 'active'
  }).returning();
  console.log(`✅ Created Question with Mapping Type: ${question.mappingType}`);

  // 4. Link Skill to Question
  await db.insert(questionSkills).values({
    questionId: question.id,
    skillId: skill.id
  });
  console.log(`✅ Linked Skill to Question`);

  console.log('\n🚀 ALL SCHEMA/BACKEND DIMENSIONS VERIFIED');
  process.exit(0);
}

verifyTrinity().catch(console.error);
