# Content Versioning & Question Bank Management
*Phase G8: Academic Integrity*

## 📜 Architectural Objective
To track every change to the question bank — storing a complete version history of each question — so that exam results can always be linked to the exact version of the question the student saw. This is critical for academic fairness, dispute resolution, and regulatory compliance.

---

## 🏗️ 1. Version History Schema

### A. Question Versions Table
```sql
CREATE TABLE question_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID NOT NULL REFERENCES questions(id),
  version_number  INTEGER NOT NULL,
  content         JSONB NOT NULL,           -- Full question snapshot (text, options, correct_answer, explanation)
  change_summary  TEXT,                     -- "Fixed typo in option B" or "Updated correct answer"
  changed_by      UUID NOT NULL REFERENCES users(id),
  changed_at      TIMESTAMP DEFAULT NOW(),
  is_current      BOOLEAN DEFAULT true,
  
  UNIQUE(question_id, version_number)
);

CREATE INDEX idx_qv_question ON question_versions(question_id);
CREATE INDEX idx_qv_current ON question_versions(question_id, is_current) WHERE is_current = true;
```

### B. Exam-Question Version Link
```sql
ALTER TABLE exam_questions 
ADD COLUMN question_version_id UUID REFERENCES question_versions(id);
```
- **Action**: When an exam is created, link each question to its **current version** at that moment.
- **Benefit**: Even if the question is later edited, the exam result always references the exact text the student saw.

---

## 🔧 2. Version Service

### A. Core Logic
```typescript
class QuestionVersionService {
  // Called BEFORE updating a question
  static async createVersion(questionId: string, changedBy: string, changeSummary: string): Promise<QuestionVersion>
  
  // Get version history for a question
  static async getHistory(questionId: string): Promise<QuestionVersion[]>
  
  // Get the specific version shown to a student
  static async getExamVersion(examQuestionId: string): Promise<QuestionVersion>
  
  // Rollback to a previous version
  static async rollback(questionId: string, targetVersionNumber: number): Promise<Question>
}
```

### B. Automatic Versioning
- **Action**: Intercept every `question.update` call in `AdminEngine`.
- **Workflow**:
  1. Snapshot the current question data into `question_versions` with incremented version number.
  2. Apply the update to the `questions` table.
  3. Mark the new version as `is_current = true`, previous as `is_current = false`.

---

## 📁 3. Question Bank Import/Export

### A. CSV/Excel Import
- **Action**: Create a bulk import route in the admin API.
- **Template**: Provide a downloadable CSV template with columns: `subject`, `topic`, `subtopic`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`, `difficulty`.
- **Validation**: Validate all rows before importing. Return detailed error report for invalid rows.
- **Versioning**: Imported questions start at version 1.

### B. CSV/Excel Export
- **Action**: Export entire question bank or filtered subsets.
- **Format**: CSV with all question fields + metadata (id, version, created_at).
- **Use Case**: Backup, migration to another platform, or content review by subject matter experts.

---

## 🖥️ 4. Admin UI Enhancements

### A. Question Editor — Version History Tab
- **Location**: Within the question editor in admin-app.
- **Features**:
  - Timeline view showing all versions with timestamps and change authors
  - Side-by-side diff view (what changed between versions)
  - "Rollback to this version" button
  - "Preview this version" to see the question as the student would see it

### B. Exam Result — Version Indicator
- **Location**: Within the exam result detail view.
- **Feature**: Show "(v3)" badge next to each question, clickable to see the exact version text.
- **Use Case**: Admin investigating a grade dispute can see exactly what the student saw.

### C. Bulk Import Page
- **Location**: New page in admin-app: "Import Questions".
- **Features**:
  - File upload (CSV/XLSX)
  - Template download
  - Preview table with validation highlights
  - Import progress bar
  - Error report download

---

## 🛡️ Implementation Checklist
- [ ] Create `question_versions` table (Drizzle migration)
- [ ] Add `question_version_id` to `exam_questions` table (migration)
- [ ] Build `QuestionVersionService` with create/history/rollback methods
- [ ] Integrate versioning into `AdminEngine.updateQuestion()`
- [ ] Link question versions to exam_questions during exam creation
- [ ] Build version history UI in question editor
- [ ] Build side-by-side diff viewer
- [ ] Implement rollback functionality
- [ ] Build CSV import route with validation
- [ ] Build CSV export route
- [ ] Build bulk import UI page in admin-app
- [ ] Add version badge to exam result detail view
- [ ] Write unit tests for QuestionVersionService

---

## 📈 Impact
Content versioning ensures **academic integrity** — if a question's correct answer is changed, past results using the old answer remain valid. It also enables collaborative question editing by multiple admins without fear of losing previous work. Bulk import/export scales content creation from hundreds to thousands of questions.

*Document Version: 1.0*
