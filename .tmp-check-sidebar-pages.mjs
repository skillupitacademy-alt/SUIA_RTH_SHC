#!/usr/bin/env node
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function checkSidebar() {
  try {
    const result = await pool.query(`
      SELECT tree FROM tutorial_sidebar_trees_v2 
      WHERE id = '6fc39d5c-4b65-49c7-96c2-66dec92b1ab8'
    `);
    
    const tree = result.rows[0]?.tree;
    
    function findAllPages(node) {
      const pages = [];
      if (node.type === 'page') {
        pages.push({ id: node.id, name: node.name });
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(child => pages.push(...findAllPages(child)));
      }
      return pages;
    }
    
    const allPages = [];
    if (tree?.topics) {
      tree.topics.forEach(topic => allPages.push(...findAllPages(topic)));
    }
    
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('JAVA SIDEBAR - ALL NAVIGATION PAGES');
    console.log('══════════════════════════════════════════════════════════════════\n');
    console.table(allPages);
    
    const whatIsJava = allPages.find(p => p.id === 'what-is-java');
    console.log(`\n"what-is-java" page found: ${whatIsJava ? 'YES ✅' : 'NO ❌'}`);
    
    if (!whatIsJava) {
      console.log('\n🚨 CRITICAL: Integration tests require "what-is-java" navigation node');
      console.log('Current test assertions expect this exact node.id value');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkSidebar();
