# R3 Implementation Plan (CORRECTED): PostgreSQL Persistence Layer

**Supersedes:** r3-plan.md (SQLite-based plan - INVALID)
**Architecture:** Use existing tutorial_prod PostgreSQL database
**Provider:** Neon (existing)
**Migration:** Coordinate with existing Drizzle migrations

---

## Architectural Foundation

### Database Selection (BINDING DECISION)

**Use:** `tutorial_prod` (existing PostgreSQL database on Neon)

**Environment Variable:** `DATABASE_URL_TUTORIAL`

**Rationale:**
- Project AI governs Tutorial block creation/placement
- Workflow → Target → Contract → Candidate → Manifest all reference Tutorial content
- Same infrastructure (no duplicate provisioning)
- Coherent architecture (persistence with governed content)

### Technology Stack

**Database:** PostgreSQL 17 (Neon serverless)
**Python Driver:** asyncpg
**Python ORM:** SQLAlchemy 2.0 async
**Migrations:** Coordinate with existing Drizzle (see migration strategy)
**Connection:** Reuse existing DATABASE_URL_TUTORIAL

### Table Namespace Strategy

Project AI tables will use `project_ai_` prefix in public schema:

```sql
project_ai_workflows
project_ai_state_transitions
project_ai_contracts
project_ai_candidates
project_ai_manifests
project_ai_approvals
```

This follows the pattern used by existing tutorial tables and avoids schema complexity.

---

## Implementation Plan

### Step 0: Database Architecture Discovery (NEW - MANDATORY)

- [ ] **0. Audit existing tutorial_prod database architecture**
  
  **BLOCKING STEP - Must complete before any schema changes**
  
  Inspect existing PostgreSQL infrastructure to determine migration strategy.
  
  **Files to Examine:**
  - `packages/db-tutorial/drizzle.config.ts` - migration configuration
  - `packages/db-tutorial/src/schema/*.ts` - existing table definitions
  - `packages/db-tutorial/migrations/*.sql` - existing migrations
  - `.env.local` - DATABASE_URL_TUTORIAL connection string
  - `packages/db-tutorial/src/db.ts` - connection pool setup
  - `packages/db-tutorial/src/repositories/*.ts` - existing repository patterns
  
  **Determine:**
  1. Does Drizzle own ALL schema changes for tutorial_prod?
  2. Is there an existing Python service using tutorial_prod?
  3. What is the test database strategy? (tutorial_test, test schema, Docker?)
  4. Are tables in public schema or separate schemas?
  5. Is there a table naming convention? (snake_case, prefix patterns?)
  6. What PostgreSQL version? (found: PostgreSQL 17.11)
  7. Connection pooling configuration
  8. Existing index/constraint patterns
  
  **Output:**
  Write findings to `e:\onlinewebsites\quiz-platform\.agents\tasks\r3-database-discovery.md` with:
  - Connection string format
  - Schema ownership determination
  - Migration strategy recommendation
  - Test database pattern
  - Naming conventions
  - Integration recommendations
  
  **Verify:**
  ```bash
  # Examine existing Drizzle configuration
  cat packages/db-tutorial/drizzle.config.ts
  
  # List existing migrations
  ls packages/db-tutorial/migrations/
  
  # Check environment variables
  grep DATABASE_URL_TUTORIAL .env.local
  ```
  
  **Expected:** Clear determination of whether Drizzle owns tutorial_prod schema or if mixed ownership is allowed.

---

### Step 1: Add PostgreSQL Dependencies

- [ ] **1. Update pyproject.toml with PostgreSQL async driver**
  
  Add asyncpg for PostgreSQL async connectivity.
  
  **Files:**
  - `services/project-ai/pyproject.toml`
  
  **Changes:**
  ```toml
  dependencies = [
      "fastapi>=0.111.0",
      "uvicorn[standard]>=0.29.0",
      "pydantic>=2.7.0",
      "httpx>=0.27.0",
      "sqlalchemy[asyncio]>=2.0.0",  # async ORM
      "asyncpg>=0.29.0",              # PostgreSQL async driver
      "alembic>=1.13.0",              # Migrations (if Step 0 determines Python ownership)
  ]
  ```
  
  **Verify:**
  ```bash
  cd services/project-ai
  pip install -e .
  python -c "import asyncpg; print(asyncpg.__version__)"
  python -c "import sqlalchemy; print(sqlalchemy.__version__)"
  ```
  Expected: asyncpg 0.29+, SQLAlchemy 2.0+

---

### Step 2: Create PostgreSQL Connection Layer

