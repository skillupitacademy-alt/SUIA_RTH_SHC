# Content JSON Schema — Canonical Reference
## docs/reference/content-json-schema.md

> Status: LOCKED — Do not modify without ADR approval
> Used by: tutorial-service, packages/types, packages/content-generation,
>           AITutorBlock, all 6 block components, Zod validators

---

## Purpose

This is the **single source of truth** for the JSON structure stored in
`tutorial_content.content` (JSONB column in Tutorial DB).

Every system that reads or writes tutorial content MUST conform to this schema:
- AI generation prompts output this structure
- Zod validators enforce this structure on write
- TypeScript interfaces are derived from this structure
- React components receive typed slices of this structure as props

---

## The Canonical JSON Structure

```json
{
  "notes": {
    "markdown": "string — MDX/Markdown formatted reference notes"
  },

  "layman": {
    "simpleExplanation": "string — 150-250 words, plain English, zero jargon",
    "analogyOrStory": "string — 1 analogy OR 1 short story (40-60 words)",
    "example1": {
      "company": "string — real named entity e.g. Zomato, Netflix",
      "content": "string — 3-5 sentences showing concept in action"
    },
    "example2": {
      "company": "string — different company from example1",
      "content": "string — different industry angle from example1"
    }
  },

  "real_life": {
    "title": "string — scenario title e.g. 'Ordering Pizza Online'",
    "scenario": "string — narrative paragraph describing the scenario",
    "bullets": [
      {
        "label": "string — bold term e.g. 'Promise created'",
        "detail": "string — plain explanation e.g. 'Order confirmed immediately'"
      }
    ],
    "tip": "string — one actionable tip related to this block"
  },

  "technical": {
    "markdown": "string — formal definition paragraph",
    "bullets": [
      {
        "term": "string — technical term in bold",
        "detail": "string — precise definition with edge cases"
      }
    ],
    "tip": "string — gotcha or best practice tip"
  },

  "code": {
    "language": "string — 'javascript' | 'typescript' | 'python' | 'sql' | 'scala'",
    "intro": "string — one sentence introducing the code example",
    "code": "string — the actual code, properly indented",
    "steps": [
      "string — plain English explanation of each logical step"
    ]
  },

  "ai_tutor": {
    "greeting": "string — personalised opening message mentioning the subtopic",
    "qa_pairs": [
      {
        "question": "string — common beginner question about this subtopic",
        "answer": "string — clear, concise answer (2-4 sentences)"
      }
    ]
  }
}
```

---

## TypeScript Interface (packages/types/src/tutorial-content.types.ts)

```typescript
export interface TutorialContentJSON {
  notes: {
    markdown: string
  }
  layman: {
    simpleExplanation: string
    analogyOrStory: string
    example1: { company: string; content: string }
    example2: { company: string; content: string }
  }
  real_life: {
    title: string
    scenario: string
    bullets: Array<{ label: string; detail: string }>
    tip: string
  }
  technical: {
    markdown: string
    bullets: Array<{ term: string; detail: string }>
    tip: string
  }
  code: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash'
    intro: string
    code: string
    steps: string[]
  }
  ai_tutor: {
    greeting: string
    qa_pairs: Array<{ question: string; answer: string }>
  }
}

export type ContentBlockType = keyof TutorialContentJSON

export type LaymanContent = TutorialContentJSON['layman']
export type RealLifeContent = TutorialContentJSON['real_life']
export type TechnicalContent = TutorialContentJSON['technical']
export type CodeContent = TutorialContentJSON['code']
export type AITutorContent = TutorialContentJSON['ai_tutor']
export type NotesContent = TutorialContentJSON['notes']
```

---

## Zod Validation Schema (packages/content-generation/src/validators/schema.ts)

