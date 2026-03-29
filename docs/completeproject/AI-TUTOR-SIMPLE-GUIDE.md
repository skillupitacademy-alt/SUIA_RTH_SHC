# AI Tutor Implementation - Simple Guide (No Gemini)
> Pre-defined Q&A pairs from database only
> Generated: 2026-03-28
> Implementation Time: 1-2 hours

---

## What We're Building

A drawer component that shows pre-written Q&A pairs from the `content.ai_tutor` block. No AI API, no costs, instant responses.

**Data Source**: `tutorial_content.content.ai_tutor.qa_pairs[]` (already in database)

---

## Implementation Steps

### Step 1: Update AiTutorDrawer Component

**File**: `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx`

**Current State**: Component exists but may not be fully implemented

**Replace with**:
```typescript
'use client';

import { useState } from 'react';
import type { DomainTheme } from '@/lib/domain-themes';
import type { AITutorContent } from '@quiz/types';

interface AiTutorDrawerProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  aiTutorContent: AITutorContent; // { greeting: string, qa_pairs: Array<{question, answer}> }
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
      {/* Floating Button */}
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
          fontSize: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          border: 'none',
          zIndex: 1000,
        }}
      >
        💬 Ask AI Tutor
      </button>
      
      {/* Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 420,
            maxWidth: '100vw',
            height: 600,
            maxHeight: '80vh',
            background: 'white',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            borderRadius: '16px 16px 0 0',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '1px solid #e5e5e5',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                AI Tutor
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>
                {subtopicName}
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#999',
                padding: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Greeting */}
            <div style={{ 
              padding: 12, 
              background: '#f0f9ff', 
              borderRadius: 8,
              marginBottom: 20,
              borderLeft: `4px solid ${theme.sidebarAccent}`,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#333' }}>
                {aiTutorContent.greeting}
              </p>
            </div>
            
            {/* Q&A Pairs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiTutorContent.qa_pairs.map((qa, index) => (
                <div key={index}>
                  {/* Question Button */}
                  <button
                    onClick={() => setSelectedQuestion(
                      selectedQuestion === index ? null : index
                    )}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 12,
                      background: selectedQuestion === index 
                        ? theme.sidebarAccent 
                        : '#f5f5f5',
                      color: selectedQuestion === index ? 'white' : '#333',
                      borderRadius: 8,
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ marginRight: 8 }}>
                      {selectedQuestion === index ? '▼' : '▶'}
                    </span>
                    {qa.question}
                  </button>
                  
                  {/* Answer */}
                  {selectedQuestion === index && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        background: '#f9f9f9',
                        borderRadius: 8,
                        borderLeft: `4px solid ${theme.sidebarAccent}`,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: '#333',
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

---

### Step 2: Update TutorialExperience Component

**File**: `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Find this line** (around line 150):
```typescript
<AiTutorDrawer
  subtopicId={subtopicId ?? params.subtopicSlug}
  subtopicName={subtopicName}
  theme={theme}
  greeting={content.ai_tutor.greeting}  // ❌ OLD
/>
```

**Replace with**:
```typescript
<AiTutorDrawer
  subtopicId={subtopicId ?? params.subtopicSlug}
  subtopicName={subtopicName}
  theme={theme}
  aiTutorContent={content.ai_tutor}  // ✅ NEW - Pass entire ai_tutor block
/>
```

---

### Step 3: Verify Types

**File**: `packages/types/src/tutorial-content.types.ts`

**Check that this type exists** (it should already):
```typescript
export interface TutorialContentJSON {
  // ... other blocks
  ai_tutor: {
    greeting: string;
    qa_pairs: Array<{ question: string; answer: string }>;
  };
}

export type AITutorContent = TutorialContentJSON['ai_tutor'];
```

**If `AITutorContent` type doesn't exist, add it**:
```typescript
export type AITutorContent = TutorialContentJSON['ai_tutor'];
```

---

## Testing Checklist

**Manual Testing**:
- [ ] Navigate to any subtopic page (e.g., `/learn/javascript/basics/promises/async-await`)
- [ ] Verify "💬 Ask AI Tutor" button appears in bottom-right corner
- [ ] Click button → Drawer opens from bottom-right
- [ ] Verify greeting displays correctly
- [ ] Click first question → Answer expands below
- [ ] Click second question → First answer collapses, second expands
- [ ] Click same question again → Answer collapses
- [ ] Click X button → Drawer closes
- [ ] Verify button still visible after closing

**Visual Testing**:
- [ ] Drawer doesn't overlap with other UI elements
- [ ] Text is readable (good contrast)
- [ ] Animations are smooth
- [ ] Works on mobile (drawer takes full width)
- [ ] Theme accent color applies correctly

**Edge Cases**:
- [ ] Subtopic with no Q&A pairs → Drawer shows greeting only
- [ ] Very long question text → Wraps properly
- [ ] Very long answer text → Scrollable within drawer

---

## Example Data

**What's in the database** (`tutorial_content.content.ai_tutor`):
```json
{
  "greeting": "Let us review how promises work in JavaScript.",
  "qa_pairs": [
    {
      "question": "What problem do promises solve?",
      "answer": "Promises let JavaScript handle future results without blocking the rest of the app."
    },
    {
      "question": "What is the difference between fulfilled and rejected?",
      "answer": "Fulfilled means the task finished successfully, while rejected means it failed."
    },
    {
      "question": "How does async and await help?",
      "answer": "They make promise-based code read like synchronous code while keeping the same async behavior."
    }
  ]
}
```

---

## Styling Notes

**Current Design System** (from your codebase):
- Font: Inter (body), Outfit (headings)
- Glassmorphism: `bg-white/70 backdrop-blur-[16px]`
- Border radius: `rounded-3xl` or `rounded-[2.5rem]`
- Accent color: `theme.sidebarAccent` (varies by domain)

**This component uses**:
- Inline styles (matches your existing pattern)
- Theme accent color for highlights
- Simple, clean design
- No external dependencies

---

## Future Enhancement (Optional)

**If you want to add Gemini later**:
1. Add a text input at the bottom of the drawer
2. Add "Ask Custom Question" button
3. Call `POST /api/tutorial/ai-tutor` endpoint
4. Display AI response below pre-defined Q&A

**But for now**: Pre-defined Q&A is sufficient and works perfectly! ✅

---

## Deployment

**No environment variables needed** ✅
**No database changes needed** ✅
**No API routes needed** ✅
**No external dependencies needed** ✅

Just update 2 files and you're done!

---

## Rollback

If issues occur:
1. Revert `AiTutorDrawer.tsx` to previous version
2. Revert `TutorialExperience.tsx` prop change
3. Component will gracefully fail (button won't show)

---

**END OF SIMPLE GUIDE**

**Total Implementation Time**: 1-2 hours
**Files to Change**: 2
**Complexity**: Low
**Cost**: $0
**User Experience**: Excellent ✨
