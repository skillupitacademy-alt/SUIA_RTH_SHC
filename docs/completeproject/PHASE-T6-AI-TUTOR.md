# PHASE-T6: AI Tutor Engine
## docs/blueprints/PHASE-T6-AI-TUTOR.md

> Prerequisites: PHASE-T1 complete, Upstash Vector account configured
> Sprint: Tutorial Sprint 6

---

## Purpose

The AI Tutor provides two modes per subtopic:
1. Pre-generated Q&A pairs (static, from JSON schema)
2. Live streaming chat (dynamic, context-aware, domain-specific)

All AI Tutor responses are grounded in the subtopic's own content blocks —
the AI cannot introduce concepts from other subtopics.

---

## Part 1: Architecture

```
Student types question in AITutorBlock
        ↓
POST /api/ai-tutor/chat
  body: { subtopicId, difficulty, message, history[], userId }
        ↓
AITutorService:
  1. Load subtopic content from Tutorial DB (or Redis cache)
  2. Search Upstash Vector for relevant content chunks
  3. Build system prompt with domain context + content
  4. Call Claude API (streaming)
  5. Stream response to student
  6. On first message: call markBlockComplete('ai_tutor')
        ↓
Streaming SSE response → student sees text appear word by word
```

---

## Part 2: Upstash Vector Integration

```typescript
// packages/db-tutorial/src/vector.ts

import { Index } from '@upstash/vector'

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_URL!,
  token: process.env.UPSTASH_VECTOR_TOKEN!
})

// Index content when admin publishes a subtopic
export async function indexSubtopicContent(
  subtopicId: string,
  difficulty: string,
  content: TutorialContentJSON
): Promise<void> {
  const chunks = [
    {
      id: `${subtopicId}:${difficulty}:notes`,
      data: content.notes.markdown,
      metadata: { subtopicId, difficulty, blockType: 'notes' }
    },
    {
      id: `${subtopicId}:${difficulty}:layman`,
      data: `${content.layman.simpleExplanation} ${content.layman.analogyOrStory}`,
      metadata: { subtopicId, difficulty, blockType: 'layman' }
    },
    {
      id: `${subtopicId}:${difficulty}:technical`,
      data: content.technical.markdown,
      metadata: { subtopicId, difficulty, blockType: 'technical' }
    },
    {
      id: `${subtopicId}:${difficulty}:code`,
      data: `${content.code.intro} ${content.code.steps.join(' ')}`,
      metadata: { subtopicId, difficulty, blockType: 'code' }
    }
  ]
  await vectorIndex.upsert(chunks)
}

// Find relevant content chunks for a student question
export async function findRelevantContent(
  subtopicId: string,
  query: string,
  topK = 3
): Promise<ContentChunk[]> {
  const results = await vectorIndex.query({
    data: query,
    topK,
    filter: `subtopicId = '${subtopicId}'`,
    includeMetadata: true
  })
  return results.map(r => ({
    content: r.data as string,
    blockType: r.metadata?.blockType,
    score: r.score
  }))
}
```

---

## Part 3: System Prompt Construction

```typescript
// services/tutorial-service/src/modules/ai-tutor/prompt-builder.ts

export function buildAITutorSystemPrompt(
  subtopic: SubtopicRecord,
  domainConfig: DomainContentConfig,
  content: TutorialContentJSON,
  relevantChunks: ContentChunk[]
): string {
  return `
You are an AI Tutor for ${subtopic.name} in the ${domainConfig.audienceProfile} domain.

STUDENT CONTEXT:
This student has just read the following learning materials:
- Layman Explanation: ${content.layman.simpleExplanation}
- Real-Life Scenario: ${content.real_life.scenario}
- Technical Overview: ${content.technical.markdown.substring(0, 500)}

RELEVANT CONTENT for their question:
${relevantChunks.map(c => `[${c.blockType}]: ${c.content}`).join('\n\n')}

YOUR PERSONALITY:
- Domain focus: ${domainConfig.aiTutorFocus}
- Tone: Encouraging, patient, Socratic (ask questions back to guide thinking)
- Give hints first, not full answers
- If student is confused, go back to the layman analogy
- Always connect answers to the real-life examples from the learning material
- Use examples from: ${domainConfig.laymanStyle.exampleCompanies.join(', ')}

