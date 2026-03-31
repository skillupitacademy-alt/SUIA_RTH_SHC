# Existing Features Analysis - Multi-Brand Architecture Context

## Executive Summary

Your codebase **ALREADY HAS** comprehensive implementations for enquiry, admission, fees/payment, faculty management, and batch scheduling. These features are currently in the `people_prod` database and are being used by SkillUp.

**Key Finding**: The multi-brand auth architecture needs to account for these existing features and ensure they work correctly for both RTH and SkillUp brands.

---

## ✅ Existing Features in Your Codebase

### 1. **Enquiry Management** ✅ COMPLETE

**Database Tables** (in `people_prod`):
- `enquiries` - Main enquiry table
- `enquiry_follow_ups` - Follow-up tracking

**Schema Details**:
```typescript
// packages/db-people/src/schema/enquiries.ts
enquiries table:
- id (UUID)
- name, email, phone
- source (website, referral, ad, walkin)
- status (new, contacted, qualified, lost)
- assigned_counsellor_id
- utm_source, utm_medium, utm_campaign
- notes
- created_at, updated_at, deleted_at

enquiry_follow_ups table:
- id (UUID)
- enquiry_id (FK to enquiries)
- counsellor_id (FK to users)
- follow_up_type
- next_follow_up_at
- notes
```

**API Routes**:
- `/enquiries` → CRM Service (via API Gateway)

**Current Usage**: SkillUp uses this for lead management

---

### 2. **Admission Management** ✅ COMPLETE

**Database Tables** (in `people_prod`):
- `admissions` - Student admissions

**Schema Details**:
```typescript
// packages/db-people/src/schema/admissions.ts
admissions table:
- id (UUID)
- enquiry_id (FK to enquiries)
- student_user_id (FK to users)
- admission_type (digital, training)
- domain_id (FK to hierarchy)
- batch_id (FK to batches)
- status (pending, approved, rejected)
- admission_date
- documents (JSONB)
- approved_by (FK to users)
- created_at, updated_at, deleted_at
```

**Events**:
- `ADMISSION_COMPLETED` event published when admission is approved

**Current Usage**: SkillUp uses this for student onboarding

---

### 3. **Fees & Payment Management** ✅ COMPLETE

**Database Tables** (in `people_prod`):
- `payment_installments` - Payment tracking

**Schema Details**:
```typescript
// packages/db-people/src/schema/payment-installments.ts
payment_installments table:
- id (UUID)
- student_user_id (FK to users)
- installment_number
- amount
- due_date
- status (pending, paid, overdue)
- payment_reference
- paid_at
- created_at, updated_at, deleted_at
```

**API Routes**:
- `/payments` → Payment Service (via API Gateway)
- `/webhooks` → Payment Service (public, for payment gateway callbacks)

**Events**:
- `PAYMENT_RECEIVED` - When payment is completed
- `PAYMENT_OVERDUE` - When payment is overdue

**Current Usage**: 
- SkillUp tracks admission fees and monthly training fees
- Example: "Admission fee" (₹15,000), "Training fee - month 2" (₹15,000)

---

### 4. **Faculty Management** ✅ COMPLETE

**Database Tables** (in `people_prod`):
- `faculty` - Faculty profiles
- `faculty_availability` - Faculty scheduling

**Schema Details**:
```typescript
// packages/db-people/src/schema/faculty.ts
faculty table:
- id (UUID)
- user_id (FK to users)
- specialization (array)
- availability_type (fulltime, parttime, contract)
- status (active, inactive, on_leave)
- created_at, updated_at, deleted_at

faculty_availability table:
- id (UUID)
- faculty_id (FK to faculty)
- day_of_week (0-6)
- start_time, end_time
- is_booked
- booked_batch_id (FK to batches)
- created_at, updated_at
```

**User Roles**:
- `faculty` role exists in the system
- Faculty can be assigned to batches and sessions

**Apps**:
- `apps/faculty-app` - Faculty portal for managing sessions
- `faculty.skillupitacademy.com` - Faculty domain

**Current Usage**: SkillUp physical trainers use this

---

### 5. **Batch Scheduling** ✅ COMPLETE

**Database Tables** (in `people_prod`):
- `batches` - Batch management
- `batch_sessions` - Individual session scheduling
- `batch_enrollments` - Student enrollments
- `attendance_records` - Attendance tracking
- `demo_sessions` - Demo session scheduling

