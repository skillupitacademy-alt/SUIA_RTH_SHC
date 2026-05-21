import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

const userSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" font-family="'Inter', sans-serif" style="background-color: #f8fafc;">
  <defs>
    <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
    </marker>
    <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
    </marker>
    <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-opacity="0.08" />
    </filter>
    <style>
      .code-text { font-family: 'Menlo', 'Cascadia Code', monospace; font-size: 15px; fill: #1e293b; }
      .code-comment { fill: #64748b; }
      .code-keyword { fill: #3b82f6; font-weight: 600; }
      .code-string { fill: #22c55e; }
      .code-function { fill: #8b5cf6; }
      .explain-title { font-size: 14px; font-weight: 600; fill: #0f172a; }
      .explain-text { font-size: 13px; fill: #334155; }
      .badge-text { font-size: 12px; font-weight: 600; fill: #ffffff; }
    </style>
  </defs>

  <!-- Header -->
  <rect x="0" y="0" width="1200" height="56" fill="#ffffff" filter="url(#shadow)" />
  <text x="32" y="36" font-size="20" font-weight="700" fill="#0f172a">JavaScript Syntax Anatomy</text>
  <text x="32" y="56" font-size="13" fill="#64748b">Key parts of a basic JavaScript program</text>

  <!-- Code Panel (Left) -->
  <rect x="32" y="80" width="520" height="480" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#shadow)" />
  
  <!-- Code lines with background highlights -->
  <!-- Line 1 comment -->
  <rect x="32" y="80" width="520" height="40" rx="12" fill="transparent" />
  <text x="56" y="106" class="code-text code-comment">// Declare a variable</text>
  
  <!-- Line 2: let greeting = 'Hello, World!'; -->
  <rect x="32" y="120" width="520" height="40" fill="#eff6ff" />
  <text x="56" y="146" class="code-text"><tspan class="code-keyword">let</tspan> greeting = <tspan class="code-string">'Hello, World!'</tspan>;</text>
  
  <!-- Line 3 blank -->
  <rect x="32" y="160" width="520" height="20" />
  
  <!-- Line 4 comment -->
  <text x="56" y="186" class="code-text code-comment">// Define a function</text>
  
  <!-- Line 5: function displayMessage() { -->
  <rect x="32" y="200" width="520" height="40" fill="#fef2f2" />
  <text x="56" y="226" class="code-text"><tspan class="code-keyword">function</tspan> <tspan class="code-function">displayMessage</tspan>() {</text>
  
  <!-- Line 6: console.log(greeting); -->
  <rect x="32" y="240" width="520" height="40" fill="#f0fdf4" />
  <text x="72" y="266" class="code-text">  <tspan class="code-function">console</tspan>.<tspan class="code-function">log</tspan>(greeting);</text>
  
  <!-- Line 7: } -->
  <rect x="32" y="280" width="520" height="40" />
  <text x="56" y="306" class="code-text">}</text>
  
  <!-- Line 8 blank -->
  <rect x="32" y="320" width="520" height="20" />
  
  <!-- Line 9 comment -->
  <text x="56" y="346" class="code-text code-comment">// Call the function</text>
  
  <!-- Line 10: displayMessage(); -->
  <rect x="32" y="360" width="520" height="40" fill="#fef2f2" />
  <text x="56" y="386" class="code-text"><tspan class="code-function">displayMessage</tspan>();</text>

  <!-- Explanations Panel (Right) -->
  <!-- Box 1: Variable declaration -->
  <rect x="600" y="120" width="550" height="90" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)" />
  <rect x="600" y="120" width="550" height="26" rx="8" fill="#3b82f6" />
  <rect x="600" y="132" width="550" height="14" fill="#3b82f6" />
  <text x="616" y="138" class="badge-text">Variable Declaration</text>
  <text x="616" y="168" class="explain-title">let greeting = 'Hello, World!';</text>
  <text x="616" y="188" class="explain-text">Declares a block-scoped variable greeting using let (ES6).</text>
  <text x="616" y="204" class="explain-text">Assigns a string value 'Hello, World!'. Strings can use single/double quotes.</text>
  
  <line x1="552" y1="165" x2="590" y2="165" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow-blue)" stroke-dasharray="3,2" />

  <!-- Box 2: Function definition -->
  <rect x="600" y="230" width="550" height="90" rx="8" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" filter="url(#shadow)" />
  <rect x="600" y="230" width="550" height="26" rx="8" fill="#ef4444" />
  <rect x="600" y="242" width="550" height="14" fill="#ef4444" />
  <text x="616" y="248" class="badge-text">Function Definition</text>
  <text x="616" y="278" class="explain-title">function displayMessage() { ... }</text>
  <text x="616" y="298" class="explain-text">Defines a function named displayMessage. Curly braces {} hold the</text>
  <text x="616" y="314" class="explain-text">function body — code that runs when the function is called.</text>
  
  <line x1="552" y1="275" x2="590" y2="275" stroke="#ef4444" stroke-width="1.5" marker-end="url(#arrow-red)" stroke-dasharray="3,2" />

  <!-- Box 3: Console log -->
  <rect x="600" y="350" width="550" height="90" rx="8" fill="#ffffff" stroke="#22c55e" stroke-width="1.5" filter="url(#shadow)" />
  <rect x="600" y="350" width="550" height="26" rx="8" fill="#22c55e" />
  <rect x="600" y="362" width="550" height="14" fill="#22c55e" />
  <text x="616" y="368" class="badge-text">Console Output</text>
  <text x="616" y="398" class="explain-title">console.log(greeting);</text>
  <text x="616" y="418" class="explain-text">Outputs the value of greeting to the browser's developer console.</text>
  <text x="616" y="434" class="explain-text">Essential for debugging and inspecting variables at runtime.</text>
  
  <line x1="552" y1="395" x2="590" y2="395" stroke="#22c55e" stroke-width="1.5" marker-end="url(#arrow-green)" stroke-dasharray="3,2" />

  <!-- Box 4: Function call -->
  <rect x="600" y="470" width="550" height="90" rx="8" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" filter="url(#shadow)" />
  <rect x="600" y="470" width="550" height="26" rx="8" fill="#ef4444" />
  <rect x="600" y="482" width="550" height="14" fill="#ef4444" />
  <text x="616" y="488" class="badge-text">Function Invocation</text>
  <text x="616" y="518" class="explain-title">displayMessage();</text>
  <text x="616" y="538" class="explain-text">Executes (calls) the function. The code inside displayMessage runs,</text>
  <text x="616" y="554" class="explain-text">printing Hello, World! to the console. Parentheses () invoke the function.</text>
  
  <line x1="552" y1="515" x2="590" y2="515" stroke="#ef4444" stroke-width="1.5" marker-end="url(#arrow-red)" stroke-dasharray="3,2" />

  <!-- Footer note -->
  <text x="600" y="590" font-size="12" fill="#94a3b8" text-anchor="middle">JavaScript runs line by line — statements are executed in order from top to bottom.</text>
</svg>`;

async function run() {
  try {
    console.log('⚡ Injecting user-created premium Syntax SVG for "whatisjavascript"...');
    
    // 1. Fetch current content
    const res = await pool.query(
      `SELECT ts.id, ts.content 
       FROM "tutorial_sections" ts
       JOIN "tutorial_subtopics" sub ON ts.subtopic_id = sub.id
       WHERE sub.slug = 'whatisjavascript' AND ts.section_type = 'notes'`
    );
    
    if (res.rows.length === 0) {
      console.log('❌ Notes section not found for whatisjavascript');
      return;
    }
    
    const row = res.rows[0];
    const content = row.content;
    
    if (!content.syntaxBlock) {
      content.syntaxBlock = {};
    }
    
    // Base64 encode the provided SVG
    const base64Svg = Buffer.from(userSvg).toString('base64');
    
    // Standard string concatenation to completely bypass escaping bugs!
    const dataUri = 'data:image/svg+xml;base64,' + base64Svg;
    
    content.syntaxBlock.image = {
      type: "inline_svg",
      name: "notes-syntax",
      alt: "JavaScript Syntax Anatomy Visual Diagram",
      width: 1200,
      height: 600,
      caption: "Visual diagram highlighting parts of a basic JavaScript program",
      dataUri: dataUri
    };
    
    // Update database
    await pool.query(
      `UPDATE "tutorial_sections" SET "content" = $1 WHERE "id" = $2`,
      [JSON.stringify(content), row.id]
    );
    console.log('✅ Successfully injected your premium Syntax SVG into the DB!');
    
  } catch (error) {
    console.error('❌ Error updating DB:', error);
  } finally {
    await pool.end();
  }
}

run();
