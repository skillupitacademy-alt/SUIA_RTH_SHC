Yes. I’ve reviewed the three attached project-source files and will treat them as the primary project context going forward:

- **`FinalAechitecture.md`** — the target architecture, engineering principles, data/service boundaries, scalability model, reliability expectations, and staged readiness approach. It explicitly recommends measuring actual implementation against the intended architecture rather than assuming infrastructure choices imply readiness. FinalAechitecture
- **`ProjectAuditReport.md`** — the source-level audit and evidence trail, including security, authorization, brand-isolation, API/BFF, data-integrity, operational, and architecture findings. Importantly, the audit distinguishes source findings from things that still require runtime/deployment verification. ProjectAuditReport
- **`ResolveProjectAuditReport.md`** — the remediation history: phases, fixes applied, regression verification, environment requirements, remaining work at each stage, and later completion status. For example, it records the hardened app boundaries and their automated validation. ResolveProjectAuditReport

I also understand an important chronology: **the audit file describes the problems found at audit time, while the resolution file records later attempts/fixes and test results**. I will therefore not mistakenly present an old audit finding as still unresolved without checking the remediation record—and, when necessary, the current repository state.

For our next discussion, I’ll use the three documents together as:

**FinalArchitecture = intended architecture** → **ProjectAuditReport = what was found wrong/unverified** → **ResolveProjectAuditReport = what was changed/claimed verified afterward**.

You can now ask me about any architecture decision, audit ID, remediation, remaining risk, or next implementation phase without re-uploading or re-explaining these three files.

Yes — that is the right way to understand the relationship, with one nuance.

`FinalAechitecture.md` defines the **intended architecture and engineering standards**: service/data ownership, brand isolation, authentication/authorization boundaries, database rules, scalability expectations, observability, testing gates, reliability targets, and the staged path toward large-scale readiness. FinalAechitecture

`ProjectAuditReport.md` was then used to inspect the actual codebase against those kinds of architectural expectations and identify where the implementation did not match them, was incomplete, unsafe, or still unverified. The report itself explicitly says it distinguishes **verified findings**, **potential risks**, and things **not yet verified**, and that it reviewed actual repository evidence rather than assuming features worked because a script or file existed. ProjectAuditReport

So the flow is essentially:

**FinalArchitecture.md → defines what the system should be**
**ProjectAuditReport.md → checks what the system actually is and identifies gaps**
**ResolveProjectAuditReport.md → records changes made to close those gaps**

One important distinction: `ProjectAuditReport.md` is not itself the implementation of the architecture. It is the **gap-analysis / audit layer** that tells you what needs to be changed so the repository moves toward the architecture defined in `FinalAechitecture.md`.

And based on the files, the audit expanded quite deeply into security and implementation details—gateway trust, brand isolation, auth/RBAC, API boundaries, tenant/data access, CSRF, quiz integrity, admin operations, etc.—because those are practical code-level consequences of the higher-level architectural rules.

So, in short: **yes, the audit was created to assess and guide implementation of the target architecture, not to replace the architecture document.**

Yes. The right way to do this is **not to treat `FinalAechitecture.md` as one giant project-wide rewrite**. We should use it as the target architecture and qualify the repository **application by application**, in this order:

**Phase 1 — `skillhubcore-admin` → Phase 2 — `skillup-web` → Phase 3 — `realtutorialhub-web`**

Only after those three are architecturally clean should we move into broader gateway/infrastructure/load-readiness work.

`FinalAechitecture.md` itself says the first work should be to establish what is actually implemented, define service/data ownership boundaries, validate brand access, establish observability/recovery, and then load test rather than assuming the presence of Cloudflare, Neon, a gateway, or a monorepo means the architecture is complete. FinalAechitecture

## How we should proceed

For **each application**, I will run the same architecture lifecycle:

```text
FinalAechitecture.md
        ↓
Extract requirements applicable to current app
        ↓
Inspect current GitHub implementation
        ↓
Architecture Readiness Matrix
        ↓
Identify gaps
        ↓
Create implementation plan
        ↓
Implement/fix gaps
        ↓
Tests + static verification
        ↓
Re-audit GitHub HEAD
        ↓
Phase acceptance
        ↓
Move to next application
```

We should **not move to the next application while the current one still has unresolved architectural blockers**.

The architecture document explicitly defines readiness states as:

- Implemented and verified
- Implemented but unverified
- Partially implemented
- Not implemented
- Not applicable FinalAechitecture

We should use exactly those states throughout this program.

---

# Phase 1 — `skillhubcore-admin`

This should be our starting point.

Although we are calling it the `skillhubcore-admin` phase, I will inspect not only:

```text
apps/skillhubcore-admin/
```

but also every shared component that the admin application depends upon, for example:

```text
packages/auth/
packages/types/
packages/db-*/
packages/validation/
services/skillhubcore-service/
services/project-ai/
services/api-gateway/
```

when those dependencies affect the application's architecture.

That is necessary because the target architecture says SkillHubCore owns shared identity and genuinely shared capabilities while RTH and SkillUp retain independent brand responsibilities. FinalAechitecture

### What I will assess in Phase 1

| Architecture area | What we check in `skillhubcore-admin` |
|---|---|
| Module boundaries | UI, application logic, domain logic, repositories and infrastructure are separated |
| Dependency direction | UI/API does not become authoritative business logic |
| Shared-package usage | Truly shared capabilities live in shared packages/services rather than duplicated app code |
| Database ownership | Admin code accesses only databases/tables it is authorized to own |
| Authentication | Secure login, refresh, logout, expiry and revocation |
| Authorization | Every privileged operation has server-side role/permission checks |
| Brand isolation | Brand scope is derived/validated server-side |
| Trust boundaries | Browser headers cannot fabricate trusted identity |
| API contracts | Inputs/outputs validated and shared contracts explicit |
| Mutation security | CSRF/origin and privileged mutation controls |
| Caching | Personalized/admin data cannot leak via public caching |
| Error boundaries | No secrets/internal traces/upstream bodies leak |
| Secrets | No source-code secrets/fallback credentials |
| Project AI | Admin → Project AI boundary follows trusted-admin model |
| Observability | Structured security/action/error logging |
| Tests | Unit, integration, contract, security regression tests |
| CI enforcement | Architecture/security tests capable of becoming mandatory gates |

These requirements come directly from the architecture's secure-by-default model: authorization must be server-side, brand context explicit and validated, common contracts defined, dependencies controlled, and changes covered by tests. FinalAechitecture

### Phase 1 output

I would produce a matrix such as:

| ID | Architecture requirement | Current GitHub evidence | Status | Required work |
|---|---|---|---|---|
| SHC-A01 | Admin routes server-authorized | `admin-route-guard.ts` | ✅ Implemented & verified | None |
| SHC-A02 | Brand derived from verified identity | relevant code | 🟡 Partial | Fix X |
| SHC-A03 | DB ownership respected | repos/services | 🔴 Not implemented | Refactor |
| SHC-A04 | Direct DB access isolated | routes/repositories | 🟡 Partial | Move to repository |
| SHC-A05 | API contract validation | route schemas | ✅/🟡 | … |
| SHC-A06 | Personalized response private | route response | … | … |

We continue until there are **no unresolved Critical architecture violations for SkillHubCore Admin**.

---

# Phase 1 should itself be broken into smaller passes

I recommend six passes rather than trying to inspect hundreds of files simultaneously.

### 1A — Boundaries and ownership

First establish:

```text
What belongs to skillhubcore-admin?
What belongs to SkillHubCore service?
What belongs in shared packages?
Which database does each feature own?
Which code is merely UI/BFF?
```

The source architecture specifically says the first roadmap phase is **architecture principles and boundaries**, followed by explicit database ownership and access. FinalAechitecture

This becomes our architectural map.

### 1B — Authentication, authorization and trust

Then inspect:

```text
login
refresh
logout
sessions
admin RBAC
permissions
cookies
CSRF/origin
internal calls
gateway calls
identity headers
brand headers
```

The target requires secure authentication, resource-level authorization, server-validated brand context, managed secrets and auditability. FinalAechitecture

### 1C — Data ownership and repository architecture

For every direct DB import/use:

```text
route/controller
      ↓
application/service
      ↓
domain
      ↓
repository contract
      ↓
DB implementation
      ↓
Drizzle/PostgreSQL
```

We identify violations such as:

```text
React/API route → Drizzle table directly
```

where that bypasses the intended ownership/business layer.

Not every direct DB query automatically needs a service abstraction, but authoritative business rules and cross-domain access must have clear ownership.

### 1D — API, validation, caching and reliability

Review:

```text
Zod/schema validation
JSON size/depth
HTTP methods
idempotency
timeouts
retry behavior
cache-control
error sanitization
request IDs
```

### 1E — Project AI and non-core workloads

Because `skillhubcore-admin` currently fronts Project AI, we separately qualify:

```text
Admin
 ↓ authenticated/authorized
Project AI BFF
 ↓
private Project AI worker
 ↓
isolated verification resources
```

The architecture also says AI/analytics workloads must not destabilize transactional learning/exam workloads. FinalAechitecture

### 1F — Tests and architecture gates

Then create missing tests so architecture cannot silently regress.

For example:

```text
architecture/
  admin-boundary.test.ts
  brand-isolation.test.ts
  database-ownership.test.ts
  gateway-trust.test.ts
  project-ai-boundary.test.ts
```

Phase 1 does **not end merely because code looks correct**.

It ends when evidence exists.

---

# Phase 1 exit gate

I would allow us to move to SkillUp only when `skillhubcore-admin` satisfies something like:

```text
Critical architecture violations       0
High architecture violations           0
Known Medium violations                documented/accepted or fixed

Admin authentication                   Implemented & verified
RBAC                                   Implemented & verified
CSRF/origin                            Implemented & verified
Identity header sanitization           Implemented & verified
Shared capability ownership            Implemented
DB ownership                           Implemented
API input validation                   Implemented
Sensitive response caching             Implemented
Secrets                                Implemented
Project AI boundary                    Implemented
Architecture regression tests          Passing
TypeScript                             Passing
Lint relevant scope                    Passing
Build                                  Passing
```

Things such as production load capacity can still be:

**Implemented but unverified**

because that requires deployment/load evidence rather than source code.

---

# Phase 2 — `skillup-web`

Once SkillHubCore Admin is architecturally accepted, we freeze Phase 1 unless a shared-component problem is discovered.

Then repeat the same process for SkillUp.

The emphasis changes because SkillUp is a **brand learner application**.

The architecture says the student has one global identity but separate explicit brand memberships, and that brand-specific enrollment, progress, preferences and records remain in the corresponding brand domain. Every request still has to check target brand and permissions. FinalAechitecture

For SkillUp, the most important checks become:

```text
Global identity
       ↓
explicit SkillUp membership
       ↓
SkillUp learner identity
       ↓
SkillUp resources only
       ↓
skillup_prod-owned data
```

We will specifically verify:

- SkillUp token/brand binding.
- No RTH data access.
- No client-controlled `x-brand`.
- Membership enforcement.
- Course/enrollment ownership.
- Learner-progress ownership.
- Quiz/practice integrity.
- Assignment access.
- Personalized caching.
- BFF/API trust boundary.
- SkillUp database ownership.
- shared vs brand business logic.
- public vs authenticated content.
- performance/caching architecture.
- telemetry/event contracts.
- error and observability behavior.

### Phase 2 exit requirement

A SkillUp learner must never gain an RTH entitlement merely because the same global identity exists.

The architecture explicitly warns against the global rule:

> every user can access both brands.

Instead, memberships must be granted explicitly. FinalAechitecture

---

# Phase 3 — `realtutorialhub-web`

Then we perform the same qualification for RTH.

Architecture target:

```text
Global identity
       ↓
explicit RTH membership
       ↓
RTH learner identity
       ↓
RTH resources only
       ↓
rth_prod-owned data
```

We check the same classes of architecture rules, but against RTH-specific:

```text
tutorials
courses
assignments
progress
quiz/exams
subscriptions/access
brand membership
BFF/API routes
RTH data repositories
```

And then perform explicit cross-brand tests:

```text
SkillUp account only → RTH private resource → DENY

RTH account only → SkillUp private resource → DENY

Both memberships → correct resources per brand → ALLOW

Client x-brand spoof → ignored/rejected

Global identity alone → no implicit brand entitlement
```

That directly implements one of the most important architecture requirements: **RTH users cannot access SkillUp-only resources and vice versa, and brand context must be validated server-side rather than trusted from the client.** FinalAechitecture

---

# Phase 4 — cross-application architecture qualification

After those three individual applications pass, we do one cross-platform phase.

This is where we verify the combined system:

```text
                        people_prod
                            │
                      Global identity
                            │
              ┌─────────────┴─────────────┐
              │                           │
        RTH membership              SkillUp membership
              │                           │
       realtutorialhub-web             skillup-web
              │                           │
           rth_prod                 skillup_prod
              │                           │
              └──────── SkillHubCore ─────┘
                    shared capabilities
```

The architecture is very clear that shared identity/shared infrastructure **does not mean unrestricted shared authorization or unrestricted shared data**. FinalAechitecture

At this point we perform:

- cross-brand security tests;
- shared-package dependency tests;
- database ownership checks;
- gateway contract tests;
- identity/membership tests;
- common event contract checks;
- failure-isolation assessment.

---

# Phase 5 — operational and scale architecture

Only after application architecture is stable should we seriously qualify scale.

That includes:

```text
Cloudflare/CDN
Gateway rate limits
Database pooling
Caching
Queues
Retries
Timeouts
Autoscaling
Health checks
Backups
Restore
RTO/RPO
Observability
Load testing
Failure testing
```

`FinalAechitecture.md` explicitly proposes staged readiness—from architecture baseline, production foundation and initial online launch through growth, large-scale readiness and finally analytics/AI expansion. FinalAechitecture

So we should not jump directly to “million-user ready.”

---

## One important rule during implementation

We should **not automatically rewrite existing working code merely because it does not look textbook-perfect**.

For every discrepancy I will classify it as:

```text
Architecture violation → must fix

Architectural weakness → should fix

Acceptable implementation variation → keep

Future scale requirement → document/defer

Not applicable → no work
```

That avoids unnecessary refactoring.

---

# How I suggest we work together from this point

The next action should be **Phase 1A: SkillHubCore Admin Architecture Baseline**.

I will inspect the current GitHub branch and build the first authoritative matrix covering:

```text
1. Application/module boundaries
2. Shared-package boundaries
3. Service dependencies
4. Database ownership/access
5. Authentication boundary
6. Authorization/RBAC
7. Brand/tenant context
8. API/BFF trust boundaries
9. Project AI boundary
10. Validation and error handling
11. Caching
12. Observability
13. Tests/CI enforcement
```

For every row I will report:

**FinalArchitecture requirement → GitHub implementation → exact files → status → gap → recommended implementation → verification test.**

We should **not make changes during that first pass**. First establish the exact baseline. Then we can turn only the `Partially implemented` and `Not implemented` items into the **SkillHubCore Admin implementation backlog**, complete them, re-audit the branch, close Phase 1, and only then begin `skillup-web`.

That gives us a disciplined path:

**SkillHubCore Admin baseline → fix → verify → close → SkillUp baseline → fix → verify → close → RTH baseline → fix → verify → close → cross-brand qualification → operational/scaling qualification.**

Yes. **All engineering principles and implementation standards specified in `FinalAechitecture.md` must be part of the audit and implementation for every application**, not just security, authentication, or database architecture.

The document explicitly says these should become **project-wide engineering standards**, and divides them into mandatory architectural, implementation, and operational principles. That includes SOLID, DRY, Separation of Concerns, Least Privilege, explicit dependency boundaries, single ownership, secure-by-default behavior, KISS, YAGNI, type safety, validation, error handling, idempotency, tests, observability, resilience, database connection management, and related controls. FinalAechitecture

So I would slightly expand our earlier roadmap.

## Final implementation order

We should proceed in this exact sequence:

| Phase | Application | Purpose |
|---|---|---|
| **1** | `apps/skillhubcore-admin` | Shared/admin platform architecture first |
| **2** | `apps/skillup-web` | SkillUp/SUIA learner application |
| **3** | `apps/realtutorialhub-web` | RTH learner application |
| **4** | `apps/skillupitacademy-site` | SkillUp marketing/public website |
| **5** | `apps/realtutorialhub-site` | RTH marketing/public website |
| **6** | Cross-application/shared architecture | Shared packages, gateway, identity, databases, cross-brand contracts |
| **7** | Operational/scaling qualification | CI/CD, observability, backups, load, reliability, capacity |

That extends the earlier three-app sequence rather than replacing it. The existing plan was already to finish `skillhubcore-admin`, then `skillup-web`, then `realtutorialhub-web` before broader platform qualification. Review Project Files

And yes: **both marketing sites should be included after the three core applications**.

---

# What "architecture implementation" will mean

We are not going to check only whether folders exist or whether the application builds.

For every application, I will evaluate **four complete layers**.

### A. Architecture principles

These include the principles explicitly described in `FinalAechitecture.md`:

**SOLID**
- SRP — Single Responsibility Principle
- OCP — Open/Closed Principle
- LSP — Liskov Substitution Principle
- ISP — Interface Segregation Principle
- DIP — Dependency Inversion Principle

And:

- DRY
- KISS
- YAGNI
- Separation of Concerns
- High cohesion
- Low coupling
- Explicit contracts
- Dependency direction
- Single ownership of business rules
- Composition over inheritance
- Encapsulation
- Law of Demeter
- Explicit over implicit
- Immutable-data preference where appropriate

The architecture specifically says UI, API, business logic, data access, authentication, authorization and observability should represent distinct concerns rather than being mixed together. FinalAechitecture

---

# B. Security and data architecture

For every application we will also verify:

- Authentication
- Authorization/RBAC
- Ownership checks
- Least privilege
- Brand isolation
- Global identity vs brand membership
- Trusted brand context
- Header sanitization
- CSRF/origin controls
- Session handling
- Token refresh/revocation
- Secrets
- API validation
- Input size/depth
- Safe error responses
- Sensitive-response caching
- Data ownership
- Correct database ownership
- Repository/data-access boundaries
- Safe migrations
- Idempotency
- Audit logging

So principles such as SOLID will **not be treated separately from security architecture**. They all form one readiness assessment.

---

# C. Code-quality principles

For every significant module/component/service/API route we will check questions such as:

**SRP**
> Does this file/module have one coherent responsibility?

A 1,000-line API route doing authentication + validation + business rules + SQL + event publishing + response formatting would fail this check.

**DRY**
> Is authoritative business logic duplicated in several apps/routes?

If the same brand-access decision exists in five routes, that probably belongs in an authoritative shared service/function.

But we will follow the architecture's warning about **DRY without forcing artificial abstractions**. FinalAechitecture

**KISS**
> Is the implementation unnecessarily complex?

We will simplify where complexity provides no architectural value.

**YAGNI**
> Are we building abstractions for hypothetical future requirements?

The architecture explicitly warns against creating a very generic multi-tenant framework just because you might someday support many brands. FinalAechitecture

**DIP**
> Does business logic depend on contracts rather than infrastructure details?

Preferred:

```text
API route
   ↓
Application service
   ↓
Domain/business rules
   ↓
Repository interface
   ↑
Drizzle/Postgres implementation
```

This exact style is described in the architecture as the combination of SRP, DIP, SoC, DRY and KISS. FinalAechitecture

---

# D. Operational principles

Each phase will also inspect what applies to that application:

- structured logging;
- metrics/tracing;
- graceful failure;
- health checks;
- request timeouts;
- retries where safe;
- rate limiting;
- connection management;
- cache strategy;
- CDN behavior;
- background workload separation;
- safe configuration;
- environment validation;
- build/lint/type-check;
- unit tests;
- integration tests;
- contract tests;
- architecture/security tests;
- CI enforcement.

This is important because `FinalAechitecture.md` does not treat architecture as only code organization—it explicitly includes scalability, availability, security, data isolation, operational reliability and cost efficiency. FinalAechitecture

---

# Phase 1 — SkillHubCore Admin will therefore become much deeper

Instead of the earlier 1A–1F only, I would now organize Phase 1 into these **eight gates**:

| Gate | SkillHubCore Admin assessment |
|---|---|
| **1A** | Module/service boundaries and dependency direction |
| **1B** | SOLID / DRY / KISS / YAGNI / SoC / cohesion / coupling |
| **1C** | Authentication, RBAC, authorization, trust boundaries |
| **1D** | Database ownership, repositories, data access |
| **1E** | API contracts, validation, idempotency, errors, caching |
| **1F** | Shared capabilities + Project AI boundary |
| **1G** | Observability, resilience, configuration, operations |
| **1H** | Tests, architecture enforcement, typecheck, lint, build, CI |

For every gate we'll produce concrete GitHub evidence.

---

# Example of the matrix

Instead of just:

> "SOLID = passed"

we need evidence such as:

| ID | Principle | GitHub evidence | Finding | Status |
|---|---|---|---|---|
| SHC-SRP-01 | SRP | `route.ts` | route contains auth + DB + business workflow | Partial |
| SHC-DIP-01 | DIP | tutorial service/repository | service depends on repository interface | Implemented |
| SHC-DRY-01 | DRY | multiple API routes | same permission rule duplicated | Needs refactor |
| SHC-KISS-01 | KISS | auth helper | unnecessary fallback chain | Needs simplification |
| SHC-YAGNI-01 | YAGNI | abstraction X | unused speculative extension layer | Remove/justify |
| SHC-SOC-01 | SoC | API/service/repository | responsibilities separated | Implemented |
| SHC-LP-01 | Least privilege | admin guard | operation permissions enforced | Verified |

And implementation work will be generated from **only the failed/partial items**.

---

# We will not apply SOLID mechanically

This is important.

We should **not** convert every 20-line function into an interface + class + repository + factory just to claim SOLID compliance.

For example:

```text
simple transformation
```

does not need:

```text
interface
factory
abstract base class
service
adapter
repository
provider
```

unless there is a real architectural reason.

That would violate **KISS and YAGNI while supposedly implementing SOLID**.

The architecture itself says abstractions should be introduced only when they provide meaningful value and that both presentation and platform code should follow the principles differently. That is the right standard to use.

---

# Phase 2 — SkillUp/SUIA Web

After SkillHubCore Admin closes, we repeat **all eight gates** for:

`apps/skillup-web`

but with heavier focus on:

```text
SkillUp brand membership
SkillUp learner authorization
SkillUp database ownership
skillup_prod boundaries
progress/enrollment ownership
tutorial access
assignments
assessment integrity
personalized cache control
BFF identity propagation
learner UI architecture
React component/hook responsibilities
frontend state management
performance
```

SOLID/DRY/KISS/SoC are checked across **both backend/BFF code and React code**.

For example:

```text
React component
    ↓ should render/orchestrate UI

hook/application layer
    ↓ handles application interaction

service/domain
    ↓ business behavior

API
    ↓ trusted server operations
```

A React component should not become the authoritative implementation of brand access or scoring.

---

# Phase 3 — RealTutorialHub Web

Then repeat the full assessment for:

`apps/realtutorialhub-web`

including:

- SOLID;
- DRY;
- KISS;
- YAGNI;
- SoC;
- dependency direction;
- domain ownership;
- auth;
- brand isolation;
- RTH membership;
- `rth_prod` ownership;
- assignment/progress/tutorial rules;
- APIs;
- caching;
- observability;
- testing;
- performance.

Then we do explicit RTH ↔ SkillUp cross-brand tests.

---

# Phase 4 and 5 — Marketing websites

Yes, these should absolutely be included, but **after the core authenticated apps**.

### `skillupitacademy-site`

This phase will emphasize:

- SRP and component architecture;
- DRY/shared design components;
- KISS/YAGNI;
- frontend dependency boundaries;
- static vs dynamic rendering;
- CDN/cacheability;
- SEO;
- Core Web Vitals;
- image/font optimization;
- minimal client-side JavaScript;
- security headers;
- public API usage;
- no accidental personalized/private data;
- lead/contact form validation and abuse protection;
- observability.

### `realtutorialhub-site`

Exactly the same framework, with RTH-specific brand/domain concerns.

Marketing sites will have many items marked **N/A**:

```text
refresh-token rotation
student-progress ownership
exam idempotency
brand learner membership
```

because those concerns should not exist in a public marketing frontend.

That is better than forcing irrelevant architecture onto every application.

---

# Shared-code decision will happen continuously

Suppose during SkillUp assessment we discover:

```text
skillup-web
   └── duplicate authorization logic

realtutorialhub-web
   └── same authorization logic
```

We don't immediately copy a fix twice.

We ask:

> Is this genuinely brand-independent shared functionality?

If yes:

```text
shared package / SkillHubCore capability
```

If not:

```text
brand-owned implementation
```

This implements **DRY + single ownership without incorrectly coupling the two brands**.

That distinction is extremely important.

---

# Final cross-platform qualification

After all five apps:

```text
skillhubcore-admin
skillup-web
realtutorialhub-web
skillupitacademy-site
realtutorialhub-site
```

pass individually, we perform a final platform-level assessment covering:

```text
              Global identity
                    │
              SkillHubCore
             /             \
        SkillUp             RTH
       /      \            /    \
 learner   marketing   learner  marketing
    │                       │
skillup_prod             rth_prod
```

Then verify:

- no circular/shared dependency violations;
- no duplicated authoritative business logic;
- correct shared packages;
- correct brand ownership;
- database ownership;
- cross-brand isolation;
- shared identity contract;
- gateway identity contract;
- events;
- observability;
- deployment isolation;
- frontend caching;
- service failure isolation;
- CI architecture gates.

---

## Our final readiness report per app

Every phase ends with one table:

| Category | Status |
|---|---|
| Architecture boundaries | ✅ / 🟡 / 🔴 |
| SOLID | ✅ / 🟡 / 🔴 |
| DRY | ✅ / 🟡 / 🔴 |
| KISS | ✅ / 🟡 / 🔴 |
| YAGNI | ✅ / 🟡 / 🔴 |
| Separation of Concerns | ✅ / 🟡 / 🔴 |
| Dependency direction | ✅ / 🟡 / 🔴 |
| High cohesion / low coupling | ✅ / 🟡 / 🔴 |
| Security / least privilege | ✅ / 🟡 / 🔴 |
| Brand isolation | ✅ / 🟡 / 🔴 |
| Data ownership | ✅ / 🟡 / 🔴 |
| API contracts | ✅ / 🟡 / 🔴 |
| Idempotency | ✅ / 🟡 / N/A |
| Type safety | ✅ / 🟡 / 🔴 |
| Error handling | ✅ / 🟡 / 🔴 |
| Observability | ✅ / 🟡 / 🔴 |
| Resilience | ✅ / 🟡 / 🔴 |
| Tests | ✅ / 🟡 / 🔴 |
| CI enforcement | ✅ / 🟡 / 🔴 |
| Performance architecture | ✅ / 🟡 / 🔴 |
| Overall | **phase gate decision** |

And we'll retain the architecture's five formal states:

**Implemented and verified / Implemented but unverified / Partially implemented / Not implemented / Not applicable.**

One current repository detail should also stay visible as we begin: the previously reviewed branch was at `86413873…`, with the security remediation substantially implemented but one faculty helper issue and lack of CI proof still noted. Review Project Files Those are existing findings—not substitutes for the broader architecture/principles audit we are about to do.

So yes: **the scope is now the entire `FinalAechitecture.md`, including SOLID, DRY, KISS, YAGNI and every other architecture/coding/operational principle—not just security.**

Our working order will be:

**SkillHubCore Admin → SkillUp Web → RTH Web → SkillUp marketing site → RTH marketing site → shared/cross-platform architecture → operational/scalability qualification.**

The next step should therefore be **Phase 1A + 1B on `skillhubcore-admin`: establish the complete architecture/principles baseline against the current GitHub branch before making further changes.**

Yes. We have now **started Phase 1 for `skillhubcore-admin`** against the current GitHub branch `feature/project-llm-linux-worker`, currently at HEAD `864138730d4c74b9a1eba231be880172d43716d5`.

For this first pass I concentrated on **1A — module/service boundaries and dependency direction** and **1B — SOLID/DRY/KISS/YAGNI/SoC/cohesion/coupling**. This is an architecture baseline, not yet a code-change pass.

`FinalAechitecture.md` requires these principles to be treated together: SRP/DIP/SoC/DRY/KISS are demonstrated by separating API handling, business logic, repository contracts and persistence; it also makes SOLID, DRY, separation of concerns, least privilege, explicit dependencies and single ownership mandatory architectural principles. FinalAechitecture

## Phase 1A/1B — Initial SkillHubCore Admin assessment

I inspected the application structure and representative high-risk/high-complexity files. The `src` tree currently contains approximately **253 files, 46 API `route.ts` files, 34 pages, 23 source files over 20 KB, and 5 over 50 KB**.

The preliminary result is:

| Principle / Area | Current status | Assessment |
|---|---|---|
| Application/module boundaries | 🟡 Partially implemented | Good directory separation exists, but important routes still own domain + DB logic |
| SRP | 🔴 Needs remediation | Several API routes/pages have multiple unrelated reasons to change |
| OCP | 🟡 Partial | Some shared clients/components exist, but large workflow pages require modification for new behavior |
| LSP | ⚪ Not enough evidence yet | Needs interface/implementation pass |
| ISP | 🟡 Partial | Typed interfaces exist, but interface boundaries need deeper review |
| DIP | 🔴 Architecture violation found | Route layer directly depends on Drizzle/database implementations |
| DRY | 🟡 Partial | Shared helpers exist, but authentication/orchestration/UI definitions are still duplicated |
| KISS | 🟡 Partial | Several areas are unnecessarily large/complex |
| YAGNI | 🟡 Partial | Disabled/placeholder/speculative UI code remains |
| Separation of Concerns | 🔴 Violation found | At least one major route mixes HTTP, business, synchronization and persistence |
| High cohesion | 🟡 Partial | Feature directories help, but giant page/route modules reduce cohesion |
| Low coupling | 🟡 Partial | Shared packages help, but app directly depends on multiple database packages |
| Explicit contracts | 🟢 Good foundation | Zod/types/service clients are present |
| Single ownership | 🟡 Partial | Some authoritative services exist; other business logic remains in routes |
| Secure by default | 🟢 Strong current foundation | Central admin guard, brand-bound token checks and sanitized proxy exist |
| Testability | 🟡 Partial | Tests exist, but direct DB/orchestration coupling makes some domains harder to isolate |
| Observability | 🟡 Partial | Logging exists but structured observability is inconsistent |
| Change safety / CI | 🔴 Not verified/enforced | Branch is unprotected and has no required status checks |

So **SkillHubCore Admin does not yet pass Phase 1A/1B**.

---

## 1. Strong foundation: the application is already modular at the directory level

The app isn't a single flat Next.js project. It already separates:

```text
src/
  app/
  components/
  hooks/
  lib/
  data/
```

and `app` further separates:

```text
(admin)
(authenticated)
(public)
api
```

This is good.

There are also useful specialized modules such as:

```text
lib/admin-route-guard.ts
lib/auth-helpers.ts
lib/upstream-proxy.ts

lib/project-llm/
app/.../project-llm/components/
app/.../project-llm/context/
```

This means we **do not need a redesign from zero**.

The remediation should preserve this structure and move misplaced responsibilities into the correct layer.

---

# 2. Major architecture violation: `tutorial-left-sidebar/route.ts`

This is currently the clearest Phase 1A problem.

`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`

is approximately **31 KB**.

It imports database implementations directly:

```ts
import {
  db as tutorialDb,
  tutorialSidebarTreesV2,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
} from '@quiz/db-tutorial';

import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
```

Then the same API route performs:

```text
HTTP handling
    +
authorization
    +
Main DB querying
    +
Tutorial DB querying
    +
hierarchy synchronization
    +
cross-database mapping
    +
slug generation
    +
transaction orchestration
    +
validation
    +
diagnostic logging
    +
error interpretation
```

For example, the route contains a large function:

```ts
ensureTopicHierarchySynced(...)
```

which fetches:

```text
topic
subject
domain
active subtopics
```

from one data source and then manages a transaction into another.

### Why this violates `FinalAechitecture.md`

The target model says:

```text
API route
    ↓
Application service
    ↓
Business/domain rules
    ↓
Repository contract
    ↑
Database implementation
```

rather than having database logic embedded in the HTTP layer. FinalAechitecture

Current:

```text
Next.js route
   ├── HTTP
   ├── business rules
   ├── sync logic
   ├── @quiz/db
   ├── @quiz/db-tutorial
   └── Drizzle transaction
```

Target:

```text
route.ts
   ↓
TutorialSidebarApplicationService
   ↓
HierarchySyncService
   ↓
contracts
   ├── CurriculumHierarchyRepository
   └── TutorialHierarchyRepository
            ↑
        Drizzle implementations
```

### Classification

**SHC-DIP-001 — High**

**SHC-SRP-001 — High**

**SHC-SOC-001 — High**

This should be one of our first implementation tasks.

---

# 3. The route should become thin

Eventually, the route should look much closer to:

```ts
export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const input = await parseSidebarPublishRequest(request);

  if (!input.success) {
    return input.response;
  }

  const result =
    await tutorialSidebarApplicationService.publish(input.data);

  return NextResponse.json(result);
}
```

Not hundreds of lines of synchronization logic.

The application service should own the workflow.

---

# 4. Good example: Tutorial Composer is closer to the intended architecture

`apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts`

is substantially better architecturally.

It delegates creation to:

```ts
tutorialComposerService.createTutorial(...)
```

rather than implementing persistence itself.

That's closer to:

```text
route
 ↓
service
 ↓
repository/persistence
```

So this should become the **reference style** for other admin domains.

However, it has some cleanup issues.

---

# 5. Duplicate authentication in Tutorial Composer

The route first does:

```ts
const accessDenied =
  await requireAdminRequest(request);
```

which already calls authentication and permission logic.

Then inside `POST()` it does again:

```ts
const authResult =
  await authenticateRequest(request);
```

So the same request effectively goes through overlapping authentication work.

There may be a legitimate reason—the second call provides the user object—but architecturally the contract should return the verified principal rather than authenticate twice.

Better:

