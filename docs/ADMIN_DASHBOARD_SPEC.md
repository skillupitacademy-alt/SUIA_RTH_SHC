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

---

## 3. Roles & Permissions (RBAC)

### What Should Be Visible

- List of available roles:
  - User
  - Admin
  - Super Admin
- Number of users assigned to each role
- Role assignment history

### Why This Exists

- Prevents accidental privilege escalation
- Ensures admins know who has elevated access
- Supports enterprise governance

---

## 4. Security & Login Health

### What Should Be Visible

- Successful vs failed login attempts (aggregated)
- Accounts with repeated failed logins
- Active sessions count (real-time)
- Recent authentication activity
- Suspicious activity indicators (Threat Levels)

### Why This Exists

- Detect brute-force or abuse attempts
- Monitor platform security health
- Provide early warning signals

---

## 5. Domain & Content Structure Overview

### What Should Be Visible

- List of Domains (e.g., Full Stack, Data Science)
- Subjects under each domain
- Topics under each subject
- Topic complexity level & weights
- Active vs inactive status

### Why This Exists

- Ensures syllabus completeness
- Helps admins validate curriculum structure

---

## 6. Question Bank Health

### What Should Be Visible

- Total questions per domain/subject/topic
- Difficulty distribution:
  - Simple (Target: 30%)
  - Intermediate (Target: 30%)
  - Expert (Target: 40%)
- Active vs inactive questions
- Topics with insufficient questions (Critical Alerts)

### Why This Exists

- Maintains fair difficulty balance
- Ensures enterprise exam standards are met

---

## 7. Exam Blueprint Monitoring

### What Should Be Visible

- Total blueprints generated
- Blueprint scope (Domain/Subject/Topic)
- Question count & Difficulty distribution
- Blueprint generation success / failure logs

### Why This Exists

- Confirms enterprise exam rules are enforced
- Allows auditing of exam configuration

---

## 8. Exam Activity Overview

### What Should Be Visible

- Total exams started
- Exams completed vs abandoned
- Exams per domain
- Average completion time

### Why This Exists

- Understand user engagement
- Identify UX or timing issues

---

## 9. Scoring & Performance Analytics (Aggregated)

### What Should Be Visible

- Average scores by domain
- Average scores by difficulty
- Pass / fail trends
- Topics with lowest accuracy (Gap Analysis)

### Why This Exists

- Measure exam quality
- Detect overly easy or hard topics

---

## 10. Audit & System Logs

### What Should Be Visible

- User creation events
- Role changes
- Exam blueprint generation events
- System-level warnings or errors

### Why This Exists

- Compliance
- Debugging
- Enterprise trust and traceability

---

## 11. Restriction Matrix

| Restricted Item | Reason |
|-----------------|--------|
| Passwords | High Security Risk |
| User Secrets / Tokens | High Security Risk |
| Individual Answer Data | Privacy compliance |

---

## 12. Final Goal

This Admin Dashboard provides **Confidence through Clarity**. It transforms raw database records into **Actionable Governance Signals**.
