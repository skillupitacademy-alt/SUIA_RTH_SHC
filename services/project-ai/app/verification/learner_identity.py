"""
Learner Runtime Test Identity Provider.

ARCHITECTURAL INVARIANTS:
1. Does NOT mint JWTs directly from services/project-ai using JWT_SECRET.
   Instead, requests a short-lived test-only fixture session from the SkillUp test auth endpoint.
2. Fails with LearnerRuntimeTestIdentityUnavailable if disabled or unavailable.
3. Never logs or persists raw tokens or credentials.
"""

import os
import urllib.request
import urllib.error
import json
from dataclasses import dataclass
from typing import Optional


class LearnerRuntimeTestIdentityUnavailable(Exception):
    """Raised when safe test identity cannot be obtained."""
    def __init__(self, message: str, code: str = "RUNTIME_TEST_IDENTITY_UNAVAILABLE"):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class LearnerSessionResult:
    """Non-production test session metadata."""
    cookieName: str
    cookieValue: str
    domain: str
    expiresAt: str
    learnerIdHash: str
    testTenant: str


class LearnerRuntimeTestIdentityProvider:
    """Platform-owned identity provider obtaining isolated non-production test sessions."""

    def __init__(
        self,
        enabled: Optional[bool] = None,
        base_url: Optional[str] = None,
        test_tenant: Optional[str] = None,
        fixture_id: Optional[str] = None,
        auth_mode: Optional[str] = None,
    ):
        if enabled is None:
            raw_enabled = os.environ.get("PROJECT_LLM_LEARNER_RUNTIME_ENABLED", "false").strip().lower()
            self.enabled = raw_enabled in ("true", "1", "yes")
        else:
            self.enabled = enabled

        self.base_url = (base_url or os.environ.get("PROJECT_LLM_LEARNER_BASE_URL", "http://skillup.localhost:3009")).rstrip("/")
        self.test_tenant = test_tenant or os.environ.get("PROJECT_LLM_LEARNER_TEST_TENANT", "skillup")
        self.fixture_id = fixture_id or os.environ.get("PROJECT_LLM_LEARNER_TEST_FIXTURE_ID", "test-fixture-learner-01")
        self.auth_mode = auth_mode or os.environ.get("PROJECT_LLM_LEARNER_AUTH_MODE", "internal_fixture")

    def get_test_session(self) -> LearnerSessionResult:
        """
        Request a short-lived non-production fixture session from SkillUp.
        Raises LearnerRuntimeTestIdentityUnavailable if unavailable.
        """
        if not self.enabled:
            raise LearnerRuntimeTestIdentityUnavailable(
                "Learner runtime verification is disabled in configuration (PROJECT_LLM_LEARNER_RUNTIME_ENABLED=false)"
            )

        if self.auth_mode == "internal_fixture":
            return self._request_fixture_session()
        elif self.auth_mode == "test_login":
            return self._request_test_login_session()
        else:
            raise LearnerRuntimeTestIdentityUnavailable(
                f"Unsupported PROJECT_LLM_LEARNER_AUTH_MODE: {self.auth_mode}"
            )

    def _request_fixture_session(self) -> LearnerSessionResult:
        endpoint = f"{self.base_url}/api/auth/test-fixture-session"
        payload = json.dumps({
            "fixtureId": self.fixture_id,
            "tenant": self.test_tenant,
        }).encode("utf-8")

        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Project-LLM-Runtime-Verifier/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status != 200:
                    raise LearnerRuntimeTestIdentityUnavailable(
                        f"Fixture session endpoint returned HTTP {resp.status}"
                    )
                raw_data = resp.read().decode("utf-8")
                data = json.loads(raw_data)
        except urllib.error.HTTPError as e:
            raise LearnerRuntimeTestIdentityUnavailable(
                f"Fixture session endpoint failed with HTTP {e.code}: {e.reason}"
            )
        except urllib.error.URLError as e:
            raise LearnerRuntimeTestIdentityUnavailable(
                f"Cannot connect to fixture session endpoint at {endpoint}: {e.reason}"
            )
        except Exception as e:
            raise LearnerRuntimeTestIdentityUnavailable(
                f"Error retrieving fixture session: {str(e)}"
            )

        required_keys = ["cookieName", "cookieValue", "domain", "expiresAt", "learnerIdHash", "testTenant"]
        missing = [k for k in required_keys if k not in data or not data[k]]
        if missing:
            raise LearnerRuntimeTestIdentityUnavailable(
                f"Fixture session response missing required fields: {missing}"
            )

        return LearnerSessionResult(
            cookieName=str(data["cookieName"]),
            cookieValue=str(data["cookieValue"]),
            domain=str(data["domain"]),
            expiresAt=str(data["expiresAt"]),
            learnerIdHash=str(data["learnerIdHash"]),
            testTenant=str(data["testTenant"]),
        )

    def _request_test_login_session(self) -> LearnerSessionResult:
        # Alternative test login mode for environments using pre-seeded test accounts
        test_email = os.environ.get("PROJECT_LLM_TEST_LEARNER_EMAIL")
        test_password = os.environ.get("PROJECT_LLM_TEST_LEARNER_PASSWORD")
        if not test_email or not test_password:
            raise LearnerRuntimeTestIdentityUnavailable(
                "Test login mode requires PROJECT_LLM_TEST_LEARNER_EMAIL and PROJECT_LLM_TEST_LEARNER_PASSWORD in environment"
            )

        endpoint = f"{self.base_url}/api/auth/login"
        payload = json.dumps({
            "email": test_email,
            "password": test_password,
        }).encode("utf-8")

        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status != 200:
                    raise LearnerRuntimeTestIdentityUnavailable(f"Test login endpoint returned HTTP {resp.status}")
                raw_data = resp.read().decode("utf-8")
                data = json.loads(raw_data)
                import hashlib
                return LearnerSessionResult(
                    cookieName="accessToken",
                    cookieValue=str(data.get("token") or data.get("accessToken", "")),
                    domain=f"{self.test_tenant}.localhost",
                    expiresAt=str(data.get("expiresAt", "")),
                    learnerIdHash=hashlib.sha256(test_email.encode("utf-8")).hexdigest(),
                    testTenant=self.test_tenant,
                )
        except Exception as e:
            raise LearnerRuntimeTestIdentityUnavailable(f"Test login failed: {str(e)}")