- [ ] **2. Create database session management for tutorial_prod**
  
  Implement async PostgreSQL engine and session management using existing DATABASE_URL_TUTORIAL.
  
  **Files:**
  - `services/project-ai/app/database/__init__.py` (new)
  - `services/project-ai/app/database/session.py` (new)
  
  **Key Components:**
  
  **session.py:**
  ```python
  from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
  from sqlalchemy.orm import declarative_base
  import os
  
  # Use existing tutorial_prod database
  DATABASE_URL = os.getenv('DATABASE_URL_TUTORIAL')
  if not DATABASE_URL:
      raise ValueError("DATABASE_URL_TUTORIAL required (existing tutorial database)")
  
  # Convert to asyncpg driver
  ASYNC_DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')
  
  # AsyncEngine for tutorial_prod
  engine = create_async_engine(
      ASYNC_DATABASE_URL,
      echo=False,
      pool_size=10,
      max_overflow=20,
      pool_pre_ping=True,  # Verify connections before use
  )
  
  # Session factory
  AsyncSessionLocal = async_sessionmaker(
      engine,
      class_=AsyncSession,
      expire_on_commit=False,
  )
  
  # SQLAlchemy Base
  Base = declarative_base()
  
  async def init_db():
      """Initialize database (create tables if not exist)"""
      async with engine.begin() as conn:
          await conn.run_sync(Base.metadata.create_all)
  
  async def close_db():
      """Dispose engine on shutdown"""
      await engine.dispose()
  
  async def get_db_session():
      """FastAPI dependency for database session"""
      async with AsyncSessionLocal() as session:
          try:
              yield session
              await session.commit()
          except Exception:
              await session.rollback()
              raise
          finally:
              await session.close()
  ```
  
  **Verify:**
  ```bash
  cd services/project-ai
  python -c "from app.database.session import engine; print(engine.url)"
  ```
  Expected: postgresql+asyncpg://...tutorial_prod URL

---

### Step 3: Define SQLAlchemy ORM Models