```ts
const result =
  await requireAdminRequestContext(request);

if (!result.ok) {
  return result.response;
}

const { user } = result;
```

Then:

```text
authenticate once
authorize once
use verified context everywhere
```

### Classification

**SHC-DRY-001 — Medium**

**SHC-KISS-001 — Medium**

**SHC-SOC-002 — Medium**

This does not look like a security vulnerability; it's architectural duplication.

---

# 6. `admin-route-guard.ts` is a good architectural component

This file is one of the better parts of the current admin architecture.

It centralizes:

```text
authentication
admin role
operation permission
mutation origin policy
route → permission mapping
```

and the route layer can call:

```ts
requireAdminRequest(request)
```

This is good DRY, SRP and secure-by-default behavior.

It also correctly maps things like:

```text
publish
delete
create
edit
```

to separate permissions.

So I would classify:

**SHC-SEC-BOUNDARY-001 — Implemented**

**SHC-DRY-AUTH-001 — Implemented**

We should extend this design rather than replacing it.

---

# 7. `upstream-proxy.ts` is also structurally good

Another positive example.

The proxy doesn't blindly forward browser identity.

It creates a fresh header collection and allows a small set of request headers:

```ts
accept
content-type
x-request-id
x-correlation-id
```

It then constructs trusted identity from the authenticated principal:

```ts
x-user-id
x-original-user-id
x-shadow-user-id
x-user-roles
x-user-email
```

and establishes:

```ts
x-brand = skillhubcore
```

server-side.

Architecturally:

```text
Browser
   ↓
untrusted request
   ↓
SkillHubCore BFF
   ↓
authenticated principal
   ↓
server-created trusted identity
   ↓
upstream service
```

This is a good example of:

- encapsulation;
- secure defaults;
- explicit dependency/trust boundary;
- single ownership of forwarded identity.

We should retain this.

---

# 8. Project LLM frontend has clear SRP problems

The largest frontend file is:

```text
integration-certification/page.tsx
≈ 131 KB
```

Other examples:

```text
external-ai-handoff/page.tsx       ≈ 60 KB
candidate-upload/page.tsx          ≈ 52 KB
project-llm/page.tsx               ≈ 36 KB
create/page.tsx                    ≈ 29 KB
workflow-details/page.tsx          ≈ 25 KB
```

File size by itself isn't an architecture violation.

But inspection confirms the largest files mix multiple responsibilities.

For example `IntegrationCertificationPage` currently owns many independent states:

```ts
certificationData
resolvedCandidateId
activeTab
runtimeHealth
browserVerification
manifest
placementResult
isPlanning
isExecuting
isApproving
isQualifying
isVerifyingComposer
isApprovingFinal
isSuperseding
proposedNextVersion
composerVerification
learnerVerification
error
elapsedSeconds
...
```

and also directly orchestrates operations such as:

```text
load certification
load placement manifest
load runtime health
load browser verification
create replacement workflow
plan placement
execute placement
approve
qualify
verify composer
verify learner runtime
supersede
```

while also rendering the entire page.

This is exactly the type of SRP issue we should fix.

---

# 9. Project LLM target decomposition

I would not create dozens of classes.

A KISS-compliant React refactor could simply be:

```text
integration-certification/
  page.tsx

  hooks/
    useCertification.ts
    usePlacement.ts
    useRuntimeVerification.ts

  components/
    CertificationSummary.tsx
    RepositoryGatePanel.tsx
    UnitTestGatePanel.tsx
    ComposerGatePanel.tsx
    RuntimeGatePanel.tsx
    PlacementPanel.tsx
```

Then:

```text
page.tsx
     ↓
orchestrates page composition

hooks
     ↓
application interaction/state

projectLlmClient
     ↓
transport/API contract

backend
     ↓
authoritative business rules
```

That would improve:

- SRP;
- testability;
- readability;
- cohesion;
- change safety;

without introducing excessive architecture.

---

# 10. `CandidateUploadPage` has the same pattern

It currently handles:

```text
drag/drop UI
file-selection state
upload state
file-size formatting
backend upload
certification loading
certification progress calculation
error translation
timer state
live accessibility announcements
rendering
```

Some of that belongs together, but the workflow API interaction can be extracted into:

```ts
useCandidateQualification()
```

or similar.

That would allow the page to focus on presentation.

### Classification

**SHC-SRP-002 — Medium**

**SHC-TEST-001 — Medium**

---

# 11. Static mock/admin data is still mixed into the application

`src/lib/skillhubcore-admin-data.ts` contains hardcoded:

```ts
adminAuditLogs
adminUsers
adminSubscriptions
adminEventLog
adminMetricsSummary
adminDashboardSummary
```

including:

```ts
John Doe
Jane Smith
12500 monthlyActiveUsers
450000 monthlyRecurringRevenue
```

This appears to be demo/static application data.

The Audit page currently imports:

```ts
adminAuditLogs
```

directly and says:

> This is the primary security monitoring page.

That means the presentation currently presents static local data as if it were the audit source.

Architecturally this is not acceptable for the final admin platform.

We need:

```text
AuditPage
   ↓
audit query/application hook
   ↓
admin API
   ↓
AuditService
   ↓
authoritative audit repository
```

not:

```text
AuditPage
   ↓
static array in lib
```

This does not necessarily need immediate deletion if the UI is intentionally a prototype, but it must be classified correctly.

### Classification

**SHC-DATA-OWN-001 — Not production implemented**

**SHC-SOC-003 — Partial**

**SHC-SINGLE-OWNER-001 — Partial**

---

# 12. Some admin UI appears speculative / placeholder-heavy

For example `LeftSidebar.tsx` includes navigation entries such as:

```text
Constitutional Center → #
Prompt Governance → #
Architecture Governance → #
Brand & Deployment → #
System Settings → #
Exam Engine → #
Placement Engine → #
Faculty Engine → #
Internship Engine → #
```

There are also substantial inactive sections in `RightSidebar.tsx` wrapped in:

```tsx
{false && (...)}
```

This is relevant to **YAGNI**.

The architecture explicitly warns us not to build hypothetical functionality prematurely. FinalAechitecture

The correct approach is not necessarily deletion of every placeholder, but production code should not accumulate large disabled feature implementations.

We should either:

```text
implemented feature → expose it

planned feature → describe in roadmap/design docs

dead speculative code → remove it
```

rather than:

```tsx
{false && hugeUIBlock}
```

### Classification

**SHC-YAGNI-001 — Medium**

**SHC-KISS-002 — Medium**

---

# 13. Sidebar navigation configuration should be data-driven

`LeftSidebar.tsx` currently embeds several menu arrays directly inside render sections.

For example:

```tsx
[
  { icon, label, href },
  { icon, label, href },
  ...
].map(...)
```

repeated for several menu groups.

This isn't a serious architecture defect, but it's an easy DRY/SRP improvement.

Prefer:

```ts
const ADMIN_NAVIGATION = [
  {
    section: 'Governance & Core',
    items: [...]
  },
  {
    section: 'Engines',
    items: [...]
  }
];
```

with a generic:

```tsx
<NavigationSection />
```

This would also make permission filtering easier later.

### Classification

**SHC-DRY-002 — Low**

---

# 14. Dependency direction currently needs tightening

`skillhubcore-admin/package.json` directly depends on:

```text
@quiz/db
@quiz/db-tutorial
drizzle-orm
```

A frontend/BFF application having those dependencies is not automatically wrong.

But combined with route code that directly performs business persistence, it confirms that infrastructure is leaking upward.

Our target should be:

```text
skillhubcore-admin
   ↓
application/domain contract
   ↓
owned service/repository
   ↓
db package
```

Direct DB use should remain only where the app is deliberately the authoritative application service for that capability.

We should **not automatically prohibit all DB imports**.

Instead we'll classify every direct DB access as:

```text
valid app-owned repository implementation
or
architecture violation
```

That's the important distinction.

---

# 15. OCP / ISP / LSP need a deeper second pass

I don't want to mark these green or red based only on file size.

For:

- Open/Closed Principle;
- Interface Segregation;
- Liskov Substitution;

we need to inspect:

```text
interfaces
service implementations
repositories
strategy-like abstractions
Project LLM client types
tutorial services
factory modules
```

So their current status is intentionally not “passed”.

That's consistent with our rule not to manufacture compliance evidence.

---

# 16. Type safety foundation is decent but not complete

There is a good foundation:

```text
TypeScript
Zod
@quiz/types
@quiz/validation
typed Project LLM client
strict linting rules
```

But `auth-helpers.ts` still contains things like:

```ts
(payload as any).userId
(payload as any).email
```

with lint suppression.

That often indicates the token contract does not accurately describe the runtime payload.

Better:

```ts
AdminAccessTokenClaims
```

should formally contain all expected claims.

Then auth code should not need `any`.

### Classification

**SHC-TYPE-001 — Medium**

---

# 17. Observability is only partially aligned

The package depends on:

```text
@quiz/observability
pino
```

which is good.

But `tutorial-left-sidebar/route.ts` currently uses extensive:

```ts
console.log(...)
console.error(...)
```

and even extracts/logs structures containing:

```text
stack
detail
hint
routine
raw error object
```

This deserves review.

For production architecture, prefer:

```ts
logger.info({
  event: 'tutorial_hierarchy_sync',
  phase,
  status,
  correlationId,
  topicId
});
```

and sanitized errors.

So:

**SHC-OBS-001 — Partial**

We will address that formally in Gate 1G.

---

# 18. Change-safety enforcement currently fails the architecture gate

The app itself has useful scripts:

```text
build
lint
test
test:security
check:boundaries
type-check
```

That is good.

But the current branch reports:

```text
protected: false
required_status_checks: []
```

and our previous GitHub inspection found no workflow runs associated with current HEAD.

So the repository has **quality tools**, but they are not yet proven as mandatory merge gates.

This is an important distinction:

```text
tests exist
≠
tests are enforced
```

### Classification

**SHC-CI-001 — Not implemented/verified as merge enforcement**

This will be part of Gate 1H.

---

# Phase 1A/1B backlog

Based on what we've inspected so far, I would make these the first SkillHubCore Admin architecture tasks, in this order:

1. **Refactor `tutorial-left-sidebar/route.ts`** into thin route → application service → repository contracts/implementations.
2. **Create a reusable authenticated admin context** so routes don't call `requireAdminRequest()` and `authenticateRequest()` independently.
3. **Break the largest Project LLM client pages into cohesive hooks/components**, starting with `integration-certification`.
4. **Replace `skillhubcore-admin-data.ts` static operational/audit sources** with authoritative service/API contracts, or clearly isolate them as demo fixtures.
5. **Remove or isolate speculative/disabled UI**, especially large `{false && ...}` implementations and placeholder navigation.
6. **Make navigation configuration data-driven** instead of embedding multiple menu definitions in JSX.
7. **Tighten token claim types** so auth logic doesn't require `any`.
8. **Move production diagnostics to structured observability** with sanitized errors.
9. **Add dependency-boundary tests/lint rules**, especially around UI/API/domain/DB direction.
10. **Make typecheck/lint/build/security/architecture tests mandatory CI gates.**

These are not all equal priority. Items 1–4 affect architecture materially; items 5–7 improve maintainability; items 8–10 make the architecture enforceable.

## Phase 1A/1B decision

At this point:

**`skillhubcore-admin` = PARTIALLY IMPLEMENTED against `FinalAechitecture.md`.**

The positive news is that this is primarily a **refactoring and boundary-enforcement problem**, not a need to rebuild the application. Central authentication, RBAC, route guarding, upstream identity sanitation, typed contracts, shared packages and Project LLM API separation already give us a strong base.

The next concrete step is **Phase 1A/1B implementation**, beginning with the highest-impact architectural violation: `tutorial-left-sidebar/route.ts`, followed by the reusable admin principal/context boundary. After those changes, we re-audit 1A/1B before proceeding to Gate **1C — authentication/RBAC/trust boundaries**.

Yes. I’ll take the **Principal Architect** role for this phase and treat `FinalAechitecture.md` as the governing specification, not as a suggestion.

I have now started the detailed review properly. I have **not modified any GitHub files yet** because changing code before completing the architectural baseline would risk solving symptoms instead of establishing the correct boundaries.

The governing standard is explicit: API, business logic and persistence should be separated; SRP, DIP, SoC, DRY and KISS should work together; and SOLID, DRY, least privilege, explicit dependencies, single ownership, secure defaults, validation, idempotency, testing and operational resilience are mandatory project principles. FinalAechitecture

## What I have reviewed so far

The current `skillhubcore-admin` source contains approximately:

- **253 total files**
- **225 production TS/TSX/JS files**
- **150 files under `app/`**
- **32 components**
- **24 `lib/` production modules**
- **46 API route files**
- **34 page files**
- **23 source files above 20 KB**
- **5 source files above 50 KB**

Current branch remains:

`feature/project-llm-linux-worker`

HEAD:

`864138730d4c74b9a1eba231be880172d43716d5`

I have now completed a structural/API-boundary scan across **all 46 API routes**, and detailed code inspection of the most architecturally important files including authentication/guard/proxy code, the main taxonomy CRUD routes, Tutorial Composer routes, Tutorial Sidebar, Project LLM pages, cache invalidation, factory helpers and administrative data.

This is not yet the end of the 225-file review. I am deliberately distinguishing **reviewed** from **not yet fully reviewed**.

---

# First major architectural conclusion

There are actually **two different architectures inside `skillhubcore-admin` right now**.

One is close to the target architecture:

```text
Browser
   ↓
Next.js BFF route
   ↓
central guard
   ↓
trusted proxy/service
   ↓
backend
```

The other is:

```text
Browser
   ↓
Next.js route
   ↓
Drizzle
   ↓
database
```

with business rules and persistence embedded inside the route.

The first is substantially aligned with `FinalAechitecture.md`.

The second needs refactoring.

---

# Finding 1 — taxonomy administration has systemic direct-DB coupling

This is no longer an isolated finding.

The following routes directly import `@quiz/db` and `drizzle-orm`:

```text
admin/domains/[id]
admin/domains/batch-delete
admin/domains

admin/skills/[id]
admin/skills/batch-delete
admin/skills

admin/subjects/[id]
admin/subjects/batch-delete
admin/subjects

admin/subtopics/[id]
admin/subtopics/batch-delete
admin/subtopics

admin/topics/[id]
admin/topics/batch-delete
admin/topics
```

So this is a **domain-wide architectural pattern**.

For example:

```ts
import { domains, getDb } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
```

followed directly by:

```ts
const db = getDb();

const results = await db
  .select()
  .from(domains)
```

and:

```ts
await db
  .insert(domains)
```

and:

```ts
await db
  .update(domains)
```

and:

```ts
await db
  .delete(domains)
```

### Principal assessment

This violates the intended dependency direction:

```text
HTTP
 ↓
Application
 ↓
Domain
 ↓
Repository contract
 ↑
DB implementation
```

Instead we currently have:

```text
HTTP
 ↓
database implementation
```

### Finding IDs

**SHC-DIP-001 — HIGH**

**SHC-SOC-001 — HIGH**

**SHC-DATA-BOUNDARY-001 — HIGH**

This needs architectural remediation.

---

# Finding 2 — Domain/Subject/Topic/Subtopic CRUD is heavily duplicated

The detailed review of these four main files confirmed substantial repetition:

```text
domains/route.ts
subjects/route.ts
topics/route.ts
subtopics/route.ts
```

Each independently implements:

```text
guard
try/catch
getDb()
query parsing
search
pagination
insert
update
delete
batch delete
error formatting
HTTP responses
```

For example, all have variants of:

```ts
const accessDenied = await requireAdminRequest(request);
if (accessDenied) return accessDenied;
```

then:

```ts
const db = getDb();
```

then:

```ts
const body = await request.json();
```

then hand-written field extraction.

Then:

```ts
return NextResponse.json(...)
```

and generic:

```ts
catch (error) {
  return NextResponse.json(
    { error: 'Failed to ...' },
    { status: 500 }
  );
}
```

### DRY problem

The duplication isn't merely cosmetic.

Business behavior, validation and persistence conventions can diverge over time.

For example:

`domains` uses:

```ts
if (!name || !category)
```

while `topics` uses:

```ts
if (!name || !subjectId)
```

while `subtopics` uses:

```ts
if (!name || !topicId)
```

All validation is manually implemented instead of using common contracts.

### Classification

**SHC-DRY-001 — HIGH**

**SHC-SINGLE-OWNER-001 — HIGH**

---

# Finding 3 — these CRUD routes largely lack schema validation

The route scan shows a significant distinction.

Tutorial Composer commonly uses:

```text
safeParse
Zod/schema contracts
```

But the direct taxonomy routes generally use only:

```ts
const body = await request.json();
```

then destructuring.

For example:

```ts
const {
  name,
  description,
  category,
  status = 'active'
} = body;
```

There is no authoritative schema constraining:

```text
name type/length
description type/length
category values
status enum
order bounds
weight bounds
UUID format
unknown properties
batch size
```

That is inconsistent with the architecture's mandatory input-validation principle. FinalAechitecture

### Classification

**SHC-CONTRACT-001 — HIGH**

**SHC-TYPE-002 — HIGH**

---

# Finding 4 — unrestricted pagination limit

Routes contain patterns such as:

```ts
const limit =
  parseInt(searchParams.get('limit') || '20');
```

and then:

```ts
.limit(limit + 1)
```

but I haven't seen an enforced upper bound in the reviewed routes.

A caller could potentially request:

```text
?limit=1000000
```

depending on database/driver behavior.

The architecture calls for controlled resource usage and scalability. Input bounds are part of that.

The route should use something like:

```ts
const limit = Math.min(
  Math.max(parsedLimit, 1),
  MAX_PAGE_SIZE
);
```

preferably through a shared query schema.

### Classification

**SHC-RESOURCE-001 — MEDIUM/HIGH**

---

# Finding 5 — current “cursor pagination” is not true cursor pagination

`domains` does:

```ts
if (cursor) {
  conditions.push(eq(domains.id, cursor));
}
```

while results are ordered by:

```ts
.orderBy(desc(domains.createdAt))
```

That doesn't implement normal cursor pagination.

It effectively means:

> find row whose ID equals cursor

instead of:

> continue after `(createdAt,id)`.

That can produce incorrect continuation behavior.

`subjects` has the same issue.

Some later routes calculate `nextCursor` without using a cursor condition at all.

### Architectural implication

Pagination behavior should have **one authoritative implementation** rather than each resource inventing its own variation.

### Classification

**SHC-DATA-QUERY-001 — HIGH correctness issue**

**SHC-DRY-002 — MEDIUM**

---

# Finding 6 — DELETE semantics contradict comments

`domains/route.ts` says:

```ts
// Delete a domain (soft delete)
```

but executes:

```ts
db.delete(domains)
```

That is a **hard delete**.

This is precisely the kind of semantic drift we want to eliminate.

Either:

```text
soft delete
→ updatedAt/deletedAt/status
```

or:

```text
hard delete
→ explicitly documented and governed
```

but not a comment saying one and implementation doing the other.

### Classification

**SHC-DATA-INTEGRITY-001 — HIGH**

---

# Finding 7 — cascade/reference integrity needs explicit domain service

Deleting a:

```text
domain
subject
topic
subtopic
```

isn't just CRUD.

These entities form a hierarchy:

```text
Domain
 ↓
Subject
 ↓
Topic
 ↓
Subtopic
```

Yet some routes execute:

```ts
db.delete(...)
```

directly.

That means database constraints are implicitly being asked to determine business behavior.

We need to explicitly define:

```text
Can a domain with subjects be deleted?

Can a subject with topics be deleted?

Should deletion be blocked?

Soft deleted?

Cascade archived?

What happens to tutorial mappings?

What happens to external IDs?
```

Those are **domain rules**, not HTTP concerns.

They belong in something like:

```text
TaxonomyAdministrationService
```

or focused services:

```text
DomainService
SubjectService
TopicService
SubtopicService
```

depending on cohesion.

---

# Finding 8 — batch delete endpoints need explicit constraints

Routes such as:

```text
domains/batch-delete
skills/batch-delete
subjects/batch-delete
topics/batch-delete
subtopics/batch-delete
```

parse arrays and use:

```ts
inArray(...)
```

We need to establish centrally:

```text
maximum IDs
UUID validation
duplicate elimination
authorization scope
partial failure behavior
referential-integrity behavior
audit logging
idempotency
```

These are currently thin DB operations rather than governed domain operations.

### Classification

**SHC-BULK-001 — MEDIUM/HIGH**

---

# Finding 9 — `any` is explicitly disabled in core CRUD files

Examples begin with:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
```

and later:

```ts
const updateData: any = {
  updatedAt: new Date()
};
```

This avoids one of the major benefits of Drizzle/TypeScript.

Instead, update types should derive from the schema or explicit input contract.

For example conceptually:

```ts
type DomainUpdate =
  Partial<DomainMutableFields>;
```

or Drizzle's inferred insert/update types where appropriate.

### Classification

**SHC-TYPE-003 — MEDIUM**

---

# Finding 10 — inconsistent update semantics

Example `topics`:

```ts
if (name) updateData.name = name;
```

but:

```ts
if (description !== undefined)
  updateData.description = description;
```

This means:

```text
name = ""
→ ignored

description = ""
→ accepted
```

That may be intentional, but there's no schema establishing it.

Similarly:

```ts
if (status) ...
```

has different semantics from:

```ts
if (status !== undefined) ...
```

This is another reason validation and business contracts must be centralized.

---

# Finding 11 — suspicious `order` behavior in Domain update

The domain PUT handler extracts:

```ts
const {
  id,
  name,
  description,
  category,
  status,
  order
} = body;
```

then:

```ts
void order;
```

So the API appears to accept `order` but deliberately ignores it.

That's API-contract ambiguity.

One of three things should happen:

```text
order supported → persist it

order unsupported → reject/remove it

legacy field → explicitly deprecated
```

Not silently discard it.

### Classification

**SHC-CONTRACT-002 — MEDIUM**

---

# Finding 12 — Topic weight silently changes invalid input to `1`

Current:

```ts
weight:
  Number.isFinite(Number(weight))
    ? Number(weight)
    : 1
```

If a client submits:

```text
weight = "abc"
```

the server doesn't reject the invalid request.

It silently stores:

```text
1
```

That violates **Fail Fast** and can hide client bugs.

The architecture specifically identifies fail-fast behavior as an important principle. FinalAechitecture

Invalid input should ordinarily result in:

```text
400 / 422
```

not silent normalization unless the contract explicitly defines coercion.

---

# Finding 13 — `normalizeComplexity()` is business logic inside the HTTP route

Current:

```ts
function normalizeComplexity(value: unknown)
```

maps:

```text
expert → advanced
3+ → advanced
2 → intermediate
other → beginner
```

This is domain/business normalization.

It should not live in:

```text
app/api/.../route.ts
```

because another ingestion path could implement different mappings.

This is a textbook **single ownership** issue.

### Classification

**SHC-SINGLE-OWNER-002 — MEDIUM/HIGH**

---

# Finding 14 — same for `normalizeDepth()`

`subtopics/route.ts` contains:

```ts
function normalizeDepth(value: unknown) {
  const numeric = Number(value);

  return Number.isFinite(numeric)
    ? Math.max(1, Math.round(numeric))
    : 1;
}
```

Again:

```text
invalid value
→ silently becomes 1
```

This should be part of the authoritative input/domain contract.

---

# Finding 15 — authorization architecture is significantly better than CRUD architecture

All reviewed protected admin routes correctly start with:

```ts
const accessDenied =
  await requireAdminRequest(request);

if (accessDenied)
  return accessDenied;
```

This is good.

The central guard provides:

```text
authentication
admin role
permission
mutation origin
```

That means **the security boundary is already substantially centralized**.

We should preserve it.

The problem is what happens **after** the guard.

---

# Finding 16 — proxied resources are architecturally cleaner

Several API families are much thinner.

Examples:

```text
/admin/blueprints
/admin/questions
/factory
/logs
```

mostly follow:

```text
route
 ↓
requireAdminRequest
 ↓
proxyUpstreamRequest
 ↓
authoritative backend
```

and have no direct `@quiz/db` dependency.

This is much closer to the target.

So our refactor should **not homogenize everything into local services**.

We need to determine ownership per domain:

```text
SkillHubCore Admin owns it locally?
      ↓
application service + repository

another backend owns it?
      ↓
thin authenticated BFF proxy
```

That is the correct architectural distinction.

---

# Finding 17 — login/logout boundaries look intentionally thin

The auth routes delegate through:

```ts
proxyUpstreamRequest(...)
```

and use:

```ts
requireAdminMutationOrigin(...)
```

along with:

```ts
setAdminSessionCookies(...)
clearAdminSessionCookies(...)
```

This is good separation.

Authentication authority remains outside the page/UI.

---

# Finding 18 — `admin-session-cookies.ts` is cohesive

This file has one clear responsibility:

```text
admin session cookie lifecycle
```

It centralizes:

```text
accessToken
admin_accessToken
refreshToken
admin_refreshToken
```

and cookie flags.

That is a good **SRP/DRY** example.

I would keep this abstraction.

---

# Finding 19 — cache invalidation needs stronger abstraction

`cache-invalidation.ts` currently owns:

```text
DB lookup
ID translation
cache-key generation
Upstash REST protocol
HTTP deletion
logging
batch invalidation
```

That's more than one responsibility.

It also directly uses:

```ts
@quiz/db-tutorial
drizzle-orm
fetch
```

A better shape is:

```text
TutorialCacheInvalidationService
    ↓
SubtopicLookup
    ↓
CacheStore
```

or at minimum:

```text
getSubtopicSlug()
generateTutorialCacheKeys()
deleteCacheKeys()
```

with infrastructure isolated.

### More importantly

Missing Redis config currently causes:

```ts
console.warn(...)
return;
```

That may be fine for environments where caching is optional, but production policy must be explicit.

For publish operations, we must decide:

```text
cache invalidation failure
→ fail publish?

or

cache invalidation failure
→ enqueue retry?

or

cache versioning avoids delete requirement?
```

Currently it is mostly best-effort.

That will matter in Gate 1G.

---

# Finding 20 — cache invalidation can create unbounded parallel requests

Batch:

```ts
Promise.all(
  subtopicIds.map(...)
)
```

and individual keys also:

```ts
Promise.all(keys.map(...))
```

If a bulk operation touches many subtopics, this can fan out heavily.

Not immediately critical at today's scale, but the target architecture explicitly requires controlled resource usage.

We'll eventually need bounded concurrency or versioned invalidation.

---

# Finding 21 — `JsonValidator` has a valid responsibility but needs contract hardening

The factory JSON validator is reasonably cohesive:

```text
AI-output cleanup
repair
validation
conversion
```

However, it performs considerable regex-based “healing”.

That means malformed AI output can become accepted output.

This isn't necessarily wrong, but the boundary must clearly distinguish:

```text
syntax repair
        ↓
strict schema validation
        ↓
domain validation
```

At present much of the schema validation is manual.

I would eventually move it toward:

```text
repair → JSON.parse → Zod schema → domain validation
```

rather than relying on repeated casts such as:

```ts
item as Record<string, unknown>
```

and:

```ts
as GeneratedQuestion['difficulty']
```

---

# Finding 22 — generated temporary IDs use time

Current:

```ts
id: `tmp-${Date.now()}-${index}`
```

This is probably UI-only, but if these IDs cross persistence boundaries they are unsuitable as true identifiers.

We need to confirm their lifecycle during the deeper factory review.

---

# Finding 23 — Project LLM client is very large

`projectLlmClient.ts` is approximately:

**35 KB**

A transport client can legitimately contain many endpoint methods, so size alone doesn't mean SRP failure.

But during detailed Project LLM review we'll check whether it mixes:

```text
transport
response mapping
domain decisions
state transitions
workflow logic
error policy
```

If it is just an API adapter, retaining one client can still be reasonable.

I won't prematurely split it.

That is important because **SOLID should not create artificial fragmentation**.

---

# Finding 24 — `projectLlmCreationBrief.ts` is also large but more cohesive

At roughly 21 KB, it contains:

```text
repository integrity checks
constraints
runtime requirements
workflow instructions
approval gates
prompt construction
brief generation
```

These all belong broadly to:

```text
Creation Brief domain
```

So this is **not automatically a bad large file**.

It might eventually benefit from separating constants/builders, but it has much stronger cohesion than the 131 KB page component.

This is exactly why I'm not using file size as a simplistic architecture metric.

---

# Finding 25 — static repository counts are brittle

The Project LLM creation logic contains invariant assumptions like:

```text
18 families
133 documented versions
15 implementation primitives
```

and throws if repository intelligence disagrees.

If those are deliberately governed constitutional invariants, this can be valid.

If they are expected to change as blocks evolve, embedding exact counts creates maintenance coupling.

We need to establish which is intended before changing anything.

---

# Finding 26 — giant Project LLM pages are definite SRP violations

This is much clearer.

`integration-certification/page.tsx`:

**~131 KB**

owns a very large collection of concerns:

```text
routing
URL state
workflow state
certification state
runtime state
browser verification
placement planning
placement execution
approval
qualification
supersession
replacement workflow
timers
accessibility announcements
backend API calls
rendering
```

This needs decomposition.

Similarly:

```text
external-ai-handoff       ~60 KB
candidate-upload           ~52 KB
project-llm main page      ~36 KB
create                     ~29 KB
workflow-details           ~25 KB
```

These become our main frontend SRP remediation cluster.

---

# Finding 27 — `RightSidebar.tsx` contains intentionally unreachable feature code

It includes large sections guarded by:

```tsx
{false && (...)}
```

This is dead/speculative production code.

That is exactly the kind of thing **YAGNI** tells us to avoid.

The architecture explicitly warns against speculative functionality and overengineering before a concrete need exists. FinalAechitecture

We should either:

- remove it;
- move it into a documented design/prototype;
- or implement/feature-flag it properly.

Not keep large unreachable blocks in production rendering code.

---

# Finding 28 — 945-line Tutorial Sidebar API route is the strongest SRP/DIP failure

The structural scan confirmed:

```text
app/api/tutorial-left-sidebar/route.ts
≈945 lines
```

with:

```text
GET
POST
@quiz/db
@quiz/db-tutorial
drizzle-orm
24 console calls
cross-database synchronization
validation
transformation
persistence
instrumentation
```

This should be the **first major backend architecture refactor**.

Not because it is the largest file, but because it crosses the greatest number of architectural boundaries.

---

# Finding 29 — Tutorial Composer has a different systemic issue

Tutorial Composer routes generally do use:

```text
schema validation
tutorialComposerService
typed contracts
```

which is good.

But many of them perform:

```ts
requireAdminRequest(request)
```

followed again by:

```ts
authenticateRequest(request)
```

The API scan shows this pattern throughout:

```text
analysis
block-suggestions
import
presentation-ideas
sections/blocks
sections/publish
sections/[id]
suggestions/apply
sections
```

So this isn't isolated either.

We should solve it once.

---

# Required admin context design

Instead of:

```ts
requireAdminRequest()
```

then:

```ts
authenticateRequest()
```

we need a single result:

```ts
const admin =
  await requireAdminContext(request);
```

conceptually returning:

```ts
type AdminRequestContext = {
  user: AuthenticatedUser;
  permission: Permission;
};
```

or:

```text
success → verified principal/context

failure → NextResponse
```

Then every handler receives the same verified identity.

That improves:

- DRY;
- KISS;
- performance;
- auditability;
- consistency.

---

# Finding 30 — Tutorial Composer route sizes are still too large

Several reviewed routes are:

```text
sections/[sectionId]/route.ts            331 lines
suggestions/apply/route.ts               399 lines
sections/route.ts                        301 lines
blocks/route.ts                          206 lines
publish/route.ts                         190 lines
presentation-ideas                       182 lines
block-suggestions                        167 lines
```

Not all are necessarily violations, but these need decomposition review.

The positive difference is that they often delegate core persistence to `tutorialComposerService`.

So their remediation is likely smaller than Tutorial Sidebar.

---

# Finding 31 — error logging is inconsistent

Examples range from:

```ts
console.error('Error fetching domains:', error);
```

to routes that swallow details:

```ts
catch (error) {
  return NextResponse.json(...)
}
```

to Tutorial Sidebar with extensive diagnostic logs including stack/detail/hint/raw structures.

We need one policy:

```text
structured log
request/correlation ID
operation
safe context
normalized error category
no credential/token/PII leakage
```

Then:

```text
client receives stable sanitized error contract
```

This will be Gate 1G, but the architectural need is already established.

---

# Finding 32 — good health route separation

`/api/health` is small and has no admin guard.

That is appropriate if it exposes only safe health status.

The detailed security review later will verify the returned data doesn't expose internal topology.

Architecturally, a dedicated health boundary is good.

---

# Current Principal Architect classification

At this stage I would classify the main areas as:

| Area | Current status |
|---|---|
| Central admin security guard | **Implemented** |
| Trusted upstream proxy boundary | **Implemented** |
| Cookie/session utility separation | **Implemented** |
| Project LLM backend proxy | **Substantially implemented** |
| Tutorial Composer service delegation | **Partially implemented / good direction** |
| Taxonomy CRUD architecture | **Partially implemented — refactor required** |
| Tutorial Sidebar architecture | **Architecture violation — refactor required** |
| Input-contract consistency | **Partially implemented** |
| Type safety | **Partially implemented** |
| Pagination correctness | **Needs remediation** |
| Domain deletion semantics | **Needs remediation** |
| Frontend SRP | **Partially implemented** |
| Project LLM frontend composition | **Needs substantial refactor** |
| DRY | **Partial** |
| KISS | **Partial** |
| YAGNI | **Partial** |
| DIP | **Partial / significant violations** |
| SoC | **Partial / significant violations** |
| Observability | **Partial** |
| CI architecture enforcement | **Not demonstrated** |

---

# What I am deliberately NOT doing yet

I am **not** going to immediately create:

```text
DomainRepository
SubjectRepository
TopicRepository
SubtopicRepository
SkillRepository
RepositoryFactory
ServiceFactory
BaseRepository
AbstractRepository
GenericCrudService
```

That would be exactly the kind of overengineering that violates KISS/YAGNI.

Instead we first need to identify the actual domain boundary.

My current architectural inclination is closer to:

```text
EducationalTaxonomy
  ├── domains
  ├── subjects
  ├── topics
  ├── subtopics
  └── skills
