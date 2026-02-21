from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.user import (
    UserCreate, 
    UserResponse, 
    LoginRequest, 
    TokenResponse,
    RefreshTokenRequest,
    AccessTokenResponse
)
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token, decode_token, verify_token_type
from app.models.organization import Organization
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check if org exists
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Organization does not exist")
    hashed_pw = hash_password(user.password)
    db_user = User(email=user.email, hashed_password=hashed_pw, org_id=user.org_id, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    User Login Endpoint
    
    How it works:
    1. User sends email and password
    2. Find user in database by email
    3. Verify password matches hashed password
    4. Generate JWT access token and refresh token
    5. Return tokens + user info
    
    Example:
        POST /auth/login
        Body: {"email": "user@test.com", "password": "pass123"}
        Returns: {"access_token": "...", "refresh_token": "...", "user": {...}}
    """
    
    # Step 1: Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Step 2: Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 3: Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 4: Create token payload (data to store in token)
    token_data = {
        "sub": str(user.id),        # "sub" = subject (user ID)
        "email": user.email,
        "role": user.role,
        "org_id": user.org_id
    }
    
    # Step 5: Generate tokens
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Step 6: Return response
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            org_id=user.org_id,
            created_at=user.created_at
        )
    )

@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(token_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh Access Token
    
    How it works:
    1. User sends refresh token
    2. Validate refresh token
    3. Get user ID from token
    4. Generate new access token
    5. Return new access token
    
    Example:
        POST /auth/refresh
        Body: {"refresh_token": "..."}
        Returns: {"access_token": "...", "token_type": "bearer"}
    """
    
    # Step 1: Verify it's a refresh token (not access token)
    if not verify_token_type(token_request.refresh_token, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Step 2: Decode the refresh token
    payload = decode_token(token_request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Step 3: Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Step 4: Verify user still exists
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Step 5: Create new access token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "org_id": user.org_id
    }
    new_access_token = create_access_token(token_data)
    
    # Step 6: Return new access token
    return AccessTokenResponse(
        access_token=new_access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get Current Authenticated User Profile
    
    How it works:
    1. Client sends request with Authorization header
    2. get_current_user() dependency extracts and validates JWT token
    3. Returns user information
    
    Example:
        GET /auth/me
        Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        Returns: {"id": 1, "email": "user@test.com", "role": "admin", ...}
    
    This endpoint is PROTECTED - requires valid JWT token!
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        org_id=current_user.org_id,
        created_at=current_user.created_at
    )


@router.get("/users", response_model=list[UserResponse])
def list_organization_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List All Users in Current User's Organization (Admin Only)
    
    How it works:
    1. Verify user has admin role (via get_current_admin dependency)
    2. Fetch all users from the same organization
    3. Return list of users
    
    Example:
        GET /auth/users
        Headers: Authorization: Bearer <admin_token>
        Returns: [{"id": 1, "email": "admin@test.com", ...}, {"id": 2, ...}]
    
    This endpoint is PROTECTED - requires valid JWT token with admin role!
    """
    # Get all users from the current user's organization
    users = db.query(User).filter(User.org_id == current_user.org_id).all()
    
    # Convert to response models
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            org_id=user.org_id,
            created_at=user.created_at
        )
        for user in users
    ]