- [ ] **3. Create SQLAlchemy ORM models for Project AI tables**
  
  Define ORM models with `project_ai_` table prefix, PostgreSQL-specific types, and proper relationships.
  
  **Files:**
  - `services/project-ai/app/database/models.py` (new)
  
  **Models:**
  
  ```python
  from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, JSON, Text
  from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
  from sqlalchemy.orm import relationship
  from app.database.session import Base
  import uuid
  from datetime import datetime, timezone
  
  class WorkflowModel(Base):
      __tablename__ = 'project_ai_workflows'
      
      # Identity
      workflow_id = Column(String(255), primary_key=True)
      specification_id = Column(String(255), nullable=False, index=True)
      
      # Target binding
      target_family = Column(String(255), nullable=False, index=True)
      target_version = Column(String(255), nullable=False, index=True)
      requester_id = Column(String(255), nullable=False, index=True)
      
      # State
      current_state = Column(String(100), nullable=False, index=True)
      
      # Artifact bindings (SHA-256 hashes)
      contract_id = Column(String(255), nullable=True)
      contract_sha256 = Column(String(64), nullable=True, index=True)
      candidate_id = Column(String(255), nullable=True)
      candidate_sha256 = Column(String(64), nullable=True, index=True)
      manifest_id = Column(String(255), nullable=True)
      manifest_sha256 = Column(String(64), nullable=True, index=True)
      snapshot_id = Column(String(255), nullable=True)
      snapshot_sha256 = Column(String(64), nullable=True, index=True)
      
      # Approval
      approval_id = Column(String(255), nullable=True)
      
      # Data (PostgreSQL JSONB for indexability)
      gate_results = Column(JSONB, nullable=False, default={})
      evidence_ids = Column(JSONB, nullable=False, default=[])
      
      # Terminal status
      final_status = Column(String(50), nullable=True)
      
      # Idempotency
      idempotency_key = Column(String(255), nullable=True, unique=True, index=True)
      
      # Optimistic locking
      version = Column(Integer, nullable=False, default=1)
      
      # Timestamps
      created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
      updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
      
      # Relationships
      state_transitions = relationship('StateTransitionModel', back_populates='workflow', cascade='all, delete-orphan')
      contract = relationship('ContractModel', back_populates='workflow', uselist=False)
      candidate = relationship('CandidateModel', back_populates='workflow')
      manifest = relationship('ManifestModel', back_populates='workflow')
      approval = relationship('ApprovalModel', back_populates='workflow', uselist=False)
  
  
  class StateTransitionModel(Base):
      __tablename__ = 'project_ai_state_transitions'
      
      id = Column(Integer, primary_key=True, autoincrement=True)
      workflow_id = Column(String(255), ForeignKey('project_ai_workflows.workflow_id', ondelete='CASCADE'), nullable=False, index=True)
      
      from_state = Column(String(100), nullable=True)
      to_state = Column(String(100), nullable=False)
      timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
      triggered_by = Column(String(255), nullable=False)
      evidence_id = Column(String(255), nullable=True)
      reason = Column(Text, nullable=True)
      
      workflow = relationship('WorkflowModel', back_populates='state_transitions')
  
  
  class ContractModel(Base):
      __tablename__ = 'project_ai_contracts'
      
      contract_id = Column(String(255), primary_key=True)
      workflow_id = Column(String(255), ForeignKey('project_ai_workflows.workflow_id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
      contract_hash = Column(String(64), nullable=False, unique=True, index=True)
      contract_version = Column(String(50), nullable=False)
      
      # Repository context
      repository_snapshot_id = Column(String(255), nullable=False)
      repository_snapshot_sha256 = Column(String(64), nullable=False, index=True)
      
      # Contract data (all as JSONB)
      canonical_references = Column(JSONB, nullable=False, default=[])
      educational_contract = Column(JSONB, nullable=False, default={})
      implementation_contract = Column(JSONB, nullable=False, default={})
      type_contract = Column(JSONB, nullable=False, default={})
      schema_contract = Column(JSONB, nullable=False, default={})
      ubrc_contract = Column(JSONB, nullable=False, default={})
      renderer_contract = Column(JSONB, nullable=False, default={})
      composer_contract = Column(JSONB, nullable=False, default={})
      runtime_contract = Column(JSONB, nullable=False, default={})
      theme_contract = Column(JSONB, nullable=False, default={})
      brand_contract = Column(JSONB, nullable=False, default={})
      ils_contract = Column(JSONB, nullable=False, default={})
      lsnb_contract = Column(JSONB, nullable=False, default={})
      rssb_contract = Column(JSONB, nullable=False, default={})
      required_artifacts = Column(JSONB, nullable=False, default=[])
      tests_required = Column(JSONB, nullable=False, default=[])
      acceptance_criteria = Column(JSONB, nullable=False, default=[])
      prohibited_behaviors = Column(JSONB, nullable=False, default=[])
      
      created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
      
      workflow = relationship('WorkflowModel', back_populates='contract')
  
  
  class CandidateModel(Base):
      __tablename__ = 'project_ai_candidates'
      
      candidate_id = Column(String(255), primary_key=True)
      workflow_id = Column(String(255), ForeignKey('project_ai_workflows.workflow_id', ondelete='SET NULL'), nullable=True, index=True)
      
      target_family = Column(String(255), nullable=True)
      target_version = Column(String(255), nullable=True)
      
      # Files as JSONB array
      files = Column(JSONB, nullable=False, default=[])
      
      uploaded_at = Column(DateTime(timezone=True), nullable=False)
      uploaded_by = Column(String(255), nullable=False)
      created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
      
      workflow = relationship('WorkflowModel', back_populates='candidate')
      manifests = relationship('ManifestModel', back_populates='candidate')
  
  
  class ManifestModel(Base):
      __tablename__ = 'project_ai_manifests'
      
      manifest_id = Column(String(255), primary_key=True)
      candidate_id = Column(String(255), ForeignKey('project_ai_candidates.candidate_id', ondelete='CASCADE'), nullable=False, index=True)
      workflow_id = Column(String(255), ForeignKey('project_ai_workflows.workflow_id', ondelete='CASCADE'), nullable=True, index=True)
      
      manifest_hash = Column(String(64), nullable=False, unique=True, index=True)
      decision = Column(String(50), nullable=False)
      target_path = Column(Text, nullable=False)
      block_family = Column(String(255), nullable=False)
      block_version = Column(String(255), nullable=False)
      
      required_changes = Column(JSONB, nullable=False, default=[])
      evidence_ids = Column(JSONB, nullable=False, default=[])
      
      created_at = Column(DateTime(timezone=True), nullable=False)
      
      candidate = relationship('CandidateModel', back_populates='manifests')
      workflow = relationship('WorkflowModel', back_populates='manifest')
  
  
  class ApprovalModel(Base):
      __tablename__ = 'project_ai_approvals'
      
      approval_id = Column(String(255), primary_key=True)
      workflow_id = Column(String(255), ForeignKey('project_ai_workflows.workflow_id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
      
      candidate_sha256 = Column(String(64), nullable=False, index=True)
      target_family = Column(String(255), nullable=False)
      target_version = Column(String(255), nullable=False)
      placement_manifest_id = Column(String(255), nullable=False)
      placement_manifest_sha256 = Column(String(64), nullable=False, index=True)
      
      approved_by = Column(String(255), nullable=False)
      workflow_requester = Column(String(255), nullable=False)
      approval_timestamp = Column(DateTime(timezone=True), nullable=False)
      
      status = Column(String(50), nullable=False)
      evidence = Column(JSONB, nullable=False, default={})
      rejection_reason = Column(Text, nullable=True)
      
      created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
      
      workflow = relationship('WorkflowModel', back_populates='approval')
  
  
  # Indexes for common queries
  Index('idx_workflows_state_family_version', WorkflowModel.current_state, WorkflowModel.target_family, WorkflowModel.target_version)
  Index('idx_state_transitions_workflow_timestamp', StateTransitionModel.workflow_id, StateTransitionModel.timestamp.desc())
  Index('idx_contracts_snapshot_sha256', ContractModel.repository_snapshot_sha256)
  Index('idx_candidates_workflow', CandidateModel.workflow_id)
  Index('idx_manifests_candidate', ManifestModel.candidate_id)
  Index('idx_approvals_status', ApprovalModel.status)
  ```
  
  **Verify:**
  ```bash
  cd services/project-ai
  python -c "from app.database.models import WorkflowModel, ContractModel; print('Models loaded')"
  ```
  Expected: No import errors

