import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('═══════════════════════════════════════════════════════════');
console.log('SIDEBAR TREE STRUCTURE INSPECTION');
console.log('═══════════════════════════════════════════════════════════\n');

async function inspect() {
  try {
    // Get Java sidebar tree
    const javaTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
    
    const sidebar = await tutorialDb.query(`
      SELECT id, brand_id, topic_id, tree 
      FROM tutorial_sidebar_trees_v2 
      WHERE topic_id = $1
    `, [javaTopicId]);
    
    if (sidebar.rows.length === 0) {
      console.log('❌ No sidebar tree found for Java topic');
      return;
    }
    
    console.log(`Found sidebar tree: ${sidebar.rows[0].id}`);
    console.log(`Brand: ${sidebar.rows[0].brand_id}`);
    console.log(`Topic ID: ${sidebar.rows[0].topic_id}\n`);
    
    const tree = sidebar.rows[0].tree;
    
    console.log('TREE STRUCTURE');
    console.log('─────────────────────────────────────────────────────────\n');
    
    function printNode(node, depth = 0) {
      const indent = '  '.repeat(depth);
      const icon = node.type === 'page' ? '📄' : '📁';
      console.log(`${indent}${icon} ${node.name || node.id}`);
      console.log(`${indent}   type: ${node.type}`);
      console.log(`${indent}   id: ${node.id}`);
      if (node.slug) console.log(`${indent}   slug: ${node.slug}`);
      if (node.url) console.log(`${indent}   url: ${node.url}`);
      console.log('');
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => printNode(child, depth + 1));
      }
    }
    
    printNode(tree);
    
    // Count pages
    function countPages(node) {
      let count = node.type === 'page' ? 1 : 0;
      if (node.children) {
        count += node.children.reduce((sum, child) => sum + countPages(child), 0);
      }
      return count;
    }
    
    const totalPages = countPages(tree);
    console.log(`\nTotal pages in tree: ${totalPages}`);
    
    // List all page IDs
    function collectPageIds(node, pages = []) {
      if (node.type === 'page') {
        pages.push({ id: node.id, name: node.name, url: node.url });
      }
      if (node.children) {
        node.children.forEach(child => collectPageIds(child, pages));
      }
      return pages;
    }
    
    const allPages = collectPageIds(tree);
    console.log('\nALL PAGE IDs:');
    console.log('─────────────────────────────────────────────────────────');
    allPages.forEach(page => {
      console.log(`  • ${page.id}`);
      console.log(`    Name: ${page.name}`);
      console.log(`    URL: ${page.url}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ INSPECTION FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await tutorialDb.end();
  }
}

inspect();
