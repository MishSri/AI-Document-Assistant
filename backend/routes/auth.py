from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.schemas import UserLogin, TokenResponse, UserResponse
from backend.database.db import get_user_by_username, get_all_users, log_audit_event
from backend.services.auth_service import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    """Authenticates users via an indexed O(1) database lookup and returns an access token."""
    # Performance Fix: Query exactly one user record instead of dumping the database table
    user = get_user_by_username(credentials.username)
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid username or password"
        )
        
    token = create_access_token(user["id"], user["username"], user["role"])
    log_audit_event(
        user["username"], 
        "USER_LOGIN", 
        "default", 
        f"User {user['username']} logged in successfully"
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user["id"],
            username=user["username"],
            full_name=user["full_name"],
            role=user["role"],
            department=user["department"],
            created_at=user["created_at"]
        )
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieves current user identity profile context. Strictly protected."""
    # Security Fix: Removed dangerous fallback backdoor that granted admin context to unauthenticated requests
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing or invalid."
        )
        
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        department=current_user["department"],
        created_at=current_user["created_at"]
    )

@router.get("/users", response_model=list[UserResponse])
def list_users(current_user: dict = Depends(get_current_user)):
    """Retrieves system identities list. Restricted to authorized internal users only."""
    # Security Fix: Protected route behind the authorization token dependency
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
        
    users = get_all_users()
    return [
        UserResponse(
            id=u["id"],
            username=u["username"],
            full_name=u["full_name"],
            role=u["role"],
            department=u["department"],
            created_at=u.get("created_at")
        ) for u in users
    ]
