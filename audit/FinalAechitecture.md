# Scaling Real Tutorial Hub and SkillUp IT Academy to millions of users

For both brands to serve millions of users, your platform must qualify across more than just server capacity. It needs to meet requirements for scalability, availability, performance, security, data isolation, operational reliability, and cost efficiency.

Given your architecture—Real Tutorial Hub (RTH) and SkillUp IT Academy (SkillUp) as independent brands, with SkillHubCore providing shared services and a shared identity system—the key is to scale the shared platform without allowing one brand's traffic, data, or failures to negatively affect the other.

First, distinguish these two goals:

- Millions of registered users: Users may sign up over months or years.
- Millions of concurrent users: A very large number are actively using the platform at the same time. This is much harder and requires capacity planning based on workload.

You should design for both, but establish explicit targets for concurrent traffic, request rates, and service availability.

## 1. Define measurable qualification parameters

The following is a practical starting point for an education platform. These are proposed engineering targets, not a certification standard or a claim that your current deployment already meets them.

| Parameter               | Initial target                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Registered users        | 1M, 5M, 10M+ roadmap                                                               |
| Concurrent active users | Explicitly define; test 10k, 50k, 100k+ stages                                     |
| API throughput          | Capacity based on peak requests/sec (RPS), not user count alone                    |
| Availability            | 99.9% baseline; 99.95%+ for critical identity and learning APIs                    |
| API latency             | p95 under 300 ms for common reads; p95 under 500 ms for normal writes              |
| Error rate              | Under 0.1% for critical user-facing requests, excluding expected client errors     |
| Recovery                | Document and test Recovery Time Objective (RTO) and Recovery Point Objective (RPO) |
| Security                | No unresolved critical/high security findings before major scale-up                |
| Data integrity          | No cross-brand data exposure; tested backup restoration                            |
| Cost                    | Cost per 1,000 active users and cost per learning session tracked                  |

Availability should be measured by user-facing service, not simply by whether a server is running. Google Cloud's reliability guidance emphasizes redundancy, fault tolerance, monitoring, and recovery.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.cloud.google.com\&sz=32)

docs.cloud.google.com



### Why concurrent users and RPS matter

For example, assume 1 million users are registered, 100,000 are active during a peak period, and each active user averages one API request every 10 seconds:

\\[ 100{,}000 / 10 = 10{,}000\ \text{requests/sec} \\]

That is an illustrative average. Real peaks can be much higher because users arrive together, refresh dashboards, start exams, or open lessons at the same time. Your capacity tests need to model those bursts.

## 2. Infrastructure and architecture requirements

Your current technology stack can support a scaling strategy, but each layer must be designed and tested for its own bottlenecks.

Users across both brands

Web, mobile, faculty, admin, learners

Cloudflare Edge

DNS · CDN · WAF · DDoS protection · caching

API Gateway

Brand resolution · authentication · rate limits · routing

RTH services

Learning · quizzes · brand data

SkillUp services

Learning · assessments · brand data

Shared SkillHubCore capabilities

Global identity · shared services · event processing

Brand databases

rth_prod · skillup_prod

Global identity DB

people_prod

### A. Frontend delivery

Your Next.js applications should qualify for:

- CDN delivery of static assets, images, fonts, and public tutorial content.
- Minimal JavaScript on pages that do not need interactivity.
- Lazy loading for large lesson sections, diagrams, and media.
- Responsive performance on low-end mobile devices and slower networks.
- Cacheable public content, with authenticated and personalized responses kept private.
- Separate cache keys and hostname handling for RTH and SkillUp.

For user experience, aim for good Core Web Vitals at the 75th percentile: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://web.dev\&sz=32)

web.dev+1



### B. API gateway and services

Your Cloudflare Worker gateway and Cloud Run services should demonstrate:

- Horizontal scaling under increasing request load.
- Correct autoscaling limits and concurrency configuration.
- Request timeouts, retry policies, and circuit breakers.
- Rate limits by IP, user, API key, and sensitive business operation.
- No dependency on in-memory session state across instances.
- Graceful handling of downstream service failures.
- Separate scaling policies for high-load services, such as quizzes, tutorial APIs, and identity.

Important: autoscaling alone is not sufficient. If the API scales to 100 instances but the database can support only a small number of connections, the database becomes the bottleneck.

### C. Database scalability

Your `people_prod`, `rth_prod`, and `skillup_prod` databases need a dedicated capacity and reliability plan.

| Area                  | Required qualification                                           |
| --------------------- | ---------------------------------------------------------------- |
| Connection management | Pooling, connection limits, no connection storms                 |
| Query performance     | Slow-query analysis, indexes, execution-plan review              |
| Read traffic          | Evaluate read replicas or caching where appropriate              |
| Write traffic         | Identify write-heavy tables and contention                       |
| Large tables          | Partitioning or archival strategy where justified                |
| Backups               | Automated backups and tested restore procedures                  |
| Migration             | Safe migrations, rollback strategy, compatibility during rollout |
| Isolation             | Brand-specific authorization and database access controls        |

Do not start by sharding every database. First measure the actual bottleneck. Partitioning, read replicas, caching, and query optimization may be sufficient for a substantial period.

## 3. Security and brand isolation requirements

For your shared identity architecture, security must scale with traffic—not be weakened to improve throughput.

| Security parameter   | What must be demonstrated                                                       |
| -------------------- | ------------------------------------------------------------------------------- |
| Authentication       | Secure login, refresh, logout, token expiry and revocation                      |
| Authorization        | Every protected resource checks ownership and permission                        |
| Brand isolation      | RTH users cannot access SkillUp-only resources, and vice versa                  |
| Tenant/brand context | Brand identity is validated server-side, not trusted from client input          |
| API protection       | Rate limiting, request validation, abuse detection                              |
| Secrets              | Managed secrets, rotation, no secrets in source code                            |
| Auditability         | Logs for privileged actions and security-sensitive events                       |
| Abuse resistance     | Protection against account creation abuse, scraping, exam abuse and brute force |

OWASP's API Security Top 10 highlights broken object-level authorization, broken authentication, unrestricted resource consumption, and sensitive business-flow abuse as important API risks.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://owasp.github.io\&sz=32)

OWASP Foundation+1



For your platform, the most important test is not merely “Can the user log in?” It is:

> Can a user authenticated through one brand access only the resources, services, and permissions they are entitled to—under normal load, peak load, and failure conditions?

## 4. Learning-platform-specific scalability

Your educational platform has workload patterns that a general website may not have.

| Workload               | Main scaling concern                                    |
| ---------------------- | ------------------------------------------------------- |
| Tutorial pages         | Content delivery, media bandwidth, caching              |
| Large classes          | Many users opening the same lesson simultaneously       |
| Online exams           | Concurrent exam starts, submissions, answer persistence |
| Question banks         | Query performance, randomization, data integrity        |
| ILS telemetry          | High-volume event writes and ingestion spikes           |
| PDF generation         | CPU/memory-intensive generation jobs                    |
| AI question generation | Model throughput, queueing, token/cost limits           |
| Reports and analytics  | Expensive aggregations and large data scans             |

For ILS telemetry, avoid making every learner interaction wait for heavy analytics processing. Capture events reliably, then process aggregates asynchronously where possible.

For exam submissions, however, reliability and correctness take priority over eventual processing. You need durable submission storage, idempotency, duplicate-submission protection, and recovery from interrupted requests.

## 5. Observability and operational readiness

Your team should be able to answer these questions immediately during a traffic surge:

- Which brand is experiencing the problem?
- Which service is saturated?
- Is the bottleneck CPU, memory, database connections, query latency, or network?
- Are users receiving errors, or are requests simply becoming slow?
- Is the gateway rejecting requests due to rate limits?
- Is autoscaling keeping up with demand?
- How much is the current traffic costing?

At minimum, monitor:

- Request rate, latency, and error rate per service.
- p50, p95, and p99 latency.
- CPU, memory, instance count, and concurrency.
- Database connections, query latency, locks, and pool saturation.
- Queue depth and processing delay.
- Authentication failures and rate-limit events.
- Cost by service and by brand.

A practical operational objective is to detect a major service degradation within 1–2 minutes and have a documented response procedure.

## 6. Load testing and qualification gates

Do not declare the platform “ready for millions” based on a successful test with a few hundred users.

Use staged qualification:

| Gate   | Suggested test                    |
| ------ | --------------------------------- |
| Gate 1 | 1,000 concurrent users            |
| Gate 2 | 10,000 concurrent users           |
| Gate 3 | 50,000 concurrent users           |
| Gate 4 | 100,000+ concurrent users         |
| Gate 5 | Target peak traffic plus 2× burst |
| Gate 6 | Failure testing during load       |

At each gate, test both brands independently and together.

Include scenarios such as:

1. Users logging in simultaneously.
2. Users opening the same tutorial.
3. Users navigating between tutorial sections.
4. Users starting and submitting quizzes.
5. Users generating reports.
6. Users submitting telemetry events.
7. A database or service becoming temporarily unavailable.
8. A traffic surge while autoscaling is active.

Use realistic test data and realistic user journeys. A load test that only sends requests to a health endpoint does not qualify the learning platform.

## 7. The architecture decision I recommend

For your platform, I would retain the current modular multi-application architecture and qualify it incrementally.

Do not automatically convert everything into microservices. Instead:

- Keep shared domain logic in well-defined packages.
- Independently scale high-load services.
- Separate critical identity operations from heavy learning workloads.
- Use asynchronous processing for telemetry, reports, and other non-critical background work.
- Maintain independent brand data and authorization boundaries.
- Introduce additional database infrastructure only when measured demand justifies it.

The objective is not to have the maximum number of services. The objective is to ensure that one million users—or eventually several million—can access the platform without service degradation, data leakage, or uncontrolled infrastructure costs.

## 8. What I would qualify first in your project

The highest-priority sequence would be:

1. Identity and brand isolation: prove that shared authentication remains secure across both brands.
2. Database connection and query capacity: establish the real limits of the three production databases.
3. Gateway and API autoscaling: validate request throughput and latency.
4. Tutorial delivery: make content delivery efficient and cacheable.
5. Exam and quiz reliability: validate simultaneous starts, answer saves, and submissions.
6. ILS and background workloads: prevent telemetry and analytics from overwhelming user-facing APIs.
7. Disaster recovery: test backup restoration and service recovery.
8. Cost qualification: calculate cost at 10k, 50k, and 100k concurrent users.

My recommendation: create a formal Million-User Readiness Qualification with measurable pass/fail gates. The next useful step is to map your existing Cloudflare, Cloud Run, Neon, gateway, and database configuration against these parameters, then identify which requirements are already satisfied and which still need implementation or testing.

Yes. Before investing in infrastructure to support millions of users, we should establish the architectural and coding foundation that makes scaling possible.

A platform can have powerful servers and still fail at scale if its code has tightly coupled modules, uncontrolled database access, inconsistent authorization, duplicated business logic, or unreliable error handling.

For your Real Tutorial Hub and SkillUp IT Academy ecosystem, I suggest we discuss this in the following order:

1. Architecture principles — what the system must always preserve.
2. Repository and module boundaries — how code is organized and dependencies flow.
3. Coding standards — how developers and AI coding agents write code consistently.
4. API and service contracts — how applications communicate.
5. Data-access standards — how databases are accessed safely and efficiently.
6. Authentication, authorization, and brand isolation — how identity and access are enforced.
7. Testing and quality gates — how code is accepted.
8. Scalability and operational readiness — how we prove the foundation works under load.

The important distinction is that architecture defines the boundaries; coding standards enforce those boundaries; tests prove that the boundaries are respected.

## 1. Architecture foundation I recommend

Your project should follow a modular, multi-application architecture with selectively distributed services.

