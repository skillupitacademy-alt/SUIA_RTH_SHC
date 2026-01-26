# Admin Dashboard Specification
## Quiz Platform – Enterprise Control Panel

> [!NOTE]
> **Purpose**: This document defines **what must be visible on the Admin Dashboard**, why it is visible, and how it supports platform health, security, and quality.  
> This is a **product + execution document**, written in simple language for clarity and alignment across engineering, QA, and stakeholders.

---

## 1. Overview

The **Admin Dashboard** is the **control center** of the platform.

Admins do NOT:
- Take exams
- Answer questions
- Manage UI design

Admins DO:
- Monitor platform health
- Ensure security
- Maintain content quality
- Verify exam and scoring integrity

This dashboard answers one core question:

> “Is the platform secure, healthy, and delivering quality assessments?”

---

## 2. User & Account Overview

### What Should Be Visible

- Total registered users
- New users today / this week / this month
- Email verified vs unverified users
- Recently active users
- Locked or suspended accounts (if applicable)

### Why This Exists

- Track platform growth
- Detect suspicious or fake accounts
- Ensure users are completing email verification
- Support basic user management

### Notes

- Admins **must never see passwords**
- Admins **must never see tokens**
- Only high-level user metadata is shown

---

## 3. Roles & Permissions (RBAC)

### What Should Be Visible

- List of available roles:
  - User
  - Admin
  - Super Admin
- Number of users assigned to each role
- Role assignment history (optional, audit-level)

### Why This Exists

- Prevents accidental privilege escalation
- Ensures admins know who has elevated access
- Supports enterprise governance

### Notes

- Role logic is backend-enforced
- UI only reflects current assignments

---

## 4. Security & Login Health

### What Should Be Visible

- Successful vs failed login attempts (aggregated)
- Accounts with repeated failed logins
- Active sessions count
- Recent authentication activity
- Suspicious activity indicators (optional)

### Why This Exists

- Detect brute-force or abuse attempts
- Monitor platform security health
- Provide early warning signals

### What Is NOT Visible

- JWT tokens
- Refresh tokens
- Password hashes

Admins see **signals**, not **secrets**.

---

## 5. Domain & Content Structure Overview

### What Should Be Visible

- List of Domains (e.g., Full Stack, Data Science)
- Subjects under each domain
- Topics under each subject
- Topic complexity level
- Topic weight
- Active vs inactive status

### Why This Exists

- Ensures syllabus completeness
- Helps admins validate curriculum structure
- Prevents broken or incomplete exams

### Notes

- Topics are the **atomic unit of exams and scoring**
- Changes here directly affect exam quality

---

## 6. Question Bank Health

### What Should Be Visible

- Total questions per domain
- Questions per subject and topic
- Difficulty distribution:
  - Simple
  - Intermediate
  - Expert
- Active vs inactive questions
- Topics with insufficient questions

### Why This Exists

- Prevents exam blueprint failures
- Maintains fair difficulty balance
- Ensures enterprise exam standards are met

### Example Insight

> “Topic X has only 3 Expert questions – enterprise exams may fail.”

---

## 7. Exam Blueprint Monitoring

### What Should Be Visible

- Total blueprints generated
- Blueprint scope:
  - Domain-based
  - Subject-based
  - Topic-based
- Question count per blueprint
- Difficulty distribution (30% / 30% / 40%)
- Blueprint generation success / failure

### Why This Exists

- Confirms enterprise exam rules are enforced
- Allows auditing of exam configuration
- Helps diagnose blueprint generation issues

### Important Rule

Blueprints are **immutable** once created.

---

## 8. Exam Activity Overview

### What Should Be Visible

- Total exams started
- Exams completed vs abandoned
- Exams per domain
- Average completion time
- Peak exam usage periods

### Why This Exists

- Understand user engagement
- Identify UX or timing issues
- Plan scaling and performance improvements

---

## 9. Scoring & Performance Analytics (Aggregated)

### What Should Be Visible

- Average scores by domain
- Average scores by difficulty
- Pass / fail trends
- Topics with lowest accuracy
- Topics with highest mastery

### Why This Exists

- Measure exam quality
- Detect overly easy or hard topics
- Support data-driven curriculum improvements

### Privacy Rule

Admins see **aggregated data only**, not individual answers.

---

## 10. Growth Zones & Learning Insights

### What Should Be Visible

- Common weak topics across users
- High-weight topics with low accuracy
- Skill gaps by domain
- System-identified improvement areas

### Why This Exists

- Guides future content creation
- Improves learning outcomes
- Prepares the system for AI-driven recommendations

### Note

 These insights are **derived**, not manually entered.

---

## 11. Audit & System Logs

### What Should Be Visible

- User creation events
- Role changes
- Exam blueprint generation events
- System-level warnings or errors
- Timestamped activity logs

### Why This Exists

- Compliance
- Debugging
- Enterprise trust and traceability

---

## 12. What Admin Dashboard Must NOT Show

| Restricted Item | Reason |
|-----------------|--------|
| Passwords | Security risk |
| JWT tokens | Sensitive |
| Refresh tokens | Sensitive |
| Individual exam answers | Privacy |
| Internal algorithms | Over-complex |

---

## 13. Admin Dashboard Mental Model

Admins do not interact with exams directly.

Admins:
- **Observe**
- **Monitor**
- **Protect**
- **Improve**

> “If users take exams, admins protect the system.”

---

## 14. Summary of Dashboard Sections

| Section | Purpose |
|------|--------|
| Users & Accounts | Growth & access |
| Roles & Permissions | Security governance |
| Login Health | Threat detection |
| Domains & Topics | Content control |
| Question Bank | Exam readiness |
| Exam Blueprints | Enterprise compliance |
| Exam Activity | Usage insights |
| Scoring Analytics | Quality measurement |
| Growth Zones | Improvement planning |
| Audit Logs | Trust & compliance |

---

## 15. Final Statement

This Admin Dashboard is:
- Enterprise-grade
- Security-first
- Analytics-driven
- AI-ready
- Designed for clarity, not complexity

It provides **confidence**, not control overload.

---

## 16. User Management Interface (New)

### What Should Be Visible

- **Paginated User List**: Displaying all registered users.
- **Essential Columns**:
  - Name & Avatar
  - Email Address
  - Assigned Role
  - Account Status (Verified / Active)
  - Joined Date (Sorted Latest First)
- **Onboarding Details (Modal/Expandable)**:
  - Education Level
  - Professional Status (Student/Professional)
  - Age Group
  - Experience Years
  - Domain Interests (Tags)

### Why This Exists

- **Identity Verification**: Admins verify who is accessing the platform.
- **Demographic Insight**: Helps separate student cohorts from professionals.
- **Support**: Allows admins to debug user profile issues.

### Sorting Rule

> **"Latest First"**: The default view must always show the most recently registered users at the top.