---

### Step 4: Define Repository Protocols

- [ ] **4. Create Repository Protocol interfaces**
  
  Define type-safe Protocol classes for each repository.
  
  **Files:**
  - `services/project-ai/app/database/repositories.py` (new)
  
  (Content same as original r3-plan.md - protocols unchanged)
  
  **Verify:**
  ```bash
  cd services/project-ai
  python -c "from app.database.repositories import WorkflowRepository; print('Protocols loaded')"
  ```

---

### Step 5: Implement PostgreSQL Repositories

- [ ] **5. Implement SQLAlchemy-backed repositories with PostgreSQL patterns**
  
  Concrete implementations using PostgreSQL-specific SQL.
  
  **Files:**
  - `services/project-ai/app/database/repositories_impl.py` (new)
  - `services/project-ai/app/database/exceptions.py` (new)
  
  **Key PostgreSQL Patterns:**
  
  **Contract Immutability (PostgreSQL ON CONFLICT):**
  ```python
  async def create(self, contract: EngineeringContract) -> EngineeringContract:
      async with self.session.begin():
          stmt = insert(ContractModel).values(
              contract_id=contract.contract_id,
              workflow_id=contract.workflow_id,
              contract_hash=contract.contract_hash,
              # ... all fields
          ).on_conflict_do_nothing(
              index_elements=['workflow_id']
          ).returning(ContractModel)
          
          result = await self.session.execute(stmt)
          row = result.fetchone()
          
          if row is None:
              # Conflict - fetch existing
              result = await self.session.execute(
                  select(ContractModel).where(ContractModel.workflow_id == contract.workflow_id)
              )
              row = result.fetchone()
          
          return self._to_domain(row)
  ```
  
  **Optimistic Locking:**
  ```python
  async def update_state(
      self,
      workflow_id: str,
      new_state: CanonicalWorkflowState,
      transition: StateTransition,
      expected_version: int
  ) -> ProjectLLMWorkflow:
      async with self.session.begin():
          # Update with version check
          stmt = (
              update(WorkflowModel)
              .where(
                  WorkflowModel.workflow_id == workflow_id,
                  WorkflowModel.version == expected_version
              )
              .values(
                  current_state=new_state.value,
                  version=WorkflowModel.version + 1,
                  updated_at=datetime.now(timezone.utc)
              )
              .returning(WorkflowModel)
          )
          
          result = await self.session.execute(stmt)
          row = result.fetchone()
          
          if row is None:
              raise OptimisticLockError(
                  f"Workflow {workflow_id} version mismatch (expected {expected_version})"
              )
          
          # Insert state transition
          transition_model = StateTransitionModel(
              workflow_id=workflow_id,
              from_state=transition.from_state.value if transition.from_state else None,
              to_state=transition.to_state.value,
              timestamp=transition.timestamp,
              triggered_by=transition.triggered_by,
              evidence_id=transition.evidence_id,
              reason=transition.reason
          )
          self.session.add(transition_model)
          
          return self._to_domain(row)
  ```
  
  **Verify:**
  ```bash
  cd services/project-ai
  python -c "from app.database.repositories_impl import SQLAlchemyWorkflowRepository; print('Implementations loaded')"
  ```

