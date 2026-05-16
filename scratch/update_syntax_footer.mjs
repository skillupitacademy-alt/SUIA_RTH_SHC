import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://neondb_owner:npg_QjFse2RHgY1h@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT content FROM tutorial_sections 
    WHERE subtopic_id = (SELECT id FROM tutorial_subtopics WHERE slug = 'whatisjavascript') 
    AND section_type = 'notes'
  `);

  if (res.rows.length === 0) {
    console.error('Notes section not found');
    await client.end();
    return;
  }

  let content = res.rows[0].content;

  // Add Syntax Block (Section 4)
  content.syntaxBlock = {
    code: `// This is a comment
let message = "Hello, JavaScript!";
const PI = 3.14;

function add(a, b) {
  return a + b;
}

console.log(add(5, 3)); // Output: 8`,
    title: 'SYNTAX BLOCK',
    subtitle: 'JavaScript Basic Syntax',
    explanations: [
      { id: '1', term: 'let / const', explanation: 'used to declare variables' },
      { id: '2', term: 'function', explanation: 'defines a block of reusable code' },
      { id: '3', term: 'console.log()', explanation: 'prints output to the browser console' },
      { id: '4', term: '//', explanation: 'used to write comments' }
    ]
  };

  // Add Footer Block
  content.footerBlock = {
    finalNote: 'JavaScript is the engine that powers the modern web. Master the basics, practice consistently, and build amazing projects! 🚀',
    nextStepLabel: 'Variables, Data Types, Operators, Conditionals, Loops, Functions and more.',
    nextStepTarget: '/start-learning/subtopic/javascript-basics'
  };

  await client.query(`
    UPDATE tutorial_sections 
    SET content = $1 
    WHERE subtopic_id = (SELECT id FROM tutorial_subtopics WHERE slug = 'whatisjavascript') 
    AND section_type = 'notes'
  `, [JSON.stringify(content)]);

  console.log('DB Updated successfully with premium Syntax and Footer blocks');
  await client.end();
}

main().catch(console.error);
