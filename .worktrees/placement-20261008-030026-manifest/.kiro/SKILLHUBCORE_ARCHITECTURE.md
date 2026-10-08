# SkillHubCore Educational Hierarchy Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    https://admin.skillhubcore.in                │
│                         (Production URL)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js 16.1.6 Application                      │
│              apps/skillhubcore-admin (Port 3007)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Public Routes   │  │  Admin Routes    │  │ API Routes   │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────┤ │
│  │ /login           │  │ /questions       │  │ /api/admin/  │ │
│  │ /forgot-password │  │ /dashboard       │  │   domains    │ │
│  │                  │  │ /users           │  │   subjects   │ │
│  │                  │  │ /settings        │  │   topics     │ │
│  │                  │  │                  │  │   subtopics  │ │
│  │                  │  │ [Protected by    │  │   skills     │ │
│  │                  │  │  AdminGuard]     │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Auth Store   │  │ Admin Guard  │  │ Session Management │   │
│  │ (Zustand)    │  │              │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Database Layer (@quiz/db-skillhubcore)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Drizzle ORM                            │    │
│  │           (Type-safe Database Client)                   │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                          │  │
│  │            (skillhubcore_db)                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  📊 Educational Hierarchy Tables:                       │  │
│  │  ├─ domains          (Top-level categories)            │  │
│  │  ├─ subjects         (Within domains)                  │  │
│  │  ├─ topics           (Within subjects)                 │  │
│  │  ├─ subtopics        (Within topics)                   │  │
│  │  ├─ skills           (Cross-cutting competencies)      │  │
│  │  └─ topic_skills     (Many-to-many junction)          │  │
│  │                                                          │  │
│  │  🔐 Authentication Tables:                              │  │
│  │  ├─ users            (Admin users)                     │  │
│  │  ├─ sessions         (Active sessions)                 │  │
│  │  ├─ roles            (RBAC roles)                      │  │
│  │  └─ user_roles       (User-role assignments)          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

### Creating a Domain (Example Flow)

```
User Action                  Component               API                Database
─────────────────────────────────────────────────────────────────────────────

1. Click "Add Domain"   →   DomainTable.tsx
                                 │
2. Fill form             →   Modal Form
                                 │
3. Submit                →   handleSubmit()
                                 │
                                 ▼
                            apiClient.admin
                            .createDomain()
                                 │
                                 ▼
4. POST /api/admin/domains  →  route.ts
                                 │
                                 ▼
                            requireAdmin()
                            (Auth check)
                                 │
                                 ▼
5. Insert into DB        →   db.insert(domains)
                                 │
                                 ▼
                            PostgreSQL
                            domains table
                                 │
6. Return new domain     ←   [id, name, ...]
                                 │
7. Update UI             ←   fetchDomains()
                                 │
8. Show in list          ←   DomainReviewCard
```

## 🗂️ Component Hierarchy

```
QuestionsPage (Main Entry Point)
├── Tab Navigation
│   ├── Domains Tab
│   ├── Subjects Tab
│   ├── Topics Tab
│   ├── Subtopics Tab
│   └── Skills Tab
│
└── Active Tab Content
    │
    ├── DomainTable Component
    │   ├── HierarchySearchBar
    │   │   ├── Search Input
    │   │   ├── Select All Checkbox
    │   │   └── Action Buttons
    │   │       ├── Bulk Factory Button
    │   │       └── Add Domain Button
    │   │
    │   ├── Domain List (Grid)
    │   │   └── DomainReviewCard (for each domain)
    │   │       ├── Checkbox (for batch operations)
    │   │       ├── Domain Info
    │   │       │   ├── Name
    │   │       │   ├── Description
    │   │       │   ├── Category
    │   │       │   └── Status Badge
    │   │       └── Action Buttons
    │   │           ├── Edit Button
    │   │           └── Delete Button
    │   │
    │   ├── Floating Command Bar (when items selected)
    │   │   ├── Selection Count
    │   │   ├── Clear Button
    │   │   └── Delete Selection Button
    │   │
    │   ├── Edit/Create Modal (ZPortalModal)
    │   │   ├── Form Fields
    │   │   │   ├── Name Input
    │   │   │   ├── Category Input
    │   │   │   ├── Description Textarea
    │   │   │   └── Status Toggle
    │   │   └── Action Buttons
    │   │       ├── Cancel
    │   │       └── Save
    │   │
    │   ├── Delete Confirmation Modal (AlertDialog)
    │   │   ├── Warning Message
    │   │   └── Confirm/Cancel Buttons
    │   │
    │   ├── Factory Wizard Modal (HierarchyFactoryWizard)
    │   │   ├── Mode Toggle (Manual/Bulk)
    │   │   ├── Manual Entry Form
    │   │   ├── Bulk JSON Editor
    │   │   ├── AI Prompt Generator
    │   │   └── Execution Progress
    │   │
    │   └── Pagination (ZPagination)
    │       ├── Page Info
    │       ├── Previous Button
    │       ├── Next Button
    │       └── Page Size Selector
    │
    └── [Similar structure for Subject/Topic/Subtopic/Skill Tables]
```

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Access                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                 1. Check Authentication                      │
│              (middleware.ts / AdminGuard)                    │
├─────────────────────────────────────────────────────────────┤
│  ✓ Session token exists?                                    │
│  ✓ Token not expired?                                       │
│  ✓ User active?                                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──── ❌ Failed ───→ Redirect to /login
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                 2. Check Authorization                       │
│                    (requireAdmin)                            │
├─────────────────────────────────────────────────────────────┤
│  ✓ User has admin role?                                     │
│  ✓ Has required permissions?                                │
│  ✓ Resource access allowed?                                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──── ❌ Failed ───→ Return 403 Forbidden
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  3. Process Request                          │
│              ✅ Access Granted                               │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Relationships

