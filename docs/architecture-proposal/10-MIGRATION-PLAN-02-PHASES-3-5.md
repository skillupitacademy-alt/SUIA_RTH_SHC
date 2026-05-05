# 10 - MIGRATION PLAN (PART 2)
## Phases 3-5 and Success Criteria

---

## **4. PHASE 3: API GATEWAY**

**Duration**: 1 month  
**Goal**: Deploy Kong Gateway, migrate from Cloudflare Worker  
**Risk**: Medium

### **4.1 Week 1-2: Gateway Setup**

**Tasks**:
- [ ] Deploy Kong Gateway on Cloud Run
- [ ] Configure routes for all services
- [ ] Implement authentication plugin
- [ ] Implement rate limiting
- [ ] Set up monitoring

**Kong Configuration**:

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: identity-service
    url: https://identity-service-xxx.run.app
    routes:
      - name: identity-routes
        paths:
          - /auth
          - /users
        methods:
          - GET
          - POST
          - PUT
          - DELETE
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: cors
        config:
          origins:
            - https://skillup.com
            - https://realtutorialhub.com
          methods:
            - GET
            - POST
            - PUT
            - DELETE
          headers:
            - Authorization
            - Content-Type
          credentials: true

  - name: tutorial-service
    url: https://tutorial-service-xxx.run.app
    routes:
      - name: tutorial-routes
        paths:
          - /tutorials
        methods:
          - GET
          - POST
          - PUT
          - DELETE
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
          key_claim_name: kid
      - name: rate-limiting
        config:
          minute: 200
          policy: local

  - name: exam-service
    url: https://exam-service-xxx.run.app
    routes:
      - name: exam-routes
        paths:
          - /exams
        methods:
          - GET
          - POST
          - PUT
          - DELETE
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
      - name: rate-limiting
        config:
          minute: 150
          policy: local

  - name: placement-service
    url: https://placement-service-xxx.run.app
    routes:
      - name: placement-routes
        paths:
          - /placements
          - /companies
          - /applications
        methods:
          - GET
          - POST
          - PUT
          - DELETE
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
      - name: rate-limiting
        config:
          minute: 100
          policy: local

  - name: skillup-bff
    url: https://skillup-bff-xxx.run.app
    routes:
      - name: skillup-bff-routes
        paths:
          - /graphql
        hosts:
          - skillup.com
        methods:
          - POST
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
      - name: rate-limiting
        config:
          minute: 500
          policy: local

  - name: rth-bff
    url: https://rth-bff-xxx.run.app
    routes:
      - name: rth-bff-routes
        paths:
          - /graphql
        hosts:
          - realtutorialhub.com
        methods:
          - POST
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
      - name: rate-limiting
        config:
          minute: 500
          policy: local

plugins:
  - name: prometheus
    config:
      per_consumer: true
  
  - name: request-transformer
    config:
      add:
        headers:
          - X-Gateway-Version:1.0
```

**Deploy Kong**:

```bash
# Deploy Kong on Cloud Run
gcloud run deploy kong-gateway \
  --image kong:3.4 \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 2 \
  --max-instances 200 \
  --memory 1Gi \
  --cpu 2 \
  --set-env-vars "KONG_DATABASE=off,KONG_DECLARATIVE_CONFIG=/kong.yml" \
  --set-secrets "KONG_ADMIN_TOKEN=kong-admin-token:latest"

# Configure Kong
curl -X POST https://kong-gateway-xxx.run.app/config \
  -H "Kong-Admin-Token: ${KONG_ADMIN_TOKEN}" \
  -F config=@kong.yml
```

**Deliverables**:
- Kong Gateway deployed
- All routes configured
- Monitoring enabled

**Team**:
- Backend Engineers (2): Configuration
- DevOps Engineer: Deployment

### **4.2 Week 3: Traffic Migration**

**Tasks**:
- [ ] Update DNS to point to Kong Gateway
- [ ] Route 10% traffic through Kong
- [ ] Monitor performance and errors
- [ ] Gradually increase to 100%

**Traffic Migration Plan**:

```
Day 1: 10% traffic through Kong
├─ Monitor error rate
├─ Monitor latency
└─ Check logs for issues

