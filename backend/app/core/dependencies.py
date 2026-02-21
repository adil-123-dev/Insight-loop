"""
Authentication dependencies for protected endpoints
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import SessionLocal
from app.core.jwt import decode_token
from app.models.user import User


# Security scheme for JWT Bearer token
security = HTTPBearer()


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    
    How it works:
    1. Extract JWT token from Authorization header
    2. Decode and validate token
    3. Get user ID from token
    4. Query database for user
    5. Return user object
    
    Usage in routes:
        @router.get("/profile")
        def get_profile(current_user: User = Depends(get_current_user)):
            return {"user": current_user}
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    
    # Step 1: Get token from Authorization header
    token = credentials.credentials
    
    # Step 2: Decode token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 3: Verify it's an access token (not refresh token)
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Use access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 4: Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 5: Query database for user
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 6: Return user
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify current user is an admin
    
    Usage:
        @router.delete("/users/{user_id}")
        def delete_user(user_id: int, admin: User = Depends(get_current_admin)):
            # Only admins can access this
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if admin
    
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_current_instructor(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify current user is an instructor or admin
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if instructor or admin
    
    Raises:
        HTTPException: If user is not instructor or admin
    """
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or admin access required"
        )
    return current_user
