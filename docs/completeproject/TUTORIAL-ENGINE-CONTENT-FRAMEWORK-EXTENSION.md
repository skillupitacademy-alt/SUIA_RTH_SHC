# Tutorial Engine — Content Generation Framework Integration
## Extension to TUTORIAL-ENGINE-BLUEPRINT.md

> Status: FINALIZED | Extends: TUTORIAL-ENGINE-BLUEPRINT.md v1.0
> This document ADDS to the existing blueprint — does not replace it.

---

## PART 0: Gap Analysis — What's New vs What Already Existed

### ✅ Confirmed (already in Blueprint v1.0, now locked with more detail)
- 6 Content Block System (mandatory, all 6 before publish)
- Domain → Subject → Topic → Subtopic hierarchy
- 4 difficulty tiers (Simple, Mixed, Intermediate, Expert)
- AI Tutor as 6th block
- Content pipeline: create → generate → review → publish → index

### 🆕 NEW — Not in Blueprint v1.0 (added by this framework)
1. **Layman Block is the MOST IMPORTANT block** — mandatory first, strict quality rules
2. **Enforced learning flow order** — Layman → Real-Life → Technical → Code → AI Tutor → Assignment
3. **Domain-specific content strategy** — same structure, different style per domain (Full Stack / Data Analyst / Data Science / Data Engineering)
4. **AI content generation pipeline** — AI generates all 6 blocks from input params, human reviews, then publishes
5. **Layman block rejection rules** — hard quality gates (<150 words = reject, no analogy = reject, etc.)
6. **Content UI/UX rules per block** — card-based design, icons mandatory, soft gradient backgrounds
7. **AI prompt templates** — structured prompts per content block type
8. **Difficulty-based content variation** — each difficulty level generates different depth of content

### ⚠️ CONFLICTS TO RESOLVE (framework vs blueprint)
- Blueprint says "Admin creates content manually via rich MDX editor"
- Framework says "AI generates 6 blocks → human review → publish"
- **Resolution**: AI generation is PRIMARY path, manual editor is FALLBACK/EDIT path
  Both must exist. AI generates draft, admin reviews and edits, then publishes.

---

## PART 1: Layman Block — Extended Specification

This is the most important addition from your framework.
The blueprint treated all 6 blocks equally. This framework correctly elevates Layman as the entry point.

### 1.1 — Mandatory Structure (LOCKED)

```
Every Layman Block MUST follow this exact structure:

Section 1: Simple Explanation (150–250 words total minimum)
  - Plain English only
  - Zero technical jargon
  - One clear central idea per paragraph

Section 2: Analogy / Story
  - 1 analogy OR 1 short story (not both — pick the better one)
  - Must be relatable to the target domain's audience
  - Full Stack audience: analogies from everyday app usage
  - Data audience: analogies from business decisions / news

Section 3: Example 1 (concrete, specific)
  - Real named entity preferred (Zomato, Netflix, Amazon)
  - Shows the concept in action
  - 3–5 sentences

Section 4: Example 2 (different angle)
  - Different industry or context from Example 1
  - Shows concept is not limited to one use case
  - 3–5 sentences
```

### 1.2 — Quality Gate Rules (AUTOMATED — AI checks before allowing publish)

```typescript
interface LaymanQualityCheck {
  minimumWordCount: 150;         // Hard reject if below
  maximumWordCount: 250;         // Warn if above (may lose beginner)
  requiredExampleCount: 2;       // Hard reject if below
  requiresAnalogyOrStory: true;  // Hard reject if missing
  forbiddenTerms: string[];      // domain-specific jargon list
  readabilityScore: 'grade_8_or_below'; // Flesch-Kincaid target
}

// Rejection triggers (block cannot be published):
const LAYMAN_REJECTION_RULES = [
  'word_count < 150',
  'example_count < 2',
  'no_analogy_or_story_found',
  'technical_jargon_density > 0.05',  // >5% of words are jargon
  'readability_grade > 8',
];
```

### 1.3 — UI/UX Specification for Layman Block

