# PHASE-PLS-CORE: Placement & Internship System
## docs/blueprints/PHASE-PLS-CORE.md

> Platform: placement.skillupitacademy.com
> Depends on: FMS-CORE, certificate engine

---

## Part 1: Placement Lifecycle

```
TRAINING_IN_PROGRESS → PLACEMENT_ELIGIBLE → PROFILE_SUBMITTED
→ SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEW_DONE
→ OFFER_RECEIVED → OFFER_ACCEPTED → PLACED → ALUMNI

Internship track (parallel):
INTERNSHIP_ELIGIBLE → INTERNSHIP_APPLIED → INTERNSHIP_STARTED
→ INTERNSHIP_COMPLETED → [joins Placement track]
```

---

## Part 2: Placement DB Schema

```sql
CREATE TABLE student_placement_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL UNIQUE,
  resume_url        TEXT,
  linkedin_url      TEXT,
  github_url        TEXT,
  portfolio_url     TEXT,
  skills            TEXT[],
  desired_role      TEXT,
  desired_location  TEXT[],
  desired_salary_min DECIMAL(10,2),
  desired_salary_max DECIMAL(10,2),
  notice_period_days INTEGER DEFAULT 0,
  is_visible        BOOLEAN DEFAULT true,  -- visible to company HR
  placement_status  TEXT DEFAULT 'training_in_progress',
  placed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  industry        TEXT,
  size            TEXT CHECK (size IN ('startup','sme','enterprise','mnc')),
  website         TEXT,
  hr_contact_name TEXT,
  hr_contact_email TEXT,
  hr_contact_phone TEXT,
  logo_url        TEXT,
  partnership_type TEXT DEFAULT 'standard' CHECK (
    partnership_type IN ('standard','premium','exclusive')
  ),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE job_listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  title               TEXT NOT NULL,
  description         TEXT,
  required_skills     TEXT[],
  required_domains    UUID[],
  min_experience_months INTEGER DEFAULT 0,
  location            TEXT[],
  is_remote           BOOLEAN DEFAULT false,
  salary_min          DECIMAL(10,2),
  salary_max          DECIMAL(10,2),
  currency            VARCHAR(3) DEFAULT 'INR',
  apply_deadline      DATE,
  status              TEXT DEFAULT 'open' CHECK (status IN ('open','closed','filled')),
  posted_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE internship_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  title           TEXT NOT NULL,
  description     TEXT,
  required_skills TEXT[],
  duration_months INTEGER,
  stipend_monthly DECIMAL(8,2),
  is_remote       BOOLEAN DEFAULT false,
  location        TEXT,
  start_date      DATE,
  openings        INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','closed','filled')),
  posted_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL,
  listing_id      UUID NOT NULL,
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('job','internship')),
  status          TEXT DEFAULT 'applied' CHECK (status IN (
    'applied','shortlisted','interview_scheduled',
    'interview_done','selected','rejected','withdrawn'
  )),
  applied_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id),
  round           INTEGER DEFAULT 1,
  scheduled_at    TIMESTAMPTZ,
  mode            TEXT CHECK (mode IN ('online','offline','phone')),
  interviewer     TEXT,
  feedback        TEXT,
  outcome         TEXT CHECK (outcome IN ('pass','fail','on_hold')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL UNIQUE,
  company_id      UUID NOT NULL REFERENCES companies(id),
  role            TEXT NOT NULL,
  offer_amount    DECIMAL(10,2),
  currency        VARCHAR(3) DEFAULT 'INR',
  joining_date    DATE,
  offer_letter_url TEXT,
  confirmed_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: Verification

```
□ Student profile visible to company HR after placement eligibility
□ Job listing applies to students matching required_skills
□ Interview scheduled → student + company notified
□ Placement confirmed → student.status = 'placed', alumni email sent
□ placement-service receives certificate.issued event
□ Admin can see placement rate % by batch / domain / month
```

*Phase: PLS-CORE | Status: Ready*

---
---

# PHASE-T7: Gamification System
## docs/blueprints/PHASE-T7-GAMIFICATION.md

---

## Part 1: XP & Level System

```
XP POINTS TABLE:
  Read layman block:          +10 XP
  Read any block:             +10 XP
  Complete AI Tutor (1 msg):  +15 XP
  Complete Simple assignment: +20 XP
  Complete Mixed assignment:  +30 XP
  Complete Intermediate:      +50 XP
  Complete Expert:            +100 XP
  Simple project approved:    +200 XP
  Intermediate project:       +400 XP
  Expert project:             +1000 XP
  Daily streak bonus:         +5 XP/day (doubles after 7 days)
  Topic completed:            +150 XP
  Subject completed:          +500 XP
  Domain completed:           +2000 XP

