import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

const premiumSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480" font-family="'Inter', sans-serif" style="background-color: #f8fafc;">
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
    <marker id="arrow-amber" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#d97706" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-opacity="0.06" flood-color="#0f172a" />
    </filter>
    <style>
      .code-text { font-family: 'Fira Code', 'Menlo', 'Cascadia Code', monospace; font-size: 14px; fill: #1e293b; }
      .code-comment { fill: #94a3b8; font-style: italic; }
      .code-keyword { fill: #3b82f6; font-weight: 700; }
      .code-string { fill: #10b981; }
      .code-function { fill: #6366f1; font-weight: 600; }
      .code-method { fill: #a855f7; font-weight: 600; }
      .badge-bg-blue { fill: #eff6ff; }
      .badge-text-blue { fill: #1d4ed8; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
      .badge-bg-red { fill: #fff5f5; }
      .badge-text-red { fill: #c53030; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
      .badge-bg-green { fill: #f0fdf4; }
      .badge-text-green { fill: #15803d; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
      .badge-bg-amber { fill: #fffbeb; }
      .badge-text-amber { fill: #b45309; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
      .card-title { font-size: 13px; font-weight: 700; fill: #0f172a; }
      .card-text { font-size: 11.5px; fill: #475569; font-weight: 500; }
    </style>
  </defs>

  <!-- Left Code Editor Panel (IDE Style) -->
  <rect x="40" y="20" width="500" height="440" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#shadow)" />
  
  <!-- Line Numbers Gutter Background -->
  <path d="M 40,36 A 16,16 0 0 1 56,20 L 90,20 L 90,460 L 56,460 A 16,16 0 0 1 40,444 Z" fill="#f8fafc" />
  <line x1="90" y1="20" x2="90" y2="460" stroke="#e2e8f0" stroke-width="1" />
  
  <!-- Gutter Line Numbers -->
  <g font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">
    <text x="65" y="46">1</text>
    <text x="65" y="86">2</text>
    <text x="65" y="126">3</text>
    <text x="65" y="166">4</text>
    <text x="65" y="206">5</text>
    <text x="65" y="246">6</text>
    <text x="65" y="286">7</text>
    <text x="65" y="326">8</text>
    <text x="65" y="366">9</text>
    <text x="65" y="406">10</text>
  </g>

  <!-- Highlight Bands for Key Rows (With fill="none" on empty ones to prevent black box default) -->
  <rect x="91" y="20" width="448" height="40" fill="none" />
  <rect x="91" y="60" width="448" height="40" fill="#eff6ff" /> <!-- Line 2 highlight -->
  <rect x="91" y="100" width="448" height="40" fill="none" />
  <rect x="91" y="140" width="448" height="40" fill="none" />
  <rect x="91" y="180" width="448" height="40" fill="#fff5f5" /> <!-- Line 5 highlight -->
  <rect x="91" y="220" width="448" height="40" fill="#f0fdf4" /> <!-- Line 6 highlight -->
  <rect x="91" y="260" width="448" height="40" fill="none" />
  <rect x="91" y="300" width="448" height="40" fill="none" />
  <rect x="91" y="340" width="448" height="40" fill="none" />
  <rect x="91" y="380" width="448" height="40" fill="#fffbeb" /> <!-- Line 10 highlight -->

  <!-- Actual Code Texts -->
  <g class="code-text">
    <text x="110" y="46" class="code-comment">// Declare a variable</text>
    <text x="110" y="86"><tspan class="code-keyword">let</tspan> greeting = <tspan class="code-string">'Hello, World!'</tspan>;</text>
    <text x="110" y="126"></text>
    <text x="110" y="166" class="code-comment">// Define a function</text>
    <text x="110" y="206"><tspan class="code-keyword">function</tspan> <tspan class="code-function">displayMessage</tspan>() {</text>
    <text x="110" y="246">  <tspan class="code-function">console</tspan>.<tspan class="code-method">log</tspan>(greeting);</text>
    <text x="110" y="286">}</text>
    <text x="110" y="326"></text>
    <text x="110" y="366" class="code-comment">// Call the function</text>
    <text x="110" y="406"><tspan class="code-function">displayMessage</tspan>();</text>
  </g>

  <!-- Right Explanation Cards -->
  <!-- Card 1: Variable Declaration -->
  <g filter="url(#shadow)">
    <rect x="600" y="20" width="560" height="96" rx="12" fill="#ffffff" stroke="#bfdbfe" stroke-width="1.5" />
    <path d="M 600,32 A 12,12 0 0 1 612,20 L 616,20 L 616,116 L 612,116 A 12,12 0 0 1 600,104 Z" fill="#3b82f6" />
    <rect x="630" y="36" width="130" height="20" rx="4" class="badge-bg-blue" />
    <text x="636" y="49" class="badge-text-blue">VARIABLE DECLARATION</text>
    <text x="630" y="74" class="card-title">let greeting = 'Hello, World!';</text>
    <text x="630" y="94" class="card-text">Declares a block-scoped variable greeting and assigns a string value.</text>
  </g>

  <!-- Card 2: Function Definition -->
  <g filter="url(#shadow)">
    <rect x="600" y="132" width="560" height="96" rx="12" fill="#ffffff" stroke="#fecaca" stroke-width="1.5" />
    <path d="M 600,144 A 12,12 0 0 1 612,132 L 616,132 L 616,228 L 612,228 A 12,12 0 0 1 600,216 Z" fill="#ef4444" />
    <rect x="630" y="148" width="130" height="20" rx="4" class="badge-bg-red" />
    <text x="636" y="161" class="badge-text-red">FUNCTION DEFINITION</text>
    <text x="630" y="186" class="card-title">function displayMessage() { ... }</text>
    <text x="630" y="206" class="card-text">Groups statements together inside curly braces to be reused later.</text>
  </g>

  <!-- Card 3: Console Output -->
  <g filter="url(#shadow)">
    <rect x="600" y="244" width="560" height="96" rx="12" fill="#ffffff" stroke="#bbf7d0" stroke-width="1.5" />
    <path d="M 600,256 A 12,12 0 0 1 612,244 L 616,244 L 616,340 L 612,340 A 12,12 0 0 1 600,328 Z" fill="#22c55e" />
    <rect x="630" y="260" width="130" height="20" rx="4" class="badge-bg-green" />
    <text x="636" y="273" class="badge-text-green">CONSOLE OUTPUT</text>
    <text x="630" y="298" class="card-title">console.log(greeting);</text>
    <text x="630" y="318" class="card-text">Prints the value stored in the greeting variable to the developer console.</text>
  </g>

  <!-- Card 4: Function Invocation -->
  <g filter="url(#shadow)">
    <rect x="600" y="356" width="560" height="96" rx="12" fill="#ffffff" stroke="#fef3c7" stroke-width="1.5" />
    <path d="M 600,368 A 12,12 0 0 1 612,356 L 616,356 L 616,452 L 612,452 A 12,12 0 0 1 600,440 Z" fill="#d97706" />
    <rect x="630" y="372" width="130" height="20" rx="4" class="badge-bg-amber" />
    <text x="636" y="385" class="badge-text-amber">FUNCTION INVOCATION</text>
    <text x="630" y="410" class="card-title">displayMessage();</text>
    <text x="630" y="430" class="card-text">Triggers and runs the code block defined inside displayMessage().</text>
  </g>

  <!-- Sleek Curved Dotted Connectors with Directional Arrow Markers -->
  <path d="M 540,80 C 560,80 580,68 600,68" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-blue)" />
  <path d="M 540,200 C 560,200 580,180 600,180" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-red)" />
  <path d="M 540,240 C 560,240 580,292 600,292" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-green)" />
  <path d="M 540,400 C 560,400 580,404 600,404" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-amber)" />

</svg>`;

async function run() {
  try {
    console.log('⚡ Injecting enhanced premium Syntax SVG for "whatisjavascript"...');
    
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
    const base64Svg = Buffer.from(premiumSvg).toString('base64');
    const dataUri = 'data:image/svg+xml;base64,' + base64Svg;
    
    content.syntaxBlock.image = {
      type: "inline_svg",
      name: "notes-syntax",
      alt: "JavaScript Syntax Anatomy Enhanced Visual Diagram",
      width: 1200,
      height: 480,
      caption: "Interactive visual mapping variables, functions, and console logs",
      dataUri: dataUri
    };
    
    // Update database
    await pool.query(
      `UPDATE "tutorial_sections" SET "content" = $1 WHERE "id" = $2`,
      [JSON.stringify(content), row.id]
    );
    console.log('✅ Successfully injected enhanced premium Syntax SVG into the DB!');
    
  } catch (error) {
    console.error('❌ Error updating DB:', error);
  } finally {
    await pool.end();
  }
}

run();
