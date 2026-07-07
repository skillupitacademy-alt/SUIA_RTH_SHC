# SkillHubCore VPS Migration Updates - Summary

This document summarizes all the changes made to the SkillHubCore migration documentation to reflect **VPS deployment** and **existing database** usage instead of Vercel/Neon.

---

## 🎯 Key Changes Overview

### Infrastructure Changes
- **FROM**: Vercel deployment + Neon/Supabase database
- **TO**: VPS deployment (Ubuntu/Debian) + Existing SkillHubCore PostgreSQL database

### Database Changes
- **FROM**: Create new database for SkillHubCore Admin
- **TO**: Add 6 new tables to existing SkillHubCore database

### Technology Stack Changes
- **FROM**: `@neondatabase/serverless` + `drizzle-orm/neon-serverless`
- **TO**: `pg` (node-postgres) + `drizzle-orm/node-postgres`

---

## 📝 Files Updated

### 1. SKILLHUBCORE_QUICK_START.md ✅
**Sections Updated:**
- **Database Setup**: Changed from Neon to standard PostgreSQL
- **Package Dependencies**: Updated from `@neondatabase/serverless` to `pg`
- **Database Connection**: Updated connection pooling for VPS
- **Drizzle Import**: Changed from `drizzle-orm/neon-serverless` to `drizzle-orm/node-postgres`

**Key Changes:**
```typescript
// OLD
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

// NEW
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
```

---

### 2. SKILLHUBCORE_HIERARCHY_MIGRATION_ROADMAP.md ✅
**Sections Updated:**

#### Phase 1: Database Setup
- Updated database package dependencies to use `pg` instead of `@neondatabase/serverless`
- Clarified that tables are added to existing SkillHubCore database
- Added note about coexistence with existing tables

