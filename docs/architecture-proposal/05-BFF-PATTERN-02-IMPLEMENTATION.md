# 05 - BFF PATTERN - PART 2
## Implementation Guide - SkillUp and RTH BFFs

---

## **1. SKILLUP BFF IMPLEMENTATION**

### **1.1 Project Structure**

```
services/skillup-bff/
├── src/
│   ├── index.ts                    # Entry point
│   ├── schema/
│   │   ├── schema.graphql          # GraphQL schema
│   │   └── index.ts                # Schema loader
│   ├── resolvers/
│   │   ├── index.ts                # Resolver aggregator
│   │   ├── dashboard.resolver.ts   # Dashboard queries
│   │   ├── tutorial.resolver.ts    # Tutorial queries
│   │   ├── exam.resolver.ts        # Exam queries
│   │   ├── placement.resolver.ts   # Placement queries
│   │   └── training.resolver.ts    # Training queries (SkillUp specific)
│   ├── clients/
│   │   ├── identity.client.ts      # Identity service client
│   │   ├── tutorial.client.ts      # Tutorial engine client
│   │   ├── exam.client.ts          # Exam engine client
│   │   ├── placement.client.ts     # Placement engine client
│   │   └── training.client.ts      # Training engine client
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── tenant.middleware.ts    # Tenant context
│   │   └── error.middleware.ts     # Error handling
│   ├── utils/
│   │   ├── cache.ts                # Redis caching
│   │   ├── logger.ts               # Logging
│   │   └── tracing.ts              # Distributed tracing
│   └── types/
│       └── context.ts              # GraphQL context types
├── Dockerfile
├── package.json
└── tsconfig.json
```

### **1.2 GraphQL Schema**

```graphql
# schema.graphql

# ============================================
# TYPES
# ============================================

type User {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  phone: String
  avatar: String
}

type Tutorial {
  id: ID!
  title: String!
  description: String
  duration: Int!
  difficulty: String!
  progress: Float!
  completed: Boolean!
  chapters: [Chapter!]!
}

type Chapter {
  id: ID!
  title: String!
  content: String!
  order: Int!
  completed: Boolean!
}

type Exam {
  id: ID!
  title: String!
  description: String
  duration: Int!
  totalQuestions: Int!
  passingScore: Int!
  status: ExamStatus!
  scheduledAt: String
  score: Float
}

enum ExamStatus {
  UPCOMING
  IN_PROGRESS
  COMPLETED
  EXPIRED
}

type Job {
  id: ID!
  title: String!
  company: String!
  location: String!
  salary: String
  type: String!
  description: String!
  requirements: [String!]!
  applied: Boolean!
}

type PhysicalTraining {
  id: ID!
  title: String!
  instructor: String!
  location: String!
  schedule: String!
  duration: Int!
  enrolled: Boolean!
  capacity: Int!
  enrolled_count: Int!
}

type UserProgress {
  completedTutorials: Int!
  totalTutorials: Int!
  completedExams: Int!
  averageScore: Float!
  totalLearningHours: Float!
}

type Dashboard {
  user: User!
  stats: UserProgress!
  recentTutorials: [Tutorial!]!
  upcomingExams: [Exam!]!
  jobRecommendations: [Job!]!
  physicalTraining: [PhysicalTraining!]!
}

# ============================================
# QUERIES
# ============================================

type Query {
  # Dashboard
  dashboard: Dashboard!
  
  # User
  me: User!
  
  # Tutorials
  tutorials(
    limit: Int
    offset: Int
    difficulty: String
    search: String
  ): [Tutorial!]!
  
  tutorial(id: ID!): Tutorial
  
  # Exams
  exams(
    status: ExamStatus
    limit: Int
    offset: Int
  ): [Exam!]!
  
  exam(id: ID!): Exam
  
  # Jobs
  jobs(
    location: String
    type: String
    limit: Int
    offset: Int
  ): [Job!]!
  
  job(id: ID!): Job
  
  # Physical Training (SkillUp specific)
  physicalTraining(
    location: String
    limit: Int
    offset: Int
  ): [PhysicalTraining!]!
  
  # Progress
  myProgress: UserProgress!
}

# ============================================
# MUTATIONS
# ============================================

type Mutation {
  # Tutorial
  startTutorial(tutorialId: ID!): Tutorial!
  completeTutorial(tutorialId: ID!): Tutorial!
  
  # Exam
  startExam(examId: ID!): Exam!
  submitExam(examId: ID!, answers: [AnswerInput!]!): Exam!
  
  # Job
  applyJob(jobId: ID!): Job!
  
  # Physical Training
  enrollTraining(trainingId: ID!): PhysicalTraining!
  cancelTraining(trainingId: ID!): PhysicalTraining!
}

input AnswerInput {
  questionId: ID!
  answer: String!
}
```

