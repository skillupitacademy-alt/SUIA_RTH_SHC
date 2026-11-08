# Project Software Architecture Standard — Draft v1.0

**Scope:** SkillHubCore (SHC), SkillUp IT Academy (SUIA), Real Tutorial Hub (RTH), their administrative/learner/marketing applications, supporting services, packages, databases, infrastructure and integrations.  
**Status:** Proposed governance baseline; not a certification of the existing implementation.  
**Source baseline:** `FinalAechitecture.md` and the user's clarified platform ownership model. Live source sampling was performed against `skillupitacademy-alt/SUIA_RTH_SHC`, branch `feature/project-llm-linux-worker`, commit `4207cb1ca11abc29ca263310f5a4d54b859cd77f` on 2026-11-08. The deployed Hostinger revision has not been independently matched to this commit.

## 1. Architecture decision

**Centralized, modular, multi-brand education platform with SHC-owned shared educational capabilities and brand-isolated SUIA/RTH experiences.** Use a modular monorepo and selectively deploy separately when justified by measured demand, reliability needs or team ownership. Do not mandate microservices for every domain.

- **SHC:** Single authoritative owner of shared educational business logic and service contracts: enquiry, admission, student management capability, courses/training, batches, scheduling, lectures, notes, tutorial/study, assessments/tests, mentoring/guidance, doubt solving, placement, experience letters, certificates and shared reporting, *where these functions are in-scope*. The authoritative implementation may initially reside in existing API services; ownership must be traced and documented before any relocation.
- **SUIA:** Independent tutor-based brand, admission channel, staff/student portal, tutor-led policies, faculty schedules, user interface and scoped data access. Consumes authoritative SHC domain services.
- **RTH:** Independent online/AI-based brand, admission channel, staff/student portal, online/AI scheduling policies, user interface and scoped data access. Consumes authoritative SHC domain services.
- **Global identity:** A shared person/account is not automatically an admission, enrollment or permission for either brand. Memberships, enrollment and authorization must be explicitly granted and checked.
- **Administration:** SHC Admin governs the platform through authorized shared services; administration UI is not an excuse for unrestricted direct database access.

## 2. Architectural boundaries

1. Each educational domain has one authoritative module/service owner. A brand portal may expose a UI or BFF, but may not recreate authoritative domain rules.
2. Use clear contracts between UI/BFF, API, application service, domain and persistence. Do not mandate unnecessary layers for trivial code.
3. The server establishes or verifies brand context; do not trust arbitrary browser headers or a submitted `brandId`.
4. Every protected query, mutation, report and aggregate enforces permissions and brand/resource scope. Cross-brand platform-admin access is permissioned and audited.
5. Do not equate shared code with globally shared records. Shared schemas/engines may serve brand-owned records; document ownership table by table.
6. Treat `people_prod`, `skillup_prod`, `rth_prod` and any other current databases as existing physical assets, not an automatic final domain ownership model. Map existing schemas and authorized writers before changing physical storage.
7. Different tutor-led and online/AI-led workflows use explicit policies/strategies and validated configuration, not duplicated service implementations or security-by-configuration alone.
8. Prefer asynchronous work for notifications, generated documents and analytics; keep admission, payments, exams and other transactional guarantees strong. Design idempotency explicitly.

## 3. Engineering standards

Every applicable module adheres to SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, separation of concerns, high cohesion, low coupling, composition where appropriate, single ownership, strict types/contracts, least privilege, secure defaults, safe error handling, idempotency as applicable, testability, observability and operational recoverability. Apply these pragmatically: do not build speculative interfaces, factories or deployable services merely to satisfy a superficial checklist.

## 4. Hosting and portability

- **Current operation:** Developer-controlled local builds and Docker deployments to Hostinger VPS; no required GitHub Actions or paid CI/CD system while the project is in development and has no end users.
- **Portable deployment contract:** Versioned Dockerfiles and Compose manifests; standards-based OCI container images; explicit ports, health checks, dependencies and resource limits; configuration through validated environment/secret injection; no embedded Hostinger-specific application logic; no absolute host paths in business code; persistent data/storage and backup boundaries documented.
- **External services:** Isolate mail/SMS, object storage, queues, AI providers, identity, CDN/gateway and database infrastructure behind narrowly scoped contracts where a realistic provider change requires it. Do not attempt false zero-lock-in for features that require provider-specific adaptation.
- **Migration principle:** Moving Hostinger -> another VPS, Azure, AWS, GCP or another vendor should predominantly require infrastructure/configuration changes and planned data migration, not rewriting shared education business logic. Each move still requires cost, data transfer, networking, TLS, operations, observability, secrets and failover qualification.
- **Scale:** Measure concurrency, RPS, p95/p99 latency, CPU/memory, DB pool saturation, errors, queue depth, cost and restoration. Increase capacity with evidence, rather than buying capacity for hypothetical millions of students now.

## 5. Governance decisions still requiring source-level confirmation

- Authoritative location of each existing business service and whether current SHC services already delegate to that owner.
- Writer/reader ownership for each table across `people_prod`, `skillup_prod`, `rth_prod` and other packages/databases.
- Brand partition keys, enrollment grants and cross-brand administrative privileges.
- Validated public submission channel mappings, particularly enquiry/admission.
- Actual Hostinger-deployed image digests/commit SHAs, secrets, persistent storage, backups and current Cloudflare/edge dependencies.

**Architectural compliance is not inferred from folder names, documentation, deployment success or a clean build.** Use `ProjectServiceAcceptanceStandard.md` and `ProjectImplementationWorkflow.md` for mandatory evidence.
