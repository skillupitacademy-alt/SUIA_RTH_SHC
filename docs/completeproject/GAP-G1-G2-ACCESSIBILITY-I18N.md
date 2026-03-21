# Gap G1: Accessibility (WCAG 2.1 AA)
## docs/blueprints/GAP-G1-ACCESSIBILITY.md

> Legal requirement for educational platforms
> Target: WCAG 2.1 Level AA compliance

---

## Part 1: Critical Areas for Exam Engine

```
HIGH PRIORITY (exam functionality must be accessible):
  ✅ Keyboard navigation through exam questions (Tab, Arrow keys)
  ✅ Screen reader announces question text + options (ARIA labels)
  ✅ Timer announces remaining time at intervals (aria-live)
  ✅ "Submit exam" confirmation is keyboard-accessible
  ✅ Error messages announced via aria-live regions
  ✅ Focus management when navigating between questions

EXAM-SPECIFIC RULES:
  - Each MCQ option: role="radio", properly grouped in role="radiogroup"
  - Question counter: aria-label="Question 3 of 20"
  - Timer: role="timer", aria-live="polite", updates every minute
  - Progress bar: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
```

---

## Part 2: Tutorial Engine Accessibility

```
CONTENT BLOCKS:
  - Tab navigation: all 6 content tabs keyboard-accessible
  - Locked tabs: aria-disabled="true" + aria-label="Complete Layman first"
  - Code blocks: role="region", aria-label="Code example in JavaScript"
  - AI Tutor chat: role="log", aria-live="polite" for new messages
  - "Mark as Read" button: clear focus indicator (3px outline)

COLOR CONTRAST:
  - All text: minimum 4.5:1 contrast ratio
  - Domain theme colors validated against WCAG AA
  - Verify: blockLaymanHeader, blockRealLifeHeader, all tip text
  - Tool: use axe DevTools or WAVE to audit each block
```

---

## Part 3: Implementation Checklist

```typescript
// Keyboard navigation for exam questions:
<div role="radiogroup" aria-labelledby="question-text">
  <div id="question-text">{question.text}</div>
  {options.map((opt, i) => (
    <label key={i}>
      <input
        type="radio"
        name="question"
        value={opt.id}
        aria-label={opt.text}
      />
      {opt.text}
    </label>
  ))}
</div>

// Timer with accessibility:
<div
  role="timer"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`Time remaining: ${formatTime(timeLeft)}`}
>
  {formatTime(timeLeft)}
</div>

// Focus management on question navigation:
useEffect(() => {
  questionRef.current?.focus()
}, [currentQuestionIndex])
```

---

## Part 4: Automated Testing

```bash
# Install axe-core for automated a11y testing
pnpm add -D @axe-core/react axe-playwright

# Add to Playwright E2E tests:
import { checkA11y } from 'axe-playwright'

test('exam page is accessible', async ({ page }) => {
  await page.goto('/exam/test-exam-id')
  await checkA11y(page, null, {
    axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] }
  })
})
```

---

## Part 5: Verification

```
□ axe-playwright: zero WCAG AA violations on exam page
□ axe-playwright: zero violations on tutorial subtopic page
□ Keyboard-only test: complete exam without mouse
□ Screen reader test (NVDA/VoiceOver): navigate and answer questions
□ Color contrast: all text passes 4.5:1 ratio
□ Timer announces "10 minutes remaining" via aria-live
□ Focus visible on all interactive elements (3px outline)
□ Error messages announced automatically (aria-live="assertive")
```

---

*Gap: G1 | Priority: Medium-High | Status: Ready*

---
---

# Gap G2: Internationalization (i18n)
## docs/blueprints/GAP-G2-I18N.md

> Library: next-intl
> Initial languages: English (en), Hindi (hi)
> Future: Tamil, Telugu, Kannada, Bengali, Arabic (RTL)

---

## Part 1: Setup

```bash
pnpm add next-intl
# In each Next.js app: student-app, tutorial-app, faculty-app
```

---

## Part 2: File Structure

```
apps/student-app/
  messages/
    en.json     → English (default)
    hi.json     → Hindi
  src/
    i18n.ts     → next-intl config
    middleware.ts → locale detection + routing
```

---

## Part 3: Translation Files

```json
// messages/en.json (partial)
{
  "exam": {
    "startExam": "Start Exam",
    "submitExam": "Submit Exam",
    "timeRemaining": "Time Remaining",
    "question": "Question {current} of {total}",
    "confirmSubmit": "Are you sure you want to submit?",
    "examComplete": "Exam Complete!",
    "yourScore": "Your Score: {score}%"
  },
  "tutorial": {
    "laymanTitle": "Layman Explanation",
    "realLifeTitle": "Real-Life Scenario",
    "technicalTitle": "Technical Explanation",
    "codeTitle": "Code Explanation",
    "aiTutorTitle": "AI Tutor Chat",
    "notesTitle": "Notes",
    "markAsRead": "Mark as Read",
    "unlocks": "Unlocks {nextBlock}",
    "completed": "Completed",
    "locked": "Complete {requiredBlock} first"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try Again",
    "back": "Back",
    "next": "Next",
    "save": "Save",
    "cancel": "Cancel"
  }
}

// messages/hi.json (partial)
{
  "exam": {
    "startExam": "परीक्षा शुरू करें",
    "submitExam": "परीक्षा जमा करें",
    "timeRemaining": "शेष समय",
    "question": "प्रश्न {current} / {total}",
    "confirmSubmit": "क्या आप वाकई जमा करना चाहते हैं?",
    "examComplete": "परीक्षा पूर्ण!",
    "yourScore": "आपका स्कोर: {score}%"
  }
}
```

---

## Part 4: Usage in Components

```typescript
// In any component:
import { useTranslations } from 'next-intl'

export function StartExamButton() {
  const t = useTranslations('exam')
  return <button>{t('startExam')}</button>
}

// With parameters:
t('question', { current: 3, total: 20 })
// → "Question 3 of 20" (en) | "प्रश्न 3 / 20" (hi)

// Date/number formatting:
import { useFormatter } from 'next-intl'
const format = useFormatter()
format.dateTime(date, { dateStyle: 'medium' })
// → "Mar 19, 2026" (en) | "19 मार्च 2026" (hi)
```

---

## Part 5: Middleware (Locale Detection)

```typescript
// middleware.ts — locale routing
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localeDetection: true,  // auto-detect from Accept-Language header
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
// URLs: /en/exam/... or /hi/exam/...
```

---

## Part 6: Verification

```
□ All hardcoded strings replaced with t() calls
□ Hindi translation covers all exam + tutorial UI strings
□ Date formatting shows locale-appropriate format
□ Number formatting: INR shown as ₹1,00,000 (Indian system)
□ Locale switcher in navbar (flag + language name)
□ Selected locale persists across sessions (localStorage)
□ RTL layout toggle prepared for future Arabic support
□ next-intl type-safe: TypeScript errors for missing translation keys
```

---

*Gap: G2 | Priority: Medium | Status: Ready*