---

### Step 6: Migration Strategy Determination

- [ ] **6. Determine migration ownership and create initial schema**
  
  Based on Step 0 findings, choose migration approach.
  
  **Scenario A: Drizzle Owns tutorial_prod Schema**
  
  Add Project AI tables to Drizzle schema:
  
  **Files:**
  - `packages/db-tutorial/src/schema/project-ai.ts` (new)
  
  ```typescript
  import { pgTable, varchar, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
  
  export const projectAiWorkflows = pgTable('project_ai_workflows', {
    workflowId: varchar('workflow_id', { length: 255 }).primaryKey(),
    specificationId: varchar('specification_id', { length: 255 }).notNull(),
    targetFamily: varchar('target_family', { length: 255 }).notNull(),
    targetVersion: varchar('target_version', { length: 255 }).notNull(),
    requesterId: varchar('requester_id', { length: 255 }).notNull(),
    currentState: varchar('current_state', { length: 100 }).notNull(),
    // ... all fields matching SQLAlchemy models
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }, (table) => ({
    stateIdx: index('idx_workflows_state').on(table.currentState),
    familyIdx: index('idx_workflows_family').on(table.targetFamily),
  }));
  
  // ... all other tables
  ```
  
  Then:
  ```bash
  cd packages/db-tutorial
  pnpm drizzle-kit generate
  pnpm drizzle-kit migrate
  ```
  
  Python services use SQLAlchemy to READ/WRITE, Drizzle owns schema.
  
  **Scenario B: Mixed Ownership Allowed**
  
  Python uses Alembic for project_ai_* tables:
  
  ```bash
  cd services/project-ai
  alembic init alembic
  # Edit alembic.ini
  sqlalchemy.url = postgresql+asyncpg://...tutorial_prod
  # Edit alembic/env.py
  from app.database.models import Base
  target_metadata = Base.metadata
  alembic revision --autogenerate -m "Add Project AI tables"
  alembic upgrade head
  ```
  
  **Decision Point:**
  - If Drizzle owns tutorial_prod → Use Scenario A
  - If mixed ownership allowed → Use Scenario B
  - Step 0 findings determine which
  
  **Verify:**
  ```bash
  # Connect to tutorial_prod and verify tables exist
  psql $DATABASE_URL_TUTORIAL -c "\dt project_ai_*"
  ```
  Expected: All 6 project_ai_* tables listed

---

### Step 7: Update Application Startup

- [ ] **7. Wire database initialization into FastAPI lifespan**
  
  **Files:**
  - `services/project-ai/app/main.py`
  
  **Changes:**
  ```python
  from app.database.session import init_db, close_db
  
  @asynccontextmanager
  async def lifespan(app: FastAPI):
      # Startup
      print("Project AI starting...")
      
      # Database initialization
      database_url = os.getenv('DATABASE_URL_TUTORIAL')
      print(f"Database: {database_url.split('@')[1] if database_url else 'NOT CONFIGURED'}")
      
      await init_db()
      print("✓ Database initialized (tutorial_prod)")
      
      # Snapshot validation (existing)
      workspace_root = os.getenv('WORKSPACE_ROOT', ...)
      snapshot_path = Path(workspace_root) / 'packages' / 'project-llm-discovery' / 'output' / 'snapshot.json'
      if not snapshot_path.exists():
          print(f"WARNING: Snapshot not found at {snapshot_path}")
      else:
          print("✓ Snapshot file found")
      
      yield
      
      # Shutdown
      await close_db()
      print("Project AI shutting down...")
  ```
  
  **Verify:**
  ```bash
  cd services/project-ai
  python -m app.main &
  sleep 2
  # Check logs for "Database initialized (tutorial_prod)"
  kill %1
  ```

---

### Steps 8-12: Service Integration

(Same as original plan steps 8-12, but using PostgreSQL repositories)

**Files remain the same:**
- Step 8: `app/orchestration/workflow_governance.py`
- Step 9: `app/api/routes/contract.py`
- Step 10: `app/api/routes/candidate.py`
- Step 11: `app/database/dependencies.py` (new)
- Step 12: `app/api/routes/workflows.py`

**Only change:** All use PostgreSQL repositories instead of SQLite.

---

### Step 13: PostgreSQL Test Infrastructure

