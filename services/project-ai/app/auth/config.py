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
            - user_secret: str (JWT signing secret for user tokens)
            - admin_secret: str (JWT signing secret for admin tokens)
            - algorithm: str (default: HS256)
            - access_token_expire_minutes: int (default: 30)
    
    Raises:
        ValueError: If JWT_SECRET is missing or less than 32 characters
    """
    user_secret = os.environ.get("JWT_SECRET")
    
    if not user_secret:
        raise ValueError(
            "JWT_SECRET environment variable is required. "
            "Set it to a secure random string of at least 32 characters."
        )
    
    if len(user_secret) < 32:
        raise ValueError(
            f"JWT_SECRET must be at least 32 characters long. "
            f"Current length: {len(user_secret)}"
        )
    
    # ADMIN_JWT_SECRET falls back to JWT_SECRET (matching SHC pattern)
    admin_secret = os.environ.get("ADMIN_JWT_SECRET", user_secret)
    
    if len(admin_secret) < 32:
        raise ValueError(
            f"ADMIN_JWT_SECRET must be at least 32 characters long. "
            f"Current length: {len(admin_secret)}"
        )
    
    algorithm = os.environ.get("JWT_ALGORITHM", "HS256")
    expire_minutes = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    return {
        "user_secret": user_secret,
        "admin_secret": admin_secret,
        "algorithm": algorithm,
        "access_token_expire_minutes": expire_minutes
    }
