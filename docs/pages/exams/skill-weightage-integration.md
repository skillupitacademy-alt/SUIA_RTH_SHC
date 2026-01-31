# Skill Weightage & Reporting Integration

This document outlines the requirements and implementation details for integrating skill weights, categories, and mapping types into the Quiz Platform's assessment engine and question bank.

## 1. Objectives
- **Categorical Reporting**: Support high-level radar charts with three broad buckets: `Technical`, `Cognitive`, and `Process`.
- **Weighted Proficiency**: Ensure high-impact skills (e.g., System Design) carry more weight in the final score than lower-complexity skills.
- **Nature of Assessment**: Track the balance between Theory (`Conceptual`), Simulation (`Technical`), and Practice (`Practical`).

## 2. Data Schema Requirements

### Question Record (Individual CRUD)
When creating or editing a single question, the following fields must be available and populated:
- **Mapped Skills**: Selection of one or more skills.
- **Skill Weight**: (On the Skill object) Importance score from 1-10.
- **Mapping Type**: The nature of the question (`Conceptual`, `Technical`, `Practical`).

### Bulk Payload (Hierarchy Factory)
The JSON schema for bulk uploads must include:
- `skillNames`: Array of skill strings.
- `mappingType`: Enum string.
- `skillWeight`: Number (1-10) to be applied if a skill is auto-created.

## 3. UI/UX Specifications

### Quality Gates (Standardization)
- **Enum Dropdowns**: Use dedicated UI components to select from the localized high-level categories and mapping types.
- **Visual Weight Indicators**: Display the weight of a skill in the Question Bank table or during selection.
- **Zero-Placeholder Guarantee**: All future records must enforce these values to prevent "Missing Data" errors in reports.

## 4. Scoring Logic (ScoringEngine)
The proficiency score for any dimension (Domain, Skill, Category) is calculated as:
$$ Proficiency = \frac{\sum (CorrectAnswers \times SkillWeight)}{\sum (TotalQuestions \times SkillWeight)} $$

## 5. Verification Plan
- [x] Schema Migration (weights and category enums).
- [x] Scoring Engine logic upgrade.
- [x] Bulk JSON Factory upgrade.
- [ ] UI CRUD integration (Add/Edit Question forms).
- [ ] Question Bank Dashboard column visibility.
