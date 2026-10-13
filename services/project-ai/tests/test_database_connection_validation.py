"""
Tests for database connection validation with trusted host/database allowlists.

Tests validate_and_connect(), parse_database_url(), and pre-connection safety checks.
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.workflows.migration_repair.safety import (
    DatabaseTarget,
    DatabaseMode,
    validate_and_connect,
    parse_database_url,
    TRUSTED_TEST_HOSTS,
    TRUSTED_TEST_DATABASES,
)


class TestTrustedConstants:
    """Test that trusted host and database constants are defined."""
    
    def test_trusted_hosts_defined(self):
        """Verify TRUSTED_TEST_HOSTS constant is defined and non-empty."""
        assert TRUSTED_TEST_HOSTS is not None
        assert len(TRUSTED_TEST_HOSTS) > 0
        assert isinstance(TRUSTED_TEST_HOSTS, frozenset)
        # Verify expected hosts
        assert "localhost" in TRUSTED_TEST_HOSTS
        assert "127.0.0.1" in TRUSTED_TEST_HOSTS
    
    def test_trusted_databases_defined(self):
        """Verify TRUSTED_TEST_DATABASES constant is defined and non-empty."""
        assert TRUSTED_TEST_DATABASES is not None
        assert len(TRUSTED_TEST_DATABASES) > 0
        assert isinstance(TRUSTED_TEST_DATABASES, frozenset)
        # Verify expected databases
        assert "test_quiz_platform" in TRUSTED_TEST_DATABASES


class TestParseDatabaseUrl:
    """Test parse_database_url() function."""
    
    def test_parse_database_url_extracts_components(self):
        """Verify parse_database_url extracts host, port, database, user."""
        url = "postgresql://testuser:testpass@localhost:5432/test_db"
        result = parse_database_url(url)
        
        assert result["host"] == "localhost"
        assert result["port"] == 5432
        assert result["database"] == "test_db"
        assert result["user"] == "testuser"
        assert result["password"] == "testpass"
    
    def test_parse_database_url_handles_postgres_scheme(self):
        """Verify parse_database_url accepts postgres:// scheme."""
        url = "postgres://user@localhost/testdb"
        result = parse_database_url(url)
        
        assert result["host"] == "localhost"
        assert result["database"] == "testdb"
    
    def test_parse_database_url_rejects_invalid_scheme(self):
        """Verify parse_database_url rejects non-PostgreSQL URLs."""
        url = "mysql://user@localhost/db"
        
        with pytest.raises(ValueError, match="Invalid PostgreSQL URL format"):
            parse_database_url(url)
    
    def test_parse_database_url_handles_default_port(self):
        """Verify parse_database_url uses default port 5432."""
        url = "postgresql://user@localhost/testdb"
        result = parse_database_url(url)
        
        assert result["port"] == 5432
    
    def test_parse_database_url_handles_ip_address(self):
        """Verify parse_database_url handles IP addresses."""
        url = "postgresql://user@127.0.0.1/testdb"
        result = parse_database_url(url)
        
        assert result["host"] == "127.0.0.1"


class TestValidateAndConnect:
    """Test validate_and_connect() function with pre-connection validation."""
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_rejects_untrusted_host(self):
        """Verify validate_and_connect rejects connections to untrusted hosts."""
        # Create target with MIGRATE mode first to bypass __post_init__ validation
        # Then manually test validate_and_connect with VERIFY mode URL
        target = DatabaseTarget(
            url="postgresql://testuser@localhost/test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.MIGRATE,  # Use MIGRATE to bypass __post_init__ checks
            env="test"
        )
        
        # Now change to an untrusted host URL and VERIFY mode to test validate_and_connect
        target.url = "postgresql://testuser@untrusted-host.example.com/test_quiz_platform"
        target.mode = DatabaseMode.VERIFY
        
        with pytest.raises(ValueError, match="Untrusted database host"):
            await validate_and_connect(target)
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_rejects_untrusted_database(self):
        """Verify validate_and_connect rejects connections to untrusted databases."""
        target = DatabaseTarget(
            url="postgresql://testuser@localhost/untrusted_database",
            name="untrusted_database",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        with pytest.raises(ValueError, match="Untrusted database name"):
            await validate_and_connect(target)
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_accepts_localhost_test_db(self):
        """Verify validate_and_connect accepts localhost with trusted test database."""
        target = DatabaseTarget(
            url="postgresql://testuser:testpass@localhost/test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        # Mock asyncpg.connect to avoid actual database connection
        with patch("app.workflows.migration_repair.safety.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_connect.return_value = mock_conn
            
            result = await validate_and_connect(target)
            
            # Verify connection was attempted
            mock_connect.assert_called_once_with(target.url)
            assert result == mock_conn
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_accepts_127_0_0_1_test_db(self):
        """Verify validate_and_connect accepts 127.0.0.1 with trusted test database."""
        target = DatabaseTarget(
            url="postgresql://testuser@127.0.0.1/test_tutorial",
            name="test_tutorial",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        with patch("app.workflows.migration_repair.safety.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_connect.return_value = mock_conn
            
            result = await validate_and_connect(target)
            
            mock_connect.assert_called_once()
            assert result == mock_conn
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_fails_closed_on_missing_host(self):
        """Verify validate_and_connect fails closed when host is missing."""
        # Create a URL without a proper host
        target = DatabaseTarget(
            url="postgresql:///test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        # This should fail because we can't validate the host
        with pytest.raises(ValueError):
            await validate_and_connect(target)
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_fails_closed_on_missing_database(self):
        """Verify validate_and_connect fails closed when database name is missing."""
        target = DatabaseTarget(
            url="postgresql://testuser@localhost/",
            name="",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        with pytest.raises(ValueError, match="Database name is missing"):
            await validate_and_connect(target)
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_rejects_production_like_user(self):
        """Verify validate_and_connect rejects production-like database users."""
        target = DatabaseTarget(
            url="postgresql://prod_admin@localhost/test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        with pytest.raises(ValueError, match="Production-like database user"):
            await validate_and_connect(target)
    
    @pytest.mark.asyncio
    async def test_validate_and_connect_propagates_connection_errors(self):
        """Verify validate_and_connect propagates connection errors as ValueError."""
        target = DatabaseTarget(
            url="postgresql://testuser@localhost/test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        
        with patch("app.workflows.migration_repair.safety.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = Exception("Connection refused")
            
            with pytest.raises(ValueError, match="Failed to connect to database"):
                await validate_and_connect(target)


class TestDatabaseTargetValidation:
    """Test DatabaseTarget validation including host checking."""
    
    def test_database_target_validates_host_in_verify_mode(self):
        """Verify DatabaseTarget.__post_init__ checks host against TRUSTED_TEST_HOSTS."""
        # Should raise for untrusted host
        with pytest.raises(ValueError, match="Untrusted database host"):
            DatabaseTarget(
                url="postgresql://user@malicious-host.com/test_quiz_platform",
                name="test_quiz_platform",
                mode=DatabaseMode.VERIFY,
                env="test"
            )
    
    def test_database_target_accepts_trusted_host(self):
        """Verify DatabaseTarget accepts trusted hosts in VERIFY mode."""
        # Should not raise for localhost
        target = DatabaseTarget(
            url="postgresql://user@localhost/test_quiz_platform",
            name="test_quiz_platform",
            mode=DatabaseMode.VERIFY,
            env="test"
        )
        assert target.url == "postgresql://user@localhost/test_quiz_platform"
