// Simple Analysis API Test
// Tests POST /api/tutorial-composer/analysis

const BASE_URL = process.env.SHC_ADMIN_URL || 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillhubcore.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testing';

console.log('🧪 TUTORIAL COMPOSER ANALYSIS API TEST');
console.log('=======================================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Email: ${ADMIN_EMAIL}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

const SAMPLE_DOCUMENT = {
  schemaVersion: 1,
  metadata: {
    title: 'Test Tutorial',
    description: 'Test document',
    tags: ['test'],
    estimatedDuration: 10,
    difficulty: 'beginner',
  },
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      level: 1,
      text: 'Introduction',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: 'This is a test paragraph with content for analysis.',
      presentation: { align: 'left', emphasis: 'normal' },
    },
    {
      id: 'code-1',
      type: 'code',
      language: 'javascript',
      code: 'console.log("Hello World");',
      caption: 'Example',
      presentation: { theme: 'dark', showLineNumbers: true, highlightLines: [] },
    },
  ],
};

async function runTest() {
  try {
    // Step 1: Login
    console.log('📝 Step 1: Admin Login...');
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
    console.log(`   ✅ Login successful\n`);

    // Step 2: Analyze Document
    console.log('🔍 Step 2: Analyze Document...');
    const analysisResponse = await fetch(`${BASE_URL}/api/tutorial-composer/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${token}`,
      },
      body: JSON.stringify({
        document: SAMPLE_DOCUMENT,
        brandId: 'shared',
      }),
    });

    console.log(`   Status: ${analysisResponse.status} ${analysisResponse.statusText}`);

    if (!analysisResponse.ok) {
      const error = await analysisResponse.json();
      throw new Error(`Analysis failed: ${JSON.stringify(error, null, 2)}`);
    }

    const result = await analysisResponse.json();
    console.log(`   ✅ Analysis successful\n`);

    // Step 3: Display Results
    console.log('📊 ANALYSIS RESULTS:');
    console.log('===================\n');

    console.log('STATISTICS:');
    console.log(`  Total Words: ${result.data.statistics.totalWords}`);
    console.log(`  Reading Time: ${result.data.statistics.readingTimeMinutes} min`);
    console.log(`  Sections: ${result.data.statistics.sectionsDetected}`);
    console.log(`  Total Blocks: ${result.data.statistics.totalBlocks}\n`);

    console.log('QUALITY INDICATORS:');
    Object.entries(result.data.qualityIndicators).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    console.log('DETECTED ELEMENTS:');
    Object.entries(result.data.detectedElements).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`  ${key}: ${value}`);
      }
    });
    console.log('');

    console.log('SMART SUGGESTIONS:');
    result.data.smartSuggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.type}] ${s.text}`);
    });
    console.log('');

    console.log('OVERALL CONFIDENCE:');
    console.log(`  Score: ${result.data.overallConfidence.score}/100`);
    console.log(`  Grade: ${result.data.overallConfidence.grade}`);
    console.log(`  ${result.data.overallConfidence.description}\n`);

    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
