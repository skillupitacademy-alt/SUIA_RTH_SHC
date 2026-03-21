# 📘 Domain-Specific Content Generation Framework

## 🎯 Purpose
This document defines the **final agreed architecture and rules** for generating tutorial content across all domains (Full Stack, Data Analyst, Data Science, Data Engineering).

This ensures:
- Consistency across subtopics
- High-quality learning experience
- Strong differentiation from traditional LMS platforms

---

# 🧠 Core Philosophy

> We are NOT generating content.
> We are generating a **learning experience**.

---

# 🏗️ Content Hierarchy (Final)

```
Domain
 └── Subject
      └── Topic
           └── Subtopic
                ├── 6 Content Blocks
                ├── Assignments (4 tiers)
                └── AI Tutor Context
```

---

# 🧩 6 Content Block System (Mandatory)

Each subtopic MUST contain ALL six blocks:

1. Notes
2. Layman Explanation
3. Real-Life Scenario
4. Technical Explanation
5. Code Explanation
6. AI Tutor

❗ No subtopic can be published without all 6 blocks.

---

# 🔥 Layman Explanation — MOST IMPORTANT BLOCK

## 🚨 Critical Rule

```
Layman Block = Entry Point of Every Subtopic
```

---

## ✅ Mandatory Requirements

Each Layman Block MUST:

- Be detailed (NOT brief)
- Be written in simple, non-technical language
- Be structured (not a paragraph dump)
- Include visual explanation flow
- Include at least **2 real-world examples**
- Include **1 analogy or story**

---

## 🧱 Layman Block Structure (FINAL)

```
1. Simple Explanation (paragraph)
2. Analogy / Story
3. Example 1
4. Example 2
```

---

## 📏 Quality Constraints

- Minimum length: 150–250 words
- Must avoid jargon
- Must be beginner-friendly

---

## ❌ Rejection Rules

Reject content if:

- Less than 150 words
- Fewer than 2 examples
- No analogy
- Too technical

---

# 🎨 Layman Block UI/UX Design Rules

## ✅ Layout Structure

- Card-based design
- Rounded corners + shadow
- Proper spacing

### Sections:

- 💡 Simple Explanation
- 📦 Analogy / Story
- 📊 Example 1
- 📊 Example 2

---

## 🎯 Visual Guidelines

| Element | Rule |
|--------|------|
| Font Size | Slightly larger than technical |
| Spacing | Generous |
| Icons | Mandatory |
| Examples | Card-based layout |
| Background | Soft gradient |

---

# 🔄 Learning Flow (Enforced)

```
Layman → Real-Life → Technical → Code → AI Tutor → Assignment
```

❗ Never start with technical explanation.

---

# 🌍 Domain-Specific Strategy (FINAL)

Each domain uses SAME structure but DIFFERENT style.

---

## 🟦 Full Stack Development

**Focus:** Building applications

- Layman: UI behavior explanation
- Real-Life: User interactions
- Technical: Lifecycle, performance
- Code: Multiple variations
- AI Tutor: Debugging help

---

## 🟩 Data Analyst

**Focus:** Interpreting data

- Layman: Business meaning
- Real-Life: Dashboards
- Technical: SQL/Excel logic
- Code: SQL/Python
- AI Tutor: Insights

---

## 🟪 Data Science

**Focus:** Understanding models

- Layman: Intuition
- Real-Life: Predictions
- Technical: Algorithms
- Code: ML implementation
- AI Tutor: Concept clarity

---

## ⬛ Data Engineering

**Focus:** Building systems

- Layman: Data flow explanation
- Real-Life: Pipelines (Uber/Netflix)
- Technical: ETL, streaming
- Code: Spark/Python
- AI Tutor: System troubleshooting

---

# ⚙️ Content Generation Framework

## Input

```
{
  domain,
  subject,
  topic,
  subtopic,
  difficulty
}
```

---

## Output

```
{
  notes,
  layman,
  real_life,
  technical,
  code,
  ai_tutor
}
```

---

# 🤖 AI Prompt Rules

## Layman Prompt Template

```
Generate a detailed layman explanation:
- 150–250 words
- Use simple language
- Include 1 analogy
- Include at least 2 examples
- Structured format
- Beginner-friendly
```

---

# 🎯 Difficulty-Based Content Variation

| Level | Strategy |
|------|--------|
| Simple | Basic explanation |
| Mixed | Applied concepts |
| Intermediate | Multi-step problems |
| Expert | Production-level systems |

---

# 🔁 Content Pipeline

```
Admin creates subtopic
↓
AI generates 6 blocks
↓
AI generates assignments
↓
Human review
↓
Publish
↓
AI Tutor indexing
```

---

# 🧠 AI Tutor Context Rules

AI Tutor must use:

- Subtopic content
- Assignments
- User progress (future)

---

# 🚨 Common Mistakes (Avoid)

- Same content across domains ❌
- Short layman explanation ❌
- No examples ❌
- Technical-first approach ❌

---

# 🏆 Final Product Positioning

```
Adaptive Domain-Specific Learning Engine
```

NOT:

```
Traditional LMS
```

---

# 🔐 Final Rules (LOCK THESE)

1. Layman block is mandatory and first
2. Minimum 2 examples required
3. Domain-specific style required
4. All 6 blocks must exist before publish
5. Learning flow must not be broken

---

# 🚀 Conclusion

This framework ensures:

- Deep understanding
- High engagement
- Scalable content generation
- Strong product differentiation

---

**Status: FINALIZED & READY FOR IMPLEMENTATION**

