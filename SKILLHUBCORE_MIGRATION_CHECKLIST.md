# SkillHubCore Migration - Implementation Checklist

Use this checklist to track your progress through the migration.

---

## 🎯 Pre-Migration Setup

### Infrastructure
- [ ] PostgreSQL database accessible (existing SkillHubCore DB)
- [ ] Database credentials added to `.env.local`
- [ ] VPS server set up (Ubuntu/Debian recommended)
- [ ] Domain `admin.skillhubcore.in` DNS configured to point to VPS
- [ ] Nginx installed and configured on VPS
- [ ] PM2 installed globally on VPS
- [ ] SSL certificate obtained (Let's Encrypt via Certbot)
- [ ] Monitoring tools configured (Sentry/other)
- [ ] Node.js 20.x installed on VPS

### Development Environment
- [ ] Node.js 20.x installed
- [ ] pnpm installed globally
- [ ] Git repository cloned
- [ ] IDE configured (VS Code recommended)
- [ ] Required extensions installed
- [ ] Team access granted

### Documentation Review
- [ ] Full roadmap reviewed
- [ ] Quick start guide read
- [ ] Architecture diagrams understood
- [ ] API specifications reviewed

---

## 📦 Week 1: Database & Authentication

### Database Package Creation
- [x] Create `packages/db-skillhubcore/` directory
- [x] Create `package.json` with dependencies
- [x] Create `drizzle.config.ts`
- [x] Create `src/schema/enums.ts`
- [x] Create `src/schema/domain.ts` (6 new tables: domains, subjects, topics, subtopics, skills, topic_skills)
- [x] Create `src/schema/auth.ts`
- [x] Create `src/schema/relations.ts`
- [x] Create `src/index.ts`
- [x] Install dependencies: `pnpm install`
- [x] Generate migrations: `pnpm db:generate`
- [x] Run migrations: `pnpm db:migrate` (adds 6 tables to existing SkillHubCore DB)
- [x] Verify new tables created in existing database (domains, subjects, topics, subtopics, skills, topic_skills)

**✅ Phase 1 Complete** - All 6 tables + 4 enum types created in tutorial_prod database (2026-07-07)

### Authentication Setup
- [ ] Create `src/store/auth-store.ts`
- [ ] Create `src/components/auth/AdminGuard.tsx`
- [ ] Create `src/components/auth/SessionWatcher.tsx`
- [ ] Create `src/app/(public)/login/page.tsx`
- [ ] Create `src/lib/auth-helpers.ts`
- [ ] Create `src/middleware.ts`
- [ ] Test login flow locally
- [ ] Test logout flow
- [ ] Test session expiry
- [ ] Verify route protection

---

## 🎨 Week 2: Component Migration

### Type Definitions
- [x] Copy `types/domain.ts`
- [x] Copy `types/review.ts`
- [x] Copy `types/factory.ts`
- [x] Verify type imports work

### Core Components - All Entities
- [x] Copy `components/questions/DomainTable.tsx` & `DomainReviewCard.tsx`
- [x] Copy `components/questions/SubjectTable.tsx` & `SubjectReviewCard.tsx`
- [x] Copy `components/questions/TopicTable.tsx` & `TopicReviewCard.tsx`
- [x] Copy `components/questions/SubtopicTable.tsx` & `SubtopicReviewCard.tsx`
- [x] Copy `components/questions/SkillTable.tsx` & `SkillReviewCard.tsx`
- [x] Copy `components/content/HierarchyFactoryWizard.tsx`
- [x] Copy supporting components (ErrorBanner, utils, clientLogger)
- [x] Copy UI components (alert-dialog)

**✅ Phase 2 Complete** - All 17 component files copied (2026-07-07)

---

## 🔌 Week 3: API Integration

### API Routes - All CRUD Operations
- [x] Create `app/api/admin/domains/route.ts` (GET, POST, PUT, DELETE)
- [x] Create `app/api/admin/subjects/route.ts` (GET, POST, PUT, DELETE)
- [x] Create `app/api/admin/topics/route.ts` (GET, POST, PUT, DELETE)
- [x] Create `app/api/admin/subtopics/route.ts` (GET, POST, PUT, DELETE)
- [x] Create `app/api/admin/skills/route.ts` (GET, POST, PUT, DELETE)
- [x] Implement pagination support
- [x] Implement search functionality
- [x] Implement batch delete

**✅ Phase 3 Complete** - All 5 API routes with full CRUD operations (2026-07-07)
- [x] Add error handling
- [x] Add validation

**✅ Phase 3 Complete** - All 5 API routes created (2026-07-07)

---

## 📊 Week 3.5: Data Migration (NEW)

### Migrate Existing Data from RealTutorialHub
- [ ] Review migration script: `scripts/migrate-educational-hierarchy-data.mjs`
- [ ] Run dry-run to preview migration: `node scripts/migrate-educational-hierarchy-data.mjs --dry-run`
- [ ] Review dry-run results (counts and sample data)
- [ ] Backup database before migration (if needed)
- [ ] Run actual migration: `node scripts/migrate-educational-hierarchy-data.mjs`
- [ ] Verify migrated data in database
- [ ] Test migrated data in UI
- [ ] Verify relationships are preserved (domain → subject → topic → subtopic)
- [ ] Document any migration issues or data inconsistencies

**Migration Details:**
- Source: RealTutorialHub `tutorial_domains`, `tutorial_subjects`, `tutorial_topics`, `tutorial_subtopics`
- Target: SkillHubCore `domains`, `subjects`, `topics`, `subtopics`
- Uses `external_id` field to map relationships
- Skips existing records (idempotent)
- Preserves created_at and updated_at timestamps
- Only migrates non-deleted records

**Testing Scripts:**
- [ ] Run database test: `node scripts/test-educational-hierarchy.mjs`
- [ ] Run API test: `node scripts/test-educational-hierarchy-api.mjs` (requires dev server running)
- [ ] Verify all CRUD operations work with migrated data

**✅ Phase 3.5 Scripts Created** - Migration and testing scripts ready (2026-07-07)

---

## 🛣️ Week 4: Routing & Integration

### Page Creation
- [ ] Create `app/(admin)/questions/page.tsx`
- [ ] Create `app/(admin)/dashboard/page.tsx`
- [ ] Create `app/(admin)/layout.tsx`
- [ ] Update root layout
- [ ] Create loading states
- [ ] Create error boundaries

### Layout Components
- [ ] Create `components/layout/AdminLayout.tsx`
- [ ] Add navigation sidebar
- [ ] Add header with user menu
- [ ] Add breadcrumbs
- [ ] Test responsive design
- [ ] Add theme toggle (if needed)

### Integration Testing
- [ ] Test domain CRUD flow end-to-end
- [ ] Test subject CRUD flow end-to-end
- [ ] Test topic CRUD flow end-to-end
- [ ] Test subtopic CRUD flow end-to-end
- [ ] Test skill CRUD flow end-to-end
- [ ] Test batch operations
- [ ] Test search functionality
- [ ] Test pagination
- [ ] Test Factory Wizard
- [ ] Test error handling

---

## 🧪 Week 5: Testing

### Unit Tests
- [ ] Write tests for DomainTable component
- [ ] Write tests for SubjectTable component
- [ ] Write tests for TopicTable component
- [ ] Write tests for SubtopicTable component
- [ ] Write tests for SkillTable component
- [ ] Write tests for Factory Wizard
- [ ] Write tests for hooks
- [ ] Write tests for utilities
- [ ] Achieve >80% code coverage

### Integration Tests
- [ ] Test all domain API endpoints
- [ ] Test all subject API endpoints
- [ ] Test all topic API endpoints
- [ ] Test all subtopic API endpoints
- [ ] Test all skill API endpoints
- [ ] Test factory API endpoint
- [ ] Test authentication middleware
- [ ] Test authorization logic

### E2E Tests
- [ ] Test login flow
- [ ] Test domain creation flow
- [ ] Test subject creation with parent selection
- [ ] Test topic creation with complexity/weight
- [ ] Test subtopic creation
- [ ] Test skill creation
- [ ] Test batch delete flow
- [ ] Test search and filter
- [ ] Test pagination navigation
- [ ] Test Factory Wizard workflow

### Performance Tests
- [ ] Measure page load times
- [ ] Measure API response times
- [ ] Test with 1000+ records
- [ ] Test concurrent user access
- [ ] Test database query performance
- [ ] Optimize slow queries
- [ ] Add caching where needed

### Security Tests
- [ ] Test unauthorized access attempts
- [ ] Test SQL injection prevention
- [ ] Test XSS protection
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test session hijacking prevention
- [ ] Run security audit tools

---

## 🚀 Week 6: Deployment

### Staging Deployment
- [ ] Set up staging VPS or use subdirectory on production VPS
- [ ] Configure environment variables on staging VPS
- [ ] Build application: `pnpm build`
- [ ] Upload build files to VPS
- [ ] Configure PM2 with ecosystem.config.js
- [ ] Start application with PM2: `pm2 start ecosystem.config.js`
- [ ] Configure Nginx for staging subdomain
- [ ] Run smoke tests on staging
- [ ] Perform UAT (User Acceptance Testing)
- [ ] Fix any bugs found
- [ ] Get stakeholder approval

### Production Preparation
- [ ] Backup existing SkillHubCore database
- [ ] Configure production environment variables on VPS
- [ ] Set up SSL certificate via Certbot
- [ ] Configure DNS A record for admin.skillhubcore.in
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Set up log rotation for PM2 logs
- [ ] Configure automated database backups
- [ ] Prepare rollback plan
- [ ] Document server access credentials securely

### Production Deployment
- [ ] Run migrations on production DB: `pnpm db:migrate`
- [ ] Verify new tables created (domains, subjects, topics, subtopics, skills, topic_skills)
- [ ] Build application for production: `pnpm build`
- [ ] Upload production build to VPS (/var/www/skillhubcore-admin)
- [ ] Install dependencies on VPS: `pnpm install --prod`
- [ ] Start with PM2: `pm2 start ecosystem.config.js --env production`
- [ ] Configure PM2 to start on boot: `pm2 startup` & `pm2 save`
- [ ] Configure Nginx for admin.skillhubcore.in
- [ ] Reload Nginx: `sudo systemctl reload nginx`
- [ ] Verify deployment successful (visit https://admin.skillhubcore.in)
- [ ] Run smoke tests on production
- [ ] Monitor error rates with `pm2 logs`
- [ ] Monitor performance metrics

### VPS Server Configuration
- [ ] Create dedicated user for application (non-root)
- [ ] Set up firewall (UFW): allow 22, 80, 443, 3007 (internal only)
- [ ] Configure fail2ban for SSH protection
- [ ] Set up automatic security updates
- [ ] Create PM2 ecosystem.config.js file
- [ ] Create Nginx site configuration
- [ ] Test Nginx configuration: `sudo nginx -t`
- [ ] Enable Nginx site: `sudo ln -s /etc/nginx/sites-available/admin.skillhubcore.in /etc/nginx/sites-enabled/`
- [ ] Install Certbot and obtain SSL certificate
- [ ] Set up SSL auto-renewal cron job
- [ ] Configure log rotation for application logs
- [ ] Test PM2 restart: `pm2 restart skillhubcore-admin`
- [ ] Verify PM2 auto-start on reboot

### Post-Deployment
- [ ] Send launch announcement
- [ ] Monitor system for 24 hours
- [ ] Address any issues immediately
- [ ] Collect user feedback
- [ ] Schedule follow-up reviews
- [ ] Document lessons learned

---

## 📚 Documentation

### Technical Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Component documentation
- [ ] Hook documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### User Documentation
- [ ] Admin user guide
- [ ] Video tutorials (optional)
- [ ] FAQ document
- [ ] Support contact info

### Team Documentation
- [ ] Onboarding guide for new developers
- [ ] Code style guide
- [ ] Git workflow documented
- [ ] CI/CD pipeline documented

---

## 🎯 Post-Launch Activities

### Week 1 Post-Launch
- [ ] Daily monitoring of error rates
- [ ] Daily performance reviews
- [ ] Address critical bugs within 24h
- [ ] Collect user feedback
- [ ] Monitor database performance

### Week 2 Post-Launch
- [ ] Review monitoring data
- [ ] Optimize slow queries
- [ ] Address non-critical bugs
- [ ] Plan feature enhancements
- [ ] Schedule maintenance window

### Month 1 Post-Launch
- [ ] Full system audit
- [ ] Performance optimization
- [ ] Security review
- [ ] User satisfaction survey
- [ ] Plan next iteration

---

## ✅ Definition of Done

Mark complete when ALL items below are checked:

- [ ] All 30+ components migrated and tested
- [ ] All 6 database tables created and indexed
- [ ] All API endpoints functional and tested
- [ ] Authentication working end-to-end
- [ ] All tests passing (>80% coverage)
- [ ] Performance targets met (<2s page load, <500ms API)
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployed to production (admin.skillhubcore.in)
- [ ] Monitoring active and alerting configured
- [ ] User acceptance testing passed
- [ ] Stakeholder sign-off received
- [ ] Support team trained
- [ ] Rollback plan tested

---

## 📊 Progress Tracking

| Phase | Start Date | End Date | Status | % Complete |
|-------|------------|----------|--------|------------|
| Pre-Migration | ___ | ___ | ⏳ | 0% |
| Week 1: Database & Auth | ___ | ___ | ⏳ | 0% |
| Week 2: Components | ___ | ___ | ⏳ | 0% |
| Week 3: APIs | ___ | ___ | ⏳ | 0% |
| Week 4: Integration | ___ | ___ | ⏳ | 0% |
| Week 5: Testing | ___ | ___ | ⏳ | 0% |
| Week 6: Deployment | ___ | ___ | ⏳ | 0% |

**Overall Progress**: 0%

**Status Legend**:
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete
- ⚠️ Blocked

---

## 📝 Notes & Issues

Use this section to track important notes, decisions, and issues:

### Issues
1. _Add issues here_

### Decisions
1. _Document key decisions here_

### Notes
1. _Add general notes here_

---

**Last Updated**: ___________  
**Updated By**: ___________  
**Next Review**: ___________

---

💡 **Tip**: Print this checklist or keep it open while working through the migration!

🚀 **Ready to start?** Begin with the Pre-Migration Setup section!