LEVELS (Upstash Redis ZSET per domain):
  Bronze:   0–999 XP
  Silver:   1000–4999 XP
  Gold:     5000–14999 XP
  Platinum: 15000–39999 XP
  Diamond:  40000+ XP
```

---

## Part 2: Streak System (Upstash Redis)

```typescript
// Daily streak: study ANY content block to maintain streak
// Stored in: Redis key = streak:{userId}
// DB backup: student_streaks table (synced nightly)

async function updateStreak(userId: string) {
  const key = `streak:${userId}`
  const today = new Date().toISOString().split('T')[0]
  const lastActivity = await redis.hget(key, 'lastActivity')

  if (lastActivity === today) return  // already counted today

  const yesterday = getPreviousDay(today)
  const isConsecutive = lastActivity === yesterday

  if (isConsecutive) {
    await redis.hincrby(key, 'currentStreak', 1)
  } else {
    await redis.hset(key, 'currentStreak', 1)  // reset streak
  }

  await redis.hset(key, 'lastActivity', today)
  await redis.expire(key, 86400 * 365)  // expire after 1 year inactivity

  // Check streak milestones: 7, 30, 100, 365 days → emit badge event
}
```

---

## Part 3: Leaderboard (Upstash Sorted Sets)

```typescript
// Three leaderboards per domain:
// 1. Global leaderboard
// 2. Weekly leaderboard (reset every Monday)
// 3. Monthly leaderboard (reset on 1st of month)

// Add XP:
await redis.zadd(`leaderboard:global:${domainId}`, {
  score: totalXP,
  member: userId
})

// Get top 10:
await redis.zrange(`leaderboard:global:${domainId}`, 0, 9, {
  rev: true,
  withScores: true
})

// Get user rank:
await redis.zrevrank(`leaderboard:global:${domainId}`, userId)
```

---

## Part 4: DB Schema

```sql
CREATE TABLE student_xp_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  domain_id   UUID,
  action      TEXT NOT NULL,
  xp_earned   INTEGER NOT NULL,
  reference_id UUID,           -- subtopic_id, project_id etc.
  earned_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  badge_id    UUID NOT NULL REFERENCES badges(id),
  awarded_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_xp_log_user ON student_xp_log(user_id, domain_id);
```

---

## Part 5: Verification

```
□ XP awarded on block completion (via server action)
□ Level updates in real-time on student dashboard
□ Streak maintained across days (Redis + DB sync)
□ Leaderboard shows top 10 per domain
□ Weekly leaderboard resets every Monday midnight
□ Badge awarded on project completion
□ Milestone streak badges (7/30/100 days)
□ XP visible in sidebar as "Level: Gold | 7,234 XP"
```

*Phase: T7-GAMIFICATION | Status: Ready*

---
---

# PHASE-T8: Admin Content Management
## docs/blueprints/PHASE-T8-ADMIN-CONTENT-MGMT.md

---

## Part 1: Admin Content Editor

```
Route: admin.realtutorialhub.com/content

Features:
  1. Subtopic browser (tree: domain → subject → topic → subtopic)
  2. Content status per subtopic: draft / review / published
  3. Generate button: triggers AI generation via QStash
  4. Review panel: see all 6 blocks, edit any block inline
  5. Approve/Reject per block
  6. Publish all 6 blocks atomically
  7. Version history: see previous versions of each block
  8. Re-generate with feedback: "Make examples more India-focused"
```

---

## Part 2: Content Analytics

```
Dashboard metrics:
  - Total subtopics: X published / Y in draft / Z not started
  - Generation cost: $X.XX this month (from content_generation_jobs)
  - Quality scores: avg Flesch-Kincaid, avg word count by block type
  - Drop-off analysis: which content blocks students skip most
  - Time spent: avg time on each block type
  - AI Tutor questions: most common questions per subtopic
    → Insight: if students ask same question repeatedly,
      that block needs improvement