```

with a cohesive application/service boundary rather than five nearly identical architectures.

That may give us:

```text
API route
   ↓
EducationalTaxonomyService
   ↓
TaxonomyRepository
   ↓
@quiz/db
```

with focused methods such as:

```text
listDomains
createDomain
updateDomain
deleteDomain

listSubjects
...

moveTopic
deleteHierarchyNode
...
```

But I will not lock that design until the remaining callers/components are reviewed.

---

# Review status

The important distinction right now is:

**I have not finished all 225 production files line-by-line.**

What is complete so far is:

**all 46 API routes have been structurally inspected**, and the most consequential backend paths have received detailed source review. Core architectural patterns and several systemic problems are now established.

The next review tranche should cover the remaining code **before refactoring**:

```text
1. all remaining lib/* modules in detail
2. hooks/context/store
3. taxonomy components:
   DomainTable
   SubjectTable
   TopicTable
   SubtopicTable
   SkillTable
   QuestionTable
4. factory components
5. Project LLM pages/components/hooks/client
6. Tutorial Composer UI
7. Tutorial Sidebar UI
8. ordinary admin pages
9. layouts/proxy/configuration
10. tests and boundary-enforcement scripts
```

Only after that complete baseline should we produce the **Phase 1 implementation design and commit sequence**.

That is the standard I will maintain for this project: **evidence first, architecture decision second, implementation third, verification fourth.**

Yes. I’m continuing with that standard: **review first, architecture decision second, implementation third, verification fourth**. That was the agreed next stage after the 46-route API baseline. Review Project Files

This review tranche covered the shared client/application layer: `context`, `hooks`, `store`, local types/utilities, and the Project LLM supporting library. I also started the taxonomy-table tranche. I am **not marking the taxonomy component tranche complete yet**, because several of those files are very large and deserve their own detailed pass.

### New findings from this tranche

| ID | Area | Severity | Finding |
|---|---|---:|---|
| SHC-CLIENT-ARCH-001 | Hierarchy data access | High | Two competing client data-access patterns exist |
| SHC-TYPE-004 | Domain types | High | `[key: string]: unknown` masks contract drift |
| SHC-DRY-003 | Hierarchy hooks | Medium/High | Repeated loading/error/mapping logic |
| SHC-RESOURCE-002 | Client queries | Medium | Fixed high fetch limits such as 2,000 skills / 1,000 subtopics |
| SHC-SRP-003 | FactoryContext | Medium | State, persistence, parsing, validation and notifications mixed |
| SHC-CLIENT-STATE-001 | Factory persistence | Medium | Potentially sensitive working content persisted to `localStorage` |
| SHC-JOB-001 | Job polling | Medium | Fixed 5-second polling + unbounded `Promise.all` |
| SHC-UX-001 | Navigation | Medium | Browser-history trapping is an architectural/UX anti-pattern |
| SHC-PLLM-CLIENT-001 | Project LLM | High | Browser client performs workflow/state orchestration |
| SHC-PLLM-ERROR-001 | Project LLM | Medium/High | Backend error details can propagate into UI errors |
| SHC-PLLM-DATA-001 | Repository intelligence | High | Live repository data silently falls back to static fixture |
| SHC-FRONTEND-SRP-001 | Taxonomy UI | High | Tables own fetching + mutation + pagination + forms + modals + rendering |

## 1. `useAdminHierarchy.ts` confirms duplicate architecture

We already have React Query hooks such as:

```text
useAdminQuestions()
useAdminUsers()
useDashboardMetrics()
```

but hierarchy data uses a separate hand-built architecture:

```text
useDomains()
useSubjects()
useTopics()
useSubtopics()
useAllSkills()
useTopicSkills()
```

Each manually owns:

```text
useState(data)
useState(loading)
useState(error)
useCallback(fetch)
useEffect(fetch)
API transformation
create()
refetch()
```

That means we currently have two client data architectures:

```text
React Query
    vs
custom useState/useEffect fetching
```

This violates DRY and creates inconsistent cache/invalidation behavior.

### Direction

We should standardize server-state retrieval around one mechanism—React Query is already present and appropriate.

For example:

```text
useDomainsQuery()
useSubjectsQuery(domainId)
useTopicsQuery(subjectId)
useSubtopicsQuery(topicId)
useSkillsQuery()
```

and mutations:

```text
useCreateDomainMutation()
useUpdateDomainMutation()
...
```

Then query invalidation becomes authoritative rather than every component doing:

```ts
await fetch();
```

---

## 2. Hard-coded huge page sizes are compensating for missing query architecture

Examples:

```ts
getDomains(null, 100)
getSubjects(null, 200, domainId)
getTopics(null, 500, subjectId)
getSubtopics(null, 1000, topicId)
getSkills(null, 2000)
```

These are architectural warning signs.

The UI is effectively saying:

> give me nearly everything so I can work locally.

That will become increasingly expensive as the taxonomy grows.

It also conflicts with the million-scale direction of `FinalAechitecture.md`.

We need to distinguish:

```text
small selector lookup
→ bounded lookup endpoint

searchable catalogue
→ server pagination/search

full hierarchy snapshot
→ dedicated optimized hierarchy endpoint
```

instead of progressively increasing arbitrary limits.

**SHC-RESOURCE-002 — Medium now, potentially High at scale.**

---

## 3. `types/domain.ts` is hiding contract problems

This is important.

Types such as:

```ts
export interface Domain {
    ...
    [key: string]: unknown;
}
```

occur across the hierarchy types.

That effectively says:

> any extra property is acceptable.

It weakens TypeScript's ability to detect API drift.

There are also aliases such as:

```text
order
orderIndex
```

and:

```text
complexity
complexityLevel
```

and comments like:

```ts
status?: Status; // UI may supply, though DB does not store
```

That is telling us the UI model, API model and persistence model have diverged.

### Target

We need separate intentional contracts:

```text
DomainDto
DomainListItem
CreateDomainInput
UpdateDomainInput
DomainViewModel
```

when those shapes really differ.

Not:

```text
one permissive Domain interface
+ arbitrary keys
+ casts everywhere
```

This is a significant **type-safety and explicit-contract violation**.

---

## 4. `useAdminHierarchy.ts` contains many casts caused by that drift

Examples:

```ts
(domain as { status?: Status }).status
```

```ts
(subject as { order?: number }).order
```

```ts
(topic as { complexity?: number }).complexity
```

```ts
(subtopic as { difficultyLevels?: string[] }).difficultyLevels
```

Those are signals that the API client contract does not accurately model what consumers expect.

We should not solve this by adding more casts.

We solve it by fixing the authoritative types.

---

## 5. `FactoryContext.tsx` is useful, but has too many responsibilities

It currently owns:

```text
blueprint state
source-code state
staged questions
JSON ingestion
AI JSON validation
healing report
localStorage hydration
localStorage persistence
storage cleanup
question update/delete
batch removal
toast notifications
factory reset
```

This is not catastrophic, but SRP is weak.

A cleaner division would be:

```text
FactoryProvider
    ↓ state/orchestration

useFactoryPersistence
    ↓ persistence

JsonValidator
    ↓ parsing/validation

UI
    ↓ toast/presentation feedback
```

The good part is that `JsonValidator` is already extracted.

So this is an incremental refactor rather than a redesign.

---

## 6. Factory working data is stored in `localStorage`

The context persists:

```text
blueprint
stagedQuestions
sourceCode
```

under:

```text
quiz-factory-storage-v1
```

It deletes the storage entry when the provider unmounts, which is a good attempt at containment.

However, `localStorage` remains readable by JavaScript running on the same origin.

If `sourceCode`, candidate content, questions or unpublished content are considered sensitive administrative material, this needs reconsideration.

Possible target depending UX requirements:

```text
ordinary temporary state
→ memory

survive page refresh
→ sessionStorage

long-lived resumable draft
→ authenticated server-side draft
```

rather than automatically using persistent browser storage.

I will classify this as **Medium until the data-sensitivity policy is established**, not Critical.

---

## 7. `safeLocalStorage.ts` itself is reasonably cohesive

This utility is actually a good small abstraction.

It centralizes:

```text
SSR safety
JSON parsing
TTL
storage exceptions
logging
```

I would retain it.

The architectural question is **what is allowed to be stored**, not whether this utility should exist.

---

## 8. `useJobTracker.ts` is coherent but has scalability concerns

It polls every:

```ts
5000
```

milliseconds.

For every tracked job it executes:

```ts
Promise.all(
    jobIds.map(...)
)
```

So an admin with N jobs produces roughly:

```text
N requests / 5 seconds
```

per active browser session.

At small scale this is okay.

At larger scale:

```text
many admins
× many jobs
× every 5 seconds
```

can become unnecessary load.

### Better eventual architecture

At minimum:

```text
single bulk job-status endpoint
```

or:

```text
exponential/backoff polling
```

and ideally for long-running jobs:

```text
SSE / WebSocket / event-backed status
```

if operational complexity is justified.

KISS says not to introduce WebSockets automatically. A **bulk status endpoint + adaptive polling** may be enough.

---

## 9. Job persistence has a good security property

Job IDs are scoped using:

```text
admin-active-jobs-{user.id}
```

rather than one shared browser key.

That's good isolation between admins sharing a browser profile.

The server must still enforce ownership—the local user ID is not authorization—but as client state organization this is sound.

---

## 10. `usePresenceHeartbeat.ts` is appropriately small

This hook has one responsibility:

```text
send admin presence heartbeat
```

That's good SRP.

It also stops when:

```text
not initialized
not authenticated
locked
```

which is sensible.

Potential later improvements:

```text
pause when document hidden
jitter interval
failure backoff
```

but those are optimizations, not current architecture blockers.

**Status: largely good.**

---

## 11. `useFocusTrap.ts` is also a good abstraction

It does exactly one thing:

```text
trap keyboard focus inside an active container
```

This is cohesive and reusable.

No architectural problem found in this review.

---

## 12. `useStrictNavigation.ts` should probably be removed/redesigned

This hook manipulates browser history:

```ts
window.history.pushState(...)
```

and when the user presses Back:

```ts
window.history.pushState(...)
setShowWarning(true)
```

This effectively traps backward navigation.

That is not a security boundary.

It can also cause confusing browser behavior and accessibility/UX problems.

If the real requirement is:

> warn when leaving unsaved work

then the architecture should express **unsaved-work protection**, not general navigation trapping.

For example:

```text
dirty state?
   ↓
show confirmation

clean state?
   ↓
normal browser navigation
```

This is a KISS/SoC improvement.

---

# 13. Stores are mostly good

`auth-store.ts` is tiny and delegates to the shared UI/auth package:

```ts
createAuthStore(...)
```

Good.

`job-store.ts` contains only client job state and simple mutations.

Good.

`tutorial-factory-store.ts` contains only selection state.

Good.

These are examples where **we should resist unnecessary abstraction**.

No repository/factory/service layers are needed around simple Zustand stores.

---

# 14. Project LLM client contains too much orchestration

This is an important new finding.

`projectLlmClient.ts` isn't only HTTP transport.

For example candidate upload does:

```text
compute hashes
generate candidate ID
build candidate payload
advance workflow state
upload
detect 409
advance workflow state again
retry upload
map response
```

That means the browser client is partly controlling the canonical workflow.

For example:

```ts
await this.ensureCandidateRequested(workflowId);
```

followed by special handling for:

```text
409
```

and another state advancement.

### Architectural concern

The browser should request an intention:

```text
Upload this candidate to workflow X
```

The authoritative backend should decide:

```text
whether transition is allowed
what transition occurs
whether retry is safe
candidate identity
actor identity
audit event
```

The frontend should **not be the canonical workflow state machine**.

### Classification

**SHC-PLLM-CLIENT-001 — HIGH**

This is not necessarily an exploitable vulnerability if the backend independently validates every transition—which it should—but it is the wrong ownership boundary.

---

# 15. Candidate identity and actor should be server-authoritative

The client constructs:

```ts
candidateId
```

and sends:

```ts
uploadedBy: 'admin'
```

`uploadedBy: 'admin'` must never be authoritative.

The backend should derive actor identity from the verified session/token.

Likewise, a server-generated candidate ID is generally cleaner unless offline/client-generated identifiers are an explicit design requirement.

We will verify backend handling before calling this a security vulnerability.

For now:

**architectural concern, not proven security defect.**

---

# 16. Project LLM error handling needs another boundary pass

`handleFetchError()` extracts backend:

```text
detail
error
message
```

and appends it to UI-facing error strings.

Example conceptually:

```text
"Server error. Please try again later: <backend detail>"
```

The BFF has already been hardened for upstream 5xx responses, which helps.

But the browser client still treats backend detail as displayable.

The policy should be:

```text
expected validation/domain errors
→ safe typed message

internal errors
→ stable generic user message
→ detailed structured server log
```

not arbitrary upstream text propagation.

**SHC-PLLM-ERROR-001 — Medium/High.**

---

# 17. `requestJson()` exists, but many methods still duplicate fetch/error handling

`ProjectLlmClient` has:

```ts
private async requestJson<T>(...)
```

which centralizes:

```text
fetch
credentials
content-type
response checking
error conversion
network-error conversion
```

But several methods implement these steps themselves.

That is real DRY debt.

The client can likely be simplified considerably without becoming over-engineered.

---

# 18. Repository-intelligence fallback conflicts with strict verification semantics

`useRepositoryIntelligence()` says:

```text
Falls back to static fixture if backend is unreachable,
ensuring the UI always has data to display.
```

When live fetching fails, it does:

```ts
setIntelligence(
  PROJECT_LLM_REPOSITORY_INTELLIGENCE
);
setIsLive(false);
```

This is convenient for UI availability, but Project LLM is a governance/certification tool.

For a governance tool there is a major distinction between:

```text
verified live repository state
```

and:

```text
cached/static reference state
```

A stale fallback must **never look equivalent to verified current evidence**.

The hook does expose:

```text
error
isLive
```

which is good.

Now we have to verify every consuming page visibly respects those flags.

If a certification/placement decision can proceed using static fallback, that is a serious problem.

### Desired rule

```text
live intelligence unavailable
        ↓
read-only/reference display may continue
        ↓
certification / placement / governance decision
        DENIED
```

This fits Fail Fast and explicit verification.

---

# 19. Static Project LLM intelligence contains intentional historical/current duality

`projectLlmRepositoryIntelligence.ts` contains current verified implementations, while also preserving:

```ts
S1_WARNING
```

with historical partial status for backwards compatibility.

The comment explains why.

That is acceptable **only while consumers clearly distinguish historical record from active status**.

Otherwise two sources can report different statuses for S1.

This requires consumer review rather than immediate deletion.

---

# 20. Project LLM reference paths are manually encoded

`projectLlmReferencePatterns.ts` contains paths such as:

```text
packages/ui/src/tutorial/blocks/IntroductionBlock.tsx
packages/ui/src/tutorial/TutorialBlockRenderer.tsx
...
```

Those references can become stale after refactors.

For documentation/reference use that's acceptable.

They should not become authoritative proof that files exist unless checked by live repository intelligence.

---

# 21. Static counts in live transformation are still suspicious

The discovery adapter still builds values like:

```text
families: 18
documentedVersions: 133
primitives: 15
```

even while other runtime values come from the scanner.

That means it mixes:

```text
live evidence
+
constitutional/static assumptions
```

This may be intentional, but the model should label those origins explicitly.

For example:

```text
documentedCorpusCount
discoveredRuntimeCount
```

rather than presenting both as equally live.

---

# 22. Taxonomy UI confirms frontend SRP/DRY problems

I began the detailed table review.

`DomainTable.tsx` alone contains:

```text
API retrieval
DTO → UI transformation
search debounce
cursor management
page-size management
selection state
batch operations
form state
create/update
delete
factory wizard integration
error mapping
modal rendering
table rendering
pagination rendering
```

So the component isn't merely a table.

It's effectively:

```text
controller
application service
API adapter
view model
form manager
modal controller
table UI
```

all together.

This confirms the earlier SRP finding.

---

# 23. The table duplicates `useDomains()`

This is particularly important.

We already have:

```ts
useDomains()
```

but `DomainTable` implements its own:

```ts
fetchDomains()
```

and its own mapping.

So even **inside the same app**, Domain data has at least:

```text
useAdminHierarchy.useDomains
DomainTable.fetchDomains
apiClient.admin.getDomains
server API route
```

with transformations at multiple layers.

That is exactly the kind of DRY/type-drift issue we need to resolve.

---

# 24. UI is compensating for backend deletion ambiguity

`DomainTable` handles any delete failure by displaying:

> This domain is currently linked to active subjects or topics and cannot be removed.

But the backend generic catch returns:

```text
Failed to delete domain
```

for potentially many reasons.

So the frontend is **guessing the business reason** for failure.

That's a contract violation.

The server should return typed errors:

```text
DOMAIN_HAS_CHILDREN
DOMAIN_NOT_FOUND
DOMAIN_DELETE_FORBIDDEN
...
```

and UI should map those to messages.

This is another argument for the application/domain layer.

---

# 25. Delete terminology is inconsistent across the UI

For example the Question UI says a deleted record:

> will be marked as inactive

while the underlying API appears to call a delete endpoint.

We already found the Domain route says “soft delete” while performing a hard delete.

So deletion semantics are inconsistent at **both backend and frontend layers**.

This now becomes a cross-layer architectural finding:

**SHC-DATA-INTEGRITY-001 remains HIGH and is confirmed beyond the API.**

---

## Tranche status

At this point I consider these files/layers **substantially reviewed**:

```text
context/FactoryContext.tsx

hooks/queries/*
hooks/useAdminHierarchy.ts
hooks/useFocusTrap.ts
hooks/useJobTracker.ts
hooks/usePresenceHeartbeat.ts
hooks/useStrictNavigation.ts

store/*
types/*
utils/*

major lib auth/security/cache/factory modules
Project LLM hooks
Project LLM repository-intelligence modules
Project LLM transport architecture
```

The taxonomy components have been **started but are not yet closed** because files like:

```text
DomainTable       ~27 KB
SubjectTable      ~28 KB
TopicTable        ~36 KB
SubtopicTable     ~36 KB
SkillTable        ~28 KB
QuestionTable     ~25 KB
```

deserve separate detailed examination rather than relying on truncated multi-file output.

### Principal Architect checkpoint

The architectural picture is becoming clearer:

```text
GOOD
──────────────
central auth guard
trusted proxy
shared auth store
small Zustand stores
focus trap
presence hook
typed Project LLM domain models
some React Query adoption


NEEDS CONSOLIDATION
───────────────────
client server-state access
API DTO contracts
hierarchy types
logging/error contracts
Project LLM transport


NEEDS REFACTOR
──────────────
taxonomy routes
tutorial sidebar route
taxonomy tables
large Project LLM pages
browser-owned Project LLM workflow orchestration
static/live governance fallback semantics
```

I am **still not changing code**. That remains the correct decision because we are finding connected problems—for example the taxonomy issue spans database route → API contract → client hook → table component. Fixing only `route.ts` now would leave the duplicate client architecture untouched.

The next tranche is the six taxonomy tables **one by one**, including their associated review cards, cascading selector and hierarchy factory integration. After that we can close the Educational Taxonomy vertical end-to-end before moving into Factory and Project LLM UI.

Yes. I’m continuing exactly in that phased manner, and I’m keeping the same rule: **no implementation changes until the current vertical is fully understood end-to-end**. That matches the review discipline we established earlier: evidence first, architecture decision second, implementation third, verification fourth. Review Project Files

This tranche has now gone much deeper into the **Educational Taxonomy UI vertical**: the six main tables plus `CascadingSelect` and the review-card layer.

The architectural direction is becoming very clear.

## Educational Taxonomy UI — current principal-architect assessment

| Area | Status | Main issue |
|---|---|---|
| Domain UI | 🟡 Partial | API/data/form/delete/pagination mixed in component |
| Subject UI | 🟡 Partial | Same pattern + duplicated hierarchy logic |
| Topic UI | 🔴 Needs refactor | Contract drift around complexity/weight/order |
| Subtopic UI | 🔴 Needs refactor | Random fallback IDs + hierarchy mapping drift |
| Skill UI | 🟡 Partial | Duplicated CRUD/pagination/form infrastructure |
| Question UI | 🔴 Needs refactor | Large DTO normalization/business interpretation inside component |
| Cascading selector | 🟡 Partial | Too much data orchestration and creation behavior |
| Review cards | 🟢 Mostly presentation | Generally cohesive |
| Shared data hooks | 🔴 Needs consolidation | Duplicate client data-access architecture |
| Type contracts | 🔴 Needs correction | UI/API/domain models drift from one another |

The earlier API review already established that taxonomy backend routes bypass an application/repository boundary and directly couple HTTP handlers to Drizzle/database operations. Review Project Files What we now know is that **the same architectural problem continues all the way into the frontend**.

---

# 1. We now have four layers transforming the same taxonomy data

For a Domain, for example, the data currently moves through roughly:

```text
DB row
   ↓
admin route
   ↓
apiClient
   ↓
useAdminHierarchy / DomainTable mapping
   ↓
DomainSummary mapping
   ↓
DomainReviewCard
```

And `DomainTable` performs another mapping:

```ts
const domains: Domain[] =
    response.data.map((d) => ({
        id: String(d.id),
        name: d.name ?? '',
        description: d.description ?? null,
        category: d.category ?? null,
        status: ...
    }));
```

Then later:

```ts
const domainSummary: DomainSummary = {
    id: domain.id,
    name: domain.name,
    ...
};
```

So the same entity is being transformed repeatedly.

### Principle violations

**DRY**

**Single Ownership**

**Explicit Contracts**

**Type Safety**

The correct target is one authoritative API DTO mapped once into a stable UI/view model when necessary.

---

# 2. `DomainTable` confirms the frontend SRP issue

It owns:

```text
query execution
search debounce
cursor state
cursor stack
pagination
selection
batch selection
form state
create/update
delete
batch delete
factory wizard
modal state
error interpretation
DTO transformation
card transformation
rendering
```

That is too many reasons for one component to change.

A healthier architecture would be:

```text
DomainTable
   ↓ presentation

useDomainsQuery
useDomainMutations
useCursorPagination
   ↓ application/UI orchestration

apiClient
   ↓ transport
```

with:

```text
DomainForm
DeleteDomainDialog
DomainList
```

as focused presentation components.

We do **not** need class hierarchies or factories.

Simple hooks/components are enough.

---

# 3. Domain creation is generating business fields in the UI

Current:

```ts
const payload = {
    ...formData,
    slug: formData.name || 'domain',
    icon: formData.category || 'default',
    orderIndex: 0
};
```

This is an ownership concern.

Questions:

```text
Who owns slug generation?

Who decides the default icon?

Who decides orderIndex?
```

Those should normally be server/application-domain decisions unless the user explicitly controls them.

Particularly:

```ts
slug: formData.name
```

is not actually slug generation.

A name such as:

```text
Computer Science & Engineering
```

would simply be sent as the slug input.

That is contract drift.

### Finding

**SHC-TAXONOMY-CONTRACT-003 — HIGH**

---

# 4. Domain delete error is still fabricated by the UI

Any failure results in:

> Deletion Blocked: This domain is currently linked to active subjects or topics and cannot be removed.

But the actual failure could be:

```text
network failure
500
permission failure
database outage
timeout
foreign-key failure
```

The UI is guessing.

The backend must return a typed domain error such as:

```text
DOMAIN_HAS_CHILDREN
DOMAIN_NOT_FOUND
DOMAIN_DELETE_FORBIDDEN
```

and the UI should map those codes.

This issue repeats for Subject, Topic and Skill.

So this is now systemic.

### Finding

**SHC-ERROR-CONTRACT-001 — HIGH**

---

# 5. Delete semantics are inconsistent even inside the UI

Domain deletion dialog says:

> permanently delete

and:

> Delete Forever

Question deletion says:

> marked as inactive

while earlier backend review found:

```ts
db.delete(...)
```

being used in places that claim “soft delete.” Review Project Files

So we currently have:

```text
frontend A → permanent delete
frontend B → inactive
backend comment → soft delete
backend code → hard delete
```

This is not a cosmetic problem.

It is a data-governance problem.

Before implementation we need an explicit policy for:

```text
Domain
Subject
Topic
Subtopic
Skill
Question
```

for each operation:

```text
archive
soft delete
hard delete
restore
cascade
block if children
```

---

# 6. Subject creation duplicates fields

`SubjectTable` builds:

```ts
const payload = {
    ...formData,
    slug: formData.name || 'subject',
    icon: 'default',
    orderIndex: formData.order ?? 0
};
```

But `formData` already contains:

```text
order
```

and the payload also sends:

```text
orderIndex
```

That is contract duplication.

We already saw similar inconsistencies in server models.

This confirms that:

```text
order
vs
orderIndex
```

is not merely a backend issue.

It is spread across layers.

### Required correction

Choose one canonical contract.

For example:

```text
orderIndex
```

or:

```text
displayOrder
```

and use it consistently.

---

# 7. Topic complexity is especially inconsistent

The UI supports:

```text
beginner
intermediate
advanced
expert
```

and also:

```text
complexityLevel: number
```

with this function:

```ts
const complexityFromLevel = (level?: number) => {
    if (level === 2) return 'intermediate';
    if (level === 3) return 'advanced';
    if (level >= 4) return 'expert';
    return 'beginner';
};
```

But the server-side route we reviewed maps:

```text
expert → advanced
3+     → advanced
2      → intermediate
```

So client and server **do not agree on the domain model**.

The UI believes:

```text
expert
```

is a valid distinct complexity.

The server currently normalizes:

```text
expert → advanced
```

That is a concrete contract mismatch.

### Finding

**SHC-TAXONOMY-CONTRACT-004 — HIGH**

This needs resolution before refactoring the UI.

---

# 8. Topic `weight` is being reused as `orderIndex`

Current client payload:

```ts
const payload = {
    ...formData,
    slug: formData.name || 'topic',
    orderIndex: formData.weight ?? 0,
    complexity: formData.complexity
};
```

This is suspicious.

`weight` and display order are different concepts.

If intentional, it should be explicitly documented.

If accidental, this is a correctness bug.

My architectural assumption for now is:

```text
weight ≠ orderIndex
```

until the domain contract proves otherwise.

### Finding

**SHC-TAXONOMY-DATA-001 — HIGH / needs domain confirmation**

I will not “fix” it yet without checking schema/API ownership.

---

# 9. Topic batch-delete contains duplicate state mutation

Current:

```ts
setIsDeleteOpen(false);
setIsDeleteOpen(false);
```

This is minor but confirms copy/paste debt.

### Classification

**SHC-DRY-UI-001 — Low**

Not architecture-critical, but should disappear during refactor.

---

# 10. Subtopic mapping has a serious fallback-ID smell

Current:

```ts
id: String(
    s.id ??
    crypto.randomUUID()
)
```

This means if the API fails to return a stable ID, the frontend invents one.

That is dangerous.

The UI can then render an entity that appears valid but whose ID has no relationship to the persisted entity.

A missing persistent ID should be:

```text
contract violation
→ reject/fail visibly
```

not:

```text
contract violation
→ invent identity
```

This conflicts directly with Fail Fast.

### Finding

**SHC-IDENTITY-001 — HIGH**

For persisted taxonomy entities, the server owns identity.

---

# 11. Subtopic defaults are also inconsistent

The mapper defaults:

```ts
depthLevel: ... ?? 0
```

while the form default is:

```ts
depthLevel: 1
```

and the backend normalization earlier defaults invalid depth to:

```text
1
```

So a freshly fetched entity lacking depth can appear as:

```text
0
```

while newly created/normalized entities become:

```text
1
```

That is contract ambiguity.

### Finding

**SHC-TAXONOMY-CONTRACT-005 — MEDIUM/HIGH**

---

# 12. Hierarchy parent resolution is reconstructed repeatedly in UI

For Topic/Subtopic edit flows the component tries to reconstruct:

```text
Domain
→ Subject
→ Topic
```

from nested optional response objects.

This is brittle.

For example:

```ts
topic.subject?.domainId
    ?? topic.subject?.domain?.id
    ?? ''
```

That indicates the API response has multiple possible shapes.

A proper contract should give one reliable structure.

For example:

```ts
type TopicAdminDto = {
  id: string;
  subjectId: string;
  subject: {
    id: string;
    domainId: string;
  };
}
```

or just IDs if nested data is unnecessary.

---

# 13. `SkillTable` is architecturally similar but less problematic

Its responsibilities are still too broad:

```text
API query
mapping
pagination
selection
CRUD
batch delete
form rendering
factory integration
```

so SRP/DRY still apply.

However, the skill contract itself is somewhat cleaner than Topic/Subtopic.

The form constrains weight to:

```text
1–10
```

via:

```tsx
<input type="range" min="1" max="10" />
```

which is good UX.

But server-side validation must still enforce the same range.

Client UI constraints are not authoritative validation.

---

# 14. Skill failure messages are also inferred

Any delete failure becomes:

> This skill is currently assigned to questions and cannot be removed.

Again, that may not be the real failure reason.

This confirms `SHC-ERROR-CONTRACT-001` across the taxonomy vertical.

---

# 15. `QuestionTable` has one of the strongest client-contract smells

Inside the component it defines an ad hoc:

```ts
type RawQuestion = {
    questionText?: string;
    text?: string;

    options?:
      string[]
      | objects using text
      | objects using optionText
      | objects using option_text
      | Record<string, string>;

    isCorrect?
    is_correct?
    ...
}
```

This means the UI supports multiple generations of API payload formats.

Then it normalizes all of them inside the React component.

That is technical debt from contract evolution.

### The problem

A React component should not know:

```text
questionText vs text
optionText vs option_text
isCorrect vs is_correct
```

The boundary adapter should.

### Target

```text
backend response
    ↓
QuestionDto schema/parser
    ↓
QuestionViewModel
    ↓
QuestionTable
```

The component should receive one canonical shape.

### Finding

**SHC-QUESTION-CONTRACT-001 — HIGH**

---

# 16. QuestionTable fabricates missing IDs

Current:

```ts
id: q.id ?? `q-${idx}`
```

Again this is problematic for persisted records.

A missing ID is not a harmless display issue because the same ID is later used for:

```text
edit
delete
selection
routing
```

Persisted resources need stable server-authoritative identifiers.

### Finding

**SHC-IDENTITY-002 — HIGH**

---

# 17. QuestionTable fabricates missing timestamps

Current:

```ts
createdAt:
    q.createdAt ??
    new Date().toISOString()
```

This makes a missing server timestamp appear as “created now”.

That is factually false.

A better UI treatment is:

```text
Unknown
```

or omitted metadata.

Never invent audit/history information.

### Finding

**SHC-DATA-TRUTH-001 — MEDIUM/HIGH**

This matters particularly in an admin/audit context.

---

# 18. Question correctness is reconstructed in UI

The normalization does:

```ts
isCorrect:
  opt.isCorrect === true
  || opt.is_correct === true
  || text === correctAnswer
```

For an admin review screen this may be acceptable as presentation adaptation.

But the important rule is:

> this derived value must never feed back into authoritative scoring.

We already fixed the learner quiz/practice scoring path to use authoritative server-side content.

So here I classify this as:

**acceptable UI normalization if read-only**, but it should move into a canonical adapter instead of staying inside `QuestionTable`.

---

# 19. `CascadingSelect` is doing too much

It owns:

```text
domain query
subject query
topic query
subtopic query
all-skill query
topic-skill query
skill filtering
duplicate-name disambiguation
selection state
hierarchy reset rules
quick-create modal
quick-create orchestration
name metadata
presentation
```

This is another SRP hotspot.

It should probably become:

```text
CascadingSelect
    ↓ presentation

useHierarchySelection()
    ↓ selection/reset logic

useHierarchyOptions()
    ↓ query layer

QuickCreateHierarchyNode
    ↓ dedicated component
```

Again: hooks/components, not enterprise-style class architecture.

---

# 20. Skill category contract is inconsistent

The canonical local `SkillCategory` type contains:

```text
technical
soft
analytical
creative
managerial
communication
```

But `CascadingSelect` filters on:

```text
technical
cognitive
process
all
```

So:

```text
cognitive
process
```

are not members of the canonical `SkillCategory` type we reviewed.

That is concrete contract drift.

### Finding

**SHC-SKILL-CONTRACT-001 — HIGH**

We need one authoritative skill-category enumeration.

---

# 21. CascadingSelect fallback behavior can broaden skill scope

Logic:

```text
if topic selected and topic has skills
→ topic skills

otherwise
→ all skills
```

This means:

```text
topic selected
but no mappings
→ show every skill
```

That may be intentional for assignment/editing, but it changes semantics.

“No mappings for this topic” and “all skills are valid choices” are not necessarily equivalent.

We need domain confirmation.

Possible safer UI:

```text
Mapped skills
+
explicit "Show all skills" action
```

instead of silent fallback.

### Classification

**SHC-SKILL-SCOPE-001 — Medium**

---

# 22. QuickCreate injects artificial descriptions

Quick create uses values such as:

```text
Created via Quick Add
```

and:

```text
complexity: intermediate
```

without user choice.

That means UI convenience is creating domain content/defaults.

Potentially okay—but such defaults should be defined by the application contract, not duplicated in one quick-create path.

Otherwise:

```text
full create
≠
quick create
```

semantically.

---

# 23. Review cards are mostly good architecture

The review cards are quite different from the table components.

For example `DomainReviewCard` primarily handles:

```text
rendering
selection callback
edit callback
delete callback
formatting
```

Similarly `QuestionReviewCard` mostly presents:

```text
question metadata
options
skills
explanation
actions
```

This is good separation.

They are presentational components.

I would mostly keep this architecture.

This is an important example of where **large JSX does not automatically mean bad SRP**.

---

# 24. `QuestionReviewCard` has two links to the same edit route

It has:

```text
Edit icon
```

and another:

```text
ExternalLink
```

both pointing to:

```text
/questions/{id}/edit
```

This may be intentional UX, but one of them is labeled as an external-style action while doing the same internal action.

Low severity, but worth simplifying.

---

# 25. Presentational status mappings are duplicated

Review cards independently define:

```text
statusColors
difficultyColors
mappingColors
category labels
```

This is harmless at small scale, but repeated taxonomy/status design mapping should probably live in one presentation config module.

Not business logic—just UI consistency.

### Classification

**SHC-DRY-UI-002 — Low**

---

# 26. The taxonomy frontend architecture we should target

After reviewing both backend and frontend, I now see a clear low-complexity target.

Not:

```text
20 repositories
20 services
20 interfaces
20 factories
```

Instead:

```text
Educational Taxonomy vertical

contracts/
  taxonomy.ts
    DomainDto
    SubjectDto
    TopicDto
    SubtopicDto
    SkillDto
    Create/Update schemas
    pagination schemas
    typed errors

server/
  taxonomy-service.ts
  taxonomy-repository.ts

client/
  taxonomy-api.ts

hooks/
  useDomainsQuery.ts
  useSubjectsQuery.ts
  useTopicsQuery.ts
  useSubtopicsQuery.ts
  useSkillsQuery.ts
  taxonomy mutations

components/
  DomainTable
  SubjectTable
  TopicTable
  SubtopicTable
  SkillTable

  forms/
  dialogs/
  cards/
```

Dependency direction:

```text
UI
 ↓
query/mutation hooks
 ↓
typed client
 ↓
BFF/API
 ↓
taxonomy application service
 ↓
repository
 ↓
DB
```

That satisfies:

- SRP;
- DIP;
- DRY;
- KISS;
- SoC;
- explicit contracts;
- testability;
- single ownership.

without overengineering.

---

# 27. Current taxonomy vertical severity summary

At this point I would register these as the main findings:

| ID | Finding | Severity |
|---|---|---:|
| SHC-DIP-001 | API → DB direct dependency | **High** |
| SHC-SOC-001 | HTTP + business + persistence mixed | **High** |
| SHC-DRY-001 | Taxonomy CRUD duplicated | **High** |
| SHC-CONTRACT-001 | Missing authoritative schemas | **High** |
| SHC-DATA-QUERY-001 | Broken/inconsistent cursor semantics | **High** |
| SHC-DATA-INTEGRITY-001 | Delete semantics inconsistent | **High** |
| SHC-ERROR-CONTRACT-001 | UI guesses failure reasons | **High** |
| SHC-TAXONOMY-CONTRACT-003 | UI owns slug/default generation | **High** |
| SHC-TAXONOMY-CONTRACT-004 | Complexity model mismatch | **High** |
| SHC-TAXONOMY-DATA-001 | Weight/order contract confusion | **High pending confirmation** |
| SHC-IDENTITY-001 | Subtopic random fallback ID | **High** |
| SHC-IDENTITY-002 | Question fallback ID | **High** |
| SHC-QUESTION-CONTRACT-001 | Multiple question API shapes normalized in component | **High** |
| SHC-SKILL-CONTRACT-001 | Skill category enumeration mismatch | **High** |
| SHC-DATA-TRUTH-001 | Fabricated createdAt | Medium/High |
| SHC-RESOURCE-002 | Oversized lookup fetches | Medium |
| SHC-FRONTEND-SRP-001 | Table components own too many concerns | High |
| SHC-DRY-UI-001/002 | UI duplication | Low/Medium |

---

# 28. Taxonomy review is close to closure, but not fully closed

I have now deeply reviewed:

```text
DomainTable
SubjectTable
TopicTable
SubtopicTable
SkillTable
QuestionTable

CascadingSelect

DomainReviewCard
SubjectReviewCard
SkillReviewCard
QuestionReviewCard

useAdminHierarchy
taxonomy local types
taxonomy API routes
```

The remaining important taxonomy-dependent piece is:

```text
HierarchyFactoryWizard.tsx
```

which is around **61 KB** and participates in creation of Domain/Subject/Topic/Subtopic hierarchy data.

Because it can mutate the same domain model, I do **not** want to declare the Educational Taxonomy vertical complete until that file and its associated factory helpers are reviewed.

That will be the next sub-phase.

After `HierarchyFactoryWizard` and its direct dependencies are finished, we can produce the **final taxonomy architecture decision** before making any code changes.

So we are still following the right sequence:

**review → consolidate findings → define target architecture → implementation plan → controlled commits → tests → re-audit.**

I will continue with the **Hierarchy Factory vertical next**, then we can formally close the Educational Taxonomy review before touching implementation.

Good. I’ve continued with the same principal-architect discipline and **still have not changed code**. The baseline remains the governing step because this project already has substantial implementation, and we need to distinguish true architecture violations from acceptable implementation variation. The review scope and current inventory we established earlier still stand. Review Project Files

This tranche covered the **Hierarchy Factory vertical end-to-end**: `HierarchyFactoryWizard.tsx`, `BlueprintFactoryWizard.tsx`, the shared admin API client contracts, `/admin/hierarchy/atomic`, `HierarchyFactory`, the hierarchy Zod schemas, factory save/duplicate endpoints, and the main hierarchy-factory tests.

## Principal finding: the factory boundary is better than the taxonomy CRUD boundary

The atomic hierarchy path is:

```text
HierarchyFactoryWizard
        ↓
@quiz/api-client
        ↓
POST /admin/hierarchy/atomic
        ↓
requireAdminRouteAccess
        ↓
HierarchyFactory
        ↓
single DB transaction
        ↓
domains / subjects / topics / subtopics / questions / skills
```

That is significantly better than the direct taxonomy routes we reviewed earlier.

The backend route has:

```text
admin authorization
JSON size validation
JSON depth validation
sanitization
correlation/logging middleware
metrics
transactional domain service
```

So I am **not** classifying the factory as a fundamentally broken architecture.

The problems are more specific—and some are quite important.

| Finding | Severity | Assessment |
|---|---:|---|
| Atomic route doesn't use existing Zod hierarchy schemas | High | Contract enforcement gap |
| Wizard prompt contains fields backend ignores | High | Data correctness |
| Topic weight/complexity ignored by atomic factory | High | Contract mismatch |
| Subtopic depthLevel ignored | High | Contract mismatch |
| Question mappingType discarded | High | Data correctness |
| Skill weight ignored | Medium/High | Contract mismatch |
| Missing question text becomes `"Placeholder Question"` | High | Fail-fast violation |
| Missing answer becomes empty string | High | Invalid authoritative content |
| Skills auto-created from arbitrary names | Medium/High | Governance concern |
| Factory progress UI simulates backend phases | Medium | Misleading operational UX |
| Static/live contracts duplicated in several locations | Medium | DRY |
| Factory duplicate-check fan-out is unbounded | Medium/High | Scalability |
| Vector indexing is fire-and-forget after DB commit | High operational | Reliability/eventual consistency |
| Hierarchy factory tests miss several contract fields | High testing gap | Regression risk |

### 1. Good: atomic hierarchy writes are transactional

`apps/api-server/src/modules/domain/hierarchy.factory.ts` wraps the complete operation in:

```ts
db.transaction(...)
```

This is exactly the right direction for hierarchy creation.

A Domain → Subject → Topic → Subtopic → Question operation should not leave half a hierarchy behind when later persistence fails.

So:

**SHC-FACTORY-TXN-001 — Implemented**

This should be preserved.

---

## 2. Good: the atomic route has defense-in-depth controls

`apps/api-server/src/app/api/admin/hierarchy/atomic/route.ts` performs:

```ts
await requireAdminRouteAccess(_req);
```

then checks:

```ts
validateJsonDepth(rawBody)
validateJsonSize(rawBody)
```

and sanitizes the structure.

It also records success/failure timing and counters.

That is much closer to the architecture we want.

However, it stops short of the most important validation step.

---

# 3. Existing Zod hierarchy schemas are not being used by the atomic route

There is already:

```text
apps/api-server/src/schemas/hierarchy.schemas.ts
```

with Zod schemas for:

```text
domain
subject
topic
subtopic
skill
```

including UUID validation and number constraints.

But `/admin/hierarchy/atomic` currently effectively does:

```ts
const body = sanitizeJsonField(rawBody);

await HierarchyFactory.seedAtomic(body);
```

without parsing the complete atomic payload with a Zod schema.

TypeScript's:

```ts
AtomicHierarchyPayload
```

does **not** validate data at runtime.

So arbitrary JSON can reach `HierarchyFactory`.

### Required architecture

We need:

```text
request
  ↓
size/depth limits
  ↓
sanitization
  ↓
AtomicHierarchySchema.safeParse()
  ↓
validated application command
  ↓
HierarchyFactory
```

### Classification

**SHC-FACTORY-CONTRACT-001 — HIGH**

This will be one of the first factory fixes later.

---

# 4. Major mismatch: the UI asks for Topic fields that the backend ignores

The wizard-generated Topic JSON instructs AI to produce:

```json
{
  "name": "...",
  "weight": 1,
  "complexityLevel": 1
}
```

and explicitly explains:

```text
weight: 1–10
complexityLevel: 1–10
```

But `AtomicHierarchyPayload` defines Topic roughly as:

```ts
{
    id?: string;
    name: string;
    subtopics?: ...
    questions?: ...
}
```

There is no:

```text
weight
complexityLevel
description
status
```

And when topics are inserted:

```ts
{
  subjectId,
  name
}
```

is essentially all that is stored.

So the UI tells the administrator/AI:

> provide weight and complexityLevel

while the server silently discards them.

That is a concrete correctness defect.

### Classification

**SHC-FACTORY-CONTRACT-002 — HIGH**

This is stronger than a stylistic SOLID issue—it means entered/generated data is lost.

---

# 5. Same problem with `depthLevel`

The Subtopic prompt explicitly asks for:

```json
{
  "name": "...",
  "depthLevel": 1
}
```

and explains a 1–10 scale.

But `AtomicHierarchyPayload` Subtopic currently contains only:

```ts
{
    id?: string;
    name: string;
    questions?: ...
}
```

No `depthLevel`.

Insertion similarly persists primarily:

```text
topicId
name
```

So depth information is discarded.

### Classification

**SHC-FACTORY-CONTRACT-003 — HIGH**

---

# 6. `mappingType` is accepted—and then explicitly discarded

This is one of the most important findings in this tranche.

`HierarchyQuestionPayload` contains:

```ts
mappingType?: string;
```

The UI prompt asks the external AI to generate:

```text
conceptual
technical
practical
```

But `processQuestions()` performs:

```ts
const {
  skillNames: _skillNames,
  mappingType: _mappingType,
  skillWeight: _skillWeight,
  ...rest
} = q;
```

and then inserts the question without restoring `mappingType`.

So `_mappingType` is intentionally removed and unused.

That means the generated question's mapping classification is lost in the atomic hierarchy workflow.

### Classification

**SHC-FACTORY-DATA-001 — HIGH**

This needs an explicit regression test when fixed.

---

# 7. `skillWeight` is also discarded

The same destructuring removes:

```ts
skillWeight
```

without persistence.

Separately, bulk skill prompts ask for:

```json
{
  "weight": 1
}
```

but `AtomicHierarchyPayload.batchSkills` doesn't model weight either.

So skill weight semantics are inconsistent between:

```text
UI prompt
shared types
atomic payload
database persistence
```

### Classification

**SHC-FACTORY-DATA-002 — MEDIUM/HIGH**

---

# 8. Missing question text does not fail

Current factory behavior:

```ts
questionText:
  rest.questionText ?? 'Placeholder Question'
```

This is not appropriate for authoritative assessment content.

If AI or admin JSON omits `questionText`, the system should reject the payload.

It should **not create a valid-looking persisted assessment with synthetic placeholder text**.

That violates Fail Fast.

### Correct behavior

```text
missing questionText
        ↓
validation error
        ↓
transaction does not begin
```

not:

```text
missing questionText
        ↓
"Placeholder Question"
        ↓
persist
```

### Classification

**SHC-FACTORY-VALIDATION-001 — HIGH**

---

# 9. Missing correct answer becomes empty string

Similarly:

```ts
correctAnswer: rest.correctAnswer ?? ''
```

That can produce an invalid active assessment question.

For authoritative questions:

```text
questionText
options
correctAnswer
difficulty
```

should be validated before insertion.

The separate `/factory/save` route already does this better using:

```ts
z.string().min(1)
```

for question text, answer and explanation.

The atomic hierarchy route should reuse the same standard.

### Classification

**SHC-FACTORY-VALIDATION-002 — HIGH**

---

# 10. This reveals unnecessary duplication between two ingestion paths

There are currently two question ingestion architectures.

### `/factory/save`

This route has:

```text
Zod schema
duplicate detection
question hash
code hash
concept/objective normalization
transaction
skill mapping
semantic indexing
```

### `HierarchyFactory.processQuestions()`

This separately has:

```text
question normalization
question insertion
skill creation
skill mapping
difficulty stats
```

The implementations do not enforce the same rules.

That is precisely the type of DRY problem that becomes a correctness problem.

A question created through:

```text
Factory Save
```

should not have stronger validity/duplicate protections than a question created through:

```text
Hierarchy Atomic
```

### Target

We should eventually extract a shared authoritative application operation such as conceptually:

```text
QuestionIngestionService
```

that both workflows use.

Not necessarily a class; a cohesive module/service function is enough.

### Classification

**SHC-DRY-DOMAIN-001 — HIGH**

---

# 11. Atomic factory can auto-create arbitrary skills

During question processing:

```text
skillNames
    ↓
look up existing skills
    ↓
missing names
    ↓
create skills automatically
```

with defaults:

```ts
category: 'technical'
mappingType: 'conceptual'
```

This deserves governance review.

The separate prompt service has a `strictMode` concept saying:

> do not create new skills if the official taxonomy exists.

But `HierarchyFactory` doesn't receive or enforce such a mode.

So a generated skill name can become a real global Skill automatically.

### Possible desired policy

```text
known skill
→ link

unknown skill
→ reject / review queue
```

rather than:

```text
unknown skill
→ silently create global taxonomy entry
```

For an educational taxonomy, that is potentially important.

### Classification

**SHC-TAXONOMY-GOV-001 — MEDIUM/HIGH**

I will keep the exact remediation open until we finish taxonomy governance requirements.

---

# 12. Skill-category inconsistency is now confirmed across backend too

Earlier we found local UI types using:

```text
technical
soft
analytical
creative
managerial
communication
```

while `CascadingSelect` used:

```text
technical
cognitive
process
```

Now the backend hierarchy schema says:

```ts
z.enum([
  'technical',
  'cognitive',
  'process'
])
```

and `HierarchyFactory` casts to those same values.

So the contradiction is real:

```text
local admin type system
           ≠
backend canonical schema
```

This means we must identify the database/domain canonical enumeration and eliminate the competing client definition.

**SHC-SKILL-CONTRACT-001 remains HIGH and is now confirmed cross-layer.**

---

# 13. Manual factory workflow is too permissive

Manual mode converts UI state directly into loosely structured objects such as:

```ts
{ domainName: manualEntry.name }
```

or:

```ts
{
  domainId,
  subjects: [{ name }]
}
```

and sends them through `atomicSeed`.

The route should validate those commands strongly.

This matters even though the browser UI has required fields because browsers are never authoritative.

---

# 14. Bulk JSON is parsed directly in the component

Bulk mode does:

```ts
JSON.parse(payload)
```

inside the UI.

That's fine as a syntax check, but currently it doesn't have a typed client-side schema.

So the UX sequence is:

```text
valid JSON syntax
        ↓
send arbitrary structure
        ↓
server service tries to interpret it
```

We want:

```text
valid JSON syntax
        ↓
client schema gives immediate useful feedback
        ↓
server independently validates same contract
```

The server remains authoritative.

---

# 15. The execution timeline is partly fictional

The UI shows steps such as:

```text
Data Validation
Database Lookup
Registry Transaction
Hierarchy Sealing
```

but `handleCreate()` manually does:

```ts
setExecutionStep('lookup');
await delay(800);

setExecutionStep('transaction');
await delay(600);

setExecutionStep('filter');
```

before or around the actual API operation.

Those phases do not reflect live backend progress.

This can mislead an administrator into believing:

```text
Database Lookup completed
```

when the backend hasn't reported that at all.

For an ordinary decorative loading animation, this might be harmless.

For an admin/governance console labeled as an execution monitor, it is misleading.

### Better

Either:

```text
Submitting
Processing
Completed
```

if progress is unknown,

or use real server job/progress events.

### Classification

**SHC-FACTORY-UX-001 — MEDIUM**

---

# 16. Blueprint wizard is simpler, but server enforcement must be authoritative

`BlueprintFactoryWizard` validates:

```text
static blueprint must have question IDs
difficulty distribution total = 100
```

in the browser.

Good UX.

But we must confirm the backend independently enforces:

```text
static question-set existence
question ownership
domain binding
totalQuestions
timeLimit
difficulty percentages = 100
```

before treating those invariants as implemented.

So Blueprint is **not closed yet** from a backend-contract perspective.

---

# 17. Factory save is a much better validation reference

`/api/factory/save` does several things correctly:

```text
admin authorization
size/depth validation
sanitization
Zod runtime schema
batch duplicate detection
database duplicate detection
transaction
question hashes
concept/objective normalization
skill linking
structured metrics
```

This should become an architectural reference for atomic ingestion.

I would not rewrite it just to fit a pattern.

---

# 18. But Factory Save has an operational reliability issue

After the DB transaction commits, vector indexing is performed using:

```ts
void SemanticSearchService.indexQuestion(...)
```

in a `forEach`.

This is **fire-and-forget**.

If:

```text
process crashes
network fails
Upstash unavailable
deployment starts
```

after database commit, the question may exist in PostgreSQL while its vector index is missing.

Since the architecture says the vector store is derived rather than authoritative, this is recoverable—but recovery needs to be deliberate.

The preferred design is:

```text
DB commit
   ↓
durable outbox/event
   ↓
background indexing worker
   ↓
retry / dead-letter / observability
```

or a reliable reconciliation job.

### Classification

**SHC-AI-INDEX-001 — HIGH operational**

This belongs mainly to later reliability/data/AI gates, but the factory exposes it.

---

# 19. Duplicate checking can fan out heavily

`check-duplicates` does approximately:

```ts
Promise.all(
  questions.map(
    DuplicateDetector.evaluate
  )
)
```

There is no obvious schema-level maximum question count in that route.

Payload size/depth helps, but does not control expensive per-question work.

If `DuplicateDetector` invokes:

```text
DB
vector search
private judge
```

then a large payload can trigger many concurrent expensive operations.

We need:

```text
max questions per request
+
bounded concurrency
```

or batching.

### Classification

**SHC-RESOURCE-003 — MEDIUM/HIGH**

---

# 20. The hierarchy-factory tests cover branches, but miss the most important contract fields

I checked the hierarchy factory test suite for:

```text
complexityLevel
weight
depthLevel
mappingType
skillWeight
correctAnswer
Placeholder Question
```

Across the inspected factory tests:

```text
complexityLevel → 0 references
weight          → 0
depthLevel      → 0
skillWeight     → 0
correctAnswer   → 0
Placeholder     → 0
mappingType     → some coverage
```

But the mapping-type tests mainly prove the operation executes; they do not verify that question `mappingType` is persisted correctly.

That explains how the current silent-field-loss behavior can survive.

### Required regression tests

When this vertical is implemented, we need explicit assertions that:

```text
topic weight persists
topic complexity persists
subtopic depth persists
question mappingType persists
skill metadata persists
invalid question text rejects
invalid correct answer rejects
invalid enums reject
transaction rolls back on nested failure
unknown skills follow governance policy
```

### Classification

**SHC-FACTORY-TEST-001 — HIGH**

---

# Hierarchy Factory architectural status

I would now classify it this way:

| Principle | Status |
|---|---|
| Authentication | **Implemented** |
| Transactionality | **Implemented** |
| Size/depth protection | **Implemented** |
| Observability basics | **Implemented** |
| Application/service boundary | **Mostly implemented** |
| Runtime contract validation | **Partial / insufficient** |
| DRY | **Partial** |
| SRP | **Partial** |
| DIP | **Partial** |
| Fail Fast | **Violated in question defaults** |
| Data integrity | **Partial / high gaps** |
| Type safety | **Partial** |
| Domain ownership | **Mostly correct direction** |
| UI truthfulness | **Partial** |
| Test coverage | **Partial** |
| Background reliability | **Not sufficient for vector indexing** |

## Most important conclusion from this tranche

We **should not rewrite `HierarchyFactory` from scratch**.

Its transactional orchestration is useful and is closer to the target architecture than the taxonomy CRUD endpoints.

The correct strategy is to strengthen it:

```text
AtomicHierarchyCommand schema
        ↓
strict runtime validation
        ↓
Hierarchy application service
        ↓
reuse authoritative question-ingestion rules
        ↓
transaction
```

and align all contracts so:

```text
Prompt
UI
api-client
Zod
service
database
```

agree on exactly the same fields.

That is a much safer refactor than replacement.

### Taxonomy vertical status

With this review, the **core Educational Taxonomy + Hierarchy Factory vertical is now substantially understood end-to-end**.

I still want to review the remaining **question factory UI flow**—`question-generator`, `JsonIngestBox`, `ReviewConsole`, and `QuestionCard`—because it uses `/factory/save` and therefore shares the question-ingestion contract. After that, I can formally close the Factory/Taxonomy baseline and move to the next major SkillHubCore Admin vertical without touching implementation prematurely.

Yes. This tranche completes the **Question Factory commit path** deeply enough that we can now close the core **Taxonomy + Hierarchy Factory + Question Factory architecture baseline** before implementation.

The most important result is that the actual Question Factory save path is better protected than it first appeared, but I found several **high-severity contract mismatches where UI behavior is silently discarded by the backend**.

## Question Factory architecture verdict

The actual flow is:

```text
QuestionFactoryPage
   ↓
FactoryContext
   ↓
JsonValidator / healing
   ↓
ReviewConsole
   ↓
duplicate check
   ↓
POST /admin/questions/bulk
   ↓
admin authorization
   ↓
Zod validation
   ↓
duplicate enforcement
   ↓
tracked bulk-import Job
   ↓
authenticated Upstash workflow
   ↓
AdminQuestionEngine
   ↓
QuestionRepository
   ↓
DB
```

This is structurally much stronger than the old direct-DB taxonomy routes.

However, important semantics are being lost between those layers.

### New high-priority findings

| ID | Finding | Severity |
|---|---|---:|
| SHC-QF-CONTRACT-001 | `skillNames` selected/remapped in UI are stripped before persistence | **High** |
| SHC-QF-CONTRACT-002 | `mappingType` is accepted but not persisted by `AdminQuestionEngine` | **High** |
| SHC-QF-VALIDATION-001 | Backend schema permits missing `correctAnswer` | **High** |
| SHC-QF-VALIDATION-002 | Engine converts missing answer to `"No correct answer provided"` | **High** |
| SHC-QF-UI-001 | UI offers “Create as New Skill” although actual bulk path cannot do that | **High** |
| SHC-QF-STATE-001 | “Ready” count means total count, not actually validated-ready count | Medium |
| SHC-QF-PERF-001 | Editing any question can re-run expensive duplicate checks for entire batch | Medium/High |
| SHC-QF-INGEST-001 | JSON healer can mutate AI output before validation | Medium/High |
| SHC-QF-INGEST-002 | Parse-error location UI can read stale React validation state | Medium |
| SHC-QF-ID-001 | UI generates temporary question IDs that are not authoritative | Low/Medium |
| SHC-QF-JOB-001 | Production `?e2e=true` can expose mock-job trigger | Needs deeper security classification |
| SHC-QF-DRY-001 | Question validation is duplicated across validator/UI/schema/engine | High architectural debt |

## 1. Very important: skill remapping currently does not reach persistence

The review card allows an administrator to inspect AI-generated skill names and remap them to official taxonomy entries.

It even offers:

```text
✧ Create as New Skill
```

This gives the administrator the impression that the decision will affect persistence.

`ReviewConsole` sends:

```ts
skillNames: q.skillNames
```

inside each question.

But the real server schema `bulkQuestionSchema` is built from `questionSchema`.

`questionSchema` defines:

```text
topicId
subtopicId
skillId
skillIds
difficulty
type
mappingType
questionText
options
correctAnswer
explanation
codeSnippet
conceptKey
objectiveKey
estimatedTime
tags
skillWeight
status
```

It does **not** define:

```text
skillNames
```

Therefore the parsed server command does not preserve that field.

And `AdminQuestionEngine.CreateQuestionInput` also has:

```text
skillId
skillIds
```

but no `skillNames`.

So this chain:

```text
AI skillNames
    ↓
QuestionCard remapping
    ↓
ReviewConsole skillNames
    ↓
bulkQuestionSchema
    ✕
```

loses the data before the authoritative engine.

### Consequence

The skill-remapping UI is currently misleading.

An admin can spend time correcting:

```text
"React Programming"
→ "React"
```

and the persisted question may receive neither mapping.

This is not a cosmetic problem.

### Classification

**SHC-QF-CONTRACT-001 — HIGH**

---

# 2. “Create as New Skill” is particularly incorrect for this flow

`QuestionCard` contains:

```text
✧ Create as New Skill
```

The earlier `/factory/save` implementation actually does support creation from missing skill names.

But the current Review Console does **not call `/factory/save`**.

It calls:

```ts
bulkCreateQuestions(...)
```

which goes to:

```text
/admin/questions/bulk
```

That path expects IDs, not arbitrary names.

So two competing ingestion paths currently have different behavior:

```text
/factory/save
    → understands skillNames
    → may create skills

/admin/questions/bulk
    → skillIds
    → does not preserve skillNames
```

Yet the current UI appears built around the former semantics while using the latter endpoint.

### Architectural conclusion

There must be one authoritative question-ingestion contract.

We should not maintain two subtly incompatible ingestion pipelines.

---

# 3. `mappingType` is also lost

`ReviewConsole` sends:

```ts
mappingType: q.mappingType
```

The server schema accepts:

```text
conceptual
technical
practical
```

and `CreateQuestionInput` contains:

```ts
mappingType?: ...
```

So everything looks correct until persistence.

Inside `AdminQuestionEngine.createQuestion()` the constructed `questionData` contains:

```text
topicId
subtopicId
difficulty
questionText
options
correctAnswer
type
explanation
codeSnippet
questionHash
codeHash
conceptKey
objectiveKey
status
```

but **no `mappingType`**.

So the value disappears before:

```ts
repository.create(...)
```

This independently confirms the field-loss issue we already found in `HierarchyFactory`.

That means both major question-ingestion paths mishandle `mappingType`.

### Classification

**SHC-QF-CONTRACT-002 — HIGH**

This should have a dedicated regression test.

---

# 4. Missing `correctAnswer` remains a backend defect

The Review Console correctly validates:

```ts
if (
    q.correctAnswer == null ||
    q.correctAnswer.trim() === ''
)
```

and blocks the UI commit.

Good.

But browser validation is not authoritative.

Server `questionSchema` currently defines:

```ts
correctAnswer: z.string().optional()
```

rather than requiring a non-empty answer for MCQ.

Then `AdminQuestionEngine` does:

```ts
correctAnswer:
    data.correctAnswer ??
    "No correct answer provided"
```

This is not acceptable for an authoritative MCQ bank.

A malformed or alternative caller can therefore potentially produce a question whose authoritative answer becomes literal text:

```text
No correct answer provided
```

### Correct behavior

For MCQ/code-MCQ:

```text
correctAnswer required
        +
must correspond to a valid option
```

and invalid content must be rejected.

Potentially different question types can have different requirements, but that should be represented explicitly in a discriminated schema.

### Classification

**SHC-QF-VALIDATION-001 — HIGH**

**SHC-QF-VALIDATION-002 — HIGH**

---

# 5. We need discriminated question schemas

Current schema allows:

```text
mcq
code_mcq
multi_select
```

but then applies roughly one broad optional-field contract.

A better model is conceptually:

```ts
z.discriminatedUnion('type', [
  mcqQuestionSchema,
  codeMcqQuestionSchema,
  multiSelectQuestionSchema
])
```

For example:

```text
MCQ
  options >= 2
  correctAnswer required
  correctAnswer ∈ options

code_mcq
  codeSnippet required
  options >= 2
  correctAnswer required

multi_select
  multiple authoritative answers
```

This is an example where stronger typing actually reduces complexity rather than increasing it.

---

# 6. Good: server duplicate checking is defense-in-depth

The Review Console performs a preview duplicate check.

But critically, the actual `/admin/questions/bulk` endpoint repeats:

```text
in-batch duplicate detection
+
DuplicateDetector.evaluate(...)
```

before creating the job.

Good.

So bypassing the browser does not bypass duplicate enforcement.

That satisfies secure-by-default behavior.

### Status

**SHC-QF-DUP-001 — Implemented**

---

# 7. Duplicate enforcement is repeated again inside the engine

`AdminQuestionEngine.bulkCreateQuestionsWithContext()` again runs:

```text
findBatchDuplicateDetails()
```

and each call to:

```text
createQuestion()
```

again invokes:

```text
DuplicateDetector.evaluate()
```

This gives strong safety, but may result in expensive repeated work:

```text
API:
  batch duplicate
  external duplicate check

then workflow:

  batch duplicate again

then each question:
  duplicate evaluation again
```

Correctness is strong.

Efficiency is questionable.

### Principle balance

We should preserve defense-in-depth, but avoid doing identical expensive semantic/vector work unnecessarily.

For example:

```text
API validation
   ↓
durable validated command/job
   ↓
worker performs authoritative duplicate check immediately before write
```

or carry verified metadata safely if appropriate.

We should not optimize this until we measure cost/latency, but it deserves review.

---

# 8. The workflow architecture itself is good

The bulk API does:

```text
validate
duplicate-check
create Job
trigger workflow
```

and the workflow:

```text
verifies QStash signature
requires jobId
acquires job lock
processes batches of 10
releases lock
```

This is a much healthier large-batch architecture than one huge synchronous request.

It aligns with the architecture's durable background-processing direction.

### Status

**SHC-QF-ASYNC-001 — Implemented structurally**

But we still need to review job terminal-state behavior later under operational reliability.

---

# 9. The 404 synchronous fallback is pragmatic but deserves monitoring

If the workflow endpoint returns exactly:

```text
404
```

the bulk endpoint falls back to synchronous insertion.

That is useful during deployment/migration scenarios.

However, for large batches it can reintroduce timeout risk.

It should be bounded and observable.

For example:

```text
small batch + workflow unavailable
→ synchronous fallback acceptable

large batch
→ fail/retry rather than synchronously processing everything
```

### Classification

**SHC-QF-RESILIENCE-001 — Medium**

---

# 10. `AdminQuestionEngine` actually demonstrates good DIP

This file is worth preserving as an architectural example.

It depends on:

```ts
IQuestionRepository
```

and gets the concrete implementation through:

```ts
container.get(DrizzleQuestionRepository)
```

So high-level application logic isn't tightly hard-coded to Drizzle queries.

This is what our taxonomy CRUD routes should move toward.

The architecture already exists in the repository—we don't have to invent it.

### Status

**SHC-DIP-REFERENCE-001 — Implemented**

This can become one of our reference implementations for Phase 1A.

---

# 11. `withDb()` supports transaction-aware repository composition

This is also good:

```ts
withDb(dbClient)
```

returns an engine wired to a transaction-scoped repository.

That makes it possible to preserve repository abstraction while participating in a transaction.

This is a useful pattern and preferable to routes importing raw schema tables.

---

# 12. But the engine mixes some infrastructure orchestration

Inside `createQuestion()` it:

```text
persists question
writes audit
enqueues semantic indexing
```

Those concerns are related to the application operation “create question,” so this is not automatically an SRP violation.

But there is an important transactional issue.

The audit and queue operations occur **inside the DB transaction callback**.

Depending on their implementations:

```text
DB transaction
   ↓
external audit/queue side effect
   ↓
DB commit
```

can create inconsistency.

For example:

```text
queue succeeds
DB commit fails
```

or:

```text
DB transaction waits for external service
```

We need to inspect `AuditService` and `queueService` during the operational boundary review.

The ideal pattern may be an outbox.

I will not classify this as a confirmed defect until those implementations are inspected.

---

# 13. `JsonIngestBox` has a subtle React state correctness issue

It does:

```ts
const success = ingestRawJson(rawJson);

if (!success) {
    const parseError =
        validationErrors.find(...)
}
```

But `ingestRawJson()` calls:

```ts
setValidationErrors(result.errors)
```

React state updates are asynchronous.

Therefore immediately afterward, `validationErrors` in `JsonIngestBox` may still represent the **previous render**.

That means line/column extraction may fail or use stale errors.

### Better contract

Instead of:

```ts
ingestRawJson(): boolean
```

return:

```ts
{
  success: boolean;
  questions?: GeneratedQuestion[];
  errors?: ValidationIssue[];
  healingReport?: HealingReport;
}
```

Then UI gets the actual current result synchronously.

### Classification

**SHC-QF-INGEST-002 — MEDIUM**

---

# 14. Ingestion result should be typed, not split across state

Right now one operation produces state distributed across:

```text
boolean return
validationErrors state
lastHealingReport state
stagedQuestions state
toast side effects
```

This makes the caller reason about several channels.

A cohesive result would simplify the architecture.

This is a KISS improvement, not an enterprise abstraction.

---

# 15. The JSON “healer” needs a trust boundary

The UI explicitly advertises:

```text
Auto-Healing
Healing Active
```

and the validator can fix:

```text
unescaped quotes
trailing commas
conversational wrappers
```

Syntax repair can be useful for AI-generated data.

But it must never silently “heal” semantic errors.

The correct chain is:

```text
raw AI output
    ↓
syntax extraction/repair
    ↓
strict schema validation
    ↓
domain validation
    ↓
human review
    ↓
server validation again
```

The healing layer must remain limited to syntax normalization.

Earlier review already showed `JsonValidator` performs substantial regex repair, so its tests will eventually need explicit assurance that it cannot alter:

```text
correct answers
question text meaning
difficulty
skill mappings
```

while fixing syntax.

### Classification

**SHC-QF-INGEST-001 — MEDIUM/HIGH**

---

# 16. “Ready” count is currently not actually a readiness count

`ReviewConsole` says:

```ts
const readyCount = stagedQuestions.length;
```

and displays:

```text
Ready
```

for all staged questions.

But questions may still have:

```text
missing answer
invalid depth
duplicate status
missing explanation
```

The actual validation only happens when Commit is pressed.

So:

```text
readyCount
```

doesn't mean ready.

It means staged.

### Better

Calculate:

```text
valid count
duplicate count
needs-review count
```

or simply label it:

```text
Staged
```

until validation is complete.

### Classification

**SHC-QF-STATE-001 — MEDIUM**

---

# 17. Duplicate check runs against the entire staged batch after edits

Effect dependency:

```ts
[stagedQuestions, blueprint.topicId]
```

with only 500 ms debounce.

Editing one character causes the entire array to change.

After 500 ms:

```text
all staged questions
→ duplicate API
→ DuplicateDetector for every non-batch-duplicate question
```

If an administrator is editing a batch of 50–100 questions, this can become costly.

Potential solution:

```text
check only changed question
```

while maintaining lightweight in-batch duplicate detection locally.

Then full authoritative duplicate check occurs at commit.

Or trigger duplicate check explicitly after editing.

### Classification

**SHC-QF-PERF-001 — MEDIUM/HIGH**

---

# 18. ReviewConsole creates temporary IDs unnecessarily

Payload includes:

```ts
id: q.id ?? `gen-${idx}`
```

But `bulkQuestionSchema` does not use that ID.

So this is essentially dead compatibility data.

It should probably be removed from the persistence command.

Generated client IDs can still exist for React/staging identity, but they should not pretend to be persistence IDs.

---

# 19. Payload contains legacy duplicate fields

ReviewConsole sends both:

```ts
text: q.questionText,
questionText: q.questionText
```

and sends options as objects.

This strongly suggests the frontend is carrying compatibility baggage from older APIs.

The server now has a canonical schema.

We should clean the client to produce exactly the canonical command.

### Classification

**SHC-QF-DRY-002 — Medium**

---

# 20. `QuestionCard` is mostly a good presentational component

Unlike the large table components, `QuestionCard` primarily owns:

```text
editing UI
option editing
correct-answer selection
rationale display
skill remap display
selection callbacks
```

That is reasonably cohesive.

I would not split it aggressively.

Possible small extraction later:

```text
QuestionOptionsEditor
SkillMappingEditor
```

only if testing/readability benefits.

KISS matters here.

---

# 21. But question editing has an invariant problem

Suppose the current correct answer is:

```text
Option A
```

Then the admin edits Option A text.

The component changes:

```ts
options[oIdx]
```

but does not automatically update:

```ts
correctAnswer
```

So temporarily:

```text
correctAnswer ∉ options
```

The commit validation catches this later, which is good.

But the editor can maintain the invariant more cleanly:

```text
if edited option was correct
→ update correctAnswer to new option text
```

This reduces avoidable invalid states.

### Classification

**SHC-QF-EDITOR-001 — Medium**

---

# 22. Skill governance UX is inconsistent with actual backend behavior

QuestionCard determines whether a skill is “new” using:

```text
topic-specific official skills
```

because `ReviewConsole` calls:

```ts
getTopicSkills(topicId)
```

But the generator prompt uses:

```text
globalSkills
```

from:

```ts
useAllSkills()
```

So a skill may be:

```text
globally official
but not mapped to current topic
```

and ReviewConsole may label it:

```text
SUGGESTED
```

as though it were entirely new.

We need three states:

```text
already mapped to topic
official global skill, not mapped here
new/unrecognized skill
```

Those are different governance decisions.

### Classification

**SHC-QF-SKILL-GOV-001 — HIGH**

This ties directly into the taxonomy governance issue found earlier.

---

# 23. Source-of-truth prompt terminology is stronger than the actual guarantee

`SourceEditor` is labeled:

> Source of Truth

and `PromptService` says:

> Use ONLY the following content.

That is a prompt instruction to external AI.

It is not a technical enforcement boundary.

The system later validates shape and duplicates, but it does not appear to automatically verify every generated fact against that source material.

So architecturally we should distinguish:

```text
generation grounding instruction
```

from:

```text
verified factual source of truth
```

This is especially important if these questions become active learner content.

### Classification

**SHC-QF-AI-GOV-001 — Medium/High**

Human review remains necessary.

---

# 24. Strict Mode is not actually end-to-end strict

The generator prompt uses:

```ts
strictMode
```

to tell AI:

> do not create new skill names.

But the authoritative commit backend does not receive:

```text
strictMode
```

and therefore cannot enforce it.

So “Strict” currently means:

```text
prompt-level preference
```

not:

```text
server-enforced taxonomy policy
```

If Strict Mode is meant as governance, the backend must enforce it.

### Classification

**SHC-QF-STRICT-001 — HIGH**

---

# 25. Production E2E query flag needs later security review

QuestionFactoryPage enables the mock-job button when:

```text
NODE_ENV !== production
```

which is fine.

But it also enables it when:

```text
?e2e=true
```

even in production.

This does not by itself bypass server authorization.

However, it exposes a testing operation in production to authenticated users who know the query parameter.

We need to inspect:

```text
systemAdmin.createJob()
jobs route
allowed job types
```

before grading severity.

For now:

**SHC-QF-TEST-HOOK-001 — Needs verification**

I would generally prefer production test hooks to require explicit server-side environment configuration rather than a public URL parameter.

---

# 26. One especially good architectural pattern exists here

The final persistence route is intentionally thin:

```text
skillhubcore-admin BFF route
      ↓
guard
      ↓
trusted upstream proxy
```

and the backend then performs:

```text
authorization
validation
domain logic
job orchestration
```

That is the architecture we want.

So again, we are not rebuilding the entire application.

We are aligning weaker verticals to patterns that already work elsewhere in the repository.

---

# Factory + Taxonomy baseline can now be formally closed

At this point the following connected vertical has been traced sufficiently end-to-end:

```text
Domain
Subject
Topic
Subtopic
Skill
Question

taxonomy CRUD
taxonomy client hooks
taxonomy tables
cascading hierarchy selection

Hierarchy Factory
atomic hierarchy endpoint
HierarchyFactory service
hierarchy schemas

Question Factory
prompt generation
JSON ingestion/healing
review editing
skill mapping UX
duplicate preview
bulk API
server Zod validation
job creation
workflow
AdminQuestionEngine
repository boundary
```

The conclusion is:

### Educational Taxonomy
**Partially implemented — significant architecture remediation required**

### Hierarchy Factory
**Partially implemented — strong transactional foundation, contract/data-loss fixes required**

### Question Factory
**Partially implemented — strong server workflow foundation, major client/server contract alignment required**

The highest-priority corrections are now clear:

1. Establish **one canonical taxonomy/question contract** shared across UI/API/application layers.
2. Fix server-side question invariants—especially `correctAnswer`.
3. Preserve `mappingType`.
4. Decide and enforce authoritative skill mapping semantics.
5. Eliminate the misleading `skillNames`/“Create as New Skill” behavior unless the backend truly supports it.
6. Add strict runtime schema validation to atomic hierarchy ingestion.
7. Preserve Topic `weight`/complexity and Subtopic `depthLevel`, or remove them from the contract if they are not real domain concepts.
8. Consolidate question-ingestion behavior instead of maintaining divergent `/factory/save`, `/admin/questions/bulk`, and atomic hierarchy semantics.
9. Make Strict Mode server-enforceable if it is governance rather than a prompt preference.
10. Add explicit regression tests for every previously discarded field and invalid-content case.

This is the first major vertical where I now consider the **architecture baseline sufficiently complete for later implementation planning**.

I would still not start modifying it yet because our agreed Phase 1A/1B review covers the whole `skillhubcore-admin`, and we should establish the remaining vertical boundaries before deciding the safest commit order. The next logical review tranche is the **Tutorial Composer + Tutorial Sidebar client/UI vertical**, because we already know its server side contains both one of the best service-delegation examples and the largest direct-boundary violation in the app.

Yes. This block-architecture tranche is now reviewed deeply enough to make a firm architectural assessment.

The result is encouraging in one respect: **the Tutorial Composer is genuinely moving toward an OCP/registry architecture**. But it is only partially complete. Adding a **new version inside an existing block family** is reasonably extension-friendly; adding a **completely new block family** still requires edits to stable code.

That distinction matters.

## Block architecture verdict

| Area | Status | Assessment |
|---|---|---|
| Registry/public API | 🟢 Good direction | Central capability discovery |
| Version-owned prompts | 🟢 Good | D1/C1/I1/S1 own prompt logic |
| Version-owned Markdown parsing | 🟢 Good | Removes editor branching |
| Generated Project LLM registration | 🟢/🟡 Good concept | Append-only, but duplicate ownership exists |
| Registration contract tests | 🟢 Useful | Renderer/lifecycle/default presence checked |
| New version extensibility | 🟢 Mostly good | O2/O3-style extension works |
| New family extensibility | 🔴 Incomplete | Hard-coded type/switch boundaries remain |
| Single source of truth | 🟡 Partial | Registry, lifecycle, renderer, schemas spread across modules/packages |
| Payload validation | 🔴 Uneven | Some versions strictly canonicalized, others default-fill/identity |
| Default-content handling | 🔴 High concern | Missing author content can become example content |
| Generated lifecycle uniqueness | 🔴 Gap | Duplicate `(type,version)` definitions allowed |
| Prompt/schema consistency | 🟡 Partial | Several prompts/defaults describe different accepted shapes |

### 1. The registry abstraction itself is good

The public API:

```text
getBlockTypes()
getBlockType()
getVersions()
getVersion()
getDefaultPayload()
```

provides a clean read boundary.

Components don't need to know where registrations originate.

Static entries:

```text
definitionRegistry
codeRegistry
summaryRegistry
introductionRegistry
objectiveRegistry
```

are merged with:

```text
GENERATED_BLOCK_REGISTRIES
```

That is a good OCP direction.

The architecture's requirement is not “never modify code”; it is to minimize modification of stable modules when adding capabilities. This registry approach does that for versions reasonably well. FinalAechitecture

---

# 2. Project LLM placement has an important architectural advantage

The comments make the intended model clear:

```text
Static product registrations
        +
append-only generated registrations
```

instead of Project LLM rewriting:

```text
registry/index.ts
```

for every placement.

That is a sound design.

It lowers the risk that an automated placement operation destroys hand-maintained registry code.

### Classification

**SHC-BLOCK-OCP-001 — substantially implemented**

---

# 3. The registration contract test is valuable

This test checks every selectable version for:

```text
Composer lifecycle definition
+
runtime renderer
+
default payload
```

Conceptually:

```ts
for every selector version:
    lifecycle exists
    renderer exists
    default payload exists
```

Excellent.

This prevents a common failure mode:

> version appears in admin selector but learner runtime cannot render it.

### Classification

**SHC-BLOCK-TEST-001 — good architectural enforcement**

I would strengthen this test rather than replace it.

---

# 4. But it does not test uniqueness

This is now a concrete defect.

Static lifecycle definitions already contain:

```text
objective O1
objective O2
```

while:

```text
GENERATED_BLOCK_VERSION_DEFINITIONS
```

contains:

```text
objective O3
objective O1
```

Therefore the `definitions` array contains **two Objective O1 definitions**.

The lookup is:

```ts
definitions.find(...)
```

so the **first O1 wins**.

The generated O1 lifecycle definition is effectively unreachable.

### Why the existing test misses it

It checks:

```ts
definitions.some(...)
```

which only proves:

> at least one matching definition exists.

It does not prove:

```text
exactly one authoritative definition exists
```

### Required invariant

For every:

```text
(blockType, versionCode)
```

there must be exactly one owner.

### Finding

**SHC-BLOCK-REGISTRY-001 — HIGH**

We need an enforcement test such as conceptually:

```text
unique key = `${type}:${version}`
```

and fail on duplicate registration.

---

# 5. The selector does defend against duplicate version codes

Interestingly, the registry merge does:

```text
existing version codes
        ↓
do not append generated duplicate
```

So generated Objective O1 is ignored in the selector.

That is good defensive behavior.

But it creates an inconsistency:

```text
selector registry
→ one O1

lifecycle definitions
→ two O1s
```

This is precisely why we need one authoritative registration model.

---

# 6. Project LLM should not be allowed to generate a duplicate existing version

Rather than silently ignoring duplicate generated O1, placement should preferably fail.

For example:

```text
attempted placement:
objective O1

existing owner:
static objective O1

result:
PLACEMENT_CONFLICT
```

Fail Fast is preferable to producing dead generated artifacts.

### Finding

**SHC-BLOCK-PLACEMENT-001 — HIGH**

Project LLM placement should enforce ownership uniqueness.

---

# 7. New versions are genuinely extension-friendly

Suppose we add:

```text
Objective O3
```

The generated system can register:

```text
registry metadata
lifecycle definition
renderer
```

without editing the static Objective source.

The registry merge adds O3 to Objective.

The lifecycle lookup finds O3.

The runtime-registration test verifies a renderer exists.

This is a good extension architecture.

So I would classify:

### Existing family + new version
**Mostly OCP compliant**

---

# 8. But a completely new block family is not actually plug-in extensible yet

The comment says generated registrations may:

> introduce a new family.

The types suggest this too:

```ts
BlockRegistryEntry.id:
    TutorialPageContentType | string
```

But deeper layers don't support that claim consistently.

`BlockVersionDefinition` requires:

```ts
type: TutorialPageContentType
```

and:

```ts
getBlockType(
  blockTypeId: TutorialPageContentType
)
```

also requires a known platform type.

Most importantly, `tutorialBlocksToInstances()` still contains:

```ts
switch (block.type) {
    case 'definition':
    case 'code':
    case 'summary':
    case 'introduction':
    case 'objective':
    default:
        throw ...
}
```

So a brand-new generated family such as:

```text
diagram
```

cannot simply plug itself in.

Hydration would hit:

```text
Unsupported block type for editor
```

unless stable application code is modified.

### Finding

**SHC-BLOCK-OCP-002 — HIGH**

The architecture currently supports:

> new versions of known families

much better than:

> new block families.

That distinction should be explicitly documented until fixed.

---

# 9. `documentTransformation.ts` is the main OCP bottleneck

This is currently the stable switch that must understand every family.

That conflicts with the registry direction.

The better model is:

```text
TutorialBlock
    ↓
version lifecycle definition
    ↓
toEditorInstance()
```

rather than:

```text
TutorialBlock
    ↓
switch(type)
    ↓
special family conversion
```

The existing `BlockVersionDefinition` already owns:

```text
normalizePreview
prepareForStorage
parseMarkdown
toCanonicalBlock
```

So a natural next evolution is to add something like:

```text
toEditorInstance
```

or equivalent hydration behavior to the version contract.

Then the registry truly owns lifecycle behavior both directions.

### Finding

**SHC-BLOCK-OCP-003 — HIGH**

---

# 10. We should not create another abstraction parallel to `BlockVersionDefinition`

The existing lifecycle abstraction is already meaningful.

So rather than introduce:

```text
BlockAdapterFactory
BlockHandlerFactory
BlockStrategyFactory
BlockLifecycleManager
```

we should extend the existing:

```ts
BlockVersionDefinition
```

contract.

KISS.

---

# 11. `sourceParser.ts` is an excellent OCP improvement

This code is very simple:

```ts
return format === 'json'
    ? JSON.parse(source)
    : parseBlockMarkdown(
        source,
        contentType,
        versionCode
      );
```

And block-specific Markdown logic lives in the version definition.

That means the editor doesn't need:

```text
if definition
if code
if summary
if introduction
...
```

This is exactly the right direction.

### Classification

**SHC-BLOCK-OCP-004 — Implemented**

---

# 12. Prompt ownership is also moving in the right direction

Registry versions can define:

```ts
getAiPrompt?: (...)
authoringRules?: ...
```

and `AiInstructionContainer` resolves these dynamically.

Good.

D1 owns D1 instructions.

C1 owns C1.

I1 owns I1.

S1 owns S1.

Objective dynamically resolves version payloads.

This strongly reduces central conditional logic.

### Classification

**SHC-BLOCK-PROMPT-001 — good separation**

---

# 13. However, schema truth is still distributed

For one block version, truth can currently live in several places:

```text
registry default payload
AI prompt JSON example
normalizer
canonical converter
@quiz/types schema
runtime renderer
lifecycle definition
```

For C1, for example:

```text
codeC1Example
codeC1.prompt
CodeC1AuthorContentSchema
HistoricalTutorialCodePayloadSchema
toCanonicalCodeC1()
blockVersionDefinitions
runtime renderer
```

That is manageable, but it creates drift risk.

The registration test only proves these pieces **exist**.

It doesn't prove they describe the same contract.

### Finding

**SHC-BLOCK-CONTRACT-001 — MEDIUM/HIGH**

---

# 14. C1 demonstrates a positive strict conversion boundary

`toCanonicalCodeC1()` first attempts:

```text
canonical schema validation
```

and if that fails:

```text
historical schema validation
```

then performs explicit conversion.

After conversion it validates again against:

```text
CodeC1AuthorContentSchema
```

Excellent.

This is proper migration architecture:

```text
canonical
or
recognized legacy
    ↓
explicit converter
    ↓
canonical schema
```

rather than arbitrary casts.

### Classification

**SHC-BLOCK-MIGRATION-001 — strong**

---

# 15. C1 comments contradict the implementation

`codeC1.examples.ts` says:

> memoryModel field shown here will be stripped during canonicalization

But `toCanonicalCodeC1()` explicitly does:

```ts
memoryModel: legacy.memoryModel
```

with the comment:

```text
PRESERVED
```

and describes the conversion as lossless.

So one of the source comments is stale.

### Finding

**SHC-BLOCK-DOC-001 — MEDIUM**

In architecture-heavy systems, misleading contract comments are dangerous because developers use them as implementation guidance.

The converter implementation is the stronger evidence and should remain authoritative.

---

# 16. D1 normalizer has a more serious semantic issue

`normalizeDefinitionD1Payload()` fills missing fields using:

```text
definitionD1Example
```

For example:

```ts
stringOrFallback(
  rawPage.definition,
  defaults.definition
)
```

So imagine AI returns:

```json
{
  "page": {
    "title": "Python Lists"
  }
}
```

The normalizer can fill missing content from the example:

```text
"What Is a Variable?"
"A variable is..."
```

or related default Variable content.

This is okay for an **empty editor template**.

It is much more dangerous for **storage normalization**.

And the lifecycle currently uses the same normalizer for:

```text
normalizePreview
```

and:

```text
prepareForStorage
```

Therefore incomplete author input can potentially be completed using unrelated example educational content.

### This violates data truth

Authoring defaults and persistence validation are not the same operation.

### Finding

**SHC-BLOCK-DATA-001 — HIGH**

---

# 17. I1 has the same issue, potentially more severely

`normalizeIntroductionI1Payload()` fills missing content from:

```text
introductionI1Example
```

whose example is:

```text
Functions in JavaScript
JavaScript roadmap
functions
event handlers
API calls
```

If an incomplete Python or Java lesson payload reaches storage normalization, missing fields could inherit JavaScript Functions example content.

That's unacceptable for authoritative learner content.

### Finding

**SHC-BLOCK-DATA-002 — HIGH**

---

# 18. We need to separate three different concepts

Right now they are partly conflated:

### A. Editor default

Useful sample content for opening a new editor.

```text
getDefaultPayload()
```

This can contain illustrative examples.

### B. Preview normalization

May fill harmless display defaults.

For example:

```text
missing optional icon → default icon
```

### C. Persistence validation

Must not invent educational content.

For persistence:

```text
required content missing
→ validation error
```

not:

```text
required content missing
→ copy example lesson text
```

This is an important architectural boundary.

---

# 19. `prepareForStorage()` should be strict

Eventually the lifecycle contract should likely make this distinction explicit.

Conceptually:

```text
getDefaultPayload()
normalizePreview()
validateForStorage()
toCanonicalBlock()
```

rather than using a default-filling normalizer as the storage preparation step.

We don't necessarily need four separate functions for every block, but persistence must have strict semantics.

---

# 20. S1 has multiple accepted content shapes

The S1 registry default is a rich structure:

```text
page
summary
revisionTable
quickTips
finalTip
```

But its AI prompt says the canonical structure is:

```json
{
  "content": {
    "title": "...",
    "points": [...]
  }
}
```

Meanwhile the lifecycle canonicalizer deliberately understands both:

```text
rich summary
simple points summary
```

and converts accordingly.

So the implementation intentionally supports multiple shapes.

That's not necessarily wrong.

But the wording:

> canonical S1 Summary schema

in the prompt is misleading because the editor's default “S1” is a very different rich structure.

### Classification

**SHC-BLOCK-CONTRACT-002 — MEDIUM/HIGH**

We need explicit terminology such as:

```text
S1 rich-authoring format
S1 compact canonical format
```

if both are intentionally supported.

---

# 21. Identity normalization for S1 is too permissive

S1 currently uses:

```text
normalizePreview: identityPreview
prepareForStorage: legacyStorage
```

There is no strict S1 transformation at this lifecycle point.

The canonicalizer later attempts to interpret several shapes.

This works pragmatically, but is weaker than C1.

Eventually S1 should have its own runtime schema/converter at the authoring boundary.

### Classification

**SHC-BLOCK-VALIDATION-001 — MEDIUM/HIGH**

---

# 22. Generated versions currently get almost no lifecycle validation

Generated lifecycle definitions contain only:

```ts
{
  type,
  version,
  payloadFormat
}
```

and are transformed into:

```text
normalizePreview → identity
prepareForStorage → identity
toCanonicalBlock → payload as-is
```

So for generated O3:

```text
Project LLM registered it
renderer exists
default payload exists
```

but the Composer lifecycle does not contain a version-specific payload schema or validator.

### Finding

**SHC-BLOCK-GENERATED-001 — HIGH**

Approval of a generated block/version should ideally include a concrete schema/contract, not only renderer + default payload.

---

# 23. The Project LLM placement certification should eventually prove more

Today the local registration test proves:

```text
selectable version
→ lifecycle exists
→ renderer exists
```

For generated placement we eventually want:

```text
registration unique
renderer exists
authoring contract exists
payload schema exists
default payload validates
round-trip validates
preview validates
storage validates
```

That would make block placement much safer.

This belongs to the Project LLM certification review later.

---

# 24. `getDefaultPayload()` has a potentially dangerous fallback

If a requested version doesn't exist:

```ts
const firstVersion = versions[0];
return firstVersion?.getDefaultPayload() ?? {};
```

So asking for:

```text
Code C99
```

could return the default payload for:

```text
Code C1
```

instead of failing.

In the UI this may make fallback convenient.

But from a contract perspective it can hide an invalid version.

### Better distinction

For explicitly requested version:

```text
unknown version
→ fail
```

For no version:

```text
use family default
```

### Finding

**SHC-BLOCK-FAILFAST-001 — MEDIUM/HIGH**

---

# 25. `selectedVersion` has similar fallback behavior

Composer form logic does:

```ts
availableVersions.find(...)
    || availableVersions[0]
```

Again, an invalid/stale version ID silently becomes another version.

Useful for UI recovery, but dangerous if the version identity has semantic meaning.

At minimum the UI should surface:

```text
requested version unavailable; switched to O1
```

rather than silently changing.

---

# 26. Block types are not actually fully registry-driven

`extractBlockTitle()` still contains:

```text
if definition
if code
if summary
if introduction
if objective
```

This is minor compared with hydration, but still means adding a family modifies stable transformation code.

Title extraction could naturally be a lifecycle capability:

```text
getTitle(payload)
```

or fall back generically to known fields.

### Classification

**SHC-BLOCK-OCP-005 — MEDIUM**

---

# 27. `defaultVersionByType` is another central modification point

Current:

```ts
definition → D1
code → C1
summary → S1
introduction → I1
objective → O1
```

A truly registry-driven design should derive default version from registry metadata.

For example:

```text
version.isDefault
```

or simply first explicitly ordered version.

That would remove another central switch/map.

### Classification

**SHC-BLOCK-OCP-006 — MEDIUM**

---

# 28. Objective has especially visible registration duplication

Static Objective registry contains:

```text
O1
O2
```

Generated registry contains:

```text
O3
O1
```

Static lifecycle contains:

```text
O1
O2
```

Generated lifecycle contains:

```text
O3
O1
```

That means O1 currently appears in **four ownership surfaces**.

Even though the selector deduplicates it, this is not a healthy single-ownership model.

### Required rule

A static version should not also be generated.

Project LLM placement should treat existing `(family, version)` as immutable ownership unless it is explicitly executing a governed replacement/supersession workflow.

---

# 29. Generated Objective O1 also has field drift

Static Objective O1 default uses fields such as:

```text
description
```

inside objectives.

Generated O1 uses:

```text
text
```

for comparable content.

That means even the duplicate O1 registrations don't describe exactly the same payload shape.

The selector chooses the static registration, while generated artifacts exist with a different shape.

This strengthens the duplicate-registration finding from “cleanup” to a real contract risk.

### Classification

**SHC-BLOCK-REGISTRY-002 — HIGH**

---

# 30. Objective prompt dynamically deriving structure is actually a good pattern

`getObjectiveO1Prompt()` resolves the selected version and obtains:

```ts
getDefaultPayload()
```

then inserts that exact structure into the generation prompt.

That means O2/O3 can get version-specific structure without adding another prompt file.

For versions without highly specialized content rules, this is a good DRY pattern.

It may be worth using selectively for other families.

But we should not blindly eliminate specialized prompts such as C1, because C1 needs richer pedagogical/memory-model instructions.

---

# 31. The shared prompt infrastructure is good

These are centralized:

```text
target hierarchy
expectedTimeSec contract
prohibited system metadata
common header
common footer
```

That's a real DRY win.

Block prompts do not need to independently repeat:

```text
domain
subject
topic
subtopic
navigationNode
system metadata prohibition
```

### Classification

**SHC-BLOCK-DRY-001 — Implemented well**

---

# 32. `expectedTimeSec` separation is also well tested

The tests establish that:

```text
expectedTimeSec
```

lives at the Block level and not inside educational payload content.

They also test round trips for D1/C1.

This is good contract testing.

### Status

**SHC-BLOCK-METADATA-001 — Implemented and tested in source**

Important caveat: I am saying the **tests exist and assert this behavior**. I am not claiming they passed in CI because we still have no current workflow execution evidence.

---

# 33. Round-trip testing should be generalized to every registered version

Today there is detailed D1/C1 round-trip testing and selected contract tests.

The registry architecture gives us an opportunity for generic tests:

```text
for every registered version:
    default payload
      ↓
prepareForStorage
      ↓
canonical block
      ↓
hydrate
      ↓
preserve version + metadata
```

with family-specific assertions where necessary.

This would greatly strengthen OCP.

When O4 arrives, it automatically participates.

### Finding

**SHC-BLOCK-TEST-002 — SHOULD IMPROVE**

---

# 34. The architecture should move toward one registration manifest

Not necessarily one giant file.

But conceptually, each block version should own one cohesive contract:

```text
Objective O3

identity
label
default payload
payload schema
prompt / prompt rules
preview normalization
storage canonicalization
editor hydration
renderer registration
supported source formats
```

The exact code can remain modular.

What matters is one ownership contract.

Today those pieces are distributed, and tests glue them together after the fact.

---

# 35. A pragmatic target architecture

I would evolve the existing design toward something conceptually like:

```ts
BlockVersionContract {
    type
    version
    label

    getDefaultPayload()

    validateAuthorPayload()
    normalizePreview()
    prepareForStorage()
    hydrateForEditor()

    getAiPrompt?()
    parseMarkdown?()

    rendererKey
}
```

I am **not recommending implementing this exact interface verbatim yet**.

The important principle is:

> one version should have one authoritative lifecycle owner.

We should extend the existing `BlockVersionDefinition` / registry system rather than create an additional parallel architecture.

---

# 36. OCP assessment

We can now grade this precisely.

### Open/Closed — versions

```text
Add D2/C2/O3
```

**Mostly compliant.**

### Open/Closed — new family

```text
Add diagram block family
```

**Not yet compliant.**

Would require changes in:

```text
@quiz/types TutorialPageContentType
documentTransformation switch
possibly title extraction
default-version map
renderer registration
lifecycle definition
registry
```

So:

**SHC-OCP overall = Partially Implemented**

---

# 37. ISP assessment

`BlockVersionRegistryEntry` is relatively small:

```text
identity
display metadata
default payload
optional prompt
optional authoring rules
```

and lifecycle definition is separate.

That's reasonably interface-segregated.

We are not forcing every version to implement Markdown or AI prompts.

### Status

**SHC-ISP — Good in this vertical**

---

# 38. LSP assessment

This vertical gives us more evidence than earlier phases.

Every registered version is expected to behave as a substitutable:

```text
BlockVersion
```

for selector/preview/save/render operations.

However, because generated versions may only provide identity lifecycle handling while static versions have strict converters, substitutability is incomplete in terms of validation guarantees.

So:

**LSP — partial**

Every block may participate operationally, but not all provide equivalent contract-strength guarantees.

---

# 39. DRY assessment

Good DRY:

```text
shared AI prompt metadata
registry selector
source parser
generated-placement files
```

Weak DRY:

```text
block identity repeated across registry/lifecycle/renderer/types
multiple schema-like payload examples
O1 duplicate ownership
```

So:

**DRY — partially implemented, trending positively.**

---

# 40. Most important remediation priorities for block architecture

When we reach implementation, I would order this vertical roughly:

1. **Prevent duplicate `(type,version)` ownership.**
2. Remove/deal with generated duplicate Objective O1.
3. Add uniqueness enforcement tests.
4. Separate authoring defaults from strict persistence validation.
5. Stop D1/I1 storage normalization from injecting example educational content.
6. Establish generated-version payload validation.
7. Make unknown explicit version requests fail rather than silently falling back.
8. Move editor hydration/title logic toward lifecycle definitions.
9. Derive default versions from registration instead of central maps.
10. Generalize lifecycle round-trip tests.
11. Only after that, consider true new-family plugin extensibility.

The critical items are **1–6**.

Items 7–10 improve architectural integrity.

Item 11 can be deferred under YAGNI unless Project LLM genuinely needs to introduce completely new families soon.

That last point matters: we should **not build a universal plugin framework just because SOLID says OCP**. If the current real requirement is adding versions within existing families, the architecture is already close to sufficient.

## Tutorial block vertical checkpoint

This sub-phase reveals something positive about the overall project:

The codebase already contains several examples of thoughtful architecture:

```text
registry-driven extensibility
version-owned AI prompts
version-owned Markdown parsing
strict C1 legacy→canonical conversion
renderer/lifecycle contract tests
pure document transformation modules
shared global prompt rules
```

So our job as Principal Architect is not to replace these systems.

It is to **finish the direction they already started**, eliminate contradictory ownership, and make the strictest contract behavior consistent across every block version.

The remaining Tutorial Composer review should now move through the **renderer/preview/editor integration and AI suggestion/analysis routes**, including the `presentation-ideas`, `block-suggestions`, `analysis`, `import`, and `suggestions/apply` flows. That will close the broader Tutorial Authoring baseline before we move on to the large Project LLM UI vertical.

Yes. I continued through the **Tutorial Composer AI/action routes and their underlying `@quiz/db-tutorial` services**. This tranche is now deep enough to close the main Tutorial Authoring architecture baseline.

The result is mixed but overall stronger than the taxonomy area: the suggestion-application flow has some of the best trust-boundary design in the repo, while the analysis/suggestion services still carry legacy-shape `any` usage, duplicated auth/HTTP patterns, and a few unsafe default-content transformations.

## Tutorial Authoring AI/action verdict

| Area | Status | Principal assessment |
|---|---|---|
| Content analysis | 🟢/🟡 | Pure/deterministic, but legacy `any` access |
| Block suggestions | 🟢/🟡 | Pure/deterministic, server-side, some type erosion |
| Presentation ideas | 🟢/🟡 | Server-authoritative recommendations |
| Raw-content import | 🟢 Strong | Parser abstraction + canonical schema validation |
| Suggestion verification | 🟢 Strong | Server regenerates and fingerprints |
| Suggestion application | 🟢 Strong | Optimistic concurrency + final schema validation |
| Suggestion transformation | 🟡/🔴 | Canonical intent is good, but several transforms fabricate content |
| Append-block endpoint | 🟡 | Weak request schema before downstream validation |
| Concurrency model | 🟢 Strong for suggestion application | Atomic version condition |
| HTTP idempotency | 🟡 Explicitly not implemented | Acceptable MVP if documented |
| Route auth boilerplate | 🔴 DRY issue | Guard + authentication repeated |
| Error/observability | 🟡/🔴 | Console logging and some internal errors |
| Cross-route contract consistency | 🟡 | Different validation strength by endpoint |

### 1. Suggestion application is one of the strongest security boundaries in the project

The client is allowed to send only:

```text
sectionId
suggestionId
suggestionFingerprint
expectedVersion
```

Critically, it does **not** send authoritative suggested content.

The server does:

```text
load current section
        ↓
verify version
        ↓
regenerate analysis
        ↓
regenerate suggestions from CURRENT document
        ↓
locate suggestion
        ↓
recompute SHA-256 fingerprint
        ↓
verify client reference
        ↓
transform server suggestion
        ↓
TutorialDocumentSchema.parse()
        ↓
UPDATE ... WHERE version = expectedVersion
```

This is excellent trust-boundary design.

### Classification

**SHC-SUGGESTION-SEC-001 — Implemented strongly**

This is exactly the principle:

> client can request an operation, but server owns the authoritative content and mutation.

---

# 2. Fingerprinting is correctly based on semantic fields

`suggestion-fingerprint.service.ts` excludes transient values such as:

```text
session-generated ID
UI title
preview
confidence
timestamps
status
```

and fingerprints stable semantic fields:

```text
kind
blockType
sourceBlockIds
sourceText
reason
suggestedContent
```

using canonical key ordering and SHA-256.

Good.

This avoids false fingerprint changes due to:

```text
object property insertion order
runtime timestamp
temporary suggestion ID
```

### Classification

**SHC-SUGGESTION-IDENTITY-001 — Implemented**

---

# 3. Optimistic concurrency is real, not just documented

The repository mutation uses:

```text
WHERE
  id = tutorialId
  AND version = expectedVersion
  AND deletedAt IS NULL
```

and atomically increments:

```text
version = version + 1
```

If no row updates, application service treats it as a conflict.

This is the correct database-level protection against:

```text
verify version 5
another admin saves version 6
original request tries to write version 5
```

The second write does not overwrite silently.

### Classification

**SHC-COMPOSER-CONCURRENCY-003 — Implemented strongly**

This is notably stronger than the ordinary Composer save path we reviewed earlier.

---

# 4. This confirms the normal save path should eventually adopt the same concurrency model

Earlier we identified that `tutorialSaveService` PATCHes content without sending a version precondition.

Now we know the repository **already supports**:

```text
updateTutorialContentWithVersion()
```

So the infrastructure required for safe optimistic locking already exists.

That means we do not need to invent a new concurrency architecture.

We should reuse the pattern from suggestion application.

### Recommended eventual target

```text
ordinary editor save:
loadedVersion
    ↓
PATCH { content, expectedVersion }
    ↓
updateTutorialContentWithVersion()
```

### Finding

**SHC-COMPOSER-CONCURRENCY-002 remains HIGH**, but remediation is straightforward because the mechanism already exists.

---

# 5. The suggestion flow is not traditionally HTTP-idempotent, and the code documents that honestly

The route explains:

```text
first request version 5 → succeeds → version 6

same retry version 5
→ 409 VERSION_CONFLICT
```

rather than returning the original 200 response.

That means:

```text
mutation safety = yes
HTTP response replay idempotency = no
```

This is acceptable for an MVP if the client handles 409 correctly.

### Classification

**Acceptable implementation variation / documented limitation**

No need to build an idempotency-key table immediately unless retries become operationally important.

YAGNI applies.

---

# 6. There is a minor defect in conflict details after the final TOCTOU race

When the repository update fails after verification, application service throws:

```ts
new VersionConflictError(
    input.expectedVersion,
    -1
)
```

because it does not re-read the actual current version.

So the route can return:

```text
currentVersion: -1
```

for a real concurrent-write race.

Yet its own comments tell clients to inspect:

```text
details.currentVersion
```

to distinguish retry scenarios.

Those two behaviors conflict.

### Finding

**SHC-SUGGESTION-CONCURRENCY-001 — MEDIUM**

After the failed conditional UPDATE, either:

```text
re-read current version
```

or define `currentVersion` as nullable/unknown.

`-1` is not an actual version.

---

# 7. Route-level error mapping parses version information from an error message string

Current logic roughly does:

```ts
error.message.match(
  /expected (\d+), got (\d+)/
)
```

to recover:

```text
expectedVersion
currentVersion
```

That is brittle.

Domain errors should carry structured fields:

```ts
class VersionConflictError {
   expectedVersion
   currentVersion
}
```

not require parsing human-readable text.

### Finding

**SHC-ERROR-CONTRACT-002 — MEDIUM/HIGH**

This is a clean example of explicit contracts being preferable to string interpretation.

---

# 8. Content analysis is properly pure and deterministic

`ContentAnalysisService` performs:

```text
statistics
outline extraction
quality heuristics
element detection
suggestions
confidence
```

without DB writes or external services.

That's good separation.

It also clearly documents that confidence values are:

> heuristic structural scores, not calibrated probabilities.

Excellent terminology discipline.

### Classification

**SHC-ANALYSIS-SRP-001 — Implemented**

**SHC-AI-SEMANTICS-001 — Good documentation**

---

# 9. But `ContentAnalysisService` is heavily dependent on legacy/dual block shapes

There are many patterns like:

```ts
const heading = block as any;

heading.content?.text || heading.text

content?.level ?? block.level
```

and recursive extraction through loosely typed objects.

This indicates the analysis service supports both:

```text
canonical block model
legacy flattened block model
```

inside the same algorithm.

That's understandable during migration, but it weakens type safety.

### Target

Have one canonical normalization boundary:

```text
legacy TutorialDocument
        ↓
normalize/migrate
        ↓
canonical TutorialDocument
        ↓
analysis service
```

rather than making every analysis branch bilingual.

### Finding

**SHC-COMPOSER-TYPE-002 — MEDIUM/HIGH**

---

# 10. The quality score is heuristic, not pedagogically authoritative

The service grades things such as:

```text
average word length
number of headings
word count
number of examples
number of code blocks
number of visuals
```

This is fine as a **structural recommendation heuristic**.

It should not be presented as:

```text
true learning quality
instructional effectiveness
factual correctness
```

because the source code does not support those conclusions.

The comments are already careful about this.

We should ensure UI wording remains equally careful.

---

# 11. Block suggestions are also deterministic, which is good

The service generates suggestions based on document structure and analysis rather than trusting client-provided recommendations.

That is a sound design.

The application path later regenerates them again server-side before applying.

This gives:

```text
client preview suggestion
    ≠ authority

server regenerated suggestion
    = authority
```

Excellent.

---

# 12. Block Suggestions route unnecessarily casts validated document to `any`

After:

```text
BlockSuggestionsRequestSchema.safeParse()
```

the route does:

```ts
document as any
```

when calling the service.

Same in Presentation Ideas.

If the schema's output type does not satisfy the service signature, that indicates a contract mismatch between:

```text
@quiz/types request DTO
and
@quiz/db-tutorial service input
```

The solution should be aligning those types, not suppressing TypeScript.

### Finding

**SHC-TYPE-005 — MEDIUM**

---

# 13. Analysis route can leak internal exception messages in 500 responses

Its catch returns:

```text
Analysis failed: <error.message>
```

to the client.

That is inconsistent with safer routes that return:

```text
An unexpected error occurred...
```

For a deterministic analysis engine the risk may be modest, but unknown errors can still reveal implementation detail.

### Finding

**SHC-ERROR-003 — MEDIUM**

Known domain validation errors should be explicit; unknown infrastructure/programming errors should be generic.

---

# 14. Analysis authorization makes `subtopicId` optional

The request can analyze a document with no subtopic:

```text
subtopicId optional
```

and only checks subtopic authorization when supplied.

That's likely fine because the operation is pure and the document itself comes from the authenticated admin request.

However, it means this route authorizes:

```text
admin edit permission
brand
```

rather than ownership of an existing persisted section.

That is acceptable for unsaved drafts.

### Classification

**Acceptable behavior**, assuming admins are allowed to analyze drafts before selecting a persisted resource.

---

# 15. Import architecture is strong

`TutorialImportService` cleanly abstracts parsers through:

```text
IRawContentParser
```

with implementations for:

```text
Markdown
HTML
Plain text
```

and special URL ingestion through:

```text
safeUrlFetcher
```

Then it performs:

```text
parse raw content
        ↓
canonical TutorialDocument
        ↓
TutorialDocumentSchema
        ↓
section palette validation
        ↓
structural statistics
```

This is very good SoC.

### Classification

**SHC-IMPORT-DIP-001 — Implemented**

**SHC-IMPORT-CONTRACT-001 — Implemented**

---

# 16. URL import already uses a dedicated safe fetcher

This is another positive security separation.

The import service does not directly use arbitrary fetch logic itself; it delegates to:

```text
safeUrlFetcher.safeFetch()
```

There are tests for that service in the package.

We should review its SSRF rules under the security gate, but architecturally the boundary is correct.

---

# 17. One type assertion remains in section validation

Import does:

```ts
validateDocumentForSection(
  document,
  sectionType as any
)
```

Again, this suggests an enum/type mismatch between request schema and section-validation contract.

### Finding

**SHC-IMPORT-TYPE-001 — MEDIUM**

Better to align the source types than suppress them.

---

# 18. Suggestion transformation does not trust client content — excellent

`BlockTransformationService` accepts only a `BlockSuggestion` produced by server verification.

It validates:

```text
suggestion.kind === suggested
```

then uses explicit transformation rules.

This is a strong security boundary.

---

# 19. But some transformations invent educational content

This is the most important problem in this tranche.

### Diagram

A process suggestion becomes:

```text
graph LR
  A[Start] --> B[Process]
  B --> C[End]
```

with:

```text
caption: Process Flow
```

This is a placeholder diagram.

If persisted automatically, it is not derived faithfully from the source content.

### Definition

The transformation creates:

```text
category: Generated Definition
```

and worse:

```text
example:
  language: javascript
  code: // Example code here
```

regardless of the tutorial's language/topic.

This is authoritative learner content being fabricated.

### Finding

**SHC-SUGGESTION-DATA-001 — HIGH**

The transformation engine should never insert placeholder learning material into a published tutorial.

---

# 20. Transformation must distinguish layout conversion from content generation

Some suggestion transformations are legitimately deterministic:

```text
two headings
→ two-column layout
```

or:

```text
comparison paragraph
→ comparison structure
```

because the source content is being reorganized.

Other transformations require **new semantic content**:

```text
diagram
definition example
summary synthesis
```

These should not be treated identically.

### Better taxonomy

```text
STRUCTURAL TRANSFORMATION
→ deterministic, can auto-apply safely

CONTENT GENERATION
→ requires derived/generative content
→ preview/review or AI generation pipeline
```

### Finding

**SHC-SUGGESTION-BOUNDARY-001 — HIGH**

This is a core domain-design distinction.

---

# 21. Summary generation is deterministic extraction, but still synthesizes

`transformSummary()` generates summary points from the document and inserts a new block.

That may be acceptable if the extraction is strictly source-derived.

We need to verify `extractKeyPoints()` before calling it safe enough for automatic application.

For now:

**Medium review item**, not a confirmed violation.

---

# 22. Random UUID generation in the server transformation is appropriate

The service uses:

```ts
crypto.randomUUID()
```

for newly created persisted block IDs.

That's good.

Unlike the taxonomy UI fallback IDs, this is authoritative server-side creation of a genuinely new resource.

No issue.

---

# 23. `AppendBlockRequestSchema` is too weak

The append-block route validates only:

```text
id: non-empty string
type: non-empty string
version: non-empty string
content: unknown
presentation: unknown optional
```

then casts:

```ts
block as TutorialBlock
```

before passing to the service.

The downstream service may validate the full resulting document, which provides some protection.

But the HTTP boundary should ideally parse:

```text
TutorialBlockSchema
```

directly.

### Finding

**SHC-COMPOSER-CONTRACT-003 — HIGH**

This is especially important because block type/version/content relationships are discriminated contracts.

---

# 24. Final document validation partly saves the append path

`tutorialComposerService.appendBlockToTutorial()` likely validates the resulting document; earlier service behavior indicates strong document validation.

So this is not the same as blindly writing arbitrary JSON to DB.

Still, boundary validation should be explicit.

Defense-in-depth.

---

# 25. Analysis → Suggestions → Presentation Ideas is unnecessarily client-chained

Current workflow requires:

```text
client calls analysis
    ↓
client sends analysis back to block-suggestions
    ↓
client sends analysis + blockSuggestions back to presentation-ideas
```

The server then trusts schema-valid analysis/suggestion structures from the client for **recommendation generation**.

This is not a direct mutation security issue because application later regenerates suggestions server-side.

But architecturally it creates unnecessary coupling and payload size.

### Alternative

A higher-level server operation could accept only:

```text
document + context
```

and internally do:

```text
analyze
→ suggest
→ presentation ideas
```

when all three are needed.

Or preserve separate endpoints for UI interactivity, but don't require clients to resubmit derived intermediate results.

### Finding

**SHC-COMPOSER-PIPELINE-001 — MEDIUM**

KISS may favor keeping separate endpoints for now, but the current chaining deserves consideration.

---

# 26. Presentation ideas are explicitly non-authoritative

The route comment correctly states:

> Server generates recommendations; client never provides authoritative ideas.

Good.

But the workflow comment mentions selected ideas being stored in:

```text
sessionStorage
```

for a later page.

That is fine for temporary UI selection **only if later mutation endpoints revalidate/regenerate authoritative operations**, similar to suggestion application.

If a later route trusts sessionStorage content directly, that would be a problem.

We'll inspect that if/when the corresponding UI is in this app.

---

# 27. Route auth duplication remains widespread

All of these routes again do:

```text
requireAdminRequest()
authenticateRequest()
requireTutorialEditPermission()
requireSubtopicAccess()
requireBrandAccess()
```

with varying response wrappers.

The security intent is good.

The repetition is not.

This reinforces the earlier target:

```text
requireAdminContext(request, options)
```

returning:

```text
verified user
permissions
brand/subtopic context
origin already checked
```

while retaining explicit resource authorization.

### Finding

**SHC-DRY-AUTH-001 — strongly confirmed**

---

# 28. Error response formats differ across neighboring routes

Examples include:

```text
{ error: { code, message } }
```

versus:

```text
createErrorResponse(...)
```

versus:

```text
createAuthErrorResponse(...)
```

and status differences like:

```text
400 vs 422
```

for validation.

This makes client behavior harder to standardize.

### Finding

**SHC-API-ERROR-001 — MEDIUM/HIGH**

We need one error envelope and consistent semantics.

---

# 29. `VersionConflictError` is the right domain concept

Despite the string-parsing issue in the HTTP adapter, using a dedicated domain error is correct.

This should be extended so the error itself carries structured metadata.

Same idea applies to:

```text
SectionNotFoundError
SuggestionNotFoundError
SuggestionFingerprintMismatchError
InvalidTransformationError
TutorialDocumentValidationError
```

This is good domain modeling.

---

# 30. Repository boundary is well established in `db-tutorial`

`SuggestionApplicationService` depends on:

```text
TutorialSectionRepository
SuggestionVerificationService
BlockTransformationService
```

rather than direct SQL.

This is a strong example of application-service orchestration.

Compare that with Sidebar's giant route.

The difference is exactly what our architecture review is trying to normalize.

---

# 31. Repository itself still contains excessive console diagnostics

`TutorialSectionRepository.createTutorial()` logs:

```text
diagnostic IDs
input metadata
INSERT lifecycle
DB error code
detail
constraint
table
column
stack
```

This is similar to the Sidebar logging problem.

Repository-level database operations should use structured observability, not `console.log()` diagnostic sessions in production code.

### Finding

**SHC-OBS-002 — HIGH**

---

# 32. The repository contains many `as any` casts

Examples include:

```text
brandId as any
content as any
updateData: any
```

Some are due to Drizzle/jsonb enum impedance.

But this is enough repetition that we should tighten repository DTO/schema typing where practical.

### Finding

**SHC-TYPE-006 — MEDIUM**

Not an immediate refactor blocker, but part of Gate 1B/1H.

---

# 33. Brand fallback query may be nondeterministic

`getTutorialByPageIdentity()` queries:

```text
brandId = requested brand
OR
brandId = shared
```

then:

```text
.limit(1)
```

without an explicit ordering preferring exact-brand match over shared.

The comment says:

> Prioritizes exact brand match, falls back to shared.

But the SQL shown does not establish that priority.

Without deterministic ordering, DB may return either matching row.

### Finding

**SHC-BRAND-RESOLUTION-001 — HIGH**

This is important because it can violate brand-specific override semantics.

The query needs explicit precedence, conceptually:

```text
exact brand first
shared second
```

---

# 34. This is a concrete example where comments overstate implementation

The repository comments claim exact-brand priority.

The actual query only expresses:

```text
brand OR shared
```

with no ordering.

We should not rely on the comment.

This is exactly why the line-by-line review is valuable.

---

# 35. `getPagesBySubtopic()` does not appear to include shared fallback

`getTutorialByPageIdentity()` allows shared fallback.

But:

```text
getPagesBySubtopic()
```

filters:

```text
brandId = requested brand
```

only.

Depending on intended delivery behavior, that may make collection and single-item brand resolution inconsistent.

### Finding

**SHC-BRAND-RESOLUTION-002 — MEDIUM/HIGH**

Needs explicit brand-resolution policy.

---

# 36. Current Tutorial Authoring baseline can now be considered substantially complete

We have now reviewed the connected architecture across:

```text
Sidebar authoring
Sidebar validation
Sidebar identity
Sidebar persistence
cross-DB hierarchy synchronization

Composer hierarchy selection
document hydration
block editing
save/publish

block registries
block version lifecycle
prompts
normalizers
converters

analysis
block suggestions
presentation ideas
raw import

suggestion fingerprinting
server regeneration
transformation
optimistic concurrency
repository mutation
```

So I can now give the vertical-level judgment:

### Tutorial Composer
**Substantially implemented, with targeted architectural remediation required**

### Tutorial Sidebar
**Partially implemented, with major route/service-boundary remediation required**

### Tutorial Block Registry
**Partially implemented, strong OCP direction but incomplete ownership/validation**

### Tutorial AI/Suggestion Pipeline
**Substantially implemented from a trust-boundary perspective, but transformation/data-truth fixes required**

---

## Highest priority Tutorial findings now

The most significant items are:

1. **Extract Sidebar route orchestration into services/repositories.**
2. Remove direct cross-DB work from Sidebar HTTP routes.
3. Add optimistic concurrency to ordinary Composer saves.
4. Fix exact-brand vs shared resolution deterministically.
5. Prevent automatic suggestion transforms from persisting placeholder educational content.
6. Distinguish structural transformations from semantic content generation.
7. Prevent duplicate block-version ownership.
8. Separate editor defaults from persistence validation.
9. Make generated block versions schema-validated.
10. Replace weak append-block schema with canonical block validation.
11. Unify repeated admin/auth context handling.
12. Normalize error envelopes.
13. Replace raw console/DB diagnostics with structured safe observability.
14. Remove stale/legacy `any` paths where canonical migration boundaries already exist.

The major positive architectural references we should preserve are:

```text
Tutorial Composer focused hooks
C1 canonical converter
TutorialImportService
SuggestionVerificationService
SuggestionApplicationService
optimistic repository update
fingerprint service
registration contract tests
```

These are good patterns already inside the repository.

At this point, the **Tutorial Authoring vertical is sufficiently baselined**. The next major `skillhubcore-admin` review phase should move to the **Project LLM UI/application vertical**, starting with the very large `integration-certification`, `external-ai-handoff`, `candidate-upload`, `create`, `workflow-details`, and the central `projectLlmClient`/workflow hooks. That is where the largest remaining frontend SRP/orchestration risk sits.


Yes. I continued through the **Project LLM workflow/application vertical**, including the large certification page, candidate upload, external-AI handoff, create-workflow page, workflow details, shared context/hooks, `projectLlmClient`, and then traced the browser state-transition behavior into the Python Project AI workflow-governance backend.

This tranche uncovered one of the most important governance issues in the entire `skillhubcore-admin` review so far.

## Project LLM checkpoint

| Area | Status | Assessment |
|---|---|---|
| Backend canonical state machine | 🟢 Strong foundation | Explicit states and documented human gates |
| Placement/final certification | 🟢/🟡 | Strong backend evidence enforcement |
| Integration Certification UI | 🔴 SRP hotspot | ~131 KB, too much orchestration + presentation |
| Candidate Upload | 🟡 | Backend-driven gates, but some UI truth problems |
| External AI Handoff | 🟡 | Backend contract used, but large local contract/prompt duplication |
| Create Workflow | 🔴 | Hard-coded block/version registry |
| Workflow Details | 🔴 **Severe truth problem** | Static/fabricated audit evidence beside live state |
| ProjectLlmContext | 🟡 | Correctly avoids restoring success states, but static defaults remain |
| `projectLlmClient` | 🔴 | Transport + workflow orchestration mixed |
| Human Gate 1 | 🔴 **Governance violation** | Automatically transitioned by browser |
| Transition API audit identity | 🔴 **Security/governance weakness** | `triggered_by` accepted from request |
| Repository intelligence fallback | 🔴 for certification use | Static fallback must never count as evidence |

---

# 1. The canonical backend says the frontend must not own the workflow state machine

This is especially significant because the backend file itself explicitly says:

```text
CanonicalWorkflowState is the ONLY workflow state machine
Frontend must consume these states
Frontend must NOT create another state machine
```

It also explicitly defines:

```text
AWAITING_GATE_1
→ GUI prototype approval pending
→ HUMAN_GATE_1
```

and:

```text
GUI_APPROVED
→ Gate 1 passed
```

That is an excellent architectural rule.

Unfortunately the browser client currently violates it.

---

# 2. `ensureCandidateRequested()` automatically passes Human Gate 1

`projectLlmClient.ts` currently performs:

```text
REQUESTED
    ↓
DISCOVERY
    ↓
BRIEF_READY
    ↓
AWAITING_GATE_1
    ↓
GUI_APPROVED
    ↓
CANDIDATE_REQUESTED
```

automatically.

The critical line is conceptually:

```ts
if (currentState === 'AWAITING_GATE_1') {
    await transitionWorkflow(
        workflowId,
        'GUI_APPROVED',
        'Prototype GUI approved by admin'
    );
}
```

No dedicated human approval action occurs there.

And this helper is called automatically by:

```text
External AI Handoff → Continue to Upload
```

and again by:

```text
Candidate upload
```

Therefore navigating to candidate upload can effectively mean:

> Human Gate 1 approved.

That contradicts the canonical state-machine specification.

### Classification

**SHC-PLLM-GOV-001 — CRITICAL/HIGH**

This is not merely a frontend SRP problem.

It is a **workflow-governance violation**.

---

# 3. Human Gate 1 needs a dedicated approval command

The desired flow should be:

```text
BRIEF_READY
    ↓ automatic
AWAITING_GATE_1

        STOP

Human explicitly reviews GUI/prototype
        ↓

POST /approve-gate-1
    ↓
server derives approver identity
server records approval evidence
    ↓
GUI_APPROVED
    ↓ automatic or explicit
CANDIDATE_REQUESTED
```

Not:

```text
Continue button
→ auto-transition through Gate 1
```

This should be one of our highest-priority Project LLM remediations.

---

# 4. Backend transition endpoint permits the problem

I traced this into:

```text
services/project-ai/app/api/routes/workflows.py
```

The general transition endpoint requires:

```python
user = Depends(get_current_user)
```

but then invokes:

```python
governance_service.transition_state(
    workflow_id=...,
    to_state=...,
    triggered_by=request.triggered_by,
    evidence_id=request.evidence_id,
    reason=request.reason
)
```

Notice what isn't passed:

```text
authenticated user's authoritative identity
```

Instead:

```text
triggered_by
```

comes from the request body.

Then `WorkflowGovernanceService.transition_state()` only has special authorization logic for:

```text
IMPLEMENTING
```

not for:

```text
GUI_APPROVED
```

So a legal state-machine transition to `GUI_APPROVED` does not itself enforce Human Gate 1 evidence.

### Classification

**SHC-PLLM-GOV-002 — HIGH**

The canonical state machine documents a human gate that the generic transition mechanism does not enforce.

---

# 5. `triggered_by` is client-controlled audit metadata

The TypeScript client sends:

```ts
triggered_by: 'admin-ui'
```

But another caller could potentially send:

```text
"CEO"
"security-admin@example.com"
"system"
"approved-by-board"
```

depending on exposed authentication boundaries.

Even if the endpoint is restricted to authenticated admins through the BFF, the audit actor should never be supplied by the caller as authoritative identity.

The server should derive:

```text
actorUserId
actorEmail
actorRole
```

from:

```text
AuthenticatedPrincipal
```

and optionally record a separate non-authoritative field such as:

```text
source = "admin-ui"
```

### Classification

**SHC-AUDIT-IDENTITY-001 — HIGH**

The architecture principle here is simple:

> authentication identity owns audit attribution.

---

# 6. The backend gets much stricter for later gates

This is worth emphasizing because we should preserve it.

For final certification, the backend requires:

```text
contract-admin authorization
correct workflow state
placement evidence
non-empty git diff
candidate/manifest hash binding
qualification gate PASS
Composer gate PASS
cryptographic evidence hash
screenshot evidence
accessibility result
responsive verification
```

That is substantially stronger.

So we have an asymmetry:

```text
Gate 1
→ effectively generic transition

Gate 2 / implementation
→ approval/binding checks

Final Gate
→ extensive evidence enforcement
```

Gate 1 is the weak link.

---

# 7. Integration Certification page is far too large

`integration-certification/page.tsx` is around:

**131 KB**

and more than two thousand lines.

But size alone isn't the problem.

It owns all of these responsibilities:

```text
workflow identity resolution

certification fetch

candidate identity resolution

placement manifest fetch

next-version calculation

candidate qualification

manifest generation

placement approval

placement execution

Composer verification

learner verification

final certification approval

workflow supersession

replacement workflow creation

runtime telemetry interpretation

browser verification interpretation

WCAG result interpretation

responsive viewport result interpretation

screenshot hash display

seven-stage progress calculation

elapsed timers

ARIA live announcements

five-tab UI rendering

certification checklist rendering

navigation
```

That is clearly too many reasons to change.

### Classification

**SHC-PLLM-SRP-001 — HIGH**

---

# 8. But the page is mostly orchestrating backend commands, not making authoritative decisions

This is an important distinction.

Dangerous operations such as:

```text
qualification
placement planning
placement execution
Composer verification
learner verification
final certification
```

are sent to backend endpoints.

The page isn't itself editing repository files.

That's good.

So the solution is **decomposition**, not architectural replacement.

---

# 9. Suggested certification decomposition remains simple

Something like:

```text
integration-certification/
    page.tsx

    hooks/
        useCertificationState.ts
        usePlacementActions.ts
        useVerificationActions.ts
        useCertificationActions.ts

    components/
        CertificationPipeline.tsx
        QualificationPanel.tsx
        PlacementPanel.tsx
        ComposerVerificationPanel.tsx
        LearnerRuntimePanel.tsx
        FinalCertificationPanel.tsx
```

The page becomes:

```text
workflow ID
   ↓
hooks
   ↓
presentational panels
```

while `projectLlmClient` remains transport.

No class hierarchy is needed.

---

# 10. There are seven stages, but UI text says “6-stage”

The certification page constructs:

```text
6.1
6.2
6.3
6.4
6.5
6.6
6.7
```

which is **seven sub-stages**.

Yet the interface repeatedly calls it:

```text
6-stage pipeline
all 6 stages
```

and even uses a six-column grid.

This is a concrete consistency error.

### Classification

**SHC-PLLM-UX-001 — MEDIUM**

Not dangerous, but governance interfaces should have precise terminology.

---

# 11. Certification progress derives some PASS states from overall workflow state

For example:

```ts
isQualified =
  qualificationGate PASS
  OR
  wfState in [
    QUALIFIED,
    INTEGRATION_PLANNED,
    ...
    CERTIFIED
  ]
```

There are similar derived values for:

```text
Gate 2 approval
placement executed
Composer verified
```

This is reasonable as UI recovery only if the canonical state machine guarantees those prior events.

But certification UI should preferentially display explicit gate evidence rather than infer evidence merely because the workflow reached a later state.

### Recommended distinction

```text
workflow state proves phase progression
```

versus:

```text
gate record proves evidence
```

For a certification interface, evidence records should win.

### Finding

**SHC-PLLM-EVIDENCE-001 — MEDIUM/HIGH**

---

# 12. `workflow-details/page.tsx` has a much more serious evidence problem

This page fetches real:

```ts
projectLlmClient.getWorkflowState(workflowId)
```

Good.

But most of the purported audit detail is not derived from it.

It hardcodes:

```text
timelineEvents
agents
evidenceNodes
logs
```

Examples include claims such as:

```text
11 of 11 quality gates verified
zero regressions
100% test coverage
runtime container 200 OK
Playwright Visual Baseline VALID
```

and hard-coded SHA-looking values such as:

```text
sha256:e3b0c44298fc
sha256:8b1a9953c461
...
```

It also displays agent/model names and timings such as:

```text
Claude 3.5 Sonnet / Gemini Pro
850ms
210ms
60ms
```

without these coming from the backend workflow.

Yet the page calls itself:

> Immutable audit trail

and:

> Evidence graph

This is unacceptable for a governance console.

### Classification

**SHC-PLLM-AUDIT-TRUTH-001 — CRITICAL/HIGH**

---

# 13. Fabricated audit data must never appear as real evidence

This is different from harmless placeholder data on a dashboard.

An audit page asserting:

```text
PASS
VALID
100% test coverage
cryptographic hashes
execution times
agent identity
```

must use authoritative persisted evidence.

Otherwise an administrator cannot distinguish:

```text
actual verification
```

from:

```text
frontend demonstration content
```

### Required remediation

Either:

1. replace every static object with backend data,

or, until implemented:

2. visibly label the page as prototype/demo and remove all production-looking validation assertions.

I strongly prefer option 1 for this application.

---

# 14. The backend already exposes workflow transition history

The Python API contains:

```text
GET /{workflow_id}/history
```

returning persisted:

```text
from_state
to_state
timestamp
triggered_by
evidence_id
reason
```

Therefore the timeline does not need to be hard-coded.

Likewise gate results and artifact hashes are already available in workflow state.

So this is not a case where infrastructure must first be invented.

---

# 15. Workflow Details should use authoritative sources only

Target structure:

```text
Workflow State
   ↓
state timeline

Transition History
   ↓
audit timeline

Gate Results
   ↓
gate/evidence table

Candidate / Contract / Manifest bindings
   ↓
artifact evidence

Placement result
   ↓
repository change evidence

Composer / Learner verification
   ↓
browser evidence
```

If a backend source is unavailable:

```text
Not recorded
```

is far better than fabricated evidence.

---

# 16. Create Workflow page duplicates the block catalogue

`create/page.tsx` defines a huge static:

```ts
const FAMILIES = [...]
```

containing families and versions including:

```text
Introduction I1–I6
Objective O1–O4
Definition D1–D5
Code C1–C6
Visual V1–V5
...
```

This is not connected to the Composer registry we just reviewed.

And we already know actual Composer registrations currently include a much smaller set plus generated registrations.

Therefore the Project LLM UI can claim:

```text
O4 exists
C6 exists
V5 exists
...
```

without that being authoritative repository truth.

### Classification

**SHC-PLLM-REGISTRY-001 — HIGH**

This violates single ownership.

---

# 17. This static catalogue directly conflicts with Project LLM's purpose

Project LLM is supposed to inspect the repository and determine:

```text
what families exist
what versions exist
what the next version should be
```

Yet its creation screen begins from a hand-maintained static catalogue.

That undermines the tool's own architecture.

### Target

The create page should consume:

```text
live repository intelligence
or
an authoritative backend block-family registry
```

not a local array.

---

# 18. `setFamily()` also calculates the next version too simplistically

Context currently does:

```ts
const nextVer =
  `${familyId}${existingVersions.length + 1}`;
```

That assumes:

```text
number of existing versions
=
highest sequential version number
```

which isn't guaranteed.

For example:

```text
O1
O3
```

would produce:

```text
O3
```

again.

For multi-character family IDs such as:

```text
CP
BP
EX
```

the formatting itself works, but sequence logic remains unsafe.

There is already a backend operation:

```text
getNextVersion(family)
```

which is the proper authority.

### Finding

**SHC-PLLM-VERSION-001 — HIGH**

---

# 19. Create page defaults to an existing version

When a family is selected:

```ts
const defaultTarget =
  f.versions.length > 0
    ? f.versions[0].id
    : `${f.id}1`;
```

So selecting Introduction defaults to:

```text
I1
```

rather than next version such as I7.

The page says:

> create or update

so this might technically be intentional.

But creating a replacement/update has very different governance semantics from creating a new version.

We've already seen placement logic treats `VERSION_IN_USE` specially.

The UI should make the choice explicit:

```text
Create new version
```

versus:

```text
Supersede/update existing version
```

rather than using the same target box ambiguously.

### Finding

**SHC-PLLM-VERSION-002 — MEDIUM/HIGH**

---

# 20. ProjectLlmContext has one very good security property

It persists UI state in:

```text
localStorage
```

but explicitly refuses to restore:

```text
candidateUploaded
validationStarted
validationCompleted
certificationCompleted
```

as successful state.

That is good.

The comment says:

> Browser storage is not the workflow authority.

And the implementation follows that principle.

### Classification

**SHC-PLLM-STATE-001 — GOOD**

This should remain.

---

# 21. But static defaults can still contaminate presentation context

The context defaults to:

```text
Introduction
I7
I1–I6
```

and a detailed purpose statement.

That is okay as initial UI placeholder state.

But some pages fall back to these values when backend data is absent.

For governance pages, fallback presentation data should not be allowed to look authoritative.

The rule should be:

```text
creation screen
→ defaults acceptable

workflow/audit/certification screen
→ backend state required
```

---

# 22. Candidate Upload is much healthier than Workflow Details

`candidate-upload/page.tsx` maps actual backend:

```text
certificationData.gates
```

into UI check rows.

That is good.

It does not manufacture PASS gates.

The client comment explicitly says:

```text
NEVER fabricates PASS status
```

and most of that path respects it.

---

# 23. But candidate package “detected files” can be fabricated

This calculation is problematic:

```ts
uploadedFiles.length > 0
    ? actually compare files
    : hasBoundCandidate
      ? expectedFiles.length
      : 0
```

So if the backend merely reports that a candidate exists, the UI claims all expected files were detected.

That is not necessarily supported by backend evidence.

If a candidate package has only four files, but the page reloads and loses browser `File[]`, the UI can show six expected files.

### Finding

**SHC-PLLM-CANDIDATE-TRUTH-001 — MEDIUM/HIGH**

The backend candidate record should expose its authoritative file manifest.

---

# 24. Client computes candidate hashes—but backend must remain authoritative

`uploadCandidate()` computes SHA-256 in the browser for each file.

That's useful as preflight/integrity metadata.

But the canonical workflow documentation correctly says:

```text
server computes SHA-256
never trust client hashes
```

So client hashes must remain untrusted claims.

We should verify the candidate intake service does recompute them during the backend-specific review, but architecture comments strongly indicate that is the intention.

---

# 25. Candidate ID is generated by the browser

`uploadCandidate()` creates:

```ts
crypto.randomUUID()
```

and sends:

```text
candidateId
uploadedAt
uploadedBy: "admin"
```

Again:

```text
uploadedBy: "admin"
```

must not be authoritative.

And candidate ID ownership would be cleaner on the server unless client-generated identifiers are deliberately part of the protocol.

### Finding

**SHC-PLLM-IDENTITY-001 — MEDIUM/HIGH**

---

# 26. ProjectLlmClient contains application workflow logic, not just transport

The file begins by describing itself as:

> API client

But it contains:

```text
file hashing
ZIP base64 encoding
candidate construction
state-machine progression
409 retry behavior
workflow transition orchestration
gate classification
state-to-certification mapping
runtime-health derivation
browser-verification derivation
```

That exceeds the responsibility of a transport client.

### Classification

**SHC-PLLM-SRP-002 — HIGH**

---

# 27. The most important extraction is the workflow orchestration

Transport functions such as:

```text
GET workflow
POST candidate
POST qualification
POST manifest
```

can stay in the client.

But:

```text
ensureCandidateRequested()
```

absolutely should not remain there.

And ideally the backend should offer intent-level commands such as:

```text
requestCandidateImplementation()
```

that enforce all required gates.

The browser should never have to know:

```text
REQUESTED
→ DISCOVERY
→ BRIEF_READY
→ ...
```

to perform a user operation.

---

# 28. `ensureCandidateRequested()` swallows transition failures

It catches:

```ts
catch (err) {
    console.warn(...)
}
```

and does not rethrow.

So candidate upload can proceed after transition preparation failed.

The candidate endpoint may reject it—good—but the client semantics become unpredictable.

This function is both:

```text
too authoritative
```

and:

```text
not authoritative enough
```

at the same time.

Another reason to remove it.

### Finding

**SHC-PLLM-ERROR-002 — HIGH**

---

# 29. Candidate upload retries 409 by advancing workflow again

Current flow:

```text
ensureCandidateRequested()
    ↓
upload

409?
    ↓
ensureCandidateRequested()
    ↓
retry once
```

A `409` can represent more than:

> workflow isn't ready.

Using generic conflict as a signal to mutate workflow state is risky.

The server should return a typed conflict code if a particular remediation is appropriate.

### Finding

**SHC-PLLM-CONFLICT-001 — HIGH**

---

# 30. `getCertificationStatus()` performs substantial domain interpretation

It turns arbitrary `gate_results` JSON into UI gates by inspecting strings such as:

```text
qualification
test
accessibility
hash
contract
placement
manifest
composer
browser
```

and assigning category/order.

This is application/domain mapping.

Some client adapter mapping is reasonable, but this one is starting to encode workflow meaning.

Prefer the backend return a typed gate structure with:

```text
gateCode
stage
category
status
detail
evidence
```

rather than infer semantics from gate-name substrings.

### Finding

**SHC-PLLM-CONTRACT-001 — MEDIUM/HIGH**

---

# 31. IDs and hashes are conflated in certification response mapping

This line is particularly concerning conceptually:

```text
candidateId =
  artifact candidate ID
  OR
  candidate_sha256
```

Likewise:

```text
manifestId =
  manifest artifact ID
  OR
  manifest_sha256
```

An identifier and a SHA-256 digest are not interchangeable concepts.

Later code uses candidate ID in endpoints such as:

```text
/candidates/{candidateId}/manifest
```

If the artifact ID is absent and a SHA is substituted, behavior depends on undocumented backend tolerance.

### Finding

**SHC-PLLM-CONTRACT-002 — HIGH**

We should model separately:

```text
candidateId
candidateSha256

manifestId
manifestSha256
```

and never substitute one for another.

---

# 32. Error details are still propagated into client messages

As noted earlier, `handleFetchError()` appends backend:

```text
detail
error
message
```

onto client-visible errors.

For 500:

```text
Server error...
: <backend detail>
```

The BFF sanitization provides some protection, but this client should still only surface explicitly safe structured domain errors.

### Existing finding

**SHC-PLLM-ERROR-001 remains Medium/High**

---

# 33. External AI Handoff does one important thing correctly

It refuses to treat a fetched object as canonical unless it contains:

```text
contract_hash
```

Good.

And it requires `engineeringContract` before continuing.

This creates a meaningful backend-generated contract gate.

### Status

**SHC-PLLM-CONTRACT-GATE-001 — GOOD**

---

# 34. But the exported implementation prompt is not solely backend-generated

The page builds a huge implementation prompt in browser code.

It combines backend data with:

```ts
DESIGN_SYSTEM_CONTRACT_MARKDOWN
```

and large hard-coded implementation rules.

Therefore:

```text
backend EngineeringContract hash
```

does not necessarily bind the entire implementation prompt the external AI receives.

Local prompt rules can change independently of the persisted contract hash.

### Finding

**SHC-PLLM-CONTRACT-003 — HIGH**

If the prompt is presented as the canonical hash-bound engineering contract, every authoritative requirement in it must be tied to the backend contract version/hash.

---

# 35. Better architecture for external handoff

The backend should ideally return a complete:

```text
PortableImplementationBrief
```

containing:

```text
workflow ID
contract hash
target identity
requirements
design-system revision
expected files
test contract
integration contract
```

Then the UI may format or download it.

The browser should not independently reconstruct authoritative engineering requirements.

---

# 36. The optional prototype upload box appears presentational

The handoff UI contains:

> Upload Prototype Files (Optional)

with a dropzone-looking element.

From the reviewed code it appears to be visual UI without the candidate-upload mechanics attached.

That can mislead users.

Either wire it or label it clearly as a future capability/remove it under YAGNI.

### Finding

**SHC-PLLM-DEAD-UI-001 — LOW/MEDIUM**

---

# 37. `workflow-details` should become the canonical use case for `useWorkflowState`

There is already:

```ts
useWorkflowState()
```

which cleanly exposes:

```text
state
loading
error
refetch
```

Yet `WorkflowDetailsPage` implements another manual fetch with almost the same logic.

This is a small but concrete DRY issue.

### Finding

**SHC-PLLM-DRY-001 — MEDIUM**

---

# 38. `useRepositoryIntelligence` fallback remains dangerous in governance surfaces

This hook starts with a static repository fixture and falls back to it when live discovery fails.

That's fine for:

```text
reference/exploration UI
```

but not for:

```text
certification
placement
version availability
governance approval
```

Those must fail closed.

### Policy

```text
isLive === false

explorer:
    display with "REFERENCE / STALE" badge

governance:
    disable approval/placement decisions
```

### Existing finding strengthened

**SHC-PLLM-DATA-001 — HIGH**

---

# 39. Current Project LLM architecture should separate four layers

At present several are blended.

Target:

```text
Project LLM Page
        ↓
feature hook/controller
        ↓
Project LLM application commands
        ↓
transport client
        ↓
BFF / Project AI backend
```

For example:

```text
CertificationPage
    ↓
useCertificationWorkflow()
    ↓
approvePlacement()
verifyComposer()
verifyLearner()
approveFinal()
    ↓
ProjectLlmApi
```

The page shouldn't know state-machine transition sequences.

---

# 40. Human gates belong only to explicit backend operations

This should become a hard architecture rule:

```text
No generic state-transition API may satisfy
a HUMAN_GATE_* state transition.
```

Instead:

```text
approveGate1()
approvePlacementGate()
approveFinalCertification()
```

each:

```text
derives authenticated actor
validates required evidence
prevents self-approval where required
records immutable approval
transitions state atomically
```

That is much safer than a generic:

```text
POST /transition
{ to_state, triggered_by, reason }
```

for governance boundaries.

---

# Updated high-priority Project LLM findings

| ID | Finding | Severity |
|---|---|---:|
| SHC-PLLM-GOV-001 | Browser automatically passes Human Gate 1 | **Critical/High** |
| SHC-PLLM-GOV-002 | Generic transition does not enforce Gate 1 approval evidence | **High** |
| SHC-AUDIT-IDENTITY-001 | `triggered_by` is caller-controlled | **High** |
| SHC-PLLM-AUDIT-TRUTH-001 | Workflow Details displays fabricated audit/evidence data | **Critical/High** |
| SHC-PLLM-SRP-001 | Integration Certification ~131 KB orchestration page | **High** |
| SHC-PLLM-SRP-002 | API client owns workflow orchestration | **High** |
| SHC-PLLM-REGISTRY-001 | Create page has hard-coded family/version registry | **High** |
| SHC-PLLM-VERSION-001 | Client computes next version from count | **High** |
| SHC-PLLM-CONTRACT-002 | Candidate/manifest IDs can fall back to hashes | **High** |
| SHC-PLLM-CONTRACT-003 | External-AI prompt requirements aren't fully contract-hash-bound | **High** |
| SHC-PLLM-CONFLICT-001 | 409 causes automatic workflow mutation/retry | **High** |
| SHC-PLLM-DATA-001 | Static repository fallback unsafe for governance decisions | **High** |
| SHC-PLLM-CANDIDATE-TRUTH-001 | Reloaded candidate can imply all expected files exist | Medium/High |
| SHC-PLLM-EVIDENCE-001 | UI infers PASS from workflow progression | Medium/High |
| SHC-PLLM-VERSION-002 | Create/update version semantics ambiguous | Medium/High |
| SHC-PLLM-CONTRACT-001 | Gate categories inferred from names | Medium/High |
| SHC-PLLM-ERROR-001/002 | Error leakage + swallowed workflow transition errors | Medium/High |
| SHC-PLLM-DRY-001 | Existing workflow hook not consistently reused | Medium |
| SHC-PLLM-UX-001 | Seven sub-stages described as six | Medium |

## Principal Architect assessment

The Project LLM backend has a **stronger architecture than parts of its frontend currently respect**.

Good backend concepts already exist:

```text
canonical state machine
optimistic locking
approval repositories
candidate / manifest cryptographic bindings
isolated placement
Composer verification
learner-runtime verification
final fail-closed evidence gate
```

Therefore we should **not redesign Project LLM from scratch**.

The biggest architectural job will be to make the UI obey those backend boundaries:

```text
browser = presentation + explicit user intent

backend = workflow authority
backend = approval authority
backend = audit identity
backend = repository truth
backend = evidence truth
```

The most urgent remediation later will be **Human Gate 1 and fabricated Workflow Details evidence**, before cosmetic decomposition work.

I have now deeply reviewed the five high-risk Project LLM pages and the central client/context/state-machine interaction. The next Project LLM tranche should cover the remaining surfaces—dashboard `page.tsx`, `compliance-brief`, `specification-review`, `explorer`, `registry`, `matrix`, `mix-match`, `CreationBriefPanel`, the stepper/banner components, and the Project LLM creation-brief/reference-corpus modules—so we can close the complete Project LLM UI baseline before moving to ordinary admin pages and Gate 1H enforcement.


Yes. This tranche completes the **remaining Project LLM UI/application review** deeply enough that I now consider the **Project LLM frontend baseline substantially closed**.

I still have **not changed code**. That remains intentional: we now have enough evidence to design the remediation sequence without accidentally fixing one symptom while preserving a deeper governance problem.

## Project LLM overall verdict

The strongest conclusion is that there are really **two different Project LLMs living in the frontend today**:

```text
A. Real governance workflow
   → backend state machine
   → persisted contracts
   → candidate binding
   → placement manifests
   → isolated verification
   → evidence-bound certification

B. Prototype/reference UI
   → hard-coded families
   → hard-coded snapshots
   → hard-coded evidence
   → static compatibility rules
   → local approval booleans
```

Those two modes are mixed together visually.

That is the central architecture problem.

| Surface | Assessment |
|---|---|
| Backend workflow governance | 🟢 Strong foundation |
| Creation brief engine | 🟡 Cohesive but fixture-bound |
| Repository intelligence fixture | 🟡 Legitimate as reference, unsafe as live truth |
| Dashboard | 🔴 Static prototype presented as telemetry |
| Family registry | 🟡 Documentation/reference only |
| Explorer | 🔴 Static statuses presented as verification |
| Matrix | 🔴 Static rules labeled “ENFORCED” |
| Mix & Match | 🔴 Compatibility mostly hard-coded |
| Specification Review | 🔴 Local fake human approval |
| Compliance Brief | 🟡 Uses backend contract but supplements it locally |
| Context banner / stepper | 🟡 Presentation derives state too freely |
| Workflow Details | 🔴 Critical evidence-truth issue |
| Integration Certification | 🔴 Oversized but backend-authoritative for critical actions |
| Human Gate 1 | 🔴 Governance violation |
| Project LLM client | 🔴 Transport + state machine orchestration mixed |

---

# 1. Main Project LLM dashboard is not a live control plane yet

The dashboard presents live-looking telemetry such as:

```text
Repository: SUIA_RTH_SHC
Branch: m2-project-ai-foundation
Commit: 9b7f4c2e3

Snapshot:
SNAP-20261005-001

482 files
Healthy

3 In Progress
2 Awaiting Approval
5 Certified
1 Blocked
```

It also hard-codes recent workflows:

```text
Introduction I7
Objective O5
Code C4
Summary S3
```

with timestamps and statuses.

None of that is loaded from:

```text
projectLlmClient
useWorkflowState
useRepositoryIntelligence
```

in this page.

That means the primary Project LLM dashboard currently looks operational while mostly being a visual prototype.

### Finding

**SHC-PLLM-DASH-001 — HIGH**

For an engineering governance console, fake operational telemetry is unacceptable unless clearly labeled demo data.

---

# 2. Hard-coded branch and commit are especially problematic

The dashboard contains:

```text
Branch:
m2-project-ai-foundation

Commit:
9b7f4c2e3
```

while the branch we are actually reviewing is:

```text
feature/project-llm-linux-worker
```

and current verified HEAD is different.

So this isn't just stale metadata in theory—it is already inconsistent with the actual repository context.

### Finding

**SHC-PLLM-DATA-TRUTH-002 — HIGH**

Repository identity must come from repository intelligence/backend state.

---

# 3. Dashboard copy button copies a fake commit

The button literally copies:

```ts
navigator.clipboard.writeText('9b7f4c2e3')
```

That's worse than merely displaying stale text because it enables an admin to propagate incorrect audit/repository identity elsewhere.

### Classification

**SHC-PLLM-AUDIT-TRUTH-002 — HIGH**

---

# 4. The static corpus itself is not inherently wrong

`projectLlmBlockCorpus.ts` explicitly calls itself:

> Static TypeScript fixture enumerating all 18 educational block families with their documented versions.

That is honest.

It defines a documentation corpus:

```text
18 families
133 documented versions
```

and validates those counts.

That is reasonable if its responsibility is:

```text
canonical documented corpus
```

rather than:

```text
current runtime implementation inventory
```

### Important distinction

This static corpus can remain.

What must change is how UIs describe it.

Correct:

```text
Documented Corpus
18 families / 133 documented variants
```

Incorrect:

```text
Current repository implementations
```

---

# 5. Runtime intelligence is also explicitly a static fixture

`projectLlmRepositoryIntelligence.ts` clearly says:

> Static read-only repository intelligence fixture.

That's good documentation.

It contains verified-looking records such as:

```text
I1
C1
D1
O1
O2
O3
S1
```

with file paths and test references.

Again, this can be useful as:

```text
baseline/reference evidence
```

but must not be silently substituted for:

```text
live repository inspection
```

inside certification decisions.

### Existing finding strengthened

**SHC-PLLM-DATA-001 — HIGH**

---

# 6. Creation Brief Engine is structurally cohesive

`projectLlmCreationBrief.ts` has one clear domain responsibility:

```text
CreationBriefRequest
+
repository/reference intelligence
    ↓
deterministic CreationBrief
```

It owns:

```text
constraints
runtime requirements
external AI workflow
prohibited actions
validation checklist
human gate wording
prompt assembly
```

These belong together conceptually.

So despite the file being ~21 KB, I would **not split it aggressively**.

### Classification

**SHC-PLLM-BRIEF-SRP-001 — GOOD**

This is another example where file size ≠ poor architecture.

---

# 7. But its repository integrity check validates the fixture, not the repository

This function checks:

```ts
families === 18
documentedVersions === 133
primitives === 15
```

and throws if constants change.

That proves:

```text
fixture internal consistency
```

It does **not** prove:

```text
repository live consistency
```

The error wording currently says:

> Repository intelligence integrity compromised.

That's too strong.

A more precise statement would be:

```text
Static corpus fixture integrity mismatch
```

### Finding

**SHC-PLLM-BRIEF-CONTRACT-001 — MEDIUM**

The distinction matters because this module is used to generate governance documentation.

---

# 8. Creation Brief says Phase 1 only supports `GUI_PROTOTYPE`, but output describes portable React candidate

This mismatch is real.

The generator rejects anything except:

```text
targetStage === GUI_PROTOTYPE
```

but the generated prompt says:

```text
Stage: PORTABLE_CANDIDATE_PACKAGE
```

and requires:

```text
React / TypeScript
Vitest
JSON schema
TS schema
block.integration.json
README
```

So the internal request stage and generated artifact stage are semantically inconsistent.

### Finding

**SHC-PLLM-BRIEF-CONTRACT-002 — HIGH**

Either:

```text
GUI_PROTOTYPE
```

means visual prototype,

or:

```text
PORTABLE_CANDIDATE_PACKAGE
```

means React implementation package.

Those must not be conflated.

---

# 9. Creation Brief correctly prohibits external systems

The module explicitly forbids:

```text
repository mutation
deployment
provider APIs
credentials
backend services
database migrations
architecture changes
claims of certification
```

This is excellent external-AI containment.

### Status

**SHC-PLLM-EXT-AI-BOUNDARY-001 — GOOD**

The problem is not these rules.

The problem is ensuring those rules are cryptographically/version-bound to the authoritative backend contract.

---

# 10. `CreationBriefPanel` is a pilot-only UI but isn't obviously labeled as non-authoritative

The component says:

```text
Agent E · Introduction I2 pilot
```

which is useful.

It directly calls:

```ts
generateI2CreationBrief(...)
```

from the static creation-brief engine.

That's fine for an experimental/pilot panel.

But it should never be presented as equivalent to:

```text
backend EngineeringContract
```

or:

```text
current workflow contract
```

### Classification

**Acceptable prototype component if clearly isolated**

No need to delete it.

---

# 11. Explorer combines documentation with invented implementation detail

`explorer/page.tsx` has a static:

```ts
INTRODUCTION_VERSIONS
```

record describing:

```text
pattern
contract
components
accessibility
responsive
renderer
runtimeStatus
```

for I1-I6.

Only some of those correspond to verified runtime implementations.

Others are described as:

```text
DOCUMENTED
CANDIDATE_PILOT
```

which is okay.

But the page additionally derives status using hard-coded special cases:

```text
I1 / C1 / D1 → VERIFIED
I2 → PHASE 1 PILOT
everything else → DOCUMENTED
```

That is a second, independent status system.

### Finding

**SHC-PLLM-STATUS-001 — HIGH**

Status needs one authoritative source.

---

# 12. Explorer's fallback invents architecture descriptions

For any unrecognized version it manufactures text like:

```text
Standard architectural pattern for X
Canonical specification for V
Primary Component
Secondary Pattern
Standard WCAG AA accessibility attributes
Adaptive grid layout
```

That content is not sourced from repository evidence.

For a reference explorer, placeholders could be acceptable if clearly labeled.

But here they appear as real version details.

### Finding

**SHC-PLLM-REFERENCE-001 — MEDIUM/HIGH**

Unknown evidence should display:

```text
No documented implementation detail available
```

not synthetic architecture claims.

---

# 13. Registry page is acceptable only as a corpus browser

`registry/page.tsx` uses:

```text
BLOCK_CORPUS_REGISTRY
```

and allows filtering:

```text
ACTIVE
DOCUMENTED
```

The problem is that:

```ts
hasVerifiedImplementation
```

comes from the static corpus, not live discovery.

If the page title and wording say:

```text
Documented Project LLM Corpus Registry
```

fine.

If it implies:

```text
live implementation registry
```

then it is misleading.

### Classification

**SHC-PLLM-REGISTRY-002 — MEDIUM**

This page likely needs mostly wording/data-source clarification, not a major rewrite.

---

# 14. Matrix page labels static rules as “ENFORCED”

This is more serious.

`matrix/page.tsx` contains manually defined relationship rules like:

```text
CAN COMPOSE
CONDITIONAL
MUST REMAIN DISTINCT
ALTERNATIVE
DERIVED COMPOSITION
```

and displays:

```text
Rule Type: Canonical Contract
ENFORCED
```

But this page contains no backend call or enforcement engine.

Therefore:

```text
documented rule
```

is being presented as:

```text
programmatically enforced rule
```

without evidence in this page.

### Finding

**SHC-PLLM-MATRIX-001 — HIGH**

We need one of:

```text
DOCUMENTED POLICY
```

or actual backend enforcement.

---

# 15. Static architectural rules may still be valuable

The relationship matrix itself is useful domain documentation.

For example:

```text
Introduction may precede Objective
Code remains distinct
Cross-family composition belongs in Tutorial Composer
```

can be legitimate architectural policies.

We should preserve them if they represent approved architecture.

But metadata must distinguish:

```text
policy
```

from:

```text
verified enforcement
```

---

# 16. Mix & Match has the same problem at a higher risk level

The page says:

> Real-time validation against Project LLM architectural guardrails.

But the compatibility checks are mostly:

```ts
valid: true
```

Examples:

```text
Same Family Invariant → true
Contract Compatibility → true
Renderer Compatibility → true
Responsive Model → true
Accessibility WCAG AA → true
Brand Independence → true
```

Only one check actually depends on user selection:

```text
selectedComponents.length >= 2
```

This is not real validation.

### Classification

**SHC-PLLM-MIXMATCH-001 — CRITICAL/HIGH truth violation**

This page should not call those results validated until there is actual analysis behind them.

---

# 17. Mix & Match generates specifications from hard-coded patterns

The `AVAILABLE_PATTERNS` dataset for Introduction includes things such as:

```text
Topic Orientation
Problem Framing
Need & Motivation
Real-World Context
Learning Transition
```

This is useful as a prototype authoring tool.

But then clicking:

```text
Generate Derived Specification
```

only routes to a URL containing:

```text
family
version
sources
```

There is no backend synthesis operation here.

### Finding

**SHC-PLLM-DERIVATION-001 — HIGH**

The UI calls something “generated” that is really navigation into another static page.

---

# 18. Specification Review is currently a pure prototype

This is one of the clearest findings.

It reads:

```text
version
sources
```

from URL query parameters.

Then renders hard-coded educational specification, contract, repository paths and evidence.

It includes:

```text
Snapshot:
#SNAP-7F3A9E
```

and evidence like:

```text
E-102 Registry resolves I7 VERIFIED
E-108 Renderer compiles without error VERIFIED
E-113 All 3 Browsers Pass DOM test READY IN PILOT
```

None of this is fetched from the backend.

### Classification

**SHC-PLLM-SPEC-TRUTH-001 — CRITICAL/HIGH**

---

# 19. Its “Human Gate” is only local React state

The page declares:

```ts
const [approved, setApproved] = useState(false);
```

and:

```ts
onClick={() => setApproved(true)}
```

Then shows:

```text
Approved by Human Reviewer
✓ Specification Approved
```

No backend call.

No immutable approval.

No authenticated reviewer binding.

No evidence.

No state-machine transition.

### This is a serious governance UX issue

The page explicitly labels itself:

```text
GOVERNANCE: HUMAN APPROVAL REQUIRED
AI PLAN ≠ APPROVAL
```

but the “approval” is merely local UI state.

### Finding

**SHC-PLLM-GOV-003 — CRITICAL/HIGH**

This must not remain in production governance UI.

---

# 20. Specification Review duplicates the Human Gate 1 problem conceptually

We now have two frontend behaviors suggesting approval:

### A. Specification Review
```text
local setApproved(true)
```

### B. `ensureCandidateRequested()`
```text
AWAITING_GATE_1 → GUI_APPROVED
```

Neither represents a robust dedicated Human Gate 1 approval workflow.

So the Gate 1 architecture is clearly unfinished end-to-end.

---

# 21. Correct Gate 1 architecture should unify these pages

Instead of:

```text
Specification Review
local approved boolean

External Handoff
auto transition

Candidate Upload
auto transition again
```

we need:

```text
Specification Review
       ↓
backend persisted specification/evidence
       ↓
Approve Gate 1 button
       ↓
POST /gate-1/approve
       ↓
authenticated reviewer
evidence binding
approval record
state transition
       ↓
GUI_APPROVED
```

Then all later pages simply consume that state.

---

# 22. Stepper visually marks prior steps as completed just from `currentStep`

`ProjectLlmStepper` defines:

```ts
isCompleted = step.id < currentStep
```

So if the user reaches Step 5 URL, Steps 1–4 get green checkmarks.

That is presentation progress, not backend verification.

For ordinary onboarding this is fine.

For a governance workflow it is potentially misleading.

### Better

Use:

```text
navigation progress
```

and:

```text
governance completion
```

as separate concepts.

### Finding

**SHC-PLLM-STEPPER-001 — MEDIUM/HIGH**

A checkmark should mean something precise.

---

# 23. Stepper also allows direct navigation into later stages

Every step is a `Link`.

So an admin can directly click:

```text
Upload & Validate
Integrate & Certify
```

regardless of canonical state.

This is not inherently a security bug because backend endpoints must enforce state.

But UX should reflect backend availability.

For example:

```text
locked / read-only / inspect-only
```

when prerequisite state isn't reached.

### Classification

**SHC-PLLM-UX-002 — MEDIUM**

Backend remains authoritative.

---

# 24. Context banner labels every target as “New version”

`ProjectLlmContextBanner` renders:

```text
New version
```

unconditionally beside `targetVersion`.

But the create page explicitly allows:

```text
existing version to update
```

and replacement/supersession workflows exist.

So this label is not always correct.

### Finding

**SHC-PLLM-CONTEXT-001 — MEDIUM**

Version intent needs an explicit model:

```text
CREATE_NEW
SUPERSEDE_EXISTING
INSPECT_ONLY
```

instead of inferring from target number.

---

# 25. Context banner can synthesize purpose text

If purpose isn't available, it can create:

```text
Implement and certify Family Version block variant...
```

This is acceptable as UI fallback text.

But the label says:

```text
Purpose (as specified)
```

which is incorrect when the purpose was generated by the component.

### Finding

**SHC-PLLM-CONTEXT-002 — LOW/MEDIUM**

Again, truthfulness of governance UI matters.

---

# 26. Compliance Brief is closer to the right architecture

Unlike the static pages, it calls:

```ts
projectLlmClient.getEngineeringContract(workflowId)
```

Good.

That means it can anchor itself in backend-generated contract data.

This is where the Project LLM UI should converge.

### But...

It still supplements backend contract data with a large locally defined requirement presentation.

If any of those local requirements differ from backend contract content, the page can display rules that are not part of the persisted contract hash.

### Existing finding

**SHC-PLLM-CONTRACT-003 remains HIGH**

---

# 27. The static design-system contract may legitimately be constitutional

`DESIGN_SYSTEM_CONTRACT_MARKDOWN` is different from a branch/commit snapshot.

Some rules can legitimately be static architecture policy:

```text
BlockShell
BlockHeader
brand independence
responsive widths
WCAG constraints
```

Those are constitutional design rules.

The issue is not that they are static.

The issue is whether the backend contract records:

```text
which policy version was used
```

and binds it cryptographically.

### Better

EngineeringContract should include:

```text
designSystemContractVersion
designSystemContractHash
```

or equivalent.

---

# 28. Static corpus counts can remain constitutional if formally declared

Likewise:

```text
18 families
133 documented versions
15 primitives
```

can be legitimate constitutional/catalogue metadata if the architecture defines them as:

```text
documented design corpus
```

rather than current runtime facts.

The naming needs to reflect that.

---

# 29. Runtime implementation facts should never be static-only

Claims such as:

```text
O3 is runtime integrated
S1 has 10 passing tests
C1 has 50+ tests
```

are repository-state claims.

They can stale.

Therefore they need:

```text
lastVerifiedCommit
verificationTimestamp
source
```

and should not silently represent HEAD.

### Finding

**SHC-PLLM-RUNTIME-EVIDENCE-001 — HIGH**

---

# 30. Some fixture comments already acknowledge historical drift

The `S1_WARNING` comment carefully distinguishes:

```text
historical status
vs
current runtime status
```

That's good.

But having both values in the same static module still creates consumer risk.

The better model would be:

```text
historicalFindings[]
```

separate from:

```text
currentRuntimeImplementations[]
```

so callers cannot accidentally treat both as current.

---

# 31. Static source paths include line numbers

Repository intelligence contains evidence strings like:

```text
IntroductionBlock.tsx (lines 30-39)
DefinitionBlock.tsx (lines 82-84)
```

Line numbers are highly brittle.

Even an unrelated formatting change invalidates them.

### Finding

**SHC-PLLM-EVIDENCE-002 — MEDIUM**

Prefer:

```text
path
symbol
commit hash
evidence type
```

rather than embedded human-readable line numbers.

---

# 32. Reference patterns are legitimate architecture references, not proof

Earlier comments already say their paths are:

> symbolic references documenting canonical implementation structure, not filesystem validation targets.

Excellent distinction.

We should carry that exact concept throughout the UI:

```text
REFERENCE
```

not:

```text
VERIFIED CURRENT FILE
```

unless live scanner evidence exists.

---

# 33. Current Project LLM screens need source provenance

Every governance datum should conceptually know:

```text
source = LIVE_BACKEND
source = LIVE_REPOSITORY_SCAN
source = STATIC_CORPUS
source = ARCHITECTURAL_POLICY
source = HISTORICAL_RECORD
source = PROTOTYPE
```

Then UI can render it honestly.

This is perhaps the most useful simplification for the Project LLM redesign.

---

# 34. We do not need to delete the prototype/reference screens

Pages such as:

```text
explorer
registry
matrix
mix-match
specification-review
```

contain useful product ideas and domain information.

Rather than delete them, we should classify their role.

Possible:

```text
Reference Explorer
Architecture Policy Matrix
Prototype Derivation Planner
```

until they are backed by live services.

That satisfies YAGNI better than building complex live engines immediately.

---

# 35. But prototype pages cannot perform fake governance actions

Two classes of behavior must be removed or disabled immediately:

```text
fake PASS / VERIFIED / ENFORCED evidence
```

and:

```text
fake human approval
```

because those undermine trust in the real governance pipeline.

---

# 36. Project LLM UI should have three explicit zones

I would recommend conceptually:

### Zone A — Live Operations

```text
Dashboard
Workflow
Candidate
Placement
Certification
Audit
```

Everything sourced from backend/current repository scan.

No fallback-to-fixture for decisions.

### Zone B — Architecture Reference

```text
Corpus Registry
Explorer
Relationship Matrix
Reference Patterns
```

Static/documented content allowed.

Clearly labeled reference.

### Zone C — Experimental Planning

```text
Mix & Match
Creation Brief pilot
Derived Specification experiments
```

Prototype behavior allowed.

Cannot approve, certify or mutate canonical workflow state.

This separation would remove a large amount of conceptual confusion without major infrastructure work.

---

# 37. Complete Project LLM finding register now includes several critical items

The highest-priority ones are:

| ID | Finding | Severity |
|---|---|---:|
| SHC-PLLM-GOV-001 | Browser automatically passes Human Gate 1 | **Critical/High** |
| SHC-PLLM-GOV-002 | Generic transition does not enforce Gate 1 evidence | **High** |
| SHC-PLLM-GOV-003 | Specification Review “approval” is local React state | **Critical/High** |
| SHC-AUDIT-IDENTITY-001 | `triggered_by` is client-controlled | **High** |
| SHC-PLLM-AUDIT-TRUTH-001 | Workflow Details fabricates audit evidence | **Critical/High** |
| SHC-PLLM-MIXMATCH-001 | Fake “real-time validation” with hard-coded true checks | **Critical/High** |
| SHC-PLLM-SPEC-TRUTH-001 | Static evidence presented as verified specification | **Critical/High** |
| SHC-PLLM-DASH-001 | Dashboard is static operational telemetry | **High** |
| SHC-PLLM-DATA-TRUTH-002 | Hard-coded branch/commit/snapshot | **High** |
| SHC-PLLM-REGISTRY-001 | Create page duplicates family/version catalogue | **High** |
| SHC-PLLM-STATUS-001 | Runtime status has multiple authorities | **High** |
| SHC-PLLM-DERIVATION-001 | “Generated spec” is mostly static navigation | **High** |
| SHC-PLLM-MATRIX-001 | Static policy labeled “ENFORCED” | **High** |
| SHC-PLLM-BRIEF-CONTRACT-002 | GUI prototype stage vs React package semantics conflict | **High** |
| SHC-PLLM-RUNTIME-EVIDENCE-001 | Static runtime facts can stale | **High** |
| SHC-PLLM-SRP-001 | Certification page oversized orchestration | **High** |
| SHC-PLLM-SRP-002 | API client owns workflow orchestration | **High** |
| SHC-PLLM-CONTRACT-002 | IDs and hashes conflated | **High** |
| SHC-PLLM-CONTRACT-003 | Local prompt rules not fully backend-hash-bound | **High** |
| SHC-PLLM-DATA-001 | Static fallback unsafe for governance | **High** |

---

# 38. Project LLM baseline can now be considered substantially complete

We have now traced:

```text
Dashboard

Create workflow
family/version selection
Project LLM context

Creation brief generation
compliance brief
external AI handoff

Candidate upload
qualification

Placement manifest
approval
execution

Composer verification
learner verification
final certification

Workflow details
audit/evidence presentation

Repository intelligence
static corpus
reference patterns

Explorer
registry
relationship matrix
mix & match
specification review

Canonical workflow state machine
transition API
workflow governance service
```

That is enough to define the architectural remediation without guessing.

---

# Principal Architect conclusion for Project LLM

The backend contains the right core ideas:

```text
canonical workflow
explicit states
artifact bindings
hashes
approval repositories
optimistic locking
isolated verification
final fail-closed certification
```

The biggest frontend problem is not lack of capability.

It is **confusing prototype/reference data with authoritative operational truth**.

The governing rule going forward should be:

```text
If the UI says:
PASS
VERIFIED
APPROVED
CERTIFIED
ENFORCED
CURRENT
LIVE
AUDIT
EVIDENCE

then that value must come from
an authoritative persisted backend/repository-verification source.
```

Static architectural policy is allowed.

Static operational truth is not.

For Project LLM, I now consider the **main baseline complete**.

The next phase of the `skillhubcore-admin` review should move away from Project LLM and cover the remaining ordinary admin surfaces—dashboard/admin pages, auth layouts, shared sidebars/navigation, content-generation/support pages, proxy/config, then tests/lint/typecheck/CI enforcement. That will let us close Gate **1A–1H** for the entire app before we start the first remediation commit.

Yes. I continued through the **ordinary admin shell/pages plus Gate 1H enforcement layer**, and this tranche gives us a much clearer picture of what is actually protected by architecture checks versus what currently relies on convention.

No code changes were made.

## Principal Architect checkpoint: ordinary admin + enforcement

The strongest positive finding is that the **admin API trust boundary is materially better enforced than the frontend architecture boundaries**.

There is real protection around:

```text
/api/*
→ proxy.ts
→ requireAdminRequest / requireAdminMutationOrigin
→ audience/brand/role validation
```

and there is a dedicated static boundary checker plus security tests.

But the app still lacks equivalent enforcement for:

```text
route → service → repository dependency direction
no direct DB from HTTP routes
no UI → app/api implementation imports
no static operational/audit truth
canonical contract ownership
```

That gap explains many of the architecture problems we found earlier.

| Area | Status | Assessment |
|---|---|---|
| API auth boundary | 🟢 Strong |
| Mutation origin protection | 🟢 Strong |
| Audience/brand isolation | 🟢 Strong |
| API boundary regression script | 🟢 Useful |
| Security tests | 🟢 Useful |
| TypeScript strict mode | 🟢 Enabled |
| App lint configuration | 🟢 Present |
| Architectural dependency enforcement | 🔴 Missing |
| Active GitHub CI | 🔴 Missing/disabled |
| Branch required checks | 🔴 Not enforced |
| Ordinary admin dashboard data | 🔴 Static prototype |
| Audit/governance support pages | 🔴 Static truth claims |
| Shell/navigation | 🟡 Mixed real + placeholder behavior |
| Client auth guard | 🟡 Useful UX layer, not security authority |

---

# 1. `proxy.ts` is a good fail-closed API boundary

The entire admin API matcher is:

```ts
matcher: '/api/:path*'
```

and the proxy logic effectively says:

```text
GET /api/health
→ public

POST login/logout
→ mutation-origin protection

everything else
→ requireAdminRequest()
```

This is a good default-deny model.

A newly introduced API route does not need someone to remember to add it to a separate protected-path list.

### Classification

**SHC-API-BOUNDARY-001 — Implemented strongly**

Keep this.

---

# 2. The static API boundary checker is one of the best enforcement mechanisms in the app

`scripts/check-api-boundaries.mjs` walks every:

```text
src/app/api/**/route.ts
```

and verifies that every exported HTTP function begins with the appropriate guard.

It also explicitly rejects the removed tutorial development auth bypass.

That's good architectural regression protection.

Importantly, its own comment correctly says:

> A regression tripwire, not a substitute for runtime authorization tests.

Good engineering discipline.

### Classification

**SHC-ARCH-ENFORCEMENT-001 — Implemented for authentication boundary**

---

# 3. Security tests cover meaningful attack cases

`admin-boundary.test.ts` tests things that actually matter:

- forged identity headers don't replace authentication;
- wrong brand is rejected;
- only `shc-admin` audience is accepted;
- `isAdmin: true` does not override role authorization;
- mixed-role users retain elevated permissions appropriately;
- cross-origin mutations are rejected;
- newly added API paths are protected by default;
- removed dev bypass cannot return;
- anonymous CRUD cannot touch DB;
- login tokens are removed from response JSON;
- HttpOnly cookies are used;
- logout clears all aliases even when upstream is unavailable.

These are valuable tests.

### Classification

**SHC-SEC-TEST-001 — strong**

Similarly, `upstream-proxy.test.ts` verifies:

```text
forged host
forged Authorization
forged user IDs
forged roles
forged x-brand
forged gateway/internal headers
```

are stripped/replaced with verified principal data.

Excellent.

---

# 4. But we still have no current CI execution proof

The repository tree shows:

```text
.github/workflows.disabled/
```

with workflows such as:

```text
quality.yml
deploy-cloudrun.yml
deploy-gateway.yml
```

rather than active:

```text
.github/workflows/
```

This matches the earlier observation that current HEAD had no workflow runs.

So despite having scripts for:

```text
lint
typecheck
test
build
security tests
boundary checks
```

we cannot say they are automatically enforced on every push/PR.

### Classification

**SHC-CI-001 — HIGH**

Current status:

```text
quality commands exist
CI enforcement does not
```

That distinction is important.

---

# 5. Required branch checks also remain absent

Earlier branch inspection found:

```text
protected: false
required_status_checks: []
```

So even if someone manually ran tests, repository governance currently does not require them before merge.

### Classification

**SHC-CI-GATE-001 — HIGH**

For the architecture document's CI-gate requirement, this is **not implemented**.

---

# 6. Root `ci` script does not run tests

Root:

```json
"ci": "pnpm lint:all && pnpm typecheck:all && pnpm build"
```

Notice:

```text
test
```

is absent.

Likewise app-specific:

```text
check:boundaries
test:security
```

are not automatically included there.

So even if the disabled quality workflow simply calls `pnpm ci`, important security/architecture tests may still not execute.

### Finding

**SHC-CI-002 — HIGH**

A real quality gate should include at least:

```text
lint
type-check
architecture boundary checks
security tests
unit/integration tests
build
```

with heavier E2E suites possibly separate.

---

# 7. TypeScript strict mode is enabled

Root tsconfig contains:

```ts
strict: true
noFallthroughCasesInSwitch: true
forceConsistentCasingInFileNames: true
```

Good.

So the type weaknesses we've found are mostly caused by deliberate escape hatches:

```text
any
unknown index signatures
casts
legacy compatibility
```

not because strict mode is disabled.

### Classification

**SHC-TYPE-BASELINE-001 — Implemented**

This is useful because remediation can tighten specific boundaries rather than changing compiler philosophy.

---

# 8. `skipLibCheck` is enabled

The root config has:

```ts
skipLibCheck: true
```

This is common in large monorepos and not automatically a problem.

I would classify it as:

**acceptable implementation variation**

unless package boundary/type drift begins hiding actual internal errors.

No need to change it reflexively.

---

# 9. AdminGuard is a useful UX/session component, but it must not be treated as the security boundary

`AdminGuard` does several good things:

```text
session revalidation
role checking
global 401/403 handling
transient network retries
locked-session handling
metrics/logging
```

Good client resilience.

However, because all of this executes in the browser, it remains:

```text
UX/session synchronization
```

not:

```text
authoritative authorization
```

Fortunately, the server proxy/route guards exist, so the architecture is correct in principle.

### Status

**SHC-AUTH-CLIENT-001 — acceptable**

---

# 10. There is a non-production auth bypass for `/questions`

AdminGuard contains:

```ts
const LOCAL_TEST_BYPASS_PREFIXES = [
  '/questions',
];
```

and bypasses the client guard when:

```text
NODE_ENV !== production
```

This does **not** bypass protected APIs because the server routes remain guarded.

So I am not classifying this as a production auth vulnerability.

But it does mean the UI guard behaves differently in local/dev.

### Classification

**SHC-AUTH-DEV-001 — Low/Medium**

Acceptable if intentionally limited to testing, but it should ideally be explicit through test configuration rather than embedded production-source routing logic.

---

# 11. AdminGuard recognizes `infrastructure` as admin-equivalent

Client-side:

```text
admin
super_admin
infrastructure
```

are accepted.

The server-side role model must match this exactly.

Earlier `requireAdminRequest` and RBAC need to remain the authoritative definition.

Any role list duplicated in the client is a drift risk.

### Finding

**SHC-AUTH-ROLE-DRY-001 — MEDIUM**

One shared role-capability contract would be preferable.

---

# 12. `AdminLockScreen` uses actual re-authentication, which is good

Unlock is not simply:

```text
setLocked(false)
```

It calls:

```text
loginPortalSession(...)
```

with credentials and then updates local state.

Good.

The lock screen therefore re-establishes authentication rather than acting as only a cosmetic overlay.

### Classification

**SHC-AUTH-LOCK-001 — Good**

---

# 13. But the lock screen hard-codes RealTutorialHub identity inside SkillHubCore Admin

It calls:

```text
platform: 'realtutorialhub'
portalName: 'RealTutorialHub Admin'
```

inside:

```text
SkillHubCore Admin
```

This is a brand/identity inconsistency.

Given the architecture's explicit brand isolation requirements, this deserves correction unless the auth platform deliberately uses RTH as the canonical provider for SHC.

### Finding

**SHC-BRAND-AUTH-001 — MEDIUM/HIGH**

Needs confirmation against auth architecture before fixing.

---

# 14. `SecurityMuzzle` is defense-in-depth, not an observability strategy

It monkey-patches:

```text
console.warn
console.error
```

in production and scrubs:

```text
emails
Bearer tokens
internal keys
API keys
password
secret
```

This can reduce accidental leakage.

But it cannot replace correctly structured safe logging.

It also only scrubs strings; arbitrary objects can still potentially contain sensitive nested data depending on how `initSecurityMuzzle()` behaves.

### Classification

**SHC-OBS-MUZZLE-001 — useful defense-in-depth**

but:

**not sufficient as the primary logging policy.**

Our existing recommendation to replace raw console diagnostics still stands.

---

# 15. ClientShell is sensibly small

It mostly composes:

```text
LeftSidebar
Header
main content
RightSidebar
ShellContext
```

This is good SRP.

The context is also relatively small and shell-specific.

No reason to overengineer this area.

---

# 16. Header contains prototype operational data

It hard-codes:

```text
notifications = 12
messages = 8
Super Admin
Administrator
```

and uses:

```text
pravatar.cc
```

for the avatar.

These are not tied to authenticated user state.

For a prototype shell, this is harmless.

For a production admin system it is misleading.

### Finding

**SHC-SHELL-DATA-001 — MEDIUM**

The authenticated user already exists in the auth store; display should use that eventually.

Notifications/messages should either be wired or omitted.

---

# 17. Header search field is currently decorative

The input:

```text
Search anything...
```

has no search behavior attached.

Again, low severity, but YAGNI says either:

```text
implement it
```

or:

```text
remove/mark coming soon
```

rather than presenting an apparently functional control.

### Classification

**SHC-SHELL-DEAD-UI-001 — LOW**

---

# 18. LeftSidebar still contains many `href="#"` placeholders

As noted earlier, entries such as:

```text
Constitutional Center
Prompt Governance
Architecture Governance
Brand & Deployment
System Settings
Audit & Compliance
Exam Engine
Placement Engine
Faculty Engine
Internship Engine
```

point to `#`.