```
Component: LaymanBlock.tsx

Layout: Card-based, soft gradient background
┌─────────────────────────────────────────────────┐
│  💡  Simple Explanation                          │
│  ─────────────────────────────────────────────  │
│  [Plain text paragraph, larger font, generous   │
│   line spacing, no code, no jargon]             │
├─────────────────────────────────────────────────┤
│  📦  Analogy / Story                            │
│  ─────────────────────────────────────────────  │
│  [Italicized or blockquote style, slightly      │
│   indented, storytelling tone]                  │
├─────────────────────────────────────────────────┤
│  📊  Example 1: [Named Entity]                  │
│  ─────────────────────────────────────────────  │
│  [Card within card — soft border, icon for      │
│   the industry/company]                         │
├─────────────────────────────────────────────────┤
│  📊  Example 2: [Named Entity]                  │
│  ─────────────────────────────────────────────  │
│  [Same card treatment as Example 1]             │
└─────────────────────────────────────────────────┘

Visual Rules:
  - Font size: 1–2px larger than Technical block
  - Line height: 1.8 (more generous than other blocks)
  - Background: soft gradient (e.g., blue-50 to indigo-50)
  - Icons: mandatory per section (💡 📦 📊)
  - Rounded corners: lg (16px)
  - Shadow: sm
  - No code blocks in this section — ever
```

---

## PART 2: Enforced Learning Flow

### 2.1 — The Mandatory Navigation Order

```
ENFORCED SEQUENCE (cannot skip forward):

[1] Layman        → ALWAYS first. Unlocked by default.
[2] Real-Life     → Unlocked after Layman marked "read"
[3] Technical     → Unlocked after Real-Life marked "read"
[4] Code          → Unlocked after Technical marked "read"
[5] AI Tutor      → Unlocked after Code marked "read"
[6] Assignment    → Unlocked after AI Tutor interaction (min 1 message)

❗ RULE: Student CANNOT start Assignment without completing
         the full learning flow (all 5 content blocks + 1 AI Tutor msg)

EXCEPTION: Students who score ≥80% on Simple assignment
           can skip flow for same subtopic at higher difficulty tiers.
           (They've proven they already know it.)
```

### 2.2 — Progress Tracking Per Flow Step

```typescript
// In tutorial_progress table — extend existing schema:
interface SubtopicFlowProgress {
  userId: string;
  subtopicId: string;
  laymanReadAt: Date | null;
  realLifeReadAt: Date | null;
  technicalReadAt: Date | null;
  codeReadAt: Date | null;
  aiTutorFirstMessageAt: Date | null;  // ← new field
  assignmentUnlockedAt: Date | null;
  currentFlowStep: 1 | 2 | 3 | 4 | 5 | 6;
  flowCompletedAt: Date | null;
}
```

### 2.3 — ContentTabs.tsx Update (UI Change from Blueprint)

```
BEFORE (Blueprint v1.0): All 6 tabs visible, student can click any tab

AFTER (This framework): Tabs show lock/unlock state
┌──────────────────────────────────────────────────────┐
│ [💡 Layman ✅] [🌍 Real-Life 🔒] [⚙️ Tech 🔒] ...  │
│                                                      │
│  Current: Layman Explanation                         │
│  ─────────────────────────────────────────────────   │
│  [Content]                                           │
│                                                      │
│  [Mark as Read → Unlock Real-Life Scenario]          │
└──────────────────────────────────────────────────────┘

Lock states:
  ✅ completed
  👁️ current (active, reading now)
  🔒 locked (not yet unlocked)
```

---

## PART 3: Domain-Specific Content Strategy

### 3.1 — The Four Domains (CONFIRMED FROM YOUR FRAMEWORK)

Your platform covers these 4 domains initially:

```
1. Full Stack Development
2. Data Analyst
3. Data Science
4. Data Engineering
```

### 3.2 — Content Style Matrix Per Domain

This is the most important addition for your AI generation pipeline.
The same subtopic name gets DIFFERENT content depending on its domain.

