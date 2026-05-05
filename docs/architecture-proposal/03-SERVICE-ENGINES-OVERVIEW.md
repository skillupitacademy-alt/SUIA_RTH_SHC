# SERVICE ENGINES OVERVIEW
## Microservices Architecture for Platform Services

---

## **1. SERVICE ENGINES CATALOG**

### **1.1 Core Services**

| Service | Purpose | Database | Port | Tech Stack |
|---------|---------|----------|------|------------|
| **Identity Service** | Authentication & Authorization | identity_db | 3000 | Node.js, PostgreSQL |
| **Tutorial Engine** | Tutorial content management | tutorial_db | 3001 | Node.js, PostgreSQL |
| **Exam Engine** | Quiz & exam management | exam_db | 3002 | Node.js, PostgreSQL |
| **Placement Engine** | Job placement & applications | placement_db | 3003 | Node.js, PostgreSQL |
| **Training Engine** | Physical & AI training | training_db | 3004 | Node.js, PostgreSQL |
| **Internship Engine** | Internship management | internship_db | 3005 | Node.js, PostgreSQL |
| **Certification Engine** | Certificate issuance | certification_db | 3006 | Node.js, PostgreSQL |
| **Payment Engine** | Payment processing | payment_db | 3007 | Node.js, PostgreSQL |
| **Notification Engine** | Multi-channel notifications | notification_db | 3008 | Node.js, PostgreSQL |

---

## **2. TUTORIAL ENGINE**

### **2.1 Responsibilities**

- Tutorial content creation and management
- Section and chapter organization
- Progress tracking per user
- Certificate issuance upon completion
- Content versioning
- Multi-language support

### **2.2 Database Schema**

```sql
-- tutorial_db

CREATE TABLE tutorials (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- Tenant isolation
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty VARCHAR(20),  -- beginner, intermediate, advanced
  estimated_duration INTEGER,  -- in minutes
  language VARCHAR(10) DEFAULT 'en',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_by UUID NOT NULL,  -- User ID from identity service
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE TABLE tutorial_sections (
  id UUID PRIMARY KEY,
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  content_type VARCHAR(50),  -- text, video, code, quiz
  order_index INTEGER NOT NULL,
  duration INTEGER,  -- in minutes
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tutorial_enrollments (
  id UUID PRIMARY KEY,
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- User ID from identity service
  tenant_id UUID NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  UNIQUE(tutorial_id, user_id, tenant_id)
);

CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES tutorial_enrollments(id) ON DELETE CASCADE,
  section_id UUID REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  time_spent INTEGER DEFAULT 0,  -- in seconds
  UNIQUE(enrollment_id, section_id)
);
```

### **2.3 API Endpoints**

```typescript
// Tutorial Management
POST   /tutorials                    // Create tutorial
GET    /tutorials                    // List tutorials (tenant-scoped)
GET    /tutorials/:id                // Get tutorial details
PATCH  /tutorials/:id                // Update tutorial
DELETE /tutorials/:id                // Delete tutorial
POST   /tutorials/:id/publish        // Publish tutorial

// Enrollment
POST   /tutorials/:id/enroll         // Enroll in tutorial
GET    /tutorials/:id/progress       // Get user progress
POST   /tutorials/:id/sections/:sectionId/complete  // Mark section complete

// Content
POST   /tutorials/:id/sections       // Add section
PATCH  /tutorials/:id/sections/:sectionId  // Update section
DELETE /tutorials/:id/sections/:sectionId  // Delete section
```

---

## **3. EXAM ENGINE**

### **3.1 Responsibilities**

- Exam and quiz creation
- Question bank management
- Exam attempts and submissions
- Auto-grading and manual grading
- Analytics and reporting
- Proctoring integration

### **3.2 Database Schema**

```sql
-- exam_db

CREATE TABLE exams (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER,  -- in minutes
  passing_score INTEGER,  -- percentage
  max_attempts INTEGER,
  is_published BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),  -- mcq, multiple_select, true_false, short_answer
  options JSONB,  -- Array of options for MCQ
  correct_answer JSONB,  -- Correct answer(s)
  explanation TEXT,
  difficulty VARCHAR(20),
  tags JSONB DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  UNIQUE(exam_id, question_id)
);

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  score INTEGER,  -- percentage
  status VARCHAR(20),  -- in_progress, submitted, graded
  time_taken INTEGER,  -- in seconds
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE exam_answers (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer JSONB,
  is_correct BOOLEAN,
  points_earned INTEGER,
  graded_by UUID,  -- User ID of grader (for manual grading)
  graded_at TIMESTAMP
);
```

### **3.3 API Endpoints**

```typescript
// Exam Management
POST   /exams                        // Create exam
GET    /exams                        // List exams (tenant-scoped)
GET    /exams/:id                    // Get exam details
PATCH  /exams/:id                    // Update exam
DELETE /exams/:id                    // Delete exam

// Question Bank
POST   /questions                    // Create question
GET    /questions                    // List questions (tenant-scoped)
POST   /exams/:id/questions          // Add question to exam

// Exam Attempts
POST   /exams/:id/attempts           // Start exam attempt
GET    /exams/:id/attempts/:attemptId  // Get attempt details
POST   /exams/:id/attempts/:attemptId/submit  // Submit exam
GET    /exams/:id/attempts/:attemptId/results  // Get results
```

---

## **4. PLACEMENT ENGINE**

### **4.1 Responsibilities**

- Job posting management
- Application tracking
- Interview scheduling
- Candidate evaluation
- Placement analytics
- Company management

### **4.2 Database Schema**