That means the main navigation advertises modules that do not exist on that route.

### Existing finding strengthened

**SHC-NAV-001 — MEDIUM**

Better options:

```text
hide unavailable entries
disable with Coming Soon state
or route to real pages
```

not `#`.

---

# 19. Navigation configuration should eventually become declarative

The sidebar contains several large inline arrays with:

```text
label
icon
href
color
```

A centralized navigation model would help:

```text
routing
permission filtering
feature availability
status
```

But this is a moderate maintainability improvement, not an urgent architectural rewrite.

### Classification

**SHC-NAV-002 — Medium**

---

# 20. RightSidebar dead blocks remain a KISS/YAGNI issue

We previously found large:

```tsx
{false && (...)}
```

sections.

That remains valid.

Dead UI should either:

```text
be deleted
be feature-flagged
or be documented outside runtime source
```

rather than retained as permanently unreachable JSX.

---

# 21. Ordinary dashboard is fully static

`dashboard/page.tsx` displays:

```text
128,540 Total Users
98,765 Active Learners
2,356 Courses
1,245 Exams
3,542 Placements
1,862 Internships
```

with percentage changes and further workflow metrics.

There is no query/API source.

This is clearly prototype/demo data.

### Classification

**SHC-DASH-DATA-001 — HIGH if presented as production dashboard**