```
EXAMPLE: Subtopic = "Caching"

┌─────────────────┬──────────────────────────────────────────────┐
│ FULL STACK      │ Layman: "Like browser remembering your login" │
│                 │ Real-Life: User loads same page twice         │
│                 │ Technical: Redis, CDN, browser cache          │
│                 │ Code: React Query, Next.js unstable_cache     │
│                 │ AI Tutor: "Why is my cache stale?"            │
├─────────────────┼──────────────────────────────────────────────┤
│ DATA ANALYST    │ Layman: "Like a shortcut in Excel"            │
│                 │ Real-Life: Dashboard loads slowly without it  │
│                 │ Technical: Materialized views, query cache    │
│                 │ Code: SQL materialized views, pandas cache    │
│                 │ AI Tutor: "When should I use a view?"         │
├─────────────────┼──────────────────────────────────────────────┤
│ DATA SCIENCE    │ Layman: "Like remembering past calculations"  │
│                 │ Real-Life: Model predictions stored           │
│                 │ Technical: Feature stores, model caching      │
│                 │ Code: joblib, pickle, feature store patterns  │
│                 │ AI Tutor: "Should I cache model outputs?"     │
├─────────────────┼──────────────────────────────────────────────┤
│ DATA ENGINEERING│ Layman: "Like a warehouse receiving dock"     │
│                 │ Real-Life: Uber surge pricing pipeline        │
│                 │ Technical: Redis Streams, Spark caching       │
│                 │ Code: PySpark persist(), Kafka consumer cache │
│                 │ AI Tutor: "My pipeline is slow — why?"        │
└─────────────────┴──────────────────────────────────────────────┘
```

### 3.3 — Domain Style Configuration (New DB Table)

```sql
-- New table to store domain-specific generation rules
CREATE TABLE domain_content_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id),

  -- Audience profile (used in AI prompts)
  audience_profile TEXT NOT NULL,
  -- e.g. "Junior developer building web apps"
  -- e.g. "Business analyst interpreting sales data"

  -- Style rules per content block
  layman_style JSONB NOT NULL,
  -- { tone: "conversational", analogySource: "everyday_apps",
  --   exampleCompanies: ["Zomato", "Swiggy", "Amazon"] }

  real_life_style JSONB NOT NULL,
  -- { focus: "user_interactions", scenarioType: "app_feature_build" }

  technical_style JSONB NOT NULL,
  -- { depth: "implementation", includePerformance: true }

  code_style JSONB NOT NULL,
  -- { languages: ["TypeScript", "JavaScript"],
  --   frameworks: ["React", "Next.js", "Node.js"],
  --   showMultipleVariations: true }

  ai_tutor_focus TEXT NOT NULL,
  -- "debugging", "insights", "concept_clarity", "system_troubleshooting"

  forbidden_jargon TEXT[] NOT NULL,
  -- terms that must NOT appear in layman block for this domain

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 — Domain Config Seed Data

```typescript
const DOMAIN_CONFIGS = {
  fullStack: {
    audienceProfile: "Junior to mid-level developer building web applications",
    laymanStyle: {
      tone: "conversational",
      analogySource: "everyday_app_usage",
      exampleCompanies: ["Zomato", "Swiggy", "Netflix", "Instagram", "WhatsApp"]
    },
    realLifeStyle: {
      focus: "user_interactions",
      scenarioType: "app_feature_build"
    },
    technicalStyle: {
      depth: "implementation",
      includePerformance: true,
      includeAccessibility: false
    },
    codeStyle: {
      languages: ["TypeScript", "JavaScript"],
      frameworks: ["React", "Next.js", "Node.js", "Hono"],
      showMultipleVariations: true
    },
    aiTutorFocus: "debugging_and_implementation",
    forbiddenJargon: ["eigenvalue", "gradient descent", "ETL", "data lakehouse"]
  },

  dataAnalyst: {
    audienceProfile: "Business analyst or data analyst interpreting business data",
    laymanStyle: {
      tone: "business_friendly",
      analogySource: "business_decisions_and_reports",
      exampleCompanies: ["Flipkart", "HDFC", "BigBasket", "Swiggy Business"]
    },
    realLifeStyle: {
      focus: "dashboards_and_reporting",
      scenarioType: "business_insight_discovery"
    },
    codeStyle: {
      languages: ["SQL", "Python"],
      tools: ["Excel", "Power BI", "Tableau", "pandas"],
      showMultipleVariations: false
    },
    aiTutorFocus: "business_insights_and_sql_optimization",
    forbiddenJargon: ["backpropagation", "Docker", "microservices", "ETL pipeline"]
  },

  dataScience: {
    audienceProfile: "Aspiring data scientist learning ML models and algorithms",
    laymanStyle: {
      tone: "intuition_first",
      analogySource: "predictions_and_patterns",
      exampleCompanies: ["Netflix recommendations", "Spotify", "Google Maps ETA"]
    },
    codeStyle: {
      languages: ["Python"],
      frameworks: ["scikit-learn", "TensorFlow", "PyTorch", "pandas", "numpy"],
      showMathIntuition: true
    },
    aiTutorFocus: "concept_clarity_and_algorithm_choice",
    forbiddenJargon: ["Docker Compose", "REST API", "React", "SQL JOIN"]
  },

  dataEngineering: {
    audienceProfile: "Engineer building data pipelines and infrastructure",
    laymanStyle: {
      tone: "systems_thinking",
      analogySource: "logistics_and_supply_chain",
      exampleCompanies: ["Uber", "Netflix", "Airbnb", "LinkedIn data platform"]
    },
    codeStyle: {
      languages: ["Python", "SQL", "Scala"],
      tools: ["Apache Spark", "Kafka", "Airflow", "dbt", "Flink"],
      showMultipleVariations: true
    },
    aiTutorFocus: "system_design_and_troubleshooting",
    forbiddenJargon: ["React", "CSS", "gradient descent", "A/B test UI"]
  }
};
```

---

## PART 4: AI Content Generation Pipeline

### 4.1 — The Full Pipeline (Extended from Framework)

```
TRIGGER: Admin creates subtopic record in DB
              ↓
