# PHASE-T5: Remediation Engine
## docs/blueprints/PHASE-T5-REMEDIATION-ENGINE.md

> Prerequisites: exam-service QStash publishers, PHASE-T1 complete
> Sprint: Tutorial Sprint 5

---

## Purpose

When a student scores below 60% on any subtopic dimension in the Exam Engine,
the Remediation Engine automatically creates a personalized study plan and
routes the student back to the Tutorial Engine for targeted review.

---

## Part 1: The Bridge (Exam → Tutorial)

```
exam-service: ScoringEngine finishes
      ↓
Publish QStash event: "exam.completed"
  payload: {
    userId, examResultId,
    weakSubtopics: [
      { subtopicId: "uuid", subtopicName: "useEffect", score: 38, threshold: 60 },
      { subtopicId: "uuid", subtopicName: "Promises", score: 45, threshold: 60 }
    ]
  }
      ↓
tutorial-service consumes event:
  POST /api/workers/handle-exam-completed
      ↓
RemediationService.createPlan(userId, weakSubtopics)
      ↓
remediation_triggers record created in Tutorial DB
      ↓
Notification sent: "You scored below 60% in 2 topics — here's your study plan"
      ↓
Student visits: /remediation/{examResultId}
      → sees personalized "Study These Topics" page
      → direct links to specific subtopic content blocks
      → AI Tutor pre-loaded with exam context
```

---

## Part 2: Weak Area Detection Logic

```typescript
// In exam-service — runs after ScoringEngine completes
async function detectWeakAreas(examResultId: string): Promise<WeakSubtopic[]> {
  const results = await db.query.resultsByDimension.findMany({
    where: eq(resultsByDimension.examResultId, examResultId)
  })

  return results
    .filter(r => r.dimension === 'subtopic' && r.percentage < 60)
    .map(r => ({
      subtopicId: r.dimensionId,
      subtopicName: r.dimensionName,
      score: r.percentage,
      threshold: 60,
      questionCount: r.totalQuestions,
      correctCount: r.correctAnswers
    }))
}

// Threshold is 60% by default, configurable per domain via domain_content_config
```

---

## Part 3: RemediationService

```typescript
class RemediationService {
  async createPlan(
    userId: string,
    examResultId: string,
    weakSubtopics: WeakSubtopic[]
  ): Promise<RemediationPlan> {
    // 1. Check if remediation already exists for this exam result
    const existing = await repo.findByExamResult(examResultId)
    if (existing) return existing

    // 2. For each weak subtopic, determine what content to recommend
    const recommendations = await this.buildRecommendations(userId, weakSubtopics)

    // 3. Save to Tutorial DB
    const trigger = await repo.create({
      examResultId, userId,
      weakSubtopicIds: weakSubtopics.map(s => s.subtopicId),
      recommendedContentTypes: recommendations.contentTypes,
      status: 'pending'
    })

    // 4. Enqueue: embed weak subtopics in Upstash Vector for semantic matching
    await qstash.publishJSON({
      url: '/api/workers/embed-weak-subtopics',
      body: { userId, subtopicIds: weakSubtopics.map(s => s.subtopicId) }
    })

    return trigger
  }

  private async buildRecommendations(
    userId: string,
    weakSubtopics: WeakSubtopic[]
  ) {
    const recommendations = []
    for (const subtopic of weakSubtopics) {
      // Check student's existing progress on this subtopic
      const progress = await progressRepo.getFlowProgress(userId, subtopic.subtopicId)

      // Recommend starting from where they stopped
      const startFrom = progress?.currentFlowStep ?? 1 // default: start from Layman

      recommendations.push({
        subtopicId: subtopic.subtopicId,
        startFromBlock: FLOW_STEPS[startFrom - 1], // 'layman' | 'real_life' etc.
        priority: subtopic.score < 40 ? 'high' : 'medium'
      })
    }
    return { contentTypes: recommendations }
  }

  async getPlan(userId: string, examResultId: string): Promise<RemediationPlan>
  async markSubtopicRemediated(userId: string, subtopicId: string): Promise<void>
  async getStudentRemediationHistory(userId: string): Promise<RemediationSummary[]>
}

const FLOW_STEPS = ['layman', 'real_life', 'technical', 'code', 'ai_tutor']
```

---

## Part 4: The Remediation Page

```
Route: /remediation/[examResultId]
File:  apps/tutorial-app/src/app/(learning)/remediation/[examResultId]/page.tsx

Page sections:

HEADER:
  "Your Study Plan from [Exam Name]"
  "You scored below 60% in [N] topics. Let's fix that."
  Overall exam score badge

WEAK TOPICS GRID:
  For each weak subtopic:
    Card: subtopic name + score (e.g., "Promises — 38%")
    Progress bar showing score vs 60% threshold
    "Start Studying →" button → /learn/.../[subtopicSlug]
    Priority badge: HIGH (< 40%) or MEDIUM (40–60%)

AI TUTOR QUICK START:
  "Ask AI Tutor about your weak areas"
  Pre-loaded context: "Student scored X% on [subtopic]. Help them understand..."

PROGRESS TRACKER:
  As student completes remediation subtopics → card turns green ✓
  "Remediation Complete!" when all weak subtopics reviewed

EMAIL TEMPLATE:
  Subject: "Your personalized study plan from [Exam Name]"
  Body: list of weak subtopics with direct links
  CTA: "Start Studying Now"
  Sent via: Resend + notification-service
```

---

## Part 5: QStash Workers

```
POST /api/workers/handle-exam-completed
  → Receives exam.completed event
  → Calls RemediationService.createPlan()
  → Enqueues notification

POST /api/workers/embed-weak-subtopics
  → Loads content for each weak subtopic from Tutorial DB
  → Embeds in Upstash Vector with userId tag
  → AI Tutor can now do semantic search over student's weak areas

POST /api/workers/send-remediation-email
  → Sends personalized study plan email via Resend
  → Includes direct deep links to each weak subtopic
```

---

## Part 6: Verification

```
□ exam.completed event consumed within 5 seconds
□ remediation_triggers record created in Tutorial DB
□ Student receives email within 2 minutes of exam completion
□ /remediation/[examResultId] page loads correctly
□ Each weak subtopic card links to correct subtopic page
□ Pre-loading at Layman block for subtopics student hasn't studied
□ Pre-loading at last visited step for partially studied subtopics
□ Card turns green when student completes the subtopic
□ AI Tutor has exam context pre-loaded
□ Upstash Vector indexed with weak subtopic content
```

---

*Phase: T5 | Status: Ready*