The problem is not that static design mocks exist.

The problem is their location in the actual admin dashboard route without a clear prototype label.

---

# 22. Static dashboards are not automatically architecture violations

For this application stage, they can legitimately represent:

```text
UI shell prototype
future capability
design reference
```

So I would not delete them blindly.

The safe choices are:

```text
Prototype / Demo Data badge
```

or replace them incrementally with real queries.

No fake operational metrics should be mistaken for production state.

---

# 23. `skillhubcore-admin-data.ts` confirms the static-data pattern

We previously found static:

```text
users
metrics
audit
```

data in the app library.

This reinforces the classification:

**prototype data source, not authoritative implementation.**

No need to force database integration into every page immediately, but the architecture readiness matrix must mark these features as:

```text
Partially implemented
```

rather than complete.

---

# 24. Layman Architecture page is another prototype governance surface

This page contains substantial static management UI:

```text
Universal Layman Architecture
Domain-specific adaptations
architecture versions
audit logs
active/archive state
```

and buttons such as:

```text
New Architecture
Create New Version
Export Logs
```

without corresponding persistence/action wiring in the reviewed code.

This is okay as a design surface.

However, it also says:

> All changes are version controlled and audited

and:

> Last audit pass: 100% compliance.

Those are operational/governance claims.

### Finding