Day 2: 25% traffic through Kong
├─ Monitor error rate
├─ Monitor latency
└─ Check logs for issues

Day 3: 50% traffic through Kong
├─ Monitor error rate
├─ Monitor latency
└─ Check logs for issues

Day 4: 75% traffic through Kong
├─ Monitor error rate
├─ Monitor latency
└─ Check logs for issues

Day 5: 100% traffic through Kong
├─ Monitor error rate
├─ Monitor latency
└─ Decommission Cloudflare Worker
```

**Deliverables**:
- 100% traffic through Kong Gateway
- Cloudflare Worker decommissioned
- Performance metrics

**Team**:
- DevOps Engineer: Traffic migration
- Backend Engineers (2): Monitoring

### **4.3 Week 4: Optimization**

**Tasks**:
- [ ] Tune Kong configuration
- [ ] Optimize rate limits
- [ ] Add caching where appropriate
- [ ] Document gateway usage

**Deliverables**:
- Optimized gateway configuration
- Documentation
- Performance report

**Team**:
- Backend Engineers (2): Optimization
- DevOps Engineer: Monitoring

---

## **5. PHASE 4: BFF IMPLEMENTATION**

**Duration**: 1-2 months  
**Goal**: Implement BFFs for SkillUp and RealTutorialHub  
**Risk**: Low-Medium

### **5.1 Week 1-2: SkillUp BFF Development**

**Tasks**:
- [ ] Create SkillUp BFF repository
- [ ] Design GraphQL schema
- [ ] Implement resolvers
- [ ] Implement service clients
- [ ] Write unit tests

**GraphQL Schema**:

```graphql
# SkillUp BFF Schema
type Query {
  # Dashboard
  dashboard: Dashboard!
  
  # Tutorials
  tutorials(page: Int, limit: Int, difficulty: Difficulty): TutorialConnection!
  tutorial(id: ID!): Tutorial
  
  # Exams
  exams(page: Int, limit: Int): ExamConnection!
  exam(id: ID!): Exam
  
  # Placements
  placements(page: Int, limit: Int): PlacementConnection!
  placement(id: ID!): Placement
  
  # User
  me: User!
}

type Mutation {
  # Tutorials
  enrollInTutorial(tutorialId: ID!): Enrollment!
  updateTutorialProgress(tutorialId: ID!, sectionId: ID!, progress: Int!): Progress!
  
  # Exams
  startExam(examId: ID!): ExamAttempt!
  submitExam(attemptId: ID!, answers: [AnswerInput!]!): ExamResult!
  
  # Placements
  applyToJob(jobId: ID!, resume: Upload!): Application!
}

type Dashboard {
  user: User!
  stats: DashboardStats!
  recentTutorials: [Tutorial!]!
  upcomingExams: [Exam!]!
  applications: [Application!]!
}

type DashboardStats {
  tutorialsCompleted: Int!
  examsAttempted: Int!
  averageScore: Float!
  applicationsSubmitted: Int!
}

type Tutorial {
  id: ID!
  title: String!
  description: String
  thumbnail: String
  difficulty: Difficulty!
  duration: Int!
  sections: [TutorialSection!]!
  progress: Progress
  rating: Float
}

type Exam {
  id: ID!
  title: String!
  description: String
  duration: Int!
  totalQuestions: Int!
  passingScore: Int!
  attempts: [ExamAttempt!]!
}

