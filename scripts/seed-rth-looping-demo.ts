import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

import {
  db as quizDb,
  domains,
  examBlueprints,
  examQuestions,
  exams,
  idempotencyKeys,
  notifications,
  notesAccessLogs,
  notesDeliveryLocks,
  questionSkills,
  questions,
  reportJobs,
  reports,
  roles,
  resultsByDimension,
  skills,
  subtopics,
  subjects,
  topicSkills,
  topics,
  tutorHelpRequests,
  userProfiles,
  userRecommendations,
  userRoles,
  users,
} from '../packages/db/src/index';
import {
  db as tutorialDb,
  assignmentHelpRequests,
  assignmentProgress,
  badges,
  certificates,
  contentGenerationJobs,
  domainContentConfig,
  liveSessionRequests,
  remediationTriggers,
  studentBadges,
  studentStreaks,
  subtopicFlowProgress,
  tutorialAssignments,
  tutorialContent,
  tutorialContentAudit,
  tutorialContentVersions,
  tutorialDomains,
  tutorialProjects,
  tutorialProjectSubmissions,
  tutorialProgress,
  tutorialSubjects,
  tutorialSubtopics,
  tutorialTopics,
  tutorialVideoLinks,
} from '../packages/db-tutorial/src/index';
import type { TutorialContentJSON } from '../packages/types/src/tutorial-content.types';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api-server/.env.local'),
  path.resolve(process.cwd(), 'apps/api-server/.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const FIXED_HASH = '$2b$12$dkd0IDiekVGV2UoWc3EV4ufKvr/TDEomwxqWEhkaSxzcbwwdTMjOC';
const SEED_EDITOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const AJAY_EMAIL = 'ajayshah@gmail.com';

const ids = {
  domain: '30000000-0000-0000-0000-100000000001',
  subject: '40000000-0000-0000-0000-100000000001',
  topic: '50000000-0000-0000-0000-100000000001',
  subtopic: '60000000-0000-0000-0000-100000000001',
  skillIteration: '70000000-0000-0000-0000-100000000001',
  skillLoopDebug: '70000000-0000-0000-0000-100000000002',
  blueprint: '80000000-0000-0000-0000-100000000001',
  question1: '81000000-0000-0000-0000-100000000001',
  question2: '81000000-0000-0000-0000-100000000002',
  question3: '81000000-0000-0000-0000-100000000003',
  question4: '81000000-0000-0000-0000-100000000004',
  question5: '81000000-0000-0000-0000-100000000005',
  question6: '81000000-0000-0000-0000-100000000006',
  exam1Question1: '81100000-0000-0000-0000-100000000001',
  exam1Question2: '81100000-0000-0000-0000-100000000002',
  exam1Question3: '81100000-0000-0000-0000-100000000003',
  exam1Question4: '81100000-0000-0000-0000-100000000004',
  exam1Question5: '81100000-0000-0000-0000-100000000005',
  exam1Question6: '81100000-0000-0000-0000-100000000006',
  exam2Question1: '81200000-0000-0000-0000-100000000001',
  exam2Question2: '81200000-0000-0000-0000-100000000002',
  exam2Question3: '81200000-0000-0000-0000-100000000003',
  exam2Question4: '81200000-0000-0000-0000-100000000004',
  exam2Question5: '81200000-0000-0000-0000-100000000005',
  exam2Question6: '81200000-0000-0000-0000-100000000006',
  exam1: '82000000-0000-0000-0000-100000000001',
  exam2: '82000000-0000-0000-0000-100000000002',
  exam1Job: '83000000-0000-0000-0000-100000000001',
  exam2Job: '83000000-0000-0000-0000-100000000002',
  exam1Report: '84000000-0000-0000-0000-100000000001',
  exam2Report: '84000000-0000-0000-0000-100000000002',
  result1: '86000000-0000-0000-0000-100000000001',
  result2: '86000000-0000-0000-0000-100000000002',
  result3: '86000000-0000-0000-0000-100000000003',
  result4: '86000000-0000-0000-0000-100000000004',
  result5: '86000000-0000-0000-0000-100000000005',
  result6: '86000000-0000-0000-0000-100000000006',
  result7: '86000000-0000-0000-0000-100000000007',
  result8: '86000000-0000-0000-0000-100000000008',
  result9: '86000000-0000-0000-0000-100000000009',
  result10: '86000000-0000-0000-0000-100000000010',
  notification1: '87000000-0000-0000-0000-100000000001',
  notification2: '87000000-0000-0000-0000-100000000002',
  notesAccessLog: '88000000-0000-0000-0000-100000000001',
  recommendation1: '89000000-0000-0000-0000-100000000001',
  recommendation2: '89000000-0000-0000-0000-100000000002',
  notesDeliveryLock: '8a000000-0000-0000-0000-100000000001',
  tutorHelpRequest: '8b000000-0000-0000-0000-100000000001',
  tutorialDomain: '90000000-0000-0000-0000-100000000001',
  tutorialSubject: '90000000-0000-0000-0000-100000000002',
  tutorialTopic: '90000000-0000-0000-0000-100000000003',
  tutorialSubtopic: '90000000-0000-0000-0000-100000000004',
  contentSimple: '91000000-0000-0000-0000-100000000001',
  contentMixed: '91000000-0000-0000-0000-100000000002',
  contentIntermediate: '91000000-0000-0000-0000-100000000003',
  contentExpert: '91000000-0000-0000-0000-100000000004',
  contentVersion1: '92000000-0000-0000-0000-100000000001',
  contentVersion2: '92000000-0000-0000-0000-100000000002',
  contentVersion3: '92000000-0000-0000-0000-100000000003',
  contentVersion4: '92000000-0000-0000-0000-100000000004',
  contentAudit1: '93000000-0000-0000-0000-100000000001',
  contentAudit2: '93000000-0000-0000-0000-100000000002',
  contentAudit3: '93000000-0000-0000-0000-100000000003',
  contentAudit4: '93000000-0000-0000-0000-100000000004',
  assignmentSimple: '94000000-0000-0000-0000-100000000001',
  assignmentMixed: '94000000-0000-0000-0000-100000000002',
  assignmentIntermediate: '94000000-0000-0000-0000-100000000003',
  assignmentExpert: '94000000-0000-0000-0000-100000000004',
  assignmentProgressSimple: '95000000-0000-0000-0000-100000000001',
  assignmentProgressMixed: '95000000-0000-0000-0000-100000000002',
  assignmentProgressIntermediate: '95000000-0000-0000-0000-100000000003',
  assignmentProgressExpert: '95000000-0000-0000-0000-100000000004',
  assignmentHelpRequest: '96000000-0000-0000-0000-100000000001',
  liveSessionRequest: '97000000-0000-0000-0000-100000000001',
  badgeTopic: '98000000-0000-0000-0000-100000000001',
  badgeSubject: '98000000-0000-0000-0000-100000000002',
  badgeDomain: '98000000-0000-0000-0000-100000000003',
  projectTopic: '99000000-0000-0000-0000-100000000001',
  projectSubject: '99000000-0000-0000-0000-100000000002',
  projectDomain: '99000000-0000-0000-0000-100000000003',
  projectSubmissionTopic: '9a000000-0000-0000-0000-100000000001',
  projectSubmissionSubject: '9a000000-0000-0000-0000-100000000002',
  projectSubmissionDomain: '9a000000-0000-0000-0000-100000000003',
  studentBadge: '9b000000-0000-0000-0000-100000000001',
  certificate: '9c000000-0000-0000-0000-100000000001',
  videoSubtopic: '9d000000-0000-0000-0000-100000000001',
  videoProject: '9d000000-0000-0000-0000-100000000002',
  streak: '9e000000-0000-0000-0000-100000000001',
  domainConfig: '9f000000-0000-0000-0000-100000000001',
  contentJob1: 'a0000000-0000-0000-0000-100000000001',
  contentJob2: 'a0000000-0000-0000-0000-100000000002',
};

const dates = {
  profileUpdated: new Date('2026-03-10T09:00:00Z'),
  hierarchyUpdated: new Date('2026-03-10T10:00:00Z'),
  contentPublished: new Date('2026-03-11T08:00:00Z'),
  contentSnapshot: new Date('2026-03-11T08:30:00Z'),
  progressStarted: new Date('2026-03-12T06:30:00Z'),
  progressCompleted: new Date('2026-03-12T07:20:00Z'),
  exam1Started: new Date('2026-03-20T09:00:00Z'),
  exam1Completed: new Date('2026-03-20T09:42:00Z'),
  exam2Started: new Date('2026-03-24T09:00:00Z'),
  exam2Completed: new Date('2026-03-24T09:38:00Z'),
  remediationCreated: new Date('2026-03-24T10:05:00Z'),
  projectSubmitted: new Date('2026-03-21T12:00:00Z'),
  projectReviewed: new Date('2026-03-22T10:00:00Z'),
  certificateIssued: new Date('2026-03-23T10:00:00Z'),
};

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function loopingContent(difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert'): TutorialContentJSON {
  const sharedAiTutor = [
    {
      question: 'What is looping used for?',
      answer: 'Looping is used when you need to repeat work for a list of values or until a condition changes.',
    },
    {
      question: 'Why would I choose while over for?',
      answer: 'Use while when the number of iterations is not fixed ahead of time and the stopping condition may change.',
    },
    {
      question: 'What is the difference between break and continue?',
      answer: 'break exits the loop completely, while continue skips only the current iteration.',
    },
  ];

  if (difficulty === 'mixed') {
    return {
      notes: { markdown: 'Looping lets JavaScript repeat the same block of code until you tell it to stop. The common tools are `for`, `while`, and `do...while`.' },
      layman: {
        simpleExplanation: 'A loop is like walking around a circular track. You keep going around until the coach says stop.',
        analogyOrStory: 'Think of checking each seat in a bus row by row.',
        example1: { company: 'Amazon', content: 'A cart total is recalculated as each item is added or removed.' },
        example2: { company: 'Uber', content: 'A driver app repeatedly checks for new ride requests until one is accepted.' },
      },
      real_life: {
        title: 'Looping through a shopping cart',
        scenario: 'An e-commerce app loops through every item in the cart to calculate subtotal, tax, shipping, and discounts.',
        bullets: [
          { label: 'Start point', detail: 'The app begins with the first item in the cart.' },
          { label: 'Repeated action', detail: 'The total is updated for each item as the loop advances.' },
          { label: 'Stop point', detail: 'The loop ends once the last item has been processed.' },
        ],
        tip: 'Use a loop whenever the same operation must happen for many values.',
      },
      technical: {
        markdown: 'A loop usually has three parts: initialization, condition, and update. In a while loop, the update must happen inside the body.',
        bullets: [
          { term: 'Initialization', detail: 'Set the starting value before the loop begins.' },
          { term: 'Condition', detail: 'Check whether the loop should keep running.' },
          { term: 'Update', detail: 'Move to the next step so the loop can eventually stop.' },
        ],
        tip: 'Always ensure the loop changes state, otherwise it can run forever.',
      },
      code: {
        language: 'javascript',
        intro: 'This example prints the numbers from 0 to 4 using a for loop.',
        code: 'for (let index = 0; index < 5; index += 1) {\n  console.log(index);\n}\n\nlet attempts = 0;\nwhile (attempts < 3) {\n  attempts += 1;\n}',
        steps: ['Set the starting counter to zero.', 'Keep looping while the counter is less than the target.', 'Increase the counter on each turn so the loop ends.'],
      },
      ai_tutor: { greeting: 'Let us practice JavaScript looping together.', qa_pairs: sharedAiTutor },
    };
  }

  if (difficulty === 'intermediate') {
    return {
      notes: { markdown: 'Looping becomes more useful when you combine it with conditions and nested structures. You can use `continue` to skip a value, `break` to stop early, and nested loops to work with rows and columns.' },
      layman: {
        simpleExplanation: 'A loop is a repeat button. At this level you use that button to skip some steps, stop early, or run a loop inside another loop.',
        analogyOrStory: 'Imagine sorting books on shelves. You walk along one shelf, and if each shelf has multiple rows, you may need another loop to move across the rows too.',
        example1: { company: 'Netflix', content: 'The app loops through a list of recommended titles and skips ones the user already watched.' },
        example2: { company: 'Google Maps', content: 'A route calculation can loop through possible paths, skipping the invalid ones and stopping when the best route is found.' },
      },
      real_life: {
        title: 'Processing rows in a spreadsheet',
        scenario: 'A reporting dashboard loops through every row in a spreadsheet export, skips blank rows, and stops when a validation error is found.',
        bullets: [
          { label: 'Skip invalid data', detail: 'continue helps jump over rows that should not be processed.' },
          { label: 'Stop on error', detail: 'break helps end the process when a blocking issue is found.' },
          { label: 'Nested work', detail: 'one loop can work through groups while another handles items inside the group.' },
        ],
        tip: 'Use nested loops carefully, because performance drops quickly when data sets grow.',
      },
      technical: {
        markdown: 'An intermediate loop solution should be readable and defensive. Use meaningful variable names and prefer `for...of` when index math is not needed.',
        bullets: [
          { term: 'for...of', detail: 'Clean array iteration when the index is not required.' },
          { term: 'continue', detail: 'Skip the current item without leaving the loop.' },
          { term: 'break', detail: 'Exit the loop early when the target condition is satisfied.' },
        ],
        tip: 'If you are looping over arrays, ask whether `for...of` is more readable than a classic `for` loop.',
      },
      code: {
        language: 'javascript',
        intro: 'This example sums only the even values from an array.',
        code: 'const values = [1, 2, 3, 4, 5, 6];\nlet total = 0;\n\nfor (const value of values) {\n  if (value % 2 !== 0) {\n    continue;\n  }\n\n  total += value;\n}\n\nconsole.log(total);',
        steps: ['Create an array with mixed values.', 'Skip values that do not match the rule.', 'Add only the allowed values to the total.'],
      },
      ai_tutor: { greeting: 'Let us handle loops with conditions and nested logic.', qa_pairs: sharedAiTutor },
    };
  }

  if (difficulty === 'expert') {
    return {
      notes: { markdown: 'At expert level, looping is about choosing the right structure, understanding complexity, and avoiding unnecessary work. You may compare `for`, `while`, `map`, `filter`, and `reduce` based on readability and performance.' },
      layman: {
        simpleExplanation: 'A loop is a workhorse. The expert version is about picking the best workhorse for the job so the code stays fast and easy to understand.',
        analogyOrStory: 'Think of a delivery driver choosing the best route. Sometimes the shortest path is not the easiest to maintain.',
        example1: { company: 'Spotify', content: 'A recommendation engine may loop through many candidate tracks, but it should stop early when enough relevant matches are found.' },
        example2: { company: 'Facebook', content: 'A feed renderer chooses the most efficient iteration pattern when rendering many cards on a page.' },
      },
      real_life: {
        title: 'High-volume iteration in a dashboard',
        scenario: 'A monitoring dashboard processes thousands of events every minute. The loop must be efficient, easy to read, and safe against accidental infinite repetition.',
        bullets: [
          { label: 'Keep it readable', detail: 'Future developers should understand the loop without guessing.' },
          { label: 'Avoid waste', detail: 'Do not reprocess values that do not need attention.' },
          { label: 'Measure impact', detail: 'When data is large, even small loop choices can affect the user experience.' },
        ],
        tip: 'Prefer clarity first; optimize only when the data proves the loop is a bottleneck.',
      },
      technical: {
        markdown: 'Expert looping is about tradeoffs. Arrays with transform logic often fit `map`, `filter`, or `reduce`, while plain repetition or early exit cases fit `for` and `while`.',
        bullets: [
          { term: 'Complexity', detail: 'Nested loops can increase cost quickly as data grows.' },
          { term: 'Early exit', detail: 'Break out when the target result is already found.' },
          { term: 'Function choice', detail: 'Use array helpers when they make intent clearer than a manual loop.' },
        ],
        tip: 'Readability is a performance feature too, because it reduces bugs and maintenance cost.',
      },
      code: {
        language: 'javascript',
        intro: 'This example exits early once the target value is found.',
        code: 'const values = [8, 14, 21, 34, 55, 89];\nlet found = false;\n\nfor (const value of values) {\n  if (value === 34) {\n    found = true;\n    break;\n  }\n}\n\nconsole.log(found);',
        steps: ['Iterate through a list of values.', 'Stop the loop as soon as the target item is found.', 'Avoid extra work after the answer is already known.'],
      },
      ai_tutor: { greeting: 'We can go beyond syntax and talk about loop strategy.', qa_pairs: sharedAiTutor },
    };
  }

  return {
    notes: { markdown: 'Looping is one of the most important building blocks in JavaScript. It lets you repeat work for arrays, data feeds, and conditions that change over time.' },
    layman: {
      simpleExplanation: 'A loop is a repeat sign for code. Instead of writing the same instruction many times, you ask JavaScript to do it until the stop condition is reached.',
      analogyOrStory: 'Imagine a person watering ten plants one after another.',
      example1: { company: 'Swiggy', content: 'A delivery tracker loops over status updates until the order reaches the customer.' },
      example2: { company: 'Zerodha', content: 'A dashboard refreshes values in a repeated cycle while the market is open.' },
    },
    real_life: {
      title: 'Counting items in a classroom',
      scenario: 'A class attendance screen loops through every student name and marks whether the student is present.',
      bullets: [
        { label: 'Repeat one action', detail: 'The same check happens for each student.' },
        { label: 'Move step by step', detail: 'Each iteration processes the next item.' },
        { label: 'Finish at the end', detail: 'The loop stops after the last student.' },
      ],
      tip: 'If you can describe the job as “do this for every item,” you probably need a loop.',
    },
    technical: {
      markdown: 'A loop should have a clear starting point, a condition that eventually becomes false, and a body that does the repeated work.',
      bullets: [
        { term: 'Start', detail: 'Initialize the counter or iterator.' },
        { term: 'Check', detail: 'Validate whether the loop should keep going.' },
        { term: 'Advance', detail: 'Move to the next item or increment the counter.' },
      ],
      tip: 'One small, clear loop is better than a clever loop that nobody can read.',
    },
    code: { language: 'javascript', intro: 'A simple loop that prints the numbers from 0 to 2.', code: 'for (let i = 0; i < 3; i += 1) {\n  console.log(i);\n}', steps: ['Start counting from zero.', 'Keep going while the counter is smaller than 3.', 'Increase the counter after each turn.'] },
    ai_tutor: { greeting: 'Let us start with the basics of looping.', qa_pairs: sharedAiTutor },
  };
}

function buildAssignmentContent(difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert', title: string) {
  return {
    prompt: `Solve the ${difficulty} looping challenge: ${title}`,
    focus: ['looping', 'iteration', difficulty],
    rubric: ['Uses the correct loop type', 'Explains the stop condition', 'Handles edge cases cleanly'],
    sampleAnswer: `The ${difficulty} solution should use a clear loop, a safe stop condition, and readable variable names.`,
  };
}

function buildProjectSubmissionContent(title: string, summary: string) {
  return {
    title,
    summary,
    deliverables: ['source-code', 'README', 'short-demo-notes'],
  };
}

async function ensureUser(): Promise<string> {
  const existing = await quizDb.select({ id: users.id }).from(users).where(eq(users.email, AJAY_EMAIL)).limit(1);

  if (existing[0] === undefined) {
    throw new Error(`Expected existing user ${AJAY_EMAIL} to be present in the quiz database`);
  }

  await quizDb
    .update(users)
    .set({
      passwordHash: FIXED_HASH,
      emailVerified: true,
      isBlocked: false,
      deletedAt: null,
      updatedAt: dates.profileUpdated,
    })
    .where(eq(users.id, existing[0].id));

  return existing[0].id;
}

async function ensureRole(name: 'USER' | 'ADMIN' | 'SUPER_ADMIN'): Promise<string> {
  const existing = await quizDb.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);
  if (existing[0] !== undefined) {
    return existing[0].id;
  }

  const [row] = await quizDb.insert(roles).values({ name }).returning({ id: roles.id });
  return row.id;
}