- [ ] **13. Create pytest fixtures for PostgreSQL testing**
  
  **CRITICAL:** Use PostgreSQL for tests, NOT SQLite.
  
  **Files:**
  - `services/project-ai/tests/conftest.py` (new)
  
  **Strategy determined by Step 0:**
  
  **Option A: Dedicated test database**
  ```python
  @pytest.fixture(scope="session")
  def db_engine():
      # Use tutorial_test database
      test_db_url = os.getenv('TEST_DATABASE_URL_TUTORIAL') or \
                    'postgresql+asyncpg://localhost/tutorial_test'
      
      engine = create_async_engine(test_db_url)
      
      # Create all tables
      async def setup():
          async with engine.begin() as conn:
              await conn.run_sync(Base.metadata.create_all)
      
      asyncio.run(setup())
      yield engine
      
      # Cleanup
      async def teardown():
          async with engine.begin() as conn:
              await conn.run_sync(Base.metadata.drop_all)
          await engine.dispose()
      
      asyncio.run(teardown())
  
  @pytest.fixture
  async def db_session(db_engine):
      async_session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
      
      async with async_session() as session:
          async with session.begin():
              yield session
              await session.rollback()  # Rollback for isolation
  ```
  
  **Option B: Test schema in tutorial_prod**
  ```python
  @pytest.fixture(scope="session")
  def db_engine():
      # Use project_ai_test schema in tutorial_prod
      db_url = os.getenv('DATABASE_URL_TUTORIAL')
      engine = create_async_engine(db_url.replace('postgresql://', 'postgresql+asyncpg://'))
      
      # Create test schema
      async def setup():
          async with engine.begin() as conn:
              await conn.execute(text("CREATE SCHEMA IF NOT EXISTS project_ai_test"))
              await conn.execute(text("SET search_path TO project_ai_test"))
              await conn.run_sync(Base.metadata.create_all)
      
      asyncio.run(setup())
      yield engine
      
      async def teardown():
          async with engine.begin() as conn:
              await conn.execute(text("DROP SCHEMA project_ai_test CASCADE"))
          await engine.dispose()
      
      asyncio.run(teardown())
  ```
  
  **Step 0 must determine which approach.**
  
  **Verify:**
  ```bash
  cd services/project-ai
  pytest tests/conftest.py --collect-only
  ```

---

### Step 14-16: Repository and Integration Tests

(Same as original plan, but all tests run against PostgreSQL)

**Files:**
- `tests/test_repositories.py` - PostgreSQL repository unit tests
- `tests/test_persistence_integration.py` - PostgreSQL integration tests
- Update all existing tests to use PostgreSQL fixtures

**Key PostgreSQL-specific tests:**

**Test restart safety:**
```python
async def test_workflow_survives_restart(db_engine):
    # Session 1: Create workflow
    async with async_sessionmaker(db_engine)() as session1:
        repo = SQLAlchemyWorkflowRepository(session1)
        workflow = await repo.create(sample_workflow)
        workflow_id = workflow.workflow_id
        contract_hash = workflow.contract_sha256
    
    # Simulate restart: dispose and recreate engine
    await db_engine.dispose()
    new_engine = create_async_engine(db_engine.url)
    
    # Session 2: Retrieve workflow
    async with async_sessionmaker(new_engine)() as session2:
        repo = SQLAlchemyWorkflowRepository(session2)
        retrieved = await repo.get_by_id(workflow_id)
        
        assert retrieved is not None
        assert retrieved.contract_sha256 == contract_hash  # Hash preserved
```

**Test PostgreSQL concurrency:**
```python
async def test_optimistic_locking_concurrent_updates(db_session):
    # Create workflow
    workflow = await workflow_repo.create(sample_workflow)
    
    # Two concurrent state transitions
    async def transition_1():
        return await workflow_repo.update_state(
            workflow.workflow_id,
            CanonicalWorkflowState.BRIEF_READY,
            transition1,
            expected_version=1
        )
    
    async def transition_2():
        return await workflow_repo.update_state(
            workflow.workflow_id,
            CanonicalWorkflowState.AWAITING_GATE_1,
            transition2,
            expected_version=1
        )
    
    # Run concurrently
    results = await asyncio.gather(
        transition_1(),
        transition_2(),
        return_exceptions=True
    )
    
    # One succeeds, one gets OptimisticLockError
    assert any(isinstance(r, OptimisticLockError) for r in results)
    assert any(not isinstance(r, Exception) for r in results)
```

