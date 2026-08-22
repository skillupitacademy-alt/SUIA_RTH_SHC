# Testing Documentation

Comprehensive guides for testing practices in the Quiz Platform monorepo.

---

## 🎯 Project Testing Standard

> **No meaningful backend/API/database feature is considered deployment-ready until its Node.js E2E integration test passes locally, followed by type-check and build.**

### Standard Workflow

```
Code change → Type-check → Start server → Run E2E → All pass → Build → Commit → Deploy
```

**Technology:** Node.js + Fetch API (real HTTP requests, not browser automation)

---

## 📚 Documentation Index

### E2E Testing

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[E2E Testing Guide](./e2e-testing-guide.md)** | Complete guide with templates and best practices | Writing new E2E tests, onboarding |
| **[Quick Reference](./e2e-quick-reference.md)** | Fast lookup for common commands and errors | Daily development, troubleshooting |
| **[Tutorial Composer Summary](./tutorial-composer-e2e-summary.md)** | Real-world example with complete problem→solution | Reference implementation, learning |

---

## 🚀 Quick Start

### Running E2E Tests

```bash
# 1. Start server
npm run dev

# 2. Run test (new terminal)
node scripts/test-tutorial-composer-e2e.mjs
```

### Creating New E2E Test

```bash
# 1. Copy template from e2e-testing-guide.md
# 2. Customize for your feature
# 3. Run against local server
# 4. Commit with descriptive message
```

---

## 📖 What's Inside

### 1. E2E Testing Guide (`e2e-testing-guide.md`)

**Best for:** Understanding E2E testing from scratch

**Contents:**
- Complete E2E testing process
- Server setup (single app, turborepo, PM2)
- Reusable test script template
- Best practices (isolation, assertions, error handling)
- Troubleshooting guide
- Tutorial Composer as reference

**Use when:**
- Writing your first E2E test
- Need a template to start from
- Want to understand best practices
- Troubleshooting test failures

### 2. Quick Reference (`e2e-quick-reference.md`)

**Best for:** Fast lookups during development

**Contents:**
- 3-step quick start
- Common commands cheat sheet
- Environment variables
- Error patterns & fixes
- Pre-deployment checklist

**Use when:**
- Need to remember a command quickly
- Debugging a failed test
- Setting up CI/CD
- Checking environment setup

### 3. Tutorial Composer Summary (`tutorial-composer-e2e-summary.md`)

**Best for:** Real-world reference implementation

**Contents:**
- Complete problem analysis
- Solution architecture
- Step-by-step execution guide
- Verification checklist
- Key learnings
- Deployment readiness

**Use when:**
- Want to see a real example
- Understanding architecture decisions
- Learning from past issues
- Preparing for deployment

---

## 🎯 Common Tasks

### I want to...

#### Write a new E2E test

1. Read: [E2E Testing Guide](./e2e-testing-guide.md) → "Test Script Template"
2. Copy: Template code
3. Customize: For your feature
4. Run: `node scripts/test-<feature>-e2e.mjs`

#### Run existing E2E tests

1. Check: [Quick Reference](./e2e-quick-reference.md) → "Quick Start"
2. Start server: `npm run dev`
3. Run test: `node scripts/test-tutorial-composer-e2e.mjs`

#### Debug a failing test

1. Check: [Quick Reference](./e2e-quick-reference.md) → "Common Errors & Fixes"
2. View server logs: Terminal where `npm run dev` is running
3. Add logging: Insert `console.log()` in test
4. Check database: `psql $DATABASE_URL`

#### Understand the Tutorial Composer test

1. Read: [Tutorial Composer Summary](./tutorial-composer-e2e-summary.md)
2. Review: `scripts/test-tutorial-composer-e2e.mjs`
3. Run: Follow "How to Run" section
4. Study: Test output and server logs

#### Set up CI/CD for E2E tests

1. Read: [E2E Testing Guide](./e2e-testing-guide.md) → "Future Enhancements"
2. Copy: GitHub Actions workflow example
3. Add: Database service to CI
4. Configure: Environment variables in CI platform

---

## 📁 Related Files

### Test Scripts

```
scripts/
  test-tutorial-composer-e2e.mjs    ← Reference implementation
  test-<your-feature>-e2e.mjs       ← Your new tests
  test-data/                         ← Test fixtures (optional)
```

### Configuration

```
.env.local                           ← Environment variables (not committed)
.env.local.example                   ← Template for .env.local
```

