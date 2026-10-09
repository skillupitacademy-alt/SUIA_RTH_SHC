"""
JWT configuration module.

Reads JWT settings from environment variables with validation.
"""

import os


def get_jwt_config() -> dict:
    """
    Get JWT configuration from environment variables.
    
    Returns:
        dict with keys:
            - secret_key: str (JWT signing secret)
            - algorithm: str (default: HS256)
            - access_token_expire_minutes: int (default: 30)
    
    Raises:
        ValueError: If JWT_SECRET_KEY is missing or less than 32 characters
    """
    secret_key = os.environ.get("JWT_SECRET_KEY")
    
    if not secret_key:
        raise ValueError(
            "JWT_SECRET_KEY environment variable is required. "
            "Set it to a secure random string of at least 32 characters."
        )
    
    if len(secret_key) < 32:
        raise ValueError(
            f"JWT_SECRET_KEY must be at least 32 characters long. "
            f"Current length: {len(secret_key)}"
        )
    
    algorithm = os.environ.get("JWT_ALGORITHM", "HS256")
    expire_minutes = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    return {
        "secret_key": secret_key,
        "algorithm": algorithm,
        "access_token_expire_minutes": expire_minutes
    }
