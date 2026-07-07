# @quiz/db-skillhubcore

Database package for SkillHubCore educational hierarchy management.

## Overview

This package provides the database schema and migrations for the educational hierarchy system in SkillHubCore Admin. It adds 6 new tables to the existing SkillHubCore PostgreSQL database.

## 📊 Tables Added to Existing Database

1. **domains** - Top-level educational categories
2. **subjects** - Subjects within domains
3. **topics** - Topics within subjects (with complexity/weight)
4. **subtopics** - Subtopics within topics (with depth levels)
5. **skills** - Cross-cutting competencies
6. **topic_skills** - Many-to-many junction table

## 🚀 Quick Start

### 1. Configure Database Connection

Add to your `.env.local` file in the workspace root:

```bash
# Existing SkillHubCore PostgreSQL Database (VPS)
SKILLHUBCORE_DATABASE_URL="postgresql://username:password@your-vps-ip:5432/skillhubcore_db?sslmode=require"
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Generate Migrations

```bash
pnpm --filter @quiz/db-skillhubcore db:generate
```

### 4. Run Migrations

```bash
pnpm --filter @quiz/db-skillhubcore db:migrate
```

This will add the 6 new tables to your existing SkillHubCore database.

## 📚 Database Schema

### Hierarchical Structure
```
domains (1:N) → subjects (1:N) → topics (1:N) → subtopics
       ↓
  topics (M:N) → skills (via topic_skills)
```

### Key Features
- **Cascading deletes**: Maintains referential integrity
- **Indexed foreign keys**: Optimized query performance
- **Soft deletion**: `deleted_at` timestamps
- **Status tracking**: `draft`, `active`, `archived`, `deleted`
- **Ordering**: `order` field for custom sorting
- **Complexity levels**: `beginner`, `intermediate`, `advanced`, `expert`

## 🔧 Usage

### Import in Your Application

```typescript
import { db, domains, subjects, topics, skills } from '@quiz/db-skillhubcore';

// Query domains
const allDomains = await db.select().from(domains);

// Insert a new domain
await db.insert(domains).values({
  name: 'Computer Science',
  category: 'technical',
  status: 'active',
});

// Query with relations
const domainsWithSubjects = await db.query.domains.findMany({
  with: {
    subjects: {
      with: {
        topics: true,
      },
    },
  },
});
```

### Type Safety

```typescript
import type { Domain, InsertDomain } from '@quiz/db-skillhubcore';

// Type-safe queries and inserts
const domain: Domain = await db.select().from(domains).where(eq(domains.id, domainId));
const newDomain: InsertDomain = { name: 'Mathematics', category: 'academic' };
```

## 🛠 Development

### Generate Migrations
```bash
pnpm db:generate
```

### Run Migrations
```bash
pnpm db:migrate
```

### Push Schema Changes (Development)
```bash
pnpm db:push
```

### Open Drizzle Studio
```bash
pnpm db:studio
```

## 📝 Notes

- This package uses **existing SkillHubCore database** - no new database is created
- Tables **coexist** with existing SkillHubCore tables
- Uses `pg` (node-postgres) for PostgreSQL connectivity
- Designed for **VPS deployment** (not serverless/Neon)
- All tables have proper indexes for performance optimization

## 🔒 Security

- Uses parameterized queries to prevent SQL injection
- Connection pooling for efficient resource usage
- Environment-based configuration
- No hardcoded credentials