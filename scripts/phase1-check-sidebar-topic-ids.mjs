#!/usr/bin/env node
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const sidebars = await pool.query(`
  SELECT 
    st.id,
    st.brand_id,
    st.topic_id as sidebar_topic_id,
    st.domain_id,
    st.subject_id,
    tt.name as topic_name,
    tt.slug as topic_slug
  FROM tutorial_sidebar_trees_v2 st
  LEFT JOIN tutorial_topics tt ON st.topic_id = tt.id
`);

console.log('Sidebar Trees:');
console.log(JSON.stringify(sidebars.rows, null, 2));

const subtopics = await pool.query(`
  SELECT 
    id,
    external_id,
    name,
    topic_id,
    (SELECT name FROM tutorial_topics WHERE id = tutorial_subtopics.topic_id) as topic_name
  FROM tutorial_subtopics
`);

console.log('\n\nSubtopics:');
console.log(JSON.stringify(subtopics.rows, null, 2));

await pool.end();