```

---

## Part 3: A/B Testing Content

```sql
CREATE TABLE content_ab_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id     UUID NOT NULL,
  block_type      TEXT NOT NULL,
  variant_a_id    UUID NOT NULL,  -- tutorial_content.id
  variant_b_id    UUID NOT NULL,  -- tutorial_content.id
  traffic_split   INTEGER DEFAULT 50,  -- % going to variant A
  status          TEXT DEFAULT 'active',
  start_date      DATE,
  end_date        DATE,
  winner          TEXT CHECK (winner IN ('a','b','inconclusive')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Student assignment to variant stored in Redis:
-- ab:{subtopicId}:{userId} = 'a' | 'b' (TTL: until test ends)
```

---

## Part 4: Bulk Import/Export

```
Import: Admin uploads CSV/JSON with subtopic content
  → Validates against TutorialContentJSON schema (Zod)
  → Creates draft records for each subtopic
  → Admin reviews before publishing

Export: Admin downloads all content for a domain
  → JSON format (matches canonical schema)
  → Used for: backup, migration, offline review
```

---

## Part 5: Verification

```
□ Admin can generate all 6 blocks for a subtopic with one click
□ Generation status visible (queued → generating → draft_ready)
□ Admin can edit any block inline before publishing
□ Version history shows all edits with timestamps
□ A/B test routes 50% of students to each variant
□ Analytics shows drop-off rate per block type
□ Content cost tracked per generation job in USD
□ Bulk import validates all content before inserting
```

*Phase: T8-ADMIN-CONTENT | Status: Ready*

---
---

# PHASE-T9: AI Content Generation Pipeline
## docs/blueprints/PHASE-T9-CONTENT-GENERATION.md

---

## Part 1: Pipeline Overview

```
Admin creates subtopic record
          ↓
QStash job: generate-content
  payload: { subtopicId, difficulty, domainConfig }
          ↓
ContentGenerationService:
  1. Load domain_content_config
  2. Build 6 prompts (one per block type)
  3. Call Claude API for all 6 blocks (parallel)
  4. Validate each block (QualityGateService)
  5. Save all 6 as drafts (is_published = false)
  6. Save generation job metrics (tokens, cost)
          ↓
Admin notification: "6 blocks ready for review"
          ↓
Admin reviews → edits → approves → publishes
          ↓
QStash job: index-for-ai-tutor
  → Embeds content in Upstash Vector
```

---

## Part 2: Quality Gate Checks

```typescript
// packages/quality-gates/src/validators/layman.validator.ts

export function validateLaymanBlock(content: LaymanContent): ValidationResult {
  const errors: string[] = []
  const wordCount = countWords(content.simpleExplanation +
    content.analogyOrStory)

  if (wordCount < 150) errors.push(`Word count ${wordCount} < 150 minimum`)
  if (!content.analogyOrStory || content.analogyOrStory.length < 40)
    errors.push('Missing analogy or story')
  if (!content.example1?.company || !content.example2?.company)
    errors.push('Missing required examples')

  const jargonScore = detectJargon(content.simpleExplanation, domainForbiddenJargon)
  if (jargonScore > 0.05)
    errors.push(`Jargon density ${(jargonScore*100).toFixed(1)}% exceeds 5% limit`)

  const readability = calculateFleschKincaid(content.simpleExplanation)
  if (readability > 8)
    errors.push(`Reading grade level ${readability.toFixed(1)} exceeds grade 8 limit`)

  return { valid: errors.length === 0, errors }
}
```

---

## Part 3: Cost Tracking

```typescript
// After each Claude API call:
await db.update(contentGenerationJobs)
  .set({
    blocksGenerated: { ...existing, [blockType]: true },
    totalTokensUsed: sql`total_tokens_used + ${tokensUsed}`,
    generationCostUsd: sql`generation_cost_usd + ${cost}`,
  })
  .where(eq(contentGenerationJobs.id, jobId))

// Cost formula (Claude Sonnet):
// Input: $3.00 per million tokens
// Output: $15.00 per million tokens
// Avg per subtopic (all 6 blocks): ~$0.05–$0.15
```

---

## Part 4: Re-generation with Admin Feedback

```typescript
async function regenerateBlock(
  subtopicId: string,
  blockType: ContentBlockType,
  adminFeedback: string
) {
  // Append feedback to the original prompt
  const enhancedPrompt = buildPrompt(blockType, domainConfig) +
    `\n\nADMIN FEEDBACK ON PREVIOUS VERSION: ${adminFeedback}\n` +
    `Please address this feedback in your new version.`

  // Generate new version
  const newContent = await callClaudeAPI(enhancedPrompt)

  // Save as new version (increment version number)
  await db.update(tutorialContent)
    .set({
      content: newContent,
      version: sql`version + 1`,
      regenerationCount: sql`regeneration_count + 1`,
      generatedByAi: true,
      isPublished: false  // reset to draft
    })
    .where(and(
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.contentType, blockType)
    ))
}
```

---

## Part 5: Verification

```
□ Generation triggered by admin creates QStash job
□ All 6 blocks generated in parallel (< 60 seconds total)
□ Layman block rejected if < 150 words (quality gate)
□ Generation cost saved per job in USD
□ Admin feedback incorporated in re-generation
□ Published content indexed in Upstash Vector within 5 min
□ Version number increments on each re-generation
□ Admin can see generation cost dashboard
```

*Phase: T9-CONTENT-GENERATION | Status: Ready*

---
---

# PHASE-T10: Domain Configuration System
## docs/blueprints/PHASE-T10-DOMAIN-CONFIG.md

---

## Part 1: Purpose

Each domain (Full Stack, Data Analyst, Data Science, Data Engineering)
has unique content style rules. These rules drive AI generation prompts,
jargon detection, example company selection, and AI Tutor personality.

---

## Part 2: Domain Config Seed Data

```typescript
// packages/content-generation/src/domain-configs/

