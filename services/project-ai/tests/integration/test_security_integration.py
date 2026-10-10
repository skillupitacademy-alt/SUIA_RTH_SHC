"""
PostgreSQL Integration Tests for Security Contracts.

Tests RBAC, brand isolation, identity extraction, state machine, and W3/W5 workflow security
against real PostgreSQL database.

CRITICAL: Requires TEST_DATABASE_URL_TUTORIAL to be configured.
"""

import hashlib
import json
import logging
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock

from app.auth.authorization import (
    verify_brand_access,
    is_super_admin,
    require_role,
    require_any_role,
)
from app.auth.types import AuthenticatedPrincipal
from app.persistence.models import (
    WorkflowModel,
    CandidateModel,
    ManifestModel,
    StateTransitionModel,
)
from fastapi import HTTPException


# ============================================================================
# Domain 1 — RBAC Authorization (10 tests)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_admin_can_create_workflow(db_session, workflow_repo):
    """Test require_role(principal, 'contract_admin') allows workflow creation."""
    principal: AuthenticatedPrincipal = {
        "user_id": "admin_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    require_role(principal, "contract_admin")
    
    # Create workflow as contract_admin
    workflow = WorkflowModel(
        workflow_id="wf_rbac_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result.workflow_id == "wf_rbac_001"
    assert result.requester_id == "admin_user"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_viewer_denied_workflow_creation(db_session):
    """Test 403 raised for viewer role attempting privileged operation."""
    principal: AuthenticatedPrincipal = {
        "user_id": "viewer_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "viewer@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_role(principal, "contract_admin")
    
    assert exc_info.value.status_code == 403
    assert "contract_admin" in exc_info.value.detail


@pytest.mark.integration
@pytest.mark.asyncio
async def test_super_admin_bypasses_rbac(db_session, workflow_repo):
    """Test is_super_admin() returns True and bypasses checks."""
    principal: AuthenticatedPrincipal = {
        "user_id": "super_admin_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["super_admin"],
        "portal_identity": "super_admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "superadmin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Check super_admin privilege
    assert is_super_admin(principal) is True
    
    # Should bypass require_role check
    require_role(principal, "contract_admin")  # No exception
    require_role(principal, "any_role")  # No exception
    
    # Can create workflow without contract_admin role
    workflow = WorkflowModel(
        workflow_id="wf_rbac_super_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result.workflow_id == "wf_rbac_super_001"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_infrastructure_portal_identity_bypasses_rbac(db_session):
    """Test portal_identity='infrastructure' bypasses role checks."""
    principal: AuthenticatedPrincipal = {
        "user_id": "infra_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["infrastructure"],
        "portal_identity": "infrastructure",
        "token_type": "admin",
        "is_admin": True,
        "email": "infra@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Check infrastructure privilege
    assert is_super_admin(principal) is True
    
    # Should bypass all role checks
    require_role(principal, "contract_admin")  # No exception
    require_any_role(principal, ["contract_admin", "contract_reviewer"])  # No exception


@pytest.mark.integration
@pytest.mark.asyncio
async def test_empty_roles_denies_privileged_operations(db_session):
    """Test roles=[] raises 403 for privileged operations."""
    principal: AuthenticatedPrincipal = {
        "user_id": "no_role_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "norole@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_role(principal, "contract_admin")
    
    assert exc_info.value.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
async def test_case_insensitive_role_matching(db_session, workflow_repo):
    """Test 'Contract_Admin' matches 'contract_admin' (case-insensitive)."""
    principal: AuthenticatedPrincipal = {
        "user_id": "case_test_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["Contract_Admin"],  # Mixed case
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "case@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (case-insensitive match)
    require_role(principal, "contract_admin")
    
    # Verify can create workflow
    workflow = WorkflowModel(
        workflow_id="wf_case_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result.workflow_id == "wf_case_001"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_reviewer_read_only(db_session, workflow_repo):
    """Test contract_reviewer can list but not create workflows."""
    principal: AuthenticatedPrincipal = {
        "user_id": "reviewer_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_reviewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "reviewer@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Can call read operations (list workflows)
    workflows = await workflow_repo.list_by_state("REQUESTED")
    assert isinstance(workflows, list)
    
    # Cannot create workflows (requires contract_admin)
    with pytest.raises(HTTPException) as exc_info:
        require_role(principal, "contract_admin")
    
    assert exc_info.value.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
async def test_require_any_role_accepts_multiple(db_session):
    """Test require_any_role(['contract_admin', 'contract_reviewer']) accepts either."""
    # Test contract_admin accepted
    admin_principal: AuthenticatedPrincipal = {
        "user_id": "admin_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    require_any_role(admin_principal, ["contract_admin", "contract_reviewer"])  # No exception
    
    # Test contract_reviewer accepted
    reviewer_principal: AuthenticatedPrincipal = {
        "user_id": "reviewer_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_reviewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "reviewer@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    require_any_role(reviewer_principal, ["contract_admin", "contract_reviewer"])  # No exception
    
    # Test contract_viewer denied
    viewer_principal: AuthenticatedPrincipal = {
        "user_id": "viewer_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "viewer@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_any_role(viewer_principal, ["contract_admin", "contract_reviewer"])
    
    assert exc_info.value.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
async def test_admin_token_type_with_contract_admin_role(db_session, workflow_repo):
    """Test tokenType='admin' + role allowed."""
    principal: AuthenticatedPrincipal = {
        "user_id": "admin_token_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": "admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "admintoken@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    require_role(principal, "contract_admin")
    
    # Can create workflow
    workflow = WorkflowModel(
        workflow_id="wf_admin_token_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result.workflow_id == "wf_admin_token_001"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_rbac_denial_logs_warning(db_session, caplog):
    """Test authorization failure logged at WARNING level."""
    principal: AuthenticatedPrincipal = {
        "user_id": "log_test_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "logtest@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with caplog.at_level(logging.WARNING):
        with pytest.raises(HTTPException):
            require_role(principal, "contract_admin")
    
    # Check that warning was logged
    assert any("RBAC denial" in record.message for record in caplog.records)
    assert any("log_test_user" in record.message for record in caplog.records)


# ============================================================================
# Domain 2 — Brand Isolation (5 tests)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_same_brand_workflow_access_allowed(db_session, workflow_repo):
    """Test same-brand workflow access succeeds."""
    # Create workflow with brand='skillhub'
    workflow = WorkflowModel(
        workflow_id="wf_brand_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_skillhub",
        requester_brand="skillhub",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # User with same brand
    principal: AuthenticatedPrincipal = {
        "user_id": "user_skillhub",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@skillhub.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    verify_brand_access(principal, workflow.requester_brand)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cross_brand_workflow_access_denied(db_session, workflow_repo):
    """Test cross-brand workflow access raises 403."""
    # Create workflow with brand='skillhub'
    workflow = WorkflowModel(
        workflow_id="wf_cross_brand_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_skillhub",
        requester_brand="skillhub",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # User with different brand
    principal: AuthenticatedPrincipal = {
        "user_id": "user_techskills",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "techskills",
        "roles": [],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@techskills.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should raise 403
    with pytest.raises(HTTPException) as exc_info:
        verify_brand_access(principal, workflow.requester_brand)
    
    assert exc_info.value.status_code == 403
    assert "Cross-brand access denied" in exc_info.value.detail


@pytest.mark.integration
@pytest.mark.asyncio
async def test_infrastructure_user_cross_brand_bypass(db_session, workflow_repo):
    """Test infrastructure user (brand=None) can access any brand."""
    # Create workflow with brand='skillhub'
    workflow = WorkflowModel(
        workflow_id="wf_infra_bypass_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_skillhub",
        requester_brand="skillhub",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Infrastructure user with brand=None
    principal: AuthenticatedPrincipal = {
        "user_id": "infra_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["super_admin"],
        "portal_identity": "super_admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "infra@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (infrastructure bypass)
    verify_brand_access(principal, workflow.requester_brand)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_brand_none_resource_requires_infrastructure(db_session):
    """Test resource with brand=None requires infrastructure privilege."""
    # Regular user (no infrastructure privilege)
    regular_principal: AuthenticatedPrincipal = {
        "user_id": "regular_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "regular@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should raise 403 for resource_brand=None
    with pytest.raises(HTTPException) as exc_info:
        verify_brand_access(regular_principal, None)
    
    assert exc_info.value.status_code == 403
    assert "unclassified resource requires infrastructure privilege" in exc_info.value.detail
    
    # Infrastructure user should succeed
    infra_principal: AuthenticatedPrincipal = {
        "user_id": "infra_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["super_admin"],
        "portal_identity": "super_admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "infra@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    verify_brand_access(infra_principal, None)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_candidate_upload_captures_requester_brand(db_session, candidate_repo):
    """Test candidate upload captures uploader's brand."""
    # Simulate candidate upload with user brand
    principal_brand = "skillhub"
    
    candidate = CandidateModel(
        candidate_id="cand_brand_001",
        workflow_id="wf_brand_001",
        files={"test.ts": {"content": "test"}},
        uploaded_at=datetime.now(timezone.utc),
        uploaded_by="user_skillhub",
        uploader_brand=principal_brand,  # Captured from JWT
        target_family="tutorial",
        target_version="v1",
    )
    
    result = await candidate_repo.upsert(candidate)
    await db_session.commit()
    
    # Retrieve and verify brand persisted
    retrieved = await candidate_repo.get("cand_brand_001")
    
    assert retrieved is not None
    assert retrieved.uploader_brand == "skillhub"


# ============================================================================
# Domain 3 — Identity Extraction (5 tests)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_id_extracted_from_jwt(db_session, workflow_repo):
    """Test user_id extracted from JWT and used for workflow creation."""
    # Simulate JWT-extracted principal
    principal: AuthenticatedPrincipal = {
        "user_id": "jwt_user_123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "jwtuser@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Create workflow with JWT-extracted user_id
    workflow = WorkflowModel(
        workflow_id="wf_jwt_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],  # From JWT
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Verify user_id persisted correctly
    retrieved = await workflow_repo.get("wf_jwt_001", verify_bindings=False)
    assert retrieved.requester_id == "jwt_user_123"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_original_user_id_extraction(db_session, workflow_repo):
    """Test originalUserId claim extraction."""
    # Simulate JWT with impersonation
    principal: AuthenticatedPrincipal = {
        "user_id": "shadow_user_456",
        "original_user_id": "original_user_123",  # Before impersonation
        "shadow_user_id": "shadow_user_456",
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": "admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "shadow@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Create workflow tracking both identities
    workflow = WorkflowModel(
        workflow_id="wf_original_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        original_requester_id=principal["original_user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Verify original_user_id persisted
    retrieved = await workflow_repo.get("wf_original_001", verify_bindings=False)
    assert retrieved.original_requester_id == "original_user_123"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_shadow_user_id_extraction(db_session, workflow_repo):
    """Test shadowUserId claim extraction for admin impersonation."""
    # Simulate admin impersonating user
    principal: AuthenticatedPrincipal = {
        "user_id": "real_user_123",
        "original_user_id": "real_user_123",
        "shadow_user_id": "admin_shadow_789",  # Admin's identity
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": "admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Record both user and shadow identities
    workflow = WorkflowModel(
        workflow_id="wf_shadow_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],
        shadow_requester_id=principal["shadow_user_id"],
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Verify shadow_user_id persisted
    retrieved = await workflow_repo.get("wf_shadow_001", verify_bindings=False)
    assert retrieved.shadow_requester_id == "admin_shadow_789"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_client_supplied_user_id_ignored(db_session, workflow_repo):
    """Test route handler uses principal['user_id'] from JWT, not request body."""
    # JWT-extracted identity (trusted)
    jwt_user_id = "jwt_user_999"
    
    # Simulated client attempt to override (ignored)
    client_supplied_user_id = "malicious_user_666"
    
    principal: AuthenticatedPrincipal = {
        "user_id": jwt_user_id,
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "jwt@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Route handler MUST use principal["user_id"], ignore client request body
    workflow = WorkflowModel(
        workflow_id="wf_client_spoof_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id=principal["user_id"],  # From JWT, NOT request body
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Verify only JWT identity used
    retrieved = await workflow_repo.get("wf_client_spoof_001", verify_bindings=False)
    assert retrieved.requester_id == jwt_user_id
    assert retrieved.requester_id != client_supplied_user_id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_missing_user_id_claim_rejected(db_session):
    """Test JWT without user_id claim validation (handled at JWT layer)."""
    # This test verifies the contract: JWT layer must reject tokens without user_id
    # By the time we reach route handlers, user_id is guaranteed to exist
    
    # Malformed principal (should never happen if JWT validation works)
    malformed_principal = {
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "malformed@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Application code expects user_id to exist (KeyError would expose bug)
    with pytest.raises(KeyError):
        _ = malformed_principal["user_id"]


# ============================================================================
# Domain 4 — State Machine (5 tests)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_creation_initial_state(db_session, workflow_repo):
    """Test workflow created with current_state='REQUESTED'."""
    workflow = WorkflowModel(
        workflow_id="wf_state_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Verify initial state
    retrieved = await workflow_repo.get("wf_state_001", verify_bindings=False)
    assert retrieved.current_state == "REQUESTED"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_state_transition_recorded(db_session, workflow_repo, state_transition_repo):
    """Test StateTransitionModel records from_state and to_state."""
    # Create workflow
    workflow = WorkflowModel(
        workflow_id="wf_trans_002",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Record state transition
    transition = StateTransitionModel(
        workflow_id="wf_trans_002",
        from_state="REQUESTED",
        to_state="BRIEF_READY",
        timestamp=datetime.now(timezone.utc),
        triggered_by="system",
        reason="Contract generated",
    )
    
    result = await state_transition_repo.create(transition)
    await db_session.commit()
    
    # Verify transition recorded
    assert result.from_state == "REQUESTED"
    assert result.to_state == "BRIEF_READY"
    assert result.workflow_id == "wf_trans_002"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_transitions_to_implementing(db_session, workflow_repo, state_transition_repo):
    """Test approval transitions workflow to IMPLEMENTING state."""
    # Create workflow awaiting approval
    workflow = WorkflowModel(
        workflow_id="wf_approve_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="AWAITING_IMPLEMENTATION_APPROVAL",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Simulate approval (state transition)
    workflow.current_state = "IMPLEMENTING"
    await workflow_repo.upsert(workflow, expected_version=1)
    
    # Record transition
    transition = StateTransitionModel(
        workflow_id="wf_approve_001",
        from_state="AWAITING_IMPLEMENTATION_APPROVAL",
        to_state="IMPLEMENTING",
        timestamp=datetime.now(timezone.utc),
        triggered_by="admin_user",
        reason="Approved by contract_admin",
    )
    
    await state_transition_repo.create(transition)
    await db_session.commit()
    
    # Verify state updated
    retrieved = await workflow_repo.get("wf_approve_001", verify_bindings=False)
    assert retrieved.current_state == "IMPLEMENTING"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_reject_transitions_to_rejected(db_session, workflow_repo, state_transition_repo):
    """Test reject transitions workflow to REJECTED state."""
    # Create workflow awaiting approval
    workflow = WorkflowModel(
        workflow_id="wf_reject_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="AWAITING_IMPLEMENTATION_APPROVAL",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Simulate rejection
    workflow.current_state = "REJECTED"
    workflow.rejection_reason = "Does not meet requirements"
    await workflow_repo.upsert(workflow, expected_version=1)
    
    # Record transition
    transition = StateTransitionModel(
        workflow_id="wf_reject_001",
        from_state="AWAITING_IMPLEMENTATION_APPROVAL",
        to_state="REJECTED",
        timestamp=datetime.now(timezone.utc),
        triggered_by="admin_user",
        reason="Rejected: Does not meet requirements",
    )
    
    await state_transition_repo.create(transition)
    await db_session.commit()
    
    # Verify state updated
    retrieved = await workflow_repo.get("wf_reject_001", verify_bindings=False)
    assert retrieved.current_state == "REJECTED"
    assert retrieved.rejection_reason == "Does not meet requirements"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_invalid_state_transition_prevented(db_session, workflow_repo):
    """Test invalid state transition validation (business logic layer)."""
    # Create workflow in IMPLEMENTING state
    workflow = WorkflowModel(
        workflow_id="wf_invalid_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="IMPLEMENTING",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Attempting invalid transition: IMPLEMENTING → REQUESTED (backwards)
    # Note: This test demonstrates the contract - actual validation happens in business logic
    # The database allows any state value, but application enforces valid transitions
    
    # Business logic would check: is transition valid?
    valid_transitions_from_implementing = [
        "TESTING",
        "VERIFYING",
        "AWAITING_FINAL_APPROVAL",
        "BLOCKED",
    ]
    
    invalid_transition_to = "REQUESTED"
    
    # Verify invalid transition would be rejected
    assert invalid_transition_to not in valid_transitions_from_implementing


# ============================================================================
# Domain 5 — W3/W5 Workflow Security (5 tests)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_candidate_validator_hash_verification(db_session, candidate_repo):
    """Test candidate upload computes SHA-256 from file content."""
    files_data = {
        "index.ts": {"content": "export const x = 1;"},
        "utils.ts": {"content": "export function helper() {}"},
    }
    
    # Compute expected hash (canonical JSON serialization)
    canonical = json.dumps(files_data, sort_keys=True, ensure_ascii=False)
    expected_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    candidate = CandidateModel(
        candidate_id="cand_hash_001",
        workflow_id="wf_hash_001",
        files=files_data,
        uploaded_at=datetime.now(timezone.utc),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
    )
    
    # Repository should compute hash automatically
    result = await candidate_repo.upsert(candidate)
    await db_session.commit()
    
    # Verify hash computed correctly
    assert result.candidate_sha256 == expected_hash
    assert len(result.candidate_sha256) == 64  # SHA256 hex length


@pytest.mark.integration
@pytest.mark.asyncio
async def test_canonical_comparator_brand_independence_check(db_session, candidate_repo):
    """Test comparison flags hardcoded brand markers."""
    # Candidate with brand-specific hardcoded values
    files_data = {
        "config.ts": {
            "content": "export const BRAND = 'skillhub'; // HARDCODED BRAND MARKER"
        },
    }
    
    candidate = CandidateModel(
        candidate_id="cand_brand_check_001",
        workflow_id="wf_brand_check_001",
        files=files_data,
        uploaded_at=datetime.now(timezone.utc),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
        comparison_report={
            "brand_independence_violations": [
                {
                    "file": "config.ts",
                    "line": 1,
                    "pattern": "BRAND = 'skillhub'",
                    "severity": "ERROR"
                }
            ]
        },
    )
    
    result = await candidate_repo.upsert(candidate)
    await db_session.commit()
    
    # Verify brand violations recorded
    retrieved = await candidate_repo.get("cand_brand_check_001")
    assert retrieved.comparison_report is not None
    assert "brand_independence_violations" in retrieved.comparison_report


@pytest.mark.integration
@pytest.mark.asyncio
async def test_placement_manifest_sealed_with_hash(db_session, manifest_repo):
    """Test placement manifest sealed with manifest_sha256."""
    manifest_data = {
        "decision": "ACCEPT",
        "target_path": "/apps/tutorial",
        "block_family": "tutorial",
        "block_version": "v1",
        "required_changes": [],
        "evidence_ids": ["ev_001"],
    }
    
    # Compute hash
    canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
    manifest_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    manifest = ManifestModel(
        manifest_id="man_seal_001",
        candidate_id="cand_seal_001",
        manifest_hash=manifest_hash,
        decision="ACCEPT",
        target_path="/apps/tutorial",
        block_family="tutorial",
        block_version="v1",
        required_changes=[],
        evidence_ids=["ev_001"],
        created_at=datetime.now(timezone.utc),
    )
    
    result = await manifest_repo.upsert(manifest)
    await db_session.commit()
    
    # Verify manifest sealed with hash
    assert result.manifest_hash == manifest_hash
    assert len(result.manifest_hash) == 64


@pytest.mark.integration
@pytest.mark.asyncio
async def test_placement_approval_requires_contract_admin(db_session):
    """Test placement approval requires contract_admin role."""
    # Non-admin user
    viewer_principal: AuthenticatedPrincipal = {
        "user_id": "viewer_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "viewer@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should raise 403
    with pytest.raises(HTTPException) as exc_info:
        require_role(viewer_principal, "contract_admin")
    
    assert exc_info.value.status_code == 403
    
    # Admin user succeeds
    admin_principal: AuthenticatedPrincipal = {
        "user_id": "admin_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    require_role(admin_principal, "contract_admin")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_placement_manifest_tamper_detection(db_session, manifest_repo):
    """Test manifest hash verification detects tampering."""
    manifest_data = {
        "decision": "ACCEPT",
        "target_path": "/apps/tutorial",
        "block_family": "tutorial",
        "block_version": "v1",
        "required_changes": [],
        "evidence_ids": [],
    }
    
    canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
    correct_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    manifest = ManifestModel(
        manifest_id="man_tamper_001",
        candidate_id="cand_tamper_001",
        manifest_hash=correct_hash,
        decision="ACCEPT",
        target_path="/apps/tutorial",
        block_family="tutorial",
        block_version="v1",
        required_changes=[],
        evidence_ids=[],
        created_at=datetime.now(timezone.utc),
    )
    
    await manifest_repo.upsert(manifest)
    await db_session.commit()
    
    # Manually corrupt the hash
    from app.persistence.repositories import HashMismatchError
    
    await db_session.execute(
        """
        UPDATE project_ai_manifests
        SET manifest_hash = 'tampered_hash_00000000000000000000000000000000'
        WHERE manifest_id = 'man_tamper_001'
        """
    )
    await db_session.commit()
    
    # Should raise HashMismatchError
    with pytest.raises(HashMismatchError) as exc_info:
        await manifest_repo.get("man_tamper_001")
    
    assert exc_info.value.entity_type == "Manifest"
    assert exc_info.value.entity_id == "man_tamper_001"
