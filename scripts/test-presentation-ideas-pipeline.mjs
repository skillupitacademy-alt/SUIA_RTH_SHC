const previewDocPayload = {
  subtopicId: '00000000-0000-0000-0000-000000000001',
  sectionType: 'notes',
  brandId: 'skillhubcore',
  document: {
    schemaVersion: 1,
    blocks: [
      { id: 'heading-1', type: 'heading', content: { text: 'JavaScript', level: 1 } },
      { id: 'paragraph-1', type: 'paragraph', content: { text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.' } },
      { id: 'heading-2', type: 'heading', content: { text: '1. What does it actually do? (The "Interactive" Part)', level: 2 } },
      { id: 'paragraph-2', type: 'paragraph', content: { text: 'When you click a button and a menu drops down, when you see live stock tickers update, when a form validates—that is JavaScript.' } },
      { id: 'heading-3', type: 'heading', content: { text: '2. Where does it run? (The Two Sides)', level: 2 } },
      { id: 'paragraph-3a', type: 'paragraph', content: { text: 'Client-Side JavaScript executes in web browsers like Chrome and Safari directly on the user device.' } },
      { id: 'paragraph-3b', type: 'paragraph', content: { text: 'Server-Side JavaScript runs on backend environments like Node.js handling databases and APIs.' } },
      { id: 'heading-4', type: 'heading', content: { text: '3. Key Technical Characteristics (The "Nerdy" Bits)', level: 2 } },
      { id: 'list-1', type: 'list', content: { style: 'unordered', items: [{ text: 'Single-threaded event-loop architecture' }, { text: 'Dynamic and weak typing system' }, { text: 'First-class functions supporting functional programming' }] } },
      { id: 'heading-5', type: 'heading', content: { text: '4. The JavaScript Ecosystem (Frameworks)', level: 2 } },
      { id: 'paragraph-5', type: 'paragraph', content: { text: 'Very rarely do developers write plain, raw JavaScript anymore. Modern ecosystems rely on React, Next.js, and TypeScript.' } },
      { id: 'heading-6', type: 'heading', content: { text: '5. The Crucial Clarification: JavaScript is NOT Java', level: 2 } },
      { id: 'callout-1', type: 'callout', content: { text: 'Important: Despite the similar name, JavaScript and Java are completely different languages created by different teams for different purposes.', variant: 'warning' } }
    ],
    metadata: {
      estimatedReadTime: 2,
      tags: ['javascript', 'web-development'],
      complexityScore: 5
    }
  }
};

async function main() {
  console.log('1. Calling POST /api/tutorial-composer/analysis...');
  const aRes = await fetch('http://localhost:3007/api/tutorial-composer/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
    body: JSON.stringify(previewDocPayload),
  });
  console.log('Analysis HTTP Status:', aRes.status);
  const aJson = await aRes.json();
  if (!aRes.ok) {
    console.error('Analysis error:', aJson);
    return;
  }
  console.log('Analysis OK! Sections detected:', aJson.data?.sectionOutline?.length);

  console.log('2. Calling POST /api/tutorial-composer/block-suggestions...');
  const sRes = await fetch('http://localhost:3007/api/tutorial-composer/block-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
    body: JSON.stringify({
      ...previewDocPayload,
      analysis: aJson.data,
    }),
  });
  console.log('Block Suggestions HTTP Status:', sRes.status);
  const sJson = await sRes.json();
  if (!sRes.ok) {
    console.error('Suggestions error:', sJson);
    return;
  }
  const sData = sJson.data?.data || sJson.data;
  console.log('Suggestions OK! Total blocks:', sData?.statistics?.totalBlocks);

  console.log('3. Calling POST /api/tutorial-composer/presentation-ideas...');
  const pRes = await fetch('http://localhost:3007/api/tutorial-composer/presentation-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
    body: JSON.stringify({
      ...previewDocPayload,
      analysis: aJson.data,
      blockSuggestions: sData,
    }),
  });
  console.log('Presentation Ideas HTTP Status:', pRes.status);
  const pJson = await pRes.json();
  if (!pRes.ok) {
    console.error('Presentation ideas error:', pJson);
    return;
  }
  const pData = pJson.data?.data || pJson.data;
  console.log('Presentation Ideas OK! Summary:', {
    totalIdeas: pData?.statistics?.total,
    highImpact: pData?.statistics?.high,
    mediumImpact: pData?.statistics?.medium,
    lowImpact: pData?.statistics?.low,
    enhancementTips: pData?.statistics?.enhancementTips,
    ideasCount: pData?.ideas?.length,
  });

  console.log('\nSample Ideas:');
  pData?.ideas?.slice(0, 5).forEach((idea, i) => {
    console.log(`[${i + 1}] title="${idea.title}", impact=${idea.impact}, type=${idea.type}, wireframe=${idea.wireframeType}, targetBlock=${idea.targetBlockType}`);
  });
}

main().catch(console.error);