STEP 1: QStash Job → content-generation-worker
              ↓
STEP 2: Fetch domain_content_config for this domain
              ↓
STEP 3: Call Claude API with structured prompt per block type
        (6 parallel API calls — one per block)
              ↓
STEP 4: Validate each block against quality rules
        Layman: word count + example count + analogy check
        Code: syntax validation, language match
              ↓
STEP 5: Save all 6 blocks as DRAFT (is_published = false)
              ↓
STEP 6: Notify admin: "Content ready for review"
              ↓
STEP 7: Admin reviews in content editor
        → Approve as-is → publish
        → Edit and approve → publish
        → Reject → re-generate with feedback
              ↓
STEP 8: On publish → QStash → embed in Upstash Vector
              ↓
STEP 9: AI Tutor now has full context for this subtopic
```

### 4.2 — AI Prompt Templates Per Block Type

```typescript
// packages/content-generation/src/prompts/

// ── LAYMAN PROMPT ──────────────────────────────────────────
export function buildLaymanPrompt(input: ContentGenerationInput): string {
  return `
You are creating a Layman Explanation for a learning platform.

DOMAIN: ${input.domain} (${input.domainConfig.audienceProfile})
SUBJECT: ${input.subject}
TOPIC: ${input.topic}
SUBTOPIC: ${input.subtopic}
DIFFICULTY: ${input.difficulty}

MANDATORY STRUCTURE (follow exactly):
1. Simple Explanation (80–120 words)
   - Plain English only
   - No jargon from this list: ${input.domainConfig.forbiddenJargon.join(', ')}
   - One central idea only

2. Analogy or Story (40–60 words)
   - Style: ${input.domainConfig.laymanStyle.tone}
   - Use relatable comparison to: ${input.domainConfig.laymanStyle.analogySource}

3. Example 1 (40–60 words)
   - Use a real company: ${input.domainConfig.laymanStyle.exampleCompanies[0]}
   - Show the concept in action in their context

4. Example 2 (40–60 words)
   - Use a different company: ${input.domainConfig.laymanStyle.exampleCompanies[1]}
   - Different industry angle from Example 1

QUALITY RULES:
- Total minimum: 150 words, maximum: 250 words
- NEVER start with "In this subtopic" or "Today we will learn"
- NEVER use passive voice
- MUST feel like a friendly senior explaining to a complete beginner

OUTPUT FORMAT: JSON
{
  "simpleExplanation": "...",
  "analogyOrStory": "...",
  "example1": { "company": "...", "content": "..." },
  "example2": { "company": "...", "content": "..." }
}
`;
}

