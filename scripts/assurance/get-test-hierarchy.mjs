#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

async function getHierarchy() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_MAIN || 'postgresql://postgres:password@localhost:5432/quiz_platform_prod'
  });

  try {
    // Get domains
    const domains = await pool.query(`
      SELECT id, name, slug FROM domains 
      WHERE name ILIKE '%full%stack%' OR name ILIKE '%development%'
      ORDER BY name
    `);
    
    console.log('\n=== DOMAINS ===');
    domains.rows.forEach(d => console.log(`ID: ${d.id}, Name: ${d.name}, Slug: ${d.slug}`));

    if (domains.rows.length === 0) {
      console.log('No matching domains found. Listing all:');
      const allDomains = await pool.query('SELECT id, name, slug FROM domains ORDER BY name LIMIT 10');
      allDomains.rows.forEach(d => console.log(`ID: ${d.id}, Name: ${d.name}, Slug: ${d.slug}`));
      return;
    }

    // Get subjects for first domain
    const domainId = domains.rows[0].id;
    const subjects = await pool.query(`
      SELECT id, name, slug FROM subjects 
      WHERE domain_id = $1
      ORDER BY name
    `, [domainId]);
    
    console.log(`\n=== SUBJECTS (for ${domains.rows[0].name}) ===`);
    subjects.rows.forEach(s => console.log(`ID: ${s.id}, Name: ${s.name}, Slug: ${s.slug}`));

    if (subjects.rows.length === 0) return;

    // Get topics for first subject
    const subjectId = subjects.rows[0].id;
    const topics = await pool.query(`
      SELECT id, name, slug FROM topics 
      WHERE subject_id = $1
      ORDER BY name
    `, [subjectId]);
    
    console.log(`\n=== TOPICS (for ${subjects.rows[0].name}) ===`);
    topics.rows.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}, Slug: ${t.slug}`));

    if (topics.rows.length === 0) return;

    // Get subtopics for first topic
    const topicId = topics.rows[0].id;
    const subtopics = await pool.query(`
      SELECT id, name, slug FROM subtopics 
      WHERE topic_id = $1
      ORDER BY name
      LIMIT 5
    `, [topicId]);
    
    console.log(`\n=== SUBTOPICS (for ${topics.rows[0].name}) ===`);
    subtopics.rows.forEach(st => console.log(`ID: ${st.id}, Name: ${st.name}, Slug: ${st.slug}`));

    if (subtopics.rows.length === 0) return;

    // Get navigation nodes for first subtopic
    const subtopicId = subtopics.rows[0].id;
    const navNodes = await pool.query(`
      SELECT id, name FROM navigation_nodes 
      WHERE subtopic_id = $1
      ORDER BY sequence_order, name
      LIMIT 5
    `, [subtopicId]);
    
    console.log(`\n=== NAVIGATION NODES (for ${subtopics.rows[0].name}) ===`);
    if (navNodes.rows.length > 0) {
      navNodes.rows.forEach(nn => console.log(`ID: ${nn.id}, Name: ${nn.name}`));
    } else {
      console.log('No navigation nodes found');
    }

    console.log('\n=== TEST HIERARCHY PATH ===');
    console.log(`Domain: ${domains.rows[0].name}`);
    console.log(`Subject: ${subjects.rows[0]?.name || 'N/A'}`);
    console.log(`Topic: ${topics.rows[0]?.name || 'N/A'}`);
    console.log(`Subtopic: ${subtopics.rows[0]?.name || 'N/A'}`);
    console.log(`Navigation Nodes: ${navNodes.rows.length} available`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getHierarchy();
