import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactSlug(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesSlug(value, slug) {
  const s1 = slugify(value);
  const s2 = compactSlug(value);
  const s3 = compactSlug(slug);
  return s1 === slug || s2 === s3;
}

console.log('═══════════════════════════════════════════════════════════');
console.log('HIERARCHY RESOLUTION DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════════\n');

const params = {
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'whatisjava',
};

console.log('Input slugs:');
Object.entries(params).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
console.log('');

// Step 1: Resolve domain
console.log('STEP 1: Resolve domain');
const domainRows = await mainDb.query(`
  SELECT * FROM domains WHERE deleted_at IS NULL
`);

console.log(`Found ${domainRows.rows.length} domains`);
const domain = domainRows.rows.find(row => matchesSlug(row.name, params.domainSlug));

if (domain) {
  console.log(`✅ Domain resolved: ${domain.name} (${domain.id})`);
  console.log(`   slugified: ${slugify(domain.name)}`);
  console.log(`   matches: ${matchesSlug(domain.name, params.domainSlug)}`);
} else {
  console.log(`❌ Domain NOT FOUND`);
  domainRows.rows.forEach(row => {
    console.log(`   - ${row.name} → slug: ${slugify(row.name)}, matches: ${matchesSlug(row.name, params.domainSlug)}`);
  });
  await mainDb.end();
  process.exit(1);
}
console.log('');

// Step 2: Resolve subject
console.log('STEP 2: Resolve subject');
const subjectRows = await mainDb.query(`
  SELECT * FROM subjects 
  WHERE domain_id = $1 
  AND deleted_at IS NULL
`, [domain.id]);

console.log(`Found ${subjectRows.rows.length} subjects under domain`);
const subject = subjectRows.rows.find(row => matchesSlug(row.name, params.subjectSlug));

if (subject) {
  console.log(`✅ Subject resolved: ${subject.name} (${subject.id})`);
} else {
  console.log(`❌ Subject NOT FOUND`);
  subjectRows.rows.forEach(row => {
    console.log(`   - ${row.name} → slug: ${slugify(row.name)}, matches: ${matchesSlug(row.name, params.subjectSlug)}`);
  });
  await mainDb.end();
  process.exit(1);
}
console.log('');

// Step 3: Resolve topic
console.log('STEP 3: Resolve topic');
const topicRows = await mainDb.query(`
  SELECT * FROM topics 
  WHERE subject_id = $1 
  AND deleted_at IS NULL
`, [subject.id]);

console.log(`Found ${topicRows.rows.length} topics under subject`);
const topic = topicRows.rows.find(row => matchesSlug(row.name, params.topicSlug));

if (topic) {
  console.log(`✅ Topic resolved: ${topic.name} (${topic.id})`);
} else {
  console.log(`❌ Topic NOT FOUND`);
  topicRows.rows.forEach(row => {
    console.log(`   - ${row.name} → slug: ${slugify(row.name)}, matches: ${matchesSlug(row.name, params.topicSlug)}`);
  });
  await mainDb.end();
  process.exit(1);
}
console.log('');

// Step 4: Resolve subtopic
console.log('STEP 4: Resolve subtopic');
const subtopicRows = await mainDb.query(`
  SELECT * FROM subtopics 
  WHERE topic_id = $1 
  AND deleted_at IS NULL
`, [topic.id]);

console.log(`Found ${subtopicRows.rows.length} subtopics under topic`);
subtopicRows.rows.forEach(row => {
  const s1 = slugify(row.name);
  const s2 = compactSlug(row.name);
  const s3 = compactSlug(params.subtopicSlug);
  const matches = matchesSlug(row.name, params.subtopicSlug);
  console.log(`  - ${row.name}`);
  console.log(`    slugify: ${s1}`);
  console.log(`    compactSlug: ${s2}`);
  console.log(`    target compactSlug: ${s3}`);
  console.log(`    matchesSlug: ${matches}`);
});

const subtopic = subtopicRows.rows.find(row => matchesSlug(row.name, params.subtopicSlug));

if (subtopic) {
  console.log(`\n✅ Subtopic resolved: ${subtopic.name} (${subtopic.id})`);
  console.log('');
  console.log('✅ HIERARCHY RESOLUTION: COMPLETE');
} else {
  console.log(`\n❌ Subtopic NOT FOUND for slug: ${params.subtopicSlug}`);
}

await mainDb.end();