This fits your existing Turborepo/pnpm monorepo and avoids two extremes:

- A tightly coupled monolith where every change affects everything.
- Premature microservices where every small capability becomes a separate service with unnecessary operational complexity.

The architecture should support independent applications, well-defined shared packages, and independently scalable services where workload requires it.

### Proposed logical architecture

Presentation layer

RTH Web · SkillUp Web · Quiz · Admin · Faculty

API and application layer

Gateway · Application services · Request validation

RTH domain

Learning · Quiz · Brand rules

SkillUp domain

Learning · Assessment · Brand rules

Shared platform domain

Identity · Shared capabilities · Events · Observability

Infrastructure and persistence

Brand databases · Global identity DB · Cache · Queues · Object storage

This is a logical architecture, not a requirement that every box be a separate deployable service.

## 2. The core coding principles

Every application, package, and service should follow these principles.

| Principle            | What it means in your code                                       |
| -------------------- | ---------------------------------------------------------------- |
| High cohesion        | A module owns one clear responsibility                           |
| Low coupling         | Modules communicate through defined contracts                    |
| Dependency direction | Business rules do not depend on UI or infrastructure             |
| Explicit contracts   | APIs, events, and shared types are defined and versioned         |
| Single ownership     | Each business rule has one authoritative implementation          |
| Secure by default    | Authorization is enforced server-side                            |
| Brand isolation      | Brand context is explicit and validated                          |
| Testability          | Business logic can be tested without running the entire platform |
| Observability        | Errors, latency, and important operations are traceable          |
| Change safety        | Changes are covered by tests and compatible migrations           |

### The most important rule: dependency direction

For example, a tutorial feature should not directly depend on a React component or a database driver.

A preferred dependency flow is:

```
Application / API
       ↓
Business domain
       ↓
Defined interfaces
       ↑
Infrastructure implementations
```

This lets you change the database, API framework, or deployment configuration without rewriting the business rules.

## 3. Coding standards must be enforceable

We should not create a document that developers read once and ignore.

The standards need to be enforced through:

- TypeScript strict mode.
- ESLint and formatting rules.
- Dependency-boundary checks.
- Unit and integration tests.
- API contract validation.
- Database migration checks.
- Security checks.
- CI pipeline pass/fail gates.
- Code review requirements.

A coding standard is useful only when the repository can detect violations automatically wherever practical.

## 4. The architecture decisions we should settle first

Before writing a large coding-standard document, I recommend that we explicitly decide these questions:

1. Module boundaries: What belongs to an app, a shared package, or a separately deployable service?
2. Business logic ownership: Which module owns each business rule?
3. Dependency rules: Which packages and services are allowed to depend on which others?
4. Data ownership: Which service owns each database table and data lifecycle?
5. Brand context: How is brand identity established, validated, and propagated?
6. Communication: When should modules use direct function calls, APIs, or asynchronous events?
7. Quality gates: What must pass before code can merge or deploy?

These decisions become the foundation for your coding standards and AI coding-agent instructions.

## My recommendation for our discussion

Let's begin with Architecture Principle 1: Module and Service Boundaries.

We should define exactly how code is divided across:

- `apps/*` — user-facing applications.
- `packages/*` — reusable libraries and domain modules.
- `services/*` — independently deployable backend services.
- Database packages — controlled access to persistence.
- Shared platform capabilities — identity, authorization, events, and observability.

Once we settle those boundaries, we can define the coding standards that every developer and AI coding agent must follow.

Yes. SOLID, DRY, KISS, YAGNI, and other software engineering principles are exactly the kind of foundation we should establish before defining coding standards for your platform.

They help developers write code that is easier to understand, maintain, test, extend, and scale.

Let's understand them with examples relevant to your Real Tutorial Hub, SkillUp IT Academy, and SkillHubCore architecture.

# 1. SOLID principles

SOLID is a set of five object-oriented design principles.

### S

Single Responsibility Principle (SRP)

A module or class should have one primary responsibility and one coherent reason to change.

Example: `TutorialService` handles tutorial business rules. `TutorialRepository` handles tutorial persistence. Avoid combining both in one massive class.

### O

Open/Closed Principle (OCP)

Software should be open for extension but closed for modification.

Example: Adding a new tutorial section type should ideally use the existing section registry and renderer rather than requiring changes throughout the entire Tutorial Engine.

### L

Liskov Substitution Principle (LSP)

A subtype or implementation should be usable wherever its parent contract is expected without breaking behavior.

Example: Any implementation of a `TutorialRepository` contract must honor its documented behavior, whether it uses Neon PostgreSQL or a test implementation.

### I

Interface Segregation Principle (ISP)

Consumers should not be forced to depend on interfaces containing methods they do not need.

Example: A learner-facing tutorial client should not need admin-only methods such as `approveTutorial()` or `publishTutorial()`.

### D

Dependency Inversion Principle (DIP)

High-level business logic should depend on abstractions, not directly on low-level infrastructure implementations.

Example: Tutorial business logic depends on a repository interface rather than importing Drizzle or a Neon database client directly.

## 2. DRY — Don't Repeat Yourself

DRY means each piece of knowledge should have one authoritative representation.

Suppose both RTH and SkillUp use the same rule for validating a tutorial section.

Bad approach:

```
// RTH application
if (section.title.length > 100) {
  throw new Error("Invalid title");
}

// SkillUp application
if (section.title.length > 100) {
  throw new Error("Invalid title");
}
```

If the rule changes, both implementations must be updated. One could be missed.

Better approach:

```
// packages/validation/src/tutorial-section.ts

export function validateTutorialTitle(
  title: string,
): boolean {
  return title.trim().length > 0 &&
    title.length <= 100;
}
```

Both brands use the same validation function.

Important: DRY does not mean that every similar-looking line of code must be shared.

Two pieces of code may look similar but represent different business rules. Forcing them into one abstraction can create more complexity than duplication.

# 3. KISS — Keep It Simple, Stupid

Prefer the simplest design that correctly solves the problem.

For example, if your tutorial page needs to load one tutorial section, do not introduce:

- Five layers of abstraction.
- Multiple unnecessary services.
- A complicated event system.
- A generic framework that handles every possible future scenario.

Use a simple implementation with clear boundaries.

However, simple does not mean insecure or poorly structured. A secure authorization check should not be removed just to make the code shorter.

# 4. YAGNI — You Aren't Gonna Need It

Do not implement speculative features before there is a real requirement.

For example, you may eventually support 20 brands. But if the current product has RTH and SkillUp, avoid building a highly generic multi-tenant framework with dozens of configuration layers unless there is a concrete need.

Build the architecture so it can evolve, but avoid implementing hypothetical functionality prematurely.

This is particularly important when building a platform intended to support millions of users. Overengineering can make the system harder to operate before it has meaningful traffic.

# 5. Separation of Concerns (SoC)

Each part of the system should focus on a distinct concern.

For example:

| Concern        | Responsibility                               |
| -------------- | -------------------------------------------- |
| UI             | Display content and handle user interactions |
| API            | Receive requests and return responses        |
| Business logic | Enforce domain rules                         |
| Data access    | Read and write database records              |
| Authentication | Establish who the user is                    |
| Authorization  | Decide what the user may do                  |
| Observability  | Capture logs, metrics, and traces            |

A React component should not directly implement database authorization rules.

An API route should not contain a large amount of duplicated business logic.

# 6. Composition over inheritance

Prefer assembling behavior from smaller components rather than creating deep inheritance hierarchies.

For your Tutorial Engine, composition is especially useful.

A tutorial page can be composed from:

- Introduction section
- Objective section
- Notes section
- Code section
- Practice section
- Quiz section
- Summary section

Each section can have its own renderer and validation rules while the overall page composes them.

This aligns well with your existing modular `tutorial_sections` architecture.

# 7. Other important principles

| Principle                     | Meaning                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| Least Privilege               | Give users, services, and modules only the permissions they need      |
| Fail Fast                     | Detect invalid inputs and configuration errors early                  |
| Explicit over Implicit        | Make dependencies and behavior visible rather than hidden             |
| Immutable Data                | Avoid unexpected mutation of shared data                              |
| Idempotency                   | Repeating an operation should not create unintended duplicate effects |
| Law of Demeter                | A module should avoid navigating deeply through unrelated objects     |
| Convention over Configuration | Use consistent defaults instead of unnecessary configuration          |
| Encapsulation                 | Hide internal implementation details behind a clear public interface  |

For example, idempotency is critical for your exam submission API. If a learner clicks Submit twice, or the client retries after a network failure, the system should not create two separate submissions.

# 8. How these principles fit your architecture

Example: Tutorial application

API route

Validates request and authenticates the caller

Tutorial application service

Applies tutorial business rules

Tutorial repository interface

Defines the required data-access contract

Drizzle / Neon implementation

Performs database operations

This structure applies several principles together:

- SRP: Each layer has a distinct responsibility.
- DIP: Business logic depends on a repository contract.
- SoC: API, business rules, and persistence are separated.
- DRY: Shared business rules are implemented once.
- KISS: The system uses only the layers needed for a clear separation.

It also helps testing. You can test the tutorial service without starting the actual database.

## 9. What should become mandatory for your project?

I would divide the standards into three categories.

Mandatory architectural principles

- SOLID where applicable.
- DRY without forcing artificial abstractions.
- Separation of Concerns.
- Least Privilege.
- Explicit dependency boundaries.
- Single ownership of business rules.
- Secure-by-default behavior.

Mandatory implementation principles

- KISS.
- YAGNI.
- Type safety.
- Input validation.
- Consistent error handling.
- Idempotency for retryable operations.
- Unit, integration, and contract tests.

Mandatory operational principles

- Observability.
- Resilience and graceful failure.
- Database connection management.
- Safe migrations.
- Rate limiting.
- Performance testing.

One final point: these principles are not rigid laws. SOLID was developed primarily for object-oriented design, and TypeScript applications often benefit from functional programming, composition, and simpler module-level functions as well.

For your platform, the goal should be clean, modular, secure, testable code—not applying every principle mechanically.

Yes. These principles should apply throughout your entire project—every page, component, API, service, package, database interaction, and background job.

However, they should be applied according to the responsibility of each layer. We should not force every principle into every component mechanically.

For your RTH + SkillUp + SkillHubCore platform, I recommend the following standard.

## 1. Where should these principles apply?

| Code area                    | Principles to follow                        |
| ---------------------------- | ------------------------------------------- |
| Pages and layouts            | SoC, KISS, DRY                              |
| React components             | SRP, composition, KISS                      |
| Custom hooks                 | SRP, DRY, explicit dependencies             |
| API routes/controllers       | SRP, SoC, input validation                  |
| Business services            | SOLID, DRY, testability                     |
| Database repositories        | SRP, DIP, data ownership                    |
| Authentication/authorization | Least Privilege, secure by default          |
| Shared packages              | DRY, stable contracts, low coupling         |
| Background jobs              | Idempotency, resilience, observability      |
| Tests                        | Isolation, determinism, meaningful coverage |

## 2. Example: A page should not do everything

Imagine a Tutorial Page.

### Bad design

```
export default function TutorialPage() {
  // Fetches data
  // Checks authentication
  // Checks authorization
  // Implements business rules
  // Processes database records
  // Tracks ILS telemetry
  // Renders the entire page
  // Handles all user interactions
}
```

This component becomes difficult to maintain and test. A change in one concern may affect many others.

### Better design

```
TutorialPage
│
├── TutorialHeader
├── TutorialSidebar
├── TutorialContent
│   ├── IntroductionSection
│   ├── NotesSection
│   ├── CodeSection
│   └── QuizSection
├── TutorialProgress
└── TutorialNavigation
```

The page composes smaller components.

Business logic and data access are handled outside the presentation components.