**Schema Details**:
```typescript
// packages/db-people/src/schema/batches.ts
batches table:
- id (UUID)
- name
- mode (online, offline, hybrid)
- status (upcoming, active, completed, cancelled)
- start_date, end_date
- subject_id (FK to hierarchy)
- faculty_id (FK to faculty)
- max_students
- created_at, updated_at, deleted_at

batch_sessions table:
- id (UUID)
- batch_id (FK to batches)
- faculty_id (FK to faculty)
- scheduled_at
- duration_minutes
- status (scheduled, completed, cancelled)
- session_notes
- subtopics_covered (array)
- created_at, updated_at

batch_enrollments table:
- id (UUID)
- batch_id (FK to batches)
- student_user_id (FK to users)
- status (active, dropped, completed)
- enrolled_at
- created_at, updated_at, deleted_at

attendance_records table:
- id (UUID)
- batch_session_id (FK to batch_sessions)
- student_user_id (FK to users)
- status (present, absent, late)
- marked_at
- created_at, updated_at

demo_sessions table:
- id (UUID)
- enquiry_id (FK to enquiries)
- faculty_id (FK to faculty)
- scheduled_at
- duration_minutes
- status (scheduled, completed, no_show)
- notes
- created_at, updated_at
```

**Events**:
- `SESSION_SCHEDULED` - When batch session is scheduled
- `BATCH_SUBTOPICS_COVERED` - When topics are covered
- `ATTENDANCE_MARKED` - When attendance is recorded

**API Routes**:
- `/students` → Student-Faculty Service
- `/faculty` → Student-Faculty Service
- `/batches` → Student-Faculty Service
- `/attendance` → Student-Faculty Service

**Current Usage**: 
- SkillUp uses this for physical training batches
- Faculty can schedule sessions, mark attendance
- Students can view their batch schedule

---

### 6. **AI Virtual Trainer** ✅ PARTIAL

**Database Tables** (in `tutorial_prod`):
- `live_session_requests` - AI tutor session requests

**Schema Details**:
```typescript
// packages/types/src/live-session.types.ts
live_session_requests:
- id (UUID)
- student_id
- subtopic_id
- doubt_text
- status (pending, accepted, scheduled, completed, cancelled)
- faculty_id (can be AI or human)
- meeting_link
- scheduled_at
```

**API Routes**:
- `/ai-tutor` → Tutorial Service

**Current Usage**: 
- RTH uses AI-based tutoring
- Can request live sessions with AI tutor
- Doubt resolution system

---

## 🔄 How These Features Relate to Multi-Brand Auth

### Current State:
All these features are in `people_prod` database and are **brand-agnostic** at the database level. They use `user_id` from `people_prod.users` table.

### After Multi-Brand Auth Implementation:

#### ✅ **What Works Automatically**:
1. **Enquiry Management** - Works for both brands (already brand-agnostic)
2. **Admission Management** - Works for both brands (uses people_prod users)
3. **Payment Management** - Works for both brands (uses people_prod users)
4. **Faculty Management** - Works for both brands (uses people_prod users)
5. **Batch Scheduling** - Works for both brands (uses people_prod users)

#### ⚠️ **What Needs Updates**:

1. **User References**: All these tables reference `people_prod.users.id`
   - After multi-brand auth, this becomes the `shadowUserId`
   - ✅ This is PERFECT - no changes needed!
   - The Identity Bridge creates shadow users in people_prod
   - All existing features will automatically work with shadow users

2. **Brand Context**: Some features may need brand-specific behavior
   - **Enquiry Source**: Already tracks source (website, referral, ad, walkin)
   - **Admission Type**: Already has 'digital' (RTH) and 'training' (SkillUp)
   - **Faculty Assignment**: SkillUp uses physical faculty, RTH uses AI tutor
   - **Batch Mode**: Already has online/offline/hybrid

3. **UI Customization**: Frontend needs brand-specific theming
   - SkillUp portals show physical training features
   - RTH portals show AI tutor features
   - Both can access shared services (quiz, tutorial, placement)

---

## 📊 Feature Matrix: RTH vs SkillUp

**IMPORTANT**: Both brands have batch scheduling, but with DIFFERENT instructor types:

| Feature | RTH (AI Tutor Based) | SkillUp (Physical Faculty Based) | Implementation |
|---------|---------------------|----------------------------------|----------------|
| **Enquiry** | ✅ Yes | ✅ Yes | ✅ Shared (CRM Service) |
| **Admission** | ✅ Yes (Digital) | ✅ Yes (Training) | ✅ Shared (Admission Service) |
| **Payment** | ✅ Yes (Subscription) | ✅ Yes (Installments) | ✅ Shared (Payment Service) |
| **Batch Scheduling** | ✅ Yes (AI-managed) | ✅ Yes (Faculty-managed) | ✅ Shared (Batch Service) |
| **Batch Sessions** | ✅ Yes (AI tutor) | ✅ Yes (Physical faculty) | ✅ Shared (Session Service) |
| **Attendance Tracking** | ✅ Yes | ✅ Yes | ✅ Shared (Attendance Service) |
| **Physical Faculty** | ❌ No | ✅ Yes | ⚠️ SkillUp Only |
| **Faculty Portal** | ❌ No | ✅ Yes (faculty.skillupitacademy.com) | ⚠️ SkillUp Only |
| **AI Virtual Tutor** | ✅ Yes (Batch instructor) | ❌ No | ⚠️ RTH Only |
| **Demo Sessions** | ✅ Yes (AI demo) | ✅ Yes (Faculty demo) | ✅ Shared (Demo Service) |
| **Quiz/Exam** | ✅ Yes | ✅ Yes | ✅ Shared (Quiz Service) |
| **Tutorial Content** | ✅ Yes | ✅ Yes | ✅ Shared (Tutorial Service) |
| **Placement** | ✅ Yes | ✅ Yes | ✅ Shared (Placement Service) |