// ── TECHNICAL PROMPT ───────────────────────────────────────
export function buildTechnicalPrompt(input: ContentGenerationInput): string {
  return `
You are creating a Technical Explanation for ${input.domainConfig.audienceProfile}.

SUBTOPIC: ${input.subtopic} (${input.domain} → ${input.subject} → ${input.topic})
DIFFICULTY: ${input.difficulty}
DEPTH LEVEL: ${input.domainConfig.technicalStyle.depth}

Include:
- Formal definition
- How it works internally
- Key properties / constraints
- When to use / when NOT to use
- Performance considerations: ${input.domainConfig.technicalStyle.includePerformance}
- Edge cases and gotchas
- Relationship to adjacent concepts

Style: Precise, formal, expert-to-expert tone
Length: 200–400 words depending on complexity

OUTPUT FORMAT: Markdown
`;
}

// ── CODE EXPLANATION PROMPT ────────────────────────────────
export function buildCodePrompt(input: ContentGenerationInput): string {
  return `
You are creating a Code Explanation for ${input.subtopic}.

LANGUAGES: ${input.domainConfig.codeStyle.languages.join(', ')}
FRAMEWORKS: ${input.domainConfig.codeStyle.frameworks?.join(', ') || 'standard library only'}
DIFFICULTY: ${input.difficulty}
SHOW MULTIPLE VARIATIONS: ${input.domainConfig.codeStyle.showMultipleVariations}

Structure:
1. Minimal working example (simplest possible)
2. Annotated version (every line explained as a comment)
3. ${input.difficulty === 'expert' ? 'Production-grade version with error handling' : 'Common variation'}
4. What NOT to do (anti-pattern with explanation)

Rules:
- Every non-obvious line MUST have a comment
- Start from scratch — assume reader knows only basics
- For ${input.domain}: focus on ${input.domainConfig.aiTutorFocus}

OUTPUT FORMAT: Markdown with fenced code blocks and language tags
`;
}

// ── AI TUTOR CONTEXT PROMPT ────────────────────────────────
export function buildAITutorContextPrompt(input: ContentGenerationInput,
                                          allBlocks: GeneratedBlocks): string {
  return `
You are an AI Tutor specialized in ${input.domain} for ${input.domainConfig.audienceProfile}.

The student has just finished studying this subtopic: "${input.subtopic}"
They have read: Notes, Layman Explanation, Real-Life Scenario, Technical Explanation, Code Explanation.

YOUR CONTEXT (use this to answer questions):
NOTES: ${allBlocks.notes}
LAYMAN: ${allBlocks.layman}
TECHNICAL: ${allBlocks.technical}
CODE: ${allBlocks.code}

YOUR PERSONALITY:
- Focus: ${input.domainConfig.aiTutorFocus}
- Tone: Encouraging, patient, Socratic (ask questions back)
- Never give full answers immediately — guide with hints first
- If student seems confused, go back to the layman analogy
- Relate everything back to the real-life examples they've seen

FORBIDDEN:
- Never introduce new subtopics not in the context above
- Never contradict the technical explanation
- Never be discouraging about wrong answers
`;
}
```

### 4.3 — New Service: ContentGenerationService

```typescript
// services/tutorial-service/src/modules/content-generation/

class ContentGenerationService {

  // Main entry point — called when admin creates subtopic
  async generateAllBlocks(subtopicId: string): Promise<GenerationJob>