This is particularly relevant to your existing modular Tutorial Engine, which already supports multiple section types.

## 3. What does SRP mean for a component?

A component should have one coherent responsibility.

For example:

```
<TutorialProgress
  completedSections={completedSections}
  totalSections={totalSections}
/>
```

`TutorialProgress` displays progress.

It should not also:

- Fetch tutorial content.
- Verify the user's permissions.
- Update the database.
- Generate quiz questions.
- Track analytics events.

Those are different responsibilities.

But do not go too far in the other direction.

A component containing a heading, icon, and text does not necessarily need three separate components. SRP is about responsibility, not the number of lines of code.

## 4. Should every component be reusable?

No.

This is an important distinction.

| Component type             | Expected behavior                   |
| -------------------------- | ----------------------------------- |
| Generic Button             | Reusable across applications        |
| Modal                      | Reusable where appropriate          |
| TutorialSectionRenderer    | Reusable within the Tutorial Engine |
| RTH-specific landing page  | May remain RTH-specific             |
| SkillUp-specific dashboard | May remain SkillUp-specific         |

DRY does not mean that every component must be placed in a shared package.

A shared component should be created when there is a genuine shared responsibility and stable interface.

Otherwise, keeping code local is often cleaner.

## 5. The standard we should enforce

I would establish this as a mandatory engineering rule:

> Every page, component, hook, service, package, and API must have a clearly defined responsibility. It must minimize unnecessary dependencies, reuse existing authoritative business logic, enforce appropriate security boundaries, and remain independently testable wherever practical. Abstractions must be introduced only when they provide meaningful value.

This standard should be enforced through code review, automated linting, dependency checks, and testing.

## 6. One distinction for your project

Your project has two different kinds of code:

Presentation code

- React pages
- Components
- Layouts
- Hooks
- UI state

Platform code

- APIs
- Business logic
- Database access
- Authentication
- Authorization
- Events
- Background processing

Both must follow SOLID, DRY, KISS, and Separation of Concerns—but the implementation will differ.

For example, a React component should not directly depend on a database driver. A backend service should not depend on a React component.

That separation is essential for your platform to scale cleanly.

So yes: these principles should become project-wide engineering standards, not merely guidelines for writing individual functions.

# Database architecture for RTH, SkillUp, and SkillHubCore

The database architecture should be defined as part of the platform's core architecture—not as a collection of tables created independently by each developer.

For your platform, we need to decide:

1. Which database owns each type of information.
2. Which application or service is allowed to access it.
3. How brand data is isolated.
4. How relationships between global identity and brand-specific users are maintained.
5. How database schemas evolve safely.
6. How the database can handle millions of users and high concurrent workloads.

Your existing architecture already has an important starting point:

- `people_prod` — global identity.
- `rth_prod` — Real Tutorial Hub data.
- `skillup_prod` — SkillUp IT Academy data.
- `quiz_platform_prod` — legacy database being phased out.

I would preserve the principle of separate brand data and shared identity, while defining stronger ownership and access rules around it.

## 1. Recommended logical database architecture

Shared Identity Platform

`people_prod`

Global users · Identity · Credentials · Identity-to-brand links

Identity reference / validated identity context

RTH data domain

`rth_prod`

RTH profiles

Courses and tutorials

Learning progress

Assessments

SkillUp data domain

`skillup_prod`

SkillUp profiles

Courses and tutorials

Learning progress

Assessments

Shared platform capabilities

SkillHubCore · Shared service data · Events · Operational metadata

This is a logical ownership model. It does not require every domain to have a separate physical database server from day one.

The important requirement is that every data domain has a clear owner and an explicit access contract.

## 2. Database ownership must be explicit

Every table should have one authoritative owner.

For example:

| Data                             | Authoritative owner                                |
| -------------------------------- | -------------------------------------------------- |
| Global user identity             | `people_prod`                                      |
| Authentication credentials       | Identity domain                                    |
| Global user ID                   | Identity domain                                    |
| RTH learner profile              | `rth_prod`                                         |
| SkillUp learner profile          | `skillup_prod`                                     |
| RTH course enrollment            | `rth_prod`                                         |
| SkillUp course enrollment        | `skillup_prod`                                     |
| RTH tutorial progress            | `rth_prod`                                         |
| SkillUp tutorial progress        | `skillup_prod`                                     |
| Shared identity-to-brand mapping | `people_prod`                                      |
| Brand-specific permissions       | Brand domain, according to the authorization model |
| Shared service operational state | Owning SkillHubCore service                        |

This prevents a dangerous situation where two applications independently modify the same business information.

### A key rule

A service should be the authoritative writer for the data it owns.

For instance, the RTH application should not directly modify SkillUp enrollment records just because it has database credentials.

Cross-brand operations should go through a defined service/API contract or a controlled administrative workflow.

## 3. Global identity and brand-specific data

Your global identity model should separate the identity of a person from their relationship with a brand.

Conceptually:

```
people_prod
│
├── users
│   └── id
│
├── identity_credentials
│
└── user_brand_memberships
    ├── user_id
    ├── brand_id
    ├── brand_user_id
    └── status
```

Brand databases then reference the global identity ID:

```
rth_prod
│
├── learner_profiles
│   └── global_user_id
│
├── enrollments
│
└── tutorial_progress
```

```
skillup_prod
│
├── learner_profiles
│   └── global_user_id
│
├── enrollments
│
└── tutorial_progress
```

The `global_user_id` is the identity link.

A user might have an identity in `people_prod` and a profile in one brand database, or profiles in both brand databases.

Do not assume that having a global identity automatically means the user has access to both brands. Membership and authorization must be checked independently.

Also, if these are physically separate PostgreSQL databases, do not assume ordinary PostgreSQL foreign keys can enforce relationships across them. Cross-database relationships need application-level validation or a deliberately designed integration mechanism.

## 4. Database schema standards

Each database should follow a consistent schema design standard.

### A. Relational integrity

Use appropriate:

- Primary keys.
- Unique constraints.
- Foreign keys within the database.
- `NOT NULL` constraints.
- Check constraints.
- Referential integrity.
- Explicit deletion behavior.

For example, an enrollment should not be created without a valid learner and course within its owning brand domain.

Do not rely exclusively on frontend validation.

### B. Normalization and controlled denormalization

Use normalized relational tables for authoritative business data.

For example:

```
courses
  └── course_modules
        └── tutorials
              └── tutorial_sections
```

Your existing modular `tutorial_sections` model fits this approach well.

However, normalization is not an absolute requirement for every read. For high-volume read workloads, controlled denormalization, caching, or materialized views may be appropriate.

The rule should be:

> Normalize authoritative data first. Denormalize only for a measured performance or operational reason, and document how the denormalized data stays consistent.

### C. Indexing standards

Every table should be reviewed for:

- Primary-key access.
- Foreign-key access.
- Common filtering conditions.
- Sorting and pagination.
- Unique business constraints.
- High-frequency queries.

For example, a tutorial progress query may need an index covering the learner and tutorial identifiers.

But avoid creating indexes on every column. Indexes consume storage and add write overhead.

## 5. Database access architecture

This is one of the most important architectural decisions.

I recommend the following dependency structure:

```
API Route / Controller
        ↓
Application Service
        ↓
Domain Rules
        ↓
Repository Interface
        ↓
Database Repository
        ↓
Drizzle ORM
        ↓
PostgreSQL / Neon
```

The API route should not contain arbitrary SQL queries.

The business service should not import the database connection directly.

Instead, database operations should be encapsulated in repositories or equivalent data-access modules.

Example:

```
// Application service
export class TutorialProgressService {
  constructor(
    private readonly progressRepository:
      TutorialProgressRepository,
  ) {}

  async getProgress(
    userId: string,
    tutorialId: string,
  ) {
    return this.progressRepository
      .findByUserAndTutorial(
        userId,
        tutorialId,
      );
  }
}
```

This is illustrative code, not a claim about the current implementation.

The benefits are:

- Easier testing.
- Consistent query behavior.
- Centralized data-access rules.
- Better control over database connections.
- Less accidental coupling between services and persistence.

## 6. How database access should work across the brands

For your platform, I would establish this rule:

| Access pattern                                 | Decision                              |
| ---------------------------------------------- | ------------------------------------- |
| RTH service accesses RTH data                  | Allowed through its data-access layer |
| SkillUp service accesses SkillUp data          | Allowed through its data-access layer |
| Shared identity service accesses identity data | Allowed                               |
| RTH service directly modifies SkillUp tables   | Prohibited by default                 |
| SkillUp service directly modifies RTH tables   | Prohibited by default                 |
| Reporting service reads both brands            | Controlled, read-only integration     |
| Admin service accesses multiple brands         | Explicitly authorized and audited     |

A shared analytics service may need data from both brands. That does not mean it should have unrestricted write access to both databases.

For reporting, use controlled read models, events, or dedicated reporting datasets where appropriate.

## 7. Database scalability standards

Millions of users do not necessarily require sharding immediately.

The database architecture should support a progression:

Stage 1 — Optimize

Query tuning · Indexes · Connection pooling · Efficient pagination

Stage 2 — Scale reads

Caching · Read replicas · Materialized views · Read models

Stage 3 — Scale writes and workloads

Partitioning · Workload separation · Queue-based processing

Stage 4 — Advanced distribution

Sharding or additional database clusters when measured limits justify them

The exact stage depends on real workload measurements.

### Special consideration: ILS telemetry

Your tutorial system has high-volume events such as block visits and active-time tracking.

These should be designed separately from critical transactional data.

For example:

- Exam submissions require durable transactional correctness.
- Tutorial telemetry can often be ingested asynchronously.
- Analytics aggregation should not block lesson rendering.
- Large event tables may eventually require partitioning or archival.

This distinction is critical for avoiding unnecessary load on the core learner database.

## 8. Database migrations and schema governance

Every database schema change should be treated as a controlled software change.

Mandatory rules:

1. Schema changes must be version-controlled.
2. Migrations must be reviewed.
3. Migrations must be tested against representative data.
4. Production changes must have a recovery plan.
5. Application and database changes should remain compatible during deployment.
6. Destructive migrations must not be casually combined with feature deployments.
7. Each migration should have a clear owner.

For a large platform, prefer an expand-and-contract migration pattern:

```
Add compatible schema
       ↓
Deploy application supporting old + new schema
       ↓
Backfill or migrate data
       ↓
Switch application to new schema
       ↓
Verify production behavior
       ↓
Remove old schema in a later deployment
```

This helps prevent deployment downtime.

## 9. Database architecture rules I would make mandatory

For your project, the following should become non-negotiable:

- Every table has a defined data owner.
- Every database has a defined service owner.
- No uncontrolled cross-brand database access.
- No direct database access from frontend code.
- No arbitrary SQL in API route handlers.
- All database access uses approved data-access modules.
- All user-owned records are protected by authorization checks.
- All migrations are version-controlled and reviewed.
- Connection pooling and query performance are monitored.
- Backup restoration is tested.
- Critical writes are transactional and idempotent where required.
- High-volume telemetry and analytics are isolated from critical transactional workloads.

## The architecture decision we should settle next

Before we define individual table structures, we should define the database ownership and access contract.

For each database, we need to specify:

| Decision            | What we must define                     |
| ------------------- | --------------------------------------- |
| Database owner      | Which service owns the data             |
| Schema owner        | Which team/package maintains the schema |
| Read access         | Which services can read the data        |
| Write access        | Which service can modify the data       |
| Identity linkage    | How global user IDs are referenced      |
| Brand isolation     | How cross-brand access is prevented     |
| Migration ownership | Who can change the schema               |
| Scaling strategy    | How the database will grow              |

My recommendation is to define this as a formal Database Architecture Standard before we move into table-level design. It will give every developer and AI coding agent a consistent rulebook for adding new tables, modifying existing schemas, and building new services without weakening the platform's architecture.