type Placement {
  id: ID!
  company: Company!
  title: String!
  description: String
  location: String
  salary: String
  requirements: [String!]!
  applied: Boolean!
}
```

**Resolver Implementation**:

```typescript
// SkillUp BFF Resolvers
export const resolvers = {
  Query: {
    dashboard: async (_, __, { user, services }) => {
      // Parallel requests to multiple services
      const [userDetails, tutorials, exams, applications] = await Promise.all([
        services.identity.getUser(user.id),
        services.tutorial.getRecentTutorials(user.id, { limit: 5 }),
        services.exam.getUpcomingExams(user.id, { limit: 5 }),
        services.placement.getApplications(user.id, { limit: 5 })
      ]);
      
      // Calculate stats
      const stats = {
        tutorialsCompleted: tutorials.filter(t => t.completed).length,
        examsAttempted: exams.filter(e => e.attempted).length,
        averageScore: calculateAverageScore(exams),
        applicationsSubmitted: applications.length
      };
      
      return {
        user: userDetails,
        stats: stats,
        recentTutorials: tutorials,
        upcomingExams: exams,
        applications: applications
      };
    },
    
    tutorials: async (_, { page = 1, limit = 20, difficulty }, { user, services }) => {
      const result = await services.tutorial.getTutorials({
        page,
        limit,
        difficulty,
        tenantId: user.tenantId
      });
      
      return {
        edges: result.data.map(tutorial => ({
          node: tutorial,
          cursor: tutorial.id
        })),
        pageInfo: {
          hasNextPage: result.data.length === limit,
          endCursor: result.data[result.data.length - 1]?.id
        }
      };
    },
    
    tutorial: async (_, { id }, { user, services }) => {
      const tutorial = await services.tutorial.getTutorial(id);
      
      // Get user's progress
      const progress = await services.tutorial.getProgress(user.id, id);
      
      return {
        ...tutorial,
        progress: progress
      };
    }
  },
  
  Mutation: {
    enrollInTutorial: async (_, { tutorialId }, { user, services }) => {
      const enrollment = await services.tutorial.enroll({
        userId: user.id,
        tutorialId: tutorialId,
        tenantId: user.tenantId
      });
      
      return enrollment;
    },
    
    startExam: async (_, { examId }, { user, services }) => {
      const attempt = await services.exam.startAttempt({
        userId: user.id,
        examId: examId,
        tenantId: user.tenantId
      });
      
      return attempt;
    },
    
    submitExam: async (_, { attemptId, answers }, { user, services }) => {
      const result = await services.exam.submitAttempt({
        attemptId: attemptId,
        answers: answers,
        userId: user.id
      });
      
      return result;
    }
  }
};
```

**Deliverables**:
- SkillUp BFF implementation
- GraphQL schema and resolvers
- Unit tests

**Team**:
- Backend Engineers (2): Development
- Frontend Engineers (1): Schema review

### **5.2 Week 3-4: RealTutorialHub BFF Development**

**Tasks**:
- [ ] Create RTH BFF repository
- [ ] Design GraphQL schema (AI training specific)
- [ ] Implement resolvers
- [ ] Implement service clients
- [ ] Write unit tests

**Deliverables**:
- RTH BFF implementation
- GraphQL schema and resolvers
- Unit tests

**Team**:
- Backend Engineers (2): Development
- Frontend Engineers (1): Schema review

### **5.3 Week 5-6: Frontend Integration**

**Tasks**:
- [ ] Update SkillUp frontend to use BFF
- [ ] Update RTH frontend to use BFF
- [ ] Replace REST calls with GraphQL
- [ ] Test all features
- [ ] Performance testing

**Frontend Integration**:

```typescript
// Before: Multiple REST calls
async function loadDashboard() {
  const [user, tutorials, exams, applications] = await Promise.all([
    fetch('/api/users/me'),
    fetch('/api/tutorials?limit=5'),
    fetch('/api/exams?upcoming=true&limit=5'),
    fetch('/api/applications?limit=5')
  ]);
  
  // 4 API calls, 4 round trips
}

