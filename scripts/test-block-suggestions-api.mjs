const sampleDoc = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      content: { text: 'JavaScript Programming', level: 1 },
    },
    {
      id: 'paragraph-1',
      type: 'paragraph',
      content: { text: 'JavaScript is a versatile scripting language that powers interactive web pages and web applications globally.' },
    },
    {
      id: 'heading-2',
      type: 'heading',
      content: { text: 'Where Does JavaScript Run?', level: 2 },
    },
    {
      id: 'paragraph-2a',
      type: 'paragraph',
      content: { text: 'Client-Side JavaScript executes inside the user web browser with instant access to the DOM.' },
    },
    {
      id: 'paragraph-2b',
      type: 'paragraph',
      content: { text: 'Server-Side JavaScript runs on backend environments like Node.js handling API endpoints and databases.' },
    },
    {
      id: 'callout-1',
      type: 'callout',
      content: {
        text: 'Important: Remember that JavaScript is single-threaded with an asynchronous event loop.',
        variant: 'warning',
      },
    },
  ],
  metadata: {
    estimatedReadTime: 2,
    tags: ['javascript', 'web-development'],
    complexityScore: 5,
  },
};

async function main() {
  console.log('1. Calling POST /api/tutorial-composer/analysis to get ContentAnalysisResult...');
  const analysisRes = await fetch('http://localhost:3007/api/tutorial-composer/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tutorial-dev-bypass': 'true',
    },
    body: JSON.stringify({
      document: sampleDoc,
      subtopicId: '00000000-0000-0000-0000-000000000001',
      sectionType: 'notes',
      brandId: 'skillhubcore',
    }),
  });

  console.log('Analysis HTTP Status:', analysisRes.status);
  const analysisJson = await analysisRes.json();
  const analysis = analysisJson.data;

  console.log('2. Calling POST /api/tutorial-composer/block-suggestions...');
  const suggestionsRes = await fetch('http://localhost:3007/api/tutorial-composer/block-suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tutorial-dev-bypass': 'true',
    },
    body: JSON.stringify({
      document: sampleDoc,
      analysis: analysis,
      subtopicId: '00000000-0000-0000-0000-000000000001',
      sectionType: 'notes',
      brandId: 'skillhubcore',
    }),
  });

  console.log('Block Suggestions HTTP Status:', suggestionsRes.status);
  const suggestionsJson = await suggestionsRes.json();
  if (!suggestionsRes.ok) {
    console.error('Error response:', suggestionsJson);
    return;
  }

  const result = suggestionsJson.data?.data || suggestionsJson.data;
  console.log('Response summary:', {
    totalBlocks: result?.statistics?.totalBlocks,
    existingBlocks: result?.statistics?.existingBlocks,
    suggestedBlocks: result?.statistics?.suggestedBlocks,
    overallConfidence: result?.overallConfidence,
    blocksLength: result?.blocks?.length,
  });

  console.log('\nSample blocks:');
  result?.blocks?.slice(0, 7).forEach((b, i) => {
    console.log(`[${i + 1}] kind=${b.kind}, type=${b.blockType}, title="${b.title}", confidence=${b.confidence}%, reason="${b.reason}"`);
  });
}

main().catch(console.error);