# How will your database handle millions of requests?

The key is this: a database does not handle millions of requests by making one database server process everything faster. It handles large workloads by distributing, limiting, optimizing, and avoiding unnecessary database work.

For your RTH + SkillUp + SkillHubCore platform, we need to design for:

- Millions of registered users.
- Thousands to hundreds of thousands of concurrent users.
- Potentially millions of database-related operations during peak periods.
- Reliable learning progress and exam submissions.
- Independent data ownership for RTH and SkillUp.

First, one important distinction:

| Metric               | Meaning                                   |
| -------------------- | ----------------------------------------- |
| Registered users     | Total accounts in the system              |
| Concurrent users     | Users actively using the platform         |
| API requests/sec     | Requests reaching your application        |
| Database queries/sec | Queries actually executed by the database |
| Database writes/sec  | Inserts, updates, and deletes per second  |

These numbers are not the same.

For example, 100,000 concurrent users do not necessarily mean 100,000 database queries every second. A well-designed system may serve many requests from a CDN, cache, or existing application state without querying the database at all.

## 1. The database request path

A scalable request should pass through multiple layers before reaching the database.

Millions of users

Cloudflare CDN / Edge

Serve static content and cache eligible responses

Application services

Validate · Authenticate · Authorize · Apply business rules

Cache

Fast reads

Connection pool

Bounded DB connections

PostgreSQL / Neon

Transactional data · Indexed queries · Controlled writes

The idea is to reduce how often the database is reached, and make each database operation efficient.

## 2. Caching: avoid repeated database queries

Imagine 50,000 learners open the same published tutorial.

Without caching:

```
50,000 learners
       ↓
50,000 API requests
       ↓
50,000 database reads
```

With an appropriate cache:

```
50,000 learners
       ↓
50,000 API requests
       ↓
Cache
       ├── 49,000 cache hits
       └── 1,000 database reads
```

The numbers are illustrative, not a performance guarantee.

Your platform could cache:

- Published tutorial content.
- Course catalogs.
- Public course metadata.
- Static question explanations.
- Non-personalized navigation structures.

Potential caching technologies include Cloudflare caching, Redis, or application-level caches.

### What should not be cached carelessly?

- Passwords or credentials.
- Sensitive personal information.
- Authorization decisions without appropriate invalidation.
- Current exam answers or submission state.
- Financial transactions.
- User-specific data under a shared cache key.

For example, a tutorial's published content may be cacheable, but a learner's personal progress must be isolated by user identity and brand.

## 3. Connection pooling: protect the database from connection overload

This is one of the most important parts of your architecture.

Suppose:

- 100 application instances are running.
- Each instance opens 100 database connections.

Then:

\\[ 100 \times 100 = 10{,}000 \\]

That can overwhelm a database even when the actual query workload is manageable.

Instead, use a controlled connection pool or database proxy.

```
100 application instances
          ↓
Connection pooling / proxy
          ↓
A bounded number of DB connections
          ↓
PostgreSQL
```

Your application instances should not create unlimited connections whenever traffic increases.

For your Cloud Run + Neon setup, the connection strategy must account for:

- Cloud Run instance scaling.
- Maximum connections per instance.
- Neon connection limits.
- Transaction pooling behavior.
- Long-running queries.
- Connection timeouts.
- Pool saturation.

The exact connection limits should be based on the selected Neon plan and measured workload.

Scaling the application must not accidentally multiply database connections without a limit.

## 4. Read replicas: separate heavy reads from writes

Most learning platforms have a read-heavy workload.

Examples:

- Opening course catalogs.
- Viewing published tutorials.
- Reading course details.
- Viewing dashboards.
- Retrieving reports.

A read replica can serve eligible read queries while the primary database handles writes.

Application services

Primary database

Writes · Transactions · Authoritative state

Read replica

Eligible reads · Reporting · Read-heavy queries

The primary replicates data to the read replica. Replication may be asynchronous.

Important: replicas may lag behind the primary.

If a learner submits an exam answer, the system should not immediately read from a lagging replica and incorrectly conclude that the answer was not saved.

Use the primary for read-after-write operations where consistency is required.

## 5. Database optimization: make each query efficient

Even with caching and replicas, poor queries can destroy performance.

Suppose a query scans 10 million records to find one learner's progress.

That is not a scaling strategy.

A good query should use appropriate indexes and retrieve only the required data.

For example:

```
SELECT section_id, status, updated_at
FROM tutorial_progress
WHERE user_id = $1
  AND tutorial_id = $2;
```

The database may benefit from a composite index on:

```
CREATE INDEX idx_tutorial_progress_user_tutorial
ON tutorial_progress (user_id, tutorial_id);
```

This is an example only. The real index should be selected after reviewing your actual schema and query plan.

Additional standards:

- Avoid `SELECT *` for large records.
- Avoid unbounded result sets.
- Use cursor/keyset pagination for large datasets where appropriate.
- Avoid N+1 query patterns.
- Review slow queries using query statistics and execution plans.
- Do not execute expensive reports inside normal user-facing request paths.

## 6. Separate critical writes from high-volume background events

Not every database write has the same importance.

For your platform:

| Operation             | Required behavior                         |
| --------------------- | ----------------------------------------- |
| Exam submission       | Durable, transactional, reliable          |
| Payment confirmation  | Transactional and idempotent              |
| Enrollment            | Consistent and authorized                 |
| Tutorial progress     | Reliable, with defined update semantics   |
| ILS block visits      | High-volume event ingestion               |
| Analytics aggregation | Asynchronous processing is often suitable |
| PDF generation        | Background job                            |

Consider ILS telemetry.

If 100,000 learners each generate 10 telemetry events in one minute:

\\[ \frac{100{,}000 \times 10}{60} \approx 16{,}667 \text{ events/sec} \\]

This is an illustrative scenario, not your measured traffic.

If every event directly triggers multiple database writes, the database can become overloaded.

A better architecture is:

```
Learner interaction
       ↓
ILS API
       ↓
Durable event queue
       ↓
Batch / stream processing
       ↓
Telemetry database tables
       ↓
Analytics and reporting
```

A queue such as Google Cloud Pub/Sub or another suitable messaging system can absorb bursts and allow controlled processing.

However, the queue must be durable, monitored, and designed for retries. It must not silently lose events.

And do not use this asynchronous pattern indiscriminately: exam submission and other critical transactional operations need stronger consistency guarantees.

## 7. Partitioning: divide very large tables

Some tables may grow to hundreds of millions or billions of records.

For example:

- `ils_block_visits`
- `ils_block_active_time`
- Audit events
- Analytics events

PostgreSQL partitioning can divide a large logical table into smaller physical partitions.

For example:

```
ils_block_visits
│
├── partition_2026_10
├── partition_2026_11
├── partition_2026_12
└── ...
```

A query for a particular time range can potentially scan only the relevant partitions.

Partitioning can also simplify data retention and archival.

But partitioning does not automatically make every query faster. Partition keys and query patterns must align.

For your platform, time-based partitioning may be appropriate for telemetry and event tables. It may be unnecessary for smaller business tables.

## 8. Sharding: when one database is no longer sufficient

Sharding distributes data across multiple database clusters.

For example:

```
Application
    │
    ├── Shard A: user range / tenant group A
    ├── Shard B: user range / tenant group B
    └── Shard C: user range / tenant group C
```

This can increase total write capacity and storage capacity.

But it introduces major complexity:

- Routing requests to the correct shard.
- Cross-shard queries.
- Cross-shard transactions.
- Rebalancing data.
- Backup and recovery.
- Maintaining consistent ownership.

Therefore, I would not introduce sharding as the first scaling step.

Your existing separate RTH and SkillUp databases already provide a useful degree of workload and data isolation. Optimize each brand's database first, then consider sharding when measured database limits justify it.

## 9. What happens when traffic exceeds database capacity?

A scalable database architecture must not accept unlimited work.

It needs backpressure.

For example:

```
Incoming requests
       ↓
Connection pool / queue limits
       ↓
Normal traffic → Process
Excess traffic → Queue, throttle, or reject safely
```

Without backpressure, excessive traffic can lead to:

- Exhausted connections.
- Increasing query latency.
- Request timeouts.
- Retry storms.
- Cascading failures.

A good system can temporarily reject excess traffic with a controlled response rather than allowing the entire platform to fail.

This is especially important during simultaneous exam starts or major course launches.

## 10. The database capacity model

We should eventually calculate capacity using actual measurements.

For a simplified model:

\\[ \text{DB queries/sec} = \text{API requests/sec} \times \text{DB queries per API request} \\]

Suppose your system receives 20,000 API requests/sec and averages 0.5 database queries per API request because many requests are served from caches:

\\[ 20{,}000 \times 0.5 = 10{,}000 \\]

That gives 10,000 database queries/sec as an approximate workload.

But query cost varies enormously. One indexed lookup is not equivalent to a complex aggregation over millions of records.

Therefore, capacity testing must measure both query throughput and resource consumption.

# My recommended database scaling strategy for your project

| Stage                    | Architecture                                              |
| ------------------------ | --------------------------------------------------------- |
| Initial foundation       | Separate brand DBs, optimized queries, connection pooling |
| Growing traffic          | Caching, query tuning, bounded autoscaling                |
| High read traffic        | Read replicas and read-model optimization                 |
| High event volume        | Durable queues and batch processing                       |
| Very large tables        | Partitioning and data retention policies                  |
| Database capacity limits | Additional clusters or sharding, when justified           |

The most important takeaway is:

Millions of users should not translate into millions of direct database connections or unnecessary database queries.

Your application should absorb traffic intelligently, cache reusable content, bound connections, optimize queries, separate read and write workloads where useful, and process high-volume background events independently.

For RTH and SkillUp, we should next define the database workload classes—identity, tutorial content, learner progress, exams, ILS telemetry, and analytics—and specify how each one is read, written, cached, and scaled.

# Data Analytics, Data Engineering, and AI architecture for RTH + SkillUp

Yes. This is the next major architectural layer we should define.

Your platform is not just a learning website. With Real Tutorial Hub (RTH), SkillUp IT Academy, and SkillHubCore, you are building an ecosystem that can generate substantial educational data and use that data to power analytics, personalization, AI tutoring, question generation, recommendations, and intelligent learning services.

The important architectural decision is:

Do not make your operational databases responsible for every analytics query, data engineering workload, and AI inference request.

The platform should separate:

1. Operational data — required to run the applications.
2. Data engineering — collecting, transforming, and preparing data.
3. Data analytics — understanding learner and platform behavior.
4. AI data and services — retrieving knowledge, generating content, making predictions, and providing assistance.

These layers should work together, but they should not compete for the same database resources.

## 1. Proposed end-to-end architecture

This is the logical architecture I recommend. It builds on your current Cloudflare, Cloud Run, Neon, monorepo, and shared SkillHubCore platform.

Source applications and services

RTH · SkillUp · Quiz · Tutorial Engine · Identity · Payments · ILS

Events · CDC · APIs · Scheduled extracts

Data ingestion layer

Event collector · Durable queues · Schema validation · Dead-letter handling

Data lake / analytical storage

Raw events · Historical data · Curated datasets · Object storage / warehouse

Data engineering

Batch and streaming transformations · Data quality · Identity resolution · Data models

Analytics

Dashboards · Reports · Cohorts · KPIs · Learning insights

AI platform

RAG · Inference · Question generation · Recommendations · Evaluation

Governed data and AI products

Learner insights · Faculty analytics · Admin reporting · AI tutor · Adaptive learning

The diagram shows logical layers. Some can initially share infrastructure, but their responsibilities and access controls should remain separate.

## 2. Operational databases versus analytics storage