**SHC-CONTENT-GOV-TRUTH-001 — HIGH**

Exactly the same rule as Project LLM applies:

If the UI says:

```text
audit
current
compliance
version-controlled
```

the data must come from an authoritative source—or be clearly marked mock/prototype.

---

# 25. “Current” architecture version is hard-coded

The page displays:

```text
v2.1 (Current)
v2.0 Archived
v1.0 Archived
```

with:

```text
Updated By: Super Admin
dates
changes
```

This resembles an audit/version ledger but is only static JSX.

### Classification

**SHC-CONTENT-GOV-TRUTH-002 — HIGH**

---

# 26. This gives us a general admin UI policy

Across Project LLM, dashboard, content-generation and shell pages, a common problem has emerged.

We should introduce a design rule:

```text
Static fixture data may be used only when:
1. the page is explicitly identified as prototype/reference/demo, OR
2. the datum is constitutional/static policy.

Static fixture data must not be presented as:
LIVE
CURRENT
VERIFIED
PASS
AUDITED
CERTIFIED
HEALTHY
APPROVED
ENFORCED
```

This one policy would eliminate a large class of trust problems.

---

# 27. Enforcement currently protects auth, but not architecture dependency direction

The existing checker verifies:

```text
every API handler is guarded
```

but does not prevent:

```text
route importing @quiz/db
UI importing app/api implementation code
cross-DB orchestration inside routes
direct taxonomy Drizzle access
```

This explains why those violations were able to accumulate.

### Finding

**SHC-ARCH-ENFORCEMENT-002 — HIGH**

We need static dependency-boundary rules.

---

# 28. A useful next boundary checker would be very small

We do **not** need a large architecture framework.

A simple AST/import checker could enforce rules such as:

```text
src/app/api/**
  may not import @quiz/db
  except approved repository/infrastructure adapters

src/components/**
src/app/(admin)/**
  may not import src/app/api/**

Project LLM governance pages
  may not import static repository fixtures for approval/certification paths
```

and perhaps:

```text
taxonomy API
→ application service only
```

once that refactor exists.

This is a strong example of KISS applied to architecture governance.

---

# 29. Type-check enforcement exists as a script, but is not proven in CI

The app has:

```text
type-check
```

and the monorepo has:

```text
type-check
typecheck:all
```

Good.

But without active workflows/required branch checks, this is still:

```text
available
```

not:

```text
enforced
```

### Gate 1H status

**Partially implemented**

---

# 30. Lint configuration does exist

The repository tree confirms:

```text
apps/skillhubcore-admin/.eslintrc.json
```

So my earlier temporary 404 was because I probed the wrong config filename first, not because lint configuration was absent.