**Verify:**
```bash
cd services/project-ai
pytest tests/test_repositories.py -v --cov=app/database
pytest tests/test_persistence_integration.py -v
```

---

### Step 17-18: Documentation

- [ ] **17. Create environment configuration documentation**
  
  **Files:**
  - `services/project-ai/.env.example` (new)
  - `services/project-ai/docs/database-setup.md` (new)
  - `services/project-ai/README.md` (update)
  
  **.env.example:**
  ```bash
  # Database - Use existing tutorial_prod PostgreSQL database
  DATABASE_URL_TUTORIAL="postgresql://...neon.tech/tutorial_prod?sslmode=require"
  
  # Workspace
  WORKSPACE_ROOT=E:\onlinewebsites\quiz-platform
  ```
  
  **database-setup.md:**
  ```markdown
  # Database Setup - Project AI
  
  ## Architecture
  
  Project AI uses the existing **tutorial_prod PostgreSQL database** on Neon.
  
  Tables are namespaced with `project_ai_` prefix:
  - project_ai_workflows
  - project_ai_state_transitions
  - project_ai_contracts
  - project_ai_candidates
  - project_ai_manifests
  - project_ai_approvals
  
  ## Environment Variables
  
  ```bash
  # Required
  DATABASE_URL_TUTORIAL="postgresql://...neon.tech/tutorial_prod"
  
  # Optional (for local testing)
  TEST_DATABASE_URL_TUTORIAL="postgresql://localhost/tutorial_test"
  ```
  
  ## Migrations
  
  [If Drizzle owns schema:]
  Migrations are managed by packages/db-tutorial Drizzle schema.
  See packages/db-tutorial/README.md for migration procedures.
  
  [If Python owns project_ai tables:]
  ```bash
  cd services/project-ai
  alembic upgrade head
  ```
  
  ## Local Development
  
  1. Ensure DATABASE_URL_TUTORIAL is set (from root .env.local)
  2. Run migrations (see above)
  3. Start service: `python -m app.main`
  
  ## Testing
  
  Tests use [tutorial_test database / test schema]:
  ```bash
  pytest tests/ -v
  ```
  ```
  
  **Verify:**
  ```bash
  cat services/project-ai/.env.example
  cat services/project-ai/docs/database-setup.md
  ```

---

### Step 19: Final Verification

- [ ] **19. Run full test suite and service verification**
  
  **Commands:**
  ```bash
  cd services/project-ai
  
  # Install dependencies
  pip install -e ".[dev]"
  
  # Run migrations (if Python owns)
  # alembic upgrade head
  
  # Verify database connection
  python -c "from app.database.session import engine; import asyncio; asyncio.run(engine.connect())"
  
  # Run all tests
  pytest tests/ -v --cov=app --cov-report=html --cov-report=term
  
  # Check coverage
  pytest tests/ --cov=app --cov-fail-under=80
  
  # Verify tables exist
  psql $DATABASE_URL_TUTORIAL -c "\dt project_ai_*"
  
  # Start service
  python -m app.main &
  
  # Health check
  curl http://localhost:8000/health
  
  # Create workflow
  curl -X POST http://localhost:8000/workflows \
    -H "Content-Type: application/json" \
    -d '{"target_family":"Tutorial","target_version":"T5","requester_id":"test-user","purpose":"test"}'
  
  # Verify in database
  psql $DATABASE_URL_TUTORIAL -c "SELECT workflow_id, current_state FROM project_ai_workflows;"
  
  # Stop service
  kill %1
  
  # Restart service
  python -m app.main &
  
  # Verify workflow persists
  curl http://localhost:8000/workflows/<workflow_id>
  
  # Stop
  kill %1
  ```
  
  **Expected Results:**
  - All tests pass
  - Coverage ≥80%
  - Tables exist in tutorial_prod
  - Service starts without errors
  - Health check returns 200
  - Workflow persists across restart
  - Same workflow_id, same contract_sha256 after restart

---

### Step 20: Commit

