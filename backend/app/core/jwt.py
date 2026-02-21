"""
JWT token creation and validation utilities
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.core.config import settings


def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary containing user information (user_id, email, role, org_id)
    
    Returns:
        Encoded JWT token string
    
    Example:
        token = create_access_token({"sub": "1", "email": "user@test.com"})
    """
    # Copy the data to avoid modifying the original
    to_encode = data.copy()
    
    # Calculate expiration time (current time + 30 minutes)
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add expiration time to token payload
    to_encode.update({"exp": expire, "type": "access"})
    
    # Encode the token using secret key and algorithm
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token (longer expiration)
    
    Args:
        data: Dictionary containing user information
    
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    # Refresh token expires in 7 days
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload if valid, None if invalid
    
    Example:
        payload = decode_token("eyJhbGciOiJIUzI1NiIsInR...")
        # Returns: {"sub": "1", "email": "user@test.com", "exp": 1234567890}
    """
    try:
        # Decode token using secret key
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    
    except JWTError:
        # Token is invalid, expired, or tampered with
        return None


def verify_token_type(token: str, expected_type: str) -> bool:
    """
    Verify if token is of expected type (access or refresh)
    
    Args:
        token: JWT token string
        expected_type: "access" or "refresh"
    
    Returns:
        True if token type matches, False otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return False
    
    token_type = payload.get("type")
    return token_type == expected_type