### **1.3 Resolvers Implementation**

#### **Dashboard Resolver**

```typescript
// src/resolvers/dashboard.resolver.ts

import { identityClient } from '../clients/identity.client';
import { tutorialClient } from '../clients/tutorial.client';
import { examClient } from '../clients/exam.client';
import { placementClient } from '../clients/placement.client';
import { trainingClient } from '../clients/training.client';
import { analyticsClient } from '../clients/analytics.client';
import { Context } from '../types/context';

export const dashboardResolver = {
  Query: {
    async dashboard(parent: any, args: any, context: Context) {
      const { userId, tenantId } = context;
      
      // Parallel service calls for better performance
      const [user, tutorials, exams, jobs, training, progress] = 
        await Promise.all([
          identityClient.getUser(userId),
          tutorialClient.getRecentTutorials(userId, tenantId, 5),
          examClient.getUpcomingExams(userId, tenantId, 5),
          placementClient.getJobRecommendations(userId, tenantId, 5),
          trainingClient.getPhysicalTraining(userId, tenantId, 5),
          analyticsClient.getUserProgress(userId, tenantId)
        ]);
      
      return {
        user,
        stats: progress,
        recentTutorials: tutorials,
        upcomingExams: exams,
        jobRecommendations: jobs,
        physicalTraining: training
      };
    }
  }
};
```

#### **Tutorial Resolver**