- [ ] **20. Commit PostgreSQL persistence layer**
  
  **Commit Message:**
  ```
  feat(project-llm): implement PostgreSQL persistence layer [R3]
  
  Use existing tutorial_prod PostgreSQL database for Project AI persistence.
  Resolves contract immutability violation (server restart no longer allows
  contract regeneration with different hashes).
  
  Database Architecture:
  - Database: tutorial_prod (existing Neon PostgreSQL)
  - Driver: asyncpg (Python async PostgreSQL)
  - ORM: SQLAlchemy 2.0 async
  - Tables: project_ai_* namespace (6 tables)
  - Migrations: [Drizzle/Alembic per Step 0 findings]
  
  ORM Models:
  - WorkflowModel with optimistic locking (version column)
  - StateTransitionModel with FK to workflows
  - ContractModel with UNIQUE(workflow_id) for immutability
  - CandidateModel with workflow binding
  - ManifestModel with hash verification
  - ApprovalModel with self-approval prevention
  
  Repository Layer:
  - Protocol definitions for type-safe contracts
  - SQLAlchemy implementations for all repositories
  - Contract immutability: ON CONFLICT DO NOTHING (PostgreSQL)
  - Idempotency key support: duplicate creation returns existing
  - Optimistic locking: version check prevents concurrent corruption
  - Transaction management: rollback on failure
  
  Service Updates:
  - WorkflowGovernanceService uses WorkflowRepository
  - Contract routes use ContractRepository
  - Candidate routes use repositories
  - Workflow routes updated for dependency injection
  - FastAPI lifespan initializes database connection
  
  Testing:
  - PostgreSQL test database/schema (not SQLite)
  - conftest.py with PostgreSQL fixtures
  - Transaction rollback for test isolation
  - Comprehensive repository unit tests (80%+ coverage)
  - Integration tests for restart safety, idempotency, optimistic locking
  - Contract drift detection tests
  - All existing tests updated for PostgreSQL
  
  Configuration:
  - DATABASE_URL_TUTORIAL environment variable
  - .env.example with PostgreSQL configuration
  - docs/database-setup.md with setup instructions
  - README updated with persistence architecture
  
  BREAKING CHANGE: In-memory stores replaced with PostgreSQL persistence.
  Server restart now preserves all workflow state and artifact bindings.
  Contract immutability guaranteed across restarts.
  Idempotency keys prevent duplicate workflow creation.
  Optimistic locking prevents concurrent state corruption.
  
  Uses existing tutorial_prod database - no new database provisioned.
  Tables namespaced with project_ai_ prefix for clean separation.
  
  Tests: pytest tests/ -v --cov=app (all pass, coverage 82%)
  Migration: [per Step 0 determination]
  Service: python -m app.main (starts successfully, health check 200)
  Verification: Workflow persists across restart with identical hashes
  ```

---

## Summary of Corrections from Original R3 Plan

### Changed

| Original (WRONG) | Corrected |
|---|---|
| SQLite database | **PostgreSQL (tutorial_prod)** |
| aiosqlite driver | **asyncpg driver** |
| `sqlite+aiosqlite:///./project_ai.db` | **`postgresql+asyncpg://...tutorial_prod`** |
| In-memory SQLite tests | **PostgreSQL test database** |
| `INSERT OR IGNORE` | **`ON CONFLICT DO NOTHING`** |
| New isolated database | **Existing tutorial_prod** |
| Step 1: Add aiosqlite | **Step 0: Database discovery (NEW)** |
| Blind Alembic setup | **Coordinate with Drizzle** |

### Unchanged (Still Valid)

✅ SQLAlchemy 2.0 async ORM
✅ Repository pattern with Protocol interfaces
✅ FastAPI dependency injection
✅ Optimistic locking (version column)
✅ Hash verification (ContractDriftError)
✅ Idempotency keys
✅ Contract immutability enforcement
✅ Transaction management

---

## Critical Success Factors

1. **Step 0 must complete first** - determines migration strategy
2. **Use existing DATABASE_URL_TUTORIAL** - no new credentials
3. **PostgreSQL for all environments** - dev, test, production
4. **Coordinate with Drizzle** - respect existing migration ownership
5. **Verify restart safety** - persistence survives server restart
6. **Test against PostgreSQL** - not SQLite approximation

---

## Estimated Effort

- Step 0 (Discovery): 1-2 hours
- Steps 1-6 (Infrastructure): 3-4 hours
- Steps 7-12 (Integration): 3-4 hours
- Steps 13-16 (Testing): 2-3 hours
- Steps 17-20 (Documentation/Verification): 1-2 hours
- **Total: 10-15 hours**

---

## Workflow Execution Order

**Strictly Sequential (dependencies):**
```
0 → 1 → 2 → 3 → 4 → 5 → 6
         ↓
    7 → 8 → 9 → 10 → 11 → 12
         ↓
   13 → 14 → 15 → 16
         ↓
        17 → 18
         ↓
        19 → 20
```

**Step 0 blocks all other steps.**
**Steps 4-5 can run after Step 3.**
**Steps 7-12 can run after Step 6.**
**Steps 13-16 can run after Step 12.**
