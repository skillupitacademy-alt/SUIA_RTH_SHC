/**
 * Mock Block Suggestions Data Fixture
 * Matches promptimages/page-13.png reference design
 * 
 * Used as an isolated development fixture for Page 13 GUI rendering.
 */

export interface SuggestedBlockItem {
  id: string;
  index: number;
  origin: 'existing' | 'suggested';
  blockType: {
    name: string;
    badge: string; // 'H1' | 'H2' | 'Paragraph' | 'Two Column' | 'Bullet List' | 'Callout' | 'Code' | 'Table'
    badgeColor: 'navy' | 'pink' | 'blue' | 'purple' | 'amber' | 'slate';
    isSuggested?: boolean;
  };
  category: 'heading' | 'paragraph' | 'list' | 'code' | 'component';
  contentPreview: string;
  pills?: string[];
  bullets?: string[];
  confidence: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  isSelected: boolean;
}

export interface BlockSuggestionsSummaryData {
  totalSuggested: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  sectionsCount: number;
}

export const mockSummaryData: BlockSuggestionsSummaryData = {
  totalSuggested: 18,
  highConfidenceCount: 14,
  mediumConfidenceCount: 3,
  lowConfidenceCount: 1,
  sectionsCount: 6,
};

export const mockSuggestedBlocks: SuggestedBlockItem[] = [
  {
    id: 'block-1',
    index: 1,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 1', badge: 'H1', badgeColor: 'navy' },
    contentPreview: 'JavaScript',
    confidence: 99,
    reason: 'Top level title detected using Markdown #',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-2',
    index: 2,
    origin: 'existing',
    category: 'paragraph',
    blockType: { name: 'Paragraph', badge: 'T', badgeColor: 'blue' },
    contentPreview: 'JavaScript is a programming language that makes websites interactive.',
    confidence: 98,
    reason: 'Opening paragraph (lead content)',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-3',
    index: 3,
    origin: 'existing',
    category: 'paragraph',
    blockType: { name: 'Paragraph', badge: 'T', badgeColor: 'blue' },
    contentPreview: 'While HTML gives a webpage structure (headings, paragraphs, images) and CSS gives it style (colors, fonts, layouts), JavaScript is the engine that makes it come alive—it handles everything that changes...',
    confidence: 96,
    reason: 'Continuation of introduction',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-4',
    index: 4,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '1. What does it actually do? (The "Interactive" Part)',
    confidence: 98,
    reason: 'Section heading pattern detected',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-5',
    index: 5,
    origin: 'existing',
    category: 'paragraph',
    blockType: { name: 'Paragraph', badge: 'T', badgeColor: 'blue' },
    contentPreview: 'When you click a button and a menu drops down, when you see live stock tickers update, when a form validates your email address before you hit "submit," or when a website loads new content without refreshing the...',
    confidence: 97,
    reason: 'Descriptive paragraph under section',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-6',
    index: 6,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '2. Where does it run? (The Two Sides)',
    confidence: 96,
    reason: 'Section heading pattern detected',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-7',
    index: 7,
    origin: 'suggested',
    category: 'component',
    blockType: { name: 'Two Column', badge: 'Two Column', badgeColor: 'purple', isSuggested: true },
    contentPreview: '',
    pills: ['Client-Side (Frontend)', 'Server-Side (Backend)'],
    confidence: 72,
    reason: 'Parallel concepts detected (sides comparison)',
    status: 'accepted',
    isSelected: true,
  },
  {
    id: 'block-8',
    index: 8,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '3. Key Technical Characteristics (The "Nerdy" Bits)',
    confidence: 94,
    reason: 'Section heading pattern detected',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-9',
    index: 9,
    origin: 'existing',
    category: 'list',
    blockType: { name: 'Bullet List', badge: 'List', badgeColor: 'blue' },
    contentPreview: '',
    bullets: [
      'High-level & Interpreted',
      'Dynamically Typed',
      'Multi-Paradigm...',
    ],
    confidence: 93,
    reason: 'Bullet pattern detected (4 items)',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-10',
    index: 10,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '4. The JavaScript Ecosystem (Frameworks)',
    confidence: 92,
    reason: 'Section heading pattern detected',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-11',
    index: 11,
    origin: 'existing',
    category: 'paragraph',
    blockType: { name: 'Paragraph', badge: 'T', badgeColor: 'blue' },
    contentPreview: 'Very rarely do developers write plain, raw JavaScript anymore. Modern web development relies on ecosystems like React, Next.js, and TypeScript.',
    confidence: 95,
    reason: 'Descriptive explanation of ecosystem',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-12',
    index: 12,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '5. The Crucial Clarification: JavaScript is NOT Java',
    confidence: 96,
    reason: 'Section heading pattern detected',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-13',
    index: 13,
    origin: 'suggested',
    category: 'component',
    blockType: { name: 'Callout', badge: 'Callout', badgeColor: 'amber', isSuggested: true },
    contentPreview: 'Despite the similar name, JavaScript and Java are two distinct programming languages developed by different teams for different purposes.',
    confidence: 88,
    reason: 'Clarification / warning callout detected',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-14',
    index: 14,
    origin: 'existing',
    category: 'code',
    blockType: { name: 'Code Block', badge: 'Code', badgeColor: 'slate' },
    contentPreview: "document.getElementById('btn').addEventListener('click', () => alert('Hello World!'));",
    confidence: 99,
    reason: 'Fenced JavaScript code snippet',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-15',
    index: 15,
    origin: 'existing',
    category: 'heading',
    blockType: { name: 'Heading 2', badge: 'H2', badgeColor: 'pink' },
    contentPreview: '6. Summary & Key Takeaways',
    confidence: 95,
    reason: 'Summary heading pattern detected',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-16',
    index: 16,
    origin: 'existing',
    category: 'list',
    blockType: { name: 'Bullet List', badge: 'List', badgeColor: 'blue' },
    contentPreview: '',
    bullets: [
      'HTML provides structure, CSS provides styling, JavaScript adds behavior.',
      'Executes both client-side in browsers and server-side via Node.js.',
      'Powers interactive web applications globally.',
    ],
    confidence: 94,
    reason: 'Summary takeaway list items',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-17',
    index: 17,
    origin: 'suggested',
    category: 'component',
    blockType: { name: 'Concept Card', badge: 'Card', badgeColor: 'purple', isSuggested: true },
    contentPreview: 'Single-Threaded Event Loop: Handles concurrent tasks non-blockingly.',
    confidence: 65,
    reason: 'Technical concept definition suitable for card presentation',
    status: 'pending',
    isSelected: false,
  },
  {
    id: 'block-18',
    index: 18,
    origin: 'suggested',
    category: 'component',
    blockType: { name: 'Comparison', badge: 'Comparison', badgeColor: 'purple', isSuggested: true },
    contentPreview: 'Client-Side (V8 / Browser Engine) vs Server-Side (Node.js / Bun Runtime)',
    confidence: 48,
    reason: 'Environment runtime comparison potential',
    status: 'pending',
    isSelected: false,
  },
];