  // Generates one specific block (for re-generation)
  async regenerateBlock(
    subtopicId: string,
    blockType: ContentBlockType,
    adminFeedback?: string  // "Make the examples more India-focused"
  ): Promise<ContentBlock>

  // Validates layman block against quality rules
  async validateLaymanBlock(content: LaymanContent): Promise<ValidationResult>

  // Called after all blocks approved — indexes for AI Tutor
  async indexForAITutor(subtopicId: string): Promise<void>

  // Admin requests re-generation with feedback
  async requestRegeneration(
    subtopicId: string,
    blockType: ContentBlockType,
    feedback: string
  ): Promise<void>  // Queues QStash job
}
```

### 4.4 — Generation Job Status Tracking (New DB Table)

```sql
CREATE TABLE content_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL REFERENCES subtopics(id),
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'generating', 'validation_failed',
    'draft_ready', 'admin_review', 'approved', 'published', 'failed'
  )),
  blocks_generated JSONB,     -- which blocks are done
  validation_errors JSONB,    -- per-block validation failures
  admin_feedback JSONB,       -- feedback per block for re-generation
  generation_model TEXT,      -- which AI model was used
  total_tokens_used INTEGER,
  generation_cost_usd DECIMAL(10,6),
  triggered_by UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## PART 5: Difficulty-Based Content Variation

### 5.1 — How Difficulty Changes Content Generation

Same subtopic, 4 different content depths:

```
SUBTOPIC: "React useEffect Hook"

SIMPLE difficulty:
  Notes:     What useEffect is, basic syntax
  Layman:    "Like a to-do list that runs when something changes"
  Technical: Basic lifecycle, dependency array basics
  Code:      Simple fetch on mount example (20 lines)
  Assignment: 3–5 questions, direct recall

MIXED difficulty:
  Notes:     useEffect patterns, cleanup functions
  Layman:    "Like a subscription that cleans up after itself"
  Technical: Stale closures, dependency array pitfalls
  Code:      Cleanup + multiple dependencies example (40 lines)
  Assignment: 6–10 questions, applied scenarios

INTERMEDIATE difficulty:
  Notes:     Race conditions, abort controllers, custom hooks
  Layman:    "Like cancelling a pizza order before it's made"
  Technical: Memory leaks, performance optimization, useLayoutEffect
  Code:      AbortController + custom useAsync hook (80 lines)
  Assignment: 8–12 questions, multi-step problems

EXPERT difficulty:
  Notes:     Production patterns, concurrent mode, server components
  Layman:    "Like a self-managing worker that knows when to stop"
  Technical: React internals, fiber reconciler interaction
  Code:      Production-grade data fetching library (150+ lines)
  Assignment: 12–20 questions, open-ended system design
```

### 5.2 — Difficulty Param in Generation Input

```typescript
interface ContentGenerationInput {
  domain: string;
  domainId: string;
  subject: string;
  subjectId: string;
  topic: string;
  topicId: string;
  subtopic: string;
  subtopicId: string;
  difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert';
  domainConfig: DomainContentConfig;  // from domain_content_config table
  targetAudience: string;             // from domainConfig.audienceProfile
}
```

---

## PART 6: Updated Database Schema Extensions

### 6.1 — Updates to tutorial_content Table

```sql
-- Extend existing tutorial_content table:
ALTER TABLE tutorial_content
  ADD COLUMN generation_job_id UUID REFERENCES content_generation_jobs(id),
  ADD COLUMN generated_by_ai BOOLEAN DEFAULT false,
  ADD COLUMN ai_model_used TEXT,
  ADD COLUMN admin_approved_by UUID REFERENCES users(id),
  ADD COLUMN admin_approved_at TIMESTAMPTZ,
  ADD COLUMN quality_score JSONB,
  -- e.g. { wordCount: 180, exampleCount: 2, hasAnalogy: true,
  --        readabilityGrade: 7.2, jargonDensity: 0.02 }
  ADD COLUMN regeneration_count INTEGER DEFAULT 0;
  -- tracks how many times admin requested re-generation

-- Add structured content for layman block (not just raw markdown)
-- layman blocks have structured JSON, others have markdown:
-- content JSONB already exists — update structure:
-- For layman: { simpleExplanation, analogyOrStory, example1, example2 }
-- For others: { markdown: "..." }
```