Your existing production databases should continue to serve the applications:

| Database       | Operational responsibility                 |
| -------------- | ------------------------------------------ |
| `people_prod`  | Global identity and identity relationships |
| `rth_prod`     | RTH operational learning data              |
| `skillup_prod` | SkillUp operational learning data          |

Analytics should not routinely execute expensive scans against these production databases.

Instead, create an analytical data platform that receives selected data through controlled ingestion.

For example:

```
rth_prod ─────────┐
                 ├──> Data ingestion ──> Analytics storage
skillup_prod ─────┤
                 │
ILS events ───────┘
```

This allows dashboards and historical analysis to process millions of records without directly competing with learner requests.

### A useful separation

- OLTP: Operational transactions — enrollments, exam submissions, profiles.
- OLAP: Analytical workloads — learning trends, engagement, retention, reports.
- AI retrieval: Search and retrieve relevant knowledge for AI applications.
- AI inference: Generate predictions, explanations, responses, or content.

These workloads have different performance, consistency, and cost requirements.

## 3. Data Engineering: how data becomes useful

Data engineering is not simply moving data from PostgreSQL into a dashboard.

It establishes reliable pipelines that turn raw operational records into consistent, trustworthy datasets.

For your platform, the pipeline should follow a controlled sequence:

### A. Data ingestion

Data can enter the platform through several mechanisms:

| Method                    | Appropriate use                                        |
| ------------------------- | ------------------------------------------------------ |
| Application events        | Tutorial activity, quiz attempts, learner interactions |
| Transactional outbox      | Reliable publication of business events                |
| CDC (Change Data Capture) | Capturing selected database changes                    |
| Batch extraction          | Historical records and scheduled imports               |
| API ingestion             | External services and approved integrations            |

For critical business events, a transactional outbox is worth considering.

For example, when an enrollment is created, the service can write both the enrollment and an outbox event in one database transaction. A separate publisher sends that event to the data platform.

This avoids the problem where the database write succeeds but the event is lost because a separate publishing operation failed.

### B. Data transformation

Raw data should be transformed into consistent analytical models.

For example, source events might include:

```
tutorial_opened
section_visited
quiz_started
quiz_submitted
course_enrolled
```

The data engineering pipeline can create curated datasets such as:

```
learner_activity
course_engagement
assessment_performance
tutorial_completion
learning_retention
```

A key rule is that analytics should have a documented definition for each metric.

For example, "active learner" must have one agreed definition. Otherwise, the RTH dashboard and SkillUp dashboard may report different numbers for the same concept.

### C. Data quality

Every pipeline should validate:

- Required fields.
- Event schema versions.
- Duplicate events.
- Invalid timestamps.
- Unknown identifiers.
- Missing relationships.
- Unexpected data volume changes.
- Failed transformation jobs.

Events should have stable identifiers and versioned schemas.

This becomes especially important when multiple applications and services evolve independently.

## 4. Data Analytics: what products should be built?

Your analytics platform should support multiple audiences, not just one general admin dashboard.

