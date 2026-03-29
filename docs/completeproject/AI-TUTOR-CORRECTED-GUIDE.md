# AI Tutor Implementation - CORRECTED GUIDE
> Based on actual TutorialContentJSON schema
> Generated: 2026-03-28

---

## Database Schema Analysis

**TutorialContentJSON Structure** (from `packages/types/src/tutorial-content.types.ts`):

```typescript
{
  notes: { markdown, image? },
  layman: { simpleExplanation, analogyOrStory, example1, example2, image? },
  real_life: { title, scenario, bullets[], tip, image? },
  technical: { markdown, bullets[], tip, image? },
  code: { language, intro, code, steps[], image? },
  ai_tutor: {
    greeting: string,
    qa_pairs: Array<{ question: string; answer: string }>
  }
}
```

**Key Finding**: The `ai_tutor` block is **pre-populated with Q&A pairs** in the database, NOT generated dynamically by Gemini.

---

## Corrected Implementation Approach

### Option 1: Use Pre-Defined Q&A Pairs (Simpler, Faster)

**What it means**: The AI Tutor shows pre-written Q&A pairs from the `content.ai_tutor.qa_pairs` array. No Gemini API needed.

**When to use**: If you want instant responses, no API costs, and controlled content quality.

**Implementation**:

#### Step 1: Frontend Component Only

**File**: `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx`

**Component Logic**:
```typescript
'use client';

import { useState } from 'react';
import type { DomainTheme } from '@/lib/domain-themes';
import type { AITutorContent } from '@quiz/types';

interface AiTutorDrawerProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  aiTutorContent: AITutorContent; // Pass from parent: content.ai_tutor
}

export function AiTutorDrawer({ 
  subtopicId, 
  subtopicName, 
  theme, 
  aiTutorContent 
}: AiTutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 24px',
          background: theme.sidebarAccent,
          color: 'white',
          borderRadius: 999,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        Ask AI Tutor
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 400,
            height: 600,
            background: 'white',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            borderRadius: '16px 16px 0 0',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>AI Tutor</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <p style={{ color: '#666', marginBottom: 16 }}>
              {aiTutorContent.greeting}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiTutorContent.qa_pairs.map((qa, index) => (
                <div key={index}>
                  <button
                    onClick={() => setSelectedQuestion(index)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 12,
                      background: selectedQuestion === index ? theme.sidebarAccent : '#f5f5f5',
                      color: selectedQuestion === index ? 'white' : '#333',
                      borderRadius: 8,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {qa.question}
                  </button>
                  
                  {selectedQuestion === index && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        background: '#f9f9f9',
                        borderRadius: 8,
                        borderLeft: `4px solid ${theme.sidebarAccent}`,
                      }}
                    >
                      {qa.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

#### Step 2: Update TutorialExperience Component

**File**: `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Change**:
```typescript
// Before
<AiTutorDrawer
  subtopicId={subtopicId ?? params.subtopicSlug}
  subtopicName={subtopicName}
  theme={theme}
  greeting={content.ai_tutor.greeting}
/>

// After
<AiTutorDrawer
  subtopicId={subtopicId ?? params.subtopicSlug}
  subtopicName={subtopicName}
  theme={theme}
  aiTutorContent={content.ai_tutor}  // Pass entire ai_tutor block
/>
```

**Pros**:
- ✅ No API costs
- ✅ Instant responses
- ✅ Controlled content quality
- ✅ Works offline
- ✅ No rate limiting needed

**Cons**:
- ❌ Limited to pre-defined questions
- ❌ No conversational AI
- ❌ Cannot answer custom student questions

---

### Option 2: Hybrid Approach (Pre-Defined + Gemini Fallback)

**What it means**: Show pre-defined Q&A pairs first, but allow students to ask custom questions via Gemini.

**When to use**: Best of both worlds - instant answers for common questions, AI for custom queries.

**Implementation**:

#### Step 1: Frontend Component with Custom Question Input

**File**: `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx`