// After: Single GraphQL call
async function loadDashboard() {
  const result = await graphql(`
    query Dashboard {
      dashboard {
        user {
          id
          name
          email
          avatar
        }
        stats {
          tutorialsCompleted
          examsAttempted
          averageScore
          applicationsSubmitted
        }
        recentTutorials {
          id
          title
          thumbnail
          progress {
            percent
            completed
          }
        }
        upcomingExams {
          id
          title
          scheduledAt
          duration
        }
        applications {
          id
          company {
            name
            logo
          }
          title
          status
        }
      }
    }
  `);
  
  // 1 API call, 1 round trip ✅
}
```

**Deliverables**:
- Frontend integrated with BFFs
- Performance improvements measured
- All features working

**Team**:
- Frontend Engineers (2): Integration
- Backend Engineers (1): Support
- QA Engineer: Testing

### **5.4 Week 7-8: Performance Optimization**

**Tasks**:
- [ ] Add DataLoader for batching
- [ ] Implement caching
- [ ] Optimize database queries
- [ ] Measure performance improvements

**DataLoader Implementation**:

```typescript
// DataLoader for batching user requests
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (userIds: string[]) => {
  const users = await services.identity.getUsersByIds(userIds);
  
  // Return users in same order as userIds
  return userIds.map(id => users.find(u => u.id === id));
});

// Usage in resolver
const tutorial = await services.tutorial.getTutorial(id);
const author = await userLoader.load(tutorial.createdBy);  // Batched!
```

**Deliverables**:
- Optimized BFF performance
- Performance report
- Caching strategy

**Team**:
- Backend Engineers (2): Optimization
- DevOps Engineer: Monitoring

---

## **6. PHASE 5: ADVANCED FEATURES**

**Duration**: 2-3 months  
**Goal**: Event sourcing, CQRS, Saga pattern  
**Risk**: Low

### **6.1 Month 1: Event Sourcing**

**Tasks**:
- [ ] Implement event store
- [ ] Add event sourcing to critical aggregates
- [ ] Implement event replay
- [ ] Test event sourcing

**Deliverables**:
- Event store implementation
- Event-sourced aggregates
- Event replay capability

**Team**:
- Backend Engineers (2): Implementation

### **6.2 Month 2: CQRS**

**Tasks**:
- [ ] Separate read and write models
- [ ] Implement projections
- [ ] Optimize read models
- [ ] Test CQRS

**Deliverables**:
- CQRS implementation
- Optimized read models
- Performance improvements

**Team**:
- Backend Engineers (2): Implementation

### **6.3 Month 3: Saga Pattern**

**Tasks**:
- [ ] Implement saga orchestrator
- [ ] Add compensating transactions
- [ ] Test distributed transactions
- [ ] Document saga patterns

**Deliverables**:
- Saga pattern implementation
- Distributed transaction support
- Documentation

**Team**:
- Backend Engineers (2): Implementation

---

## **7. SUCCESS CRITERIA**

### **7.1 Technical Metrics**

```
Performance:
├─ Page load time: <500ms (target: 320ms)
├─ API response time (p95): <200ms
├─ Database query time (p95): <50ms
└─ BFF response time (p95): <100ms

Reliability:
├─ Uptime: >99.9%
├─ Error rate: <0.1%
├─ Failed deployments: <1%
└─ Rollback rate: <5%

Scalability:
├─ Concurrent users: 10,000+
├─ Requests per second: 1,000+
├─ Database connections: <100 per service
└─ Auto-scaling: <30 seconds

Security:
├─ Authentication: JWT with 7-day expiry
├─ Authorization: RBAC with tenant isolation
├─ Data encryption: TLS 1.3
└─ Secrets: Google Secret Manager
```

### **7.2 Business Metrics**

```
User Experience:
├─ Login success rate: >99%
├─ Page load satisfaction: >90%
├─ Feature availability: >99.9%
└─ User complaints: <5 per week

Development Velocity:
├─ Deployment frequency: Daily
├─ Lead time: <1 day
├─ Mean time to recovery: <1 hour
└─ Change failure rate: <5%