#### Phase 8: Deployment
- **Removed**: Vercel deployment instructions
- **Added**: VPS deployment with PM2 + Nginx configuration
- **Added**: Complete ecosystem.config.js example for PM2
- **Added**: Complete Nginx configuration example
- **Added**: SSL setup via Certbot (Let's Encrypt)
- **Added**: Deployment steps for VPS (build, upload, PM2 startup)

#### Phase 9: Post-Deployment
- Updated CI/CD pipeline from GitHub Actions → Vercel to GitHub Actions → VPS via SSH
- Added SSH deployment workflow example
- Updated monitoring and logging for VPS environment

#### Cost Estimates
- **Updated**: From $20-50/month (Vercel + Neon) to $0-20/month additional (using existing infrastructure)

#### Database Connection
- Updated all database connection examples to use standard PostgreSQL Pool
- Removed serverless-specific connection patterns

---

### 3. SKILLHUBCORE_MIGRATION_SUMMARY.md ✅
**Sections Updated:**

#### Infrastructure Section
- Changed deployment platform from Vercel to VPS
- Changed database from Neon to existing SkillHubCore PostgreSQL
- Updated technology stack table

#### Deployment Architecture
- Updated to show VPS + Nginx + PM2 architecture
- Removed Vercel/serverless references

#### Cost Estimates
- Updated from $20-50/month to $0-20/month additional
- Noted use of existing VPS and database infrastructure

---

### 4. SKILLHUBCORE_ARCHITECTURE.md ✅
**Sections Updated:**

#### Deployment Architecture Diagram
- **Replaced**: Vercel/Cloud Run diagram
- **Added**: Complete VPS deployment architecture showing:
  - Internet/DNS layer
  - Nginx reverse proxy (SSL termination, static files)
  - PM2 process manager (clustering, auto-restart)
  - Next.js application (port 3007)
  - Existing PostgreSQL database with new tables

#### VPS Deployment Stack
- **Added**: Complete technology stack for VPS deployment
- **Added**: PM2 ecosystem.config.js example
- **Added**: Nginx configuration file example with SSL

#### Database Architecture
- Updated to show existing SkillHubCore database
- Clarified 6 new tables coexist with existing tables

---

### 5. SKILLHUBCORE_MIGRATION_CHECKLIST.md ✅
**Sections Updated:**

#### Infrastructure Checklist
- **Removed**: Vercel/Cloud platform setup
- **Added**: VPS-specific items (Nginx, PM2, SSH access)
- **Updated**: Database from "create new" to "access existing"

#### Deployment Checklist
- **Added**: VPS Server Configuration section with 15 items:
  - Server user setup
  - Firewall configuration (UFW)
  - Security hardening (fail2ban)
  - PM2 configuration
  - Nginx site setup
  - SSL certificate automation
  - Log rotation
  - Auto-start configuration

#### Production Deployment
- **Replaced**: Generic cloud deployment steps
- **Added**: Specific VPS deployment commands:
  - `pm2 start ecosystem.config.js`
  - `pm2 startup` & `pm2 save`
  - `sudo nginx -t`
  - `sudo systemctl reload nginx`
  - Certbot SSL commands

---

### 6. SKILLHUBCORE_README.md ✅
**Status**: No changes needed
- Already deployment-agnostic
- Focuses on documentation navigation
- No specific Vercel/Neon references found

---

## 🔧 Technical Implementation Changes

### Database Connection Pattern

**Before (Neon Serverless):**
```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Neon-specific options
});
```

**After (Standard PostgreSQL):**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.SKILLHUBCORE_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Package Dependencies

**Before:**
```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.30.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "drizzle-orm": "^0.30.0"
  }
}
```

### Deployment Process

**Before (Vercel):**
```bash
# Push to main branch
git push origin main

# Automatic deployment via Vercel integration
# Done!
```

**After (VPS):**
```bash
# 1. Build locally or in CI
pnpm build

# 2. Upload to VPS
rsync -avz --exclude node_modules ./ user@vps:/var/www/skillhubcore-admin/

# 3. Install dependencies on VPS
ssh user@vps "cd /var/www/skillhubcore-admin && pnpm install --prod"

# 4. Start/restart with PM2
ssh user@vps "pm2 restart skillhubcore-admin"
```

---

## 📊 Database Schema Updates

### New Tables Added to Existing SkillHubCore Database

The migration adds **6 new tables** to the existing `skillhubcore_db`:

1. **domains** - Top-level educational categories
2. **subjects** - Subjects within domains
3. **topics** - Topics within subjects (with complexity/weight)
4. **subtopics** - Subtopics within topics (with depth levels)
5. **skills** - Cross-cutting competencies
6. **topic_skills** - Many-to-many junction table

### Coexistence with Existing Tables

These tables **coexist** with existing SkillHubCore tables:
- `users`
- `sessions`
- `courses`
- `enrollments`
- (and all other existing tables)

**No existing tables are modified or deleted.**

---

## 🚀 VPS Deployment Architecture

### Server Stack
```
┌─────────────────────────────────────┐
│   admin.skillhubcore.in (HTTPS)     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Nginx (Reverse Proxy)              │
│  • Port 443 (SSL)                   │
│  • Let's Encrypt Certificate        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  PM2 (Process Manager)              │
│  • 2 instances (cluster mode)       │
│  • Auto-restart                     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Next.js App (Port 3007)            │
│  • Server-side rendering            │
│  • API routes                       │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Existing DB)           │
│  • Existing + 6 new tables          │
└─────────────────────────────────────┘
```

### Key Files Created

1. **ecosystem.config.js** (PM2 configuration)
2. **/etc/nginx/sites-available/admin.skillhubcore.in** (Nginx config)
3. **.env.production** (Environment variables)

---

## ✅ Verification Checklist

All updates have been completed:

- [x] Database connection updated to standard PostgreSQL
- [x] Deployment instructions changed to VPS
- [x] Removed all Neon/serverless references
- [x] Removed all Vercel references
- [x] Added PM2 configuration examples
- [x] Added Nginx configuration examples
- [x] Updated cost estimates
- [x] Clarified database is existing SkillHubCore DB
- [x] Added VPS-specific checklist items
- [x] Updated CI/CD pipeline for SSH deployment
- [x] Updated architecture diagrams

---

## 🎯 Next Steps for Implementation

1. **Set up VPS environment:**
   - Install Nginx, PM2, Node.js 20.x
   - Configure firewall and security

2. **Database access:**
   - Get connection string for existing SkillHubCore database
   - Add to `.env.local` and `.env.production`

3. **Run migrations:**
   - `pnpm --filter @quiz/db-skillhubcore db:migrate`
   - Verify 6 new tables created

4. **Deploy to VPS:**
   - Build application
   - Upload to VPS
   - Configure PM2 and Nginx
   - Start application

5. **Configure SSL:**
   - Run Certbot to obtain Let's Encrypt certificate
   - Set up auto-renewal

---

## 📞 Questions or Issues?

If you encounter any issues with the updated documentation or need clarification on VPS deployment:

1. Check the updated files listed above
2. Review the VPS deployment section in SKILLHUBCORE_HIERARCHY_MIGRATION_ROADMAP.md
3. Consult the architecture diagram in SKILLHUBCORE_ARCHITECTURE.md

---

**Last Updated**: 2026-07-07  
**Status**: ✅ All updates complete  
**Ready for**: VPS implementation