### 6.2 — New: domain_content_config Table (from Part 3.3 above)

```sql
-- Already defined in Part 3.3
-- Add indexes:
CREATE INDEX idx_domain_config_domain ON domain_content_config(domain_id);
```

### 6.3 — New: subtopic_flow_progress Table

```sql
-- Replaces the simpler progress tracking with flow-aware tracking
CREATE TABLE subtopic_flow_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subtopic_id UUID NOT NULL REFERENCES subtopics(id),

  -- Flow step completion timestamps
  layman_read_at TIMESTAMPTZ,
  real_life_read_at TIMESTAMPTZ,
  technical_read_at TIMESTAMPTZ,
  code_read_at TIMESTAMPTZ,
  ai_tutor_first_message_at TIMESTAMPTZ,
  assignment_unlocked_at TIMESTAMPTZ,
  assignment_completed_at TIMESTAMPTZ,

  -- Current position
  current_flow_step INTEGER DEFAULT 1 CHECK (current_flow_step BETWEEN 1 AND 6),
  flow_completed BOOLEAN DEFAULT false,

  -- Time analytics
  time_on_layman_seconds INTEGER DEFAULT 0,
  time_on_technical_seconds INTEGER DEFAULT 0,
  time_on_code_seconds INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subtopic_id)
);
```

---

## PART 7: Updated App Router Structure (Tutorial App)

### 7.1 — New Route: Admin Content Generation Panel

```
apps/tutorial-app/src/app/
  └── (admin)/
      └── content/
          ├── page.tsx                    ← All subtopics + generation status
          ├── generate/
          │   └── [subtopicId]/
          │       └── page.tsx            ← Trigger AI generation
          ├── review/
          │   └── [subtopicId]/
          │       ├── page.tsx            ← Review all 6 blocks
          │       ├── layman/page.tsx     ← Review + edit layman
          │       ├── technical/page.tsx
          │       ├── code/page.tsx
          │       └── approve/page.tsx    ← Final approval → publish
          └── analytics/
              └── page.tsx               ← Generation costs, quality scores
```

### 7.2 — New Admin API Routes

```
apps/tutorial-app/src/app/api/
  └── admin/
      └── content/
          ├── generate/route.ts          ← POST: trigger generation job
          ├── regenerate/route.ts        ← POST: re-gen specific block
          ├── approve/route.ts           ← POST: approve + publish
          ├── validate/route.ts          ← POST: run quality check
          └── jobs/route.ts              ← GET: generation job status
```

---

## PART 8: New packages/ Libraries Required

```
packages/
  ├── content-generation/               ← NEW: AI generation engine
  │   ├── src/
  │   │   ├── prompts/
  │   │   │   ├── layman.prompt.ts
  │   │   │   ├── real-life.prompt.ts
  │   │   │   ├── technical.prompt.ts
  │   │   │   ├── code.prompt.ts
  │   │   │   ├── notes.prompt.ts
  │   │   │   └── ai-tutor-context.prompt.ts
  │   │   ├── validators/
  │   │   │   ├── layman.validator.ts    ← Quality gate logic
  │   │   │   ├── code.validator.ts      ← Syntax check
  │   │   │   └── jargon.detector.ts    ← Per-domain jargon list
  │   │   ├── domain-configs/
  │   │   │   ├── full-stack.config.ts
  │   │   │   ├── data-analyst.config.ts
  │   │   │   ├── data-science.config.ts
  │   │   │   └── data-engineering.config.ts
  │   │   └── index.ts
  │   └── package.json
  │
  └── quality-gates/                    ← NEW: Content quality checking
      ├── src/
      │   ├── readability.ts            ← Flesch-Kincaid score
      │   ├── word-count.ts
      │   ├── jargon-density.ts
      │   ├── structure-validator.ts    ← Checks required sections exist
      │   └── index.ts
      └── package.json
```

---

