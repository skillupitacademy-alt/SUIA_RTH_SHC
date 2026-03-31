# RTH vs SkillUp: Feature Comparison

## Executive Summary

Both RTH and SkillUp use the **SAME batch scheduling infrastructure**, but with **DIFFERENT instructor types**:
- **RTH**: Batches are taught by AI Virtual Tutor
- **SkillUp**: Batches are taught by Physical Human Faculty

## 🎓 Teaching Model Comparison

### RTH (Real Tutorial Hub) - AI Tutor Based
```
Student enrolls → Joins AI-managed batch → Attends scheduled sessions → AI tutor teaches → Takes quizzes → Gets placement
```

**Instructor**: AI Virtual Tutor (automated, scalable)
**Batch Type**: Online only (AI-led)
**Session Format**: AI-powered interactive sessions
**Faculty Portal**: ❌ Not needed (AI manages everything)

### SkillUp IT Academy - Physical Faculty Based
```
Student enrolls → Joins faculty-managed batch → Attends scheduled sessions → Human faculty teaches → Takes quizzes → Gets placement
```

**Instructor**: Physical Human Faculty (real teachers)
**Batch Type**: Online, Offline, or Hybrid
**Session Format**: Human-led classroom/online sessions
**Faculty Portal**: ✅ Yes (faculty.skillupitacademy.com)

---

## 📊 Detailed Feature Comparison

### ✅ Shared Features (Both Brands Use Same Code)

| Feature | RTH Implementation | SkillUp Implementation | Database Table |
|---------|-------------------|------------------------|----------------|
| **Enquiry Management** | Lead capture for AI courses | Lead capture for physical courses | `enquiries` |
| **Admission** | Digital admission | Training admission | `admissions` |
| **Payment** | Subscription-based | Installment-based | `payment_installments` |
| **Batch Creation** | Admin creates AI-led batches | Admin creates faculty-led batches | `batches` |
| **Session Scheduling** | AI tutor sessions scheduled | Faculty sessions scheduled | `batch_sessions` |
| **Student Enrollment** | Students join AI batches | Students join faculty batches | `batch_enrollments` |
| **Attendance** | Track AI session attendance | Track faculty session attendance | `attendance_records` |
| **Demo Sessions** | AI tutor demos | Faculty demos | `demo_sessions` |
| **Quiz/Exam** | Same quiz engine | Same quiz engine | `quiz_platform_prod` |
| **Tutorial Content** | Same content library | Same content library | `tutorial_prod` |
| **Placement** | Same placement service | Same placement service | `people_prod` |

### ⚠️ Brand-Specific Features

| Feature | RTH | SkillUp | Why Different? |
|---------|-----|---------|----------------|
| **Faculty Management** | ❌ No | ✅ Yes | RTH uses AI, doesn't need human faculty |
| **Faculty Portal** | ❌ No | ✅ Yes | No human faculty to manage |
| **Faculty Availability** | ❌ No | ✅ Yes | AI is always available |
| **AI Tutor Config** | ✅ Yes | ❌ No | RTH needs to configure AI behavior |

---

## 🗄️ Database Schema Usage

### Batches Table (Shared by Both Brands)