```typescript
// src/resolvers/tutorial.resolver.ts

import { tutorialClient } from '../clients/tutorial.client';
import { analyticsClient } from '../clients/analytics.client';
import { Context } from '../types/context';
import { cache } from '../utils/cache';

export const tutorialResolver = {
  Query: {
    async tutorials(
      parent: any,
      args: { limit?: number; offset?: number; difficulty?: string; search?: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { limit = 20, offset = 0, difficulty, search } = args;
      
      // Check cache
      const cacheKey = `tutorials:${tenantId}:${limit}:${offset}:${difficulty}:${search}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Fetch tutorials
      const tutorials = await tutorialClient.getTutorials(
        tenantId,
        { limit, offset, difficulty, search }
      );
      
      // Fetch user progress for each tutorial
      const tutorialIds = tutorials.map(t => t.id);
      const progress = await analyticsClient.getTutorialProgress(
        userId,
        tenantId,
        tutorialIds
      );
      
      // Combine tutorials with progress
      const result = tutorials.map(tutorial => ({
        ...tutorial,
        progress: progress[tutorial.id]?.percentage || 0,
        completed: progress[tutorial.id]?.completed || false
      }));
      
      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(result), 300);
      
      return result;
    },
    
    async tutorial(
      parent: any,
      args: { id: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { id } = args;
      
      // Fetch tutorial and progress in parallel
      const [tutorial, progress] = await Promise.all([
        tutorialClient.getTutorial(id, tenantId),
        analyticsClient.getTutorialProgress(userId, tenantId, [id])
      ]);
      
      return {
        ...tutorial,
        progress: progress[id]?.percentage || 0,
        completed: progress[id]?.completed || false
      };
    }
  },
  
  Mutation: {
    async startTutorial(
      parent: any,
      args: { tutorialId: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { tutorialId } = args;
      
      // Record tutorial start
      await analyticsClient.recordTutorialStart(userId, tenantId, tutorialId);
      
      // Return updated tutorial
      const [tutorial, progress] = await Promise.all([
        tutorialClient.getTutorial(tutorialId, tenantId),
        analyticsClient.getTutorialProgress(userId, tenantId, [tutorialId])
      ]);
      
      return {
        ...tutorial,
        progress: progress[tutorialId]?.percentage || 0,
        completed: false
      };
    },
    
    async completeTutorial(
      parent: any,
      args: { tutorialId: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { tutorialId } = args;
      
      // Record tutorial completion
      await analyticsClient.recordTutorialCompletion(
        userId,
        tenantId,
        tutorialId
      );
      
      // Invalidate cache
      await cache.del(`tutorials:${tenantId}:*`);
      
      // Return updated tutorial
      const tutorial = await tutorialClient.getTutorial(tutorialId, tenantId);
      
      return {
        ...tutorial,
        progress: 100,
        completed: true
      };
    }
  },
  
  // Field resolvers
  Tutorial: {
    async chapters(parent: any, args: any, context: Context) {
      const { userId, tenantId } = context;
      
      // Fetch chapters
      const chapters = await tutorialClient.getChapters(
        parent.id,
        tenantId
      );
      
      // Fetch chapter progress
      const chapterIds = chapters.map(c => c.id);
      const progress = await analyticsClient.getChapterProgress(
        userId,
        tenantId,
        chapterIds
      );
      
      // Combine chapters with progress
      return chapters.map(chapter => ({
        ...chapter,
        completed: progress[chapter.id]?.completed || false
      }));
    }
  }
};
```

#### **Exam Resolver**

```typescript
// src/resolvers/exam.resolver.ts

import { examClient } from '../clients/exam.client';
import { Context } from '../types/context';

export const examResolver = {
  Query: {
    async exams(
      parent: any,
      args: { status?: string; limit?: number; offset?: number },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { status, limit = 20, offset = 0 } = args;
      
      return await examClient.getExams(
        userId,
        tenantId,
        { status, limit, offset }
      );
    },
    
    async exam(
      parent: any,
      args: { id: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { id } = args;
      
      return await examClient.getExam(id, userId, tenantId);
    }
  },
  
  Mutation: {
    async startExam(
      parent: any,
      args: { examId: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { examId } = args;
      
      return await examClient.startExam(examId, userId, tenantId);
    },
    
    async submitExam(
      parent: any,
      args: { examId: string; answers: any[] },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { examId, answers } = args;
      
      return await examClient.submitExam(examId, userId, tenantId, answers);
    }
  }
};
```

#### **Physical Training Resolver (SkillUp Specific)**

```typescript
// src/resolvers/training.resolver.ts

import { trainingClient } from '../clients/training.client';
import { Context } from '../types/context';

export const trainingResolver = {
  Query: {
    async physicalTraining(
      parent: any,
      args: { location?: string; limit?: number; offset?: number },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { location, limit = 20, offset = 0 } = args;
      
      return await trainingClient.getPhysicalTraining(
        userId,
        tenantId,
        { location, limit, offset }
      );
    }
  },
  
  Mutation: {
    async enrollTraining(
      parent: any,
      args: { trainingId: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { trainingId } = args;
      
      return await trainingClient.enrollTraining(
        trainingId,
        userId,
        tenantId
      );
    },
    
    async cancelTraining(
      parent: any,
      args: { trainingId: string },
      context: Context
    ) {
      const { userId, tenantId } = context;
      const { trainingId } = args;
      
      return await trainingClient.cancelTraining(
        trainingId,
        userId,
        tenantId
      );
    }
  }
};
```

### **1.4 Service Clients**

#### **Identity Client**

```typescript
// src/clients/identity.client.ts

import axios from 'axios';
import { logger } from '../utils/logger';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;

export const identityClient = {
  async getUser(userId: string) {
    try {
      const response = await axios.get(
        `${IDENTITY_SERVICE_URL}/users/${userId}`,
        {
          headers: {
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get user', { userId, error });
      throw error;
    }
  },
  
  async updateUser(userId: string, data: any) {
    try {
      const response = await axios.patch(
        `${IDENTITY_SERVICE_URL}/users/${userId}`,
        data,
        {
          headers: {
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update user', { userId, error });
      throw error;
    }
  }
};
```

#### **Tutorial Client**

```typescript
// src/clients/tutorial.client.ts

import axios from 'axios';
import { logger } from '../utils/logger';

const TUTORIAL_ENGINE_URL = process.env.TUTORIAL_ENGINE_URL;

export const tutorialClient = {
  async getTutorials(
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      difficulty?: string;
      search?: string;
    }
  ) {
    try {
      const response = await axios.get(
        `${TUTORIAL_ENGINE_URL}/tutorials`,
        {
          params: options,
          headers: {
            'X-Tenant-ID': tenantId,
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get tutorials', { tenantId, options, error });
      throw error;
    }
  },
  
  async getTutorial(tutorialId: string, tenantId: string) {
    try {
      const response = await axios.get(
        `${TUTORIAL_ENGINE_URL}/tutorials/${tutorialId}`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get tutorial', { tutorialId, tenantId, error });
      throw error;
    }
  },
  
  async getRecentTutorials(
    userId: string,
    tenantId: string,
    limit: number
  ) {
    try {
      const response = await axios.get(
        `${TUTORIAL_ENGINE_URL}/users/${userId}/tutorials/recent`,
        {
          params: { limit },
          headers: {
            'X-Tenant-ID': tenantId,
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get recent tutorials', { 
        userId, 
        tenantId, 
        limit, 
        error 
      });
      throw error;
    }
  },
  
  async getChapters(tutorialId: string, tenantId: string) {
    try {
      const response = await axios.get(
        `${TUTORIAL_ENGINE_URL}/tutorials/${tutorialId}/chapters`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
            'X-Service': 'skillup-bff'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get chapters', { tutorialId, tenantId, error });
      throw error;
    }
  }
};
```

### **1.5 Server Setup**

```typescript
// src/index.ts

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { readFileSync } from 'fs';
import { join } from 'path';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { resolvers } from './resolvers';
import { logger } from './utils/logger';
import { Context } from './types/context';

// Load GraphQL schema
const typeDefs = readFileSync(
  join(__dirname, 'schema/schema.graphql'),
  'utf-8'
);

// Create Apollo Server
const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  formatError: (error) => {
    logger.error('GraphQL error', { error });
    return error;
  }
});

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  // Start Apollo Server
  await server.start();
  
  // GraphQL endpoint
  app.use(
    '/graphql',
    authMiddleware,
    tenantMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => {
        return {
          userId: req.user.userId,
          tenantId: req.tenant.id,
          tenantSlug: req.tenant.slug,
          user: req.user
        };
      }
    })
  );
  
  // Error handling
  app.use(errorMiddleware);
  
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    logger.info(`SkillUp BFF running on port ${PORT}`);
    logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
```

### **1.6 Middleware**

#### **Authentication Middleware**

```typescript
// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // Attach user to request
    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      roles: payload.roles,
      permissions: payload.permissions
    };
    
    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### **Tenant Middleware**

```typescript
// src/middleware/tenant.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user.tenantId;
    
    // Get tenant from cache
    const cacheKey = `tenant:${tenantId}`;
    let tenant = await cache.get(cacheKey);
    
    if (!tenant) {
      // Fetch tenant from database (or identity service)
      // For now, hardcode SkillUp tenant
      tenant = {
        id: tenantId,
        slug: 'skillup',
        name: 'SkillUp IT Academy',
        domain: 'skillupitacademy.com'
      };
      
      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(tenant), 300);
    } else {
      tenant = JSON.parse(tenant);
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    
    next();
  } catch (error) {
    logger.error('Tenant resolution failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

**Continue to 05-BFF-PATTERN-03-RTH-BFF.md for RTH BFF implementation...**