[TaalimAI | Devpost](https://images.openai.com/static-rsc-4/JMJ59sb5OMyuJczqQ4e9N2cMCiiVaQIwklTDWMvbQe8Ffi3rP-SH_hWOurIN0ymwv7Iurq1c3x-5Z6ogFDuXs49RyEVdJAcTBOENj9ZhtWOmIai-Pft6TWesunwca-sgZgzMA7l4zESsarOePVWtM61gG56GKvB1WPuzWNtQaV0?purpose=inline)

Learner analytics

Learning progress, course completion, assessment performance, study activity, and personalized learning insights.

[Actionable Data for Instructional Coaches](https://images.openai.com/static-rsc-4/dj048jj6SUVamBJNL1MvBHwhaNZS0gHyPhg875pzWCdP4f6w7JLizBuGJNa8CRkNUEcQmma_m5ZOpi1C_jykD8swfPxpJ9wolGpfkz7zgv_Wg2arFRXx0VkGGku1OD7vNzQ1QiNSas0CsT_Cga2zPqCsraktb1G9WvqSmNieKcw?purpose=inline)

Faculty analytics

Class performance, learner engagement, difficult concepts, assessment outcomes, and learners who may need support.

[Derangula Consulting — Premium Digital Consulting](https://images.openai.com/static-rsc-4/vCbMQ8b_2XNFAxTlP4vNx3jGwYf9PKQ8s_33y6hkE-Mlr89uyn7h0biLJUyBQ63806rin8jxZvqG-0Aqlfelm2N3vkWK2VM00zWvnlu7mzBoBUfE-YQX28wBcJO5L6gON3i7z-8shxdl9ClCRVXfAbRPt_3TIYx-tg8FYG1V33k?purpose=inline)

Brand analytics

RTH and SkillUp enrollment, retention, course performance, revenue, conversion, and operational KPIs.

[Access and use the Möbius Analytics dashboards](https://images.openai.com/static-rsc-4/xbvBksNtm-wlKgo6bw7QlfGx1Cu2qUR_vA-C3edsLYCAPtHeoyKyDYcJHJ5_z9iEPOD0Y0nlHaH05kG7mF3DATSS6c6ihGJw8gHKBiYNBUnA_SMKWEi9R0bnZRi7o9V7oeq1fIhZsE__g_qaSUAONugyfnS3AS7tF1tudnSBW-w?purpose=inline)

Content analytics

Tutorial section engagement, quiz difficulty, content quality, drop-off points, and content improvement opportunities.

Your existing ILS telemetry is particularly valuable here. It can help identify whether learners are repeatedly visiting a section, spending time on difficult content, or leaving a lesson before completion.

However, telemetry is evidence of behavior—not proof of understanding. Analytics should distinguish observed activity from inferred learning outcomes.

## 5. AI architecture: separate AI products from AI infrastructure

Your AI platform should not be a single giant service that handles every AI use case.

Different AI products need different capabilities.

| AI product                 | Required capability                                          |
| -------------------------- | ------------------------------------------------------------ |
| AI Tutor                   | Context retrieval, conversation management, safety controls  |
| Question bank generator    | Structured generation, schema validation, quality evaluation |
| Tutorial content assistant | Content retrieval, authoring workflow, review and approval   |
| Course recommendation      | Learner features, ranking, recommendation evaluation         |
| Adaptive learning          | Learner model, skill estimates, controlled recommendations   |
| AI analytics assistant     | Governed metric access, semantic models, query limits        |
| AI-powered search          | Content indexing, retrieval, relevance ranking               |

For your platform, I recommend separating the AI application layer from the AI infrastructure layer.

### AI application layer

This contains product-specific business rules:

- AI Tutor application.
- Question generation application.
- Tutorial authoring assistant.
- Learning recommendation application.
- AI analytics assistant.

### AI infrastructure layer

This provides shared capabilities:

- Model gateway.
- Model routing.
- Prompt and template versioning.
- Structured output validation.
- Embedding generation.
- Retrieval service.
- Vector search.
- Token and cost tracking.
- AI observability.
- Evaluation framework.
- Safety and policy enforcement.

This lets you change a model provider or deploy a different model without rewriting every AI product.

Your project already has an `apps/project-ai` or `services/project-ai` area in its broader architecture context; the exact current repository location should be verified before implementation. The same applies to your FastAPI-based question generation plan.

## 6. AI knowledge architecture: RAG and vector search

For an AI Tutor, a useful design is Retrieval-Augmented Generation (RAG).

Rather than relying only on a model's pretrained knowledge, the application retrieves approved educational content and supplies it as context.

Learner asks a question

AI Tutor application

Validates identity, brand, course, and access permissions

Retrieval service

Searches approved content for relevant sections

Model inference

Generates an answer using retrieved content and application instructions

Validated response

Answer · Relevant source references · Usage telemetry

Your modular `tutorial_sections` system is a natural source for this knowledge layer.

The content pipeline could be:

```
Approved tutorial_sections
        ↓
Content extraction
        ↓
Chunking and metadata
        ↓
Embedding generation
        ↓
Vector / hybrid search index
        ↓
AI retrieval service
        ↓
AI Tutor
```

Each indexed chunk should preserve metadata such as:

- Brand.
- Course.
- Tutorial.
- Section type.
- Difficulty.
- Version.
- Approval status.
- Source identifier.

This is important because an AI Tutor must not retrieve unpublished content or content belonging to another brand unless explicitly authorized.

The vector index is a derived search representation—not the authoritative source of educational content.

When a tutorial changes, the index should be updated through a controlled versioned pipeline.

## 7. AI and analytics must follow the same brand isolation model

The shared platform can provide common AI infrastructure, but every request needs a validated authorization context.

For example:

```
AI request
   ↓
Authenticated global user
   ↓
Validated brand membership
   ↓
Authorized course / content scope
   ↓
Retrieval or analytics query
   ↓
Response
```

A shared AI service must not treat a global user ID as permission to access both brands.

Likewise, an analytics assistant should not receive unrestricted database access and be allowed to generate arbitrary SQL against production databases.

Instead, provide governed datasets and approved query interfaces.

For example, an AI analytics assistant might answer:

> Which SkillUp courses had the highest learner drop-off last month?

The assistant should query a governed analytical model containing approved SkillUp data—not directly query all tables in `skillup_prod`.

For learner-level data, use explicit authorization, data minimization, and appropriate privacy controls.

## 8. AI scalability: how to serve millions of users

AI inference is a separate capacity problem from database scaling.

A large AI workload can involve:

- Model inference latency.
- Model throughput.
- Token consumption.
- GPU or provider capacity.
- Retrieval latency.
- Context size.
- Queueing.
- Cost per generated answer.

The architecture should therefore use an AI request lifecycle:

```
AI API
  ↓
Authentication + brand authorization
  ↓
Usage limits + cost controls
  ↓
Retrieval / feature lookup
  ↓
Inference gateway
  ↓
Model
  ↓
Output validation
  ↓
Response
```

For high-volume use cases, consider:

| Technique              | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| Request quotas         | Prevent abuse and uncontrolled cost               |
| Model routing          | Use appropriate models for different tasks        |
| Semantic caching       | Reuse suitable answers where safe                 |
| Batch inference        | Process large generation jobs efficiently         |
| Queue-based generation | Absorb bursts and control concurrency             |
| Context reduction      | Reduce unnecessary token usage                    |
| Output validation      | Ensure generated data meets application contracts |
| Evaluation             | Measure accuracy and quality over time            |

For your question bank generator, batch processing is often more suitable than generating thousands of questions synchronously during a user request.

A generation job can move through states such as:

```
queued
  → processing
  → generated
  → validated
  → reviewed
  → approved
```

Generated questions should not automatically become production question-bank content without the required validation and approval process.

## 9. Data governance and AI governance

As the platform grows, governance becomes part of the architecture.

Every dataset and AI capability should define:

| Governance area     | Required decision                            |
| ------------------- | -------------------------------------------- |
| Data ownership      | Who owns the dataset?                        |
| Data classification | Public, internal, personal, sensitive        |
| Retention           | How long is the data retained?               |
| Access control      | Which users and services can access it?      |
| Brand scope         | RTH, SkillUp, or approved shared data        |
| Quality             | How is data correctness validated?           |
| AI usage            | Which AI products may consume the data?      |
| Auditability        | Can data access and AI operations be traced? |
| Model evaluation    | How is output quality measured?              |

For education data, be particularly careful about learner profiles, performance records, personal information, and AI-generated inferences about learners.

Do not use every available learner data point for every AI feature merely because it exists.

## 10. How I would organize this in your monorepo

The following is a proposed organization—not a claim that these exact directories currently exist.

```
apps/
  realtutorialhub-web/
  skillup-web/
  skillhubcore-admin/

services/
  api-gateway/
  skillhubcore-service/
  analytics-collector-service/
  data-ingestion-service/
  data-transformation-service/
  ai-inference-service/
  ai-retrieval-service/

packages/
  analytics-contracts/
  event-contracts/
  data-models/
  ai-contracts/
  ai-evaluation/
  data-access/
  observability/
```

Not every item needs to be a separately deployed service at the beginning.

For example, the data transformation logic may initially run as scheduled jobs, while the analytics collector is independently deployed.

The key is to maintain explicit responsibilities and contracts.

This follows the architecture direction already established for your platform: modular shared packages, separate brand applications and data, and selectively distributed services.&#x20;

# 11. The implementation sequence I recommend

We should not attempt to implement analytics, data engineering, and all AI products at once.

| Phase | Architecture capability                                            |
| ----- | ------------------------------------------------------------------ |
| 1     | Define event contracts, data ownership, and brand-level governance |
| 2     | Establish reliable ingestion and data quality                      |
| 3     | Build the analytical storage layer                                 |
| 4     | Create curated datasets and metric definitions                     |
| 5     | Implement brand and faculty analytics                              |
| 6     | Establish the shared AI inference and retrieval infrastructure     |
| 7     | Build AI Tutor and structured question generation                  |
| 8     | Add recommendations, adaptive learning, and AI analytics           |
| 9     | Evaluate, optimize, and scale the data and AI workloads            |

The first phase is the most important. If event definitions, identity resolution, and brand isolation are incorrect, all downstream analytics and AI products inherit those problems.

## The architecture decision we should make next

I recommend defining a formal Data and AI Platform Architecture Standard with these six domains:

1. Operational data ownership.
2. Event and ingestion architecture.
3. Analytical storage and data engineering.
4. Analytics and semantic models.
5. AI inference, retrieval, and model lifecycle.
6. Data governance, security, and AI evaluation.

That standard would become the foundation for every new analytics feature and AI product developed for RTH, SkillUp, and SkillHubCore.

# Summary: Architecture foundation for millions of users

We discussed how Real Tutorial Hub (RTH), SkillUp IT Academy (SkillUp), and SkillHubCore should be architected so that the platform can eventually support millions of users, large concurrent workloads, analytics, data engineering, and AI-powered products.

The central conclusion is:

Scalability must be built into the architecture, coding standards, data ownership, and service contracts—not added only by increasing server capacity.

## 1. Overall architecture

We identified the appropriate architectural direction as:

Modular Multi-Application Platform Architecture with Selectively Distributed Services

This means:

- Multiple independently deployable applications.
- Shared packages for common business capabilities.
- Clearly defined domain boundaries.
- Independently scalable services where required.
- Separate brand data ownership.
- Shared platform services through SkillHubCore.

We should avoid both a tightly coupled monolith and premature microservices.

## 2. Million-user readiness parameters

We discussed that millions of registered users and millions of concurrent users are different requirements.

The platform needs measurable qualification targets for:

| Area           | What we need to qualify                                  |
| -------------- | -------------------------------------------------------- |
| User scale     | Registered and concurrent users                          |
| API capacity   | Requests per second                                      |
| Performance    | p95/p99 latency                                          |
| Availability   | 99.9%+ target, with critical services potentially higher |
| Reliability    | Recovery Time Objective and Recovery Point Objective     |
| Security       | Authentication, authorization, and brand isolation       |
| Data integrity | Reliable writes, backups, and tested restoration         |
| Cost           | Infrastructure and AI cost per active user               |

These were proposed targets, not evidence that the current deployment already meets them.

## 3. Software engineering principles

We discussed SOLID and other principles that should become project-wide engineering standards.

| Principle       | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| SRP             | Single Responsibility Principle                             |
| OCP             | Open/Closed Principle                                       |
| LSP             | Liskov Substitution Principle                               |
| ISP             | Interface Segregation Principle                             |
| DIP             | Dependency Inversion Principle                              |
| DRY             | Don't Repeat Yourself                                       |
| KISS            | Keep It Simple                                              |
| YAGNI           | You Aren't Gonna Need It                                    |
| SoC             | Separation of Concerns                                      |
| Least Privilege | Give only required permissions                              |
| Idempotency     | Repeated operations should not create unintended duplicates |

We agreed that these principles should apply to every page, component, hook, API, service, package, and database interaction.

However, they must be applied according to the responsibility of each layer—not mechanically.

### Example

A Tutorial Page should compose smaller components:

```
TutorialPage
├── TutorialHeader
├── TutorialSidebar
├── TutorialContent
│   ├── IntroductionSection
│   ├── NotesSection
│   ├── CodeSection
│   └── QuizSection
├── TutorialProgress
└── TutorialNavigation
```

The UI should not directly implement database access or authorization logic.

## 4. Database architecture

We discussed retaining the separate brand data model.

| Database             | Responsibility                   |
| -------------------- | -------------------------------- |
| `people_prod`        | Global identity                  |
| `rth_prod`           | RTH operational data             |
| `skillup_prod`       | SkillUp operational data         |
| `quiz_platform_prod` | Legacy database being phased out |

Key decisions and principles:

- Every table must have an authoritative owner.
- Every database must have a defined service owner.
- Global identity and brand membership are separate concepts.
- A global identity does not automatically grant access to both brands.
- Cross-brand access must be explicitly authorized.
- Database access should use controlled data-access modules.
- Schema changes must be version-controlled and reviewed.
- Database migrations should use safe deployment patterns.
- Production databases should not be used for unrestricted analytics workloads.

We also discussed the need for primary keys, foreign keys, constraints, indexes, query optimization, connection pooling, and tested backups.

## 5. How the database handles millions of requests

We established that the database should not directly handle every application request.

The architecture should reduce and control database work through:

1. CDN and caching.
2. Connection pooling.
3. Query optimization and indexes.
4. Read replicas for suitable read workloads.
5. Durable queues for high-volume background events.
6. Partitioning for very large tables.
7. Sharding only when measured limits justify it.
8. Backpressure and controlled request rejection.

We emphasized that application autoscaling must not create unlimited database connections.

### Workload separation

| Workload             | Approach                                       |
| -------------------- | ---------------------------------------------- |
| Exam submission      | Durable, transactional, reliable               |
| Payment confirmation | Transactional and idempotent                   |
| Tutorial content     | Cacheable where appropriate                    |
| ILS telemetry        | High-volume event ingestion                    |
| Analytics            | Asynchronous processing and analytical storage |
| PDF generation       | Background jobs                                |

The critical distinction is that exam submissions require stronger consistency than many analytics and telemetry workloads.

## 6. Data Analytics and Data Engineering

We discussed separating operational data from analytical processing.

The proposed flow:

```
RTH / SkillUp / SkillHubCore
             ↓
       Data Ingestion
             ↓
     Analytical Storage
             ↓
      Data Engineering
             ↓
      Curated Datasets
             ↓
        Analytics
```

Data can enter through:

- Application events.
- Transactional outbox.
- Change Data Capture (CDC).
- Scheduled batch extraction.
- Approved APIs.

The data engineering layer should handle:

- Data validation.
- Duplicate detection.
- Schema versioning.
- Identity resolution.
- Transformation.
- Data quality checks.
- Historical data management.

The analytics layer should support:

- Learner analytics.
- Faculty analytics.
- Brand analytics.
- Content analytics.
- Learning engagement.
- Assessment performance.
- Retention and completion metrics.

We also identified your ILS telemetry as an important source of learning activity data.

## 7. AI architecture

We discussed separating AI products from shared AI infrastructure.

### AI products

- AI Tutor.
- Question bank generator.
- Tutorial content assistant.
- Course recommendation.
- Adaptive learning.
- AI analytics assistant.
- AI-powered search.

### Shared AI infrastructure

- Model gateway.
- Model routing.
- Prompt and template versioning.
- Structured output validation.
- Embedding generation.
- Retrieval service.
- Vector search.
- Token and cost tracking.
- AI observability.
- Evaluation framework.

This allows individual AI products to evolve without duplicating infrastructure.

## 8. AI knowledge architecture

We discussed Retrieval-Augmented Generation (RAG) for the AI Tutor.

The proposed flow:

```
Approved tutorial_sections
          ↓
   Content extraction
          ↓
       Chunking
          ↓
  Embedding generation
          ↓
    Vector / hybrid index
          ↓
    Retrieval service
          ↓
       AI Tutor
```

Your existing `tutorial_sections` model can serve as an authoritative source for educational content.

The vector index should be treated as a derived search representation—not the source of truth.

Each indexed item should retain metadata such as brand, course, tutorial, section type, version, and approval status.

## 9. AI and analytics security

We agreed that AI and analytics must preserve the same brand isolation model as the operational platform.

A global identity ID does not automatically grant access to all brand data.

AI retrieval and analytics must validate:

- User identity.
- Brand membership.
- Course or content permissions.
- Data scope.
- Dataset access.

An AI analytics assistant should use governed analytical datasets rather than unrestricted production database access.

## 10. Coding and repository standards

We discussed that the architecture needs to be enforced through the development process.

The standards should include:

- TypeScript strict mode.
- ESLint and formatting.
- Dependency-boundary checks.
- API contract validation.
- Database migration checks.
- Unit, integration, and contract tests.
- Security checks.
- CI pass/fail gates.
- Code review requirements.

We also identified a potential repository organization:

```
apps/
  realtutorialhub-web/
  skillup-web/
  skillhubcore-admin/

services/
  api-gateway/
  skillhubcore-service/
  analytics-collector-service/
  data-ingestion-service/
  ai-inference-service/
  ai-retrieval-service/

packages/
  analytics-contracts/
  event-contracts/
  data-models/
  ai-contracts/
  data-access/
  observability/
```

This is a proposed organization, not a verified statement that all these directories currently exist.

# Overall architecture roadmap

Here is the sequence we established conceptually:

1

Architecture principles and boundaries

Define module ownership, service boundaries, dependencies, and coding standards.

2

Database ownership and access

Define data ownership, brand isolation, access contracts, migrations, and query standards.

3

Scalability and reliability

Define caching, pooling, workload separation, capacity tests, and recovery.

4

Data Engineering and Analytics

Define ingestion, analytical storage, transformation, governance, and metric models.

5

AI Platform

Define inference, retrieval, AI products, model lifecycle, evaluation, and AI governance.

## What we should discuss next

We have discussed the overall principles, but we have not yet finalized the formal architecture standards.

The next logical step is to define Architecture Principle 1: Module and Service Boundaries.

We should establish exactly:

- What belongs inside an application.
- What belongs inside a shared package.
- What belongs inside an independently deployable service.
- How business logic is separated from infrastructure.
- Which dependencies are allowed.
- How database ownership is reflected in code.

Once these boundaries are settled, we can create the project-wide Architecture and Coding Standard that every developer and AI coding agent must follow.

# Architecture Discussion Summary — Tabular Format

## 1. Overall Platform Architecture

| Area                 | What We Discussed                                              | Architectural Direction                                                                  |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Overall architecture | Support RTH, SkillUp, and SkillHubCore as a shared platform    | Modular multi-application architecture with selectively distributed services             |
| Scalability          | Prepare for millions of users                                  | Design for measured workload capacity, horizontal scaling, and controlled resource usage |
| Service design       | Avoid tightly coupled applications and premature microservices | Establish clear domain and service boundaries                                            |
| Shared functionality | Reuse common capabilities across brands                        | Shared packages and SkillHubCore services                                                |
| Brand independence   | RTH and SkillUp are independent brands                         | Preserve separate brand data and authorization boundaries                                |
| Deployment           | Applications and services may have different scaling needs     | Independently deploy and scale services where justified                                  |

## 2. Engineering Principles and Coding Standards

| Principle       | Meaning                                                     | Application                                                            |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| SOLID           | Five principles for maintainable object-oriented design     | Apply according to each code layer’s responsibility                    |
| SRP             | Single Responsibility Principle                             | Each module or component has one primary responsibility                |
| OCP             | Open/Closed Principle                                       | Extend functionality without repeatedly modifying stable code          |
| LSP             | Liskov Substitution Principle                               | Implementations must honor their contracts                             |
| ISP             | Interface Segregation Principle                             | Keep interfaces focused                                                |
| DIP             | Dependency Inversion Principle                              | High-level business logic should not depend directly on infrastructure |
| DRY             | Don't Repeat Yourself                                       | Reuse common logic without creating unnecessary abstractions           |
| KISS            | Keep It Simple                                              | Prefer understandable solutions                                        |
| YAGNI           | You Aren't Gonna Need It                                    | Avoid speculative functionality                                        |
| SoC             | Separation of Concerns                                      | Separate UI, business logic, data access, and infrastructure           |
| Least Privilege | Grant only required permissions                             | Apply to users, services, APIs, and database access                    |
| Idempotency     | Repeated operations should not create unintended duplicates | Apply to submissions, payments, jobs, and event processing             |
| Testability     | Design code to be testable                                  | Use explicit dependencies, contracts, and automated tests              |

## 3. Database Architecture

| Area            | Discussion                                          | Recommended Direction                                          |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Global identity | `people_prod` stores global identity                | Keep global identity separate from brand-specific data         |
| RTH data        | `rth_prod` stores RTH operational data              | RTH owns its brand data                                        |
| SkillUp data    | `skillup_prod` stores SkillUp operational data      | SkillUp owns its brand data                                    |
| Legacy data     | `quiz_platform_prod` is being phased out            | Migrate remaining required data and retire legacy dependencies |
| Data ownership  | Every table and data domain needs an owner          | Define authoritative ownership                                 |
| Database access | Avoid unrestricted cross-database access            | Use controlled data-access modules and service contracts       |
| Brand isolation | Global identity does not imply access to all brands | Validate brand membership and permissions                      |
| Schema changes  | Database changes must be controlled                 | Version migrations, review changes, and deploy safely          |
| Data integrity  | Preserve valid and consistent records               | Use constraints, transactions, and appropriate keys            |
| Backups         | Production data must be recoverable                 | Test backup restoration and recovery procedures                |

## 4. Database and Application Scalability

| Scaling Mechanism   | Purpose                                        | When to Use                                      |
| ------------------- | ---------------------------------------------- | ------------------------------------------------ |
| CDN                 | Reduce origin traffic                          | Static assets and suitable cacheable content     |
| Application caching | Reduce repeated computation and database reads | Frequently requested data                        |
| Connection pooling  | Control database connections                   | All production database workloads                |
| Query optimization  | Reduce database workload                       | Before adding infrastructure capacity            |
| Indexing            | Improve query performance                      | Based on actual query patterns                   |
| Read replicas       | Distribute suitable read workloads             | When read demand justifies them                  |
| Durable queues      | Move work out of request-response paths        | High-volume background processing                |
| Partitioning        | Manage very large tables                       | When table size and workload justify it          |
| Sharding            | Distribute data across database nodes          | Only when measured limits justify the complexity |
| Backpressure        | Prevent overload from cascading                | During traffic spikes and downstream failures    |

Important: Registered users, concurrent users, API requests per second, and database queries per second are different capacity measures.

## 5. Data Engineering and Analytics

| Component              | Responsibility                              | Architectural Direction                                  |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Operational databases  | Serve application transactions              | Keep transactional workloads focused                     |
| Data ingestion         | Collect data from applications and services | Use events, outbox, CDC, batch, or approved APIs         |
| Event contracts        | Define event structure and meaning          | Version schemas and validate events                      |
| Durable queue          | Buffer data and absorb spikes               | Decouple producers from consumers                        |
| Raw analytical storage | Retain ingested data                        | Preserve source data for reprocessing                    |
| Data transformation    | Clean, validate, and transform data         | Build repeatable data pipelines                          |
| Curated datasets       | Provide trusted analytical data             | Define data ownership and quality checks                 |
| Analytics models       | Provide consistent business metrics         | Define governed metric and semantic models               |
| Analytics products     | Support reporting and decision-making       | Learner, faculty, content, brand, and platform analytics |

## 6. AI Architecture

| AI Area                 | Responsibility                           | Recommended Direction                                  |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| AI Tutor                | Answer learner questions                 | Retrieve authorized, approved educational content      |
| Question bank generator | Generate structured questions            | Validate output against schemas and educational rules  |
| Tutorial assistant      | Support tutorial creation                | Use versioned prompts and controlled content workflows |
| Recommendations         | Recommend courses or learning activities | Use governed learner and content data                  |
| Adaptive learning       | Adjust learning experiences              | Use validated learning signals and evaluation          |
| Model gateway           | Provide common model access              | Centralize model routing, limits, and usage tracking   |
| Prompt management       | Manage AI instructions                   | Version prompts and templates                          |
| Output validation       | Ensure structured output is valid        | Validate schemas and business constraints              |
| AI observability        | Monitor model quality and operation      | Track latency, errors, cost, and evaluation results    |
| AI governance           | Manage AI risks and access               | Enforce data authorization, privacy, and safety        |

## 7. AI Knowledge and Retrieval Architecture

| Stage                  | Responsibility                                |
| ---------------------- | --------------------------------------------- |
| Authoritative content  | Approved `tutorial_sections` content          |
| Content extraction     | Extract content for indexing                  |
| Chunking               | Split content into retrieval-friendly units   |
| Embedding generation   | Generate vector representations               |
| Vector or hybrid index | Support semantic and keyword retrieval        |
| Retrieval service      | Retrieve relevant, authorized content         |
| AI Tutor               | Use retrieved content to produce responses    |
| Evaluation             | Test retrieval quality and answer correctness |

The vector index is a derived representation, not the source of truth. The authoritative tutorial content remains in the existing content system.

## 8. AI and Analytics Security

| Security Requirement | Expected Behavior                                      |
| -------------------- | ------------------------------------------------------ |
| Identity             | Validate the requesting user                           |
| Brand membership     | Confirm the user belongs to the requested brand        |
| Authorization        | Verify permissions for the requested data              |
| AI retrieval         | Retrieve only content the user is authorized to access |
| Analytics access     | Restrict access to governed datasets and metrics       |
| Database access      | Avoid unrestricted production database access by AI    |
| Service identity     | Give each service only the permissions it needs        |
| Auditability         | Record appropriate access and operational events       |

## 9. Engineering Governance and CI/CD

| Area                  | Standard                                              |
| --------------------- | ----------------------------------------------------- |
| TypeScript            | Use strict typing and explicit contracts              |
| Linting               | Enforce consistent code-quality rules                 |
| Dependency boundaries | Prevent unauthorized package and service dependencies |
| API contracts         | Validate request and response structures              |
| Database migrations   | Review and validate schema changes                    |
| Unit tests            | Test isolated business logic                          |
| Integration tests     | Test interactions between modules and services        |
| Contract tests        | Verify service and API compatibility                  |
| Security checks       | Include security validation in CI                     |
| Code review           | Require review for significant changes                |
| Observability         | Provide logs, metrics, and traces where appropriate   |

## 10. Proposed Architecture Roadmap

| Phase | Focus                                  | Expected Outcome                                                      |
| ----- | -------------------------------------- | --------------------------------------------------------------------- |
| 1     | Architecture principles and boundaries | Defined ownership and dependency rules                                |
| 2     | Database ownership and access          | Controlled data access and brand isolation                            |
| 3     | Scalability and reliability            | Capacity targets, caching, pooling, and recovery plans                |
| 4     | Data Engineering                       | Reliable ingestion and transformation pipelines                       |
| 5     | Analytics                              | Governed datasets and consistent metrics                              |
| 6     | AI Platform                            | Shared inference, retrieval, and evaluation capabilities              |
| 7     | AI Products                            | AI Tutor, question generation, recommendations, and adaptive learning |
| 8     | Governance and optimization            | Continuous security, quality, performance, and cost improvement       |

## 11. Proposed Next Step

| Next Topic                                              | What We Need to Define                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Architecture Principle 1: Module and Service Boundaries | What belongs in an application, shared package, or independently deployable service |
| Dependency rules                                        | Which modules may depend on which other modules                                     |
| Business logic                                          | Where domain rules should live                                                      |
| Data access                                             | Which services and packages may access each database                                |
| API contracts                                           | How applications and services communicate                                           |
| Enforcement                                             | How CI, tests, and code review ensure the rules are followed                        |

This would provide the foundation for a formal Project Architecture and Coding Standard that developers and AI coding agents can follow consistently.

You are at an important stage: you have a real offline student base of 100+ students, but your online student base is currently zero. You want those existing students to start using both Real Tutorial Hub (RTH) and SkillUp IT Academy (SUIA), while building the platform so that future growth does not force a complete architectural rewrite.

The right strategy is not to purchase or provision infrastructure for millions of users today. It is to establish an architecture that can scale horizontally, isolate failures, protect each brand’s data, and let you add capacity when actual demand grows.

One important reality: no architecture can honestly guarantee that a system will never face an issue. The engineering goal is to make failures less likely, limit their impact, detect them quickly, recover safely, and prove capacity through testing.

# 1. The architecture direction

| Requirement              | Direction                                                               |
| ------------------------ | ----------------------------------------------------------------------- |
| Current starting point   | 100+ offline students, no online student base yet                       |
| Brand model              | RTH and SUIA remain independent brands                                  |
| Shared platform          | SkillHubCore provides shared capabilities                               |
| Student identity         | One global identity, with explicit membership and access for each brand |
| Application architecture | Modular monorepo with clear domain boundaries                           |
| Deployment architecture  | Independently deploy and scale services when justified                  |
| Database architecture    | Separate brand data ownership; shared identity data                     |
| Infrastructure           | Managed cloud services first; avoid managing servers unnecessarily      |
| Growth strategy          | Start small, measure, scale in stages                                   |
| Reliability goal         | No single avoidable failure should take down both brands                |
| Capacity goal            | Define, test, and document the actual supported workload                |

You already have a useful foundation: a shared identity system, separate brand databases, a monorepo, and a gateway/service architecture. The next task is to make the boundaries and operational standards explicit, then verify that the deployed system behaves as intended.

# 2. Target architecture for RTH, SUIA, and SkillHubCore

A suitable logical architecture would look like this:

\#chatgpt-mermaid-\_r_21g\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_21g\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_21g\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_21g\_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-\_r_21g\_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_21g\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_21g\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_21g\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_21g\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_21g\_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-\_r_21g\_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-\_r_21g\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_21g\_ p{margin:0;}#chatgpt-mermaid-\_r_21g\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_21g\_ .label text,#chatgpt-mermaid-\_r_21g\_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .node rect,#chatgpt-mermaid-\_r_21g\_ .node circle,#chatgpt-mermaid-\_r_21g\_ .node ellipse,#chatgpt-mermaid-\_r_21g\_ .node polygon,#chatgpt-mermaid-\_r_21g\_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .rough-node .label text,#chatgpt-mermaid-\_r_21g\_ .node .label text,#chatgpt-mermaid-\_r_21g\_ .image-shape .label,#chatgpt-mermaid-\_r_21g\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_21g\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .rough-node .label,#chatgpt-mermaid-\_r_21g\_ .node .label,#chatgpt-mermaid-\_r_21g\_ .image-shape .label,#chatgpt-mermaid-\_r_21g\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_21g\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_21g\_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-\_r_21g\_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-\_r_21g\_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-\_r_21g\_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-\_r_21g\_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-\_r_21g\_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-\_r_21g\_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-\_r_21g\_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_21g\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-\_r_21g\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_21g\_ .icon-shape,#chatgpt-mermaid-\_r_21g\_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-\_r_21g\_ .icon-shape p,#chatgpt-mermaid-\_r_21g\_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-\_r_21g\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_21g\_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-\_r_21g\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_21g\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_21g\_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_21g\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_21g\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_21g\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_21g\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_21g\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_21g\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_21g\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-\_r_21g\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-\_r_21g\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_21g\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_21g\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .node rect,#chatgpt-mermaid-\_r_21g\_ .node circle,#chatgpt-mermaid-\_r_21g\_ .node ellipse,#chatgpt-mermaid-\_r_21g\_ .node polygon,#chatgpt-mermaid-\_r_21g\_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_21g\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_21g\_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_21g\_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_21g\_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-\_r_21g\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Students, Faculty, AdminsCloudflare DNS, CDN, WAF,DDoS ProtectionGateway and Brand ResolutionRTH Applications and ServicesSUIA Applications and ServicesSkillHubCore Shared ServicesGlobal Identity: people_prodRTH Database: rth_prodSUIA Database: skillup_prodManaged CacheDurable Queue andBackground JobsAnalytics and Data PlatformAI Services and RetrievalLogs, Metrics, Traces, Alerts

The important architectural distinction is that shared identity and shared infrastructure do not mean shared authorization or unrestricted shared data.

| Layer            | Responsibility                                          | Failure isolation requirement                                                    |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cloudflare edge  | DNS, CDN, WAF, DDoS protection, static content delivery | Static content should remain available where possible even if an API is degraded |
| Gateway          | Resolve brand, route requests, apply common controls    | A routing/configuration error must be detectable and safely reversible           |
| RTH application  | RTH learner, faculty, and admin experiences             | RTH-specific failures should not automatically disable SUIA                      |
| SUIA application | SUIA learner, faculty, and admin experiences            | SUIA-specific failures should not automatically disable RTH                      |
| SkillHubCore     | Shared identity and genuinely shared capabilities       | Shared services need capacity, availability, and dependency controls             |
| Databases        | Authoritative transactional data                        | Prevent connection exhaustion and noisy-neighbor effects                         |
| Cache and queues | Reduce repeated work and absorb bursts                  | Cache or queue failure should have defined fallback behavior                     |
| Analytics and AI | Non-critical analytical and AI workloads                | Must not exhaust resources needed by core learning and exam flows                |
| Observability    | Logs, metrics, traces, alerts                           | Critical services must be monitored independently                                |

## 3. Hardware and infrastructure: what to use

You do not need to buy physical servers to support this model. With your current cloud-based approach, the infrastructure can be primarily managed services.

| Infrastructure area     | Current direction                                         | What to design for                                                                              |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| DNS, CDN, edge security | Cloudflare                                                | CDN caching, WAF rules, rate limits, DDoS protection, safe origin configuration                 |
| Application hosting     | Cloud Run on GCP                                          | Stateless containers, autoscaling, health checks, concurrency limits, minimum/maximum instances |
| Static frontend         | Cloudflare Pages or suitable static hosting               | CDN delivery and minimal origin dependency                                                      |
| Database                | Neon PostgreSQL                                           | Connection pooling, query tuning, indexes, backups, restore testing, capacity monitoring        |
| Cache                   | Managed Redis-compatible cache                            | Hot data, short-lived results, rate-limit state where appropriate                               |
| Background processing   | Durable queue and worker services                         | Retries, dead-letter handling, idempotency, controlled worker concurrency                       |
| File storage            | Object storage such as Cloudflare R2 or GCP Cloud Storage | PDFs, media, generated files, lifecycle rules, access controls                                  |
| Secrets                 | GCP Secret Manager or equivalent                          | No secrets in source code, images, or frontend bundles                                          |
| Monitoring              | Cloud and application observability tools                 | Metrics, logs, traces, alerts, service-level objectives                                         |
| Analytics storage       | Separate analytical data platform                         | Avoid running large reports against production transactional databases                          |
| AI inference            | Separately controlled AI service                          | Quotas, concurrency limits, queues, cost controls, model fallback policies                      |

Do not scale every service equally. A tutorial page, an exam submission, an AI generation request, and an analytics report have very different resource requirements.

For example, an AI question-generation workload should not be allowed to consume all API capacity while students are trying to log in or submit an exam.

# 4. How students should access both brands

Since you want your existing offline students to access features on both brands, the identity model must support that deliberately.

| Concept          | Expected behavior                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Global account   | A student has one global identity                                                                      |
| Brand membership | The student can have an RTH membership, a SUIA membership, or both                                     |
| Brand access     | Access is granted based on explicit membership and permissions                                         |
| Brand profile    | Brand-specific enrollment, progress, preferences, and records stay in the relevant brand’s data domain |
| Login            | Shared authentication may be used where appropriate                                                    |
| Authorization    | Every request still checks the target brand and required permission                                    |
| Brand switching  | A student can move between brands without gaining unauthorized access                                  |
| Account linking  | Existing offline student records are linked through a controlled, auditable process                    |

Do not make a global rule that “every user can access both brands.” Instead, support both memberships and grant them to the students who are entitled to both.

A practical onboarding flow:

1. Create or verify the student’s global identity.
2. Match the student to the correct offline student record.
3. Assign the required brand memberships.
4. Validate access to the relevant brand’s courses and services.
5. Test the flow using real student accounts before opening it to all students.

This allows you to start with 100 students without making identity and authorization assumptions that become dangerous at a larger scale.

# 5. The application coding standard must support scaling

| Code area            | Standard to enforce                                                                   |
| -------------------- | ------------------------------------------------------------------------------------- |
| Pages                | Compose UI; do not put business rules or database access directly in pages            |
| Components           | Have a clear responsibility and explicit inputs                                       |
| Hooks                | Encapsulate reusable client-side behavior                                             |
| API routes           | Validate input, authenticate, authorize, and delegate business work                   |
| Application services | Orchestrate use cases                                                                 |
| Domain logic         | Own business rules and invariants                                                     |
| Repositories         | Encapsulate database access                                                           |
| Shared packages      | Contain genuinely reusable capabilities, not brand-specific business logic by default |
| Service contracts    | Use explicit, versioned request and response contracts                                |
| Background jobs      | Be retry-safe and idempotent                                                          |
| Events               | Be versioned, validated, and designed for duplicate delivery                          |
| Errors               | Use consistent error formats and avoid exposing secrets                               |
| Tests                | Include unit, integration, contract, security, and load tests                         |

Apply SOLID, DRY, KISS, separation of concerns, and least privilege across the project—but use them according to the layer. A React component and a database repository do not have the same responsibilities.

# 6. Build capacity based on workload—not just user count

“Millions of users” is not a sufficiently precise capacity requirement.

| Capacity measure            | What it means                                             |
| --------------------------- | --------------------------------------------------------- |
| Registered users            | Total accounts in the system                              |
| Monthly active users        | Users who use the system during a month                   |
| Daily active users          | Users who use the system during a day                     |
| Concurrent users            | Users active at the same time                             |
| Requests per second         | Incoming API request rate                                 |
| Database queries per second | Database workload rate                                    |
| Peak burst                  | Sudden traffic increase, such as a class or exam starting |
| Payload size                | Amount of data transferred per request                    |
| Work duration               | How long an operation consumes compute resources          |

For an education platform, a major peak might be an exam starting, a live class beginning, or many students opening the same tutorial at once. These workloads must be tested separately.

### Define workload profiles

| Profile           | Example workload to test                                            |
| ----------------- | ------------------------------------------------------------------- |
| Normal learning   | Browsing tutorials, reading content, dashboard requests             |
| Class-start burst | Many students opening the same course or session                    |
| Exam-start burst  | Login, exam instructions, and question retrieval occurring together |
| Exam submission   | Many students submitting answers close together                     |
| ILS telemetry     | High volume of block visits and active-time events                  |
| AI generation     | Queued question generation and validation                           |
| Analytics         | Large reports running without harming transactional operations      |

Do not treat the example workloads as final capacity targets. Set actual target values using expected student behavior and load-test results.

# 7. A staged implementation plan

The project should move through measurable readiness gates. Each gate should be passed before you increase the scale of the rollout.

| Stage                                | What to implement                                                                                             | Exit criteria                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Stage 0 — Architecture baseline      | Document service boundaries, database ownership, brand access rules, critical user journeys, and dependencies | Architecture decisions reviewed and recorded                                  |
| Stage 1 — Offline student onboarding | Set up the 100+ students, brand memberships, access validation, and support process                           | Real students can securely access the intended features of both brands        |
| Stage 2 — Production foundation      | Health checks, structured logs, alerts, backups, restore procedures, secrets management, CI/CD rollback       | A production failure can be detected, diagnosed, and recovered from           |
| Stage 3 — Initial online launch      | CDN, rate limits, API protections, database pooling, caching where appropriate                                | Realistic load tests pass for expected initial online traffic                 |
| Stage 4 — Growth readiness           | Autoscaling, queue-based processing, database tuning, service isolation, load testing                         | The platform passes its agreed workload and burst targets                     |
| Stage 5 — Large-scale readiness      | Test higher concurrency, regional/dependency failure, recovery, cost, and operational procedures              | Capacity, recovery, and cost limits are measured and documented               |
| Stage 6 — Analytics and AI expansion | Separate analytical workloads, data pipelines, AI quotas, retrieval and evaluation                            | AI and analytics workloads cannot destabilize core learning and exam services |

## 8. Reliability requirements to define

| Requirement            | What you need to decide                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Availability objective | What percentage of time must each critical service be available?                   |
| Latency objective      | What response time is acceptable for login, tutorial loading, and exam submission? |
| Error budget           | How much service failure is acceptable during a defined period?                    |
| RTO                    | How long can recovery take after a major failure?                                  |
| RPO                    | How much data loss, if any, is acceptable after recovery?                          |
| Peak capacity          | What concurrent users and request rates must be supported?                         |
| Recovery testing       | How often will backup restoration and disaster recovery be tested?                 |
| Cost ceiling           | What infrastructure cost is acceptable at each growth stage?                       |

You should set separate objectives for different services. For example, a static tutorial page and an exam submission endpoint should not necessarily have the same latency or recovery requirements.

## 9. What I recommend you do first

Do not start by adding more servers, creating many microservices, or buying large database capacity.

Start in this order:

1. Audit the current architecture — establish what is actually implemented and deployed versus what is only planned.
2. Define the service and data ownership boundaries — particularly identity, brand membership, RTH data, SUIA data, and shared SkillHubCore capabilities.
3. Validate the two-brand student access flow — use your real offline student base as the first controlled online rollout.
4. Define workload and reliability targets — registered users alone are not a capacity plan.
5. Establish observability, backups, recovery, and safe deployment practices.
6. Run realistic load tests — measure the gateway, application services, database, and queues together.
7. Scale based on evidence — increase capacity where measurements show a bottleneck.

The most important first deliverable is an Architecture Readiness Assessment that classifies each area as:

| Status                     | Meaning                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Implemented and verified   | Evidence shows it works in the deployed project                    |
| Implemented but unverified | Code exists, but required behavior or capacity has not been proven |
| Partially implemented      | Some components or controls are missing                            |
| Not implemented            | Requires design and implementation                                 |
| Not applicable             | Not required for the current architecture                          |

This prevents the project from assuming that having Cloudflare, Cloud Run, Neon, separate databases, or a monorepo automatically means it is ready for millions of users.

My recommendation: use your 100+ offline students as the first controlled online cohort, but build the technical foundation around explicit service boundaries, brand isolation, observability, recoverability, and measurable load testing. That gives you a path from the current stage to large-scale operation without pretending that today’s infrastructure has already proven million-user capacity.&#x20;