```sql
-- placement_db

CREATE TABLE companies (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  logo_url TEXT,
  description TEXT,
  industry VARCHAR(100),
  size VARCHAR(50),  -- 1-10, 11-50, 51-200, 201-500, 500+
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  location VARCHAR(255),
  job_type VARCHAR(50),  -- full_time, part_time, contract, internship
  experience_level VARCHAR(50),  -- entry, mid, senior
  salary_min INTEGER,
  salary_max INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  posted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status VARCHAR(50),  -- applied, screening, interview, offer, rejected, accepted
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interviews (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER,  -- in minutes
  interview_type VARCHAR(50),  -- phone, video, in_person
  interviewer_id UUID,  -- User ID from identity service
  meeting_link TEXT,
  notes TEXT,
  status VARCHAR(50),  -- scheduled, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3 API Endpoints**

```typescript
// Job Management
POST   /jobs                         // Create job posting
GET    /jobs                         // List jobs (tenant-scoped)
GET    /jobs/:id                     // Get job details
PATCH  /jobs/:id                     // Update job
DELETE /jobs/:id                     // Delete job

// Applications
POST   /jobs/:id/apply               // Apply for job
GET    /applications                 // List user applications
GET    /applications/:id             // Get application details
PATCH  /applications/:id/status      // Update application status

// Interviews
POST   /applications/:id/interviews  // Schedule interview
GET    /interviews                   // List interviews
PATCH  /interviews/:id               // Update interview
```

---

## **5. TRAINING ENGINE**

### **5.1 Responsibilities**

**Physical Training (SkillUp)**:
- Batch management
- Class scheduling
- Attendance tracking
- Instructor assignment
- Classroom management

**AI-Based Training (RealTutorialHub)**:
- Personalized learning paths
- AI tutor interactions
- Adaptive assessments
- Learning analytics
- Recommendation engine

### **5.2 Database Schema**

```sql
-- training_db

CREATE TABLE batches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  course_id UUID,  -- Reference to course in tutorial engine
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_students INTEGER,
  instructor_id UUID,  -- User ID from identity service
  status VARCHAR(50),  -- upcoming, ongoing, completed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE batch_students (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50),  -- active, completed, dropped
  UNIQUE(batch_id, user_id)
);

CREATE TABLE classes (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER,  -- in minutes
  location VARCHAR(255),  -- Physical location or meeting link
  instructor_id UUID,
  status VARCHAR(50),  -- scheduled, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(50),  -- present, absent, late
  marked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- AI Training specific
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  goal TEXT,
  current_level VARCHAR(50),
  target_level VARCHAR(50),
  recommended_tutorials JSONB DEFAULT '[]',
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  feedback_rating INTEGER,  -- 1-5
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5.3 API Endpoints**

```typescript
// Physical Training
POST   /batches                      // Create batch
GET    /batches                      // List batches
POST   /batches/:id/students         // Enroll student
POST   /classes                      // Schedule class
POST   /classes/:id/attendance       // Mark attendance

// AI Training
POST   /learning-paths               // Create learning path
GET    /learning-paths/:id           // Get learning path
POST   /ai-tutor/ask                 // Ask AI tutor
GET    /recommendations              // Get personalized recommendations
```

---

## **6. SERVICE COMMUNICATION**

### **6.1 Synchronous Communication (REST)**

```typescript
// Tutorial Engine calls Identity Service
GET https://identity-service/users/:userId
Authorization: Bearer <service-token>

// Exam Engine calls Tutorial Engine
GET https://tutorial-engine/tutorials/:tutorialId
Authorization: Bearer <service-token>
```

### **6.2 Asynchronous Communication (Events)**

```typescript
// Tutorial Engine publishes event
Event: tutorial.completed
{
  "userId": "user-uuid-123",
  "tenantId": "tenant-uuid-456",
  "tutorialId": "tutorial-uuid-789",
  "completedAt": "2024-05-04T10:00:00Z"
}

// Certification Engine subscribes to event
// Automatically issues certificate

// Notification Engine subscribes to event
// Sends congratulations email
```

### **6.3 Service-to-Service Authentication**

```typescript
// Each service has a service account
const serviceToken = jwt.sign(
  {
    sub: 'tutorial-engine',
    aud: 'identity-service',
    scope: ['users:read']
  },
  SERVICE_SECRET,
  { expiresIn: '5m' }
);

// Services validate service tokens
if (token.aud !== 'identity-service') {
  throw new Error('Invalid audience');
}
```

---

## **7. TENANT ISOLATION**

### **7.1 Application-Level Isolation**

```typescript
// Every query includes tenant_id filter
const tutorials = await db
  .select()
  .from(tutorials)
  .where(eq(tutorials.tenantId, tenantId));

// Middleware enforces tenant isolation
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenant ID' });
  }
  req.tenantId = tenantId;
  next();
});
```

### **7.2 Row-Level Security (PostgreSQL)**

```sql
-- Enable RLS on all tables
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON tutorials
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Set tenant context before queries
SET app.current_tenant_id = 'tenant-uuid-456';
```

---

## **8. DEPLOYMENT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│ KUBERNETES CLUSTER (GKE)                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NAMESPACE: identity                                     │ │
│ │ ├─ identity-service (3 replicas)                        │ │
│ │ └─ identity-db (PostgreSQL)                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NAMESPACE: tutorial                                     │ │
│ │ ├─ tutorial-engine (3 replicas)                         │ │
│ │ └─ tutorial-db (PostgreSQL)                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NAMESPACE: exam                                         │ │
│ │ ├─ exam-engine (3 replicas)                             │ │
│ │ └─ exam-db (PostgreSQL)                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ... (other services)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

**Continue to 04-API-GATEWAY.md for gateway architecture...**