## PART 9: Updated CLAUDE.md Rules for Tutorial Service

```markdown
## Content Generation Rules (ADDITION to existing rules)

### Layman Block is ALWAYS first and MOST IMPORTANT
- Layman block = entry point of every subtopic — treat with highest priority
- word count < 150 = NEVER publish — hard reject
- missing analogy = NEVER publish — hard reject
- fewer than 2 examples = NEVER publish — hard reject
- jargon in layman block = NEVER publish — run jargon.detector before save

### Learning Flow is ENFORCED
- ContentTabs component MUST show lock/unlock state per step
- Assignment tab MUST be locked until all 5 content blocks are read
  + AI Tutor has received at least 1 message
- EXCEPTION: student with ≥80% on Simple tier can bypass flow

### Domain-Specific Generation is MANDATORY
- NEVER generate content without loading domain_content_config first
- Layman examples MUST use companies from domainConfig.exampleCompanies
- Code blocks MUST use languages from domainConfig.codeStyle.languages
- AI Tutor system prompt MUST include domainConfig.aiTutorFocus

### AI Generation Pipeline
- Admin creates subtopic → ALWAYS triggers generation job (do not skip)
- Generation jobs ALWAYS run via QStash (never inline/synchronous)
- Content is ALWAYS saved as DRAFT first (is_published = false)
- Admin MUST explicitly approve before any student sees content
- Track generation cost in content_generation_jobs.generation_cost_usd

### Content Versioning (links to Gap 8 from architecture docs)
- Every admin edit to published content = new version record
- version field in tutorial_content increments on each edit
- Student progress is tied to content version they consumed
- Never delete old versions — soft archive only
```

---

## PART 10: New .md Files to Add to docs/

```
docs/blueprints/
  PHASE-T2-CONTENT-ENGINE.md          ← UPDATE with this framework
  PHASE-T9-CONTENT-GENERATION.md      ← NEW: AI generation pipeline
  PHASE-T10-DOMAIN-CONFIG.md          ← NEW: Domain-specific strategies

docs/prompts/
  tutorial-t9-content-generation.prompt.md  ← NEW
  tutorial-t10-domain-config.prompt.md      ← NEW

docs/reference/
  adr/
    ADR-T01-ai-generation-primary-path.md
    ← "AI generates, human reviews" vs "human writes from scratch"

  content-quality-standards.md        ← NEW: The quality gate rules
  domain-style-guides/
    full-stack-style-guide.md
    data-analyst-style-guide.md
    data-science-style-guide.md
    data-engineering-style-guide.md
```

---

## PART 11: Summary — What Changes in Each Existing File

```
TUTORIAL-ENGINE-BLUEPRINT.md (v1.0)
  Section 1.2 (Content Block Types):
    UPDATE: Add "Layman = MOST IMPORTANT, always first" note
    UPDATE: Add enforced flow order

  Section 4 (Database Schema):
    ADD: domain_content_config table
    ADD: content_generation_jobs table
    ADD: subtopic_flow_progress table (replaces simple progress)
    UPDATE: tutorial_content — add generation tracking columns

  Section 5 (App Router):
    ADD: (admin)/content/generate/ routes
    ADD: (admin)/content/review/ routes

  Section 6 (Core Services):
    ADD: ContentGenerationService
    ADD: QualityGateService

  Section 7 (Caching):
    ADD: Cache generated drafts separately from published content

  Section 8 (Async Processing):
    ADD: content.generation_requested → QStash → generate 6 blocks
    ADD: content.generation_complete → notify admin for review

  CLAUDE.md (Tutorial App):
    ADD: All rules from Part 9 above

MASTER-PLATFORM-ARCHITECTURE.md
  packages/ section:
    ADD: packages/content-generation
    ADD: packages/quality-gates

  QStash Event Map:
    ADD: content.generation_requested
    ADD: content.generation_complete
    ADD: content.approved_and_published
```

---

*Extension Version: 1.0 | Extends: TUTORIAL-ENGINE-BLUEPRINT.md v1.0*
*Status: FINALIZED | Ready to merge into main blueprint*