**Key Differences**: 
- **RTH (Real Tutorial Hub)**: Scheduled batches with AI virtual tutor as the instructor. Students attend scheduled sessions where AI tutor teaches.
- **SkillUp IT Academy**: Scheduled batches with physical human faculty as the instructor. Students attend physical/online classes with human teachers.
- **Shared Infrastructure**: Both brands use the same batch scheduling, session management, and attendance tracking systems. The only difference is the instructor type (AI vs Human).
- **Shared Services**: Both brands use the same quiz engine, tutorial content library, and placement services via SkillHub (skillhubcore.in)

---

## 🎯 Recommendations for Multi-Brand Auth Implementation

### 1. **No Database Schema Changes Needed** ✅

The existing `people_prod` schema is PERFECT for multi-brand auth:
- All features already use `people_prod.users.id`
- After multi-brand auth, this becomes `shadowUserId`
- Identity Bridge creates shadow users automatically
- All existing features work without modification

### 2. **Add Brand Context to Existing Tables** (Optional Enhancement)

Consider adding instructor type tracking to batches table:

```sql
-- Optional: Add instructor_type to batches for clarity
ALTER TABLE batches ADD COLUMN instructor_type TEXT DEFAULT 'physical-faculty';
-- Values: 'physical-faculty' or 'ai-tutor'

-- For RTH batches, set instructor_type to 'ai-tutor'
UPDATE batches b
SET instructor_type = 'ai-tutor'
FROM users u
WHERE b.faculty_id = u.id 
  AND u.platform = 'realtutorialhub';

-- For SkillUp batches, keep as 'physical-faculty'
UPDATE batches b
SET instructor_type = 'physical-faculty'
FROM users u
WHERE b.faculty_id = u.id 
  AND u.platform = 'skillup';
```

**Note**: The `faculty_id` column in batches table can reference:
- **For SkillUp**: A real human faculty user from `faculty` table
- **For RTH**: A special "AI Tutor" user account that represents the AI instructor

### 3. **Update API Services to Use Shadow User ID**

All existing services already use `people_prod.users.id`, which will become `shadowUserId`:

```typescript
// No changes needed! This already works:
async function getEnquiries(userId: string) {
  // userId is shadowUserId after multi-brand auth
  return db.select().from(enquiries).where(eq(enquiries.assignedCounsellorId, userId));
}
```

### 4. **Brand-Specific Feature Flags**

Use brand context to enable/disable features based on instructor type:

```typescript
// packages/ui/src/utils/brandFeatures.ts
export function getBrandFeatures(brand: 'realtutorialhub' | 'skillup') {
  return {
    // SkillUp-only features (Physical faculty)
    hasPhysicalFaculty: brand === 'skillup',
    hasFacultyPortal: brand === 'skillup',
    
    // RTH-only features (AI tutor)
    hasAITutor: brand === 'realtutorialhub',
    
    // Shared features (Both brands)
    hasEnquiryManagement: true,
    hasAdmissionManagement: true,
    hasPaymentManagement: true,
    hasBatchScheduling: true,        // Both brands have batches
    hasBatchSessions: true,          // Both brands have scheduled sessions
    hasAttendanceTracking: true,     // Both brands track attendance
    hasDemoSessions: true,           // Both brands offer demos
    hasQuizExam: true,
    hasTutorialContent: true,
    hasPlacement: true,
  };
}

// Helper to get instructor type
export function getInstructorType(brand: 'realtutorialhub' | 'skillup') {
  return brand === 'realtutorialhub' ? 'ai-tutor' : 'physical-faculty';
}
```

### 5. **Update Frontend to Show Brand-Specific Features**