### Source Code

```
apps/skillhubcore-admin/             ← Tutorial Composer app
packages/db-tutorial/                ← Tutorial database package
packages/validation/                 ← Zod schemas
```

---

## ✅ Testing Checklist

### Before Writing E2E Test

- [ ] Feature is implemented and working manually
- [ ] API endpoints exist and documented
- [ ] Database schema is stable
- [ ] Environment variables documented

### Writing E2E Test

- [ ] Copied template from guide
- [ ] **Tests follow actual business lifecycle** (not blindly CRUD)
- [ ] Tests mirror real user workflows
- [ ] Uses Node.js + fetch() (not browser automation)
- [ ] Includes authentication test
- [ ] Includes prerequisite validation
- [ ] Includes error case tests
- [ ] Includes regression tests for known bugs
- [ ] Has cleanup in prerequisite validation
- [ ] Logs are comprehensive
- [ ] Assertions are specific
- [ ] Tests real HTTP → API → Database flow

### Before Committing

- [ ] Test passes locally
- [ ] Server logs show no errors
- [ ] Type-check passes: `npm run type-check`
- [ ] Database is clean after test
- [ ] Test script has shebang: `#!/usr/bin/env node`
- [ ] Commit message is descriptive

### Before Deploying

- [ ] All E2E tests pass
- [ ] Type-check passes
- [ ] Build succeeds: `npm run build`
- [ ] Tested against staging (if available)
- [ ] Documentation updated

---

## 🐛 Troubleshooting

### Test won't start

```bash
# Check if server is running
curl http://localhost:3007/api/health

# If not, start it
npm run dev
```

### Authentication fails

```bash
# Verify credentials
cat .env.local | grep ADMIN

# Check user exists
psql $DATABASE_URL -c "SELECT email FROM users WHERE email='admin@example.com';"
```

### Database errors

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# View schema
psql $DATABASE_URL -c "\dt"

# Check FK constraints
psql $DATABASE_URL -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';"
```

### Test passes locally but fails in CI

1. Check CI environment variables
2. Verify database service in CI config
3. Confirm ports aren't conflicting
4. Add retry logic for network calls
5. Increase timeouts for slow CI machines

**More details:** See [E2E Testing Guide](./e2e-testing-guide.md) → "Troubleshooting"

---

## 📊 Test Coverage

### Current E2E Tests

| Test | Status | Coverage |
|------|--------|----------|
| Tutorial Composer | ✅ Complete | CREATE, READ, UPDATE, PUBLISH, UUID validation |

### Planned E2E Tests

| Feature | Priority | Notes |
|---------|----------|-------|
| Quiz Creation | High | CRUD + question management |
| User Registration | High | Signup flow + email verification |
| Payment Flow | Medium | Stripe integration |
| Course Enrollment | Medium | Student → course assignment |

---

## 🔗 External Resources

### Testing Best Practices

- [Martin Fowler - Testing Strategies](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### Tools We Use

- **Node.js Fetch API** - HTTP requests
- **Zod** - Schema validation
- **PostgreSQL** - Database
- **Turborepo** - Monorepo management

### Related Docs

- API Documentation: `docs/api/`
- Database Schemas: `packages/db-*/prisma/schema.prisma`
- Architecture: `docs/architecture/`

---

## 🤝 Contributing

### Adding New Documentation

1. Create file in `docs/testing/`
2. Follow existing structure and style
3. Update this README index
4. Add to git: `git add docs/testing/`
5. Commit: `git commit -m "docs: Add <topic> testing guide"`

### Improving Existing Docs

1. Make edits
2. Test any code examples
3. Update "Last Updated" date
4. Commit with clear message

### Questions?

- Check existing docs first
- Ask in #engineering channel
- Create issue with "docs" label

---

## 📝 Document Status

| Document | Last Updated | Maintained By | Status |
|----------|--------------|---------------|--------|
| E2E Testing Guide | 2026-08-22 | Engineering | ✅ Current |
| Quick Reference | 2026-08-22 | Engineering | ✅ Current |
| Tutorial Composer Summary | 2026-08-22 | Engineering | ✅ Current |
| This README | 2026-08-22 | Engineering | ✅ Current |

---

**Need help?** Start with [Quick Reference](./e2e-quick-reference.md) for fast answers, or dive into [E2E Testing Guide](./e2e-testing-guide.md) for comprehensive coverage.