STRICT BOUNDARIES:
- ONLY discuss topics covered in this subtopic: "${subtopic.name}"
- NEVER introduce concepts from other subtopics
- NEVER contradict the technical explanation above
- NEVER be discouraging — wrong answers are learning opportunities
- If asked about something outside this subtopic, say:
  "That's a great question! That's covered in [related subtopic].
   Let's focus on ${subtopic.name} for now."
`.trim()
}
```

---

## Part 4: Streaming API Route

```typescript
// apps/tutorial-app/src/app/api/ai-tutor/chat/route.ts
// 'use server' equivalent — this is a Route Handler

import { streamText } from 'ai'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { subtopicId, difficulty, message, history, userId } = await req.json()

  // 1. Auth check
  const session = await getServerSession()
  if (!session || session.userId !== userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limiting: 30 messages per student per subtopic per hour
  const rateLimitResult = await ratelimit.limit(`tutor:${userId}:${subtopicId}`)
  if (!rateLimitResult.success) {
    return Response.json({ error: 'Too many messages. Please wait.' }, { status: 429 })
  }

  // 3. Load subtopic content + find relevant chunks
  const [content, relevantChunks, domainConfig] = await Promise.all([
    getCachedSubtopicContent(subtopicId, difficulty),
    findRelevantContent(subtopicId, message),
    getCachedDomainConfig(subtopicId)
  ])

  // 4. Build system prompt
  const systemPrompt = buildAITutorSystemPrompt(
    content.subtopic, domainConfig, content, relevantChunks
  )

  // 5. Build message history for context
  const messages = [
    ...history.map(h => ({ role: h.role, content: h.text })),
    { role: 'user', content: message }
  ]

  // 6. Stream response
  const anthropic = new Anthropic()
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages
  })

  // 7. Return streaming response
  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## Part 5: Client-Side Streaming

```typescript
// In AITutorBlock.tsx
async function handleSendMessage() {
  if (!chatInput.trim()) return
  const userMessage = chatInput
  setChatInput('')

  // Add user message immediately
  setChatMessages(prev => [...prev, { role: 'user', text: userMessage }])

  // Add empty AI message (will stream into it)
  setChatMessages(prev => [...prev, { role: 'ai', text: '' }])

  setIsStreaming(true)

  const response = await fetch('/api/ai-tutor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subtopicId, difficulty, message: userMessage,
      history: chatMessages, userId
    })
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    // Parse SSE chunks and append to last AI message
    setChatMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1].text += parseSSEChunk(chunk)
      return updated
    })
  }

  setIsStreaming(false)

  // First message = unlock assignment
  if (chatMessages.filter(m => m.role === 'user').length === 0) {
    await markBlockComplete(subtopicId, 'ai_tutor')
  }
}
```

---

## Part 6: "Find Similar Content" (Semantic Search)

```typescript
// When student asks something outside subtopic scope:
// AI Tutor uses vector search to suggest related subtopics

export async function findRelatedSubtopics(
  currentSubtopicId: string,
  query: string
): Promise<RelatedSubtopic[]> {
  const results = await vectorIndex.query({
    data: query,
    topK: 5,
    filter: `subtopicId != '${currentSubtopicId}'`
  })
  return results.map(r => ({
    subtopicId: r.metadata?.subtopicId,
    subtopicName: r.metadata?.subtopicName,
    relevanceScore: r.score
  }))
}
```

---

## Part 7: Verification

```
□ Streaming response appears word-by-word in chat bubble
□ AI stays within subtopic content boundaries
□ AI Tutor unlocks assignment on first message sent
□ Rate limiting: 30 msg/hour per student per subtopic
□ Upstash Vector indexed when admin publishes content
□ Relevant content chunks included in system prompt
□ History (last 10 messages) included in each API call
□ Pre-generated Q&A pairs clickable and trigger streaming response
□ Response time < 2s for first token
□ Error handling: graceful fallback if Vector search fails
```

---

*Phase: T6 | Status: Ready*