```typescript
import { z } from 'zod'

export const LaymanSchema = z.object({
  simpleExplanation: z.string().min(150).max(300),
  analogyOrStory: z.string().min(40).max(150),
  example1: z.object({
    company: z.string().min(2),
    content: z.string().min(50).max(400)
  }),
  example2: z.object({
    company: z.string().min(2),
    content: z.string().min(50).max(400)
  })
})

export const TutorialContentSchema = z.object({
  notes: z.object({ markdown: z.string().min(50) }),
  layman: LaymanSchema,
  real_life: z.object({
    title: z.string().min(5),
    scenario: z.string().min(80),
    bullets: z.array(z.object({
      label: z.string(),
      detail: z.string()
    })).min(2).max(6),
    tip: z.string().min(20)
  }),
  technical: z.object({
    markdown: z.string().min(100),
    bullets: z.array(z.object({
      term: z.string(),
      detail: z.string()
    })).min(2).max(8),
    tip: z.string().min(20)
  }),
  code: z.object({
    language: z.enum(['javascript','typescript','python','sql','scala','java','bash']),
    intro: z.string().min(20),
    code: z.string().min(30),
    steps: z.array(z.string()).min(2).max(10)
  }),
  ai_tutor: z.object({
    greeting: z.string().min(20),
    qa_pairs: z.array(z.object({
      question: z.string().min(10),
      answer: z.string().min(30)
    })).min(3).max(5)
  })
})

export type ValidatedTutorialContent = z.infer<typeof TutorialContentSchema>
```

---

## Quality Rules Per Block

| Block | Min Words | Max Words | Required Fields | Rejection Triggers |
|---|---|---|---|---|
| notes | 50 | 500 | markdown | empty markdown |
| layman | 150 | 300 | simpleExplanation, analogyOrStory, example1, example2 | < 150 words, missing analogy, < 2 examples |
| real_life | 80 | 400 | title, scenario, bullets (min 2), tip | < 2 bullets |
| technical | 100 | 600 | markdown, bullets (min 2), tip | missing tip |
| code | — | — | language, intro, code, steps (min 2) | invalid language, empty code |
| ai_tutor | — | — | greeting, qa_pairs (min 3) | < 3 Q&A pairs |

---

## Constraints

```
STORAGE:     JSONB column in tutorial_content.content
             Each subtopic stores ONE JSON object per difficulty tier
             difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert'

VERSIONING:  tutorial_content.version (INTEGER, increments on each admin edit)
             Old versions kept for audit trail — never deleted

HTML:        NEVER stored as primary source (JSON is source of truth)
             HTML is rendered on-the-fly by block components

LANGUAGES:   Domain-specific defaults (from domain_content_config):
             Full Stack   → javascript / typescript
             Data Analyst → sql / python
             Data Science → python
             Data Engineering → python / scala / sql
```

---

*Schema Version: 1.0 | LOCKED | Extends: TUTORIAL-ENGINE-BLUEPRINT.md*

---

## Prompt 19 Extension - Image Support

The canonical tutorial content model can be extended with an optional `image` field on 5 blocks:

- `notes`
- `layman`
- `real_life`
- `technical`
- `code`

The `ai_tutor` block remains image-free.

### ContentImage Interface

```typescript
export interface ContentImage {
  type: 'svg_standard' | 'r2_custom'
  svgKey: string | null
  url: string | null
  alt: string
  caption: string | null
  position: 'right' | 'bottom' | 'inline'
  width: number
}
```

### Updated TutorialContentJSON Shape

```typescript
export interface TutorialContentJSON {
  notes: {
    markdown: string
    image?: ContentImage
  }
  layman: {
    simpleExplanation: string
    analogyOrStory: string
    example1: { company: string; content: string }
    example2: { company: string; content: string }
    image?: ContentImage
  }
  real_life: {
    title: string
    scenario: string
    bullets: Array<{ label: string; detail: string }>
    tip: string
    image?: ContentImage
  }
  technical: {
    markdown: string
    bullets: Array<{ term: string; detail: string }>
    tip: string
    image?: ContentImage
  }
  code: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash'
    intro: string
    code: string
    steps: string[]
    image?: ContentImage
  }
  ai_tutor: {
    greeting: string
    qa_pairs: Array<{ question: string; answer: string }>
  }
}
```

### Validator Rules

- `svg_standard` must have `svgKey` set and `url` null
- `r2_custom` must have `url` set and `svgKey` null
- `url` must start with the trusted CDN base
- `alt` must be descriptive and non-empty
- `caption` is optional
- `position` must be one of `right`, `bottom`, or `inline`
- `width` must be a positive integer within the accepted UI bounds

### JSON Storage Note

The new image data is stored inside the existing JSONB content structure. The optional image field extends the payload; it does not replace the existing block content shape.