```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,  -- 'online', 'offline', 'hybrid'
  status TEXT NOT NULL,  -- 'upcoming', 'active', 'completed', 'cancelled'
  start_date DATE NOT NULL,
  end_date DATE,
  subject_id UUID,  -- What subject is being taught
  faculty_id UUID,  -- References users table
  max_students INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

**How it's used**:

**RTH Batches**:
```sql
-- Example RTH batch
INSERT INTO batches VALUES (
  'batch-uuid-1',
  'Full Stack Development - AI Batch March 2026',
  'online',  -- AI batches are always online
  'active',
  '2026-03-01',
  '2026-06-01',
  'subject-fullstack-uuid',
  'ai-tutor-user-uuid',  -- Special AI tutor user account
  50,  -- AI can handle more students
  NOW(),
  NOW(),
  NULL
);
```

**SkillUp Batches**:
```sql
-- Example SkillUp batch
INSERT INTO batches VALUES (
  'batch-uuid-2',
  'Full Stack Development - Faculty Batch March 2026',
  'hybrid',  -- Can be online, offline, or hybrid
  'active',
  '2026-03-01',
  '2026-06-01',
  'subject-fullstack-uuid',
  'faculty-john-uuid',  -- Real faculty member
  30,  -- Physical classes have capacity limits
  NOW(),
  NOW(),
  NULL
);
```

### Batch Sessions Table (Shared by Both Brands)

```sql
CREATE TABLE batch_sessions (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL,
  faculty_id UUID,  -- AI tutor user or real faculty user
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL,  -- 'scheduled', 'completed', 'cancelled'
  session_notes TEXT,
  subtopics_covered UUID[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**How it's used**:

**RTH Sessions**:
```sql
-- AI tutor session
INSERT INTO batch_sessions VALUES (
  'session-uuid-1',
  'batch-uuid-1',
  'ai-tutor-user-uuid',  -- AI tutor
  '2026-03-15 10:00:00',
  90,
  'scheduled',
  'Introduction to React Hooks - AI-led interactive session',
  ARRAY['subtopic-hooks-uuid'],
  NOW(),
  NOW()
);
```

**SkillUp Sessions**:
```sql
-- Faculty session
INSERT INTO batch_sessions VALUES (
  'session-uuid-2',
  'batch-uuid-2',
  'faculty-john-uuid',  -- Real faculty
  '2026-03-15 10:00:00',
  120,
  'scheduled',
  'Introduction to React Hooks - Live coding with John',
  ARRAY['subtopic-hooks-uuid'],
  NOW(),
  NOW()
);
```

---

## 🎨 UI Differences

### RTH User Portal (user.realtutorialhub.com)

**Dashboard Shows**:
- My AI-led batches
- Upcoming AI tutor sessions
- AI tutor chat/help
- Quiz scores
- Tutorial progress
- Placement status

**Batch Details Page**:
```
Batch: Full Stack Development - AI Batch March 2026
Instructor: AI Virtual Tutor 🤖
Mode: Online
Schedule: Mon, Wed, Fri 10:00 AM - 11:30 AM

Upcoming Sessions:
- March 15: Introduction to React Hooks (AI-led)
- March 17: State Management with Redux (AI-led)
- March 19: API Integration (AI-led)

Your Attendance: 95% (19/20 sessions)
```

### SkillUp User Portal (user.skillupitacademy.com)

**Dashboard Shows**:
- My faculty-led batches
- Upcoming faculty sessions
- Faculty contact info
- Quiz scores
- Tutorial progress
- Placement status

**Batch Details Page**:
```
Batch: Full Stack Development - Faculty Batch March 2026
Instructor: John Doe (Senior Developer) 👨‍🏫
Mode: Hybrid (Online + Offline)
Schedule: Mon, Wed, Fri 10:00 AM - 12:00 PM

Upcoming Sessions:
- March 15: Introduction to React Hooks (Faculty: John Doe)
- March 17: State Management with Redux (Faculty: John Doe)
- March 19: API Integration (Faculty: John Doe)

Your Attendance: 90% (18/20 sessions)
```

---

## 🔧 Implementation Strategy

### 1. Database Level (No Changes Needed) ✅

The existing schema works for both brands:
- `batches.faculty_id` can reference AI tutor user or real faculty user
- `batch_sessions.faculty_id` same as above
- All other tables are brand-agnostic

### 2. Service Level (Minimal Changes)

Add instructor type detection:

```typescript
// packages/batch-service/src/utils/instructorType.ts
export async function getInstructorType(facultyId: string): Promise<'ai-tutor' | 'physical-faculty'> {
  const user = await db.select().from(users).where(eq(users.id, facultyId)).limit(1);
  
  if (!user[0]) return 'physical-faculty';
  
  // Check if this is the special AI tutor account
  if (user[0].email === 'ai-tutor@realtutorialhub.com') {
    return 'ai-tutor';
  }
  
  // Check if user is in faculty table
  const faculty = await db.select().from(faculty).where(eq(faculty.userId, facultyId)).limit(1);
  return faculty.length > 0 ? 'physical-faculty' : 'ai-tutor';
}
```

### 3. UI Level (Brand-Specific Rendering)

```typescript
// apps/realtutorialhub-web/src/components/BatchCard.tsx
export function BatchCard({ batch }: { batch: Batch }) {
  const instructorType = batch.instructorType; // 'ai-tutor'
  
  return (
    <Card>
      <h3>{batch.name}</h3>
      {instructorType === 'ai-tutor' ? (
        <div>
          <span>🤖 AI Virtual Tutor</span>
          <p>Intelligent, adaptive learning experience</p>
        </div>
      ) : (
        <div>
          <span>👨‍🏫 {batch.facultyName}</span>
          <p>{batch.facultySpecialization}</p>
        </div>
      )}
      <p>Mode: {batch.mode}</p>
      <p>Schedule: {batch.schedule}</p>
    </Card>
  );
}
```

---

## 🚀 Migration Path

### Phase 1: Create AI Tutor User Account

```sql
-- Create special AI tutor user in people_prod
INSERT INTO users (id, email, platform, role) VALUES (
  'ai-tutor-uuid',
  'ai-tutor@realtutorialhub.com',
  'realtutorialhub',
  'faculty'  -- Treated as faculty for batch assignment
);
```

### Phase 2: Update Existing RTH Batches

```sql
-- Update RTH batches to use AI tutor
UPDATE batches
SET faculty_id = 'ai-tutor-uuid'
WHERE faculty_id IN (
  SELECT u.id FROM users u
  WHERE u.platform = 'realtutorialhub'
);
```

### Phase 3: Update UI to Show Instructor Type

- Add `instructorType` field to batch DTOs
- Update batch cards to show AI tutor icon for RTH
- Update session cards to show "AI-led" for RTH sessions

---

## ✅ Summary

**Key Insight**: RTH and SkillUp use the **SAME infrastructure** with **DIFFERENT instructors**:

| Aspect | RTH | SkillUp |
|--------|-----|---------|
| **Batch Scheduling** | ✅ Yes | ✅ Yes |
| **Session Management** | ✅ Yes | ✅ Yes |
| **Attendance Tracking** | ✅ Yes | ✅ Yes |
| **Instructor Type** | AI Tutor | Physical Faculty |
| **Faculty Portal** | ❌ No | ✅ Yes |
| **Scalability** | High (AI) | Limited (Human) |

**No database changes needed** - just UI differences to show instructor type! 🎉
