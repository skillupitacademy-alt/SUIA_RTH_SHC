const sampleDocPayload = {
  subtopicId: '00000000-0000-0000-0000-000000000001',
  sectionType: 'notes',
  brandId: 'skillhubcore',
  document: {
    schemaVersion: 1,
    blocks: [
      {
        id: 'heading-1',
        type: 'heading',
        content: { text: 'JavaScript', level: 1 },
      },
      {
        id: 'paragraph-1',
        type: 'paragraph',
        content: { text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.' },
      },
      {
        id: 'heading-2',
        type: 'heading',
        content: { text: '1. What does it actually do? (The "Interactive" Part)', level: 2 },
      },
      {
        id: 'paragraph-2',
        type: 'paragraph',
        content: { text: 'When you click a button and a menu drops down, when you see live stock tickers update, or when a form validates—that is JavaScript.' },
      },
      {
        id: 'heading-3',
        type: 'heading',
        content: { text: '2. Where does it run? (The Two Sides)', level: 2 },
      },
      {
        id: 'heading-3a',
        type: 'heading',
        content: { text: 'Client-Side (Frontend)', level: 3 },
      },
      {
        id: 'paragraph-3a',
        type: 'paragraph',
        content: { text: 'This is its original home. The JavaScript code is sent to your web browser and executed on your computer or phone.' },
      },
      {
        id: 'heading-3b',
        type: 'heading',
        content: { text: 'Server-Side (Backend)', level: 3 },
      },
      {
        id: 'paragraph-3b',
        type: 'paragraph',
        content: { text: 'Thanks to Node.js, JavaScript can now run on web servers handling APIs, databases, and file systems.' },
      },
    ],
    metadata: {
      estimatedReadTime: 2,
      tags: ['javascript', 'web-development'],
      complexityScore: 5,
    },
  },
};

async function main() {
  const response = await fetch('http://localhost:3007/api/tutorial-composer/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tutorial-dev-bypass': 'true',
    },
    body: JSON.stringify(sampleDocPayload),
  });

  console.log('HTTP Status:', response.status);
  const json = await response.json();
  console.log('Response Structure:', Object.keys(json.data || {}));
  console.log('Statistics:', json.data?.statistics);
  console.log('Sections Count:', json.data?.sectionOutline?.length);
  console.log('Quality Indicators:', json.data?.qualityIndicators);
  console.log('Overall Confidence:', json.data?.overallConfidence);
}

main().catch(console.error);
