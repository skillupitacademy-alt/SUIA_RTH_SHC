# Report: Curriculum Mastery Analysis

## 🎯 Objective
To assess the candidate's proficiency across the structured educational hierarchy, from broad Domains to specific Topics.

## 📊 Dimension Mapping
- **Primary Source**: `results_by_dimension`
- **Dimension Types**: `domain`, `subject`, `topic`
- **Source Tables**: `domains`, `subjects`, `topics`

---

## 📈 Analysis Views

### 1. Domain-Level Proficiency
Aggregated performance across an entire curriculum (e.g., "Web Development").
- **Metric**: Weighted Accuracy (%)
- **Threshold**: 75% for "Ready for Deployment"

### 2. Subject Breakdown
Granular view within a domain (e.g., "Frontend" vs. "Backend").
- **Visualization**: Horizontal Progress Bars.

### 3. Topic Depth Analysis
Performance on specific knowledge blocks (e.g., "React Hooks", "SQL Joins").
- **Weight Factor**: High-weight topics influence the parent Subject score more significantly.

---

## 📝 Business Insight
"This candidate is a specialist in Modern Frontend but shows significant gaps in Database Management subjects within the Software Engineering domain."
