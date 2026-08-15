const sampleContent = `# JavaScript

JavaScript is a programming language that makes websites interactive.

While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.

## 1. What does it actually do?

When you click a button and a menu drops down, that is JavaScript.

- Client-Side (Frontend)
- Server-Side (Backend)

\`\`\`javascript
const greeting = "Hello, JavaScript!";
console.log(greeting);
\`\`\`

> [!NOTE]
> JavaScript runs in every modern web browser.`;

async function main() {
  const response = await fetch('http://localhost:3007/api/tutorial-composer/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subtopicId: '00000000-0000-0000-0000-000000000001',
      sectionType: 'notes',
      difficulty: 'beginner',
      brandId: 'skillhubcore',
      sourceType: 'markdown',
      rawContent: sampleContent,
    }),
  });

  const json = await response.json();
  console.log('HTTP Status:', response.status);
  console.log('Parsed Blocks Count:', json.data?.document?.blocks?.length);
  console.log('Stats:', json.data?.stats);
}

main().catch(console.error);