```typescript
'use client';

import { useState } from 'react';
import type { DomainTheme } from '@/lib/domain-themes';
import type { AITutorContent } from '@quiz/types';

interface AiTutorDrawerProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  aiTutorContent: AITutorContent;
}

export function AiTutorDrawer({ 
  subtopicId, 
  subtopicName, 
  theme, 
  aiTutorContent 
}: AiTutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    
    setLoading(true);
    setCustomAnswer('');
    setSelectedQuestion(null);
    
    try {
      const response = await fetch('/api/tutorial/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId, question: customQuestion }),
      });
      
      const data = await response.json();
      setCustomAnswer(data.data.answer);
    } catch (error) {
      setCustomAnswer('Sorry, I couldn\'t process your question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 24px',
          background: theme.sidebarAccent,
          color: 'white',
          borderRadius: 999,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        Ask AI Tutor
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 400,
            height: 600,
            background: 'white',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            borderRadius: '16px 16px 0 0',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>AI Tutor</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
            <p style={{ color: '#666', marginBottom: 16 }}>
              {aiTutorContent.greeting}
            </p>
            
            {/* Pre-defined Q&A Pairs */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Common Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiTutorContent.qa_pairs.map((qa, index) => (
                  <div key={index}>
                    <button
                      onClick={() => {
                        setSelectedQuestion(index);
                        setCustomAnswer('');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 12,
                        background: selectedQuestion === index ? theme.sidebarAccent : '#f5f5f5',
                        color: selectedQuestion === index ? 'white' : '#333',
                        borderRadius: 8,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {qa.question}
                    </button>
                    
                    {selectedQuestion === index && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 12,
                          background: '#f9f9f9',
                          borderRadius: 8,
                          borderLeft: `4px solid ${theme.sidebarAccent}`,
                        }}
                      >
                        {qa.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Answer Display */}
            {customAnswer && (
              <div
                style={{
                  padding: 12,
                  background: '#f0f9ff',
                  borderRadius: 8,
                  borderLeft: `4px solid ${theme.sidebarAccent}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.sidebarAccent, marginBottom: 8 }}>
                  AI Response:
                </div>
                {customAnswer}
              </div>
            )}
          </div>
          
          {/* Custom Question Input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Ask Your Own Question
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                placeholder="Type your question..."
                style={{ 
                  flex: 1, 
                  padding: 8, 
                  border: '1px solid #ddd', 
                  borderRadius: 8 
                }}
              />
              <button
                onClick={handleCustomQuestion}
                disabled={loading || !customQuestion.trim()}
                style={{
                  padding: '8px 16px',
                  background: theme.sidebarAccent,
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  opacity: (loading || !customQuestion.trim()) ? 0.5 : 1,
                  cursor: (loading || !customQuestion.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '...' : 'Ask'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```


#### Step 2: Create AI Tutor Service (for Custom Questions)

**File**: `apps/api-server/src/modules/tutorial/ai-tutor.service.ts`

**Class Name**: `AiTutorService`

**Purpose**: Answer custom questions using ALL 6 content blocks as context

**Implementation**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentJSON } from '@quiz/types';

export class AiTutorService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  async generateAnswer(input: { 
    subtopicId: string; 
    question: string; 
    userId: string;
  }): Promise<{ answer: string; citations: string[] }> {
    // 1. Fetch subtopic content
    const repository = new TutorialContentRepository();
    const contentRecords = await repository.getPublished(input.subtopicId, 'simple');
    
    if (contentRecords.length === 0) {
      return {
        answer: 'I don\'t have content for this subtopic yet. Please check back later.',
        citations: [],
      };
    }
    
    const content = contentRecords[0].content as TutorialContentJSON;
    
    // 2. Build comprehensive context from ALL 6 blocks
    const contextPrompt = this.buildContextPrompt(content, input.question);
    
    // 3. Call Gemini Flash
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const answer = response.text();
    
    return {
      answer,
      citations: [
        'Lesson Notes',
        'Technical Documentation',
        'Real-world Examples',
        'Code Examples',
      ],
    };
  }
  
  private buildContextPrompt(content: TutorialContentJSON, question: string): string {
    return `
You are an AI tutor helping a student learn programming concepts. Answer the student's question based ONLY on the lesson content provided below.

# LESSON CONTENT

## 1. Notes (Core Concept)
${content.notes.markdown}

## 2. Simple Explanation (Layman's Terms)
${content.layman.simpleExplanation}

**Analogy**: ${content.layman.analogyOrStory}

**Real-world Example 1 (${content.layman.example1.company})**:
${content.layman.example1.content}

**Real-world Example 2 (${content.layman.example2.company})**:
${content.layman.example2.content}

## 3. Real-Life Application
**Title**: ${content.real_life.title}
**Scenario**: ${content.real_life.scenario}

**Key Points**:
${content.real_life.bullets.map(b => `- ${b.label}: ${b.detail}`).join('\n')}

**Tip**: ${content.real_life.tip}

## 4. Technical Details
${content.technical.markdown}

**Key Terms**:
${content.technical.bullets.map(b => `- **${b.term}**: ${b.detail}`).join('\n')}

**Technical Tip**: ${content.technical.tip}

## 5. Code Example (${content.code.language})
**Introduction**: ${content.code.intro}

\`\`\`${content.code.language}
${content.code.code}
\`\`\`

**Step-by-step**:
${content.code.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 6. Pre-answered Questions
${content.ai_tutor.qa_pairs.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}

---

# STUDENT'S QUESTION
${question}

# INSTRUCTIONS
1. Answer the question clearly and concisely
2. Use information from the lesson content above
3. If the question is already answered in the "Pre-answered Questions" section, refer to that answer
4. If the question is outside the lesson scope, politely redirect: "This question is outside the current lesson. Please refer to the lesson material on [topic]."
5. Use examples from the lesson when helpful
6. Keep the answer under 200 words
7. Use a friendly, encouraging tone

# YOUR ANSWER
    `.trim();
  }
}
```

#### Step 3: Create API Route

**File**: `apps/api-server/src/app/api/tutorial/ai-tutor/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AiTutorService } from '@/modules/tutorial/ai-tutor.service';
import { z } from 'zod';

const requestSchema = z.object({
  subtopicId: z.string().uuid(),
  question: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ 
      error: 'Invalid input', 
      details: parsed.error.errors 
    }, { status: 400 });
  }
  
  try {
    const service = new AiTutorService();
    const result = await service.generateAnswer({
      ...parsed.data,
      userId,
    });
    
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ 
        error: 'AI service not configured' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'AI service unavailable',
      details: errorMessage,
    }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

#### Step 4: Install Dependencies

```bash
cd apps/api-server
pnpm add @google/generative-ai
```

#### Step 5: Add Environment Variable

**File**: `apps/api-server/.env.local`

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get API Key**: https://aistudio.google.com/app/apikey

**Add to GCP Secret Manager**:
```bash
echo -n "your_gemini_key" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

---

### Option 3: Full Conversational AI (Advanced)

**What it means**: Multi-turn conversation with context memory, like ChatGPT.

**When to use**: If you want a full chatbot experience with conversation history.

**Additional Requirements**:
- Store conversation history in database
- Implement context window management
- Add rate limiting per user
- Handle multi-turn context

**Database Schema Needed**:
```sql
CREATE TABLE ai_tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtopic_id UUID NOT NULL,
  messages JSONB NOT NULL, -- Array of {role: 'user'|'assistant', content: string}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_tutor_user_subtopic 
  ON ai_tutor_conversations(user_id, subtopic_id);
```

**Note**: This is significantly more complex. Recommend starting with Option 2 (Hybrid).

---

## Recommendation

**Start with Option 2 (Hybrid Approach)**:

✅ **Pros**:
- Instant answers for common questions (no API cost)
- AI fallback for custom questions
- Best user experience
- Controlled content quality for common questions
- Flexibility for edge cases

✅ **Implementation Effort**: Medium (2-3 days)

✅ **Cost**: Low (only pay for custom questions, not pre-defined ones)

---

## Testing Checklist

**Pre-defined Q&A**:
- [ ] Click on each pre-defined question → Verify answer displays
- [ ] Select different questions → Verify only one answer shows at a time
- [ ] Verify greeting displays correctly

**Custom Questions (if implementing Option 2)**:
- [ ] Ask question from lesson content → Verify relevant answer
- [ ] Ask question outside lesson scope → Verify polite redirect
- [ ] Ask empty question → Verify button disabled
- [ ] Ask very long question (>500 chars) → Verify validation error
- [ ] Test without `x-user-id` header → Verify 401 error
- [ ] Test with invalid subtopicId → Verify graceful error

**Performance**:
- [ ] Pre-defined answers load instantly
- [ ] Custom questions respond within 3-5 seconds
- [ ] Drawer opens/closes smoothly
- [ ] No memory leaks on repeated use

---

## Cost Estimation (Option 2)

**Gemini Flash Pricing** (as of 2024):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Assumptions**:
- Average context: ~2,000 tokens (all 6 content blocks)
- Average question: ~50 tokens
- Average answer: ~200 tokens
- Total per request: ~2,250 tokens

**Cost per 1,000 custom questions**:
- Input cost: (2,050 tokens × 1,000) × $0.075 / 1M = $0.15
- Output cost: (200 tokens × 1,000) × $0.30 / 1M = $0.06
- **Total: $0.21 per 1,000 custom questions**

**If 10% of students ask 1 custom question per subtopic**:
- 10,000 students × 10% × 1 question = 1,000 questions
- **Cost: $0.21 per 10,000 students**

**Conclusion**: Extremely affordable! 🎉

---

## Summary

**Corrected Understanding**:
- ✅ `ai_tutor` block is **pre-populated** in database
- ✅ Contains `greeting` + `qa_pairs[]` array
- ✅ NOT dynamically generated by AI
- ✅ Gemini is OPTIONAL for custom questions only

**Recommended Implementation**:
1. Start with Option 1 (pre-defined Q&A only) — 1 day
2. Add Option 2 (Gemini for custom questions) — 2 days
3. Consider Option 3 (full conversational) — only if needed (5+ days)

**Files to Update**:
- `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx` — Frontend component
- `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx` — Pass `aiTutorContent` prop
- `apps/api-server/src/modules/tutorial/ai-tutor.service.ts` — Gemini service (Option 2 only)
- `apps/api-server/src/app/api/tutorial/ai-tutor/route.ts` — API route (Option 2 only)

**No Database Changes Needed** — Schema already supports this! ✅

---

**END OF CORRECTED GUIDE**