export const sampleRawMarkdownText = `# JavaScript

JavaScript is a programming language that makes websites interactive.

While HTML gives a webpage structure (headings, paragraphs, images) and CSS gives it style (colors, fonts, layouts), JavaScript is the engine that makes it come alive—it handles everything that changes, moves, updates, or responds to you on a page.

## 1. What does it actually do? (The "Interactive" Part)

When you click a button and a menu drops down, when you see live stock tickers update, when a form validates your email address before you hit "submit," or when a website loads new content without refreshing the page—that is JavaScript. It listens for user events (clicks, keystrokes, mouse movements) and changes the webpage in real-time in response.

## 2. Where does it run? (The Two Sides)

JavaScript is no longer just a "web browser" language:

### Client-Side (Frontend):
This is its original home. The JavaScript code is sent to your web browser (Chrome, Firefox, Safari) and runs on your own computer or phone. Every major browser has a built-in engine (like Chrome's V8) designed to execute JavaScript instantly.

### Server-Side (Backend):
With runtime environments like Node.js, JavaScript can also run on servers—handling databases, authentication, APIs, and file systems just like Python or Java.

## 3. Key Technical Characteristics (The "Nerdy" Bits)

- High-level & Interpreted
- Dynamically Typed
- Multi-Paradigm (Object-oriented & Functional)
- Single-threaded with non-blocking Event Loop

## 4. The JavaScript Ecosystem (Frameworks)

Very rarely do developers write plain, raw JavaScript anymore. Modern ecosystems rely on React, Next.js, and TypeScript.

## 5. The Crucial Clarification: JavaScript is NOT Java

Despite the similar name, they are completely different languages created by different teams for different purposes.

\`\`\`javascript
document.getElementById('btn').addEventListener('click', () => {
  console.log('Button clicked!');
});
\`\`\`

## 6. Summary & Key Takeaways

- HTML gives structure, CSS provides styling, JavaScript adds behavior.
- Executes on both Client-Side and Server-Side.
- Powers modern full-stack web applications worldwide.`;