async function ensureUserRole(userId: string, roleId: string): Promise<void> {
  await quizDb.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
}

async function upsertDomainRecord(name: string, description: string, category: string): Promise<string> {
  const existing = await quizDb.select({ id: domains.id }).from(domains).where(eq(domains.name, name)).limit(1);
  if (existing[0] !== undefined) {
    await quizDb
      .update(domains)
      .set({
        description,
        category,
        status: 'active',
        tutorialSyncStatus: 'synced',
        updatedAt: dates.hierarchyUpdated,
      })
      .where(eq(domains.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await quizDb
    .insert(domains)
    .values({
      id: ids.domain,
      name,
      description,
      category,
      status: 'active',
      tutorialSyncStatus: 'synced',
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: domains.id });

  return row.id;
}

async function upsertSubjectRecord(domainId: string, name: string, description: string, order: number): Promise<string> {
  const existing = await quizDb
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.domainId, domainId))
    .limit(50);
  const match = existing.find((row) => row.name === name);

  if (match !== undefined) {
    await quizDb
      .update(subjects)
      .set({
        description,
        order,
        status: 'active',
        tutorialSyncStatus: 'synced',
        updatedAt: dates.hierarchyUpdated,
      })
      .where(eq(subjects.id, match.id));
    return match.id;
  }

  const [row] = await quizDb
    .insert(subjects)
    .values({
      id: ids.subject,
      domainId,
      name,
      description,
      order,
      status: 'active',
      tutorialSyncStatus: 'synced',
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: subjects.id });

  return row.id;
}

async function upsertTopicRecord(subjectId: string, name: string, description: string, learningUrl: string): Promise<string> {
  const existing = await quizDb
    .select({ id: topics.id, name: topics.name })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .limit(50);
  const match = existing.find((row) => row.name === name);

  if (match !== undefined) {
    await quizDb
      .update(topics)
      .set({
        description,
        learningUrl,
        detailedNotesPath: learningUrl,
        notesAssetId: `notes-${slugify(name)}`,
        complexityLevel: 2,
        weight: 3,
        status: 'active',
        tutorialSyncStatus: 'synced',
        updatedAt: dates.hierarchyUpdated,
      })
      .where(eq(topics.id, match.id));
    return match.id;
  }

  const [row] = await quizDb
    .insert(topics)
    .values({
      id: ids.topic,
      subjectId,
      name,
      description,
      learningUrl,
      detailedNotesPath: learningUrl,
      notesAssetId: `notes-${slugify(name)}`,
      complexityLevel: 2,
      weight: 3,
      status: 'active',
      tutorialSyncStatus: 'synced',
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: topics.id });

  return row.id;
}

async function upsertSubtopicRecord(topicId: string, name: string, description: string): Promise<string> {
  const existing = await quizDb
    .select({ id: subtopics.id, name: subtopics.name })
    .from(subtopics)
    .where(eq(subtopics.topicId, topicId))
    .limit(50);
  const match = existing.find((row) => row.name === name);

  if (match !== undefined) {
    await quizDb
      .update(subtopics)
      .set({
        description,
        depthLevel: 4,
        tutorialSyncStatus: 'synced',
      })
      .where(eq(subtopics.id, match.id));
    return match.id;
  }

  const [row] = await quizDb
    .insert(subtopics)
    .values({
      id: ids.subtopic,
      topicId,
      name,
      description,
      depthLevel: 4,
      tutorialSyncStatus: 'synced',
    })
    .returning({ id: subtopics.id });

  return row.id;
}

async function ensureSkill(name: string, category: 'technical' | 'cognitive' | 'process', mappingType: 'conceptual' | 'technical' | 'practical'): Promise<string> {
  const existing = await quizDb.select({ id: skills.id }).from(skills).where(eq(skills.name, name)).limit(1);
  if (existing[0] !== undefined) {
    await quizDb
      .update(skills)
      .set({ category, mappingType, weight: 2, updatedAt: dates.hierarchyUpdated })
      .where(eq(skills.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await quizDb
    .insert(skills)
    .values({
      id: name === 'Iteration Logic' ? ids.skillIteration : ids.skillLoopDebug,
      name,
      category,
      mappingType,
      weight: 2,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: skills.id });

  return row.id;
}

async function ensureTopicSkill(topicId: string, skillId: string): Promise<void> {
  await quizDb.insert(topicSkills).values({ topicId, skillId }).onConflictDoNothing();
}

async function upsertQuestionRecord(input: {
  id: string;
  topicId: string;
  subtopicId: string;
  skillId: string;
  difficulty: 'simple' | 'intermediate' | 'expert';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
}): Promise<string> {
  const existing = await quizDb.select({ id: questions.id }).from(questions).where(eq(questions.id, input.id)).limit(1);
  if (existing[0] !== undefined) {
    await quizDb
      .update(questions)
      .set({
        topicId: input.topicId,
        subtopicId: input.subtopicId,
        skillId: input.skillId,
        difficulty: input.difficulty,
        type: 'mcq',
        mappingType: 'conceptual',
        questionText: input.questionText,
        options: input.options,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        status: 'active',
        deletedAt: null,
        tags: input.tags,
        updatedAt: dates.hierarchyUpdated,
      })
      .where(eq(questions.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await quizDb
    .insert(questions)
    .values({
      id: input.id,
      topicId: input.topicId,
      subtopicId: input.subtopicId,
      skillId: input.skillId,
      difficulty: input.difficulty,
      type: 'mcq',
      mappingType: 'conceptual',
      questionText: input.questionText,
      options: input.options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      status: 'active',
      deletedAt: null,
      tags: input.tags,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: questions.id });

  return row.id;
}

async function ensureBlueprint(questionIds: string[], domainId: string, subjectId: string, topicId: string, subtopicId: string): Promise<string> {
  const existing = await quizDb.select({ id: examBlueprints.id }).from(examBlueprints).where(eq(examBlueprints.id, ids.blueprint)).limit(1);
  const values = {
    id: ids.blueprint,
    name: 'Frontend Looping Demo Exam',
    description: 'A demo blueprint for the looping lesson flow',
    domains: [domainId],
    subjects: [subjectId],
    topics: [topicId],
    subtopics: [subtopicId],
    questionIds,
    totalQuestions: 6,
    timeLimit: 45,
    difficultyDistribution: { simple: 40, intermediate: 40, expert: 20 },
  };

  if (existing[0] !== undefined) {
    await quizDb
      .update(examBlueprints)
      .set({
        description: values.description,
        domains: values.domains,
        subjects: values.subjects,
        topics: values.topics,
        subtopics: values.subtopics,
        questionIds: values.questionIds,
        totalQuestions: values.totalQuestions,
        timeLimit: values.timeLimit,
        difficultyDistribution: values.difficultyDistribution,
      })
      .where(eq(examBlueprints.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await quizDb.insert(examBlueprints).values(values).returning({ id: examBlueprints.id });
  return row.id;
}

async function upsertExamRecord(input: {
  id: string;
  userId: string;
  blueprintId: string;
  totalScore: number;
  durationSeconds: number;
  startedAt: Date;
  completedAt: Date;
  reportPdfUrl: string;
}): Promise<string> {
  const existing = await quizDb.select({ id: exams.id }).from(exams).where(eq(exams.id, input.id)).limit(1);
  const payload = {
    id: input.id,
    userId: input.userId,
    blueprintId: input.blueprintId,
    status: 'completed' as const,
    totalScore: input.totalScore,
    durationSeconds: input.durationSeconds,
    startedAt: input.startedAt,
    lastAnsweredAt: input.completedAt,
    completedAt: input.completedAt,
    deletedAt: null,
    reportMaterialized: {
      score: input.totalScore,
      summary: 'Looping demo exam result',
    },
    exportUrls: {
      pdf: input.reportPdfUrl,
    },
  };

  if (existing[0] !== undefined) {
    await quizDb
      .update(exams)
      .set({
        blueprintId: input.blueprintId,
        status: 'completed',
        totalScore: input.totalScore,
        durationSeconds: input.durationSeconds,
        startedAt: input.startedAt,
        lastAnsweredAt: input.completedAt,
        completedAt: input.completedAt,
        deletedAt: null,
        reportMaterialized: payload.reportMaterialized,
        exportUrls: payload.exportUrls,
      })
      .where(eq(exams.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await quizDb.insert(exams).values(payload).returning({ id: exams.id });
  return row.id;
}

async function upsertExamQuestions(examId: string, questionRows: Array<{
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  order: number;
  responseMetadata: Record<string, unknown>;
}>): Promise<void> {
  const examQuestionIds = examId === ids.exam1
    ? [ids.exam1Question1, ids.exam1Question2, ids.exam1Question3, ids.exam1Question4, ids.exam1Question5, ids.exam1Question6]
    : [ids.exam2Question1, ids.exam2Question2, ids.exam2Question3, ids.exam2Question4, ids.exam2Question5, ids.exam2Question6];

  for (const row of questionRows) {
    await quizDb
      .insert(examQuestions)
      .values({
        id: examQuestionIds[row.order - 1],
        examId,
        questionId: row.questionId,
        userAnswer: row.userAnswer,
        isCorrect: row.isCorrect,
        responseMetadata: row.responseMetadata,
        order: row.order,
      })
      .onConflictDoUpdate({
        target: examQuestions.id,
        set: {
          userAnswer: row.userAnswer,
          isCorrect: row.isCorrect,
          responseMetadata: row.responseMetadata,
          order: row.order,
        },
      });
  }
}

async function upsertResultDimension(
  examId: string,
  dimensionType: string,
  dimensionId: string,
  name: string,
  score: number,
  accuracy: number,
  suffix: string,
): Promise<void> {
  const resultIdMap = examId === ids.exam1
    ? [ids.result1, ids.result2, ids.result3, ids.result4, ids.result5]
    : [ids.result6, ids.result7, ids.result8, ids.result9, ids.result10];
  const id = resultIdMap[Number(suffix) - 1];
  await quizDb
    .insert(resultsByDimension)
    .values({
      id,
      examId,
      dimensionType,
      dimensionId,
      name,
      score,
      accuracy,
    })
    .onConflictDoUpdate({
      target: resultsByDimension.id,
      set: {
        examId,
        dimensionType,
        dimensionId,
        name,
        score,
        accuracy,
      },
    });
}

async function upsertReportJob(input: { id: string; userId: string; examId: string; status: 'queued' | 'processing' | 'completed' | 'failed'; progress: number; pdfUrl: string }): Promise<void> {
  await quizDb
    .insert(reportJobs)
    .values({
      id: input.id,
      userId: input.userId,
      examId: input.examId,
      status: input.status,
      progress: input.progress,
      pdfUrl: input.pdfUrl,
      retryCount: 0,
      maxRetries: 3,
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: reportJobs.id,
      set: {
        userId: input.userId,
        examId: input.examId,
        status: input.status,
        progress: input.progress,
        pdfUrl: input.pdfUrl,
        retryCount: 0,
        maxRetries: 3,
        errorMessage: null,
      },
    });
}

async function upsertReport(input: { id: string; attemptId: string; userId: string; fileRef: string; status: 'pending' | 'generating' | 'ready' | 'failed'; layoutVersion: number }): Promise<void> {
  await quizDb
    .insert(reports)
    .values({
      id: input.id,
      attemptId: input.attemptId,
      userId: input.userId,
      storageProvider: 'blob',
      fileRef: input.fileRef,
      status: input.status,
      pageCount: 8,
      fileSizeKb: 420,
      generationTimeMs: 1800,
      layoutVersion: input.layoutVersion,
      errorStage: null,
    })
    .onConflictDoUpdate({
      target: reports.attemptId,
      set: {
        userId: input.userId,
        storageProvider: 'blob',
        fileRef: input.fileRef,
        status: input.status,
        pageCount: 8,
        fileSizeKb: 420,
        generationTimeMs: 1800,
        layoutVersion: input.layoutVersion,
        errorStage: null,
        updatedAt: new Date(),
      },
    });
}

async function upsertNotification(input: { id: string; userId: string; type: 'notes_sent' | 'level_up' | 'live_session' | 'system' | 'help_requested' | 'live_session_alert'; title: string; message: string; actionUrl?: string | null; metadata?: Record<string, unknown> | null; isRead?: boolean }): Promise<void> {
  await quizDb
    .insert(notifications)
    .values({
      id: input.id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl ?? null,
      metadata: input.metadata ?? null,
      isRead: input.isRead ?? false,
      readAt: input.isRead ? dates.remediationCreated : null,
    })
    .onConflictDoUpdate({
      target: notifications.id,
      set: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl ?? null,
        metadata: input.metadata ?? null,
        isRead: input.isRead ?? false,
        readAt: input.isRead ? dates.remediationCreated : null,
      },
    });
}

async function upsertNotesAccessLog(userId: string, topicId: string): Promise<void> {
  await quizDb
    .insert(notesAccessLogs)
    .values({
      id: ids.notesAccessLog,
      userId,
      topicId,
      deliveredVia: 'dashboard',
    })
    .onConflictDoUpdate({
      target: notesAccessLogs.id,
      set: {
        userId,
        topicId,
        deliveredVia: 'dashboard',
      },
    });
}

async function upsertUserRecommendation(userId: string, topicId: string, sourceExamId: string, recommendationLevel: 'revise' | 'practice' | 'advance'): Promise<void> {
  const id = recommendationLevel === 'revise' ? ids.recommendation1 : ids.recommendation2;
  await quizDb
    .insert(userRecommendations)
    .values({
      id,
      userId,
      topicId,
      recommendationLevel,
      sourceExamId,
      metadata: { source: 'looping-demo', createdFor: AJAY_EMAIL },
    })
    .onConflictDoUpdate({
      target: userRecommendations.id,
      set: {
        userId,
        topicId,
        recommendationLevel,
        sourceExamId,
        metadata: { source: 'looping-demo', createdFor: AJAY_EMAIL },
      },
    });
}

async function upsertNotesDeliveryLock(userId: string, topicId: string): Promise<void> {
  await quizDb
    .insert(notesDeliveryLocks)
    .values({
      id: ids.notesDeliveryLock,
      userId,
      topicId,
      deliveryDate: '2026-03-29',
    })
    .onConflictDoUpdate({
      target: notesDeliveryLocks.id,
      set: {
        userId,
        topicId,
        deliveryDate: '2026-03-29',
      },
    });
}

async function upsertTutorHelpRequest(userId: string, topicId: string, examId: string): Promise<void> {
  await quizDb
    .insert(tutorHelpRequests)
    .values({
      id: ids.tutorHelpRequest,
      userId,
      topicId,
      status: 'pending',
      priority: 'high',
      metadata: {
        examResultId: examId,
        reason: 'weak looping score after exam',
      },
    })
    .onConflictDoUpdate({
      target: tutorHelpRequests.id,
      set: {
        userId,
        topicId,
        status: 'pending',
        priority: 'high',
        metadata: {
          examResultId: examId,
          reason: 'weak looping score after exam',
        },
      },
    });
}

async function seedCentralQuizData(userId: string): Promise<{
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  exam2Id: string;
}> {
  const roleId = await ensureRole('USER');
  await ensureUserRole(userId, roleId);

  const existingProfile = await quizDb.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existingProfile[0] !== undefined) {
    await quizDb
      .update(userProfiles)
      .set({
        name: 'Ajay Shah',
        educationLevel: 'Bachelors',
        professionalStatus: 'Learner',
        ageGroup: '25-30',
        experienceYears: 2,
        domainInterest: ['Full Stack Development', 'Front End Development'],
        adaptiveLevel: 'intermediate',
        updatedAt: dates.profileUpdated,
      })
      .where(eq(userProfiles.id, existingProfile[0].id));
  } else {
    await quizDb.insert(userProfiles).values({
      id: 'b1000000-0000-0000-0000-100000000001',
      userId,
      name: 'Ajay Shah',
      educationLevel: 'Bachelors',
      professionalStatus: 'Learner',
      ageGroup: '25-30',
      experienceYears: 2,
      domainInterest: ['Full Stack Development', 'Front End Development'],
      adaptiveLevel: 'intermediate',
      updatedAt: dates.profileUpdated,
    });
  }

  const domainId = await upsertDomainRecord('Full Stack Development', 'Full stack development notes and practice path', 'Technology');
  const subjectId = await upsertSubjectRecord(domainId, 'Front End Development', 'Everything the student needs for front end work', 1);
  const topicId = await upsertTopicRecord(subjectId, 'JavaScript Fundamentals', 'Core JavaScript concepts with looping examples', `/learn/${slugify('Full Stack Development')}/${slugify('Front End Development')}/${slugify('JavaScript Fundamentals')}/${slugify('Looping')}`);
  const subtopicId = await upsertSubtopicRecord(topicId, 'Looping', 'Learn for, while, and nested loops with practical examples');

  const iterationSkillId = await ensureSkill('Iteration Logic', 'technical', 'conceptual');
  const loopDebugSkillId = await ensureSkill('Loop Debugging', 'technical', 'technical');
  await ensureTopicSkill(topicId, iterationSkillId);
  await ensureTopicSkill(topicId, loopDebugSkillId);

  const questionData = [
    {
      id: ids.question1,
      topicId,
      subtopicId,
      skillId: iterationSkillId,
      difficulty: 'simple' as const,
      questionText: 'What does a for loop help you do in JavaScript?',
      options: ['Repeat work', 'Create a server', 'Store a password', 'Build CSS'],
      correctAnswer: 'Repeat work',
      explanation: 'A for loop repeats the same logic until the stop condition is reached.',
      tags: ['looping', 'javascript', 'iteration'],
    },
    {
      id: ids.question2,
      topicId,
      subtopicId,
      skillId: iterationSkillId,
      difficulty: 'simple' as const,
      questionText: 'Which keyword skips the current loop iteration?',
      options: ['break', 'continue', 'return', 'skip'],
      correctAnswer: 'continue',
      explanation: 'continue moves the loop to the next iteration without leaving the loop.',
      tags: ['continue', 'looping'],
    },
    {
      id: ids.question3,
      topicId,
      subtopicId,
      skillId: loopDebugSkillId,
      difficulty: 'intermediate' as const,
      questionText: 'Which loop is best when the number of iterations is not fixed?',
      options: ['for', 'while', 'switch', 'try/catch'],
      correctAnswer: 'while',
      explanation: 'A while loop is useful when the ending condition may change at runtime.',
      tags: ['while', 'looping'],
    },
    {
      id: ids.question4,
      topicId,
      subtopicId,
      skillId: loopDebugSkillId,
      difficulty: 'intermediate' as const,
      questionText: 'What should every loop have to avoid running forever?',
      options: ['A stop condition', 'A CSS class', 'A network request', 'A button'],
      correctAnswer: 'A stop condition',
      explanation: 'The loop must eventually change so the condition becomes false.',
      tags: ['infinite-loop', 'condition'],
    },
    {
      id: ids.question5,
      topicId,
      subtopicId,
      skillId: loopDebugSkillId,
      difficulty: 'expert' as const,
      questionText: 'When does a nested loop become expensive?',
      options: ['When data grows', 'When it is in a component', 'When it has comments', 'When it uses let'],
      correctAnswer: 'When data grows',
      explanation: 'Nested loops can multiply work, so large data sets increase cost quickly.',
      tags: ['nested-loop', 'performance'],
    },
    {
      id: ids.question6,
      topicId,
      subtopicId,
      skillId: iterationSkillId,
      difficulty: 'expert' as const,
      questionText: 'Which loop choice is usually best when readability matters more than raw control?',
      options: ['for', 'while', 'for...of', 'do...while'],
      correctAnswer: 'for...of',
      explanation: 'for...of reads naturally for array iteration and avoids manual index handling.',
      tags: ['for-of', 'readability'],
    },
  ] satisfies Array<{
    id: string;
    topicId: string;
    subtopicId: string;
    skillId: string;
    difficulty: 'simple' | 'intermediate' | 'expert';
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    tags: string[];
  }>;

  for (const q of questionData) {
    await upsertQuestionRecord(q);
  }

  for (const questionId of [ids.question1, ids.question2, ids.question3, ids.question4, ids.question5, ids.question6]) {
    await quizDb
      .insert(questionSkills)
      .values({
        questionId,
        skillId: questionId === ids.question5 || questionId === ids.question6 ? loopDebugSkillId : iterationSkillId,
      })
      .onConflictDoNothing();
  }

  await ensureBlueprint(questionData.map((item) => item.id), domainId, subjectId, topicId, subtopicId);

  const exam1ReportUrl = 'https://storage.example.com/reports/ajay-looping-exam-1.pdf';
  const exam2ReportUrl = 'https://storage.example.com/reports/ajay-looping-exam-2.pdf';

  const exam1Id = await upsertExamRecord({
    id: ids.exam1,
    userId,
    blueprintId: ids.blueprint,
    totalScore: 72,
    durationSeconds: 2520,
    startedAt: dates.exam1Started,
    completedAt: dates.exam1Completed,
    reportPdfUrl: exam1ReportUrl,
  });

  const exam2Id = await upsertExamRecord({
    id: ids.exam2,
    userId,
    blueprintId: ids.blueprint,
    totalScore: 48,
    durationSeconds: 2280,
    startedAt: dates.exam2Started,
    completedAt: dates.exam2Completed,
    reportPdfUrl: exam2ReportUrl,
  });

  await upsertExamQuestions(exam1Id, [
    { questionId: ids.question1, userAnswer: 'Repeat work', isCorrect: true, order: 1, responseMetadata: { timeSpentSec: 28 } },
    { questionId: ids.question2, userAnswer: 'continue', isCorrect: true, order: 2, responseMetadata: { timeSpentSec: 31 } },
    { questionId: ids.question3, userAnswer: 'while', isCorrect: true, order: 3, responseMetadata: { timeSpentSec: 35 } },
    { questionId: ids.question4, userAnswer: 'A stop condition', isCorrect: true, order: 4, responseMetadata: { timeSpentSec: 29 } },
    { questionId: ids.question5, userAnswer: 'When data grows', isCorrect: false, order: 5, responseMetadata: { timeSpentSec: 46 } },
    { questionId: ids.question6, userAnswer: 'for...of', isCorrect: true, order: 6, responseMetadata: { timeSpentSec: 33 } },
  ]);

  await upsertExamQuestions(exam2Id, [
    { questionId: ids.question1, userAnswer: 'Create a server', isCorrect: false, order: 1, responseMetadata: { timeSpentSec: 34 } },
    { questionId: ids.question2, userAnswer: 'break', isCorrect: false, order: 2, responseMetadata: { timeSpentSec: 39 } },
    { questionId: ids.question3, userAnswer: 'while', isCorrect: true, order: 3, responseMetadata: { timeSpentSec: 27 } },
    { questionId: ids.question4, userAnswer: 'A CSS class', isCorrect: false, order: 4, responseMetadata: { timeSpentSec: 31 } },
    { questionId: ids.question5, userAnswer: 'When data grows', isCorrect: true, order: 5, responseMetadata: { timeSpentSec: 37 } },
    { questionId: ids.question6, userAnswer: 'for', isCorrect: false, order: 6, responseMetadata: { timeSpentSec: 29 } },
  ]);

  await upsertResultDimension(exam1Id, 'domain', domainId, 'Full Stack Development', 72, 72, '1');
  await upsertResultDimension(exam1Id, 'subject', subjectId, 'Front End Development', 74, 74, '2');
  await upsertResultDimension(exam1Id, 'topic', topicId, 'JavaScript Fundamentals', 70, 70, '3');
  await upsertResultDimension(exam1Id, 'subtopic', subtopicId, 'Looping', 68, 68, '4');
  await upsertResultDimension(exam1Id, 'skill', iterationSkillId, 'Iteration Logic', 70, 70, '5');

  await upsertResultDimension(exam2Id, 'domain', domainId, 'Full Stack Development', 55, 55, '6');
  await upsertResultDimension(exam2Id, 'subject', subjectId, 'Front End Development', 52, 52, '7');
  await upsertResultDimension(exam2Id, 'topic', topicId, 'JavaScript Fundamentals', 49, 49, '8');
  await upsertResultDimension(exam2Id, 'subtopic', subtopicId, 'Looping', 42, 42, '9');
  await upsertResultDimension(exam2Id, 'skill', loopDebugSkillId, 'Loop Debugging', 44, 44, '10');

  await upsertReportJob({ id: ids.exam1Job, userId, examId: exam1Id, status: 'completed', progress: 100, pdfUrl: exam1ReportUrl });
  await upsertReportJob({ id: ids.exam2Job, userId, examId: exam2Id, status: 'completed', progress: 100, pdfUrl: exam2ReportUrl });

  await upsertReport({ id: ids.exam1Report, attemptId: exam1Id, userId, fileRef: exam1ReportUrl, status: 'ready', layoutVersion: 1 });
  await upsertReport({ id: ids.exam2Report, attemptId: exam2Id, userId, fileRef: exam2ReportUrl, status: 'ready', layoutVersion: 1 });

  await quizDb.insert(idempotencyKeys).values({ id: 'ab000000-0000-0000-0000-100000000001', userId, key: `exam-report:${exam1Id}`, examId: exam1Id }).onConflictDoUpdate({
    target: [idempotencyKeys.userId, idempotencyKeys.key],
    set: { examId: exam1Id },
  });
  await quizDb.insert(idempotencyKeys).values({ id: 'ab000000-0000-0000-0000-100000000002', userId, key: `exam-report:${exam2Id}`, examId: exam2Id }).onConflictDoUpdate({
    target: [idempotencyKeys.userId, idempotencyKeys.key],
    set: { examId: exam2Id },
  });

  await upsertNotification({
    id: ids.notification1,
    userId,
    type: 'notes_sent',
    title: 'Your Looping notes are ready',
    message: 'Open the notes first, then return to your weak-area cards after the exam.',
    actionUrl: `/learn/${slugify('Full Stack Development')}/${slugify('Front End Development')}/${slugify('JavaScript Fundamentals')}/${slugify('Looping')}`,
    metadata: { examId: exam2Id },
    isRead: false,
  });
  await upsertNotification({
    id: ids.notification2,
    userId,
    type: 'help_requested',
    title: 'Tutor help request created',
    message: 'A live tutor request was created from your looping practice flow.',
    actionUrl: `/learn/${slugify('Full Stack Development')}/${slugify('Front End Development')}/${slugify('JavaScript Fundamentals')}/${slugify('Looping')}`,
    metadata: { examId: exam2Id },
    isRead: true,
  });

  await upsertNotesAccessLog(userId, topicId);
  await upsertUserRecommendation(userId, topicId, exam2Id, 'revise');
  await upsertUserRecommendation(userId, topicId, exam2Id, 'practice');
  await upsertNotesDeliveryLock(userId, topicId);
  await upsertTutorHelpRequest(userId, topicId, exam2Id);

  return { domainId, subjectId, topicId, subtopicId, exam2Id };
}

async function upsertTutorialDomain(externalId: string, name: string, slug: string): Promise<string> {
  const existing = await tutorialDb.select({ id: tutorialDomains.id }).from(tutorialDomains).where(eq(tutorialDomains.externalId, externalId)).limit(1);
  if (existing[0] !== undefined) {
    await tutorialDb.update(tutorialDomains).set({ name, slug, deletedAt: null, updatedAt: dates.hierarchyUpdated }).where(eq(tutorialDomains.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await tutorialDb
    .insert(tutorialDomains)
    .values({
      id: ids.tutorialDomain,
      externalId,
      name,
      slug,
      deletedAt: null,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: tutorialDomains.id });
  return row.id;
}

async function upsertTutorialSubject(externalId: string, domainId: string, name: string, slug: string): Promise<string> {
  const existing = await tutorialDb.select({ id: tutorialSubjects.id }).from(tutorialSubjects).where(eq(tutorialSubjects.externalId, externalId)).limit(1);
  if (existing[0] !== undefined) {
    await tutorialDb.update(tutorialSubjects).set({ domainId, name, slug, deletedAt: null, updatedAt: dates.hierarchyUpdated }).where(eq(tutorialSubjects.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await tutorialDb
    .insert(tutorialSubjects)
    .values({
      id: ids.tutorialSubject,
      externalId,
      domainId,
      name,
      slug,
      deletedAt: null,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: tutorialSubjects.id });
  return row.id;
}

async function upsertTutorialTopic(externalId: string, subjectId: string, name: string, slug: string): Promise<string> {
  const existing = await tutorialDb.select({ id: tutorialTopics.id }).from(tutorialTopics).where(eq(tutorialTopics.externalId, externalId)).limit(1);
  if (existing[0] !== undefined) {
    await tutorialDb.update(tutorialTopics).set({ subjectId, name, slug, deletedAt: null, updatedAt: dates.hierarchyUpdated }).where(eq(tutorialTopics.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await tutorialDb
    .insert(tutorialTopics)
    .values({
      id: ids.tutorialTopic,
      externalId,
      subjectId,
      name,
      slug,
      deletedAt: null,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: tutorialTopics.id });
  return row.id;
}

async function upsertTutorialSubtopic(externalId: string, topicId: string, name: string, slug: string): Promise<string> {
  const existing = await tutorialDb.select({ id: tutorialSubtopics.id }).from(tutorialSubtopics).where(eq(tutorialSubtopics.externalId, externalId)).limit(1);
  if (existing[0] !== undefined) {
    await tutorialDb.update(tutorialSubtopics).set({ topicId, name, slug, difficultyLevels: ['simple', 'mixed', 'intermediate', 'expert'], deletedAt: null, updatedAt: dates.hierarchyUpdated }).where(eq(tutorialSubtopics.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await tutorialDb
    .insert(tutorialSubtopics)
    .values({
      id: ids.tutorialSubtopic,
      externalId,
      topicId,
      name,
      slug,
      difficultyLevels: ['simple', 'mixed', 'intermediate', 'expert'],
      deletedAt: null,
      updatedAt: dates.hierarchyUpdated,
    })
    .returning({ id: tutorialSubtopics.id });
  return row.id;
}

async function upsertDomainContentConfig(domainId: string): Promise<void> {
  await tutorialDb.insert(domainContentConfig).values({
    id: ids.domainConfig,
    domainId,
    audienceProfile: 'frontend-student',
    defaultLanguage: 'en',
    seoTitleTemplate: 'Looping notes | RealTutorialHub',
    aiTutorEnabled: true,
    contentReviewRequired: true,
    version: 1,
  }).onConflictDoUpdate({
    target: domainContentConfig.id,
    set: {
      domainId,
      audienceProfile: 'frontend-student',
      defaultLanguage: 'en',
      seoTitleTemplate: 'Looping notes | RealTutorialHub',
      aiTutorEnabled: true,
      contentReviewRequired: true,
      version: 1,
      updatedAt: dates.contentPublished,
      deletedAt: null,
    },
  });
}

async function upsertContentGenerationJobs(subtopicId: string): Promise<void> {
  await tutorialDb
    .insert(contentGenerationJobs)
    .values({
      id: ids.contentJob1,
      subtopicId,
      difficulty: 'simple',
      status: 'completed',
      promptVersion: 1,
      prompt: { title: 'Generate looping notes' },
      result: { ok: true },
      error: null,
      generatedBy: SEED_EDITOR_ID,
      processedAt: dates.contentPublished,
      retryCount: 0,
      version: 1,
    })
    .onConflictDoUpdate({
      target: contentGenerationJobs.id,
      set: {
        subtopicId,
        difficulty: 'simple',
        status: 'completed',
        promptVersion: 1,
        prompt: { title: 'Generate looping notes' },
        result: { ok: true },
        error: null,
        generatedBy: SEED_EDITOR_ID,
        processedAt: dates.contentPublished,
        retryCount: 0,
        version: 1,
        updatedAt: dates.contentPublished,
        deletedAt: null,
      },
    });

  await tutorialDb
    .insert(contentGenerationJobs)
    .values({
      id: ids.contentJob2,
      subtopicId,
      difficulty: 'expert',
      status: 'pending',
      promptVersion: 1,
      prompt: { title: 'Generate expert looping notes' },
      result: null,
      error: null,
      generatedBy: SEED_EDITOR_ID,
      processedAt: null,
      retryCount: 0,
      version: 1,
    })
    .onConflictDoUpdate({
      target: contentGenerationJobs.id,
      set: {
        subtopicId,
        difficulty: 'expert',
        status: 'pending',
        promptVersion: 1,
        prompt: { title: 'Generate expert looping notes' },
        result: null,
        error: null,
        generatedBy: SEED_EDITOR_ID,
        processedAt: null,
        retryCount: 0,
        version: 1,
        updatedAt: dates.contentPublished,
        deletedAt: null,
      },
    });
}

async function upsertTutorialContentRecord(subtopicId: string, difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert', content: TutorialContentJSON): Promise<string> {
  const contentIdMap = {
    simple: ids.contentSimple,
    mixed: ids.contentMixed,
    intermediate: ids.contentIntermediate,
    expert: ids.contentExpert,
  } as const;

  const existing = await tutorialDb
    .select({ id: tutorialContent.id })
    .from(tutorialContent)
    .where(eq(tutorialContent.id, contentIdMap[difficulty]))
    .limit(1);

  if (existing[0] !== undefined) {
    await tutorialDb
      .update(tutorialContent)
      .set({
        subtopicId,
        difficulty,
        contentType: 'standard',
        content,
        version: 1,
        language: 'en',
        isPublished: true,
        generatedByAi: false,
        aiModelUsed: null,
        generationJobId: null,
        adminApprovedBy: SEED_EDITOR_ID,
        adminApprovedAt: dates.contentPublished,
        qualityScore: { clarity: 98, usefulness: 97 },
        regenerationCount: 0,
        deletedAt: null,
        updatedAt: dates.contentPublished,
      })
      .where(eq(tutorialContent.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await tutorialDb
    .insert(tutorialContent)
    .values({
      id: contentIdMap[difficulty],
      subtopicId,
      difficulty,
      contentType: 'standard',
      content,
      version: 1,
      language: 'en',
      isPublished: true,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: SEED_EDITOR_ID,
      adminApprovedAt: dates.contentPublished,
      qualityScore: { clarity: 98, usefulness: 97 },
      regenerationCount: 0,
      deletedAt: null,
      updatedAt: dates.contentPublished,
    })
    .returning({ id: tutorialContent.id });

  return row.id;
}

async function upsertTutorialContentVersion(contentId: string, version: number, content: TutorialContentJSON): Promise<void> {
  const versionIdMap = {
    1: ids.contentVersion1,
    2: ids.contentVersion2,
    3: ids.contentVersion3,
    4: ids.contentVersion4,
  } as const;

  await tutorialDb
    .insert(tutorialContentVersions)
    .values({
      id: versionIdMap[version as 1 | 2 | 3 | 4],
      contentId,
      version,
      content,
      savedBy: SEED_EDITOR_ID,
      createdAt: dates.contentSnapshot,
    })
    .onConflictDoUpdate({
      target: tutorialContentVersions.id,
      set: {
        contentId,
        version,
        content,
        savedBy: SEED_EDITOR_ID,
        createdAt: dates.contentSnapshot,
      },
    });
}

async function upsertTutorialContentAudit(contentId: string, suffix: 1 | 2 | 3 | 4): Promise<void> {
  const auditIdMap = {
    1: ids.contentAudit1,
    2: ids.contentAudit2,
    3: ids.contentAudit3,
    4: ids.contentAudit4,
  } as const;

  await tutorialDb
    .insert(tutorialContentAudit)
    .values({
      id: auditIdMap[suffix],
      contentId,
      userId: SEED_EDITOR_ID,
      action: 'published',
      diff: { note: 'Published looping demo content' },
      createdAt: dates.contentPublished,
    })
    .onConflictDoUpdate({
      target: tutorialContentAudit.id,
      set: {
        contentId,
        userId: SEED_EDITOR_ID,
        action: 'published',
        diff: { note: 'Published looping demo content' },
        createdAt: dates.contentPublished,
      },
    });
}

async function upsertTutorialProgress(userId: string, subtopicId: string): Promise<void> {
  await tutorialDb
    .insert(tutorialProgress)
    .values({
      id: 'c0000000-0000-0000-0000-100000000001',
      userId,
      subtopicId,
      status: 'completed',
      blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
      remediationTriggered: true,
      score: '76.00',
      timeSpentSec: 1240,
      completedAt: dates.progressCompleted,
      version: 1,
      deletedAt: null,
      createdAt: dates.progressStarted,
      updatedAt: dates.progressCompleted,
    })
    .onConflictDoUpdate({
      target: [tutorialProgress.userId, tutorialProgress.subtopicId],
      set: {
        status: 'completed',
        blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
        remediationTriggered: true,
        score: '76.00',
        timeSpentSec: 1240,
        completedAt: dates.progressCompleted,
        version: 1,
        deletedAt: null,
        updatedAt: dates.progressCompleted,
      },
    });
}

async function upsertSubtopicFlowProgress(userId: string, subtopicId: string): Promise<void> {
  await tutorialDb
    .insert(subtopicFlowProgress)
    .values({
      id: 'c1000000-0000-0000-0000-100000000001',
      userId,
      subtopicId,
      laymanReadAt: new Date('2026-03-12T06:40:00Z'),
      realLifeReadAt: new Date('2026-03-12T06:50:00Z'),
      technicalReadAt: new Date('2026-03-12T07:00:00Z'),
      codeReadAt: new Date('2026-03-12T07:08:00Z'),
      aiTutorFirstMessageAt: new Date('2026-03-12T07:12:00Z'),
      assignmentUnlockedAt: new Date('2026-03-12T07:15:00Z'),
      assignmentCompletedAt: new Date('2026-03-12T07:20:00Z'),
      currentFlowStep: 6,
      flowCompleted: true,
      timeOnLaymanSeconds: 190,
      timeOnTechnicalSeconds: 280,
      timeOnCodeSeconds: 180,
      totalTimeSeconds: 1240,
      createdAt: dates.progressStarted,
      updatedAt: dates.progressCompleted,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: [subtopicFlowProgress.userId, subtopicFlowProgress.subtopicId],
      set: {
        laymanReadAt: new Date('2026-03-12T06:40:00Z'),
        realLifeReadAt: new Date('2026-03-12T06:50:00Z'),
        technicalReadAt: new Date('2026-03-12T07:00:00Z'),
        codeReadAt: new Date('2026-03-12T07:08:00Z'),
        aiTutorFirstMessageAt: new Date('2026-03-12T07:12:00Z'),
        assignmentUnlockedAt: new Date('2026-03-12T07:15:00Z'),
        assignmentCompletedAt: new Date('2026-03-12T07:20:00Z'),
        currentFlowStep: 6,
        flowCompleted: true,
        timeOnLaymanSeconds: 190,
        timeOnTechnicalSeconds: 280,
        timeOnCodeSeconds: 180,
        totalTimeSeconds: 1240,
        updatedAt: dates.progressCompleted,
        deletedAt: null,
      },
    });
}

async function upsertRemediation(userId: string, examResultId: string, subtopicName: string): Promise<void> {
  await tutorialDb
    .insert(remediationTriggers)
    .values({
      id: 'd0000000-0000-0000-0000-100000000001',
      examResultId,
      userId,
      weakSubtopics: [
        {
          subtopicId: ids.subtopic,
          subtopicName,
          score: 48,
          threshold: 70,
        },
      ],
      weakSubtopicIds: [ids.subtopic],
      recommendedContentTypes: ['notes', 'layman', 'technical', 'code'],
      status: 'pending',
      createdAt: dates.remediationCreated,
      updatedAt: dates.remediationCreated,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: remediationTriggers.id,
      set: {
        examResultId,
        userId,
        weakSubtopics: [
          {
            subtopicId: ids.subtopic,
            subtopicName,
            score: 48,
            threshold: 70,
          },
        ],
        weakSubtopicIds: [ids.subtopic],
        recommendedContentTypes: ['notes', 'layman', 'technical', 'code'],
        status: 'pending',
        updatedAt: dates.remediationCreated,
        deletedAt: null,
      },
    });
}

async function upsertAssignmentRecords(subtopicId: string): Promise<Record<'simple' | 'mixed' | 'intermediate' | 'expert', string>> {
  const assignmentIds = {
    simple: ids.assignmentSimple,
    mixed: ids.assignmentMixed,
    intermediate: ids.assignmentIntermediate,
    expert: ids.assignmentExpert,
  } as const;

  const titles = {
    simple: 'Trace the loop output',
    mixed: 'Skip and stop with confidence',
    intermediate: 'Nested loops and boundaries',
    expert: 'Optimize the iteration path',
  } as const;

  const difficulties: Array<'simple' | 'mixed' | 'intermediate' | 'expert'> = ['simple', 'mixed', 'intermediate', 'expert'];
  for (const difficulty of difficulties) {
    await tutorialDb
      .insert(tutorialAssignments)
      .values({
        id: assignmentIds[difficulty],
        subtopicId,
        difficulty,
        questionType: difficulty === 'expert' ? 'open_ended' : difficulty === 'intermediate' ? 'code' : difficulty === 'mixed' ? 'short_answer' : 'mcq',
        question: `Practice task for ${difficulty} looping`,
        hints: ['Think about the stop condition', 'Keep the loop readable'],
        referenceAnswer: `A ${difficulty} looping answer should be correct, readable, and stop safely.`,
        title: titles[difficulty],
        content: buildAssignmentContent(difficulty, titles[difficulty]),
        orderIndex: difficulties.indexOf(difficulty) + 1,
        points: difficulty === 'expert' ? 40 : difficulty === 'intermediate' ? 30 : 20,
        timeLimitSec: difficulty === 'expert' ? 900 : 600,
        isPublished: true,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: tutorialAssignments.id,
        set: {
          subtopicId,
          difficulty,
          questionType: difficulty === 'expert' ? 'open_ended' : difficulty === 'intermediate' ? 'code' : difficulty === 'mixed' ? 'short_answer' : 'mcq',
          question: `Practice task for ${difficulty} looping`,
          hints: ['Think about the stop condition', 'Keep the loop readable'],
          referenceAnswer: `A ${difficulty} looping answer should be correct, readable, and stop safely.`,
          title: titles[difficulty],
          content: buildAssignmentContent(difficulty, titles[difficulty]),
          orderIndex: difficulties.indexOf(difficulty) + 1,
          points: difficulty === 'expert' ? 40 : difficulty === 'intermediate' ? 30 : 20,
          timeLimitSec: difficulty === 'expert' ? 900 : 600,
          isPublished: true,
          version: 1,
          updatedAt: dates.contentPublished,
          deletedAt: null,
        },
      });
  }

  return assignmentIds;
}

async function upsertAssignmentProgressRecords(userId: string, subtopicId: string): Promise<void> {
  const rows = [
    { id: ids.assignmentProgressSimple, difficulty: 'simple' as const, status: 'self_completed' as const },
    { id: ids.assignmentProgressMixed, difficulty: 'mixed' as const, status: 'self_completed' as const },
    { id: ids.assignmentProgressIntermediate, difficulty: 'intermediate' as const, status: 'in_progress' as const },
    { id: ids.assignmentProgressExpert, difficulty: 'expert' as const, status: 'not_started' as const },
  ];

  for (const row of rows) {
    await tutorialDb
      .insert(assignmentProgress)
      .values({
        id: row.id,
        userId,
        subtopicId,
        difficulty: row.difficulty,
        status: row.status,
        startedAt: row.status === 'not_started' ? null : row.difficulty === 'simple' ? dates.progressStarted : dates.progressCompleted,
        completedAt: row.status === 'self_completed' ? dates.progressCompleted : null,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [assignmentProgress.userId, assignmentProgress.subtopicId, assignmentProgress.difficulty],
        set: {
          status: row.status,
          startedAt: row.status === 'not_started' ? null : row.difficulty === 'simple' ? dates.progressStarted : dates.progressCompleted,
          completedAt: row.status === 'self_completed' ? dates.progressCompleted : null,
          version: 1,
          updatedAt: dates.progressCompleted,
          deletedAt: null,
        },
      });
  }
}

async function upsertAssignmentHelpRequest(userId: string, subtopicId: string, assignmentId: string): Promise<void> {
  await tutorialDb
    .insert(assignmentHelpRequests)
    .values({
      id: ids.assignmentHelpRequest,
      userId,
      subtopicId,
      assignmentId,
      question: 'Can you show why continue skips the current iteration here?',
      status: 'open',
      assignedTo: null,
      resolvedAt: null,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: assignmentHelpRequests.id,
      set: {
        userId,
        subtopicId,
        assignmentId,
        question: 'Can you show why continue skips the current iteration here?',
        status: 'open',
        assignedTo: null,
        resolvedAt: null,
        version: 1,
        updatedAt: dates.progressCompleted,
        deletedAt: null,
      },
    });
}

async function upsertLiveSessionRequest(userId: string, subtopicId: string): Promise<void> {
  await tutorialDb
    .insert(liveSessionRequests)
    .values({
      id: ids.liveSessionRequest,
      studentId: userId,
      subtopicId,
      doubtText: 'I keep missing break versus continue in looping questions.',
      status: 'pending',
      facultyId: null,
      meetingLink: null,
      scheduledAt: null,
      completedAt: null,
      cancelledReason: null,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: liveSessionRequests.id,
      set: {
        studentId: userId,
        subtopicId,
        doubtText: 'I keep missing break versus continue in looping questions.',
        status: 'pending',
        facultyId: null,
        meetingLink: null,
        scheduledAt: null,
        completedAt: null,
        cancelledReason: null,
        version: 1,
        updatedAt: dates.progressCompleted,
        deletedAt: null,
      },
    });
}

async function upsertBadges(): Promise<void> {
  const badgeRows = [
    {
      id: ids.badgeTopic,
      name: 'Looping Starter',
      description: 'Awarded for completing the looping practice drill.',
      level: 'simple' as const,
      scope: 'topic' as const,
    },
    {
      id: ids.badgeSubject,
      name: 'Frontend Builder',
      description: 'Awarded for building a strong front end practice habit.',
      level: 'intermediate' as const,
      scope: 'subject' as const,
    },
    {
      id: ids.badgeDomain,
      name: 'Full Stack Explorer',
      description: 'Awarded for progressing across the full stack learning path.',
      level: 'expert' as const,
      scope: 'domain' as const,
    },
  ];

  for (const badge of badgeRows) {
    await tutorialDb
      .insert(badges)
      .values({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconUrl: null,
        level: badge.level,
        scope: badge.scope,
        criteria: { title: badge.name },
        version: 1,
        isActive: true,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: badges.id,
        set: {
          name: badge.name,
          description: badge.description,
          iconUrl: null,
          level: badge.level,
          scope: badge.scope,
          criteria: { title: badge.name },
          version: 1,
          isActive: true,
          deletedAt: null,
          updatedAt: dates.progressCompleted,
        },
      });
  }
}

async function upsertProjects(subtopicId: string, topicId: string, subjectId: string, domainId: string): Promise<{ topicProjectId: string; subjectProjectId: string; domainProjectId: string }> {
  const projectDefs = [
    {
      id: ids.projectTopic,
      scope: 'topic' as const,
      parentId: topicId,
      level: 'simple' as const,
      title: 'Looping Practice Drill',
      description: 'Build a small looping example that filters and prints values.',
      deliverableType: 'code' as const,
      evaluationType: 'auto' as const,
      estimatedHours: 2,
      badgeId: ids.badgeTopic,
      subtopicsCovered: [subtopicId],
      prerequisites: [],
    },
    {
      id: ids.projectSubject,
      scope: 'subject' as const,
      parentId: subjectId,
      level: 'intermediate' as const,
      title: 'Frontend Mini Lab',
      description: 'Create a small UI flow that uses loop-generated cards.',
      deliverableType: 'repo' as const,
      evaluationType: 'ai_review' as const,
      estimatedHours: 6,
      badgeId: ids.badgeSubject,
      subtopicsCovered: [subtopicId],
      prerequisites: [ids.projectTopic],
    },
    {
      id: ids.projectDomain,
      scope: 'domain' as const,
      parentId: domainId,
      level: 'expert' as const,
      title: 'Full Stack Demo Project',
      description: 'Show how looping knowledge feeds a full stack learning journey.',
      deliverableType: 'live_demo' as const,
      evaluationType: 'admin_review' as const,
      estimatedHours: 12,
      badgeId: ids.badgeDomain,
      subtopicsCovered: [subtopicId],
      prerequisites: [ids.projectTopic, ids.projectSubject],
    },
  ];

  for (const project of projectDefs) {
    await tutorialDb
      .insert(tutorialProjects)
      .values({
        id: project.id,
        scope: project.scope,
        parentId: project.parentId,
        level: project.level,
        title: project.title,
        description: project.description,
        deliverableType: project.deliverableType,
        evaluationType: project.evaluationType,
        estimatedHours: project.estimatedHours,
        badgeId: project.badgeId,
        subtopicsCovered: project.subtopicsCovered,
        prerequisites: project.prerequisites,
        isPublished: true,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: tutorialProjects.id,
        set: {
          scope: project.scope,
          parentId: project.parentId,
          level: project.level,
          title: project.title,
          description: project.description,
          deliverableType: project.deliverableType,
          evaluationType: project.evaluationType,
          estimatedHours: project.estimatedHours,
          badgeId: project.badgeId,
          subtopicsCovered: project.subtopicsCovered,
          prerequisites: project.prerequisites,
          isPublished: true,
          version: 1,
          updatedAt: dates.progressCompleted,
          deletedAt: null,
        },
      });
  }

  return {
    topicProjectId: ids.projectTopic,
    subjectProjectId: ids.projectSubject,
    domainProjectId: ids.projectDomain,
  };
}

async function upsertProjectSubmissions(userId: string, projectIds: { topicProjectId: string; subjectProjectId: string; domainProjectId: string }): Promise<string> {
  await tutorialDb
    .insert(tutorialProjectSubmissions)
    .values({
      id: ids.projectSubmissionTopic,
      userId,
      projectId: projectIds.topicProjectId,
      projectLevel: 'simple',
      difficulty: 'simple',
      submissionContent: buildProjectSubmissionContent('Looping Practice Drill', 'The student solved a looping drill with clear condition handling.'),
      status: 'approved',
      score: 94,
      feedback: 'Strong use of break and continue.',
      aiReview: { summary: 'Excellent looping fundamentals' },
      peerReviews: [],
      adminReview: { summary: 'Approved' },
      badgeAwarded: true,
      videoRequired: false,
      videoUrl: null,
      submittedAt: dates.projectSubmitted,
      gradedAt: dates.projectReviewed,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: tutorialProjectSubmissions.id,
      set: {
        userId,
        projectId: projectIds.topicProjectId,
        projectLevel: 'simple',
        difficulty: 'simple',
        submissionContent: buildProjectSubmissionContent('Looping Practice Drill', 'The student solved a looping drill with clear condition handling.'),
        status: 'approved',
        score: 94,
        feedback: 'Strong use of break and continue.',
        aiReview: { summary: 'Excellent looping fundamentals' },
        peerReviews: [],
        adminReview: { summary: 'Approved' },
        badgeAwarded: true,
        videoRequired: false,
        videoUrl: null,
        submittedAt: dates.projectSubmitted,
        gradedAt: dates.projectReviewed,
        version: 1,
        updatedAt: dates.projectReviewed,
        deletedAt: null,
      },
    });

  await tutorialDb
    .insert(tutorialProjectSubmissions)
    .values({
      id: ids.projectSubmissionSubject,
      userId,
      projectId: projectIds.subjectProjectId,
      projectLevel: 'intermediate',
      difficulty: 'mixed',
      submissionContent: buildProjectSubmissionContent('Frontend Mini Lab', 'A work-in-progress repo for a looping card grid.'),
      status: 'submitted',
      score: null,
      feedback: null,
      aiReview: null,
      peerReviews: [],
      adminReview: null,
      badgeAwarded: false,
      videoRequired: true,
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      submittedAt: dates.projectSubmitted,
      gradedAt: null,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: tutorialProjectSubmissions.id,
      set: {
        userId,
        projectId: projectIds.subjectProjectId,
        projectLevel: 'intermediate',
        difficulty: 'mixed',
        submissionContent: buildProjectSubmissionContent('Frontend Mini Lab', 'A work-in-progress repo for a looping card grid.'),
        status: 'submitted',
        score: null,
        feedback: null,
        aiReview: null,
        peerReviews: [],
        adminReview: null,
        badgeAwarded: false,
        videoRequired: true,
        videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
        submittedAt: dates.projectSubmitted,
        gradedAt: null,
        version: 1,
        updatedAt: dates.projectSubmitted,
        deletedAt: null,
      },
    });

  await tutorialDb
    .insert(tutorialProjectSubmissions)
    .values({
      id: ids.projectSubmissionDomain,
      userId,
      projectId: projectIds.domainProjectId,
      projectLevel: 'expert',
      difficulty: 'expert',
      submissionContent: buildProjectSubmissionContent('Full Stack Demo Project', 'A roadmap for the full stack learning journey.'),
      status: 'pending',
      score: null,
      feedback: null,
      aiReview: null,
      peerReviews: [],
      adminReview: null,
      badgeAwarded: false,
      videoRequired: true,
      videoUrl: null,
      submittedAt: null,
      gradedAt: null,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: tutorialProjectSubmissions.id,
      set: {
        userId,
        projectId: projectIds.domainProjectId,
        projectLevel: 'expert',
        difficulty: 'expert',
        submissionContent: buildProjectSubmissionContent('Full Stack Demo Project', 'A roadmap for the full stack learning journey.'),
        status: 'pending',
        score: null,
        feedback: null,
        aiReview: null,
        peerReviews: [],
        adminReview: null,
        badgeAwarded: false,
        videoRequired: true,
        videoUrl: null,
        submittedAt: null,
        gradedAt: null,
        version: 1,
        updatedAt: dates.projectReviewed,
        deletedAt: null,
      },
    });

  return ids.projectSubmissionTopic;
}

async function upsertStudentBadge(userId: string, submissionId: string): Promise<void> {
  await tutorialDb
    .insert(studentBadges)
    .values({
      id: ids.studentBadge,
      userId,
      badgeId: ids.badgeTopic,
      awardedAt: dates.projectReviewed,
      projectSubmissionId: submissionId,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: [studentBadges.userId, studentBadges.badgeId],
      set: {
        awardedAt: dates.projectReviewed,
        projectSubmissionId: submissionId,
        deletedAt: null,
      },
    });
}

async function upsertCertificate(userId: string): Promise<void> {
  await tutorialDb
    .insert(certificates)
    .values({
      id: ids.certificate,
      userId,
      scope: 'topic',
      parentId: ids.subtopic,
      parentName: 'Looping',
      verificationCode: 'RTH-LOOPING-2026-0001',
      pdfUrl: 'https://storage.example.com/certificates/rth-looping-demo.pdf',
      issuedAt: dates.certificateIssued,
      expiresAt: null,
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: certificates.verificationCode,
      set: {
        userId,
        scope: 'topic',
        parentId: ids.subtopic,
        parentName: 'Looping',
        pdfUrl: 'https://storage.example.com/certificates/rth-looping-demo.pdf',
        issuedAt: dates.certificateIssued,
        expiresAt: null,
        version: 1,
        deletedAt: null,
        updatedAt: dates.certificateIssued,
      },
    });
}

async function upsertVideoLinks(subtopicId: string, projectId: string): Promise<void> {
  await tutorialDb
    .insert(tutorialVideoLinks)
    .values({
      id: ids.videoSubtopic,
      subtopicId,
      projectId: null,
      assignmentDifficulty: 'simple',
      provider: 'youtube',
      url: 'https://youtu.be/pn0U5bHbB2Y',
      title: 'Looping in JavaScript - quick notes walkthrough',
      thumbnailUrl: null,
      durationSeconds: 420,
      captionsAvailable: true,
      approvedByAdmin: true,
    })
    .onConflictDoUpdate({
      target: tutorialVideoLinks.id,
      set: {
        subtopicId,
        projectId: null,
        assignmentDifficulty: 'simple',
        provider: 'youtube',
        url: 'https://youtu.be/pn0U5bHbB2Y',
        title: 'Looping in JavaScript - quick notes walkthrough',
        thumbnailUrl: null,
        durationSeconds: 420,
        captionsAvailable: true,
        approvedByAdmin: true,
        updatedAt: dates.contentPublished,
      },
    });

  await tutorialDb
    .insert(tutorialVideoLinks)
    .values({
      id: ids.videoProject,
      subtopicId: null,
      projectId,
      assignmentDifficulty: null,
      provider: 'loom',
      url: 'https://www.loom.com/share/looping-demo-project',
      title: 'Looping project walkthrough',
      thumbnailUrl: null,
      durationSeconds: 560,
      captionsAvailable: true,
      approvedByAdmin: true,
    })
    .onConflictDoUpdate({
      target: tutorialVideoLinks.id,
      set: {
        subtopicId: null,
        projectId,
        assignmentDifficulty: null,
        provider: 'loom',
        url: 'https://www.loom.com/share/looping-demo-project',
        title: 'Looping project walkthrough',
        thumbnailUrl: null,
        durationSeconds: 560,
        captionsAvailable: true,
        approvedByAdmin: true,
        updatedAt: dates.contentPublished,
      },
    });
}

async function upsertTutorialSupportRows(userId: string): Promise<void> {
  await upsertDomainContentConfig(ids.domain);
  await tutorialDb.delete(studentStreaks).where(eq(studentStreaks.userId, userId));

  await tutorialDb.insert(studentStreaks).values({
    id: ids.streak,
    userId,
    currentStreak: 6,
    longestStreak: 11,
    lastActivity: dates.progressCompleted,
    totalXp: 420,
    level: 'silver',
    version: 1,
    deletedAt: null,
  });
}

async function seedTutorialData(userId: string, hierarchy: { domainId: string; subjectId: string; topicId: string; subtopicId: string; exam2Id: string }): Promise<void> {
  const domainName = 'Full Stack Development';
  const subjectName = 'Front End Development';
  const topicName = 'JavaScript Fundamentals';
  const subtopicName = 'Looping';
  const domainSlug = slugify(domainName);
  const subjectSlug = slugify(subjectName);
  const topicSlug = slugify(topicName);
  const subtopicSlug = slugify(subtopicName);

  const tutorialDomainId = await upsertTutorialDomain(hierarchy.domainId, domainName, domainSlug);
  const tutorialSubjectId = await upsertTutorialSubject(hierarchy.subjectId, tutorialDomainId, subjectName, subjectSlug);
  const tutorialTopicId = await upsertTutorialTopic(hierarchy.topicId, tutorialSubjectId, topicName, topicSlug);
  await upsertTutorialSubtopic(hierarchy.subtopicId, tutorialTopicId, subtopicName, subtopicSlug);

  await upsertDomainContentConfig(hierarchy.domainId);
  await upsertContentGenerationJobs(hierarchy.subtopicId);

  const contentRows: Array<{ difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert'; content: TutorialContentJSON }> = [
    { difficulty: 'simple', content: loopingContent('simple') },
    { difficulty: 'mixed', content: loopingContent('mixed') },
    { difficulty: 'intermediate', content: loopingContent('intermediate') },
    { difficulty: 'expert', content: loopingContent('expert') },
  ];

  for (const [index, row] of contentRows.entries()) {
    const contentId = await upsertTutorialContentRecord(hierarchy.subtopicId, row.difficulty, row.content);
    await upsertTutorialContentVersion(contentId, 1, row.content);
    await upsertTutorialContentAudit(contentId, (index + 1) as 1 | 2 | 3 | 4);
  }

  await upsertTutorialProgress(userId, hierarchy.subtopicId);
  await upsertSubtopicFlowProgress(userId, hierarchy.subtopicId);
  await upsertRemediation(userId, hierarchy.exam2Id, subtopicName);

  const assignmentIds = await upsertAssignmentRecords(hierarchy.subtopicId);
  await upsertAssignmentProgressRecords(userId, hierarchy.subtopicId);
  await upsertAssignmentHelpRequest(userId, hierarchy.subtopicId, assignmentIds.simple);
  await upsertLiveSessionRequest(userId, hierarchy.subtopicId);
  await upsertBadges();

  const projectIds = await upsertProjects(hierarchy.subtopicId, hierarchy.topicId, hierarchy.subjectId, hierarchy.domainId);
  const submissionId = await upsertProjectSubmissions(userId, projectIds);
  await upsertStudentBadge(userId, submissionId);
  await upsertCertificate(userId);
  await upsertVideoLinks(hierarchy.subtopicId, projectIds.topicProjectId);
  await upsertTutorialSupportRows(userId);
}

async function main() {
  const userId = await ensureUser();
  const hierarchy = await seedCentralQuizData(userId);
  await seedTutorialData(userId, hierarchy);

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: AJAY_EMAIL,
        userId,
        hierarchy: {
          domain: { name: 'Full Stack Development', slug: slugify('Full Stack Development') },
          subject: { name: 'Front End Development', slug: slugify('Front End Development') },
          topic: { name: 'JavaScript Fundamentals', slug: slugify('JavaScript Fundamentals') },
          subtopic: { name: 'Looping', slug: slugify('Looping') },
        },
        exams: [ids.exam1, ids.exam2],
        tutorialContentRows: 4,
        optionalRows: [
          'tutorial_content_versions',
          'tutorial_content_audit',
          'tutorial_video_links',
          'badges',
          'student_badges',
          'certificates',
          'content_generation_jobs',
          'notifications',
          'notes_access_logs',
          'user_recommendations',
          'notes_delivery_locks',
          'tutor_help_requests',
          'assignment_help_requests',
          'live_session_requests',
          'student_streaks',
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('RTH looping demo seed failed:', error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
