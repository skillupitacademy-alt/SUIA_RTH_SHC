#!/usr/bin/env node

/**
 * Tutorial 404 Preflight Investigation
 * 
 * READ-ONLY investigation script.
 * 
 * This script MUST NEVER:
 * - INSERT
 * - UPDATE  
 * - DELETE
 * - UPSERT
 * - ALTER
 * - TRUNCATE
 * - CREATE
 * - DROP
 * - Expose secrets
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

function redact(value) {
  if (value === undefined || value === null) return value;
  const text = String(value);
  if (
    text.includes('postgres://') ||
    text.includes('postgresql://') ||
    text.includes('password') ||
    text.includes('token') ||
    text.includes('secret')
  ) {
    return '[REDACTED]';
  }
  return value;
}

function safeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, redact(value)])
  );
}

// Slug matching functions (from tutorialSidebarDelivery.ts)
function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function compactSlug(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesSlug(value, slug) {
  return slugify(value) === slug || compactSlug(value) === compactSlug(slug);
}

async function main() {
  const evidence = {
    investigation: 'tutorial-404-preflight',
    mode: 'read-only',
    targetUrl: 'http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/python/completepython',
    startedAt: new Date().toISOString(),
    urlParameters: {
      domainSlug: 'full-stack-development',
      subjectSlug: 'backend-development',
      topicSlug: 'python',
      subtopicSlug: 'completepython',
      brand: 'skillup',
    },
    checks: [],
    findings: [],
    errors: [],
  };

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    if (!process.env.DATABASE_URL_TUTORIAL) {
      evidence.errors.push({
        fatal: true,
        message: 'DATABASE_URL_TUTORIAL environment variable not set',
      });
      return;
    }

    evidence.checks.push({
      check: 'database_connection',
      status: 'VERIFIED',
      note: 'DATABASE_URL_TUTORIAL present (value redacted)',
    });

    // Step 1: Resolve Domain
    console.log('\n=== Step 1: Domain Resolution ===');
    const domainRows = await pool.query(`
      SELECT id, name, created_at 
      FROM tutorial_domains 
      WHERE deleted_at IS NULL
    `);

    const domain = domainRows.rows.find((row) =>
      matchesSlug(row.name, evidence.urlParameters.domainSlug)
    );

    evidence.checks.push({
      check: 'domain_resolution',
      input: evidence.urlParameters.domainSlug,
      found: !!domain,
      result: domain ? safeRow(domain) : null,
      allDomains: domainRows.rows.map(r => ({ id: r.id, name: r.name, slug: slugify(r.name) })),
    });

    if (!domain) {
      evidence.findings.push({
        severity: 'CRITICAL',
        stage: 'domain_resolution',
        finding: 'Domain not found',
        expected: evidence.urlParameters.domainSlug,
        available: domainRows.rows.map(r => slugify(r.name)),
      });
      await pool.end();
      return;
    }

    console.log('✅ Domain found:', domain.name, domain.id);

    // Step 2: Resolve Subject
    console.log('\n=== Step 2: Subject Resolution ===');
    const subjectRows = await pool.query(`
      SELECT id, name, domain_id 
      FROM tutorial_subjects 
      WHERE domain_id = $1 AND deleted_at IS NULL
    `, [domain.id]);

    const subject = subjectRows.rows.find((row) =>
      matchesSlug(row.name, evidence.urlParameters.subjectSlug)
    );

    evidence.checks.push({
      check: 'subject_resolution',
      input: evidence.urlParameters.subjectSlug,
      parentDomain: domain.id,
      found: !!subject,
      result: subject ? safeRow(subject) : null,
      allSubjects: subjectRows.rows.map(r => ({ id: r.id, name: r.name, slug: slugify(r.name) })),
    });

    if (!subject) {
      evidence.findings.push({
        severity: 'CRITICAL',
        stage: 'subject_resolution',
        finding: 'Subject not found under domain',
        expected: evidence.urlParameters.subjectSlug,
        available: subjectRows.rows.map(r => slugify(r.name)),
      });
      await pool.end();
      return;
    }

    console.log('✅ Subject found:', subject.name, subject.id);

    // Step 3: Resolve Topic
    console.log('\n=== Step 3: Topic Resolution ===');
    const topicRows = await pool.query(`
      SELECT id, name, subject_id 
      FROM tutorial_topics 
      WHERE subject_id = $1 AND deleted_at IS NULL
    `, [subject.id]);

    console.log('Topic candidates:', topicRows.rows.map(r => ({ 
      name: r.name, 
      slug: slugify(r.name), 
      compact: compactSlug(r.name),
      matches: matchesSlug(r.name, evidence.urlParameters.topicSlug)
    })));

    const topic = topicRows.rows.find((row) =>
      matchesSlug(row.name, evidence.urlParameters.topicSlug)
    );

    evidence.checks.push({
      check: 'topic_resolution',
      input: evidence.urlParameters.topicSlug,
      parentSubject: subject.id,
      found: !!topic,
      result: topic ? safeRow(topic) : null,
      allTopics: topicRows.rows.map(r => ({ id: r.id, name: r.name, slug: slugify(r.name), compact: compactSlug(r.name) })),
    });

    if (!topic) {
      evidence.findings.push({
        severity: 'CRITICAL',
        stage: 'topic_resolution',
        finding: 'Topic not found under subject',
        expected: evidence.urlParameters.topicSlug,
        available: topicRows.rows.map(r => ({ name: r.name, slug: slugify(r.name) })),
      });
      await pool.end();
      return;
    }

    console.log('✅ Topic found:', topic.name, topic.id);

    // Step 4: Resolve Subtopic
    console.log('\n=== Step 4: Subtopic Resolution ===');
    const subtopicRows = await pool.query(`
      SELECT id, name, slug, external_id, topic_id 
      FROM tutorial_subtopics 
      WHERE topic_id = $1 AND deleted_at IS NULL
    `, [topic.id]);

    console.log('Subtopic candidates:', subtopicRows.rows.map(r => ({ 
      name: r.name,
      slug: r.slug,
      slugified: slugify(r.name),
      compact: compactSlug(r.name),
      compactSlug: compactSlug(r.slug),
      matchesName: matchesSlug(r.name, evidence.urlParameters.subtopicSlug),
      matchesDbSlug: r.slug === evidence.urlParameters.subtopicSlug,
    })));

    // Try name match first
    let subtopic = subtopicRows.rows.find((row) =>
      matchesSlug(row.name, evidence.urlParameters.subtopicSlug)
    );

    // Try slug match if name match fails
    if (!subtopic) {
      subtopic = subtopicRows.rows.find((row) =>
        row.slug === evidence.urlParameters.subtopicSlug
      );
    }

    evidence.checks.push({
      check: 'subtopic_resolution',
      input: evidence.urlParameters.subtopicSlug,
      parentTopic: topic.id,
      found: !!subtopic,
      result: subtopic ? safeRow(subtopic) : null,
      allSubtopics: subtopicRows.rows.map(r => ({ 
        id: r.id, 
        name: r.name, 
        slug: r.slug,
        externalId: r.external_id,
        nameSlug: slugify(r.name),
        nameCompact: compactSlug(r.name),
      })),
    });

    if (!subtopic) {
      evidence.findings.push({
        severity: 'CRITICAL',
        stage: 'subtopic_resolution',
        finding: 'Subtopic not found under topic',
        expected: evidence.urlParameters.subtopicSlug,
        available: subtopicRows.rows.map(r => ({ name: r.name, slug: r.slug, nameSlug: slugify(r.name) })),
        rootCauseConfidence: 'HIGH',
        rootCauseAnalysis: 'URL parameter "completepython" does not match any subtopic name or slug in database',
      });
      await pool.end();
      return;
    }

    console.log('✅ Subtopic found:', subtopic.name, subtopic.id);
    console.log('   Slug:', subtopic.slug);
    console.log('   External ID:', subtopic.external_id);

    // Step 5: Check for tutorial sections
    console.log('\n=== Step 5: Tutorial Sections ===');
    const sections = await pool.query(`
      SELECT id, navigation_node_id, status, brand_id, order_index
      FROM tutorial_sections
      WHERE subtopic_id = $1
    `, [subtopic.id]);

    evidence.checks.push({
      check: 'tutorial_sections',
      subtopicId: subtopic.id,
      sectionsFound: sections.rows.length,
      sections: sections.rows.map(s => ({
        id: s.id,
        navigationNodeId: s.navigation_node_id,
        status: s.status,
        brandId: s.brand_id,
        orderIndex: s.order_index,
      })),
    });

    console.log(`Found ${sections.rows.length} section(s)`);
    sections.rows.forEach(s => {
      console.log(`  - ${s.id}: nav=${s.navigation_node_id}, status=${s.status}, brand=${s.brand_id}`);
    });

    // Step 6: Check for sidebar
    console.log('\n=== Step 6: Sidebar Check ===');
    const sidebars = await pool.query(`
      SELECT id, brand_id, status, version, active_subtopic_id
      FROM tutorial_sidebar_trees_v2
      WHERE active_subtopic_id = $1
    `, [subtopic.id]);

    evidence.checks.push({
      check: 'sidebar_check',
      subtopicId: subtopic.id,
      sidebarsFound: sidebars.rows.length,
      sidebars: sidebars.rows.map(s => ({
        id: s.id,
        brandId: s.brand_id,
        status: s.status,
        version: s.version,
        activeSubtopicId: s.active_subtopic_id,
      })),
    });

    console.log(`Found ${sidebars.rows.length} sidebar(s)`);
    sidebars.rows.forEach(s => {
      console.log(`  - ${s.id}: brand=${s.brand_id}, status=${s.status}`);
    });

    // Summary
    evidence.findings.push({
      severity: 'INFO',
      stage: 'hierarchy_complete',
      finding: 'Hierarchy resolution completed successfully',
      hierarchy: {
        domain: { id: domain.id, name: domain.name },
        subject: { id: subject.id, name: subject.name },
        topic: { id: topic.id, name: topic.name },
        subtopic: { id: subtopic.id, name: subtopic.name, slug: subtopic.slug, externalId: subtopic.external_id },
      },
    });

    await pool.end();

  } catch (error) {
    evidence.errors.push({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await pool.end();
  }

  evidence.completedAt = new Date().toISOString();

  // Write to file
  const outputPath = path.join(process.cwd(), 'docs', 'investigations', 'tutorial-404-preflight.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(70));
  console.log('Output:', outputPath);
  console.log('\nKey Findings:');
  evidence.findings.forEach(f => {
    console.log(`  [${f.severity}] ${f.stage}: ${f.finding}`);
  });

  if (evidence.errors.length > 0) {
    console.log('\nErrors:');
    evidence.errors.forEach(e => {
      console.log(`  ❌ ${e.message}`);
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('FATAL ERROR:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