This is an important correction.

The app's lint script explicitly uses legacy config mode:

```text
ESLINT_USE_FLAT_CONFIG=false
```

so `.eslintrc.json` is intentional.

No issue there merely because newer apps use flat config.

---

# 31. Monorepo lint-staged is configured, but Husky is disabled

Root package says:

```text
husky prepare temporarily disabled
```

So `lint-staged` configuration exists but is not necessarily executed through a Git hook.

### Finding

**SHC-LOCAL-GATE-001 — MEDIUM**

This reinforces that enforcement currently depends on developers manually invoking scripts.

CI is the more important missing gate.

---

# 32. Test configuration exists for SkillHubCore Admin

The repository has:

```text
apps/skillhubcore-admin/vitest.config.ts
```

and targeted tests under the app.

So this is not a “no tests” application.

The problem is:

```text
coverage is uneven
+
execution isn't currently required by CI
```

Those are different issues.

---

# 33. Existing tests are strongest around security boundaries

Security/auth/proxy behavior is substantially better tested than:

```text
taxonomy business rules
frontend contracts
Project LLM evidence truth
hierarchy contract fields
ordinary dashboard data
```

This is expected given earlier audit work.

### Finding

**SHC-TEST-BALANCE-001 — MEDIUM/HIGH**

Next test investment should follow the highest-risk architectural findings, not simply increase test counts.

---

# 34. Gate 1H preliminary score

At this stage:

| Requirement | Status |
|---|---|
| TS strict | **Implemented** |
| App lint script | **Implemented** |
| Typecheck script | **Implemented** |
| Unit test script | **Implemented** |
| Security boundary tests | **Implemented** |
| API auth boundary static checker | **Implemented** |
| Dependency-boundary checker | **Not implemented sufficiently** |
| Architectural contract tests | **Partial** |
| Build command | **Implemented** |
| Active CI workflow | **Not implemented at current HEAD** |
| Required branch status checks | **Not implemented** |
| Automatic test gate | **Not implemented** |
| Automatic security/boundary gate | **Not implemented** |

So Gate **1H = Partially Implemented**, with **CI enforcement as the largest missing control**.

---

# 35. Current full SkillHubCore Admin status is becoming clear

We have now substantially reviewed the major architecture surfaces:

```text
API routes

authentication / RBAC / proxy boundaries

Educational Taxonomy
Hierarchy Factory
Question Factory

Tutorial Sidebar
Tutorial Composer
block registry/lifecycle
analysis/suggestions/import

Project LLM
workflow governance
candidate/placement/certification
reference/prototype surfaces

shared hooks/context/store/types/utils

admin shell/navigation/auth UI
ordinary dashboard/content governance

tests
typecheck
lint
architecture boundary scripts
CI availability
```

This is now far beyond the earlier partial security-only audit.

## Major strengths already present

The app has several patterns worth standardizing around:

```text
requireAdminRequest()
trusted upstream proxy
HttpOnly session cookies
security regression tests
API guard AST checker

Tutorial Composer service boundary
TutorialImportService
SuggestionApplicationService
optimistic locking
C1 canonical converter

AdminQuestionEngine repository abstraction
bulk workflow processing

Project LLM canonical backend state machine
hash-bound placement/final certification
```

We should reuse these instead of inventing new architecture.

## Major systemic weaknesses

The recurring problems are now equally clear:

```text
direct DB from selected API routes
duplicated contract/model transformations
multiple hierarchy query implementations
weak delete semantics
frontend/server contract drift

large orchestration components
browser-owned workflow decisions
prototype/static data presented as operational truth

raw console diagnostics
inconsistent error contracts

architecture checks focus on auth only
no active CI/required status checks
```

### Current phase status

I would now call the **SkillHubCore Admin baseline review approximately at the point where Gates 1A–1H can be consolidated into a formal Architecture Readiness Matrix**.

Before implementation, I would do one final compact closure pass over the few remaining supporting files we haven't deeply inspected individually—especially `BulkUploadPanel`, `QuestionEditor`, `SelectionFields`, `tutorial-block-composer`, marketing/certificate surfaces, and the exact app ESLint/Vitest configs—then produce the final **SkillHubCore Admin Gate 1A–1H matrix + prioritized remediation backlog**.

After that, we can safely start implementation in controlled batches instead of continuing open-ended review.

Yes. The **final closure pass is complete**, including the previously truncated support files. I still have **not modified any code**.

At this point I consider the `apps/skillhubcore-admin` baseline sufficiently reviewed to stop open-ended discovery and move into a controlled remediation program.

## Final closure-pass findings

`BulkUploadPanel.tsx` is better than the older Question Factory UI in one respect: it performs explicit client validation before submission, including a maximum of 100 questions, minimum two options, allowed difficulty/type/mapping enums, required explanation, and presence of a correct answer. The server remains authoritative, which is the correct model.

Its weakness is **another independently implemented question contract**. It understands both `text` and `questionText`, constructs correctness from either `isCorrect` or textual `correctAnswer`, defaults difficulty/type/mapping type, and only allows `mcq`/`code_mcq`. That logic now exists alongside `JsonValidator`, `ReviewConsole`, `QuestionEditor`, the server Zod schema, `AdminQuestionEngine`, and the older factory-save contract.

So the issue is no longer a single bad component. We definitively have:

```text
multiple independent definitions
of "what a valid Question is"
```

**SHC-Q-CONTRACT-DRY-001 — HIGH**

The client validator itself is useful; it should eventually consume the same canonical shared schema rather than disappear.

---

`QuestionEditor.tsx` is reasonably cohesive as an editor component. It owns editing state and delegates persistence through `onSubmit`, which is good SRP.

However, its question type vocabulary is:

```text
single
multiple
```

while authoritative server/domain vocabulary elsewhere is:

```text
mcq
code_mcq
multi_select
```

That may be deliberately a UI abstraction, but the mapping contract is not visible here and creates drift risk.

More importantly, this transition is unsafe:

```text
Multiple mode
→ mark several correct answers
→ switch to Single
```

Switching to `single` only changes:

```ts
type: 'single'
```

It does **not** normalize the existing correct flags back to one.

The submit button merely checks:

```text
at least one correct option
```

so a “single” question can leave this component with multiple correct answers.

**SHC-Q-EDITOR-002 — MEDIUM/HIGH**

Other validation is also intentionally lightweight: blank option text, empty explanation, zero/negative estimated time and the full type-specific invariants aren't rejected here. That's acceptable only because server validation must remain authoritative.

---

`SelectionFields.tsx` is mostly fine.

`SelectField` is just a thin adapter around the shared UI component—good reuse.

`MultiSelectField` owns only:

```text
selection
grouping
rendering
loading presentation
```

which is cohesive.

There are minor type-smell casts such as:

```ts
opt.id as string
opt.category as string
```

but nothing here warrants architecture refactoring.

**Status: keep largely as-is.**

---

`tutorial-block-composer/page.tsx` contains a concrete KISS/YAGNI problem.

The component begins with:

```ts
redirect('/tools/tutorial-page-content');
```

and then contains the entire historical operation-card UI afterward.

Because `redirect()` terminates rendering, all of this:

```text
Create Block
Update Block
Delete Block
Reorder
Duplicate
Preview
JSON Inspector
architecture banner
```

is unreachable code.

This is now a confirmed dead implementation rather than merely unused JSX.

**SHC-DEAD-CODE-001 — MEDIUM**

The fix later is simple: either keep the redirect and delete the dead page body, or restore the surface. Do not maintain both.

---

The Marketing Governance page is one of the stronger ordinary admin pages.

It uses React Query and actually fetches:

```text
RTH bootstrap
SUIA bootstrap
RTH control plane
SUIA control plane
collector observability
```

through guarded BFF APIs.

That is materially different from the static main dashboard.

Its only semantic weakness is that it labels an endpoint:

```text
Healthy
```

simply because the HTTP query succeeded.

HTTP 200 doesn't necessarily mean the underlying subsystem is healthy unless that endpoint contract guarantees it.

So ideally:

```text
HTTP query success
≠ semantic service health
```

unless backed by an explicit health field.

**SHC-OBS-SEMANTICS-001 — MEDIUM**

Otherwise, this is a good React Query/server-state example.

---

The certificate generator and preview surfaces are architecturally clean.

They reuse:

```text
@quiz/marketing-site
```

instead of duplicating certificate implementation.

Excellent DRY.

Their local file only supplies brand definitions.

The only moderate concern is that RTH/SUIA brand metadata is hard-coded again in SkillHubCore instead of coming from a canonical brand registry.

**SHC-BRAND-CONFIG-001 — MEDIUM**

Not a blocker.

---

The exact ESLint configuration confirms that the app has reasonably strict linting:

```text
react/no-danger → error
no-eval → error
no-implied-eval → error
no-new-func → error
security plugin enabled
```

But several architecture-relevant rules remain warnings:

```text
no-explicit-any
ban-ts-comment
exhaustive-deps
unused-vars
```

This helps explain why numerous `any` escape hatches remain despite `strict: true`.

I would not simply promote every warning to an error immediately; that could generate noisy unrelated work. We should eliminate high-risk boundary `any`s first, then tighten gates incrementally.

---

The Vitest configuration is sound in structure and resolves workspace source directly.

Tests include:

```text
*.test.ts
*.test.tsx
__tests__
*.integration.test.ts
```

The test environment defaults to Node, so component tests requiring DOM must supply appropriate environment directives/configuration where required.

Nothing fundamentally wrong there.

The bigger issue remains **test execution enforcement**, not Vitest itself.

---

# SkillHubCore Admin — Formal Architecture Readiness Matrix

| Gate | Architecture requirement | Status | Principal Architect assessment |
|---|---|---|---|
| **1A** | Module/service boundaries & dependency direction | 🔴 **Partial / major gaps** | Strong patterns exist in Composer, Import, Suggestion Application and AdminQuestionEngine, but taxonomy and Sidebar routes directly access DBs; UI also imports API implementation utilities in places. |
| **1B** | SOLID / DRY / KISS / YAGNI / cohesion / coupling | 🟡 **Partial** | Many focused hooks/services exist, but taxonomy tables, Project LLM certification, Sidebar client/routes and duplicated contracts remain major hotspots. Dead/prototype UI also creates YAGNI debt. |
| **1C** | Auth / RBAC / authorization / trust boundaries | 🟡🟢 **Mostly implemented, specific high gaps** | SHC API auth boundary, brand/audience checks, origin validation and trusted proxy are strong. Project LLM Gate 1 governance and client-controlled audit actor are significant exceptions. Some Composer authorization asymmetry still needs resolution. |
| **1D** | DB ownership / repositories / data access | 🔴 **Partial / major gaps** | AdminQuestionEngine and db-tutorial demonstrate correct repository/service architecture. Taxonomy CRUD and Tutorial Sidebar still perform direct Drizzle/cross-DB operations in HTTP handlers. |
| **1E** | API contracts / validation / idempotency / errors / caching | 🔴 **Partial** | Composer/import/some bulk APIs use good Zod contracts. Taxonomy/question contracts drift heavily; typed errors are inconsistent; UI guesses failures; atomic hierarchy validation is incomplete; concurrency varies by endpoint. |
| **1F** | Shared capabilities + Project AI boundary | 🔴🟡 **Partial / governance gaps** | Backend Project LLM governance has strong cryptographic/evidence concepts, but frontend mixes static reference/prototype information with live governance and can auto-pass Human Gate 1. Static repository intelligence must fail closed for governance. |
| **1G** | Observability / resilience / config / operations | 🔴 **Partial** | Metrics/logging mechanisms exist, but raw `console.*`, DB diagnostics, fire-and-forget indexing/cache invalidation and inconsistent health semantics remain. Structured observability is not universal. |
| **1H** | Tests / architectural enforcement / typecheck / lint / build / CI | 🔴 **Partial / CI missing** | TS strict, lint, tests, security tests and API-boundary checker exist. Dependency-boundary checks are insufficient. Active GitHub workflows and required branch checks are absent at reviewed HEAD. |

### Overall SkillHubCore Admin readiness

I would currently classify the application as:

**Architecture: PARTIALLY READY — solid foundations, not yet production-architecture certified.**

This is not a failing architecture.

There are enough good implementations already present that we can evolve the app rather than rewrite it.

The main issue is **inconsistency**:

```text
strong architecture exists,
but it is not used consistently across every vertical.
```

For example:

```text
AdminQuestionEngine
→ good repository abstraction

Taxonomy API
→ direct Drizzle
```

and:

```text
SuggestionApplicationService
→ strong concurrency + verification

ordinary Composer save
→ no optimistic version precondition
```

and:

```text
Project LLM final certification
→ fail-closed evidence

Project LLM Gate 1
→ browser can auto-transition approval
```

That inconsistency is precisely what the remediation should solve.

# Prioritized remediation backlog

1. **P0 — Fix trust/governance violations first.** Remove automatic `AWAITING_GATE_1 → GUI_APPROVED` transitions; introduce a real authenticated Gate-1 approval operation; derive the audit actor server-side rather than accepting `triggered_by`; remove local fake specification approval; eliminate fabricated Workflow Details evidence and prevent static repository intelligence from authorizing certification/placement.

2. **P0 — Fix authoritative data correctness.** Prevent placeholder question text/correct answers from being persisted; align question ingestion contracts; preserve `mappingType`, Topic weight/complexity, Subtopic depth and skill metadata where those are real domain fields; stop persistence normalizers from injecting D1/I1 example educational content.

3. **P0 — Activate CI enforcement.** Restore an active quality workflow; require lint, typecheck, boundary checks, security tests, unit/integration tests and build; configure protected-branch required checks. Until this happens, architecture regression protection is optional rather than institutional.

4. **P1 — Establish canonical shared contracts.** Create authoritative schemas/DTOs for Domain, Subject, Topic, Subtopic, Skill and Question. Remove parallel `text/questionText`, `order/orderIndex`, skill-category variants, complexity variants and multiple independent question validators. Client preview validation may reuse the same schemas while server validation remains authoritative.

5. **P1 — Refactor Educational Taxonomy persistence boundary.** Move taxonomy HTTP routes from direct Drizzle to a small `EducationalTaxonomyService → TaxonomyRepository` architecture. Do not create a repository per tiny entity unless implementation evidence justifies it.

6. **P1 — Refactor Tutorial Sidebar server boundary.** Extract hierarchy synchronization, cross-database orchestration and Sidebar persistence from the 945-line HTTP route. Preserve the existing strong `sidebar-schema`, navigation validation, ID normalization and parser modules.

7. **P1 — Unify hierarchy querying.** Replace the independent hierarchy implementations in taxonomy hooks/tables, Composer, Sidebar and selectors with one typed hierarchy query/read-model layer, with intentional paginated catalogue versus selector/snapshot APIs.

8. **P1 — Add typed domain/API errors.** Replace frontend guessed messages with codes such as `DOMAIN_HAS_CHILDREN`, `VERSION_CONFLICT`, `DUPLICATE_QUESTION`, etc. Unknown infrastructure failures should receive generic client responses and structured server logs.

9. **P1 — Bring normal Composer saves up to suggestion-application concurrency standards.** Reuse existing version-aware repository mutation so ordinary editor saves send `expectedVersion` and cannot silently overwrite another admin's changes.

10. **P1 — Fix brand resolution and isolation details.** Make exact-brand-versus-shared lookup deterministic; resolve the RTH identity hard-coding inside `AdminLockScreen`; centralize brand configuration where practical; keep shared tutorial storage brand-neutral.

11. **P1 — Separate Project LLM operational, reference and experimental surfaces.** Live Operations must use backend/current scan only; Architecture Reference may use the static 18-family/133-version corpus; Experimental Planning may use prototypes but must not produce PASS/APPROVED/CERTIFIED state.

12. **P1 — Decompose the biggest orchestration components.** Split Integration Certification into focused hooks/panels; split Sidebar builder orchestration; gradually simplify taxonomy tables through query/mutation hooks. Do not create class-heavy frameworks.

13. **P2 — Complete Tutorial block registry ownership.** Enforce unique `(family, version)` registration, remove duplicate O1 ownership, add generated-version schemas, separate editor defaults from persistence validation, and gradually move hydration/title/default-version behavior into the existing lifecycle contract.

14. **P2 — Improve resilience and derived-data consistency.** Replace fire-and-forget vector indexing with durable outbox/retry/reconciliation; establish cache invalidation recovery policy; introduce bounded concurrency for expensive duplicate detection and job polling.

15. **P2 — Clean prototype/dead UI.** Clearly label or replace static dashboard metrics, layman-architecture audit claims, notification counts and placeholder navigation. Remove `href="#"`, `{false && ...}` blocks, unused search controls, and the unreachable Tutorial Block Composer body.

16. **P2 — Expand architecture enforcement.** Add simple AST/import checks preventing `app/api` routes from importing DB packages except approved infrastructure boundaries, UI from importing `app/api` implementation modules, and governance pages from consuming static fixtures for authoritative decisions.

17. **P2 — Tighten typing after contracts stabilize.** Remove high-risk `any`, index-signature catch-alls and unnecessary casts. Only then consider promoting `no-explicit-any` and selected lint warnings to CI errors to avoid a noisy big-bang cleanup.

18. **P3 — Operational qualification.** Once P0/P1 remediation is in place, run measured build/typecheck/lint/tests, API/security contract suites, concurrency tests, failure-injection/reconciliation checks and load tests. Record actual evidence rather than static UI assertions.

---

## Recommended implementation order

We should **not start by refactoring the largest file**.

The safest first implementation batch is:

```text
Batch 1
Trust + evidence correctness + CI

Batch 2
Canonical contracts

Batch 3
Taxonomy service/repository boundary

Batch 4
Tutorial Sidebar boundary

Batch 5
Composer concurrency + block contract fixes

Batch 6
Project LLM UI decomposition/reference separation

Batch 7
Observability/resilience

Batch 8
UI/prototype/dead-code cleanup

Batch 9
Full re-audit against Gates 1A–1H
```

That sequence minimizes regression risk because contracts and enforcement are established **before** the larger structural refactors.

### Formal baseline decision

I now consider the **`apps/skillhubcore-admin` architecture baseline review CLOSED** for this phase.

That does **not** mean every source line in the entire monorepo has been reviewed; it means the SkillHubCore Admin app and every architecturally material dependency path needed for Gates 1A–1H have been examined sufficiently to make implementation decisions without guesswork.

The next action should therefore no longer be another broad review pass.

It should be **Implementation Batch 1: P0 trust/evidence correctness + CI enforcement**, with small controlled commits, tests after each change, and a re-audit of the resulting HEAD before proceeding to canonical-contract work.