```
┌──────────────┐
│   domains    │
│──────────────│
│ • id (PK)    │
│ • name       │──────┐
│ • status     │      │
└──────────────┘      │
                      │ 1:N
                      │
                      ▼
                ┌──────────────┐
                │  subjects    │
                │──────────────│
                │ • id (PK)    │
                │ • domain_id  │──────┐
                │ • name       │      │
                │ • order      │      │
                └──────────────┘      │ 1:N
                                      │
                                      ▼
                                ┌──────────────┐
                                │   topics     │
                                │──────────────│
                                │ • id (PK)    │
                                │ • subject_id │──────┐
                                │ • name       │      │
                                │ • complexity │      │
                                │ • weight     │      │
                                └──────────────┘      │ 1:N
                                                      │
                                                      ▼
                                                ┌──────────────┐
                                                │  subtopics   │
                                                │──────────────│
                                                │ • id (PK)    │
                                                │ • topic_id   │
                                                │ • name       │
                                                │ • depth      │
                                                └──────────────┘

┌──────────────┐              ┌──────────────┐
│    skills    │              │    topics    │
│──────────────│              │──────────────│
│ • id (PK)    │◄────M:N─────►│ • id (PK)    │
│ • name       │              │ • name       │
│ • category   │              └──────────────┘
│ • weight     │                     ▲
└──────────────┘                     │
       ▲                             │
       │                             │
       │         ┌──────────────────┐│
       └─────────│  topic_skills    ││
                 │──────────────────││
                 │ • topic_id (FK)  ││
                 │ • skill_id (FK)  │┘
                 │ • (composite PK) │
                 └──────────────────┘
```