export const FULL_STACK_CONFIG: DomainContentConfig = {
  audienceProfile: "Junior to mid-level developer building web applications",
  laymanStyle: {
    tone: "conversational",
    analogySource: "everyday_app_usage",
    exampleCompanies: ["Zomato", "Swiggy", "Netflix", "Instagram", "WhatsApp", "Flipkart"]
  },
  technicalStyle: { depth: "implementation", includePerformance: true },
  codeStyle: {
    languages: ["TypeScript", "JavaScript"],
    frameworks: ["React", "Next.js", "Node.js", "Hono"],
    showMultipleVariations: true
  },
  aiTutorFocus: "debugging_and_implementation",
  forbiddenJargon: ["eigenvalue", "gradient descent", "ETL", "data lakehouse",
                    "DAG", "Spark", "Kafka", "p-value", "regression"]
}

export const DATA_ANALYST_CONFIG: DomainContentConfig = {
  audienceProfile: "Business analyst or data analyst interpreting business data",
  laymanStyle: {
    tone: "business_friendly",
    analogySource: "business_decisions_and_reports",
    exampleCompanies: ["Flipkart", "HDFC Bank", "BigBasket", "MakeMyTrip", "Naukri"]
  },
  codeStyle: {
    languages: ["SQL", "Python"],
    tools: ["Excel", "Power BI", "Tableau", "pandas"],
    showMultipleVariations: false
  },
  aiTutorFocus: "business_insights_and_sql_optimization",
  forbiddenJargon: ["backpropagation", "Docker", "microservices", "ETL pipeline",
                    "useEffect", "REST API", "React", "neural network"]
}

export const DATA_SCIENCE_CONFIG: DomainContentConfig = {
  audienceProfile: "Aspiring data scientist learning ML models and statistical analysis",
  laymanStyle: {
    tone: "intuition_first",
    analogySource: "predictions_and_patterns",
    exampleCompanies: ["Netflix recommendations", "Spotify Discover Weekly",
                       "Google Maps ETA", "Amazon product recommendations"]
  },
  codeStyle: {
    languages: ["Python"],
    frameworks: ["scikit-learn", "TensorFlow", "PyTorch", "pandas", "numpy", "matplotlib"],
    showMathIntuition: true
  },
  aiTutorFocus: "concept_clarity_and_algorithm_choice",
  forbiddenJargon: ["Docker Compose", "REST API", "React", "SQL JOIN",
                    "ETL", "Kafka", "microservices", "CSS"]
}

export const DATA_ENGINEERING_CONFIG: DomainContentConfig = {
  audienceProfile: "Engineer building scalable data pipelines and infrastructure",
  laymanStyle: {
    tone: "systems_thinking",
    analogySource: "logistics_and_supply_chain",
    exampleCompanies: ["Uber surge pricing", "Netflix recommendation pipeline",
                       "Airbnb data platform", "LinkedIn data infrastructure"]
  },
  codeStyle: {
    languages: ["Python", "SQL", "Scala", "bash"],
    tools: ["Apache Spark", "Kafka", "Airflow", "dbt", "Flink", "Hive"],
    showMultipleVariations: true
  },
  aiTutorFocus: "system_design_and_troubleshooting",
  forbiddenJargon: ["React", "CSS", "gradient descent", "A/B test UI",
                    "Next.js", "HTML", "useState", "JWT"]
}
```

---

## Part 3: Admin UI for Domain Config

```
Route: admin.realtutorialhub.com/settings/domain-config

For each domain:
  - Edit audience_profile (text)
  - Edit forbidden_jargon (tag input)
  - Edit example companies (tag input)
  - Edit code languages (checkboxes)
  - Edit ai_tutor_focus (dropdown)
  - Save → revalidates all draft content for this domain
```

---

## Part 4: Verification

```
□ All 4 domain configs seeded on first deploy
□ Admin can edit domain config from admin panel
□ Forbidden jargon detected in layman block validation
□ AI generation prompts include correct domain company examples
□ AI Tutor system prompt includes correct aiTutorFocus
□ Code blocks use correct languages for each domain
```

*Phase: T10-DOMAIN-CONFIG | Status: Ready*