```typescript
// apps/realtutorialhub-web/src/app/dashboard/page.tsx
const features = getBrandFeatures('realtutorialhub');
const instructorType = getInstructorType('realtutorialhub'); // 'ai-tutor'

return (
  <Dashboard>
    {/* Shared features - Both brands */}
    {features.hasEnquiryManagement && <EnquiryWidget />}
    {features.hasAdmissionManagement && <AdmissionWidget />}
    {features.hasPaymentManagement && <PaymentWidget />}
    {features.hasBatchScheduling && <BatchScheduleWidget instructorType={instructorType} />}
    {features.hasBatchSessions && <SessionsWidget instructorType={instructorType} />}
    {features.hasAttendanceTracking && <AttendanceWidget />}
    {features.hasQuizExam && <QuizWidget />}
    {features.hasTutorialContent && <TutorialWidget />}
    {features.hasPlacement && <PlacementWidget />}
    
    {/* RTH-only: Show AI tutor management instead of faculty */}
    {features.hasAITutor && <AITutorManagementWidget />}
    
    {/* SkillUp-only: Hidden for RTH */}
    {features.hasPhysicalFaculty && <FacultyManagementWidget />}
    {features.hasFacultyPortal && <FacultyPortalLink />}
  </Dashboard>
);
```

```typescript
// apps/skillup-web/src/app/dashboard/page.tsx
const features = getBrandFeatures('skillup');
const instructorType = getInstructorType('skillup'); // 'physical-faculty'

return (
  <Dashboard>
    {/* Shared features - Both brands */}
    {features.hasEnquiryManagement && <EnquiryWidget />}
    {features.hasAdmissionManagement && <AdmissionWidget />}
    {features.hasPaymentManagement && <PaymentWidget />}
    {features.hasBatchScheduling && <BatchScheduleWidget instructorType={instructorType} />}
    {features.hasBatchSessions && <SessionsWidget instructorType={instructorType} />}
    {features.hasAttendanceTracking && <AttendanceWidget />}
    {features.hasQuizExam && <QuizWidget />}
    {features.hasTutorialContent && <TutorialWidget />}
    {features.hasPlacement && <PlacementWidget />}
    
    {/* SkillUp-only: Show physical faculty management */}
    {features.hasPhysicalFaculty && <FacultyManagementWidget />}
    {features.hasFacultyPortal && <FacultyPortalLink />}
    
    {/* RTH-only: Hidden for SkillUp */}
    {features.hasAITutor && <AITutorManagementWidget />}
  </Dashboard>
);
```

**Key UI Differences**:
- **Batch Schedule Widget**: Shows "AI Tutor" for RTH batches, "Faculty Name" for SkillUp batches
- **Session Widget**: Shows "AI-led session" for RTH, "Faculty-led session" for SkillUp
- **Faculty Management**: Only visible in SkillUp (manage human faculty)
- **AI Tutor Management**: Only visible in RTH (configure AI tutor settings)

---

## 🚀 Implementation Impact

### Phase 1-6: No Impact ✅
Database and auth services implementation doesn't affect existing features.

### Phase 7: Frontend Updates ⚠️
- Update RTH portals to hide physical faculty features
- Update SkillUp portals to show physical faculty features
- Both brands show enquiry, admission, payment features

### Phase 8: Shared Services Updates ✅
- Quiz, Tutorial, Placement services already use `people_prod.users.id`
- After multi-brand auth, this becomes `shadowUserId`
- No changes needed!

---

## 📝 Updated Tasks for Multi-Brand Auth

Add these tasks to your implementation:

### Task 50: Brand Feature Flags
```
Create packages/ui/src/utils/brandFeatures.ts
- Define feature flags per brand
- Export getBrandFeatures(brand) function
```

### Task 51: Update RTH Portal to Hide Physical Features
```
Update apps/realtutorialhub-web
- Hide faculty management UI
- Hide batch scheduling UI
- Show AI tutor UI
- Show enquiry, admission, payment UI
```

### Task 52: Update SkillUp Portal to Show Physical Features
```
Update apps/skillup-web
- Show faculty management UI
- Show batch scheduling UI
- Show AI tutor UI (optional)
- Show enquiry, admission, payment UI
```

### Task 53: Update Admin Portals
```
Update admin portals for both brands
- RTH Admin: Manage enquiries, admissions, payments, AI tutor
- SkillUp Admin: Manage enquiries, admissions, payments, faculty, batches
```

---

## ✅ Conclusion

**Good News**: Your existing features are well-architected and will work seamlessly with multi-brand auth!

**Key Points**:
1. ✅ All features already use `people_prod.users.id` (future shadowUserId)
2. ✅ No database schema changes needed
3. ✅ Identity Bridge automatically creates shadow users
4. ⚠️ Only need UI updates to show/hide brand-specific features
5. ✅ Shared services (quiz, tutorial, placement) work for both brands

**Next Steps**:
1. Proceed with multi-brand auth implementation (Phases 1-9)
2. Add brand feature flags (Task 50)
3. Update frontend UIs to show/hide features per brand (Tasks 51-53)
4. Test that existing enquiry, admission, payment, faculty, batch features work for both brands

Your architecture is solid! 🎉