## 🎨 UI/UX Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Design System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Color Palette:                                             │
│  ├─ Primary:   Purple (#8B5CF6) - SkillHubCore brand       │
│  ├─ Secondary: Blue (#3B82F6)   - Accents                  │
│  ├─ Success:   Green (#10B981)  - Confirmations            │
│  ├─ Danger:    Red (#EF4444)    - Deletions/Warnings       │
│  └─ Neutral:   Gray (#6B7280)   - Text/Borders             │
│                                                              │
│  Typography:                                                │
│  ├─ Headings:  Outfit (Bold, Uppercase)                    │
│  └─ Body:      Inter (Regular, Medium)                     │
│                                                              │
│  Components (@quiz/ui):                                     │
│  ├─ ZPagination       (Cursor-based pagination)            │
│  ├─ ZLoader           (Loading states)                     │
│  ├─ ZPortalModal      (Full-screen modals)                 │
│  ├─ ZTooltip          (Contextual help)                    │
│  ├─ ZConfirmation     (Alert dialogs)                      │
│  └─ HierarchySearchBar (Search with filters)               │
│                                                              │
│  Custom Components:                                         │
│  ├─ ReviewCards       (Domain/Subject/Topic/Subtopic/Skill)│
│  ├─ FactoryWizard     (Bulk creation interface)            │
│  ├─ SelectField       (Hierarchical dropdowns)             │
│  └─ ErrorBanner       (Error messaging)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  auth-store.ts                                              │
│  ├─ user              (Current user object)                 │
│  ├─ expiresAt         (Session expiry)                      │
│  ├─ isAuthenticated   (Boolean flag)                        │
│  ├─ login()           (Set user session)                    │
│  └─ logout()          (Clear session)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  React Query Cache                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query Keys:                                                │
│  ├─ ['domains', cursor, search]                            │
│  ├─ ['subjects', cursor, domainId]                         │
│  ├─ ['topics', cursor, subjectId]                          │
│  ├─ ['subtopics', cursor, topicId]                         │
│  └─ ['skills', cursor, search]                             │
│                                                              │
│  Mutation Keys:                                             │
│  ├─ ['createDomain']                                        │
│  ├─ ['updateDomain']                                        │
│  ├─ ['deleteDomain']                                        │
│  └─ ['batchDelete']                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / DNS                            │
│              admin.skillhubcore.in (Port 443)                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     VPS Server                               │
│                  (Ubuntu/Debian Linux)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Nginx Reverse Proxy                        │  │
│  │  • SSL/TLS Termination (Let's Encrypt)               │  │
│  │  • Static file serving                               │  │
│  │  • Gzip compression                                  │  │
│  │  • Request forwarding to :3007                       │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│               ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PM2 Process Manager                          │  │
│  │  • Auto-restart on crash                             │  │
│  │  • Log management                                    │  │
│  │  • Cluster mode (multiple instances)                 │  │
│  │  • Memory monitoring                                 │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│               ▼                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Next.js Application (Port 3007)                  │  │
│  │  • Server-side rendering                             │  │
│  │  • API Routes                                        │  │
│  │  • Server Components                                 │  │
│  │  • Middleware (auth checks)                          │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
└───────────────┼─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│      PostgreSQL Database (Existing SkillHubCore DB)          │
│              (Same VPS or Separate Server)                   │
├─────────────────────────────────────────────────────────────┤
│  Database: skillhubcore_db                                  │
│                                                              │
│  Existing Tables:                                           │
│  • users, sessions, etc. (existing SkillHubCore tables)    │
│                                                              │
│  New Tables (Added):                                        │
│  • domains, subjects, topics, subtopics, skills            │
│  • topic_skills                                            │
│                                                              │
│  Features:                                                  │
│  • Connection pooling (pg Pool)                            │
│  • Indexed foreign keys                                    │
│  • Regular backups                                         │
│  • Query optimization                                      │
└─────────────────────────────────────────────────────────────┘
```

### VPS Deployment Stack

**Web Server**: Nginx (reverse proxy, SSL termination)  
**Process Manager**: PM2 (application lifecycle, clustering)  
**Application**: Next.js 16.1.6 on Node.js 20.x  
**Database**: PostgreSQL (existing SkillHubCore database)  
**Port**: 3007 (internal), 443 (external via Nginx)  
**SSL**: Let's Encrypt (via Certbot)  

### Configuration Files

**PM2 Ecosystem** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'skillhubcore-admin',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3007',
    cwd: '/var/www/skillhubcore-admin',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3007
    }
  }]
}
```

**Nginx Configuration** (`/etc/nginx/sites-available/admin.skillhubcore.in`):
```nginx
server {
    listen 80;
    server_name admin.skillhubcore.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.skillhubcore.in;

    ssl_certificate /etc/letsencrypt/live/admin.skillhubcore.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.skillhubcore.in/privkey.pem;

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📈 Performance Optimizations

1. **Database Level**
   - Indexes on foreign keys
   - Cursor-based pagination
   - Connection pooling
   - Query result caching

2. **Application Level**
   - React Query for data caching
   - Debounced search (500ms)
   - Lazy loading of modals
   - Code splitting

3. **Network Level**
   - CDN for static assets
   - API route caching
   - Compression enabled
   - HTTP/2 support

---

## 🔒 Security Measures

1. **Authentication**
   - Secure session tokens
   - HTTP-only cookies
   - CSRF protection
   - Session expiry

2. **Authorization**
   - Role-based access control (RBAC)
   - Permission checking
   - Resource-level access control
   - API route protection

3. **Data Protection**
   - SQL injection prevention (Drizzle ORM)
   - XSS protection (React escaping)
   - Input validation (Zod schemas)
   - Rate limiting

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-07-07  
**Review Date**: 2026-08-07
