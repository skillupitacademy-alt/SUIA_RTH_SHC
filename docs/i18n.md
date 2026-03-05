# Internationalization & Localization (i18n/l10n)
*Phase G2: Global Language Support*

## 📜 Architectural Objective
To enable the quiz platform to serve students in any language — starting with English as the default, with infrastructure to add Hindi, Arabic, Spanish, French, and more — without rewriting UI components.

---

## 🏗️ 1. Translation Infrastructure

### A. Library Selection
- **Recommended**: `next-intl` (built for Next.js App Router, supports Server Components).
- **Alternative**: `react-i18next` (more universal, but requires client-side wrappers).
- **Action**: Install `next-intl` in both `apps/web-app` and `apps/admin-app`.

### B. Message Extraction
- **Action**: Extract all hardcoded strings from TSX components into JSON message files.
- **Structure**:
  ```
  apps/web-app/messages/
  ├── en.json       # English (default)
  ├── hi.json       # Hindi
  ├── ar.json       # Arabic
  └── es.json       # Spanish
  ```
- **Key Naming**: Use dot-notation keys grouped by page/feature: `quiz.timer.remaining`, `dashboard.stats.totalExams`, `auth.login.submitButton`.

---

## 🌍 2. Locale-Aware Formatting

### A. Dates & Times
- **Action**: Replace all `new Date().toLocaleDateString()` with `next-intl`'s `useFormatter` hook.
- **Exam Timer**: Format countdown using locale-aware number formatting.
- **Reports**: Date headers must respect locale (e.g., "March 4, 2026" vs "4 मार्च 2026").

### B. Numbers & Percentages
- **Scores**: Display "85.5%" in English but "٨٥٫٥٪" in Arabic.
- **Action**: Use `Intl.NumberFormat` everywhere scores/percentages are displayed.

### C. Pluralization
- **Action**: Use ICU message format for plurals: `{count, plural, one {# question} other {# questions}}`.
- **Why**: Different languages have different plural rules (Arabic has 6 plural forms).

---

## 🔄 3. RTL (Right-to-Left) Support

### A. CSS Direction
- **Action**: Add `dir="rtl"` to `<html>` when locale is Arabic/Hebrew.
- **Tailwind**: Use `rtl:` prefix variants for layout adjustments.
- **Critical Areas**: Quiz navigation arrows must flip. Progress bars must fill right-to-left. Sidebar must appear on the right.

### B. Bidirectional Text
- **Action**: Use CSS `direction` and `unicode-bidi` properties for mixed-direction content (e.g., a question in Arabic containing an English technical term).

---

## 🗄️ 4. Backend & Database

### A. API Responses
- **Error Messages**: Return i18n keys (e.g., `error.exam_not_found`) instead of English strings. Let the frontend translate.
- **System Emails**: `ResendEmailProvider` must select email templates by locale.

### B. Content Storage
- **Questions**: Store question text with a `locale` field. Support parallel question banks per language.
- **Reports**: PDF generation must use the student's preferred locale for headings and labels.

---

## 🛡️ Implementation Checklist
- [ ] Install `next-intl` in web-app and admin-app
- [ ] Create `messages/en.json` with all extracted strings
- [ ] Configure locale detection (browser preference → user setting → default)
- [ ] Add locale switcher component to header
- [ ] Implement RTL support in Tailwind config
- [ ] Update date/number formatting across all components
- [ ] Add locale field to user profile (DB migration)
- [ ] Create Hindi translation file (`hi.json`) as first non-English locale
- [ ] Update email templates for multi-language support
- [ ] Test RTL layout in all critical pages

---

## 📈 Impact
Enables the platform to serve students globally. India alone has 22 officially recognized languages. A single Hindi translation opens access to **600+ million** potential users.

*Document Version: 1.0*
