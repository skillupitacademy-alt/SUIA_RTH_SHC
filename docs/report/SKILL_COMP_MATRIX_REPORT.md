# Report: Skill Competency Matrix

## 🎯 Objective
Detailed tracking of 2,000+ granular abilities mapped via `question_skills`.

## 📊 Dimension Mapping
- **Primary Source**: `results_by_dimension`
- **Dimension Type**: `skill`
- **Source Table**: `skills`

---

## 📈 Analysis Views

### 1. The Proficiency Quadrant
Skills are grouped by their `results_by_dimension.score`:

| Quadrant | Score Range | Interpretation |
| :--- | :--- | :--- |
| **Mastery** | 90% - 100% | Can lead/mentor in this area. |
| **Proficient** | 70% - 89% | Can work independently. |
| **Developing** | 40% - 69% | Needs oversight/guidance. |
| **Critical Gap** | < 40% | Immediate training required. |

### 2. Impact Weighted Ranking
Skills are sorted by their **Weight (1-10)** to highlight the most critical strengths and weaknesses.

---

## 📝 Business Insight
"The candidate has Mastered 'State Management' (Weight: 10) but has a Critical Gap in 'Error Handling' (Weight: 8)."
