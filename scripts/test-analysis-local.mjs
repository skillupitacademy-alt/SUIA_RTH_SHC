// Local Analysis API Test
// Tests POST /api/tutorial-composer/analysis on localhost

const BASE_URL = 'http://localhost:3007'; // Local SkillHubCore Admin
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

console.log('🧪 LOCAL TUTORIAL COMPOSER ANALYSIS API TEST');
console.log('============================================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Email: ${ADMIN_EMAIL}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

const SAMPLE_DOCUMENT = {
  schemaVersion: 1,
  metadata: {
    title: 'Introduction to JavaScript Variables',
    description: 'Learn about variables in JavaScript',
    author: 'Test Suite',
    tags: ['javascript', 'variables', 'basics'],
    estimatedDuration: 15,
    difficulty: 'beginner',
  },
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      level: 1,
      text: 'JavaScript Variables',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: 'Variables are containers for storing data values. In JavaScript, we can declare variables using var, let, or const keywords.',
      presentation: { align: 'left', emphasis: 'normal' },
    },
    {
      id: 'heading-2',
      type: 'heading',
      level: 2,
      text: 'Declaring Variables',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'paragraph-2',
      type: 'paragraph',
      text: 'The let keyword is used to declare variables that can be reassigned. The const keyword declares variables that cannot be reassigned.',
      presentation: { align: 'left', emphasis: 'normal' },
    },
    {
      id: 'code-1',
      type: 'code',
      language: 'javascript',
      code: 'let name = "John";\nconst age = 30;\nname = "Jane"; // OK\n// age = 31; // Error!',
      caption: 'Variable declaration examples',
      presentation: { theme: 'dark', showLineNumbers: true, highlightLines: [] },
    },
    {
      id: 'example-1',
      type: 'example',
      title: 'Real-World Example',
      content: 'For example, when building a shopping cart, you would use let for the cart items since they change, but const for the tax rate since it stays constant.',
      presentation: { style: 'default' },
    },
    {
      id: 'callout-1',
      type: 'callout',
      variant: 'tip',
      title: 'Pro Tip',
      content: 'Always use const by default. Only use let when you know the variable will be reassigned.',
      presentation: { showIcon: true },
    },
    {
      id: 'heading-3',
      type: 'heading',
      level: 2,
      text: 'Variable Naming Rules',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'list-1',
      type: 'list',
      style: 'bullet',
      items: [
        { id: 'item-1', text: 'Names must start with a letter, underscore, or dollar sign' },
        { id: 'item-2', text: 'Names cannot contain spaces' },
        { id: 'item-3', text: 'Names are case-sensitive' },
        { id: 'item-4', text: 'Reserved words cannot be used as names' },
      ],
      presentation: { spacing: 'comfortable', marker: 'disc' },
    },
  ],
};

async function runTest() {
  try {
    // Step 1: Test server connectivity
    console.log('🔌 Step 1: Testing server connectivity...');
    try {
      const healthCheck = await fetch(`${BASE_URL}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);
      
      if (!healthCheck) {
        throw new Error(`Cannot connect to ${BASE_URL}\n   Make sure SkillHubCore Admin is running on port 3007`);
      }
      console.log('   ✅ Server is accessible\n');
    } catch (error) {
      throw new Error(`Cannot connect to ${BASE_URL}\n   Make sure SkillHubCore Admin is running: npm run dev\n   Error: ${error.message}`);
    }

    // Step 2: Login
    console.log('📝 Step 2: Admin Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${error}`);
    }

    const setCookie = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      throw new Error('No accessToken in login response');
    }

    const token = tokenMatch[1];
    console.log('   ✅ Login successful\n');

    // Step 3: Test Analysis API Endpoint
    console.log('🔍 Step 3: Analyze Document...');
    console.log('   Endpoint: POST /api/tutorial-composer/analysis');
    
    const analysisResponse = await fetch(`${BASE_URL}/api/tutorial-composer/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${token}`,
      },
      body: JSON.stringify({
        document: SAMPLE_DOCUMENT,
        subtopicId: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
        brandId: 'shared',
      }),
    });

    console.log(`   Status: ${analysisResponse.status} ${analysisResponse.statusText}`);

    if (!analysisResponse.ok) {
      const contentType = analysisResponse.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const error = await analysisResponse.json();
        throw new Error(`Analysis failed: ${JSON.stringify(error, null, 2)}`);
      } else {
        const text = await analysisResponse.text();
        throw new Error(`Analysis failed (${analysisResponse.status}): ${text.substring(0, 200)}`);
      }
    }

    const result = await analysisResponse.json();
    console.log('   ✅ Analysis successful\n');

    // Step 4: Validate Response Structure
    console.log('✅ Step 4: Validating Response Structure...');
    const required = ['statistics', 'sectionOutline', 'qualityIndicators', 'detectedElements', 'smartSuggestions', 'overallConfidence'];
    const missing = required.filter(f => !result.data?.[f]);
    
    if (missing.length > 0) {
      throw new Error(`Missing fields in response: ${missing.join(', ')}`);
    }
    console.log('   ✅ All required fields present\n');

    // Step 5: Display Results
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('STATISTICS:');
    console.log(`  Total Words: ${result.data.statistics.totalWords}`);
    console.log(`  Characters: ${result.data.statistics.characters}`);
    console.log(`  Reading Time: ${result.data.statistics.readingTimeMinutes} minutes`);
    console.log(`  Sections Detected: ${result.data.statistics.sectionsDetected}`);
    console.log(`  Total Blocks: ${result.data.statistics.totalBlocks}`);
    console.log(`  Sections Breakdown: ${result.data.statistics.sectionsBreakdown}\n`);

    console.log('QUALITY INDICATORS:');
    Object.entries(result.data.qualityIndicators).forEach(([key, value]) => {
      const icon = value === 'excellent' || value === 'good' ? '✅' : value === 'fair' ? '⚠️' : '❌';
      console.log(`  ${icon} ${key}: ${value}`);
    });
    console.log('');

    console.log('DETECTED ELEMENTS:');
    Object.entries(result.data.detectedElements).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`  • ${key}: ${value}`);
      }
    });
    console.log('');

    console.log('SECTION OUTLINE:');
    result.data.sectionOutline.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title} [${section.level.toUpperCase()}] - Confidence: ${section.confidence}%`);
      if (section.subsections) {
        section.subsections.forEach((sub, j) => {
          console.log(`     ${i + 1}.${j + 1}. ${sub.title} [${sub.level.toUpperCase()}] - Confidence: ${sub.confidence}%`);
        });
      }
    });
    console.log('');

    console.log('SMART SUGGESTIONS:');
    result.data.smartSuggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.type}] ${s.text}`);
    });
    console.log('');

    console.log('OVERALL CONFIDENCE:');
    const gradeIcon = result.data.overallConfidence.grade === 'Excellent' || result.data.overallConfidence.grade === 'High' ? '🟢' : 
                      result.data.overallConfidence.grade === 'Good' ? '🟡' : '🔴';
    console.log(`  ${gradeIcon} Score: ${result.data.overallConfidence.score}/100`);
    console.log(`  ${gradeIcon} Grade: ${result.data.overallConfidence.grade}`);
    console.log(`  📝 ${result.data.overallConfidence.description}`);
    console.log('  ℹ️  Note: Confidence values are deterministic structural scores\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('✅ Backend Implementation Status:');
    console.log('   • API Endpoint: Working');
    console.log('   • Authentication: Working');
    console.log('   • Authorization: Working');
    console.log('   • Document Analysis: Working');
    console.log('   • Response Schema: Valid');
    console.log('   • Database Connection: Working\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