Cost Efficiency:
├─ Infrastructure cost: <$1,000/month
├─ Cost per user: <$0.30
├─ Cost per request: <$0.0001
└─ ROI: Positive within 6 months
```

### **7.3 Migration Success Criteria**

```
Phase 1 (Identity):
├─ [ ] All users migrated
├─ [ ] Zero data loss
├─ [ ] Login success rate >99%
└─ [ ] No increase in support tickets

Phase 2 (Services):
├─ [ ] All services extracted
├─ [ ] All data migrated
├─ [ ] No feature regressions
└─ [ ] Performance improved

Phase 3 (Gateway):
├─ [ ] 100% traffic through Kong
├─ [ ] Cloudflare Worker decommissioned
├─ [ ] No increase in latency
└─ [ ] Rate limiting working

Phase 4 (BFF):
├─ [ ] Both BFFs deployed
├─ [ ] Frontend integrated
├─ [ ] Page load time improved by 66%
└─ [ ] User satisfaction >90%

Phase 5 (Advanced):
├─ [ ] Event sourcing implemented
├─ [ ] CQRS implemented
├─ [ ] Saga pattern implemented
└─ [ ] Documentation complete
```

---

## **8. RISK MANAGEMENT**

### **8.1 Risk Matrix**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Backup before migration, test on staging |
| Service downtime | Medium | High | Phased rollout, rollback plan |
| Performance degradation | Medium | Medium | Load testing, monitoring |
| Team capacity | High | Medium | Hire contractors, reduce scope |
| Budget overrun | Medium | Medium | Track costs weekly, adjust scope |
| User resistance | Low | Low | Communication, training |

### **8.2 Rollback Plans**

**Phase 1 (Identity)**:
```
If issues detected:
├─ Stop dual-write
├─ Switch authentication back to old databases
├─ Keep Identity Service for investigation
└─ Resume after fixing issues
```

**Phase 2 (Services)**:
```
If issues detected:
├─ Route traffic back to monolith
├─ Keep new service for investigation
├─ Fix issues
└─ Retry migration
```

**Phase 3 (Gateway)**:
```
If issues detected:
├─ Update DNS to point back to Cloudflare Worker
├─ Keep Kong Gateway for investigation
├─ Fix issues
└─ Retry migration
```

**Phase 4 (BFF)**:
```
If issues detected:
├─ Switch frontend back to REST APIs
├─ Keep BFFs for investigation
├─ Fix issues
└─ Retry migration
```

---

## **9. COMMUNICATION PLAN**

### **9.1 Stakeholder Updates**

```
Weekly:
├─ Progress report to leadership
├─ Metrics dashboard
└─ Blocker escalation

Bi-weekly:
├─ Demo to stakeholders
├─ User feedback session
└─ Risk review

Monthly:
├─ Executive summary
├─ Budget review
└─ Timeline adjustment
```

### **9.2 User Communication**

```
Before Migration:
├─ Announcement email
├─ Feature preview
└─ FAQ document

During Migration:
├─ Status updates
├─ Maintenance notifications
└─ Support availability

After Migration:
├─ Success announcement
├─ New features highlight
└─ Feedback survey
```

---

## **10. SUMMARY**

### **10.1 Migration Timeline**

```
Month 1-3: Identity Consolidation
Month 4-7: Service Extraction
Month 8: API Gateway
Month 9-10: BFF Implementation
Month 11-12: Advanced Features
```

### **10.2 Total Investment**

```
Team: 8-10 engineers × 12 months
Infrastructure: +$315/month
Total Cost: ~$800K-$1.2M
ROI: Positive within 6 months
```

### **10.3 Expected Outcomes**

✅ **10x Scalability**: 1,000 → 10,000 concurrent users  
✅ **66% Faster**: 940ms → 320ms page load time  
✅ **40% Faster Development**: Daily deployments  
✅ **70% Fewer Incidents**: Service isolation  
✅ **52% Lower Cost per User**: $0.63 → $0.30

---

**Migration Complete! 🎉**

You now have a world-class, FAANG/MAANG-level architecture that can scale to millions of users while reducing costs and improving developer productivity.

